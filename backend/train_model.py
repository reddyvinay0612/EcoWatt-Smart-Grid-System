import pandas as pd
import numpy as np
from prophet import Prophet
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
import pickle
import os

def sanitize_state_name(name):
    return name.lower().replace(" ", "").replace("&", "and")

def train_prophet_model(df, target_col):
    # Prepare Prophet format: ds and y
    prophet_df = df[["year", target_col]].rename(columns={"year": "ds", target_col: "y"})
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"], format="%Y")
    
    # Yearly data has no sub-year seasonality, disable daily/weekly/yearly seasonalities to avoid warnings
    model = Prophet(
        growth='linear',
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False
    )
    model.fit(prophet_df)
    return model

def train_xgboost_model(df, target_col):
    # Simple autoregressive features for XGBoost comparison
    df_sorted = df.sort_values("year")
    X = df_sorted[["year"]].values
    y = df_sorted[target_col].values
    
    model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
    model.fit(X, y)
    return model

def evaluate_models():
    # Make sure output directory exists
    os.makedirs("models", exist_ok=True)
    
    if not os.path.exists("historical_data.csv"):
        print("historical_data.csv not found! Running data_prep.py first...")
        import data_prep
        data_prep.generate_historical_data()
        
    df = pd.read_csv("historical_data.csv")
    states = df["state"].unique()
    
    metrics_summary = []
    
    print("\n--- Training Prophet Models for all States/UTs ---")
    
    for state in states:
        state_key = sanitize_state_name(state)
        state_df = df[df["state"] == state].copy()
        
        # 1. Electricity model
        elec_model = train_prophet_model(state_df, "electricity_consumption_kwh")
        elec_path = f"models/{state_key}_electricity_model.pkl"
        with open(elec_path, "wb") as f:
            pickle.dump(elec_model, f)
            
        # 2. Carbon model
        carb_model = train_prophet_model(state_df, "carbon_emission_kg")
        carb_path = f"models/{state_key}_carbon_model.pkl"
        with open(carb_path, "wb") as f:
            pickle.dump(carb_model, f)
            
        # Evaluate Prophet vs XGBoost comparison on the last 2 years (validation split)
        train_part = state_df[state_df["year"] < 2025]
        val_part = state_df[state_df["year"] >= 2025]
        
        # Prophet validation prediction
        p_model = train_prophet_model(train_part, "electricity_consumption_kwh")
        future_ds = pd.DataFrame({"ds": pd.to_datetime(val_part["year"], format="%Y")})
        forecast = p_model.predict(future_ds)
        p_preds = forecast["yhat"].values
        
        # XGBoost validation prediction
        xgb_model = train_xgboost_model(train_part, "electricity_consumption_kwh")
        xgb_preds = xgb_model.predict(val_part[["year"]].values)
        
        actuals = val_part["electricity_consumption_kwh"].values
        
        # Calculate scores
        p_mae = mean_absolute_error(actuals, p_preds)
        p_rmse = root_mean_squared_error(actuals, p_preds)
        xgb_mae = mean_absolute_error(actuals, xgb_preds)
        xgb_rmse = root_mean_squared_error(actuals, xgb_preds)
        
        print(f"[{state}] Elec MAE (Prophet): {p_mae:.2f} | (XGBoost): {xgb_mae:.2f}")
        
        metrics_summary.append({
            "state": state,
            "prophet_mae": p_mae,
            "prophet_rmse": p_rmse,
            "xgboost_mae": xgb_mae,
            "xgboost_rmse": xgb_rmse
        })
        
    print("\nTraining completed successfully! Saved all state models into models/ folder.")
    
if __name__ == "__main__":
    evaluate_models()
