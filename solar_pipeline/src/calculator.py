# Physics-based Energy Offset and Solar ROI Recommender Engine
import math

class SolarEnergyCalculator:
    def __init__(
        self,
        cost_per_kw_inr: float = 60000.0,
        electricity_tariff_inr: float = 7.50,
        grid_emission_factor: float = 0.82  # kg CO2 / kWh
    ):
        self.cost_per_kw_inr = cost_per_kw_inr
        self.electricity_tariff_inr = electricity_tariff_inr
        self.grid_emission_factor = grid_emission_factor

    def estimate_kwh_generation(
        self,
        panel_capacity_kw: float,
        local_irradiance_ghi: float,
        performance_ratio: float = 0.78,
        days: int = 30
    ) -> float:
        """
        Physics-based estimation of electricity generated (kWh) by a rooftop system.
        Formula: E = P_peak * GHI_daily * PR * Days
        """
        daily_generation = panel_capacity_kw * local_irradiance_ghi * performance_ratio
        monthly_generation = daily_generation * days
        return round(monthly_generation, 2)

    def calculate_electricity_offset(
        self,
        generation_kwh: float,
        average_household_consumption_kwh: float
    ) -> dict:
        """
        Compares solar generation against average household grid consumption to compute offsets.
        """
        if average_household_consumption_kwh <= 0:
            return {"offset_percentage": 0.0, "net_consumption_kwh": 0.0}
            
        offset_pct = (generation_kwh / average_household_consumption_kwh) * 100.0
        net_cons = max(0.0, average_household_consumption_kwh - generation_kwh)
        
        return {
            "offset_percentage": round(min(100.0, offset_pct), 2),
            "net_consumption_kwh": round(net_cons, 2)
        }

    def recommend_solar_and_roi(
        self,
        monthly_grid_consumption_kwh: float,
        usable_roof_area_sqm: float,
        ghi_irradiance: float = 4.5
    ) -> dict:
        """
        Recommends Solar Capacity and financial payback metrics based on PM Surya Ghar guidelines.
        """
        # Sizing rules based on PM Surya Ghar guidelines
        if monthly_grid_consumption_kwh <= 150:
            recommended_kw = 1.5
        elif monthly_grid_consumption_kwh <= 300:
            recommended_kw = 2.5
        else:
            recommended_kw = 3.0

        # Physical sizing check: 1 kW takes approx 10 sqm
        max_possible_kw = usable_roof_area_sqm / 10.0
        if recommended_kw > max_possible_kw:
            recommended_kw = max(1.0, math.floor(max_possible_kw * 2) / 2) # Round to nearest 0.5 kW

        # PM Surya Ghar Subsidy
        if recommended_kw <= 2.0:
            subsidy = recommended_kw * 30000.0
        else:
            subsidy = 60000.0 + (min(1.0, recommended_kw - 2.0) * 18000.0)
        subsidy = min(78000.0, subsidy)

        gross_cost = recommended_kw * self.cost_per_kw_inr
        net_cost = max(0.0, gross_cost - subsidy)

        # Output estimations
        monthly_gen = self.estimate_kwh_generation(recommended_kw, ghi_irradiance)
        monthly_savings = monthly_gen * self.electricity_tariff_inr
        annual_savings = monthly_savings * 12

        payback_years = net_cost / annual_savings if annual_savings > 0 else 0.0

        return {
            "recommended_capacity_kw": recommended_kw,
            "system_gross_cost_inr": round(gross_cost, 2),
            "pm_surya_ghar_subsidy_inr": round(subsidy, 2),
            "net_investment_inr": round(net_cost, 2),
            "est_monthly_generation_kwh": monthly_gen,
            "est_monthly_savings_inr": round(monthly_savings, 2),
            "payback_years": round(payback_years, 2)
        }

    def generate_optimization_tips(self, monthly_grid_consumption_kwh: float) -> list:
        """
        Generates 3 to 5 tailored electricity optimization recommendations.
        """
        tips = []
        
        # Tip 1: Base load-shifting tip (universal)
        tips.append({
            "category": "Load Shifting",
            "tip": "Time heavy appliances (washing machine, dishwasher, water pumps) to run between 10:00 AM and 3:00 PM to maximize direct solar usage.",
            "estimated_savings_pct": 8
        })

        if monthly_grid_consumption_kwh > 300:
            # High consumption household tips
            tips.append({
                "category": "HVAC Setpoints",
                "tip": "Raise your Air Conditioner temperature to 24-25°C. Every degree increase saves approximately 6% on cooling costs.",
                "estimated_savings_pct": 12
            })
            tips.append({
                "category": "Solar Thermal",
                "tip": "Consider replacing electric geysers with a Solar Water Heating system. Water heating accounts for ~15% of grid bills.",
                "estimated_savings_pct": 10
            })
            tips.append({
                "category": "BEE Star Rating",
                "tip": "Transition to BEE 5-star rated ceiling fans and inverter AC units, yielding a 30-40% savings on major continuous loads.",
                "estimated_savings_pct": 15
            })
        else:
            # Low to moderate consumption household tips
            tips.append({
                "category": "Vampire Loads",
                "tip": "Unplug standby electronics (routers, TV, microwave, chargers) overnight. Vampire loads contribute to ~5-10% of standard bills.",
                "estimated_savings_pct": 7
            })
            tips.append({
                "category": "LED Retrofit",
                "tip": "Upgrade remaining incandescent or CFL bulbs to efficient LEDs. This can decrease lighting energy demands by up to 80%.",
                "estimated_savings_pct": 10
            })
            tips.append({
                "category": "Natural Ventilation",
                "tip": "Maximize cross-ventilation during early morning and late evening hours to naturally pre-cool the house, reducing early night AC usage.",
                "estimated_savings_pct": 6
            })

        return tips

if __name__ == "__main__":
    # Test script verification
    calc = SolarEnergyCalculator()
    gen = calc.estimate_kwh_generation(panel_capacity_kw=3.0, local_irradiance_ghi=5.0)
    print(f"Test Generation: {gen} kWh/month (Expected: ~351.0)")
    
    offset = calc.calculate_electricity_offset(gen, average_household_consumption_kwh=400)
    print(f"Test Offset: {offset['offset_percentage']}% (Expected: ~87.75%)")
    
    recommendation = calc.recommend_solar_and_roi(monthly_grid_consumption_kwh=250.0, usable_roof_area_sqm=50.0)
    print("Test Recommendation Payback:", recommendation["payback_years"], "years")
