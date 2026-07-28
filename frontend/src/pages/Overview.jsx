import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Leaf, 
  ShieldAlert, 
  Thermometer, 
  Sun, 
  Wind,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

import { dataService, carbonService, anomalyService, optimizeService } from '../services/api';
import India from '@react-map/india';

const stateData = {
  'Andaman and Nicobar Islands': { value: 900.00, tier: 'Low' },
  'Andhra Pradesh': { value: 2299.25, tier: 'High' },
  'Arunachal Pradesh': { value: 2562.09, tier: 'High' },
  'Assam': { value: 1069.96, tier: 'Medium' },
  'Bihar': { value: 835.03, tier: 'Low' },
  'Chandigarh': { value: 2000.00, tier: 'Medium' },
  'Chhattisgarh': { value: 3105.21, tier: 'High' },
  'Dadra and Nagar Haveli': { value: 15642.35, tier: 'High' },
  'Daman and Diu': { value: 15642.35, tier: 'High' },
  'Delhi': { value: 3636.70, tier: 'High' },
  'Goa': { value: 5485.87, tier: 'High' },
  'Gujarat': { value: 4646.19, tier: 'High' },
  'Haryana': { value: 4875.30, tier: 'High' },
  'Himachal Pradesh': { value: 3214.53, tier: 'High' },
  'Jammu and Kashmir': { value: 2452.77, tier: 'High' },
  'Jharkhand': { value: 1760.78, tier: 'Medium' },
  'Karnataka': { value: 3357.58, tier: 'High' },
  'Kerala': { value: 2486.49, tier: 'High' },
  'Ladakh': { value: 2000.00, tier: 'Medium' },
  'Lakshadweep': { value: 800.00, tier: 'Low' },
  'Madhya Pradesh': { value: 1958.49, tier: 'Medium' },
  'Maharashtra': { value: 2990.07, tier: 'High' },
  'Manipur': { value: 1370.01, tier: 'Medium' },
  'Meghalaya': { value: 2688.86, tier: 'High' },
  'Mizoram': { value: 2024.78, tier: 'High' },
  'Nagaland': { value: 1079.26, tier: 'Medium' },
  'Odisha': { value: 2598.14, tier: 'High' },
  'Puducherry': { value: 4479.88, tier: 'High' },
  'Punjab': { value: 4120.51, tier: 'High' },
  'Rajasthan': { value: 2544.64, tier: 'High' },
  'Sikkim': { value: 2863.31, tier: 'High' },
  'Tamil Nadu': { value: 3659.96, tier: 'High' },
  'Telangana': { value: 4162.38, tier: 'High' },
  'Tripura': { value: 1102.52, tier: 'Medium' },
  'Uttar Pradesh': { value: 1502.60, tier: 'Medium' },
  'Uttarakhand': { value: 2974.95, tier: 'High' },
  'West Bengal': { value: 1508.41, tier: 'Medium' }
};

const stateColors = {};
Object.keys(stateData).forEach(state => {
  const tier = stateData[state].tier;
  stateColors[state] = tier === 'High' ? '#EF4444' : tier === 'Medium' ? '#F59E0B' : '#10B981';
});

