from backend.app.carbon.calculator import calculate_carbon_for_interval
from backend.app.config import settings

def test_carbon_interval_calculations():
    # Emission factor default = 0.82
    factor = settings.CARBON_EMISSION_FACTOR
    
    # Case 1: Load exceeds renewables
    load = 10.0 # kWh
    renewable = 4.0 # kWh
    
    res = calculate_carbon_for_interval(load, renewable)
    
    assert res["gross_emissions_kg"] == round(10.0 * factor, 4)
    assert res["avoided_emissions_kg"] == round(4.0 * factor, 4)
    assert res["net_emissions_kg"] == round(6.0 * factor, 4)

    # Case 2: Renewables exceed load
    load = 5.0
    renewable = 8.0
    
    res_exceeds = calculate_carbon_for_interval(load, renewable)
    
    assert res_exceeds["gross_emissions_kg"] == round(5.0 * factor, 4)
    # Avoided is capped at load (since we can only avoid what we would have drawn)
    assert res_exceeds["avoided_emissions_kg"] == round(5.0 * factor, 4)
    assert res_exceeds["net_emissions_kg"] == 0.0
