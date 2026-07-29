from scipy.optimize import minimize

/**
 * Optimizes clean energy investment allocations to minimize carbon emissions under budget constraints.
 * 
 * Coefficient Assumptions (Illustrative Estimates):
 * - Solar adoption impact (0.40): Shifting to solar reduces grid emissions by 40% per unit solar capacity.
 * - Efficiency upgrade impact (0.15): Efficiency upgrades decrease energy demand by 15%, lowering emissions by 15%.
 * - Demand shift impact (0.05): Smart metering and peak load shifting reduce emissions by 5% through peak shaving.
 * 
 * Budget Costs:
 * - x[0] (Solar adoption rate): Costs ₹50 per 1% adoption.
 * - x[1] (Efficiency upgrade rate): Costs ₹30 per 1% adoption.
 * - x[2] (Demand shift rate): Costs ₹20 per 1% adoption.
 */
def optimize_energy_mix(current_consumption, current_emission, budget_constraint):
    # Decision variables: x = [solar_rate, efficiency_rate, demand_shift_rate]
    def objective(x):
        solar, efficiency, demand_shift = x
        # 0.4 represents carbon reduction impact factor of solar grid penetration
        # 0.15 represents carbon reduction impact factor of BEE efficiency upgrades
        # 0.05 represents carbon reduction impact of load peak-shaving
        projected_emission = current_emission * (1 - solar * 0.40 - efficiency * 0.15 - demand_shift * 0.05)
        return projected_emission

    # Budget constraint: solar_cost*50 + efficiency_cost*30 + demand_shift_cost*20 <= budget_constraint
    # Or: budget_constraint - cost >= 0 (inequality constraint in scipy)
    constraints = [
        {"type": "ineq", "fun": lambda x: budget_constraint - (x[0] * 50 + x[1] * 30 + x[2] * 20)}
    ]
    
    # Rates must be between 0 (0% adoption) and 1 (100% adoption limit)
    bounds = [(0, 1), (0, 1), (0, 1)]
    
    # Initialize optimization variables at 30% each
    x0 = [0.3, 0.3, 0.3]
    
    result = minimize(objective, x0=x0, bounds=bounds, constraints=constraints)
    
    # Calculate corresponding projected electricity consumption reduction
    # Efficiency upgrades reduce total consumption directly (e.g. 15% max reduction)
    # Demand shift shifts peak loads but also reduces wastage slightly (e.g. 5% max reduction)
    rates = result.x
    projected_consumption = current_consumption * (1 - rates[1] * 0.15 - rates[2] * 0.05)
    
    return rates, result.fun, projected_consumption
