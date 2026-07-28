import numpy as np
import random
from typing import Tuple, List, Dict

class LoadShiftingEnv:
    """
    Simulated battery storage and grid load-shifting environment.
    State representation:
    - Hour: 0 to 23
    - Grid Price Tier: 0 (Low: ₹4/kWh), 1 (Medium: ₹7.5/kWh), 2 (Peak: ₹11/kWh)
    - Solar Availability: 0 (Low/None), 1 (High solar irradiance)
    
    Total states = 24 * 3 * 2 = 144
    
    Actions:
    - 0: Do Nothing (Direct Grid Consumption)
    - 1: Charge Battery (Shift load up when price is low / solar is high)
    - 2: Discharge Battery (Shift load down when price is peak to offset grid draw)
    """
    def __init__(self):
        self.battery_capacity_kwh = 50.0
        self.battery_charge_max_kw = 10.0
        self.soc = 25.0  # State of Charge (kWh)
        self.base_loads = [
            15, 12, 10, 10, 12, 18, 30, 45, 50, 48, 
            40, 35, 30, 32, 35, 38, 45, 55, 65, 70, 
            60, 45, 30, 20
        ]  # Standard daily commercial/residential load profile
        self.prices = [
            4.0, 4.0, 4.0, 4.0, 4.0, 7.5, 7.5, 7.5, 7.5, 7.5,
            7.5, 4.0, 4.0, 4.0, 7.5, 7.5, 7.5, 11.0, 11.0, 11.0,
            11.0, 7.5, 7.5, 4.0
        ]  # Time-of-use pricing structure
        self.solar_profile = [
            0, 0, 0, 0, 0, 0, 10, 25, 40, 45,
            50, 52, 50, 45, 35, 20, 5, 0, 0, 0,
            0, 0, 0, 0
        ]  # Typical solar generation profile (kW)
        self.current_hour = 0

    def reset(self) -> Tuple[int, int, int]:
        self.soc = 25.0
        self.current_hour = 0
        return self._get_state_components()

    def _get_state_components(self) -> Tuple[int, int, int]:
        hour = self.current_hour
        
        # Determine price tier
        price = self.prices[hour]
        if price <= 4.0:
            price_tier = 0
        elif price <= 7.5:
            price_tier = 1
        else:
            price_tier = 2
            
        # Determine solar availability
        solar = self.solar_profile[hour]
        solar_avail = 1 if solar > 20 else 0
        
        return hour, price_tier, solar_avail

    def get_state_index(self, hour: int, price_tier: int, solar_avail: int) -> int:
        # Map tuple components into a flat state index [0 - 143]
        return hour * 6 + price_tier * 2 + solar_avail

    def step(self, action: int) -> Tuple[int, float, bool]:
        """
        Executes one step in the environment.
        - Action 0: Do Nothing (Direct Grid Consumption)
        - Action 1: Charge Battery (Shift load up)
        - Action 2: Discharge Battery (Shift load down / discharge battery)
        """
        hour = self.current_hour
        base_load = self.base_loads[hour]
        price = self.prices[hour]
        solar = self.solar_profile[hour]

        # Calculate actual net load before battery adjustment
        net_load_no_battery = max(0.0, base_load - solar)
        grid_draw = net_load_no_battery
        battery_change = 0.0

        if action == 1:  # Charge
            # Can charge if battery is not full
            charge_amt = min(self.battery_charge_max_kw, self.battery_capacity_kwh - self.soc)
            self.soc += charge_amt
            grid_draw += charge_amt
            battery_change = charge_amt
        elif action == 2:  # Discharge
            # Can discharge if battery has power
            discharge_amt = min(self.battery_charge_max_kw, self.soc)
            self.soc -= discharge_amt
            grid_draw = max(0.0, grid_draw - discharge_amt)
            battery_change = -discharge_amt

        # Calculate Reward (negative of grid cost + carbon footprint penalty)
        carbon_factor = 0.82
        cost = grid_draw * price
        emissions = grid_draw * carbon_factor
        
        # Carbon penalty factor = ₹5 per kg of CO2
        reward = -(cost + emissions * 5.0)

        # Transition to next hour
        self.current_hour = (self.current_hour + 1) % 24
        next_state_components = self._get_state_components()
        next_state_idx = self.get_state_index(*next_state_components)
        
        done = (self.current_hour == 0)  # Complete a 24-hour cycle
        
        return next_state_idx, reward, done

class QLearningAgent:
    """
    Q-Learning Agent to solve the load-shifting optimization problem.
    """
    def __init__(self, alpha: float = 0.1, gamma: float = 0.9, epsilon: float = 0.2):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.num_states = 144
        self.num_actions = 3
        self.q_table = np.zeros((self.num_states, self.num_actions))

    def choose_action(self, state_idx: int) -> int:
        if random.random() < self.epsilon:
            return random.randint(0, self.num_actions - 1)
        return int(np.argmax(self.q_table[state_idx]))

    def learn(self, state_idx: int, action: int, reward: float, next_state_idx: int):
        q_predict = self.q_table[state_idx, action]
        q_target = reward + self.gamma * np.max(self.q_table[next_state_idx])
        self.q_table[state_idx, action] += self.alpha * (q_target - q_predict)

def train_rl_agent(episodes: int = 1500) -> Dict[str, List]:
    """
    Trains the Q-learning agent and collects learning statistics 
    along with a comparison of pre- vs post-optimization grid loads.
    """
    env = LoadShiftingEnv()
    agent = QLearningAgent()
    
    episode_rewards = []
    
    # Train loop
    for ep in range(episodes):
        state_comp = env.reset()
        state_idx = env.get_state_index(*state_comp)
        done = False
        total_reward = 0
        
        # Decay epsilon
        agent.epsilon = max(0.01, 0.2 * (1 - ep / episodes))

        while not done:
            action = agent.choose_action(state_idx)
            next_state_idx, reward, done = env.step(action)
            agent.learn(state_idx, action, reward, next_state_idx)
            state_idx = next_state_idx
            total_reward += reward
            
        if ep % 50 == 0 or ep == episodes - 1:
            episode_rewards.append(float(round(total_reward, 2)))

    # Evaluate the final policy to generate comparative profiles
    state_comp = env.reset()
    state_idx = env.get_state_index(*state_comp)
    done = False
    
    baseline_load = []
    optimized_load = []
    prices_list = []
    soc_history = []
    actions_taken = []
    
    while not done:
        hour = env.current_hour
        base_load = env.base_loads[hour]
        solar = env.solar_profile[hour]
        net_load = max(0.0, base_load - solar)
        baseline_load.append(round(net_load, 2))
        
        # Greedy choice
        action = int(np.argmax(agent.q_table[state_idx]))
        actions_taken.append(action)
        
        soc_history.append(round(env.soc, 2))
        prices_list.append(env.prices[hour])
        
        # Execute in environment
        next_state_idx, _, done = env.step(action)
        
        # Calculate resulting grid draw for optimized path
        opt_net_load = net_load
        if action == 1:
            opt_net_load += min(env.battery_charge_max_kw, env.battery_capacity_kwh - env.soc)
        elif action == 2:
            opt_net_load = max(0.0, opt_net_load - min(env.battery_charge_max_kw, env.soc))
        optimized_load.append(round(opt_net_load, 2))
        
        state_idx = next_state_idx

    return {
        "episode_rewards": episode_rewards,
        "hours": list(range(24)),
        "baseline_grid_load": baseline_load,
        "optimized_grid_load": optimized_load,
        "electricity_price": prices_list,
        "battery_soc": soc_history,
        "actions": actions_taken
    }
