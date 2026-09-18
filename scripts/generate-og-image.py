# Generates public/og-image.png (1200x630) — the default Open Graph / Twitter
# Card image referenced in src/layouts/Base.astro.
# Re-run after any branding change:
#   python_full/python.exe scripts/generate-og-image.py

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (10, 14, 20, 255)        # matches the site's dark theme
ACCENT = (245, 158, 11, 255)  # --accent #f59e0b
TEXT = (245, 245, 245, 255)
MUTED = (148, 163, 184, 255)
GRID = (245, 158, 11, 14)     # faint "wire mesh" grid lines

FONT_DIR = "C:/Windows/Fonts/"
def font(name, size):
    return ImageFont.truetype(FONT_DIR + name, size)

img = Image.new("RGBA", (W, H), BG)
d = ImageDraw.Draw(img)

# subtle mesh grid
for x in range(0, W, 40):
    d.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 40):
    d.line([(0, y), (W, y)], fill=GRID, width=1)

# left accent bar
d.rectangle([0, 0, 16, H], fill=ACCENT)

# wordmark: "Mesh" white + "Calculator" amber
title = ImageFont.truetype(FONT_DIR + "segoeuib.ttf", 108)
d.text((90, 210), "Mesh", font=title, fill=TEXT)
w_mesh = d.textlength("Mesh", font=title)
d.text((90 + w_mesh, 210), "Calculator", font=title, fill=ACCENT)

# tagline
sub = font("segoeui.ttf", 40)
d.text((94, 360), "Free Wire Mesh Calculators", font=sub, fill=MUTED)
d.text((94, 420), "Direct Sourcing from Anping Factories", font=sub, fill=MUTED)

# small footer line
foot = font("segoeui.ttf", 28)
d.text((94, 540), "meshcalculator.com", font=foot, fill=(100, 116, 139, 255))

img.convert("RGB").save("public/og-image.png", optimize=True)
print("public/og-image.png written", img.size)
