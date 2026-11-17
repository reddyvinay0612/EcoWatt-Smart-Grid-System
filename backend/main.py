import os
import sys

# Dynamic path resolution to support both 'app' and 'backend.app' namespaces
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Set PYTHONPATH environment variable for any spawned workers
os.environ["PYTHONPATH"] = f"{parent_dir};{current_dir}"

import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
