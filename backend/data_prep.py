import pandas as pd
import numpy as np
import os

# Base data matching stateData.js baseline values
STATE_BASE_DATA = [
  {"state": "Andaman and Nicobar Islands", "electricity_consumption": 900, "carbon_emission": 810, "pop": "400k", "gdp": 220000, "factor": 0.90},
  {"state": "Andhra Pradesh", "electricity_consumption": 2299.25, "carbon_emission": 1954.36, "pop": "53M", "gdp": 220000, "factor": 0.85},
  {"state": "Arunachal Pradesh", "electricity_consumption": 2562.09, "carbon_emission": 1024.84, "pop": "1.6M", "gdp": 210000, "factor": 0.40},
  {"state": "Assam", "electricity_consumption": 1069.96, "carbon_emission": 962.96, "pop": "36M", "gdp": 100000, "factor": 0.90},
  {"state": "Bihar", "electricity_consumption": 835.03, "carbon_emission": 793.28, "pop": "127M", "gdp": 54000, "factor": 0.95},
  {"state": "Chandigarh", "electricity_consumption": 2000, "carbon_emission": 1600.00, "pop": "1.2M", "gdp": 350000, "factor": 0.80},
  {"state": "Chhattisgarh", "electricity_consumption": 3105.21, "carbon_emission": 3260.47, "pop": "30M", "gdp": 140000, "factor": 1.05},
  {"state": "Dadra and Nagar Haveli", "electricity_consumption": 15642.35, "carbon_emission": 14860.23, "pop": "400k", "gdp": 350000, "factor": 0.95},
  {"state": "Daman and Diu", "electricity_consumption": 15642.35, "carbon_emission": 14860.23, "pop": "250k", "gdp": 350000, "factor": 0.95},
  {"state": "Delhi", "electricity_consumption": 3636.70, "carbon_emission": 3454.87, "pop": "20M", "gdp": 440000, "factor": 0.95},
  {"state": "Goa", "electricity_consumption": 5485.87, "carbon_emission": 4937.28, "pop": "1.6M", "gdp": 580000, "factor": 0.90},
  {"state": "Gujarat", "electricity_consumption": 4646.19, "carbon_emission": 4413.88, "pop": "64M", "gdp": 280000, "factor": 0.95},
  {"state": "Haryana", "electricity_consumption": 4875.30, "carbon_emission": 4631.54, "pop": "28M", "gdp": 290000, "factor": 0.95},
  {"state": "Himachal Pradesh", "electricity_consumption": 3214.53, "carbon_emission": 1125.09, "pop": "7.4M", "gdp": 220000, "factor": 0.35},
  {"state": "Jammu and Kashmir", "electricity_consumption": 2452.77, "carbon_emission": 1226.39, "pop": "14M", "gdp": 120000, "factor": 0.50},
  {"state": "Jharkhand", "electricity_consumption": 1760.78, "carbon_emission": 1848.82, "pop": "39M", "gdp": 90000, "factor": 1.05},
  {"state": "Karnataka", "electricity_consumption": 3357.58, "carbon_emission": 1678.79, "pop": "67M", "gdp": 300000, "factor": 0.50},
  {"state": "Kerala", "electricity_consumption": 2486.49, "carbon_emission": 1367.57, "pop": "35M", "gdp": 250000, "factor": 0.55},
  {"state": "Ladakh", "electricity_consumption": 2000, "carbon_emission": 1000.00, "pop": "300k", "gdp": 180000, "factor": 0.50},
  {"state": "Lakshadweep", "electricity_consumption": 800, "carbon_emission": 720.00, "pop": "65k", "gdp": 200000, "factor": 0.90},
  {"state": "Madhya Pradesh", "electricity_consumption": 1958.49, "carbon_emission": 1762.64, "pop": "85M", "gdp": 140000, "factor": 0.90},
  {"state": "Maharashtra", "electricity_consumption": 2990.07, "carbon_emission": 2541.56, "pop": "125M", "gdp": 240000, "factor": 0.85},
  {"state": "Manipur", "electricity_consumption": 1370.01, "carbon_emission": 822.01, "pop": "3.0M", "gdp": 95000, "factor": 0.60},
  {"state": "Meghalaya", "electricity_consumption": 2688.86, "carbon_emission": 1344.43, "pop": "3.3M", "gdp": 100000, "factor": 0.50},
  {"state": "Mizoram", "electricity_consumption": 2024.78, "carbon_emission": 1113.63, "pop": "1.2M", "gdp": 200000, "factor": 0.55},
  {"state": "Nagaland", "electricity_consumption": 1079.26, "carbon_emission": 647.56, "pop": "2.2M", "gdp": 140000, "factor": 0.60},
  {"state": "Odisha", "electricity_consumption": 2598.14, "carbon_emission": 2728.05, "pop": "44M", "gdp": 150000, "factor": 1.05},
  {"state": "Puducherry", "electricity_consumption": 4479.88, "carbon_emission": 4031.89, "pop": "1.6M", "gdp": 240000, "factor": 0.90},
  {"state": "Punjab", "electricity_consumption": 4120.51, "carbon_emission": 3708.46, "pop": "30M", "gdp": 180000, "factor": 0.90},
  {"state": "Rajasthan", "electricity_consumption": 2544.64, "carbon_emission": 2417.41, "pop": "81M", "gdp": 160000, "factor": 0.95},
  {"state": "Sikkim", "electricity_consumption": 2863.31, "carbon_emission": 858.99, "pop": "700k", "gdp": 520000, "factor": 0.30},
  {"state": "Tamil Nadu", "electricity_consumption": 3659.96, "carbon_emission": 2561.97, "pop": "77M", "gdp": 270000, "factor": 0.70},
  {"state": "Telangana", "electricity_consumption": 4162.38, "carbon_emission": 3954.26, "pop": "38M", "gdp": 310000, "factor": 0.95},
  {"state": "Tripura", "electricity_consumption": 1102.52, "carbon_emission": 882.02, "pop": "4.1M", "gdp": 140000, "factor": 0.80},
  {"state": "Uttar Pradesh", "electricity_consumption": 1502.60, "carbon_emission": 1352.34, "pop": "235M", "gdp": 85000, "factor": 0.90},
  {"state": "Uttarakhand", "electricity_consumption": 2974.95, "carbon_emission": 1338.73, "pop": "11M", "gdp": 230000, "factor": 0.45},
  {"state": "West Bengal", "electricity_consumption": 1508.41, "carbon_emission": 1433.00, "pop": "99M", "gdp": 150000, "factor": 0.95}
]

