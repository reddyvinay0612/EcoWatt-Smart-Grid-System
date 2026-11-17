# Solar Energy Adoption & Payback Calculator Engine
# Based on India PM Surya Ghar Muft Bijli Yojana Guidelines

class SolarCalculator:
    def __init__(
        self,
        cost_per_kw_inr: float = 60000.0,
        electricity_tariff_inr: float = 7.50,
        grid_emission_factor: float = 0.82,  # kg CO2 / kWh
        default_performance_ratio: float = 0.78  # PR accounts for temperature/inverter losses
    ):
        self.cost_per_kw_inr = cost_per_kw_inr
        self.electricity_tariff_inr = electricity_tariff_inr
        self.grid_emission_factor = grid_emission_factor
        self.performance_ratio = default_performance_ratio

    def calculate_generation_and_savings(
        self,
        capacity_kw: float,
        ghi_irradiance: float = 4.5,  # kWh/m^2/day GHI
        days: int = 30
    ) -> dict:
        """
        Calculates monthly energy generation, financial savings, and carbon offset.
        Formula: Generation (kWh) = Capacity (kW) * GHI (kWh/m2/day) * PR * Days
        """
        # Daily generation in kWh
        daily_generation = capacity_kw * ghi_irradiance * self.performance_ratio
        monthly_generation = daily_generation * days
        
        monthly_savings = monthly_generation * self.electricity_tariff_inr
        avoided_co2 = monthly_generation * self.grid_emission_factor
        
        return {
            "monthly_generation_kwh": round(monthly_generation, 2),
            "monthly_savings_inr": round(monthly_savings, 2),
            "avoided_co2_kg_monthly": round(avoided_co2, 2)
        }

    def recommend_solar_sizing_and_payback(
        self,
        monthly_grid_consumption_kwh: float,
        usable_roof_area_sqm: float = 100.0,
        ghi_irradiance: float = 4.5
    ) -> dict:
        """
        Determines recommended solar capacity and calculates payback periods under PM Surya Ghar.
        
        PM Surya Ghar Subsidy Structure:
        - 1 kW to 2 kW: Rs. 30,000 per kW
        - 3 kW and above: Rs. 18,000 per additional kW up to 3 kW (Capped at Rs. 78,000 total)
        """
        # 1. Determine recommended capacity based on consumption
        if monthly_grid_consumption_kwh <= 150:
            recommended_capacity = 1.5  # 1-2 kW recommended
        elif monthly_grid_consumption_kwh <= 300:
            recommended_capacity = 2.5  # 2-3 kW recommended
        else:
            recommended_capacity = 3.0  # 3+ kW recommended
            
        # Physical constraint check (assuming 10 sqm per 1 kW)
        max_physical_capacity = usable_roof_area_sqm / 10.0
        if recommended_capacity > max_physical_capacity:
            recommended_capacity = max(1.0, math.floor(max_physical_capacity * 2) / 2) # round to nearest 0.5 kW

        # 2. Calculate PM Surya Ghar Subsidy
        if recommended_capacity <= 2.0:
            subsidy = recommended_capacity * 30000.0
        else:
            # First 2 kW gets Rs. 60,000, next up to 3 kW gets Rs. 18,000 per kW
            additional_kw = min(1.0, recommended_capacity - 2.0)
            subsidy = 60000.0 + (additional_kw * 18000.0)
            
        # Capping central subsidy at Rs. 78,000
        subsidy = min(78000.0, subsidy)

        # 3. Cost & Payback Sizing
        gross_cost = recommended_capacity * self.cost_per_kw_inr
        net_investment = max(0.0, gross_cost - subsidy)
        
        # Sizing monthly generation metrics
        metrics = self.calculate_generation_and_savings(recommended_capacity, ghi_irradiance)
        annual_savings = metrics["monthly_savings_inr"] * 12
        
        payback_years = net_investment / annual_savings if annual_savings > 0 else 99
        
        return {
            "recommended_capacity_kw": recommended_capacity,
            "system_gross_cost_inr": round(gross_cost, 2),
            "pm_surya_ghar_subsidy_inr": round(subsidy, 2),
            "net_investment_inr": round(net_investment, 2),
            "monthly_generation_kwh": metrics["monthly_generation_kwh"],
            "monthly_savings_inr": metrics["monthly_savings_inr"],
            "avoided_co2_kg_monthly": metrics["avoided_co2_kg_monthly"],
            "payback_years": round(payback_years, 2)
        }

    def generate_non_solar_optimization_strategies(self, monthly_grid_consumption_kwh: float) -> list:
        """
        Generates 3 tailored non-solar demand side energy optimization strategies.
        """
        is_high_user = monthly_grid_consumption_kwh > 300.0
        
        strategies = [
            {
                "title": "⚡ Time-of-Use (ToU) Load Shifting",
                "recommendation": "Shift heavy loads (washing machines, EV chargers, water pumps) to off-peak afternoon solar hours (10:00 AM - 3:00 PM).",
                "estimated_bill_reduction_percentage": 8.0
            },
            {
                "title": "🌡️ Smart HVAC Setpoint Routines",
                "recommendation": "Adjust AC thermostat baseline to 24-25°C. Utilize smart thermostat scheduling to automatically raise the target temp during sleep cycles.",
                "estimated_bill_reduction_percentage": 10.0 if is_high_user else 5.0
            },
            {
                "title": "🔌 Vampire Load / Standby Power Automation",
                "recommendation": "Deploy smart plugs to completely cut standby power of entertainment systems, microwave ovens, and desktop monitors between 11:00 PM and 6:00 AM.",
                "estimated_bill_reduction_percentage": 6.0
            }
        ]
        return strategies
import math