function Overview({ consumerId, activeConsumer }) {
  const [viewMode, setViewMode] = useState('national'); // 'national' or 'local'
  const [selectedState, setSelectedState] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [carbonSummary, setCarbonSummary] = useState(null);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [topRecommendations, setTopRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!consumerId) return;
    setIsLoading(true);
    try {
      const [history, carbon, anomalies, recs] = await Promise.all([
        dataService.getHistory(consumerId, 96), // Last 24 hours of 15m intervals
        carbonService.getSummary(consumerId, 'daily'),
        anomalyService.getAll(consumerId, 'Active'),
        optimizeService.getRecommendations(consumerId, 'Pending')
      ]);
      
      // Parse timestamps for chart X-axis labels (HH:MM format)
      const formattedHistory = history.map(item => ({
        ...item,
        timeLabel: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        energy_kwh: Number(item.energy_kwh.toFixed(2)),
        total_renewable_kwh: Number(item.total_renewable_kwh.toFixed(2))
      }));

      setHistoryData(formattedHistory);
      setCarbonSummary(carbon);
      setRecentAnomalies(anomalies);
      setTopRecommendations(recs.slice(0, 2));
    } catch (err) {
      console.error("Failed to load dashboard overview data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for simulator live steps
    window.addEventListener('grid-tick', loadData);
    return () => {
      window.removeEventListener('grid-tick', loadData);
    };
  }, [consumerId]);

  if (viewMode === 'local' && isLoading && historyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-sm pulse-soft">Loading system status...</div>
      </div>
    );
  }

  // Extract latest metrics
  const latestTick = historyData[historyData.length - 1] || {};
  const currentLoad = latestTick.energy_kwh || 0;
  const currentRenew = latestTick.total_renewable_kwh || 0;
  const netLoad = Math.max(0, currentLoad - currentRenew);
  
  // Calculate renewable offset percentage
  const renewRatio = currentLoad > 0 ? (currentRenew / currentLoad) * 100 : 0;

  if (viewMode === 'national') {
    return (
      <div className="space-y-8">
        {/* Title Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">National Energy Map</h2>
            <p className="text-slate-400 text-sm mt-1">
              Interactive choropleth map showing per-capita electricity consumption by state (kWh)
            </p>
          </div>
          {/* View Mode Toggle */}
          <div className="flex bg-[#0F1626] border border-darkBorder p-1 rounded-xl">
            <button
              onClick={() => setViewMode('national')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accentBlue text-white shadow transition-all"
            >
              National Energy Map
            </button>
            <button
              onClick={() => setViewMode('local')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              Local Node Telemetry
            </button>
          </div>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Map */}
          <div className="glass-panel p-6 rounded-2xl border border-darkBorder/40 lg:col-span-7 flex flex-col items-center justify-center relative min-h-[500px]">
            <span className="absolute top-4 left-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              India Choropleth View
            </span>
            <div className="w-full max-w-[450px] aspect-square flex items-center justify-center my-6">
              <India
                type="select-single"
                size={400}
                mapColor="#1E293B"
                strokeColor="#0B0F19"
                strokeWidth={1.5}
                hoverColor="#38BDF8"
                selectColor="#60A5FA"
                cityColors={stateColors}
                onSelect={(stateCode) => setSelectedState(stateCode)}
                hints={true}
                hintTextColor="#FFFFFF"
                hintBackgroundColor="#151D30"
                hintPadding="8px 12px"
                hintBorderRadius={8}
              />
            </div>
          </div>

          {/* Right Column: Selected State Details & Legend */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            {/* Selected State Details Card */}
            <div className="glass-panel p-6 rounded-2xl border border-darkBorder/40 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base mb-4 border-b border-darkBorder/40 pb-2">
                  State-wise Inspection
                </h3>
                {selectedState ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-white">{selectedState}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        stateData[selectedState]?.tier === 'High' 
                          ? 'bg-accentRed/10 border border-accentRed/25 text-accentRed'
                          : stateData[selectedState]?.tier === 'Medium'
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-500'
                          : 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen'
                      }`}>
                        {stateData[selectedState]?.tier} Consumption
                      </span>
                    </div>

                    <div className="space-y-4 bg-[#0B0F19] p-4 rounded-xl border border-darkBorder/40">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium">Per Capita Consumption</span>
                        <span className="text-lg font-bold text-white">
                          {stateData[selectedState]?.value.toLocaleString()} kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-darkBorder/40 pt-3">
                        <span className="text-xs text-slate-400 font-medium">National Average Comparison</span>
                        <div className="text-right">
                          <span className={`text-sm font-bold block ${
                            stateData[selectedState]?.value > 1390 ? 'text-accentRed' : 'text-accentGreen'
                          }`}>
                            {stateData[selectedState]?.value > 1390 ? '+' : ''}
                            {((stateData[selectedState]?.value - 1390) / 1390 * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            vs 1,390 kWh baseline
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <p className="pulse-soft font-medium">Click on any state on the map to inspect details.</p>
                  </div>
                )}
              </div>

              {/* National Baseline Comparison Card */}
              <div className="bg-[#0B0F19]/50 border border-darkBorder/30 p-4 rounded-xl space-y-3 mt-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">National Average:</span>
                  <span className="font-bold text-slate-200">1,390 kWh</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Highest (Daman & Diu):</span>
                  <span className="font-bold text-accentRed">15,642 kWh</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Lowest (Bihar):</span>
                  <span className="font-bold text-accentGreen">835 kWh</span>
                </div>
              </div>
            </div>

            {/* Map Legend Card */}
            <div className="glass-panel p-6 rounded-2xl border border-darkBorder/40">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
                Consumption Ranges
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3.5 h-3.5 bg-accentRed rounded-md shadow-sm shadow-red-500/20"></span>
                    <span className="text-slate-300 font-medium">High Consumption</span>
                  </div>
                  <span className="text-slate-400 font-semibold">&gt; 2,000 kWh</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3.5 h-3.5 bg-amber-500 rounded-md shadow-sm shadow-amber-500/20"></span>
                    <span className="text-slate-300 font-medium">Medium Consumption</span>
                  </div>
                  <span className="text-slate-400 font-semibold">1,000 – 2,000 kWh</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3.5 h-3.5 bg-accentGreen rounded-md shadow-sm shadow-emerald-500/20"></span>
                    <span className="text-slate-300 font-medium">Low Consumption</span>
                  </div>
                  <span className="text-slate-400 font-semibold">&lt; 1,000 kWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Building Meta */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Overview Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time energy tracking for <span className="text-slate-200 font-semibold">{activeConsumer?.name}</span> ({activeConsumer?.location})
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-[#0F1626] border border-darkBorder p-1 rounded-xl">
            <button
              onClick={() => setViewMode('national')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              National Energy Map
            </button>
            <button
              onClick={() => setViewMode('local')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accentBlue text-white shadow transition-all"
            >
              Local Node Telemetry
            </button>
          </div>
          <div className="bg-darkCard px-4 py-2 border border-darkBorder rounded-xl text-right">
            <span className="text-[10px] font-bold text-accentBlue uppercase tracking-wider block">Consumer Class</span>
            <span className="text-sm font-semibold text-slate-200">{activeConsumer?.class_type} Profile</span>
          </div>
        </div>
      </div>

      {/* Grid Status Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1: Current Power Draw */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Demand</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">{(currentLoad * 4).toFixed(1)}</span>
              <span className="text-slate-400 text-xs font-medium">kW</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Interval usage: {currentLoad.toFixed(2)} kWh
            </span>
          </div>
          <div className="bg-accentBlue/10 p-3 rounded-2xl border border-accentBlue/25">
            <Zap className="h-6 w-6 text-accentBlue" />
          </div>
        </div>

        {/* Metric 2: Renewables share */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Renewable Share</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-accentGreen">{renewRatio.toFixed(1)}</span>
              <span className="text-accentGreen text-xs font-semibold">%</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Generating: {(currentRenew * 4).toFixed(1)} kW
            </span>
          </div>
          <div className="bg-accentGreen/10 p-3 rounded-2xl border border-accentGreen/25">
            <Leaf className="h-6 w-6 text-accentGreen" />
          </div>
        </div>

        {/* Metric 3: Carbon Footprint */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Net CO2 Output</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-slate-200">
                {carbonSummary ? carbonSummary.net_emissions_kg.toFixed(1) : '0.0'}
              </span>
              <span className="text-slate-400 text-xs font-medium">kg</span>
            </div>
            <span className="text-[10px] text-accentGreen block font-semibold flex items-center">
              <TrendingDown className="h-3 w-3 mr-0.5" />
              {carbonSummary ? carbonSummary.avoided_emissions_kg.toFixed(1) : '0.0'} kg avoided today
            </span>
          </div>
          <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700">
            <Leaf className="h-6 w-6 text-slate-300" />
          </div>
        </div>

        {/* Metric 4: Alert Indices */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Alerts</span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-2xl font-bold ${recentAnomalies.length > 0 ? 'text-accentRed' : 'text-slate-300'}`}>
                {recentAnomalies.length}
              </span>
              <span className="text-slate-400 text-xs font-medium">anomalies</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Requires immediate inspection
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${
            recentAnomalies.length > 0 
              ? 'bg-accentRed/10 border-accentRed/25 text-accentRed' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Graphic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Load Curve Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">24-Hour Energy Load Curves</h3>
              <p className="text-xs text-slate-400">Actual Grid Draw vs. Local Solar/Wind Offset</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-accentBlue rounded-full mr-1.5"></span>Grid Consumption</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-accentGreen rounded-full mr-1.5"></span>Renewable Offset</span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRenew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} interval={12} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151D30', borderColor: '#1E293B', borderRadius: '12px' }} 
                  labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="energy_kwh" name="Grid Draw (kWh)" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
                <Area type="monotone" dataKey="total_renewable_kwh" name="Renewable Offset (kWh)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRenew)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather Status & Quick Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Weather Panel */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="font-bold text-white text-base">Weather Sensor Readings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-darkBorder/55 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-accentRed/10 p-2 rounded-xl text-accentRed">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Ambient Temperature</span>
                    <span className="text-sm font-semibold text-slate-200">Sensors Array #2</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-white">{latestTick.temperature || 25.0}°C</span>
              </div>

              <div className="flex items-center justify-between border-b border-darkBorder/55 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-accentAmber/10 p-2 rounded-xl text-accentAmber">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Solar Irradiance</span>
                    <span className="text-sm font-semibold text-slate-200">Pyranometer Feed</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-white">{latestTick.solar_irradiance || 0.0} W/m²</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-accentBlue/10 p-2 rounded-xl text-accentBlue">
                    <Wind className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Wind Velocity</span>
                    <span className="text-sm font-semibold text-slate-200">Anemometer Node</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-white">{latestTick.wind_speed || 0.0} m/s</span>
              </div>
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-base mb-3">Pending DR Optimization</h3>
              {topRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {topRecommendations.map((rec) => (
                    <div key={rec.id} className="text-xs bg-[#0F1626] border border-darkBorder p-3 rounded-xl">
                      <p className="text-slate-300 font-medium line-clamp-2 leading-relaxed">{rec.recommendation}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-darkBorder/50">
                        <span className="text-accentGreen font-bold">Est Saving: ₹{rec.est_cost_saving}</span>
                        <span className="text-slate-400 text-[10px]">CO₂: -{rec.est_co2_saving}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-slate-500 text-xs block">All loads operating within optimal threshold baselines.</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('nav-to-opt'))}
              className="w-full flex items-center justify-center space-x-2 py-2 mt-4 bg-accentBlue hover:bg-blue-600 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-accentBlue/15"
            >
              <span>Manage DR Optimizer</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
