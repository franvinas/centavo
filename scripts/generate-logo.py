import math

# === Configuration ===
CANVAS = 1024
BG_COLOR = "#F2EFDC"
LG = "#BFCEA4"  # light green (outer ring)
DG = "#487D48"  # dark green (inner ring, top)
O  = "#D36D48"  # orange (inner ring, bottom)

# Hex grid parameters
S = 76          # grid spacing size (center-to-center spacing factor)
R = 69          # actual hex vertex radius (smaller than S for gaps)
CX, CY = 545, 512  # canvas center (offset to account for asymmetric hex layout)

# === Hex positions in axial (q, r) with colors ===
# Outer ring (distance 3) - all light green
# Inner ring (distance 2) - dark green (top) / orange (bottom)
hexagons = [
    # Row r=-3 (outer)
    (1, -3, LG), (2, -3, LG),
    # Row r=-2
    (-1, -2, LG), (0, -2, DG), (1, -2, DG), (2, -2, DG), (3, -2, LG),
    # Row r=-1
    (-2, -1, LG), (-1, -1, DG), (2, -1, O),
    # Row r=0
    (-3, 0, LG), (-2, 0, DG),
    # Row r=1
    (-3, 1, LG), (-2, 1, O), (1, 1, O), (2, 1, LG),
    # Row r=2
    (-3, 2, LG), (-2, 2, O), (-1, 2, O), (0, 2, O), (1, 2, LG),
    # Row r=3 (outer)
    (-2, 3, LG), (-1, 3, LG),
]


def axial_to_pixel(q, r):
    """Convert axial hex coordinates to pixel coordinates (pointy-top)."""
    x = CX + S * (math.sqrt(3) * q + math.sqrt(3) / 2 * r)
    y = CY + S * (3.0 / 2 * r)
    return x, y


def hex_path(cx, cy, r):
    """Generate SVG path for a regular pointy-top hexagon."""
    points = []
    for i in range(6):
        angle = math.radians(-90 + 60 * i)
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        points.append((x, y))
    d = f"M{points[0][0]:.3f} {points[0][1]:.3f}"
    for p in points[1:]:
        d += f"L{p[0]:.3f} {p[1]:.3f}"
    d += "Z"
    return d


def generate_svg(transparent=False):
    parts = [
        '<?xml version="1.0" encoding="utf-8" ?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS}" height="{CANVAS}" viewBox="0 0 {CANVAS} {CANVAS}">',
    ]
    if not transparent:
        parts.append(f'<rect width="{CANVAS}" height="{CANVAS}" fill="{BG_COLOR}"/>')

    for q, r, color in hexagons:
        px, py = axial_to_pixel(q, r)
        d = hex_path(px, py, R)
        parts.append(f'<path fill="{color}" d="{d}"/>')

    parts.append('</svg>')
    return '\n'.join(parts)


if __name__ == "__main__":
    import pathlib
    import shutil
    import subprocess
    import sys

    root = pathlib.Path(__file__).resolve().parent.parent
    icons_dir = root / "public" / "icons"
    app_dir = root / "src" / "app"
    logo_svg = icons_dir / "centavo-logo.svg"

    # 1. Generate source SVGs
    svg = generate_svg()
    logo_svg.write_text(svg)
    print(f"Generated {logo_svg.relative_to(root)}")

    logo_transparent = icons_dir / "centavo-logo-transparent.svg"
    svg_transparent = generate_svg(transparent=True)
    logo_transparent.write_text(svg_transparent)
    print(f"Generated {logo_transparent.relative_to(root)}")

    # 2. Write sized SVG variants (same paths, different width/height)
    for size in (192, 512):
        out = icons_dir / f"icon-{size}.svg"
        sized = svg.replace(
            f'width="{CANVAS}" height="{CANVAS}"',
            f'width="{size}" height="{size}"',
            1,  # only replace in the <svg> tag, not the <rect>
        )
        out.write_text(sized)
        print(f"Generated {out.relative_to(root)}")

    # 3. Rasterize PNGs, favicon, and apple-touch-icon via ImageMagick
    magick = shutil.which("magick") or shutil.which("convert")
    if not magick:
        print("ImageMagick not found — skipping PNG/ICO generation.", file=sys.stderr)
        sys.exit(1)

    raster_targets = [
        (icons_dir / "icon-192.png", ["-resize", "192x192"]),
        (icons_dir / "icon-512.png", ["-resize", "512x512"]),
        (app_dir / "apple-icon.png", ["-resize", "180x180"]),
        (app_dir / "favicon.ico", ["-resize", "48x48", "-define", "icon:auto-resize=48,32,16"]),
    ]

    for dest, args in raster_targets:
        cmd = [magick, "-background", "none", str(logo_svg), *args, str(dest)]
        subprocess.run(cmd, check=True)
        print(f"Generated {dest.relative_to(root)}")

    # 4. Generate base64-encoded 48px PNG for email templates
    import base64

    result = subprocess.run(
        [magick, "-background", "none", str(logo_svg), "-resize", "48x48", "png:-"],
        capture_output=True,
        check=True,
    )
    b64 = base64.b64encode(result.stdout).decode()
    email_const = icons_dir / "email-logo-base64.txt"
    email_const.write_text(b64)
    print(f"Generated {email_const.relative_to(root)}")
