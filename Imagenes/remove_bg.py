import os
from rembg import remove
from PIL import Image

def remove_backgrounds(directory):
    files = [f for f in os.listdir(directory) if f.endswith("_highres.png")]
    
    for filename in files:
        input_path = os.path.join(directory, filename)
        
        # We append _nobg instead of highres
        name, _ = os.path.splitext(filename)
        out_name = f"{name}_nobg.png"
        output_path = os.path.join(directory, out_name)
        
        print(f"Removing background from {filename}...")
        try:
            with open(input_path, 'rb') as i:
                with open(output_path, 'wb') as o:
                    input_data = i.read()
                    output_data = remove(input_data)
                    o.write(output_data)
            print(f"Saved {out_name}")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    remove_backgrounds(r"c:\Users\usuario\Desktop\Antygravity\Imagenes")
