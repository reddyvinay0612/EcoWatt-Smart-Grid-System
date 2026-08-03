import os
import json
import uuid
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client
from dotenv import load_dotenv

# Load env variables from root/backend folder
load_dotenv()

TWILIO_SID = os.getenv("TWILIO_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "alerts@ecowattai.com")

NOTIFICATIONS_PATH = "backend/data/notifications.json"

def send_email_alert(to_email, household_name, current_usage, baseline_avg, percent_change):
    """
    Sends an email alert to the user. Fallback to console printing if SMTP is unconfigured.
    """
    subject = f"⚡ High Electricity Usage Alert - {household_name}"
    body = f"""Hi,

Your electricity usage this month is {current_usage} units,
which is {percent_change}% higher than your average of {baseline_avg} units
over the past 6 months.

Consider checking for unusual appliance usage or potential issues.

- EcoWatt AI
"""
    
    # Check if SMTP details are provided
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"\n[EMAIL SIMULATION FALLBACK] (SMTP credentials missing/default)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        return True

    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent email alert to {to_email}")
        return True
    except Exception as e:
        print(f"Error sending email alert to {to_email}: {e}")
        # Log failure gracefully, don't crash
        return False

def send_sms_alert(to_phone, household_name, current_usage, percent_change):
    """
    Sends an SMS alert using Twilio. Fallback to console printing if credentials are missing.
    """
    message_body = f"EcoWatt AI Alert: {household_name} used {current_usage} units this month, {percent_change}% above average. Check your appliances."
    
    if not TWILIO_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        print(f"\n[SMS SIMULATION FALLBACK] (Twilio keys missing/default)")
        print(f"To: {to_phone}")
        print(f"Message: {message_body}")
        return True
        
    try:
        client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        print(f"Successfully sent SMS alert to {to_phone} (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"Error sending SMS alert to {to_phone}: {e}")
        # Log failure gracefully, don't crash
        return False

def create_in_app_notification(household_id, anomaly_result):
    """
    Creates and appends an in-app notification in notifications.json.
    """
    timestamp_str = datetime.now().isoformat()
    percent_change = anomaly_result["percentChange"]
    current_month_val = anomaly_result["currentMonth"]
    baseline_avg_val = anomaly_result["baselineAvg"]
    
    msg_body = f"High consumption alert! This month's usage is {current_month_val} units (+{percent_change}% vs 6-month average of {baseline_avg_val} units)."
    
    notification = {
        "id": str(uuid.uuid4()),
        "householdId": household_id,
        "message": msg_body,
        "timestamp": timestamp_str,
        "isRead": False
    }
    
    try:
        notifications = []
        if os.path.exists(NOTIFICATIONS_PATH):
            with open(NOTIFICATIONS_PATH, "r") as f:
                try:
                    notifications = json.load(f)
                except Exception:
                    notifications = []
                    
        notifications.append(notification)
        
        with open(NOTIFICATIONS_PATH, "w") as f:
            json.dump(notifications, f, indent=2)
            
        print(f"Created in-app notification for {household_id}")
        return notification
    except Exception as e:
        print(f"Error creating in-app notification: {e}")
        return None
