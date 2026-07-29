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
import NationalAnalytics from './NationalAnalytics';

function Overview({ consumerId, activeConsumer, viewMode, setViewMode }) {
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
    return <NationalAnalytics setViewMode={setViewMode} />;
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
