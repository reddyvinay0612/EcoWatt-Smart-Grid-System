import os
import glob
import re
import pandas as pd
import geopandas as gpd

def clean_name(name):
    """Utility to clean and standardize state/district names for high join rates."""
    if not name or not isinstance(name, str):
        return ""
    name = name.strip().lower()
    name = re.sub(r'[^a-z0-9\s]', '', name) # Remove special characters/punctuation
    name = re.sub(r'\s+', ' ', name)        # Standardize multiple spaces to single space
    # Remove administrative words
    name = name.replace("district", "").replace("city", "").replace("urban", "").replace("rural", "").strip()
    return name

def run_ingestion_pipeline():
    print("[INGEST] Starting data ingestion and geospatial merge...")
    
    # 1. Load Tabular CSV Datasets
    census_file = "data/raw/census_households.csv"
    solar_file = "data/raw/solar_adoption.csv"
    
    if not os.path.exists(census_file) or not os.path.exists(solar_file):
        raise FileNotFoundError("Missing raw CSV data files in data/raw/. Please run setup_pipeline.py first.")
        
    df_census = pd.read_csv(census_file)
    df_solar = pd.read_csv(solar_file)
    print(f"[INGEST] Loaded {len(df_census)} rows from Census and {len(df_solar)} rows from Solar Adoption.")

    # Apply cleanup keys for matching
    df_census["match_key"] = df_census["district_name"].apply(clean_name)
    df_solar["match_key"] = df_solar["district_name"].apply(clean_name)
    
    # 2. Merge Tabular Datasets
    # Join on match_key and state name to prevent cross-state district name collisions (e.g., Bilaspur in HP vs. Chhattisgarh)
    df_tabular = pd.merge(
        df_census, 
        df_solar[["state_name", "match_key", "solar_installed_count", "total_solar_capacity_kw"]], 
        on=["state_name", "match_key"],
        how="inner"
    )
    print(f"[INGEST] Tabular datasets merged successfully. Rows: {len(df_tabular)}")

    # 3. Load all State GeoJSON boundaries from frontend repo
    geojson_path = "../frontend/public/states/geojson/*.geojson"
    geojson_files = glob.glob(geojson_path)
    if not geojson_files:
        raise FileNotFoundError(f"No district GeoJSON boundary files found under {geojson_path}")
        
    gdfs = []
    for f in geojson_files:
        try:
            gdf_state = gpd.read_file(f)
            gdfs.append(gdf_state)
        except Exception as e:
            print(f"[INGEST] Warning: Failed to load {f}: {e}")
            
    gdf_all = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True))
    print(f"[INGEST] Loaded {len(gdf_all)} boundary geometries from {len(geojson_files)} GeoJSON files.")

    # 4. Standardize GeoJSON Keys for Merger
    # GeoJSON properties have 'district' (district name) and 'st_nm' (state name)
    gdf_all["match_key"] = gdf_all["district"].apply(clean_name)
    gdf_all["state_match"] = gdf_all["st_nm"].apply(clean_name)
    df_tabular["state_match"] = df_tabular["state_name"].apply(clean_name)

    # 5. Perform Geospatial + Tabular Join
    gdf_merged = gdf_all.merge(
        df_tabular,
        on=["state_match", "match_key"],
        how="inner"
    )
    print(f"[INGEST] Geo-tabular join complete. Rows matched: {len(gdf_merged)} (out of {len(df_tabular)})")

    # 6. Feature Engineering & Target Extraction
    # Calculate target: solar adoption rate per 1,000 households
    gdf_merged["solar_adoption_rate_per_1k"] = (gdf_merged["solar_installed_count"] / gdf_merged["total_households"]) * 1000.0
    # Clean up intermediate keys
    gdf_merged = gdf_merged.drop(columns=["match_key", "state_match"])

    # 7. Write output GeoJSON
    processed_dir = "data/processed"
    os.makedirs(processed_dir, exist_ok=True)
    out_file = os.path.join(processed_dir, "district_adoption_features.geojson")
    
    # Save the file
    gdf_merged.to_file(out_file, driver="GeoJSON")
    print(f"[INGEST] Processed dataset saved to {out_file} successfully!")

if __name__ == "__main__":
    run_ingestion_pipeline()
