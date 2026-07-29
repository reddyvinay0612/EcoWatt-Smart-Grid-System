import os
import urllib.request
import json

state_mapping = {
    "Andaman and Nicobar Islands": "andaman-and-nicobar",
    "Andhra Pradesh": "andhra-pradesh",
    "Arunachal Pradesh": "arunachal-pradesh",
    "Assam": "assam",
    "Bihar": "bihar",
    "Chandigarh": "chandigarh",
    "Chhattisgarh": "chhattisgarh",
    "Dadra and Nagar Haveli": "dadra-and-nagar-haveli",
    "Daman and Diu": "daman-and-diu",
    "Delhi": "delhi",
    "Goa": "goa",
    "Gujarat": "gujarat",
    "Haryana": "haryana",
    "Himachal Pradesh": "himachal-pradesh",
    "Jammu and Kashmir": "jammu-and-kashmir",
    "Jharkhand": "jharkhand",
    "Karnataka": "karnataka",
    "Kerala": "kerala",
    "Ladakh": "ladakh",
    "Lakshadweep": "lakshadweep",
    "Madhya Pradesh": "madhya-pradesh",
    "Maharashtra": "maharashtra",
    "Manipur": "manipur",
    "Meghalaya": "meghalaya",
    "Mizoram": "mizoram",
    "Nagaland": "nagaland",
    "Odisha": "odisha",
    "Puducherry": "puducherry",
    "Punjab": "punjab",
    "Rajasthan": "rajasthan",
    "Sikkim": "sikkim",
    "Tamil Nadu": "tamil-nadu",
    "Telangana": "telangana",
    "Tripura": "tripura",
    "Uttar Pradesh": "uttar-pradesh",
    "Uttarakhand": "uttarakhand",
    "West Bengal": "west-bengal"
}

output_dir = r"D:\Major Project\frontend\public\states\geojson"
os.makedirs(output_dir, exist_ok=True)

print("Starting GeoJSON downloads...")
base_url = "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/states/"

for state, filename in state_mapping.items():
    url = f"{base_url}{filename}.geojson"
    target_path = os.path.join(output_dir, f"{filename}.geojson")
    
    try:
        print(f"Downloading {state} ({filename}) from {url}...")
        urllib.request.urlretrieve(url, target_path)
    except Exception as e:
        print(f"Error downloading {state}: {e}")
        # Try fallback names if any (e.g. without spaces, different suffix, etc.)
        # Try dadra-and-nagar-haveli vs dadra-nagar-haveli
        if "dadra" in filename:
            fallback_url = f"{base_url}dadra-nagar-haveli.geojson"
            try:
                print(f"Trying fallback for Dadra: {fallback_url}")
                urllib.request.urlretrieve(fallback_url, target_path)
                print("Fallback successful!")
            except Exception as fe:
                print(f"Fallback failed: {fe}")

print("Downloads finished.")
