#!/usr/bin/env python3
"""Fetch only explicitly queued Picsart images; generate bounded local WebP assets."""
import hashlib
import io
import json
import re
import sys
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "src/public/assets/premium/master"
QUEUE = ROOT / "scripts/picsart-assets.json"
LIMIT = 25 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 24_000_000

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Redirect refused")

def validate(item):
    if set(item) != {"name", "url", "max_side"}:
        raise ValueError("Unexpected manifest fields")
    name, url, maximum = item["name"], item["url"], item["max_side"]
    if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,80}\.webp", name):
        raise ValueError("Invalid asset filename")
    u = urlsplit(url)
    if (u.scheme != "https" or u.netloc != "gcdn.picsart.com"
            or not re.fullmatch(r"/pipeline-output/[a-zA-Z0-9-]+\.(png|jpe?g|webp)", u.path)
            or u.query or u.fragment):
        raise ValueError("Only direct Picsart image URLs are allowed")
    if type(maximum) is not int or not 320 <= maximum <= 2048:
        raise ValueError("Invalid max_side")
    return name, url, maximum

def download(url):
    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(url, headers={"User-Agent": "RombMaster-AssetPipeline/1.0"})
    with opener.open(req, timeout=45) as res:
        if res.headers.get_content_type() not in {"image/png", "image/jpeg", "image/webp", "application/octet-stream"}:
            raise ValueError("Unexpected response content type")
        data = res.read(LIMIT + 1)
    if not data or len(data) > LIMIT:
        raise ValueError("Source size outside limit")
    return data

def convert(data, out, maximum):
    with Image.open(io.BytesIO(data)) as im:
        if im.format not in {"PNG", "JPEG", "WEBP"} or getattr(im, "n_frames", 1) != 1:
            raise ValueError("Unsupported source image")
        if im.width * im.height > 24_000_000 or min(im.size) < 300:
            raise ValueError("Invalid source dimensions")
        im.load()
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGBA" if "A" in im.getbands() or "transparency" in im.info else "RGB")
        im.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
        im.save(out, "WEBP", quality=88, method=6)
        expected = im.size
    with Image.open(out) as check:
        check.load()
        if check.format != "WEBP" or check.size != expected:
            raise ValueError("Encoded WebP verification failed")
    return expected

def self_test():
    with tempfile.TemporaryDirectory() as tmp:
        buf = io.BytesIO()
        Image.new("RGB", (640, 320), "#071729").save(buf, "PNG")
        p = Path(tmp) / "test.webp"
        assert convert(buf.getvalue(), p, 320) == (320, 160)
        for url in ["http://gcdn.picsart.com/pipeline-output/a.png", "https://evil.test/a.png",
                    "https://gcdn.picsart.com@evil.test/pipeline-output/a.png"]:
            try:
                validate({"name": "test.webp", "url": url, "max_side": 320})
            except ValueError:
                continue
            raise AssertionError("Unsafe URL accepted")
        try:
            validate({"name": "../test.webp", "url": "https://gcdn.picsart.com/pipeline-output/a.png", "max_side": 320})
        except ValueError:
            pass
        else:
            raise AssertionError("Unsafe filename accepted")
    print("ASSET SELF TEST: PASS")

def main():
    items = json.loads(QUEUE.read_text())
    if not isinstance(items, list) or not 1 <= len(items) <= 24:
        raise ValueError("Queue must contain 1–24 assets")
    entries = [validate(item) for item in items]
    if len({x[0] for x in entries}) != len(entries):
        raise ValueError("Duplicate output filename")
    DEST.mkdir(parents=True, exist_ok=True)
    if DEST.resolve() != DEST:
        raise ValueError("Asset directory must not be a symlink")
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for name, url, maximum in entries:
            data = download(url)
            output = work / name
            size = convert(data, output, maximum)
            print(f"{name}: {len(data)} -> {output.stat().st_size} bytes, {size[0]}x{size[1]}, sha256={hashlib.sha256(output.read_bytes()).hexdigest()}")
        # Publish only when every source passed validation and conversion.
        for name, _, _ in entries:
            (DEST / name).write_bytes((work / name).read_bytes())
    print("ASSET CONVERSION: PASS")

if __name__ == "__main__":
    self_test()
    if "--self-test" not in sys.argv:
        main()
