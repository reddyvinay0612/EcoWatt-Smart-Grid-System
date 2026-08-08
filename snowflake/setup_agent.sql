-- =====================================================================
-- STEP 1: Snowflake Environment Setup for EcoWatt AI Cortex Agent
-- =====================================================================

-- 1. Infrastructure Configuration
CREATE DATABASE IF NOT EXISTS ECOWATT_DB;
CREATE SCHEMA IF NOT EXISTS ECOWATT_DB.ANALYTICS;
USE SCHEMA ECOWATT_DB.ANALYTICS;

CREATE ROLE IF NOT EXISTS ECOWATT_ROLE;
CREATE WAREHOUSE IF NOT EXISTS ECOWATT_WH
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE;

GRANT ALL PRIVILEGES ON DATABASE ECOWATT_DB TO ROLE ECOWATT_ROLE;
GRANT ALL PRIVILEGES ON SCHEMA ECOWATT_DB.ANALYTICS TO ROLE ECOWATT_ROLE;
GRANT USAGE ON WAREHOUSE ECOWATT_WH TO ROLE ECOWATT_ROLE;

-- 2. Structured Telemetry Schema
CREATE OR REPLACE TABLE ENERGY_METRICS (
    RECORD_ID STRING PRIMARY KEY,
    FACILITY_NAME STRING,
    READING_TIME TIMESTAMP_NTZ,
    KWH_CONSUMED FLOAT,
    CARBON_EMISSION_KG FLOAT,
    POWER_SOURCE STRING
);

-- Seed Structured Telemetry Data (Past 24 Hours)
INSERT INTO ENERGY_METRICS (RECORD_ID, FACILITY_NAME, READING_TIME, KWH_CONSUMED, CARBON_EMISSION_KG, POWER_SOURCE) VALUES
('REC_001', 'Data Center', '2026-08-08 00:00:00', 850.5, 340.2, 'Grid'),
('REC_002', 'Data Center', '2026-08-08 04:00:00', 920.0, 368.0, 'Grid'),
('REC_003', 'Data Center', '2026-08-08 08:00:00', 780.2, 156.0, 'Solar'),
('REC_004', 'Data Center', '2026-08-08 12:00:00', 1250.0, 0.0, 'Solar'),
('REC_005', 'Data Center', '2026-08-08 16:00:00', 1100.5, 220.1, 'Wind'),
('REC_006', 'Data Center', '2026-08-08 20:00:00', 980.0, 392.0, 'Grid'),

('REC_007', 'Solar Farm', '2026-08-08 00:00:00', 50.0, 0.0, 'Solar'),
('REC_008', 'Solar Farm', '2026-08-08 04:00:00', 45.0, 0.0, 'Solar'),
('REC_009', 'Solar Farm', '2026-08-08 08:00:00', 450.0, 0.0, 'Solar'),
('REC_010', 'Solar Farm', '2026-08-08 12:00:00', 850.0, 0.0, 'Solar'),
('REC_011', 'Solar Farm', '2026-08-08 16:00:00', 600.0, 0.0, 'Solar'),
('REC_012', 'Solar Farm', '2026-08-08 20:00:00', 120.0, 0.0, 'Solar'),

('REC_013', 'Factory Unit', '2026-08-08 00:00:00', 1450.0, 1377.5, 'Grid'),
('REC_014', 'Factory Unit', '2026-08-08 04:00:00', 1520.0, 1444.0, 'Grid'),
('REC_015', 'Factory Unit', '2026-08-08 08:00:00', 1380.5, 966.3, 'Wind'),
('REC_016', 'Factory Unit', '2026-08-08 12:00:00', 1850.0, 1295.0, 'Wind'),
('REC_017', 'Factory Unit', '2026-08-08 16:00:00', 1600.0, 1520.0, 'Grid'),
('REC_018', 'Factory Unit', '2026-08-08 20:00:00', 1550.2, 1472.6, 'Grid');

-- 3. Unstructured Sustainability Policies Schema
CREATE OR REPLACE TABLE ENERGY_POLICIES (
    DOC_ID STRING PRIMARY KEY,
    CATEGORY STRING,
    TITLE STRING,
    CONTENT STRING
);

-- Seed Policies & Optimization Protocols
INSERT INTO ENERGY_POLICIES (DOC_ID, CATEGORY, TITLE, CONTENT) VALUES
('POL_001', 'HVAC Optimization', 'Standard Operating Protocol for Facility Cooling Control', 
 'During peak grid load hours (12:00 PM to 4:00 PM), Data Center HVAC systems must increase their temperature setpoint by 2°C (from 21°C to 23°C). This action reduces cooling load by approximately 12.5% and prevents peak demand surcharges. Air handling units should maintain 50% relative humidity. If solar generation exceeds 500 kW, setpoint can be lowered to 22°C.'),
('POL_002', 'Carbon Compliance', 'Industrial Carbon Cap and Offset Guidelines', 
 'All units must conform to a local emissions cap of 1.2 kg CO2 per produced facility unit. Factory Units must prioritize clean power sources (Solar and Wind) when grid carbon intensity exceeds 0.85 kg/kWh. Any excess carbon emissions beyond 1500 kg per day will trigger automatic carbon offset purchases of certified credit batches.'),
('POL_003', 'Solar Integration', 'Renewable Microgrid Dispatch Strategy', 
 'The Solar Farm distributes generated power with the following priority logic: first to internal Data Center server racks, second to Factory Unit air compressors, and third to the battery energy storage system (BESS). When battery capacity is above 90%, surplus power is exported to the grid at local feed-in tariff rates.');

-- 4. Create Semantic Model/View for Cortex Analyst
-- cortex analyst reads from a semantic model file (YAML). The view acts as the target for NLP queries.
CREATE OR REPLACE VIEW ECOWATT_ENERGY_SEMANTIC_VIEW AS
SELECT 
    RECORD_ID,
    FACILITY_NAME,
    READING_TIME,
    KWH_CONSUMED,
    CARBON_EMISSION_KG,
    POWER_SOURCE
FROM ENERGY_METRICS;

-- 5. Create Cortex Search Service for RAG (Unstructured Search)
CREATE OR REPLACE CORTEX SEARCH SERVICE ECOWATT_POLICY_SEARCH
  ON CONTENT
  ATTRIBUTES CATEGORY, TITLE
  WAREHOUSE = ECOWATT_WH
  TARGET_LAG = '1 hour'
  AS 
  SELECT DOC_ID, CATEGORY, TITLE, CONTENT 
  FROM ENERGY_POLICIES;

-- 6. Define Cortex Agent configuration (Represented here as SQL DDL configuration references)
-- An Agent object coordinates Analyst views, Search services, and Python execution capabilities:
/*
CREATE OR REPLACE CORTEX AGENT ECOWATT_AI_AGENT
  MODEL = 'claude-3-5-sonnet'
  ANALYST_VIEWS = (ECOWATT_ENERGY_SEMANTIC_VIEW)
  SEARCH_SERVICES = (ECOWATT_POLICY_SEARCH)
  ENABLE_CODE_EXECUTION = TRUE
  INSTRUCTIONS = 'You are EcoWatts autonomous agent assistant. Help users query telemetry, search policy documents, and run computations.';
*/
