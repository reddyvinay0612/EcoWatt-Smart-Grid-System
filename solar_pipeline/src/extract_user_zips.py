import zipfile
import os
import shutil

zip_paths = [
    (r"C:\Users\vinay\Downloads\archive.zip", "Smart Home Energy Consumption Optimization.csv"),
    (r"C:\Users\vinay\Downloads\archive (1).zip", "electricity_consumption_dataset_20000.xlsx"),
    (r"C:\Users\vinay\Downloads\archive (2).zip", "combined_dataset.csv")
]

dest_dir = "data/raw"
os.makedirs(dest_dir, exist_ok=True)

print("[EXTRACTOR] Copying and extracting user-provided zip datasets...")
for z_path, f_name in zip_paths:
    if not os.path.exists(z_path):
        print(f"ERROR: Archive file {z_path} not found!")
        continue
    try:
        with zipfile.ZipFile(z_path, 'r') as zip_ref:
            zip_ref.extract(f_name, dest_dir)
        print(f"SUCCESS: Extracted {f_name} to {dest_dir}/{f_name}")
    except Exception as e:
        print(f"FAILED: Error extracting {f_name}: {e}")

print("[EXTRACTOR] Extraction complete.")
