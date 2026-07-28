import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
from typing import Tuple, List
from backend.app.pipeline.preprocess import TimeSeriesScaler, create_lstm_windows

class LSTMNet(nn.Module):
    """
    Standard PyTorch LSTM network.
    Takes a sequence of past weather + load features and outputs a vector representing future load.
    """
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, output_dim: int, dropout: float = 0.2):
        super(LSTMNet, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Initialize hidden and cell states with zeros
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        
        # Forward propagate LSTM
        # out: tensor of shape (batch_size, seq_length, hidden_size)
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = out[:, -1, :]
        out = self.fc(out)
        return out

class LSTMForecaster:
    """
    Wrapper to manage PyTorch dataset compilation, scaling, training, and predicting.
    """
    def __init__(
        self, 
        window_size: int = 96,    # 24 hours of 15m intervals
        horizon: int = 24,        # 6 hours ahead (forecast horizon)
        hidden_dim: int = 64,
        num_layers: int = 2,
        lr: float = 0.005,
        epochs: int = 5,          # Keep epochs small for quick web app training
        batch_size: int = 128
    ):
        self.window_size = window_size
        self.horizon = horizon
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.scaler_x = TimeSeriesScaler(scale_type="minmax")
        self.scaler_y = TimeSeriesScaler(scale_type="minmax")
        
        # List of features used (excluding timestamp/id)
        self.features = ["energy_kwh", "temperature", "solar_irradiance", "wind_speed", "hour_sin", "hour_cos", "day_sin", "day_cos"]

    def _prepare_data(self, df: pd.DataFrame, is_training: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extracts features, scales them, and constructs sliding windows.
        """
        # Ensure time features are engineered
        df = df.copy().sort_values("timestamp")
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
        df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
        df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)

        feature_data = df[self.features].values
        target_data = df["energy_kwh"].values

        if is_training:
            scaled_features = self.scaler_x.fit_transform(feature_data)
            self.scaler_y.fit(target_data)
        else:
            scaled_features = self.scaler_x.transform(feature_data)

        # Create window sequences
        X, y = create_lstm_windows(
            scaled_features, 
            features_dim=len(self.features), 
            window_size=self.window_size, 
            horizon=self.horizon
        )
        return X, y

    def fit(self, df: pd.DataFrame):
        """
        Trains the LSTM model on historical data.
        """
        # Justify in code comments: LSTM captures long-term temporal dependencies well but needs more training data/time
        # (per Wang et al. Table 2). It performs sequential backpropagation through time.
        X, y = self._prepare_data(df, is_training=True)
        
        if len(X) == 0:
            raise ValueError("Insufficient data to build windows. Check historical duration.")

        input_dim = X.shape[2]
        output_dim = y.shape[1]
        
        self.model = LSTMNet(
            input_dim=input_dim, 
            hidden_dim=self.hidden_dim, 
            num_layers=self.num_layers, 
            output_dim=output_dim
        ).to(self.device)
        
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=self.lr)

        # Training loop
        self.model.train()
        dataset_len = len(X)
        
        for epoch in range(self.epochs):
            # Shuffle indices
            indices = np.arange(dataset_len)
            np.random.shuffle(indices)
            
            epoch_loss = 0.0
            for start_idx in range(0, dataset_len, self.batch_size):
                batch_indices = indices[start_idx : start_idx + self.batch_size]
                
                batch_X = torch.tensor(X[batch_indices], dtype=torch.float32).to(self.device)
                batch_y = torch.tensor(y[batch_indices], dtype=torch.float32).to(self.device)
                
                # Forward pass
                outputs = self.model(batch_X)
                loss = criterion(outputs, batch_y)
                
                # Backward and optimize
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item() * len(batch_indices)
                
            epoch_loss /= dataset_len
            
        return self

    def forecast(self, history_df: pd.DataFrame) -> np.ndarray:
        """
        Generates forecast for next `horizon` values using the sliding window of history.
        """
        if self.model is None:
            raise ValueError("Model is not fitted.")
            
        self.model.eval()
        
        # Prepare inputs (must be exactly window_size records)
        # We don't care about y in evaluation, we just want to scale X
        history_df = history_df.copy().sort_values("timestamp")
        if len(history_df) < self.window_size:
            raise ValueError(f"History must contain at least {self.window_size} rows.")
            
        history_df = history_df.iloc[-self.window_size:]
        
        # Engineer features on history
        history_df["hour"] = history_df["timestamp"].dt.hour
        history_df["day_of_week"] = history_df["timestamp"].dt.dayofweek
        history_df["hour_sin"] = np.sin(2 * np.pi * history_df["hour"] / 24.0)
        history_df["hour_cos"] = np.cos(2 * np.pi * history_df["hour"] / 24.0)
        history_df["day_sin"] = np.sin(2 * np.pi * history_df["day_of_week"] / 7.0)
        history_df["day_cos"] = np.cos(2 * np.pi * history_df["day_of_week"] / 7.0)

        features_data = history_df[self.features].values
        scaled_features = self.scaler_x.transform(features_data)
        
        # Shape: (1, window_size, num_features)
        input_tensor = torch.tensor(scaled_features, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            prediction_scaled = self.model(input_tensor).cpu().numpy().flatten()
            
        # Inverse transform y
        prediction = self.scaler_y.inverse_transform(prediction_scaled)
        # Post-process (no negative energy)
        prediction = np.clip(prediction, 0.0, None)
        return prediction
