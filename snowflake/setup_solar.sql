-- SQL Schema for Rooftop Solar Analytics Pipeline
-- Compatible with PostgreSQL + PostGIS and Snowflake Data Cloud

-- 1. State Level Solar Adoption Summary
CREATE TABLE IF NOT EXISTS state_solar_analytics (
    state_id VARCHAR(5) PRIMARY KEY,
    state_name VARCHAR(100) UNIQUE NOT NULL,
    total_households BIGINT NOT NULL DEFAULT 0,
    solar_installed_count BIGINT NOT NULL DEFAULT 0,
    total_solar_capacity_kw DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    avg_monthly_generation_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_electricity_optimized_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    non_solar_potential_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. District Level Solar Adoption Summary
CREATE TABLE IF NOT EXISTS district_solar_analytics (
    district_id VARCHAR(20) PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    total_households BIGINT NOT NULL DEFAULT 0,
    solar_installed_count BIGINT NOT NULL DEFAULT 0,
    total_solar_capacity_kw DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    avg_monthly_generation_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_electricity_optimized_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    non_solar_potential_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_state_district FOREIGN KEY (state_name) REFERENCES state_solar_analytics(state_name) ON DELETE CASCADE
);

-- 3. Pincode / Local Area Solar Adoption Summary
CREATE TABLE IF NOT EXISTS pincode_solar_analytics (
    pincode VARCHAR(10) PRIMARY KEY,
    district_id VARCHAR(20) NOT NULL,
    solar_installation_density_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- adopted_roofs / total_roofs
    total_roof_area_sqm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    estimated_unutilized_solar_capacity_kw DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_district_pincode FOREIGN KEY (district_id) REFERENCES district_solar_analytics(district_id) ON DELETE CASCADE
);

-- 4. Individual Household Solar Telemetry & Roof Analytics
CREATE TABLE IF NOT EXISTS household_solar_analytics (
    household_id VARCHAR(50) PRIMARY KEY,
    owner_name VARCHAR(150),
    pincode VARCHAR(10) NOT NULL,
    roof_polygon_wkt TEXT, -- Well-Known Text representation of spatial geometry (PostGIS polygon)
    roof_polygon_geog GEOGRAPHY, -- Snowflake Native GEOGRAPHY type / PostGIS Geography field
    usable_roof_area_sqm DOUBLE PRECISION NOT NULL,
    solar_status VARCHAR(20) NOT NULL DEFAULT 'NON_SOLAR', -- 'SOLAR', 'NON_SOLAR'
    installed_capacity_kw DOUBLE PRECISION DEFAULT 0.0,
    ghi_irradiance_kwh_m2_day DOUBLE PRECISION NOT NULL DEFAULT 4.5, -- Global Horizontal Irradiance GHI
    monthly_grid_consumption_kwh DOUBLE PRECISION NOT NULL,
    avoided_co2_kg_monthly DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    savings_monthly_inr DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    payback_years DOUBLE PRECISION DEFAULT NULL,
    recommended_capacity_kw DOUBLE PRECISION DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pincode_household FOREIGN KEY (pincode) REFERENCES pincode_solar_analytics(pincode) ON DELETE CASCADE
);
