-- ECOWATT AI - SNOWFLAKE CORTEX SYSTEM SETUP
-- Run this script inside Snowsight using a role with CREATE AGENT, CREATE SEMANTIC VIEW, and Cortex Search privileges.

-- PART 1: Database & Schema Configuration
CREATE DATABASE IF NOT EXISTS ECOWATT_AI;
CREATE SCHEMA IF NOT EXISTS ECOWATT_AI.MONITORING;
USE SCHEMA ECOWATT_AI.MONITORING;

-- Create Household Telemetry Metadata Table
CREATE OR REPLACE TABLE HOUSEHOLDS (
    household_id STRING PRIMARY KEY,
    household_name STRING,
    area STRING,
    city STRING,
    state STRING,
    email STRING,
    phone STRING
);

-- Create Monthly Consumption & Anomaly Summary Table
CREATE OR REPLACE TABLE MONTHLY_USAGE (
    usage_id STRING PRIMARY KEY,
    household_id STRING,
    usage_month DATE,
    units_consumed FLOAT,
    is_anomaly BOOLEAN DEFAULT FALSE,
    percent_change_vs_avg FLOAT,
    FOREIGN KEY (household_id) REFERENCES HOUSEHOLDS(household_id)
);

-- (Optional) Insert simulated seeding data matching active Greenwood nodes
INSERT INTO HOUSEHOLDS VALUES 
('HH_001', 'Greenwood Residential Unit - HH 001', 'Greenwood Sector A', 'Mumbai', 'Maharashtra', 'alerts_hh001@example.com', '+919876543210'),
('HH_002', 'Greenwood Residential Unit - HH 002', 'Greenwood Sector A', 'Mumbai', 'Maharashtra', 'alerts_hh002@example.com', '+919876543211'),
('HH_003', 'Greenwood Residential Unit - HH 003', 'Greenwood Sector A', 'Mumbai', 'Maharashtra', 'alerts_hh003@example.com', '+919876543212');

INSERT INTO MONTHLY_USAGE VALUES
('u1', 'HH_001', '2026-02-01', 195.0, FALSE, 0.0),
('u2', 'HH_001', '2026-03-01', 205.0, FALSE, 5.1),
('u3', 'HH_001', '2026-04-01', 198.0, FALSE, 1.5),
('u4', 'HH_001', '2026-05-01', 210.0, FALSE, 7.6),
('u5', 'HH_001', '2026-06-01', 202.0, FALSE, 3.5),
('u6', 'HH_001', '2026-07-01', 260.0, TRUE, 28.7),
('u7', 'HH_002', '2026-02-01', 340.0, FALSE, 0.0),
('u8', 'HH_002', '2026-03-01', 350.0, FALSE, 2.9),
('u9', 'HH_002', '2026-04-01', 360.0, FALSE, 5.8),
('u10', 'HH_002', '2026-05-01', 345.0, FALSE, 1.4),
('u11', 'HH_002', '2026-06-01', 352.0, FALSE, 3.5),
('u12', 'HH_002', '2026-07-01', 355.0, FALSE, 4.4),
('u13', 'HH_003', '2026-02-01', 270.0, FALSE, 0.0),
('u14', 'HH_003', '2026-03-01', 285.0, FALSE, 5.5),
('u15', 'HH_003', '2026-04-01', 268.0, FALSE, -0.7),
('u16', 'HH_003', '2026-05-01', 290.0, FALSE, 7.4),
('u17', 'HH_003', '2026-06-01', 275.0, FALSE, 1.8),
('u18', 'HH_003', '2026-07-01', 365.0, TRUE, 31.5);


-- PART 2: Semantic View (Cortex Analyst metadata configuration)
CREATE OR REPLACE SEMANTIC VIEW ECOWATT_USAGE_VIEW
  TABLES (
    households AS HOUSEHOLDS
      PRIMARY KEY (household_id)
      WITH SYNONYMS ('homes', 'residences', 'apartments', 'dwelling units'),
    monthly_usage AS MONTHLY_USAGE
      PRIMARY KEY (usage_id)
      WITH SYNONYMS ('electricity usage', 'consumption', 'units used', 'monthly load', 'power bills')
  )
  RELATIONSHIPS (
    usage_to_household AS monthly_usage(household_id) REFERENCES households(household_id)
  )
  FACTS (
    monthly_usage.units_consumed AS units_consumed WITH SYNONYMS ('electricity units', 'kWh used', 'power consumption', 'bill units'),
    monthly_usage.percent_change_vs_avg AS percent_change_vs_avg WITH SYNONYMS ('percent increase', 'change from average', 'percentage growth')
  )
  DIMENSIONS (
    households.household_name AS household_name,
    households.area AS area WITH SYNONYMS ('sector', 'neighborhood', 'zone'),
    households.city AS city,
    households.state AS state,
    monthly_usage.usage_month AS usage_month WITH SYNONYMS ('month date', 'month period'),
    monthly_usage.is_anomaly AS is_anomaly WITH SYNONYMS ('unusual usage', 'flagged', 'spike', 'irregular load', 'anomaly alert')
  );


-- PART 3: Create Cortex Agent
-- Execute in Snowflake CLI, Snowsight Agents manager, or via REST:
--
-- Agent Name: ECOWATT_ASSISTANT
-- Model: Choose cortex-supported LLM (e.g., 'mistral-large2' or 'llama3-70b')
-- Attached Tools: [ ECOWATT_USAGE_VIEW ]
-- System Prompt Instructions:
/*
  You are EcoWatt AI's electricity monitoring assistant. You help users understand 
  household electricity consumption patterns, identify anomalies (usage more than 
  20% above a household's 6-month average), and answer questions about usage trends 
  across households, areas, or time periods. Always cite specific numbers from the 
  data. If a user asks about a household you don't have data for, say so clearly 
  rather than guessing. Keep responses concise and focused on the data.
*/
