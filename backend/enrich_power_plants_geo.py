import json
import re
import hashlib
import os

UT_COORDS = {
    "Andaman and Nicobar Islands": {"lat": 11.667, "lng": 92.735},
    "Lakshadweep": {"lat": 10.566, "lng": 72.641},
    "Ladakh": {"lat": 34.152, "lng": 77.577},
    "Chandigarh": {"lat": 30.733, "lng": 76.779},
    "Puducherry": {"lat": 11.941, "lng": 79.808},
    "Dadra and Nagar Haveli and Daman and Diu": {"lat": 20.276, "lng": 73.008},
    "Dadra and Nagar Haveli": {"lat": 20.276, "lng": 73.008},
    "Daman and Diu": {"lat": 20.428, "lng": 72.839},
    "Delhi": {"lat": 28.613, "lng": 77.209},
    "Goa": {"lat": 15.299, "lng": 74.124}
}

# 1. Read district centroids
centroids_file = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'data', 'districtCentroids.js')
with open(centroids_file, 'r', encoding='utf-8') as f:
    js_text = f.read()
    json_str = js_text[js_text.find('{'):js_text.rfind('}')+1]
    district_centroids = json.loads(json_str)

# 2. Load power plants data
plants_file = os.path.join(os.path.dirname(__file__), 'data', 'power_plants_data.json')
with open(plants_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

all_plants = []
total_count = 0

for state_name, st_info in data.get('states', {}).items():
    st_centroids = district_centroids.get(state_name, {})
    if not st_centroids:
        for k, v in district_centroids.items():
            if k.lower() in state_name.lower() or state_name.lower() in k.lower():
                st_centroids = v
                break
                
    st_dist_list = list(st_centroids.items())
    
    for idx, p in enumerate(st_info.get('plants', [])):
        total_count += 1
        p_name = p['plant_name'].lower()
        
        matched_lat = None
        matched_lng = None
        matched_dist = None
        
        # Check district name in plant name
        for d_name, coords in st_dist_list:
            if d_name.lower() in p_name:
                matched_lat = coords['lat']
                matched_lng = coords['lng']
                matched_dist = d_name
                break
                
        # If not found, check known UT coords or distribute across state districts
        if matched_lat is None:
            if st_dist_list:
                h_int = int(hashlib.md5((p['plant_name'] + str(idx)).encode()).hexdigest(), 16)
                d_choice = st_dist_list[h_int % len(st_dist_list)]
                matched_dist = d_choice[0]
                matched_lat = d_choice[1]['lat']
                matched_lng = d_choice[1]['lng']
            else:
                ut = UT_COORDS.get(state_name, {"lat": 22.0, "lng": 78.0})
                matched_lat = ut['lat']
                matched_lng = ut['lng']
                matched_dist = state_name
                
        # Realistic scatter
        h_sub = int(hashlib.sha256((p['plant_name'] + p.get('source', '') + str(idx)).encode()).hexdigest(), 16)
        offset_lat = ((h_sub % 1000) / 1000.0 - 0.5) * 0.28
        offset_lng = (((h_sub // 1000) % 1000) / 1000.0 - 0.5) * 0.28
        
        p['lat'] = round(matched_lat + offset_lat, 5)
        p['lng'] = round(matched_lng + offset_lng, 5)
        p['district'] = matched_dist
        p['state'] = state_name
        
        # Standardize source
        src = p.get('source', 'Solar').strip()
        if src.lower() in ['small hydro', 'small-hydro']:
            p['source_category'] = 'Small-Hydro'
        elif src.lower() in ['bio power', 'biomass', 'bio']:
            p['source_category'] = 'Bio Power'
        elif src.lower() in ['oil & gas', 'oil and gas', 'gas', 'diesel']:
            p['source_category'] = 'Oil & Gas'
        elif src.lower() == 'coal':
            p['source_category'] = 'Coal'
        elif src.lower() == 'nuclear':
            p['source_category'] = 'Nuclear'
        elif src.lower() == 'wind':
            p['source_category'] = 'Wind'
        elif src.lower() == 'solar':
            p['source_category'] = 'Solar'
        elif src.lower() == 'hydro':
            p['source_category'] = 'Hydro'
        else:
            p['source_category'] = src
            
        all_plants.append(p)

# Save enriched power_plants_data.json
with open(plants_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

# Export lightweight JSON for frontend
front_export = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'data', 'powerPlantsGeo.json')
with open(front_export, 'w', encoding='utf-8') as f:
    json.dump(all_plants, f, indent=2)

print(f"Successfully geo-tagged {len(all_plants)} power plants and exported to {front_export}!")
