import os
import json
import pandas as pd
import geopandas as gpd
import plotly.express as px
import streamlit as st

from src.calculator import SolarEnergyCalculator

# Page Config
st.set_page_config(
    page_title="EcoWatt AI - Rooftop Solar Analytics",
    page_icon="☀️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load database calculator
calculator = SolarEnergyCalculator()

# Load Geospatial features
@st.cache_data
def load_geospatial_data():
    geojson_path = "data/processed/district_adoption_features.geojson"
    if not os.path.exists(geojson_path):
        return None
    gdf = gpd.read_file(geojson_path)
    return gdf

gdf = load_geospatial_data()

# Header Styling
st.markdown("""
<div style="background-color:#10b981;padding:15px;border-radius:10px;margin-bottom:20px;">
    <h1 style="color:white;margin:0;">☀️ EcoWatt AI — Geospatial Rooftop Solar Adoption Pipeline</h1>
    <p style="color:white;font-size:16px;margin:5px 0 0 0;">District-level Predictive Analytics & PM Surya Ghar Sizing Simulation for India</p>
</div>
""", unsafe_allow_html=True)

if gdf is None:
    st.error("Processed geo-tabular dataset not found! Please run setup_pipeline.py and ingest.py first.")
    st.stop()

# Sidebar Setup
st.sidebar.header("⚡ Simulation Controls")
selected_state = st.sidebar.selectbox("Select State Filter", ["All India"] + sorted(list(gdf["state_name"].unique())))

# Filter data
if selected_state != "All India":
    filtered_gdf = gdf[gdf["state_name"] == selected_state]
else:
    filtered_gdf = gdf

# Calculate aggregated metrics
tot_households = int(filtered_gdf["total_households"].sum())
tot_adopters = int(filtered_gdf["solar_installed_count"].sum())
avg_adoption_rate = (tot_adopters / tot_households) * 100.0 if tot_households > 0 else 0.0
tot_capacity_mw = (filtered_gdf["total_solar_capacity_kw"].sum()) / 1000.0 # Convert to MW

# 3 Column KPI Summary
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("🏠 Total Households Checked", f"{tot_households:,}")
with col2:
    st.metric("☀️ Active Solar Installs", f"{tot_adopters:,}")
with col3:
    st.metric("📊 Total Capacity", f"{tot_capacity_mw:,.2f} MW")
with col4:
    st.metric("📈 Solar Adoption Rate", f"{avg_adoption_rate:.4f}%")

st.markdown("---")

# Main content splits: Left is Map, Right is simulator / tables
map_col, sim_col = st.columns([3, 2])

with map_col:
    st.subheader("🗺️ District-Level Solar Adoption Rate Choropleth")
    map_metric = st.selectbox("Select Metric to Visualize", [
        "predicted_adoption_rate_per_1k", 
        "solar_adoption_rate_per_1k", 
        "solar_irradiance_kwh_m2_day",
        "avg_household_income_inr"
    ], format_func=lambda x: x.replace("_", " ").title())

    # Generate interactive Plotly Choropleth Map using GeoJSON geometries
    # Convert GeoDataFrame to GeoJSON dictionary format for Plotly
    geojson_dict = json.loads(filtered_gdf.to_json())
    
    fig = px.choropleth(
        filtered_gdf,
        geojson=geojson_dict,
        locations=filtered_gdf.index,
        color=map_metric,
        color_continuous_scale="Viridis" if "irradiance" in map_metric else "YlGnBu",
        labels={map_metric: map_metric.replace("_", " ").title()},
        hover_name="district_name",
        hover_data=["state_name", "total_households", "solar_installed_count"]
    )
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        height=500,
        coloraxis_colorbar=dict(title=map_metric.split("_")[0].title())
    )
    st.plotly_chart(fig, width="stretch")

with sim_col:
    st.subheader("💡 Individual Household Sizer & ROI Calculator")
    st.write("Estimate your recommended solar capacity under the central PM Surya Ghar Muft Bijli Yojana:")
    
    # User Inputs
    monthly_usage = st.number_input("Average Monthly Grid Consumption (kWh)", min_value=10, max_value=2000, value=250, step=10)
    roof_area = st.number_input("Usable Flat Roof Area (sq meters)", min_value=5, max_value=1000, value=60, step=5)
    local_irradiance = st.slider("Local Irradiance (GHI - kWh/m²/day)", min_value=3.0, max_value=6.5, value=4.8, step=0.1)

    # Run calculations
    res = calculator.recommend_solar_and_roi(
        monthly_grid_consumption_kwh=monthly_usage,
        usable_roof_area_sqm=roof_area,
        ghi_irradiance=local_irradiance
    )
    
    # Calculate offsets
    offset_res = calculator.calculate_electricity_offset(
        generation_kwh=res["est_monthly_generation_kwh"],
        average_household_consumption_kwh=monthly_usage
    )

    # Visualizing Sizing outputs
    st.markdown(f"""
    <div style="background-color:#f0fdf4;padding:12px;border-left:5px solid #10b981;border-radius:4px;margin-bottom:15px;">
        <h4 style="margin:0;color:#065f46;">Recommended System Capacity: <b>{res['recommended_capacity_kw']} kW</b></h4>
        <p style="margin:5px 0 0 0;font-size:14px;color:#047857;">Provides a <b>{offset_res['offset_percentage']}%</b> electricity usage offset.</p>
    </div>
    """, unsafe_allow_html=True)

    # Financial Break-down
    col_a, col_b = st.columns(2)
    with col_a:
        st.write(f"💵 **Gross System Cost**: Rs. {res['system_gross_cost_inr']:,}")
        st.write(f"🎁 **PM Surya Ghar Subsidy**: Rs. {res['pm_surya_ghar_subsidy_inr']:,}")
        st.write(f"💰 **Net Investment**: **Rs. {res['net_investment_inr']:,}**")
    with col_b:
        st.write(f"⚡ **Monthly Generation**: {res['est_monthly_generation_kwh']} kWh")
        st.write(f"📉 **Monthly Bill Savings**: Rs. {res['est_monthly_savings_inr']:,}")
        st.write(f"⏳ **Payback Timeline**: **{res['payback_years']} years**")

    # Demand-side recommendations
    st.markdown("### 💡 Tailored Electricity Optimization tips")
    tips = calculator.generate_optimization_tips(monthly_usage)
    for tip in tips:
        st.markdown(f"- **{tip['category']}**: {tip['tip']} *(Saves ~{tip['estimated_savings_pct']}% of bill)*")

st.markdown("---")

# Tabular District breakdown
st.subheader("📋 District Telemetry & Model Predictions")
df_table = filtered_gdf.drop(columns=["geometry"])
st.dataframe(
    df_table[[
        "state_name", "district_name", "total_households", 
        "solar_installed_count", "solar_adoption_rate_per_1k", 
        "predicted_adoption_rate_per_1k", "solar_irradiance_kwh_m2_day", "electrification_rate"
    ]].sort_values(by="solar_adoption_rate_per_1k", ascending=False),
    width="stretch"
)
