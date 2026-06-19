import os
from PIL import Image

def convert_to_png(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".jpg") or filename.endswith(".jpeg"):
            print(f"Converting {filename}...")
            img = Image.open(os.path.join(directory, filename))
            # Convert to RGB just in case
            img = img.convert("RGB")
            # Enhance quality a bit if needed, or just save as high-quality PNG
            new_filename = os.path.splitext(filename)[0] + ".png"
            img.save(os.path.join(directory, new_filename), "PNG")
            print(f"Saved {new_filename}")

if __name__ == "__main__":
    convert_to_png(r"c:\Users\usuario\Desktop\Antygravity\Imagenes")
