"""
Generates sample leaf images for quick 1-click testing in the web UI.
"""
import os
from PIL import Image, ImageDraw, ImageFilter
import random

os.makedirs("server/static/samples", exist_ok=True)

def create_healthy_sample():
    img = Image.new("RGB", (320, 320), color=(240, 245, 240))
    draw = ImageDraw.Draw(img)
    # Leaf body
    draw.polygon([(160, 30), (250, 100), (280, 190), (220, 270), (160, 290), (100, 270), (40, 190), (70, 100)], fill=(34, 139, 34))
    # Veins
    draw.line([(160, 30), (160, 290)], fill=(60, 179, 113), width=4)
    for y in range(80, 250, 30):
        draw.line([(160, y), (160 + (y % 50) + 40, y - 20)], fill=(60, 179, 113), width=2)
        draw.line([(160, y), (160 - (y % 50) - 40, y - 20)], fill=(60, 179, 113), width=2)
    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save("server/static/samples/sample_healthy.jpg", "JPEG")

def create_early_blight_sample():
    img = Image.new("RGB", (320, 320), color=(240, 245, 240))
    draw = ImageDraw.Draw(img)
    # Leaf body with yellowish tint
    draw.polygon([(160, 30), (250, 100), (280, 190), (220, 270), (160, 290), (100, 270), (40, 190), (70, 100)], fill=(85, 107, 47))
    # Early blight target spots
    spots = [(140, 110, 35), (200, 180, 45), (110, 210, 30), (210, 120, 25)]
    for sx, sy, r in spots:
        # Yellow halo
        draw.ellipse([sx - r - 8, sy - r - 8, sx + r + 8, sy + r + 8], fill=(180, 160, 40))
        # Brown concentric rings
        draw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(101, 67, 33))
        draw.ellipse([sx - r + 8, sy - r + 8, sx + r - 8, sy + r - 8], fill=(60, 40, 20))
        draw.ellipse([sx - r + 16, sy - r + 16, sx + r - 16, sy + r - 16], fill=(30, 20, 10))
    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save("server/static/samples/sample_early_blight.jpg", "JPEG")

def create_yellow_curl_sample():
    img = Image.new("RGB", (320, 320), color=(240, 245, 240))
    draw = ImageDraw.Draw(img)
    # Chlorotic yellow leaf body
    draw.polygon([(160, 30), (250, 100), (280, 190), (220, 270), (160, 290), (100, 270), (40, 190), (70, 100)], fill=(204, 180, 45))
    draw.line([(160, 30), (160, 290)], fill=(160, 140, 30), width=4)
    # Cupped patches
    for i in range(12):
        x = random.randint(80, 240)
        y = random.randint(70, 240)
        draw.ellipse([x - 15, y - 15, x + 15, y + 15], fill=(230, 210, 60))
    img = img.filter(ImageFilter.GaussianBlur(1))
    img.save("server/static/samples/sample_yellow_curl.jpg", "JPEG")

if __name__ == "__main__":
    create_healthy_sample()
    create_early_blight_sample()
    create_yellow_curl_sample()
    print("Samples generated successfully.")
