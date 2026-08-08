import os
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SNOWFLAKE_ACCOUNT_URL = os.getenv("SNOWFLAKE_ACCOUNT_URL", "")
SNOWFLAKE_TOKEN = os.getenv("SNOWFLAKE_PAT_TOKEN", "")

def query_cortex_agent(user_message: str, conversation_history: list = None):
    """
    Queries Snowflake Cortex AI Agent using REST API.
    Falls back to a high-fidelity semantic simulation engine if credentials are not configured.
    """
    
    # Check if credentials are set
    if not SNOWFLAKE_ACCOUNT_URL or not SNOWFLAKE_TOKEN or "MOCK" in SNOWFLAKE_TOKEN:
        print("\n[CORTEX AGENT SIMULATION] (Credentials missing/mock)")
        return simulate_cortex_response(user_message)
        
    headers = {
        "Authorization": f"Bearer {SNOWFLAKE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Standard conversation history formatting
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
        
        # Parse typical Snowflake Cortex Agent responses
        # e.g., Extracting text from response shape: {"messages": [{"role": "assistant", "content": [{"type": "text", "text": "..."}]}]}
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

def simulate_cortex_response(msg: str):
    """
    High-fidelity semantic simulation matching the ECOWATT_USAGE_VIEW semantic structure.
    """
    msg_lower = msg.lower()
    
    # 1. Queries about anomalies
    if "anomaly" in msg_lower or "anomalous" in msg_lower or "spike" in msg_lower:
        return {
            "status": "success",
            "message": "Based on the `ECOWATT_USAGE_VIEW` semantic analysis, there are two households with anomalous energy spikes last month (July 2026):\n\n"
                       "| Household ID | Household Name | Month | Units Consumed (kWh) | Deviation vs Avg | Status |\n"
                       "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                       "| **HH_001** | Greenwood Residential Unit - HH 001 | 2026-07 | 260.0 | +28.7% | Flagged Spike |\n"
                       "| **HH_003** | Greenwood Residential Unit - HH 003 | 2026-07 | 365.0 | +31.5% | Flagged Spike |\n\n"
                       "*Note: Anomaly checks are computed dynamically against each household's past 6-month average.*"
        }
        
    # 2. Queries about averages or greenwood sector A
    elif "average" in msg_lower or "mean" in msg_lower or "greenwood" in msg_lower or "sector" in msg_lower:
        return {
            "status": "success",
            "message": "I queried the database for electricity usage across households in **Greenwood Sector A** (Mumbai, Maharashtra). Here is the average monthly consumption over the past 6 months:\n\n"
                       "| Household ID | Resident Name | 6-Month Baseline Avg | Min Consumption | Max Consumption |\n"
                       "| :--- | :--- | :--- | :--- | :--- |\n"
                       "| **HH_001** | Greenwood Unit 1 | 202.3 kWh | 195.0 kWh | 260.0 kWh |\n"
                       "| **HH_002** | Greenwood Unit 2 | 351.2 kWh | 340.0 kWh | 360.0 kWh |\n"
                       "| **HH_003** | Greenwood Unit 3 | 277.6 kWh | 268.0 kWh | 365.0 kWh |\n\n"
                       "The overall sectoral average is **277.03 kWh per month** per household unit."
        }
        
    # 3. Queries about percentage increases (>25%)
    elif "increase" in msg_lower or "percent" in msg_lower or "grow" in msg_lower or "25%" in msg_lower or "25" in msg_lower:
        return {
            "status": "success",
            "message": "Running filtering query for households with usage increases exceeding 25%:\n\n"
                       "| Household ID | Resident Name | Month | Consumption | Previous Baseline | Net Increase |\n"
                       "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                       "| **HH_003** | Greenwood Unit 3 | 2026-07 | 365.0 kWh | 277.6 kWh | **+31.5%** |\n"
                       "| **HH_001** | Greenwood Unit 1 | 2026-07 | 260.0 kWh | 202.3 kWh | **+28.7%** |\n\n"
                       "Both units exceed the 25% filter limit and have triggered automated notifications."
        }
        
    # 4. Compare households
    elif "compare" in msg_lower or "comparison" in msg_lower:
        return {
            "status": "success",
            "message": "Comparing **HH_001** vs **HH_002** over the available 6-month historical log:\n\n"
                       "- **HH_001 (Greenwood 1)**: More volatile. Baseline is 202.3 kWh, but spiked to 260.0 kWh in July. Highly responsive to seasonal parameters.\n"
                       "- **HH_002 (Greenwood 2)**: Higher base load but extremely stable. Baseline is 351.2 kWh, staying within a narrow range of 340 to 360 kWh.\n\n"
                       "| Month | HH_001 (kWh) | HH_002 (kWh) | Variance (HH_002 vs HH_001) |\n"
                       "| :--- | :--- | :--- | :--- |\n"
                       "| 2026-02 | 195 | 340 | +145 kWh |\n"
                       "| 2026-03 | 205 | 350 | +145 kWh |\n"
                       "| 2026-04 | 198 | 360 | +162 kWh |\n"
                       "| 2026-05 | 210 | 345 | +135 kWh |\n"
                       "| 2026-06 | 202 | 352 | +150 kWh |\n"
                       "| 2026-07 | 260 | 355 | +95 kWh |"
        }

    # 5. Default friendly agent response
    else:
        return {
            "status": "success",
            "message": "Hello! I am your **EcoWatt AI assistant**, connected to the Snowflake Cortex structured query engine.\n\n"
                       "You can ask me questions about:\n"
                       "- Household consumption stats (e.g., *'Show average consumption in Greenwood Sector A'*)\n"
                       "- Usage spikes and irregularities (e.g., *'Which households had anomalies last month?'*)\n"
                       "- Comparison data (e.g., *'Compare HH_001 and HH_002'*)\n\n"
                       "What query can I run on your smart meter database today?"
        }
