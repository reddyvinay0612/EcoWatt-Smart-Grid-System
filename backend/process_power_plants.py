import os
import glob
import pandas as pd
import json

data_dir = os.path.join(os.path.dirname(__file__), 'data', 'power_plants')
excel_files = glob.glob(os.path.join(data_dir, '*.xlsx'))

print(f"Reading {len(excel_files)} Excel datasets from {data_dir}...")
dfs = []
for f in excel_files:
    try:
        d = pd.read_excel(f)
        d.columns = [c.strip() for c in d.columns]
        dfs.append(d)
    except Exception as e:
        print(f"Error reading {f}:", e)

combined = pd.concat(dfs, ignore_index=True)
combined = combined.dropna(subset=['Plant Name']).copy()

# Deduplicate
combined = combined.drop_duplicates(subset=['Plant Name', 'State', 'Source', 'Operational Capacity (MW)']).copy()

# Clean & normalize fields
combined['State'] = combined['State'].fillna('All India / Unassigned').astype(str).str.strip()
combined['Source'] = combined['Source'].fillna('Other').astype(str).str.strip()
# Standardize source names
source_map = {
    'Small-Hydro': 'Small Hydro',
    'Small Hydro': 'Small Hydro',
    'Bio Power': 'Bio Power',
    'Biomass': 'Bio Power',
    'Solar': 'Solar',
    'Hydro': 'Hydro',
    'Coal': 'Coal',
    'Wind': 'Wind',
    'Oil & Gas': 'Oil & Gas',
    'Gas': 'Oil & Gas',
    'Nuclear': 'Nuclear'
}
combined['Source'] = combined['Source'].map(lambda s: source_map.get(s, s))

combined['Implementing Agency'] = combined['Implementing Agency'].fillna('State / Private Genco').astype(str).str.strip()
combined['Operational Units'] = combined['Operational Units'].fillna(1).astype(str).str.strip()
combined['Operational Capacity (MW)'] = pd.to_numeric(combined['Operational Capacity (MW)'], errors='coerce').fillna(0.0)

# Exact power map image mapping
power_map_indices = {
  "All India": "/power_maps/India Power Map.jpg",
  "Andaman and Nicobar Islands": "/power_maps/India Power Map (2).jpg",
  "Andhra Pradesh": "/power_maps/India Power Map (3).jpg",
  "Arunachal Pradesh": "/power_maps/India Power Map (4).jpg",
  "Assam": "/power_maps/India Power Map (5).jpg",
  "Bihar": "/power_maps/India Power Map (6).jpg",
  "Chandigarh": "/power_maps/India Power Map (7).jpg",
  "Chhattisgarh": "/power_maps/India Power Map (8).jpg",
  "Dadra and Nagar Haveli": "/power_maps/India Power Map (9).jpg",
  "Daman and Diu": "/power_maps/India Power Map (10).jpg",
  "Dadra and Nagar Haveli and Daman and Diu": "/power_maps/India Power Map (11).jpg",
  "Delhi": "/power_maps/India Power Map (12).jpg",
  "Goa": "/power_maps/India Power Map (13).jpg",
  "Gujarat": "/power_maps/India Power Map (14).jpg",
  "Haryana": "/power_maps/India Power Map (15).jpg",
  "Himachal Pradesh": "/power_maps/India Power Map (16).jpg",
  "Jammu and Kashmir": "/power_maps/India Power Map (17).jpg",
  "Jharkhand": "/power_maps/India Power Map (18).jpg",
  "Karnataka": "/power_maps/India Power Map (19).jpg",
  "Kerala": "/power_maps/India Power Map (20).jpg",
  "Lakshadweep": "/power_maps/India Power Map (21).jpg",
  "Ladakh": "/power_maps/India Power Map (22).jpg",
  "Madhya Pradesh": "/power_maps/India Power Map (23).jpg",
  "Maharashtra": "/power_maps/India Power Map (24).jpg",
  "Manipur": "/power_maps/India Power Map (25).jpg",
  "Meghalaya": "/power_maps/India Power Map (26).jpg",
  "Mizoram": "/power_maps/India Power Map (27).jpg",
  "Nagaland": "/power_maps/India Power Map (28).jpg",
  "Odisha": "/power_maps/India Power Map (29).jpg",
  "Puducherry": "/power_maps/India Power Map (30).jpg",
  "Punjab": "/power_maps/India Power Map (31).jpg",
  "Rajasthan": "/power_maps/India Power Map (32).jpg",
  "Sikkim": "/power_maps/India Power Map (33).jpg",
  "Tamil Nadu": "/power_maps/India Power Map (34).jpg",
  "Telangana": "/power_maps/India Power Map (35).jpg",
  "Tripura": "/power_maps/India Power Map (36).jpg",
  "Uttarakhand": "/power_maps/India Power Map (37).jpg",
  "Uttar Pradesh": "/power_maps/India Power Map (38).jpg",
  "West Bengal": "/power_maps/India Power Map (39).jpg"
}

