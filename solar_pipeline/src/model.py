import os
import xgboost as xgb
import geopandas as gpd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def train_adoption_model():
    print("[MODEL] Loading processed geo-tabular dataset...")
    geojson_path = "data/processed/district_adoption_features.geojson"
    
    if not os.path.exists(geojson_path):
        raise FileNotFoundError(f"Processed dataset not found at {geojson_path}. Run ingest.py first.")
        
    gdf = gpd.read_file(geojson_path)
    print(f"[MODEL] Loaded dataset with {len(gdf)} records.")

    # 1. Define Features & Target Label
    features = [
        "population_density_per_km2", 
        "avg_household_income_inr", 
        "solar_irradiance_kwh_m2_day", 
        "urban_ratio_percentage", 
        "electrification_rate"
    ]
    target = "solar_adoption_rate_per_1k"

    X = gdf[features].values
    y = gdf[target].values

    # 2. Train-Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"[MODEL] Splitting completed. Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    # 3. Instantiate and Train XGBoost Regressor
    # Hyperparameters tuned for moderate sizing tabular datasets
    model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42
    )
    
    print("[MODEL] Fitting XGBoost Regressor...")
    model.fit(X_train, y_train)

    # 4. Evaluate Model Performance
    y_pred = model.predict(X_test)
    rmse = mean_squared_error(y_test, y_pred) ** 0.5
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n" + "="*40)
    print("XGBOOST MODEL EVALUATION SUMMARY")
    print("="*40)
    print(f"Mean Absolute Error (MAE)  : {mae:.4f} (Adopters/1k)")
    print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"R-squared Score (R2)        : {r2:.4f}")
    print("="*40 + "\n")

    # 5. Predict on Entire Dataset and Append back
    gdf["predicted_adoption_rate_per_1k"] = model.predict(X)
    
    # Save the updated GeoJSON back for visualization dashboard
    gdf.to_file(geojson_path, driver="GeoJSON")
    print(f"[MODEL] Appended predictions and updated {geojson_path}")

    # Save model weights
    os.makedirs("models", exist_ok=True)
    model_save_path = "models/xgboost_solar_model.json"
    model.save_model(model_save_path)
    print(f"[MODEL] Saved XGBoost model file to {model_save_path}")
    
    return model

if __name__ == "__main__":
    train_adoption_model()
