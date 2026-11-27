#!/usr/bin/env python3
"""Import pinned OFL fonts once; validate Macedonian coverage and package WOFF2."""
import hashlib
import io
import json
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from fontTools.ttLib import TTFont

PIN = "5026800714d07231937d92eb4cceabf06e05d74e"
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "src/public/assets/fonts/rombm"
FONTS = (
    ("exo2", "Exo2[wght].ttf", "exo-2", "9cb20188a07687580312d2099e6c79ca8ecb7b58", "5bec9840d2e0df42d80d6fac55279d1d5e5b9199", 100, 900),
    ("manrope", "Manrope[wght].ttf", "manrope", "75274da58537d6123b14f2cd0c355ad4681fc2b3", "e271172a9ed0cddc895aabb6509f1c7d880b492d", 200, 800),
)
REQUIRED = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџшABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
def fetch(folder, name, expected):
    url = f"https://raw.githubusercontent.com/google/fonts/{PIN}/ofl/{folder}/{urllib.parse.quote(name)}"
    with urllib.request.urlopen(url, timeout=45) as response:
        data = response.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise ValueError("Oversized font source")
    blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    if blob != expected:
        raise ValueError(f"Source git blob mismatch: {name}")
    return data
def verify_font(font, low, high):
    missing = sorted(set(REQUIRED) - {chr(c) for c in font.getBestCmap()})
    if missing:
        raise ValueError("Missing glyphs: " + "".join(missing))
    axes = {axis.axisTag: axis for axis in font["fvar"].axes}
    if "wght" not in axes or axes["wght"].minValue != low or axes["wght"].maxValue != high:
        raise ValueError("Unexpected weight axis")
def main():
    manifest = {"sourceCommit": PIN, "files": {}}
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for folder, filename, stem, font_sha, license_sha, low, high in FONTS:
            raw = fetch(folder, filename, font_sha)
            license_data = fetch(folder, "OFL.txt", license_sha)
            if b"SIL OPEN FONT LICENSE" not in license_data:
                raise ValueError("Missing OFL notice")
            font = TTFont(io.BytesIO(raw), recalcTimestamp=False)
            verify_font(font, low, high)
            target = work / f"{stem}.woff2"
            font.flavor = "woff2"
            font.save(target)
            font.close()
            with TTFont(target) as result:
                verify_font(result, low, high)
                features = {f.FeatureTag for f in result["GSUB"].table.FeatureList.FeatureRecord} if "GSUB" in result else set()
                print(f"{stem}: Macedonian/Latin glyphs PASS; weights {low}–{high}; tnum feature: {'tnum' in features}")
            if target.stat().st_size > 350 * 1024 or target.read_bytes()[:4] != b"wOF2":
                raise ValueError("Invalid WOFF2 or exceeds budget")
            (work / f"{stem}-OFL.txt").write_bytes(license_data)
        for file in sorted(work.iterdir()):
            data = file.read_bytes()
            manifest["files"][file.name] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
            print(file.name, len(data), manifest["files"][file.name]["sha256"])
        (work / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        DEST.mkdir(parents=True, exist_ok=True)
        if DEST.resolve() != DEST.absolute() or any((DEST / file.name).is_symlink() for file in work.iterdir()):
            raise ValueError("Symlink destination refused")
        for file in work.iterdir():
            (DEST / file.name).write_bytes(file.read_bytes())
    print("ROMBMASTER_FONTS_IMPORT: PASS")
if __name__ == "__main__":
    main()
