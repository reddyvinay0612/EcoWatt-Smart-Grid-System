import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from backend.app.models import Reading, Anomaly, Consumer, WeatherReading
from backend.app.forecasting.xgb_model import XGBForecaster

class AnomalyDetector:
    """
    Combines Regression-based residual limits (using XGBoost predictions) 
    and Unsupervised Outlier Detection (using Isolation Forest).
    """
    def __init__(self, contamination: float = 0.02, k_std: float = 3.0):
        self.contamination = contamination
        self.k_std = k_std
        self.iforest = IsolationForest(contamination=contamination, random_state=42)
        self.is_fitted = False

    def fit_unsupervised(self, df: pd.DataFrame):
        """
        Fits the Isolation Forest on load, hour, and temperature features.
        """
        features = df[["energy_kwh", "temperature", "hour"]].copy()
        self.iforest.fit(features)
        self.is_fitted = True
        return self

    def detect_anomalies(
        self, 
        db: Session, 
        consumer_id: int, 
        limit: int = 672  # Analyze last 7 days of 15m intervals
    ) -> List[Anomaly]:
        """
        Runs both residual-based and Isolation Forest detectors on historical data 
        for a consumer and persists newly detected anomalies.
        """
        # 1. Fetch data
        readings_query = db.query(Reading).filter(Reading.consumer_id == consumer_id).order_by(Reading.timestamp.desc()).limit(limit)
        readings = list(reversed(readings_query.all()))
        
        if len(readings) < 100:
            return []

        # Load into DataFrame
        df = pd.DataFrame([{
            "id": r.id,
            "timestamp": r.timestamp,
            "energy_kwh": r.energy_kwh,
            "is_anomaly_gt": r.is_anomaly
        } for r in readings])

        # Fetch weather
        timestamps = df["timestamp"].tolist()
        min_ts, max_ts = df["timestamp"].min(), df["timestamp"].max()
        weather = db.query(WeatherReading).filter(
            WeatherReading.timestamp >= min_ts, 
            WeatherReading.timestamp <= max_ts
        ).all()
        weather_df = pd.DataFrame([{
            "timestamp": w.timestamp,
            "temperature": w.temperature,
            "solar_irradiance": w.solar_irradiance,
            "wind_speed": w.wind_speed
        } for w in weather])

        # Merge
        df = pd.merge(df, weather_df, on="timestamp", how="inner").sort_values("timestamp")
        df["hour"] = df["timestamp"].dt.hour

        # Fit Unsupervised Detector if not fitted
        if not self.is_fitted:
            self.fit_unsupervised(df)

        # --- Method 1: Isolation Forest ---
        iforest_features = df[["energy_kwh", "temperature", "hour"]]
        # Predict (-1: anomaly, 1: normal)
        iforest_preds = self.iforest.predict(iforest_features)
        df["iforest_anomaly"] = (iforest_preds == -1).astype(int)
        
        # Isolation forest scores (lower score = more anomalous)
        df["iforest_score"] = self.iforest.score_samples(iforest_features)

        # --- Method 2: Regression Residuals ---
        # We build a quick XGBoost model to get "expected" baseline load
        # Train on first 80%, predict on last 20% to avoid extreme overfitting
        split_idx = int(len(df) * 0.8)
        train_df = df.iloc[:split_idx]
        
        xgb_forecaster = XGBForecaster()
        xgb_forecaster.fit(train_df, target_col="energy_kwh", is_renewable=False)
        
        from backend.app.pipeline.preprocess import engineer_features
        full_engineered = engineer_features(df, is_renewable=False)
        
        df["expected_kwh"] = xgb_forecaster.model.predict(full_engineered[xgb_forecaster.feature_cols])
        df["expected_kwh"] = np.clip(df["expected_kwh"], 0.0, None)
        df["residual"] = df["energy_kwh"] - df["expected_kwh"]

        # Calculate adaptive rolling standard deviation threshold
        rolling_std = df["residual"].rolling(window=96, min_periods=24).std().fillna(df["residual"].std())
        rolling_mean = df["residual"].rolling(window=96, min_periods=24).mean().fillna(df["residual"].mean())
        
        df["residual_anomaly"] = (np.abs(df["residual"] - rolling_mean) > (self.k_std * rolling_std)).astype(int)

        # --- Combine Signals ---
        # High Severity: Both models agree
        # Medium Severity: Residual flags or Isolation Forest flags
        df["anomaly_combined"] = ((df["iforest_anomaly"] == 1) | (df["residual_anomaly"] == 1)).astype(int)

        detected_anomalies = []

        # Check for active anomalies (we check the last 96 readings, e.g. 24 hours, to flag in database)
        eval_window = df.iloc[-96:]
        
        for _, row in eval_window.iterrows():
            if row["anomaly_combined"] == 1:
                # Check if we already created this anomaly in DB
                existing = db.query(Anomaly).filter(
                    Anomaly.consumer_id == consumer_id,
                    Anomaly.timestamp == row["timestamp"]
                ).first()
                
                if not existing:
                    # Severity determination
                    if row["iforest_anomaly"] == 1 and row["residual_anomaly"] == 1:
                        severity = "High"
                        method = "Combined (IForest + Residual)"
                    elif row["residual_anomaly"] == 1:
                        severity = "Medium"
                        method = "Regression Residual"
                    else:
                        severity = "Low"
                        method = "Isolation Forest"

                    # Calculate a raw anomaly score normalized between 0 and 1
                    # using the distance from IForest decision boundary
                    score = float(np.abs(row["iforest_score"]))

                    new_anomaly = Anomaly(
                        consumer_id=consumer_id,
                        timestamp=row["timestamp"],
                        actual_value=float(row["energy_kwh"]),
                        predicted_value=float(row["expected_kwh"]),
                        anomaly_score=score,
                        method=method,
                        severity=severity,
                        status="Active"
                    )
                    db.add(new_anomaly)
                    detected_anomalies.append(new_anomaly)

        if detected_anomalies:
            db.commit()
            
        return detected_anomalies

def evaluate_detector_accuracy(db: Session, consumer_id: int) -> dict:
    """
    Evaluates detector performance against injected ground-truth anomalies (is_anomaly)
    from Module 1. Calculates Precision, Recall, and F1 Score.
    """
    # Fetch historical readings for evaluation
    readings = db.query(Reading).filter(
        Reading.consumer_id == consumer_id
    ).order_by(Reading.timestamp.asc()).all()
    
    if len(readings) < 100:
        return {"precision": 0.0, "recall": 0.0, "f1_score": 0.0}

    df = pd.DataFrame([{
        "timestamp": r.timestamp,
        "energy_kwh": r.energy_kwh,
        "is_anomaly_gt": r.is_anomaly
    } for r in readings])

    # Fetch anomalies reported in DB
    anomalies = db.query(Anomaly).filter(
        Anomaly.consumer_id == consumer_id
    ).all()
    
    anomaly_timestamps = set(a.timestamp for a in anomalies)
    df["predicted_anomaly"] = df["timestamp"].apply(lambda t: 1 if t in anomaly_timestamps else 0)
    df["is_anomaly_gt"] = df["is_anomaly_gt"].astype(int)

    tp = len(df[(df["predicted_anomaly"] == 1) & (df["is_anomaly_gt"] == 1)])
    fp = len(df[(df["predicted_anomaly"] == 1) & (df["is_anomaly_gt"] == 0)])
    fn = len(df[(df["predicted_anomaly"] == 0) & (df["is_anomaly_gt"] == 1)])

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "total_true_anomalies": int(df["is_anomaly_gt"].sum()),
        "total_predicted_anomalies": len(anomalies)
    }
