"""Import the approved Picsart inventory. Run at repo root with Python + Pillow.
No installs, git writes, game-code edits, credit use or CI dispatch.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
from urllib.parse import urlsplit
from urllib.request import urlopen, Request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design" / "premium-visuals"
ARCHIVE = DESIGN / "originals"
RUNTIME = ROOT / "src" / "public" / "assets" / "premium"
BRANCH = "feat/premium-visual-overhaul"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def sha256(path):
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def validated_png(path, expected_bytes, final_group=None):
    if path.stat().st_size != expected_bytes:
        raise ValueError(f"{path.name}: byte count mismatch")
    with path.open("rb") as f:
        if f.read(8) != PNG_SIGNATURE:
            raise ValueError(f"{path.name}: not PNG")
    with Image.open(path) as im:
        if im.format != "PNG":
            raise ValueError(f"{path.name}: wrong format")
        im.verify()
    with Image.open(path) as im:
        im.load()
        dimensions = im.size
    if final_group:
        expected = (2048, 2048) if final_group == "rivals" else (1440, 2560)
        if dimensions != expected:
            raise ValueError(f"{path.name}: {dimensions} != {expected}")
    return dimensions


def download(url, target, size):
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.netloc != "gcdn.picsart.com" or not parts.path.startswith("/pipeline-output/"):
        raise ValueError("Unapproved asset URL")
    with urlopen(Request(url, headers={"User-Agent": "RombMaster-AssetImport/1.0", "Accept-Encoding": "identity"}), timeout=60) as response:
        if urlsplit(response.geturl()).netloc != "gcdn.picsart.com" or urlsplit(response.geturl()).scheme != "https":
            raise ValueError("Unexpected download redirect")
        with target.open("wb") as out:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > size:
                    raise ValueError("Download exceeded expected size")
                out.write(chunk)


def verify_branch():
    branch = subprocess.check_output(["git", "-C", str(ROOT), "branch", "--show-current"], text=True).strip()
    if branch != BRANCH:
        raise ValueError(f"Expected {BRANCH}, got {branch}")


def run(local_source=None):
    verify_branch()
    manifest = json.loads((DESIGN / "asset-manifest.json").read_text(encoding="utf-8"))
    assets = manifest["assets"]
    if manifest["project"] != "RombMaster" or len(assets) != 21:
        raise ValueError("Unexpected inventory")
    expected = {"final/rivals": 6, "final/arenas": 6, "final/home": 1,
                "concepts/rivals": 1, "concepts/arenas": 6, "concepts/home": 1}
    counts = {key: 0 for key in expected}
    seen = set()
    for item in assets:
        path = item["path"]
        if not re.fullmatch(r"(final|concepts)/(rivals|arenas|home)/[a-z0-9-]+\.png", path) or path in seen:
            raise ValueError("Invalid or duplicate path")
        seen.add(path)
        counts[str(PurePosixPath(path).parent)] += 1
        if not isinstance(item["bytes"], int) or not 8 <= item["bytes"] <= 30_000_000:
            raise ValueError("Invalid byte count")
    if counts != expected:
        raise ValueError(f"Inventory counts mismatch: {counts}")

    records, outputs = [], []
    with tempfile.TemporaryDirectory(prefix="rombmaster-assets-") as tmp:
        scratch = Path(tmp)
        for item in assets:
            rel = PurePosixPath(item["path"])
            source = ARCHIVE.joinpath(*rel.parts)
            staged = scratch / "originals" / Path(*rel.parts)
            staged.parent.mkdir(parents=True, exist_ok=True)
            if source.exists():
                shutil.copyfile(source, staged)
            elif local_source is not None:
                candidates = [local_source.joinpath(*rel.parts), local_source / rel.name]
                match = next((p for p in candidates if p.is_file()), None)
                if match is None:
                    raise FileNotFoundError(f"Missing local asset: {rel}")
                shutil.copyfile(match, staged)
            else:
                download(item["sourceUrl"], staged, item["bytes"])
            group = rel.parts[1] if rel.parts[0] == "final" else None
            width, height = validated_png(staged, item["bytes"], group)
            entry = {"original": source.relative_to(ROOT).as_posix(),
                     "bytes": staged.stat().st_size, "sha256": sha256(staged),
                     "width": width, "height": height}
            outputs.append((staged, source))
            if group in ("rivals", "arenas"):
                name = re.sub(r"-2k(?:-final)?-v01$", "", rel.stem) + ".webp"
                destination = RUNTIME / group / name
                optimized = scratch / "runtime" / group / name
                optimized.parent.mkdir(parents=True, exist_ok=True)
                with Image.open(staged) as im:
                    im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
                    im.thumbnail((768, 768) if group == "rivals" else (1080, 1920), Image.Resampling.LANCZOS)
                    im.save(optimized, "WEBP", quality=84 if group == "rivals" else 80, method=6)
                with Image.open(optimized) as im:
                    im.load()
                    if im.format != "WEBP" or im.size != ((768,768) if group == "rivals" else (1080,1920)):
                        raise ValueError(f"Invalid WebP: {name}")
                    webp_size = im.size
                if optimized.stat().st_size >= staged.stat().st_size:
                    raise ValueError(f"WebP did not reduce size: {name}")
                entry["runtime"] = {"path": destination.relative_to(ROOT).as_posix(),
                                    "bytes": optimized.stat().st_size, "sha256": sha256(optimized),
                                    "width": webp_size[0], "height": webp_size[1]}
                outputs.append((optimized, destination))
            records.append(entry)
            print(f"VERIFIED {rel}", flush=True)

        if sum("runtime" in row for row in records) != 12:
            raise ValueError("Runtime inventory mismatch")
        report = {"status": "verified_import", "source_manifest_sha256": sha256(DESIGN / "asset-manifest.json"),
                  "original_count": 21, "runtime_count": 12, "assets": records}
        report_path = scratch / "import-report.json"
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        outputs.append((report_path, DESIGN / "import-report.json"))
        # Full preflight before modifying the repository. Never overwrite differences.
        if len({target for _, target in outputs}) != len(outputs):
            raise ValueError("Duplicate output")
        for staged, target in outputs:
            if not target.resolve().is_relative_to(ROOT):
                raise ValueError("Output escapes repository")
            if target.exists() and (not target.is_file() or sha256(staged) != sha256(target)):
                raise ValueError(f"Existing file differs; refusing overwrite: {target}")
        for staged, target in outputs:
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                with target.open("xb") as dest, staged.open("rb") as src:
                    shutil.copyfileobj(src, dest)
            if sha256(target) != sha256(staged):
                raise ValueError(f"Copy verification failed: {target}")
    print("ROMBMASTER_ASSET_IMPORT: PASS")
    print(f"ORIGINALS: {len(records)}; WEBP: 12")
    print("ORIGINAL_BYTES:", sum(r["bytes"] for r in records))
    print("WEBP_BYTES:", sum(r["runtime"]["bytes"] for r in records if "runtime" in r))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--local-source", type=Path, help="Use manually downloaded PNGs instead of HTTPS.")
    args = parser.parse_args()
    try:
        run(args.local_source)
    except Exception as exc:
        parser.exit(1, f"ROMBMASTER_ASSET_IMPORT: FAIL: {exc}\n")
