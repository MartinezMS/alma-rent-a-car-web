import os
from PIL import Image, ImageEnhance, ImageFilter

def upscale_image(filepath, scale=4):
    print(f"Processing {filepath}")
    img = Image.open(filepath)
    img = img.convert("RGBA")
    
    # Upscale
    new_size = (img.width * scale, img.height * scale)
    img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Sharpen to make it crisp after upscale
    img_sharpened = img_resized.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    
    # Enhance contrast slightly to make colors pop but respect original
    enhancer = ImageEnhance.Contrast(img_sharpened)
    img_final = enhancer.enhance(1.1)
    
    filename = os.path.basename(filepath)
    name, ext = os.path.splitext(filename)
    out_name = f"{name}_highres.png"
    out_path = os.path.join(os.path.dirname(filepath), out_name)
    
    img_final.save(out_path, "PNG")
    print(f"Saved {out_path}")

if __name__ == "__main__":
    folder = r"c:\Users\usuario\Desktop\Antygravity\Imagenes"
    files_to_process = [
        "A-logo alma.jpg",
        "favicon-16x16.png",
        "logos alma_letras blancas fondo negro.jpg",
        "logos alma_letras naranjas fondo negro.jpg",
        "logos alma_letras negras fondo blanco.jpg",
        "logos alma_letras negras fondo naranja.jpg"
    ]
    for f in files_to_process:
        path = os.path.join(folder, f)
        if os.path.exists(path):
            upscale_image(path)
