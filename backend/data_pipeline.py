import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def generate_synthetic_data():
    """
    Generates highly realistic, self-contained residential hourly consumption
    and weather data for multiple households over 1 year.
    """
    print("Generating synthetic residential smart-meter dataset...")
    np.random.seed(42)
    
    # 1 year of hourly timestamps
    timestamps = pd.date_range(start="2025-01-01 00:00:00", end="2025-12-31 23:00:00", freq="h")
    n_hours = len(timestamps)
    
    households = ["HH_001", "HH_002", "HH_003"]
    all_records = []
    
    # Pre-simulate shared weather patterns
    # Temperature: seasonal curve + daily cycle + noise
    doy = timestamps.dayofyear.values
    hour = timestamps.hour.values
    temp_seasonal = 20 + 10 * np.sin(2 * np.pi * (doy - 120) / 365)
    temp_daily = 4 * np.sin(2 * np.pi * (hour - 8) / 24)
    temperatures = temp_seasonal + temp_daily + np.random.normal(0, 1.5, n_hours)
    
    # Humidity: inversely related to temperature
    humidities = 75 - 1.2 * temp_daily - 0.5 * temp_seasonal + np.random.normal(0, 3, n_hours)
    humidities = np.clip(humidities, 10, 100)
    
    # Holidays lookup (mock for simple calendar features)
    holiday_dates = ["2025-01-01", "2025-01-26", "2025-08-15", "2025-10-02", "2025-12-25"]
    holiday_flags = timestamps.strftime("%Y-%m-%d").isin(holiday_dates).astype(int)
    
    for hh in households:
        # Base load profile distinct for each household
        base_load = {"HH_001": 0.6, "HH_002": 1.2, "HH_003": 0.95}[hh]
        
        # Load profile over a day: peaks at 7-9 AM and 6-10 PM
        daily_profile = np.zeros(24)
        daily_profile[0:6] = 0.15   # sleeping
        daily_profile[6:9] = 0.85   # morning routine
        daily_profile[9:17] = 0.35  # away/work
        daily_profile[17:22] = 1.4  # evening peak
        daily_profile[22:24] = 0.4  # winding down
        
        # Generate energy load
        loads = []
        for i, ts in enumerate(timestamps):
            h_idx = ts.hour
            d_idx = ts.dayofweek
            m_idx = ts.month
            
            # Base diurnal load
            load = base_load * daily_profile[h_idx]
            
            # Weekend effect (+20%)
            if d_idx >= 5:
                load *= 1.2
            
            # Temperature effect (heating/cooling load)
            temp = temperatures[i]
            if temp > 26:
                load += 0.08 * (temp - 26)  # AC cooling
            elif temp < 15:
                load += 0.05 * (15 - temp)  # Heating
                
            # Random variance
            load += np.random.normal(0, 0.08 * load)
            load = max(0.05, load)
            
            # Inject random anomalies (spikes) to verify anomaly detectors (0.3% chance)
            if np.random.rand() < 0.003:
                load *= np.random.uniform(2.5, 4.0)
                
            loads.append(load)
            
        hh_df = pd.DataFrame({
            "household_id": hh,
            "timestamp": timestamps,
            "energy_kwh": loads,
            "temperature": temperatures,
            "humidity": humidities,
            "is_holiday": holiday_flags
        })
        all_records.append(hh_df)
        
    df = pd.concat(all_records, ignore_index=True)
    
    # Introduce small missing values to simulate real preprocessing
    nan_mask = np.random.rand(len(df)) < 0.01
    df.loc[nan_mask, "energy_kwh"] = np.nan
    
    os.makedirs("backend/data", exist_ok=True)
    df.to_csv("backend/data/residential_raw.csv", index=False)
    print("Saved raw dataset to backend/data/residential_raw.csv")

def preprocess_pipeline():
    """
    Loads raw data, interpolates NaNs, clips outliers, scales features,
    adds calendar tags, and constructs train/val/test data.
    """
    raw_path = "backend/data/residential_raw.csv"
    if not os.path.exists(raw_path):
        generate_synthetic_data()
        
    df = pd.read_csv(raw_path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    processed_households = {}
    
    for hh in df["household_id"].unique():
        hh_df = df[df["household_id"] == hh].copy().sort_values("timestamp").reset_index(drop=True)
        
        # 1. Handle missing values via interpolation
        hh_df["energy_kwh"] = hh_df["energy_kwh"].interpolate(method="linear").bfill().ffill()
        
        # 2. Treat outlier readings (clip to mean +/- 3 * std)
        mean_val = hh_df["energy_kwh"].mean()
        std_val = hh_df["energy_kwh"].std()
        upper_limit = mean_val + 3 * std_val
        hh_df["energy_kwh"] = np.clip(hh_df["energy_kwh"], 0.0, upper_limit)
        
        # 3. Add calendar features
        hh_df["hour"] = hh_df["timestamp"].dt.hour
        hh_df["day_of_week"] = hh_df["timestamp"].dt.dayofweek
        hh_df["month"] = hh_df["timestamp"].dt.month
        hh_df["is_weekend"] = (hh_df["day_of_week"] >= 5).astype(int)
        
        processed_households[hh] = hh_df
        
    # Save the consolidated preprocessed dataframe
    processed_df = pd.concat(processed_households.values(), ignore_index=True)
    processed_df.to_csv("backend/data/residential_processed.csv", index=False)
    print("Saved preprocessed dataset to backend/data/residential_processed.csv")
    return processed_households

def create_sequences(df, lookback_window=24):
    """
    Builds sliding window sequences of shape (samples, lookback_window, num_features).
    Splits into time-ordered Train (70%), Val (15%), Test (15%) splits.
    """
    feature_cols = ["energy_kwh", "temperature", "humidity", "hour", "day_of_week", "month", "is_weekend", "is_holiday"]
    
    # Scale features
    scaler = MinMaxScaler()
    df_scaled = df.copy()
    df_scaled[feature_cols] = scaler.fit_transform(df[feature_cols])
    
    data_matrix = df_scaled[feature_cols].values
    target_matrix = df_scaled["energy_kwh"].values # we predict the energy consumption
    
    X, y = [], []
    for i in range(len(data_matrix) - lookback_window):
        X.append(data_matrix[i : i + lookback_window])
        y.append(target_matrix[i + lookback_window])
        
    X, y = np.array(X), np.array(y)
    
    # Time-ordered split
    n_samples = len(X)
    train_end = int(n_samples * 0.70)
    val_end = int(n_samples * 0.85)
    
    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]
    
    return {
        "X_train": X_train, "y_train": y_train,
        "X_val": X_val, "y_val": y_val,
        "X_test": X_test, "y_test": y_test,
        "scaler": scaler,
        "feature_cols": feature_cols
    }

if __name__ == "__main__":
    generate_synthetic_data()
    preprocess_pipeline()
    print("Data pipeline executed successfully!")
