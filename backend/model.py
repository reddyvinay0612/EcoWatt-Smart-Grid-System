import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

# Check device (GPU vs CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ─── 1. CNN-LSTM HYBRID MODEL (PyTorch equivalent) ───
class CnnLstmModel(nn.Module):
    def __init__(self, input_dim=8):
        super().__init__()
        # Keras filters=64, kernel_size=3
        self.conv1 = nn.Conv1d(in_channels=input_dim, out_channels=64, kernel_size=3)
        self.pool = nn.MaxPool1d(kernel_size=2)
        # Keras filters=32, kernel_size=3
        self.conv2 = nn.Conv1d(in_channels=64, out_channels=32, kernel_size=3)
        
        # LSTM input size is 32 channels. Hidden states: 100 and 50
        self.lstm1 = nn.LSTM(input_size=32, hidden_size=100, batch_first=True)
        self.lstm2 = nn.LSTM(input_size=100, hidden_size=50, batch_first=True)
        
        self.dropout = nn.Dropout(0.2)
        self.fc1 = nn.Linear(50, 25)
        self.fc2 = nn.Linear(25, 1)
        self.relu = nn.ReLU()

    def forward(self, x):
        # input shape: (batch, seq_len, features) -> (B, L, C)
        # PyTorch Conv1D expects shape (batch, channels, seq_len) -> (B, C, L)
        x = x.transpose(1, 2)
        x = self.relu(self.conv1(x))
        x = self.pool(x)
        x = self.relu(self.conv2(x))
        
        # Transpose back to (B, L_out, C_out) for LSTM
        x = x.transpose(1, 2)
        x, _ = self.lstm1(x)
        x = self.dropout(x)
        x, _ = self.lstm2(x)
        
        # return_sequences=False -> take the last output of the sequence
        x = x[:, -1, :]
        x = self.dropout(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# ─── 2. PLAIN LSTM BASELINE MODEL ───
class PlainLstmModel(nn.Module):
    def __init__(self, input_dim=8):
        super().__init__()
        self.lstm1 = nn.LSTM(input_size=input_dim, hidden_size=100, batch_first=True)
        self.lstm2 = nn.LSTM(input_size=100, hidden_size=50, batch_first=True)
        self.dropout = nn.Dropout(0.2)
        self.fc = nn.Linear(50, 1)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x = self.dropout(x)
        x, _ = self.lstm2(x)
        x = x[:, -1, :] # last sequence step
        x = self.dropout(x)
        x = self.fc(x)
        return x

# ─── 3. PLAIN ANN BASELINE MODEL ───
class PlainAnnModel(nn.Module):
    def __init__(self, input_dim=8, seq_len=24):
        super().__init__()
        # Flatten input: seq_len * input_dim
        self.flatten_dim = seq_len * input_dim
        self.fc1 = nn.Linear(self.flatten_dim, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.1)

    def forward(self, x):
        # Flatten x
        x = x.reshape(x.size(0), -1)
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

def train_pytorch_model(model, X_train, y_train, X_val, y_val, model_name="model", epochs=15, batch_size=64):
    """
    Trains a PyTorch model with early stopping.
    """
    print(f"\nTraining {model_name}...")
    model = model.to(device)
    
    # Convert numpy arrays to torch tensors
    train_dataset = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32), 
        torch.tensor(y_train, dtype=torch.float32)
    )
    val_dataset = TensorDataset(
        torch.tensor(X_val, dtype=torch.float32), 
        torch.tensor(y_val, dtype=torch.float32)
    )
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    best_val_loss = float('inf')
    patience = 4
    patience_counter = 0
    best_weights = None
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_x).squeeze()
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * batch_x.size(0)
            
        train_loss /= len(X_train)
        
        # Validation loss
        model.eval()
        with torch.no_grad():
            val_x = torch.tensor(X_val, dtype=torch.float32).to(device)
            val_y = torch.tensor(y_val, dtype=torch.float32).to(device)
            val_outputs = model(val_x).squeeze()
            val_loss = criterion(val_outputs, val_y).item()
            
        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {train_loss:.5f} - Val Loss: {val_loss:.5f}")
        
        # Early Stopping check
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping triggered. Best Val Loss: {best_val_loss:.5f}")
                break
                
    if best_weights:
        model.load_state_dict({k: v.to(device) for k, v in best_weights.items()})
        
    return model

def save_pytorch_model(model, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    torch.save(model.state_dict(), filepath)
    print(f"Saved PyTorch weights to {filepath}")

def load_pytorch_model(model_class, filepath, **kwargs):
    model = model_class(**kwargs)
    model.load_state_dict(torch.load(filepath, map_location=device))
    model.eval()
    return model.to(device)

if __name__ == "__main__":
    from data_pipeline import create_sequences, preprocess_pipeline
    
    # Preprocess and load sequence splits for HH_001 to train and verify
    dfs = preprocess_pipeline()
    seq_data = create_sequences(dfs["HH_001"])
    
    X_train, y_train = seq_data["X_train"], seq_data["y_train"]
    X_val, y_val = seq_data["X_val"], seq_data["y_val"]
    
    input_dim = X_train.shape[2]
    
    # 1. Train CNN-LSTM
    cnn_lstm = CnnLstmModel(input_dim=input_dim)
    cnn_lstm = train_pytorch_model(cnn_lstm, X_train, y_train, X_val, y_val, model_name="CNN-LSTM Hybrid", epochs=8)
    save_pytorch_model(cnn_lstm, "backend/models/cnn_lstm_model.pth")
    
    # 2. Train Plain LSTM
    lstm_model = PlainLstmModel(input_dim=input_dim)
    lstm_model = train_pytorch_model(lstm_model, X_train, y_train, X_val, y_val, model_name="Plain LSTM", epochs=8)
    save_pytorch_model(lstm_model, "backend/models/plain_lstm_model.pth")
    
    # 3. Train Plain ANN
    ann_model = PlainAnnModel(input_dim=input_dim, seq_len=24)
    ann_model = train_pytorch_model(ann_model, X_train, y_train, X_val, y_val, model_name="Plain ANN", epochs=8)
    save_pytorch_model(ann_model, "backend/models/plain_ann_model.pth")
    
    print("\nAll models trained and saved successfully in PyTorch!")