total_capacity_mw = round(float(combined['Operational Capacity (MW)'].sum()), 2)
total_plants = len(combined)

# Source breakdown
source_group = combined.groupby('Source')['Operational Capacity (MW)'].agg(['sum', 'count']).reset_index()
source_breakdown = []
for _, row in source_group.iterrows():
    src = row['Source']
    cap = round(float(row['sum']), 2)
    cnt = int(row['count'])
    pct = round((cap / total_capacity_mw) * 100, 2) if total_capacity_mw > 0 else 0
    source_breakdown.append({
        'source': src,
        'capacity_mw': cap,
        'plant_count': cnt,
        'percentage': pct
    })
source_breakdown.sort(key=lambda x: x['capacity_mw'], reverse=True)

# Top Implementing Agencies
agency_group = combined.groupby('Implementing Agency')['Operational Capacity (MW)'].agg(['sum', 'count']).reset_index()
top_agencies = []
for _, row in agency_group.sort_values(by='sum', ascending=False).head(15).iterrows():
    top_agencies.append({
        'agency': row['Implementing Agency'],
        'capacity_mw': round(float(row['sum']), 2),
        'plant_count': int(row['count'])
    })

# State by State Aggregation
states_data = {}
all_state_names = sorted(combined['State'].unique().tolist())

for st in all_state_names:
    if st == 'nan' or not st:
        continue
    st_df = combined[combined['State'] == st]
    st_cap = round(float(st_df['Operational Capacity (MW)'].sum()), 2)
    st_cnt = len(st_df)
    
    # State source breakdown
    st_src_grp = st_df.groupby('Source')['Operational Capacity (MW)'].agg(['sum', 'count']).reset_index()
    st_sources = []
    for _, r in st_src_grp.iterrows():
        scap = round(float(r['sum']), 2)
        spct = round((scap / st_cap) * 100, 2) if st_cap > 0 else 0
        st_sources.append({
            'source': r['Source'],
            'capacity_mw': scap,
            'plant_count': int(r['count']),
            'percentage': spct
        })
    st_sources.sort(key=lambda x: x['capacity_mw'], reverse=True)
    
    # Plants list
    plants = []
    for _, prow in st_df.sort_values(by='Operational Capacity (MW)', ascending=False).iterrows():
        plants.append({
            'plant_name': str(prow['Plant Name']),
            'source': str(prow['Source']),
            'agency': str(prow['Implementing Agency']),
            'units': str(prow['Operational Units']),
            'capacity_mw': round(float(prow['Operational Capacity (MW)']), 2)
        })
        
    states_data[st] = {
        'state_name': st,
        'power_map_file': power_map_indices.get(st, '/power_maps/India Power Map.jpg'),
        'total_capacity_mw': st_cap,
        'total_plants': st_cnt,
        'sources': st_sources,
        'plants': plants
    }

# Complete output payload
output_payload = {
    'national_summary': {
        'total_capacity_mw': 548856.99, # Official CEA baseline
        'total_capacity_master_mw': total_capacity_mw,
        'total_plants_count': total_plants,
        'national_power_map': '/power_maps/India Power Map.jpg',
        'source_breakdown': source_breakdown,
        'top_agencies': top_agencies
    },
    'states': states_data
}

out_json = os.path.join(os.path.dirname(__file__), 'data', 'power_plants_data.json')
with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(output_payload, f, indent=2)

print(f"Successfully processed {total_plants} deduplicated plants across {len(states_data)} states into {out_json}!")
