import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.pipeline.solar_detection import SolarPanelDetector
from backend.app.optimize.solar_calculator import SolarCalculator
from backend.app.main import app

client = TestClient(app)

def test_solar_panel_detector_area_conversion():
    detector = SolarPanelDetector()
    
    # 100 sqm roof footprint with 40% utilization factor should output 4 kW
    capacity_kw = detector.convert_roof_footprint_to_kw(roof_area_sqm=100.0, utilization_ratio=0.40)
    assert capacity_kw == 4.0

    # Shoelace formula test for a standard 10x10 square pixel panel
    pts = np.array([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10]
    ])
    pixel_area = detector._calculate_polygon_pixel_area(pts)
    assert pixel_area == 100.0

def test_solar_calculator_payback_and_subsidy():
    calculator = SolarCalculator(cost_per_kw_inr=60000.0, electricity_tariff_inr=7.50)
    
    # 1. Low usage household sizing check (<150 units)
    res_low = calculator.recommend_solar_sizing_and_payback(monthly_grid_consumption_kwh=100.0, usable_roof_area_sqm=50.0)
    assert res_low["recommended_capacity_kw"] == 1.5
    # Subsidy: 1.5 kW * Rs. 30,000 = Rs. 45,000
    assert res_low["pm_surya_ghar_subsidy_inr"] == 45000.0
    assert res_low["system_gross_cost_inr"] == 90000.0
    assert res_low["net_investment_inr"] == 45000.0

    # 2. High usage household sizing check (>300 units)
    res_high = calculator.recommend_solar_sizing_and_payback(monthly_grid_consumption_kwh=400.0, usable_roof_area_sqm=100.0)
    assert res_high["recommended_capacity_kw"] == 3.0
    # Subsidy: First 2 kW (Rs. 60,000) + 1 kW (Rs. 18,000) = Rs. 78,000
    assert res_high["pm_surya_ghar_subsidy_inr"] == 78000.0
    assert res_high["net_investment_inr"] == (180000.0 - 78000.0)

    # 3. Payback years verification
    assert res_high["payback_years"] > 0
    assert res_high["payback_years"] < 20

def test_solar_api_endpoints():
    # 1. National summary GET
    res = client.get("/api/v1/solar-analytics/national-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["country"] == "India"
    assert "solar_installed_count" in data
    assert "solar_adoption_rate_percentage" in data

    # 2. State metrics GET (test popular states in mock dataset)
    res_state = client.get("/api/v1/solar-analytics/state/Karnataka")
    assert res_state.status_code == 200
    data_state = res_state.json()
    assert data_state["state_name"] == "Karnataka"
    assert len(data_state["districts"]) > 0

    # 3. Optimization calculator POST
    payload = {
        "monthly_grid_consumption_kwh": 250.0,
        "usable_roof_area_sqm": 80.0,
        "ghi_irradiance": 4.8
    }
    res_opt = client.post("/api/v1/solar-analytics/optimize-household", json=payload)
    assert res_opt.status_code == 200
    data_opt = res_opt.json()
    assert data_opt["recommended_capacity_kw"] == 2.5
    assert len(data_opt["non_solar_strategies"]) == 3
    assert data_opt["payback_years"] > 0
