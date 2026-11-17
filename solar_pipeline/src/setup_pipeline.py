import os
import csv
import glob
import json

def init_project_structure():
    """Creates the geospatial ML pipeline directories."""
    directories = [
        "data/raw",
        "data/processed",
        "src"
    ]
    for d in directories:
        os.makedirs(d, exist_ok=True)
    print("[PROJECT STRUCT] Initialized directories successfully.")

def generate_mock_datasets():
    """Generates synthetic Census and Solar Adoption CSVs for districts."""
    # List of states and mock districts from our public geojson collection
    state_files = glob.glob("../frontend/public/states/geojson/*.geojson")
    districts_list = []
    
    for f in state_files:
        try:
            with open(f, "r", encoding="utf-8") as file:
                data = json.load(file)
                for feature in data.get("features", []):
                    props = feature.get("properties", {})
                    dist_name = props.get("district")
                    state_name = props.get("st_nm")
                    if dist_name and state_name:
                        districts_list.append((state_name, dist_name))
        except Exception:
            pass

    # Fallback to defaults if no geojsons resolved
    if not districts_list:
        districts_list = [
            ("Karnataka", "Bengaluru Urban"), ("Karnataka", "Mysuru"), ("Karnataka", "Belagavi"),
            ("Maharashtra", "Mumbai City"), ("Maharashtra", "Pune"), ("Maharashtra", "Nagpur"),
            ("Delhi", "New Delhi"), ("Tamil Nadu", "Chennai")
        ]

    # Remove duplicates
    districts_list = list(set(districts_list))

    # 1. Write mock census_households.csv
    census_path = "data/raw/census_households.csv"
    with open(census_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "state_name", "district_name", "total_households", 
            "population_density_per_km2", "avg_household_income_inr", 
            "solar_irradiance_kwh_m2_day", "urban_ratio_percentage", "electrification_rate"
        ])
        
        # Write deterministic mock features
        for i, (state, dist) in enumerate(districts_list):
            # Seed value based on text hash
            seed = sum(ord(c) for c in dist)
            tot_h = (seed * 350) % 800000 + 40000
            pop_d = (seed * 7) % 5000 + 100
            inc = (seed * 123) % 250000 + 120000
            irr = round(((seed * 13) % 20) / 10.0 + 4.2, 2)
            urb = (seed * 9) % 80 + 10
            elec = round(90.0 + ((seed * 3) % 10), 2)
            
            writer.writerow([state, dist, tot_h, pop_d, inc, irr, urb, elec])
            
    print(f"[DATA GENERATOR] Generated {len(districts_list)} rows in {census_path}")

    # 2. Write mock solar_adoption.csv
    adoption_path = "data/raw/solar_adoption.csv"
    with open(adoption_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["state_name", "district_name", "solar_installed_count", "total_solar_capacity_kw"])
        
        for i, (state, dist) in enumerate(districts_list):
            seed = sum(ord(c) for c in dist)
            # Create a mock adoption count that is a fraction of total households
            tot_h = (seed * 350) % 800000 + 40000
            installed = (seed * 17) % int(tot_h * 0.03) + int(tot_h * 0.005)
            # Assume 4 kW average capacity per installation
            capacity = installed * 4.2
            
            writer.writerow([state, dist, installed, round(capacity, 2)])
            
    print(f"[DATA GENERATOR] Generated {len(districts_list)} rows in {adoption_path}")

if __name__ == "__main__":
    init_project_structure()
    generate_mock_datasets()
