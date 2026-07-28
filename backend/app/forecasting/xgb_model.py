import numpy as np
import pandas as pd
import xgboost as xgb
from typing import List, Tuple
from backend.app.pipeline.preprocess import engineer_features

class XGBForecaster:
    """
    XGBoost-based forecaster for Load and Renewable Generation.
    Supports multi-step forecasting through an autoregressive loop.
    """
    def __init__(self, max_depth: int = 6, n_estimators: int = 150, learning_rate: float = 0.05):
        self.model = xgb.XGBRegressor(
            max_depth=max_depth,
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            random_state=42,
            n_jobs=-1
        )
        self.feature_cols = None
        self.target_col = None

    def fit(self, df: pd.DataFrame, target_col: str = "energy_kwh", is_renewable: bool = False):
        """
        Fits the XGBoost Regressor on the engineered dataframe features.
        """
        self.target_col = target_col
        # Engineer features
        engineered_df = engineer_features(df, is_renewable=is_renewable)
        
        # Define feature columns to use for training
        exclude_cols = [
            "id", "timestamp", "consumer_id", "is_anomaly", 
            "energy_kwh", "solar_kwh", "wind_kwh", "total_kwh"
        ]
        self.feature_cols = [c for c in engineered_df.columns if c not in exclude_cols]
        
        X = engineered_df[self.feature_cols]
        y = engineered_df[self.target_col]
        
        self.model.fit(X, y)
        return self

    def predict_next_step(self, feature_row: pd.DataFrame) -> float:
        """
        Predicts a single step ahead.
        """
        X = feature_row[self.feature_cols]
        pred = self.model.predict(X)[0]
        return float(max(0.0, pred))

    def forecast(
        self, 
        history_df: pd.DataFrame, 
        future_weather_df: pd.DataFrame, 
        horizon: int = 96,
        is_renewable: bool = False
    ) -> np.ndarray:
        """
        Performs multi-step forecasting using an autoregressive loop.
        Appends predictions back as lag features for subsequent steps.
        - history_df: recent historical data (at least 24 hours / 96 steps)
        - future_weather_df: weather inputs for the forecast horizon (length = horizon)
        """
        if self.model is None or self.feature_cols is None:
            raise ValueError("Model has not been trained yet.")
            
        current_history = history_df.copy().sort_values("timestamp")
        target_col = self.target_col
        predictions = []

        # Iterate over the horizon, step by step
        for i in range(horizon):
            future_row_weather = future_weather_df.iloc[i]
            next_timestamp = future_row_weather["timestamp"]
            
            # 1. Create a dummy row for the next step with weather inputs
            new_row = {
                "timestamp": next_timestamp,
                target_col: 0.0,  # placeholder
                "temperature": future_row_weather["temperature"],
                "solar_irradiance": future_row_weather["solar_irradiance"],
                "wind_speed": future_row_weather["wind_speed"]
            }
            if is_renewable:
                new_row["solar_kwh"] = 0.0
                new_row["wind_kwh"] = 0.0
                new_row["total_kwh"] = 0.0
            
            # Combine history and the new dummy row to calculate lags
            temp_df = pd.concat([current_history, pd.DataFrame([new_row])], ignore_index=True)
            temp_df = engineer_features(temp_df, is_renewable=is_renewable)
            
            # 2. Extract the engineered feature values for our target row (the last row)
            feature_row = temp_df.iloc[[-1]]
            
            # 3. Predict the next step
            pred_val = self.predict_next_step(feature_row)
            predictions.append(pred_val)
            
            # 4. Replace placeholder value in our history buffer and append it
            new_row[target_col] = pred_val
            if is_renewable:
                # Approximate breakdown for solar/wind based on inputs
                new_row["total_kwh"] = pred_val
                # Split solar vs wind based on relative irradiance vs wind speed ratios
                total_weather = future_row_weather["solar_irradiance"] + (future_row_weather["wind_speed"] ** 3)
                if total_weather > 0:
                    new_row["solar_kwh"] = pred_val * (future_row_weather["solar_irradiance"] / total_weather)
                    new_row["wind_kwh"] = pred_val - new_row["solar_kwh"]
                else:
                    new_row["solar_kwh"] = 0.0
                    new_row["wind_kwh"] = 0.0

            current_history = pd.concat([current_history, pd.DataFrame([new_row])], ignore_index=True)
            # Maintain a sliding window history size to keep calculations fast
            if len(current_history) > 200:
                current_history = current_history.iloc[-200:]

        return np.array(predictions)
