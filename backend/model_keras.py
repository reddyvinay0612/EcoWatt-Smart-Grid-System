# Reference Keras implementation for BE Major Project report
# This matches the TensorFlow/Keras architecture requested in the project prompt.
# Since the local environment uses Python 3.14 (which has no prebuilt TensorFlow support on PyPI),
# the active runtime loads and runs the equivalent PyTorch models in model.py.

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout

def build_cnn_lstm_model(input_shape):
    """
    Keras CNN-LSTM Hybrid Model architecture.
    """
    model = Sequential([
        Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape),
        MaxPooling1D(pool_size=2),
        Conv1D(filters=32, kernel_size=3, activation='relu'),
        LSTM(100, return_sequences=True),
        Dropout(0.2),
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        Dense(25, activation='relu'),
        Dense(1)  # forecasted consumption value (kWh)
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def build_plain_lstm_model(input_shape):
    """
    Plain LSTM baseline model.
    """
    model = Sequential([
        LSTM(100, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def build_plain_ann_model(input_shape):
    """
    Plain ANN baseline model.
    """
    model = Sequential([
        Dense(64, activation='relu', input_shape=input_shape),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model
