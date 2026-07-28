import pandas as pd
import numpy as np
from typing import Tuple, List
from sklearn.preprocessing import MinMaxScaler, StandardScaler

def smooth_time_series(series: np.ndarray, window_size: int = 4) -> np.ndarray:
    """
    Applies a simple moving average filter to smooth high-frequency noise.
    """
    if len(series) < window_size:
        return series
    return pd.Series(series).rolling(window=window_size, min_periods=1).mean().values

class TimeSeriesScaler:
    """
    Wrapper around sklearn scaling that handles scaling and inverse scaling for 1D and 2D arrays.
    """
    def __init__(self, scale_type: str = "minmax"):
        self.scale_type = scale_type
        self.scaler = MinMaxScaler() if scale_type == "minmax" else StandardScaler()
        self.is_fitted = False

    def fit(self, data: np.ndarray):
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        self.scaler.fit(data)
        self.is_fitted = True
        return self

    def transform(self, data: np.ndarray) -> np.ndarray:
        original_shape = data.shape
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        scaled = self.scaler.transform(data)
        if len(original_shape) == 1:
            return scaled.flatten()
        return scaled

    def fit_transform(self, data: np.ndarray) -> np.ndarray:
        self.fit(data)
        return self.transform(data)

    def inverse_transform(self, data: np.ndarray) -> np.ndarray:
        original_shape = data.shape
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)
        inverse = self.scaler.inverse_transform(data)
        if len(original_shape) == 1:
            return inverse.flatten()
        return inverse

def create_lstm_windows(
    data: np.ndarray, 
    features_dim: int, 
    window_size: int = 96,  # e.g., 24 hours of 15-minute readings = 96 steps
    horizon: int = 4        # e.g., 1 hour ahead = 4 steps
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Creates overlapping sliding windows for PyTorch LSTM training.
    - Input data shape: (N, num_features)
    - Returns:
      - X: shape (N - window_size - horizon + 1, window_size, num_features)
      - y: shape (N - window_size - horizon + 1, horizon)
    """
    X, y = [], []
    num_samples = len(data) - window_size - horizon + 1
    
    # Assumes target (energy_kwh) is the first column of data
    for i in range(num_samples):
        X.append(data[i : i + window_size])
        y.append(data[i + window_size : i + window_size + horizon, 0])
        
    return np.array(X), np.array(y)

def engineer_features(df: pd.DataFrame, is_renewable: bool = False) -> pd.DataFrame:
    """
    Engineers tabular time-series features for XGBoost.
    Adds lags, rolling stats, and time encodings.
    """
    df = df.copy()
    df.sort_values("timestamp", inplace=True)

    # Cyclic time features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Cyclic encoding for time fields
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
    df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)

    # Targets differ between load and renewables
    target_col = "total_kwh" if is_renewable else "energy_kwh"

    if target_col in df.columns:
        # Lags: 1 interval (15m), 4 intervals (1h), 96 intervals (24h)
        df["lag_1"] = df[target_col].shift(1)
        df["lag_4"] = df[target_col].shift(4)
        df["lag_96"] = df[target_col].shift(96)

        # Rolling statistics: 1 hour (4 periods) and 6 hours (24 periods)
        df["rolling_mean_4"] = df[target_col].shift(1).rolling(window=4).mean()
        df["rolling_std_4"] = df[target_col].shift(1).rolling(window=4).std()
        df["rolling_mean_24"] = df[target_col].shift(1).rolling(window=24).mean()

        # Handle NaNs from shifting/rolling
        df.bfill(inplace=True)
        df.ffill(inplace=True)

    return df

def train_test_split_time(
    df: pd.DataFrame, 
    test_ratio: float = 0.15
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Splits time series data chronologically (train on past, test on future).
    """
    df = df.copy().sort_values("timestamp")
    split_idx = int(len(df) * (1 - test_ratio))
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    return train_df, test_df
