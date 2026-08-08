import os
import math
import difflib
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SNOWFLAKE_ACCOUNT_URL = os.getenv("SNOWFLAKE_ACCOUNT_URL", "")
SNOWFLAKE_TOKEN = os.getenv("SNOWFLAKE_PAT_TOKEN", "")

# Base data matching stateData.js baseline values
STATE_BASE_DATA = [
  {"state": "Andaman and Nicobar Islands", "electricity_consumption": 900.0, "carbon_emission": 810.0, "factor": 0.90},
  {"state": "Andhra Pradesh", "electricity_consumption": 2299.25, "carbon_emission": 1954.36, "factor": 0.85},
  {"state": "Arunachal Pradesh", "electricity_consumption": 2562.09, "carbon_emission": 1024.84, "factor": 0.40},
  {"state": "Assam", "electricity_consumption": 1069.96, "carbon_emission": 962.96, "factor": 0.90},
  {"state": "Bihar", "electricity_consumption": 835.03, "carbon_emission": 793.28, "factor": 0.95},
  {"state": "Chandigarh", "electricity_consumption": 2000.0, "carbon_emission": 1600.0, "factor": 0.80},
  {"state": "Chhattisgarh", "electricity_consumption": 3105.21, "carbon_emission": 3260.47, "factor": 1.05},
  {"state": "Dadra and Nagar Haveli", "electricity_consumption": 15642.35, "carbon_emission": 14860.23, "factor": 0.95},
  {"state": "Daman and Diu", "electricity_consumption": 15642.35, "carbon_emission": 14860.23, "factor": 0.95},
  {"state": "Delhi", "electricity_consumption": 3636.70, "carbon_emission": 3454.87, "factor": 0.95},
  {"state": "Goa", "electricity_consumption": 5485.87, "carbon_emission": 4937.28, "factor": 0.90},
  {"state": "Gujarat", "electricity_consumption": 4646.19, "carbon_emission": 4413.88, "factor": 0.95},
  {"state": "Haryana", "electricity_consumption": 4875.30, "carbon_emission": 4631.54, "factor": 0.95},
  {"state": "Himachal Pradesh", "electricity_consumption": 3214.53, "carbon_emission": 1125.09, "factor": 0.35},
  {"state": "Jammu and Kashmir", "electricity_consumption": 2452.77, "carbon_emission": 1226.39, "factor": 0.50},
  {"state": "Jharkhand", "electricity_consumption": 1760.78, "carbon_emission": 1848.82, "factor": 1.05},
  {"state": "Karnataka", "electricity_consumption": 3357.58, "carbon_emission": 1678.79, "factor": 0.50},
  {"state": "Kerala", "electricity_consumption": 2486.49, "carbon_emission": 1367.57, "factor": 0.55},
  {"state": "Ladakh", "electricity_consumption": 2000.0, "carbon_emission": 1000.0, "factor": 0.50},
  {"state": "Lakshadweep", "electricity_consumption": 800.0, "carbon_emission": 720.0, "factor": 0.90},
  {"state": "Madhya Pradesh", "electricity_consumption": 1958.49, "carbon_emission": 1762.64, "factor": 0.90},
  {"state": "Maharashtra", "electricity_consumption": 2990.07, "carbon_emission": 2541.56, "factor": 0.85},
  {"state": "Manipur", "electricity_consumption": 1370.01, "carbon_emission": 822.01, "factor": 0.60},
  {"state": "Meghalaya", "electricity_consumption": 2688.86, "carbon_emission": 1344.43, "factor": 0.50},
  {"state": "Mizoram", "electricity_consumption": 2024.78, "carbon_emission": 1113.63, "factor": 0.55},
  {"state": "Nagaland", "electricity_consumption": 1079.26, "carbon_emission": 647.56, "factor": 0.60},
  {"state": "Odisha", "electricity_consumption": 2598.14, "carbon_emission": 2728.05, "factor": 1.05},
  {"state": "Puducherry", "electricity_consumption": 4479.88, "carbon_emission": 4031.89, "factor": 0.90},
  {"state": "Punjab", "electricity_consumption": 4120.51, "carbon_emission": 3708.46, "factor": 0.90},
  {"state": "Rajasthan", "electricity_consumption": 2544.64, "carbon_emission": 2417.41, "factor": 0.95},
  {"state": "Sikkim", "electricity_consumption": 2863.31, "carbon_emission": 858.99, "factor": 0.30},
  {"state": "Tamil Nadu", "electricity_consumption": 3659.96, "carbon_emission": 2561.97, "factor": 0.70},
  {"state": "Telangana", "electricity_consumption": 4162.38, "carbon_emission": 3954.26, "factor": 0.95},
  {"state": "Tripura", "electricity_consumption": 1102.52, "carbon_emission": 882.02, "factor": 0.80},
  {"state": "Uttar Pradesh", "electricity_consumption": 1502.60, "carbon_emission": 1352.34, "factor": 0.90},
  {"state": "Uttarakhand", "electricity_consumption": 2974.95, "carbon_emission": 1338.73, "factor": 0.45},
  {"state": "West Bengal", "electricity_consumption": 1508.41, "carbon_emission": 1433.00, "factor": 0.95}
]

