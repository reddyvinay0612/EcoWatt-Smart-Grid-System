import os
import json
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from data_pipeline import create_sequences, preprocess_pipeline
from model import CnnLstmModel, PlainLstmModel, PlainAnnModel, load_pytorch_model, device

def evaluate_model(y_true, y_pred):
    """
    Computes regression evaluation metrics: RMSE, MAE, MAPE, and R2.
    """
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    
    # Avoid division by zero in MAPE
    y_true_safe = np.where(y_true == 0, 1e-5, y_true)
    mape = float(np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100)
    
    r2 = float(r2_score(y_true, y_pred))
    return {"RMSE": rmse, "MAE": mae, "MAPE": mape, "R2": r2}

def run_evaluation():
    print("Running model evaluation pipeline...")
    
    # 1. Load data
    dfs = preprocess_pipeline()
    seq_data = create_sequences(dfs["HH_001"])
    X_test = seq_data["X_test"]
    y_test = seq_data["y_test"]
    input_dim = X_test.shape[2]
    
    # Convert test features to torch tensor
    X_test_tensor = torch.tensor(X_test, dtype=torch.float32).to(device)
    
    # 2. Load trained models
    cnn_lstm = load_pytorch_model(CnnLstmModel, "backend/models/cnn_lstm_model.pth", input_dim=input_dim)
    plain_lstm = load_pytorch_model(PlainLstmModel, "backend/models/plain_lstm_model.pth", input_dim=input_dim)
    plain_ann = load_pytorch_model(PlainAnnModel, "backend/models/plain_ann_model.pth", input_dim=input_dim, seq_len=24)
    
    # 3. Generate predictions
    with torch.no_grad():
        pred_cnn_lstm = cnn_lstm(X_test_tensor).cpu().numpy().squeeze()
        pred_plain_lstm = plain_lstm(X_test_tensor).cpu().numpy().squeeze()
        pred_plain_ann = plain_ann(X_test_tensor).cpu().numpy().squeeze()
        
    # Inverse transform predictions back to raw kWh values if needed
    # (Since scaler is MinMaxScaler, let's inverse transform for accurate evaluation)
    scaler = seq_data["scaler"]
    feature_idx = seq_data["feature_cols"].index("energy_kwh")
    
    # Helper to inverse transform single target vector
    def inverse_transform_target(y_arr):
        dummy = np.zeros((len(y_arr), len(seq_data["feature_cols"])))
        dummy[:, feature_idx] = y_arr
        return scaler.inverse_transform(dummy)[:, feature_idx]
        
    y_test_raw = inverse_transform_target(y_test)
    pred_cnn_lstm_raw = inverse_transform_target(pred_cnn_lstm)
    pred_plain_lstm_raw = inverse_transform_target(pred_plain_lstm)
    pred_plain_ann_raw = inverse_transform_target(pred_plain_ann)
    
    # 4. Evaluate metrics
    metrics_cnn_lstm = evaluate_model(y_test_raw, pred_cnn_lstm_raw)
    metrics_plain_lstm = evaluate_model(y_test_raw, pred_plain_lstm_raw)
    metrics_plain_ann = evaluate_model(y_test_raw, pred_plain_ann_raw)
    
    comparison = {
        "CNN-LSTM": metrics_cnn_lstm,
        "Plain LSTM": metrics_plain_lstm,
        "Plain ANN": metrics_plain_ann
    }
    
    # Save comparison report as JSON
    os.makedirs("backend/data", exist_ok=True)
    with open("backend/data/model_comparison.json", "w") as f:
        json.dump(comparison, f, indent=4)
    print("Saved comparison table to backend/data/model_comparison.json:")
    print(json.dumps(comparison, indent=2))
    
    # 5. Plot actual vs predicted (first 100 hours of test set for clarity)
    plt.figure(figsize=(12, 6))
    slice_len = min(120, len(y_test_raw))
    
    plt.plot(y_test_raw[:slice_len], label="Actual Load (kWh)", color="#f1f5f9", linewidth=2.5)
    plt.plot(pred_cnn_lstm_raw[:slice_len], label="CNN-LSTM Hybrid Forecast", color="#7c3aed", linestyle="-", linewidth=2)
    plt.plot(pred_plain_lstm_raw[:slice_len], label="Plain LSTM Forecast", color="#3b82f6", linestyle="--", linewidth=1.5)
    plt.plot(pred_plain_ann_raw[:slice_len], label="Plain ANN Forecast", color="#10b981", linestyle=":", linewidth=1.5)
    
    # Customize styling matching dark theme dashboard
    plt.gcf().patch.set_facecolor('#0f172a')
    plt.gca().set_facecolor('#1e293b')
    plt.title("Actual vs Predicted Residential Electricity Consumption", color="#ffffff", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Time (Hours)", color="#94a3b8", labelpad=10)
    plt.ylabel("Electricity Load (kWh)", color="#94a3b8", labelpad=10)
    plt.tick_params(colors="#94a3b8")
    plt.grid(True, color="#334155", linestyle=":", alpha=0.6)
    
    legend = plt.legend(facecolor="#0f172a", edgecolor="#334155")
    for text in legend.get_texts():
        text.set_color("#ffffff")
        
    plt.tight_layout()
    plt.savefig("backend/data/evaluation_plot.png", dpi=150, facecolor='#0f172a')
    plt.close()
    print("Saved comparative plot to backend/data/evaluation_plot.png")

if __name__ == "__main__":
    run_evaluation()
