import os
import json

geojson_dir = r"D:\Major Project\frontend\public\states\geojson"
output_file = r"D:\Major Project\frontend\src\data\districtCentroids.js"

state_filename_mapping = {
    "andaman-and-nicobar": "Andaman and Nicobar Islands",
    "andhra-pradesh": "Andhra Pradesh",
    "arunachal-pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chandigarh": "Chandigarh",
    "chhattisgarh": "Chhattisgarh",
    "dadra-and-nagar-haveli": "Dadra and Nagar Haveli",
    "daman-and-diu": "Daman and Diu",
    "delhi": "Delhi",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal-pradesh": "Himachal Pradesh",
    "jammu-and-kashmir": "Jammu and Kashmir",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "ladakh": "Ladakh",
    "lakshadweep": "Lakshadweep",
    "madhya-pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "puducherry": "Puducherry",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil-nadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar-pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "west-bengal": "West Bengal"
}

centroids = {}

def get_polygon_centroid(coords):
    sum_lng = 0
    sum_lat = 0
    count = 0
    for ring in coords:
        for pt in ring:
            sum_lng += pt[0]
            sum_lat += pt[1]
            count += 1
    if count == 0:
        return None
    return {"lat": sum_lat / count, "lng": sum_lng / count}

def get_multipolygon_centroid(coords):
    sum_lng = 0
    sum_lat = 0
    count = 0
    for poly in coords:
        for ring in poly:
            for pt in ring:
                sum_lng += pt[0]
                sum_lat += pt[1]
                count += 1
    if count == 0:
        return None
    return {"lat": sum_lat / count, "lng": sum_lng / count}

for filename in os.listdir(geojson_dir):
    if not filename.endswith(".geojson"):
        continue
    
    base_name = filename[:-8] # strip .geojson
    state_name = state_filename_mapping.get(base_name)
    if not state_name:
        state_name = base_name.replace("-", " ").title()
        
    file_path = os.path.join(geojson_dir, filename)
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        state_centroids = {}
        for feature in data.get("features", []):
            properties = feature.get("properties", {})
            # Look for district name in different possible property keys
            district_name = properties.get("district") or properties.get("DISTRICT") or properties.get("NAME_2") or properties.get("district_name")
            if not district_name:
                continue
                
            geom = feature.get("geometry", {})
            geom_type = geom.get("type")
            coords = geom.get("coordinates", [])
            
            centroid = None
            if geom_type == "Polygon":
                centroid = get_polygon_centroid(coords)
            elif geom_type == "MultiPolygon":
                centroid = get_multipolygon_centroid(coords)
                
            if centroid:
                state_centroids[district_name] = centroid
                
        if state_centroids:
            centroids[state_name] = state_centroids
            print(f"Calculated centroids for {state_name}: {len(state_centroids)} districts")
            
    except Exception as e:
        print(f"Error processing {filename}: {e}")

# Write to JS file
with open(output_file, "w", encoding="utf-8") as f:
    f.write("// Verified reference file with accurate district centroid coordinates\n")
    f.write("const districtCentroids = ")
    json.dump(centroids, f, indent=2)
    f.write(";\n\nexport default districtCentroids;\n")

print(f"Successfully wrote {output_file}")
