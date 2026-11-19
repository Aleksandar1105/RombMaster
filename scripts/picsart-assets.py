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

from PIL import Image, ImageOps, ImageDraw

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
            or not (re.fullmatch(r"/pipeline-output/[a-zA-Z0-9-]+\.(png|jpe?g|webp)", u.path)
                    or re.fullmatch(r"/editing-temp/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.(png|jpe?g|webp)", u.path))
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

# Reviewed silhouettes in the imported 1024 x 575 reference coordinate system.
# These sources contain actual opaque checker pixels, not an alpha channel.
# Deliberately inset the contours slightly; avoid color-keying silver or white artwork.
BUTTON_CONTOURS = {
    "neon": [(77,180),(947,180),(994,224),(996,266),(1011,293),(996,322),(996,358),(948,396),(78,396),(28,360),(28,325),(12,292),(28,261),(28,225)],
    "royal": [(80,174),(945,174),(1008,242),(1008,330),(945,398),(80,398),(15,330),(15,242)],
    "cyber": [(77,176),(409,176),(426,174),(598,174),(615,176),(946,176),(1006,237),(1006,337),(947,399),(76,399),(17,337),(17,237)],
    "ice": [(64,175),(959,175),(1004,225),(1004,345),(958,397),(65,397),(18,345),(18,225)],
    "wood": [(83,180),(940,180),(969,191),(990,219),(1005,278),(1009,289),(1004,315),(989,352),(966,382),(942,395),(83,395),(50,383),(26,351),(14,309),(12,285),(25,245),(49,201)],
    "white": [(82,172),(943,172),(1009,238),(1009,331),(943,398),(81,398),(15,331),(15,239)],
    "frozen-christmas": [(77,168),(489,168),(512,159),(535,168),(951,168),(992,209),(1008,282),(993,357),(948,404),(533,404),(512,411),(490,404),(78,404),(32,356),(13,283),(30,211)],
    "golden-dragon": [(79,179),(943,179),(978,194),(1009,234),(1010,328),(980,365),(943,390),(77,390),(34,367),(14,329),(14,236),(35,204)],
    "spring-blossom": [(75,191),(948,191),(964,207),(969,218),(995,235),(1008,259),(1011,292),(1006,330),(988,353),(968,367),(952,398),(72,398),(53,371),(29,354),(14,329),(9,297),(15,260),(33,235),(55,218)],
    "summer-paradise": [(82,184),(943,184),(967,194),(993,223),(1010,270),(1014,285),(1006,321),(986,363),(947,390),(79,390),(40,370),(17,338),(9,289),(17,246),(39,207)],
    "autumn-kingdom": [(84,192),(946,192),(989,217),(1013,253),(1015,309),(989,350),(947,380),(81,380),(39,353),(9,310),(9,259),(39,218)],
    "halloween-curse": [(79,168),(476,168),(497,158),(512,149),(527,158),(548,168),(951,168),(1004,225),(1004,260),(1012,284),(1004,309),(1004,351),(949,403),(546,403),(528,410),(512,416),(495,410),(477,403),(78,403),(21,352),(21,310),(12,285),(21,260),(21,226)],
    "midnight-gold": [(81,171),(943,171),(976,192),(992,225),(992,265),(1009,294),(993,316),(993,360),(976,394),(945,415),(82,415),(48,395),(31,360),(31,318),(13,294),(31,268),(31,226),(50,192)],
    "obsidian-neon": [(99,174),(925,174),(962,191),(985,222),(989,256),(1006,289),(991,316),(986,350),(961,381),(927,407),(98,407),(63,382),(39,350),(33,315),(17,290),(33,256),(39,223),(62,192)],
    "celestial-void": [(114,179),(485,179),(512,169),(537,179),(914,179),(951,190),(985,223),(1007,277),(1007,289),(986,340),(951,374),(914,388),(537,388),(512,399),(487,388),(111,388),(76,374),(39,340),(16,288),(16,277),(39,225),(77,190)],
    "synthwave-sunset": [(77,189),(480,189),(512,195),(543,189),(947,189),(984,209),(1008,240),(1009,340),(984,374),(948,399),(543,399),(512,393),(481,399),(76,399),(39,374),(15,342),(15,243),(39,210)],
}

