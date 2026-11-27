#!/usr/bin/env python3
"""P4.10d.1: split the approved, hash-pinned RGBA sheet. No generation."""
import hashlib
import io
import sys
import tempfile
from pathlib import Path
from PIL import Image
import urllib.request
SOURCE = "https://gcdn.picsart.com/picsart-mcp/c274cd5a-8ff0-4a58-8951-da33b3d7289b.png"
SHA = "ca8d6a62e1dcb2d65ce644526a655741648f57671a0e45588dd9d288b4804831"
DEST = Path(__file__).resolve().parents[1] / "src/public/assets/premium/master"
LIMIT = 5 * 1024 * 1024
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError("Redirect refused")
def download():
    with urllib.request.build_opener(NoRedirect()).open(SOURCE, timeout=45) as response:
        data = response.read(LIMIT + 1)
    return data
def convert(data, dest):
    if len(data) > LIMIT or hashlib.sha256(data).hexdigest() != SHA:
        raise ValueError("P4.10d.1 source SHA256 mismatch")
    with Image.open(io.BytesIO(data)) as im:
        im.load()
        if im.format != "PNG" or im.mode != "RGBA" or im.size != (2172,724):
            raise ValueError("Expected original RGBA sheet")
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            for name, left, right in [("victory",0,760),("draw",760,1440),("defeat",1440,2172)]:
                part = im.crop((left,0,right,724))
                bbox = part.getchannel("A").point(lambda v: 255 if v > 1 else 0).getbbox()
                if not bbox:
                    raise ValueError("Empty emblem")
                part = part.crop(bbox)
                part.thumbnail((600,600), Image.Resampling.LANCZOS)
                canvas = Image.new("RGBA",(640,640))
                canvas.alpha_composite(part,((640-part.width)//2,(640-part.height)//2))
                path = work / ("neon-3d-"+name+"-emblem.webp")
                canvas.save(path,"WEBP",quality=88,method=6,alpha_quality=100)
                with Image.open(path) as check:
                    check.load()
                    if check.format != "WEBP" or check.size != (640,640) or check.mode != "RGBA":
                        raise ValueError("Invalid emblem format")
                    alpha=check.getchannel("A")
                    if alpha.getextrema() != (0,255) or any(alpha.getpixel(p) for p in [(0,0),(639,0),(0,639),(639,639)]):
                        raise ValueError("Invalid emblem alpha")
                if path.stat().st_size > 256*1024:
                    raise ValueError("Emblem exceeds budget")
                print(f"{path.name}: 640x640 RGBA, {path.stat().st_size} bytes, sha256={hashlib.sha256(path.read_bytes()).hexdigest()}")
            dest.mkdir(parents=True,exist_ok=True)
            if dest.resolve() != dest.absolute():
                raise ValueError("Symlink destination refused")
            for path in work.iterdir():
                target=dest/path.name
                if target.is_symlink():
                    raise ValueError("Symlink target refused")
            for path in work.iterdir():
                (dest/path.name).write_bytes(path.read_bytes())
    print("ASSET CONVERSION: PASS")
if __name__ == "__main__":
    convert(download(),DEST)