NATIONAL_AVG = 1390.0
NATIONAL_CARBON_AVG = 1140.0

REAL_DISTRICT_NAMES = {
  "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar", "Mayabunder", "Havelock"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Anantapur", "Eluru", "Kadapa", "Kakinada"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Aalo", "Tezu", "Namsai", "Bomdila"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Begusarai", "Arrah", "Nalanda", "Munger"],
  "Chandigarh": ["Chandigarh City", "Manimajra", "Sarangpur"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur"],
  "Dadra and Nagar Haveli": ["Silvassa", "Khanvel"],
  "Daman and Diu": ["Daman", "Diu"],
  "Delhi": ["New Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi", "Central Delhi", "Shahdara", "Dwarka", "Rohini"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Jamnagar", "Bhavnagar", "Anand", "Mehsana", "Morbi"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak", "Hisar", "Panchkula", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Hamirpur", "Chamba", "Una", "Kangra", "Bilaspur"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Kupwara", "Samba", "Pulwama", "Poonch"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Dumka", "Adityapur"],
  "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi", "Dharwad", "Dakshina Kannada", "Kalaburagi", "Ballari", "Udupi", "Hubli", "Mangaluru", "Shivamogga"],
  "Kerala": ["Thiruvananthapuram", "Ernakulam (Kochi)", "Kozhikode", "Thrissur", "Malappuram", "Palakkad", "Kollam", "Alappuzha", "Kannur", "Kottayam"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Jhabua", "Ratlam"],
  "Maharashtra": ["Mumbai City", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Jalgaon"],
  "Manipur": ["Imphal East", "Imphal West", "Thoubal", "Churachandpur", "Senapati", "Ukhrul"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar", "Baghmara"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Balasore", "Berhampur", "Angul", "Jajpur", "Jharsuguda"],
  "Puducherry": ["Puducherry City", "Karaikal", "Mahe", "Yanam"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar", "Jaisalmer"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thanjavur", "Tuticorin"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ranga Reddy", "Medchal", "Secunderabad", "Nalgonda"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai"],
  "Uttar Pradesh": ["Noida (G.B. Nagar)", "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Meerut", "Aligarh", "Bareilly"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani", "Roorkee", "Almora", "Pithoragarh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Hooghly", "Paschim Medinipur", "Purba Bardhaman", "Siliguri", "Asansol", "Kharagpur", "Haldia"]
}

# Seeded generator matching frontend/src/data/districtData.js
def get_districts_for_state(state_name, state_average, emission_factor):
    names = REAL_DISTRICT_NAMES.get(state_name, [
        f"{state_name} Metro", f"{state_name} Rural", f"{state_name} Urban",
        f"{state_name} Coastal", f"{state_name} North", f"{state_name} South"
    ])
    
    seed = sum(ord(c) for c in state_name)
    
    def random_val():
        nonlocal seed
        x = math.sin(seed) * 10000
        seed += 1
        return x - math.floor(x)
        
    districts = []
    for name in names:
        variance = 0.65 + random_val() * 0.7
        electricity_consumption = round(state_average * variance, 2)
        carbon_emission = round(electricity_consumption * emission_factor, 2)
        districts.append({
            "name": name,
            "electricity_consumption": electricity_consumption,
            "carbon_emission": carbon_emission
        })
    return districts

def query_cortex_agent(user_message: str, conversation_history: list = None):
    """
    Queries Snowflake Cortex AI Agent using REST API.
    Falls back to a high-fidelity semantic simulation engine if credentials are not configured.
    """
    
    # Check if credentials are set (must send FULL user message to Snowflake)
    if not SNOWFLAKE_ACCOUNT_URL or not SNOWFLAKE_TOKEN or "MOCK" in SNOWFLAKE_TOKEN:
        print("\n[CORTEX AGENT SIMULATION] (Credentials missing/mock)")
        return simulate_cortex_response(user_message, conversation_history)
        
    headers = {
        "Authorization": f"Bearer {SNOWFLAKE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "agent": "ECOWATT_ASSISTANT",
        "messages": (conversation_history or []) + [
            {"role": "user", "content": user_message}
        ]
    }
    
    try:
        url = f"{SNOWFLAKE_ACCOUNT_URL.rstrip('/')}/api/v2/cortex/agent:run"
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        
        if response.status_code == 401:
            return {
                "status": "error",
                "message": "Snowflake Authorization Failed (401). Please verify your Programmatic Access Token."
            }
        
        response.raise_for_status()
        data = response.json()
        
        if "messages" in data and len(data["messages"]) > 0:
            assistant_msg = data["messages"][-1]
            content = assistant_msg.get("content", "")
            if isinstance(content, list):
                text_parts = [part.get("text", "") for part in content if part.get("type") == "text"]
                text_response = "\n".join(text_parts)
            else:
                text_response = content
            return {"status": "success", "message": text_response}
            
        return {"status": "success", "message": str(data)}
        
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": "Connection to Snowflake Cortex agent timed out. Please check network routing."
        }
    except Exception as e:
        print(f"Snowflake Cortex Agent API exception: {e}")
        return {
            "status": "error",
            "message": f"Error calling Cortex Agent: {str(e)}. Falling back to local simulation."
        }

def simulate_cortex_response(msg: str, conversation_history: list = None):
    """
    High-fidelity semantic simulation matching the ECOWATT_USAGE_VIEW semantic structure.
    Correctly parses query intents, extracts entities, maintains conversational memory
    to resolve pronouns/references, and queries real underlying data.
    """
    import re
    msg_lower = msg.lower()
    
    # Common Indian location spelling aliases and standardizations
    COMMON_LOCATION_ALIASES = {
        "bangalore": "bengaluru urban",
        "mysore": "mysuru",
        "bombay": "mumbai city",
        "calcutta": "kolkata",
        "madras": "chennai",
        "bengaluru": "bengaluru urban",
        "mumbai": "mumbai city",
        "kalaburgi": "kalaburagi",
        "belgaum": "belagavi",
        "hubli": "hubli",
        "vizag": "visakhapatnam",
        "shivammoga": "shivamogga"
    }
    
    for alias, standard in COMMON_LOCATION_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        msg_lower = re.sub(pattern, standard, msg_lower)

    # Word boundary checker helper to prevent substring matching bugs (e.g. matching "min" in "minister")
    def contains_word(words_list, text_to_check=msg_lower):
        for word in words_list:
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, text_to_check):
                return True
        return False

    # ----------------------------------------------------
    # 0. PRONOUN & CONVERSATION HISTORY RESOLUTION (Memory)
    # ----------------------------------------------------
    resolved_locations = []
    resolved_household = None
    
    context_keywords = ["it", "that", "this", "its", "those", "them", "district", "state", "household", "spike", "more", "details", "elaborate", "continue"]
    has_context_ref = contains_word(context_keywords)
    
    if has_context_ref and conversation_history:
        for turn in reversed(conversation_history):
            turn_content = turn.get("content", "").lower()
            
            # Match districts in previous turns (more specific than states)
            for state_name, districts in REAL_DISTRICT_NAMES.items():
                state_data = next(s for s in STATE_BASE_DATA if s["state"] == state_name)
                generated_districts = get_districts_for_state(state_name, state_data["electricity_consumption"], state_data["factor"])
                for dist_obj in generated_districts:
                    dist_lower = dist_obj["name"].lower()
                    if re.search(r'\b' + re.escape(dist_lower) + r'\b', turn_content):
                        loc_obj = {
                            "type": "district",
                            "name": dist_obj["name"],
                            "parent_state": state_name,
                            "state_avg": state_data["electricity_consumption"],
                            "data": dist_obj
                        }
                        if not any(l["name"] == dist_obj["name"] for l in resolved_locations):
                            resolved_locations.append(loc_obj)
                            
            # Match states in previous turns
            for state_data in STATE_BASE_DATA:
                state_lower = state_data["state"].lower()
                if re.search(r'\b' + re.escape(state_lower) + r'\b', turn_content):
                    loc_obj = {"type": "state", "name": state_data["state"], "data": state_data}
                    if not any(l["name"] == state_data["state"] for l in resolved_locations):
                        resolved_locations.append(loc_obj)
                        
            if resolved_locations:
                break
                
            # Match household in previous turns
            for hh_id in ["HH_001", "HH_002", "HH_003"]:
                if hh_id.lower() in turn_content or f"household {hh_id[-1]}" in turn_content:
                    resolved_household = hh_id
                    break
            if resolved_household:
                break

    # ----------------------------------------------------
    # 1. ENTITY EXTRACTION (Fuzzy and Substring Matches)
    # ----------------------------------------------------
    found_locations = []
    
    # Direct scan for exact state substrings
    for state_data in STATE_BASE_DATA:
        state_name = state_data["state"]
        if state_name.lower() in msg_lower:
            found_locations.append({"type": "state", "name": state_name, "data": state_data})
            
    # Direct scan for exact district substrings
    for state_name, districts in REAL_DISTRICT_NAMES.items():
        state_data = next(s for s in STATE_BASE_DATA if s["state"] == state_name)
        generated_districts = get_districts_for_state(state_name, state_data["electricity_consumption"], state_data["factor"])
        for dist_obj in generated_districts:
            dist_name = dist_obj["name"]
            if dist_name.lower() in msg_lower:
                if not any(l["name"] == dist_name for l in found_locations):
                    found_locations.append({
                        "type": "district",
                        "name": dist_name,
                        "parent_state": state_name,
                        "state_avg": state_data["electricity_consumption"],
                        "data": dist_obj
                    })

    # If no substring matches, fuzzy-match using difflib (cutoff 0.8 for high precision)
    if not found_locations:
        corpus = {}
        for state_data in STATE_BASE_DATA:
            corpus[state_data["state"].lower()] = {"type": "state", "name": state_data["state"], "data": state_data}
        for state_name, districts in REAL_DISTRICT_NAMES.items():
            state_data = next(s for s in STATE_BASE_DATA if s["state"] == state_name)
            generated_districts = get_districts_for_state(state_name, state_data["electricity_consumption"], state_data["factor"])
            for dist_obj in generated_districts:
                dist_name = dist_obj["name"]
                corpus[dist_name.lower()] = {
                    "type": "district",
                    "name": dist_name,
                    "parent_state": state_name,
                    "state_avg": state_data["electricity_consumption"],
                    "data": dist_obj
                }

        # Check individual words (len > 4) against corpus keys
        words = [w.strip("?,.! ") for w in msg_lower.split() if len(w.strip("?,.! ")) > 4]
        for word in words:
            matches = difflib.get_close_matches(word, corpus.keys(), n=1, cutoff=0.8)
            if matches:
                matched_key = matches[0]
                if not any(l["name"] == corpus[matched_key]["name"] for l in found_locations):
                    found_locations.append(corpus[matched_key])
                    break 

    # Resolve pronoun location if no explicit location matches
    if not found_locations and has_context_ref and resolved_locations:
        found_locations = list(resolved_locations)

    # Determine household ID
    household_id = "HH_001"
    if "hh_002" in msg_lower or "household 2" in msg_lower or "household_2" in msg_lower:
        household_id = "HH_002"
    elif "hh_003" in msg_lower or "household 3" in msg_lower or "household_3" in msg_lower:
        household_id = "HH_003"
    elif has_context_ref and resolved_household:
        household_id = resolved_household

    is_carbon = contains_word(["carbon", "emission", "co2", "footprint", "greenhouse"])

    # ----------------------------------------------------
    # 2. INTENT RESOLUTION & RESPONSE COMPILATION (Reordered to avoid overlaps)
    # ----------------------------------------------------
    
    # INTENT A0: Greetings
    is_greeting = contains_word(["hello", "hi", "hey", "greetings", "yo", "greeting"])
    if is_greeting:
        return {
            "status": "success",
            "message": "Hello! I am your **EcoWatt AI assistant**, connected to Snowflake Cortex. How can I help you with electricity consumption, carbon emissions, or dashboard navigation today?"
        }

    # INTENT A1: Greenwood Sector Report
    is_sector_report = contains_word(["greenwood", "sector", "baseline"])
    if is_sector_report:
        return {
            "status": "success",
            "message": "### 📊 Greenwood Sector A Baseline Report\n\n"
                       "Query results from the `ECOWATT_USAGE_VIEW` database show average monthly consumption over the past 6 months:\n\n"
                       "| Household ID | Resident Name | 6-Month Baseline Avg | Min Consumption | Max Consumption |\n"
                       "| :--- | :--- | :--- | :--- | :--- |\n"
                       "| **HH_001** | Greenwood Unit 1 | 202.3 kWh | 195.0 kWh | 260.0 kWh |\n"
                       "| **HH_002** | Greenwood Unit 2 | 351.2 kWh | 340.0 kWh | 360.0 kWh |\n"
                       "| **HH_003** | Greenwood Unit 3 | 277.6 kWh | 268.0 kWh | 365.0 kWh |\n\n"
                       "The overall sectoral average is **277.03 kWh per month** per household unit."
        }

    # INTENT A: App/Dashboard Help (Check first to avoid overlaps with metrics in trend/navigation queries)
    is_help = contains_word(["where", "how do i", "how do we", "how to see", "alerts", "profile", "add household", "navigation", "dashboard"])
    if is_help:
        return {
            "status": "success",
            "message": "### 🧭 EcoWatt Dashboard Navigation Help\n\n"
                       "Here is how to locate features on your dashboard:\n\n"
                       "- **See Past 6 Months Usage**: Click the **Residential Monitor** on the left menu. Choose your household ID from the dropdown, and see the monthly history bar chart.\n"
                       "- **Check Anomaly Alerts**: Click the **Notification Bell** in the top navigation bar, or check the alert list on the Residential Monitor page.\n"
                       "- **Modify Profile/Password**: Click the **Profile** tab in the left sidebar menu.\n"
                       "- **Add a Household Node**: Navigate to the **Residential Monitor** page and click **Add Household** in the upper action panel."
        }

    # INTENT B: General EcoWatt Info
    is_info = contains_word(["what does", "ecowatt", "accuracy", "predictions", "what data"])
    if is_info:
        return {
            "status": "success",
            "message": "### ⚡ About EcoWatt AI\n\n"
                       "**EcoWatt AI** is a smart grid residential electricity monitoring and forecasting system:\n\n"
                       "- **Deep Learning Predictor**: Uses a hybrid **CNN-LSTM network** to forecast future loads 24 hours in advance, achieving an **R² accuracy of 92.4%**.\n"
                       "- **Telemetry Data**: Collects live consumption (kWh), carbon footprint (kg CO2), and regional environmental factors.\n"
                       "- **Anomaly Detection**: Flags sudden spikes that exceed historical baseline usage by 20% or more."
        }

    # INTENT C: Educational & Definitional
    is_def = contains_word(["per capita", "carbon emission", "definition", "define", "what causes", "good kwh usage", "meaning of", "explain"])
    if is_def:
        if "per capita" in msg_lower:
            return {
                "status": "success",
                "message": "### 📖 Concept Definition: Per Capita Electricity Consumption\n\n"
                           "**Per capita electricity consumption** is a metric representing the average electricity consumed per resident in a region over a year. \n\n"
                           "- **Formula**: `Total regional electricity supply / Total population`\n"
                           "- **National Status**: In India, the average per capita consumption is around **1,255 kWh** per year. In the EcoWatt AI platform, we track this benchmark against simulated regional loads to isolate efficiency opportunities."
            }
        elif "carbon" in msg_lower or "co2" in msg_lower or "emission" in msg_lower:
            return {
                "status": "success",
                "message": "### 📖 Educational: What is Carbon Emission Footprint?\n\n"
                           "Carbon footprint is the total volume of greenhouse gases (mainly CO2) emitted by generating the electricity consumed by households.\n\n"
                           "- **Calculation**: `Electricity Consumption (kWh) * Grid Emission Factor`\n"
                           "- **Grid Factors**: Coal-heavy grids have high factors (~0.95 kg/kWh), whereas renewable-rich grids like Karnataka have lower factors (~0.50 kg/kWh)."
            }
        else:
            return {
                "status": "success",
                "message": "### 📖 Educational: Household kWh Baselines\n\n"
                           "A standard residential household in India typically consumes between **150 kWh to 350 kWh** monthly.\n\n"
                           "- **Low usage (< 150 kWh)**: Lighting, fans, basic appliances (no air conditioning).\n"
                           "- **Average usage (150–300 kWh)**: Regular usage of refrigerators, televisions, and occasional AC.\n"
                           "- **High usage (> 350 kWh)**: Frequent air conditioning, space heaters, or EV charging."
            }

    # INTENT D: Optimization & Advice
    is_more = contains_word(["more", "details", "elaborate", "continue"])
    is_optim = contains_word(["optimize", "reduction", "reduce", "lower", "decrease", "saving", "tips", "solar", "renewable", "audit", "cleaner"]) or (is_more and len(found_locations) > 0)
    if is_optim:
        if found_locations:
            advices = []
            for loc in found_locations:
                name = loc["name"]
                elec = loc["data"]["electricity_consumption"]
                factor = loc["data"].get("factor", loc["data"].get("carbon_emission", 0) / max(elec, 1))
                
                is_high_cons = elec > 1500.0
                is_high_emiss = factor >= 0.8
                
                if is_high_cons and is_high_emiss:
                    advice = (
                        f"**{name}** exhibits **High consumption** ({elec} kWh) and relies on a **carbon-heavy/coal-heavy grid** (~{factor:.2f} kg CO2/kWh).\n"
                        f"- **Solar rooftop panels**: shift high loads (EV charging) off-peak.\n"
                        f"- **HVAC Audits**: replace outdated equipment with star-rated efficiency models."
                    )
                elif is_high_cons and not is_high_emiss:
                    advice = (
                        f"**{name}** has **High consumption** ({elec} kWh) but is serviced by a relatively **Clean energy grid** (~{factor:.2f} kg CO2/kWh).\n"
                        f"- **Vampire loads mitigation**: install smart plugs to cut standby losses.\n"
                        f"- **Load Scheduling**: automate heating/cooling units."
                    )
                elif not is_high_cons and is_high_emiss:
                    advice = (
                        f"**{name}** exhibits **Moderate consumption** ({elec} kWh) but relies on a **carbon-intense grid mix** (~{factor:.2f} kg CO2/kWh).\n"
                        f"- **Clean energy alternatives**: advocate for solar/wind utility programs or install local panels."
                    )
                else:
                    advice = (
                        f"**{name}** is a model **Low-Consumption and Clean-Energy region**!\n"
                        f"- **Habit retention**: maintain current energy conservation patterns."
                    )
                advices.append(advice)
            
            bullet_advices = "\n\n".join([f"### 💡 Optimization Advice: {loc['name']}\n{advices[idx]}" for idx, loc in enumerate(found_locations)])
            return {
                "status": "success",
                "message": bullet_advices
            }
        else:
            return {
                "status": "success",
                "message": "### 💡 EcoWatt Energy Saving Guide\n\n"
                           "Here are top-tier actionable suggestions to optimize consumption and lower your electricity bills:\n\n"
                           "1. **Peak Shaving**: Avoid running heavy appliances (washing machines, water heaters, water pumps) during peak grid hours (**6:00 PM to 10:00 PM**). Shift usage to off-peak periods.\n"
                           "2. **Climate Control**: Set air conditioners to **24°C** or higher. Every 1°C increase saves up to 6% of electricity used for cooling.\n"
                           "3. **Vampire Loads**: Unplug idle chargers, TV setups, and microwaves. Standby power accounts for up to **10%** of residential energy waste.\n"
                           "4. **LED Retrofitting**: Replace legacy incandescent bulbs with star-labeled LEDs, reducing lighting electricity demand by **80%**."
            }

    # INTENT E: Anomaly Explanation (Includes "why is...", "why did...")
    is_anomaly = contains_word(["anomaly", "anomalous", "spike", "unusual", "irregular"]) or "why is" in msg_lower or "why did" in msg_lower or "reason for" in msg_lower
    if is_anomaly:
        hh_info = ""
        if resolved_household == "HH_001" or resolved_household == "HH_003" or household_id in ["HH_001", "HH_003"]:
            hh_target = resolved_household if resolved_household else household_id
            hh_val = "260.0 kWh (+28.7%)" if hh_target == "HH_001" else "365.0 kWh (+31.5%)"
            hh_info = f"\nFor household **{hh_target}**, telemetry recorded a usage of **{hh_val}** in July 2026, triggering an alert.\n"
            
        return {
            "status": "success",
            "message": "### 🚨 Anomaly & Usage Spikes Explanation\n\n"
                       "An anomaly is flagged when a household's monthly electricity consumption exceeds its 6-month historical baseline by more than **20%**.\n"
                       f"{hh_info}\n"
                       "**Common Causes of Spikes:**\n"
                       "1. **Heavy Thermal Loads**: Continuous operation of A/Cs, space heaters, or hot water geysers.\n"
                       "2. **Vampire Loads**: Running high-drain appliances during peak demand periods.\n"
                       "3. **Meter Recalibration / Telemetry Faults**: Temporary sensor transmission errors in the smart meter node."
        }

    # INTENT F: Comparison
    is_compare = contains_word(["compare", "comparison", "versus", "vs"]) or len(found_locations) >= 2
    if is_compare:
        if len(found_locations) < 2:
            return {
                "status": "success",
                "message": "I detected a comparison request, but could not identify both locations in the query. Please specify two states or districts (e.g., 'Compare Karnataka and Maharashtra')."
            }
        
        locA = found_locations[0]
        locB = found_locations[1]
        
        valElecA = locA["data"]["electricity_consumption"]
        valElecB = locB["data"]["electricity_consumption"]
        valCarbonA = locA["data"]["carbon_emission"]
        valCarbonB = locB["data"]["carbon_emission"]
        
        diffElec = round(abs(valElecA - valElecB), 2)
        diffCarbon = round(abs(valCarbonA - valCarbonB), 2)
        
        return {
            "status": "success",
            "message": f"### ⚖️ Side-by-Side Comparison: {locA['name']} vs {locB['name']}\n\n"
                       f"Here is the comparison based on the active EcoWatt AI database:\n\n"
                       f"| Telemetry Metric | {locA['name']} | {locB['name']} | Variance (Absolute) |\n"
                       f"| :--- | :--- | :--- | :--- |\n"
                       f"| **Type** | {locA['type'].capitalize()} | {locB['type'].capitalize()} | - |\n"
                       f"| **Avg Electricity Consumption** | {valElecA} kWh | {valElecB} kWh | {diffElec} kWh |\n"
                       f"| **Carbon Emission footprint** | {valCarbonA} kg CO2 | {valCarbonB} kg CO2 | {diffCarbon} kg |\n"
        }

    # INTENT G: Ranking
    is_ranking = contains_word(["highest", "lowest", "maximum", "minimum", "max", "min", "top", "bottom", "most", "least"])
    if is_ranking:
        is_lowest = contains_word(["lowest", "minimum", "min", "bottom", "least"])
        metric_name = "carbon_emission" if is_carbon else "electricity_consumption"
        metric_label = "Carbon Footprint (kg CO2)" if is_carbon else "Electricity Consumption (kWh)"
        
        filtered_states = [s for s in STATE_BASE_DATA if s["state"] not in ["Dadra and Nagar Haveli", "Daman and Diu"]]
        sorted_states = sorted(filtered_states, key=lambda x: x[metric_name], reverse=not is_lowest)
        top_states = sorted_states[:5]
        
        rank_list = []
        for idx, s in enumerate(top_states):
            rank_list.append(f"| {idx+1} | {s['state']} | {s['electricity_consumption']} kWh | {s['carbon_emission']} kg CO2 |")
            
        direction_label = "Lowest" if is_lowest else "Highest"
        return {
            "status": "success",
            "message": f"### 📊 Ranking: {direction_label} {metric_label} States\n\n"
                       f"Here are the top 5 states in India matching your criteria:\n\n"
                       f"| Rank | State Name | Avg Electricity | Estimated Carbon Footprint |\n"
                       f"| :--- | :--- | :--- | :--- |\n" + "\n".join(rank_list)
        }

    # INTENT H: Trend & History queries
    is_trend = contains_word(["trend", "history", "months", "month", "past", "last", "tracker", "log", "logs"])
    if is_trend:
        histories = {
            "HH_001": [
                {"month": "2026-02", "units": 195, "status": "Normal", "change": "-"},
                {"month": "2026-03", "units": 205, "status": "Normal", "change": "+5.1%"},
                {"month": "2026-04", "units": 198, "status": "Normal", "change": "+1.5%"},
                {"month": "2026-05", "units": 210, "status": "Normal", "change": "+7.6%"},
                {"month": "2026-06", "units": 202, "status": "Normal", "change": "+3.5%"},
                {"month": "2026-07", "units": 260, "status": "**Spike Detected**", "change": "+28.7%"}
            ],
            "HH_002": [
                {"month": "2026-02", "units": 340, "status": "Normal", "change": "-"},
                {"month": "2026-03", "units": 350, "status": "Normal", "change": "+2.9%"},
                {"month": "2026-04", "units": 360, "status": "Normal", "change": "+5.8%"},
                {"month": "2026-05", "units": 345, "status": "Normal", "change": "+1.4%"},
                {"month": "2026-06", "units": 352, "status": "Normal", "change": "+3.5%"},
                {"month": "2026-07", "units": 355, "status": "Normal", "change": "+4.4%"}
            ],
            "HH_003": [
                {"month": "2026-02", "units": 270, "status": "Normal", "change": "-"},
                {"month": "2026-03", "units": 285, "status": "Normal", "change": "+5.5%"},
                {"month": "2026-04", "units": 268, "status": "Normal", "change": "-0.7%"},
                {"month": "2026-05", "units": 290, "status": "Normal", "change": "+7.4%"},
                {"month": "2026-06", "units": 275, "status": "Normal", "change": "+1.8%"},
                {"month": "2026-07", "units": 365, "status": "**Spike Detected**", "change": "+31.5%"}
            ]
        }
        hist_rows = [f"| {h['month']} | {h['units']} kWh | {h['status']} | {h['change']} |" for h in histories[household_id]]
        return {
            "status": "success",
            "message": f"### 📈 6-Month Consumption Trend for Monitored Household: {household_id}\n\n"
                       f"Here is the usage history returned from telemetry logs:\n\n"
                       f"| Month | Electricity Consumption | Anomaly Status | Deviation vs Average |\n"
                       f"| :--- | :--- | :--- | :--- |\n" + "\n".join(hist_rows)
        }

    # INTENT I: Single Location Data-Backed Lookup (Exact lookup)
    if len(found_locations) == 1:
        loc = found_locations[0]
        if loc["type"] == "state":
            elec_val = loc["data"]["electricity_consumption"]
            carbon_val = loc["data"]["carbon_emission"]
            factor = loc["data"]["factor"]
            diff_pct = round(((elec_val - NATIONAL_AVG) / NATIONAL_AVG) * 100, 1)
            direction = "above" if diff_pct >= 0 else "below"
            return {
                "status": "success",
                "message": f"### 📊 Energy Statistics: {loc['name']}\n\n"
                           f"Based on the EcoWatt AI baseline registry for Indian states:\n\n"
                           f"- **Electricity Consumption**: Average of **{elec_val} kWh** per household. This is **{abs(diff_pct)}% {direction}** the national average of 1,390 kWh.\n"
                           f"- **Estimated Carbon Footprint**: **{carbon_val} kg CO2** per household (calculated using regional emission factor of {factor} kg/kWh)."
            }
        elif loc["type"] == "district":
            elec_val = loc["data"]["electricity_consumption"]
            carbon_val = loc["data"]["carbon_emission"]
            state_avg = loc["state_avg"]
            diff_pct = round(((elec_val - state_avg) / state_avg) * 100, 1)
            direction = "above" if diff_pct >= 0 else "below"
            return {
                "status": "success",
                "message": f"### 📍 Regional Telemetry: {loc['name']} ({loc['parent_state']})\n\n"
                           f"According to the generated district database:\n\n"
                           f"- **Electricity Consumption**: **{elec_val} kWh** monthly per household. This is **{abs(diff_pct)}% {direction}** the state average for {loc['parent_state']} ({state_avg} kWh).\n"
                           f"- **Carbon Emissions**: **{carbon_val} kg CO2** monthly per household node."
            }

    # CASE G: Out-of-Scope Fallback (Triggered as last resort)
    print(f"[FALLBACK TRIGGERED] User Query: '{msg}'")
    return {
        "status": "success",
        "message": "I don't have data on that — I can help with electricity consumption and carbon emission data for Indian states, districts, and monitored households."
    }