def clean_button(source, out, skin):
    with Image.open(source) as im:
        im.load()
        if im.format != "WEBP" or not 1.74 <= im.width / im.height <= 1.82:
            raise ValueError("Unexpected button source format or ratio")
        im = im.convert("RGBA")
        w, h = im.size
        contour = [(round(x*w/1024*3), round(y*h/575*3)) for x,y in BUTTON_CONTOURS[skin]]
        mask = Image.new("L", (w*3,h*3),0)
        ImageDraw.Draw(mask).polygon(contour,fill=255)
        mask = mask.resize((w,h),Image.Resampling.LANCZOS)
        # Never allow the image to extend into the original outer checkerboard.
        im.putalpha(mask)
        bbox = mask.getbbox()
        if not bbox or bbox[2]-bbox[0] < w*.90 or bbox[3]-bbox[1] > h*.55:
            raise ValueError("Unexpected button crop")
        im=im.crop(bbox)
        im.save(out,"WEBP",quality=92,method=6,exact=True)
    with Image.open(out) as check:
        check.load()
        if check.mode!="RGBA" or not 3.3 <= check.width/check.height <= 6.0:
            raise ValueError("Expected wide alpha button")
        alpha=check.getchannel("A")
        if alpha.getextrema()!=(0,255) or alpha.getpixel((0,0))!=0 or alpha.getpixel((check.width//2,check.height//2))!=255:
            raise ValueError("Invalid button alpha mask")
        return check.size

def self_test():
    with tempfile.TemporaryDirectory() as tmp:
        buf = io.BytesIO()
        Image.new("RGB", (640, 320), "#071729").save(buf, "PNG")
        p = Path(tmp) / "test.webp"
        assert convert(buf.getvalue(), p, 320) == (320, 160)
        # Exercise every contour against a synthetic source: verifies format, alpha and bounds.
        synthetic=Path(tmp)/"synthetic-button.webp"
        Image.new("RGB",(1024,575),"#aaaaaa").save(synthetic,"WEBP")
        for skin in BUTTON_CONTOURS:
            clean_button(synthetic,Path(tmp)/(skin+".webp"),skin)
        print("BUTTON MASK SELF TEST: PASS")
        # Seedream can return a direct image under editing-temp rather than
        # pipeline-output. Accept only UUID image paths on the same exact host.
        direct = "https://gcdn.picsart.com/editing-temp/12345678-1234-1234-1234-123456789abc.jpeg"
        for url in [direct, "https://gcdn.picsart.com/pipeline-output/a.png"]:
            assert validate({"name": "test.webp", "url": url, "max_side": 320}) == ("test.webp", url, 320)
        for url in ["http://gcdn.picsart.com/pipeline-output/a.png", "https://evil.test/a.png",
                    "https://gcdn.picsart.com@evil.test/pipeline-output/a.png",
                    direct.replace("https:", "http:"),
                    direct.replace("gcdn.picsart.com", "evil.test"),
                    direct.replace("gcdn.picsart.com", "gcdn.picsart.com.evil.test"),
                    direct.replace("gcdn.picsart.com", "gcdn.picsart.com:443"),
                    direct.replace(".jpeg", ".html"), direct + "?x=1", direct + "#x",
                    "https://gcdn.picsart.com/editing-temp/../pipeline-output/a.png",
                    "https://gcdn.picsart.com/editing-temp/not-a-uuid.jpeg"]:
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
            if name.endswith("-master-button.webp"):
                skin=name.removesuffix("-master-button.webp")
                if skin not in BUTTON_CONTOURS:
                    raise ValueError("Unreviewed button contour")
                source=DEST/name
                if not source.is_file() or source.is_symlink():
                    raise ValueError("Imported button source missing; do not regenerate")
                data=source.read_bytes()
                name=skin+"-master-button-clean.webp"
                output=work/name
                size=clean_button(source,output,skin)
            else:
                data = download(url)
                output = work / name
                size = convert(data, output, maximum)
            print(f"{name}: {len(data)} -> {output.stat().st_size} bytes, {size[0]}x{size[1]}, sha256={hashlib.sha256(output.read_bytes()).hexdigest()}")
        # Publish only when every source passed validation and conversion.
        for output in work.iterdir():
            (DEST / output.name).write_bytes(output.read_bytes())
    print("ASSET CONVERSION: PASS")

if __name__ == "__main__":
    self_test()
    if "--self-test" not in sys.argv:
        main()
