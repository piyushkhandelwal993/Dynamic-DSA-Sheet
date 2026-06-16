from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image


ICONSET_SIZES = [
    16,
    32,
    128,
    256,
    512,
]


def save_square_png(image: Image.Image, output_path: Path, size: int) -> None:
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(output_path, format="PNG")


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 desktop/generate-icons.py /absolute/path/to/source.png")
        return 1

    source_path = Path(sys.argv[1]).expanduser().resolve()
    if not source_path.exists():
        print(f"Source icon not found: {source_path}")
        return 1

    project_root = Path(__file__).resolve().parent.parent
    build_dir = project_root / "build"
    iconset_dir = build_dir / "icon.iconset"
    build_dir.mkdir(exist_ok=True)

    if iconset_dir.exists():
        shutil.rmtree(iconset_dir)
    iconset_dir.mkdir()

    image = Image.open(source_path).convert("RGBA")
    side = min(image.width, image.height)
    left = (image.width - side) // 2
    top = (image.height - side) // 2
    image = image.crop((left, top, left + side, top + side))

    source_copy = build_dir / "source-icon.png"
    image.save(source_copy, format="PNG")

    save_square_png(image, build_dir / "icon.png", 1024)
    image.save(
        build_dir / "icon.icns",
        format="ICNS",
        sizes=[(16, 16), (32, 32), (64, 64), (128, 128), (256, 256), (512, 512), (1024, 1024)],
    )

    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    image.save(build_dir / "icon.ico", format="ICO", sizes=ico_sizes)

    for size in ICONSET_SIZES:
        save_square_png(image, iconset_dir / f"icon_{size}x{size}.png", size)
        save_square_png(image, iconset_dir / f"icon_{size}x{size}@2x.png", size * 2)

    print(f"Generated icon assets in {build_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
