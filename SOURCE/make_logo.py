"""Trim the supplied L&T Construction banner to its artwork and write the
header/landing logo used by the quiz (white background, no black frame)."""
import sys
from PIL import Image

SRC = sys.argv[1]
OUT = sys.argv[2]

im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.load()


def row_is_dark(y):
    dark = sum(1 for x in range(0, w, 4) if sum(px[x, y]) < 180)
    return dark > (w // 4) * 0.8


def col_is_dark(x):
    dark = sum(1 for y in range(0, h, 4) if sum(px[x, y]) < 180)
    return dark > (h // 4) * 0.8


# strip the solid black frame
top = 0
while top < h and row_is_dark(top):
    top += 1
bot = h - 1
while bot > top and row_is_dark(bot):
    bot -= 1
left = 0
while left < w and col_is_dark(left):
    left += 1
right = w - 1
while right > left and col_is_dark(right):
    right -= 1
im = im.crop((left, top, right + 1, bot + 1))

# crop the white margin down to the blue artwork, then re-pad evenly
bbox = im.convert("L").point(lambda v: 0 if v > 235 else 255).getbbox()
if bbox:
    im = im.crop(bbox)

pad = max(8, im.height // 10)
canvas = Image.new("RGB", (im.width + pad * 2, im.height + pad * 2), "white")
canvas.paste(im, (pad, pad))

# cap the height so the file stays small; width follows the aspect ratio
target_h = 160
if canvas.height > target_h:
    canvas = canvas.resize(
        (round(canvas.width * target_h / canvas.height), target_h), Image.LANCZOS
    )

canvas.save(OUT, "PNG", optimize=True)
print(OUT, canvas.size)
