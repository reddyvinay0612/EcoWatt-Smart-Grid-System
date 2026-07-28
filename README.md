# EcoWatt AI — Smart Grid Energy Consumption & Carbon Emission Optimization System

EcoWatt AI is an AI-driven Smart Energy Management System (SEMS) designed to optimize grid energy consumption, predict electricity load demands, detect anomaly signatures, and manage time-of-use (ToU) demand-response shifting to minimize carbon footprints.

This system is built from scratch to stand as a full-stack, B.E. (CSE/CSD) major project prototype.

---

## Technical Stack

*   **Backend**: Python 3.11, FastAPI, Uvicorn
*   **Database & ORM**: SQLite (for local development) / PostgreSQL (production), SQLAlchemy ORM
*   **Machine Learning (AI)**: PyTorch (LSTM sequence forecasters), XGBoost (renewable output & load trees), Scikit-Learn (Isolation Forest anomaly classification), Statsmodels (Seasonal Naive benchmarks)
*   **Scheduling**: APScheduler (real-time 15-minute sensor stream simulation)
*   **Frontend**: React (Vite), Tailwind CSS, Recharts (vector graph visualization), Lucide icons
*   **Containerization**: Docker & Docker Compose

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── app/config.py          # App configuration & parameters
│   │   ├── database.py            # SQLite/Postgre connection pools
│   │   ├── models.py              # SQLAlchemy DB Schemas
│   │   ├── schemas.py             # Pydantic validation schemas
│   │   ├── main.py                # FastAPI main entrypoint & background loop
│   │   ├── data_sim/              # Module 1: Weather & load simulators
│   │   ├── pipeline/              # Module 2: Preprocessing & windowing
│   │   ├── forecasting/           # Module 3: PyTorch LSTM & XGBoost engines
│   │   ├── anomalies/             # Module 4: Residuals + Isolation Forest detectors
│   │   ├── carbon/                # Module 5: Emissions & offsets calculators
│   │   ├── optimize/              # Module 6: DR recommender & Q-learning agents
│   │   └── routers/               # Endpoint routing controllers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Overview, Forecast, Anomalies, Carbon, Optimization, Reports
│   │   ├── services/api.js        # Axios API client
│   │   ├── index.css              # Custom styles
│   │   ├── main.jsx               # React entry point
│   │   └── App.jsx                # Layout & sidebar navigation
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docs/
│   ├── architecture.md            # PPT system architecture slide specs
│   ├── model_comparison.md        # AI vs Naive accuracy summary report
│   └── limitations.md             # Review boundaries & future research
├── docker-compose.yml
└── README.md
```

---

## Installation & Setup

### Option 1: Run Locally (Recommended for Development)

#### 1. Backend Setup
1. Open a terminal in `backend/` directory.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the database initialization and historical seeder script:
   ```bash
   python app/data_sim/generator.py
   ```
   *Note: This creates `ecowatt.db` and generates 6 months of 15-minute readings for 15 consumer nodes.*
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *API Swagger documentation will be available at: http://localhost:8000/docs*

#### 2. Frontend Setup
1. Open a terminal in `frontend/` directory.
2. Install Node packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Dashboard will be available at: http://localhost:5173*
   *Demo operator login credentials: `admin` / `admin123`*

---

### Option 2: Run via Docker Compose (Production Ready)

Start backend, frontend, and a dedicated PostgreSQL database container in one command:
```bash
docker-compose up --build
```
*Port mappings:*
*   Frontend: http://localhost
*   Backend REST API: http://localhost:8000
*   PostgreSQL Database: localhost:5432
