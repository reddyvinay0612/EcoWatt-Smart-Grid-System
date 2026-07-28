import numpy as np
import pandas as pd
from typing import Union, List

class SeasonalNaiveModel:
    """
    Seasonal Naive Baseline Model.
    Predicts the load of the current hour/day as the actual load from the same time in the previous day/week.
    By default, uses a 24-hour cycle (96 intervals of 15 minutes).
    """
    def __init__(self, seasonal_period: int = 96):
        self.seasonal_period = seasonal_period
        self.history = None

    def fit(self, y: Union[np.ndarray, pd.Series, List[float]]):
        """
        Fits the model by storing historical values.
        """
        self.history = np.array(y).flatten()
        return self

    def predict(self, horizon: int = 96) -> np.ndarray:
        """
        Predicts next `horizon` values.
        Looks at the same intervals in the previous cycle of history.
        """
        if self.history is None or len(self.history) == 0:
            raise ValueError("Model has not been fitted yet.")

        predictions = []
        n_history = len(self.history)
        
        for i in range(horizon):
            # Target index is `horizon` steps back from the end of history
            # cyclical calculation: i-th step ahead matches (n_history - seasonal_period + (i % seasonal_period))
            history_idx = n_history - self.seasonal_period + (i % self.seasonal_period)
            if history_idx >= 0:
                predictions.append(self.history[history_idx])
            else:
                # Fallback to the last available value if history is shorter than seasonal_period
                predictions.append(self.history[-1])
                
        return np.array(predictions)
