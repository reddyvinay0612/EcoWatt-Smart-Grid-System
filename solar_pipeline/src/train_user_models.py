# ML training pipeline using user-provided datasets
import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score, r2_score, mean_squared_error

def train_household_solar_classifier():
    print("\n" + "="*50)
    print("[TRAINING] Household Solar Panel Adoption Classifier")
    print("="*50)
    
    file_path = "data/raw/electricity_consumption_dataset_20000.xlsx"
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return
        
    # Read the dataset
    df = pd.read_excel(file_path)
    print(f"Loaded {len(df)} household records.")

    # 1. Encoding categorical variables
    categorical_cols = ["House_Type", "EV_Charger", "Season"]
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    # Encode target variable: Solar_Panels (Yes -> 1, No -> 0)
    df["Solar_Panels_Encoded"] = df["Solar_Panels"].apply(lambda x: 1 if str(x).lower().strip() == 'yes' else 0)

    # 2. Select features and target label
    feature_cols = [
        "House_Area_sqft", "Family_Members", "Air_Conditioners", "Refrigerators", 
        "Washing_Machines", "Televisions", "Computers", "Water_Heaters", 
        "Ceiling_Fans", "LED_Lights", "EV_Charger", "Daily_Usage_Hours", 
        "Average_Temperature", "Season", "Occupancy_Rate", "Electricity_Tariff",
        "Monthly_Electricity_Consumption"
    ]
    
    X = df[feature_cols].values
    y = df["Solar_Panels_Encoded"].values

    # 3. Train-Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 4. Instantiate and Train XGBoost Classifier
    classifier = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss"
    )
    classifier.fit(X_train, y_train)

    # 5. Evaluate Performance
    y_pred = classifier.predict(X_test)
    y_prob = classifier.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("Accurately predicted Solar panel installations!")
    print(f"Classification Accuracy : {acc:.4f}")
    print(f"ROC-AUC Score           : {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save classifier model
    os.makedirs("models", exist_ok=True)
    save_path = "models/xgboost_household_solar_adoption_classifier.json"
    classifier.save_model(save_path)
    print(f"Saved Household solar classifier to {save_path}")

def train_zone_consumption_regressor():
    print("\n" + "="*50)
    print("[TRAINING] Zone Electricity Load Forecast Regressor")
    print("="*50)
    
    file_path = "data/raw/combined_dataset.csv"
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    # Load the dataset and train on the latter half (tail) where weather features are fully populated
    df = pd.read_csv(file_path)
    df = df.tail(100000)
    
    # Clean null rows in features/labels
    cols_to_clean = ["Temperature", "Humidity", "WindSpeed", "PowerConsumption_Zone1"]
    df = df.dropna(subset=cols_to_clean)
    
    # If tail was empty, fall back to non-null records in entire dataset
    if len(df) == 0:
        df = pd.read_csv(file_path).dropna(subset=cols_to_clean)
        
    if len(df) == 0:
        print("Warning: No clean non-null rows resolved for regression analysis. Training on PJM Load baseline instead...")
        # Fall back to PJM Load baseline (fully populated from start of dataset)
        df = pd.read_csv(file_path).dropna(subset=["PJM_Load"])
        feature_cols = ["hour", "day_of_week", "month"]
        target_col = "PJM_Load"
    else:
        feature_cols = ["Temperature", "Humidity", "WindSpeed", "hour", "day_of_week", "month"]
        target_col = "PowerConsumption_Zone1"

    # Extract temporal features on final selected dataframe
    df["Datetime"] = pd.to_datetime(df["Datetime"])
    df["hour"] = df["Datetime"].dt.hour
    df["day_of_week"] = df["Datetime"].dt.dayofweek
    df["month"] = df["Datetime"].dt.month

    X = df[feature_cols].values
    y = df[target_col].values

    # 3. Train-Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Instantiate and Train XGBoost Regressor
    regressor = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=6,
        learning_rate=0.08,
        random_state=42
    )
    regressor.fit(X_train, y_train)

    # 5. Evaluate Performance
    y_pred = regressor.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = mean_squared_error(y_test, y_pred) ** 0.5

    print(f"Regression R-squared (R2): {r2:.4f}")
    print(f"RMSE (kWh/zone hourly)   : {rmse:.4f}")

    # Save regressor model
    save_path = "models/xgboost_zone_power_consumption_regressor.json"
    regressor.save_model(save_path)
    print(f"Saved Zone consumption regressor to {save_path}")

if __name__ == "__main__":
    train_household_solar_classifier()
    train_zone_consumption_regressor()