def generate_historical_data():
    rows = []
    np.random.seed(42)  # For stable reproducibility
    
    # 10 years of data: 2017 to 2026
    years = list(range(2017, 2027))
    
    for state_info in STATE_BASE_DATA:
        state_name = state_info["state"]
        base_kwh = state_info["electricity_consumption"]
        base_factor = state_info["factor"]
        gdp_cap = state_info["gdp"]
        
        # Determine population number
        pop_str = state_info["pop"]
        if pop_str.endswith('M'):
            pop_base = float(pop_str[:-1]) * 1000000
        elif pop_str.endswith('k'):
            pop_base = float(pop_str[:-1]) * 1000
        else:
            pop_base = 1000000
            
        # Draw yearly values backwards and forwards from 2026 base
        for year in years:
            # Scale factor: average 3% growth per year (compounded relative to 2026)
            diff_years = year - 2026
            growth_rate = 0.035 + (np.random.rand() * 0.015) # 3.5% to 5.0% yearly growth
            
            # Compounded factor
            mult = (1 + growth_rate) ** diff_years
            
            # Add small random noise (±2%)
            noise = 1 + (np.random.randn() * 0.02)
            
            kwh = round(base_kwh * mult * noise, 2)
            co2 = round(kwh * base_factor * (1 + np.random.randn() * 0.015), 2)
            
            # GDP growing at ~5% per year
            gdp_mult = (1.05 + np.random.rand() * 0.02) ** diff_years
            gdp = round(gdp_cap * gdp_mult)
            
            # Population growing at ~1% per year
            pop_mult = 1.012 ** diff_years
            pop = int(pop_base * pop_mult)
            
            rows.append({
                "state": state_name,
                "year": year,
                "electricity_consumption_kwh": kwh,
                "carbon_emission_kg": co2,
                "population": pop,
                "gdp_per_capita": gdp
            })
            
    df = pd.DataFrame(rows)
    df.to_csv("historical_data.csv", index=False)
    print(f"Generated historical_data.csv with {len(df)} rows.")

if __name__ == "__main__":
    generate_historical_data()
