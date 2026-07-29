import React, { useState } from 'react';
import { Users, Globe, HelpCircle, Activity, Leaf, ShieldAlert } from 'lucide-react';
import OptimizationPanel from './OptimizationPanel';
import PredictionPanel from './PredictionPanel';
import OptimizationResultPanel from './OptimizationResultPanel';

function DetailPanel({ 
  name, 
  electricityConsumption, 
  carbonEmission, 
  elecTier, 
  carbTier, 
  elecDev, 
  carbDev, 
  pop, 
  gdp, 
  isEmissionEstimated, 
  onClose, 
  averageLabel, 
  isDarkMode,
  parentState, // Passed from parent to query parent state ML models if inspecting a district
  activeMetric = 'electricity'
}) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'prediction' | 'optimization'

  const getBadgeClass = (tier) => {
    switch (tier) {
      case 'High':
        return 'bg-accentRed/10 border border-accentRed/25 text-accentRed';
      case 'Medium':
        return 'bg-amber-500/10 border border-amber-500/25 text-amber-500';
      default:
        return 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen';
    }
  };

  // Determine which state to forecast/optimize for
  // If parentState is provided, this represents the state containing the selected district
  const isDistrict = !!parentState;
  const forecastState = isDistrict ? parentState : name;

  return (
    <div className={`fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl border-t p-6 z-50 max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-0 lg:relative lg:translate-y-0 lg:rounded-2xl lg:shadow-none lg:border lg:z-0 ${
      isDarkMode 
        ? 'bg-[#0B0F19] border-darkBorder/50 text-slate-100 lg:bg-slate-900/40 lg:border-darkBorder/40' 
        : 'bg-white border-slate-205 text-slate-850 lg:bg-white lg:border-slate-200 lg:shadow-sm'
    }`}>
      
      {/* Title block */}
      <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-700/20">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {isDistrict ? `${parentState} District` : 'State Audit'}
          </span>
          <h3 className="font-extrabold text-lg text-white truncate max-w-[200px]">{name}</h3>
        </div>
        <button onClick={onClose} className="lg:hidden text-xs font-bold text-slate-400 border px-2.5 py-1 rounded-lg">
          Close
        </button>
      </div>

      {/* Tabs navigation headers */}
      <div className="flex border-b border-slate-850/60 mb-5 text-[11px] font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 pb-2.5 border-b-2 text-center transition-all outline-none ${
            activeTab === 'current' ? 'border-blue-500 text-white font-extrabold' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Current Data
        </button>
        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex-1 pb-2.5 border-b-2 text-center transition-all outline-none ${
            activeTab === 'prediction' ? 'border-blue-500 text-white font-extrabold' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Prediction (ML)
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`flex-1 pb-2.5 border-b-2 text-center transition-all outline-none ${
            activeTab === 'optimization' ? 'border-blue-500 text-white font-extrabold' : 'border-transparent hover:text-slate-200'
          }`}
        >
          Optimization
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {/* Metric 1: Electricity Consumption */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-[#060A12]/80 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center">
                <Activity className="h-4 w-4 mr-1.5 text-accentBlue" />
                Electricity Consumption
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeClass(elecTier)}`}>
                {elecTier}
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-xl font-black text-white">
                {electricityConsumption?.toLocaleString()} <span className="text-xs font-medium text-slate-400">kWh/capita</span>
              </span>
              <span className={`text-xs font-extrabold ${elecDev > 0 ? 'text-accentRed' : 'text-accentGreen'}`}>
                {elecDev > 0 ? '+' : ''}{elecDev.toFixed(1)}% <span className="text-[8px] font-semibold text-slate-500">vs {averageLabel}</span>
              </span>
            </div>
          </div>

          {/* Metric 2: Carbon Emission */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-[#060A12]/80 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center">
                <Leaf className="h-4 w-4 mr-1.5 text-accentGreen" />
                Carbon Emission
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeClass(carbTier)}`}>
                {carbTier}
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-xl font-black text-white">
                {carbonEmission?.toLocaleString()} <span className="text-xs font-medium text-slate-400">kg CO2/capita</span>
              </span>
              <span className={`text-xs font-extrabold ${carbDev > 0 ? 'text-accentRed' : 'text-accentGreen'}`}>
                {carbDev > 0 ? '+' : ''}{carbDev.toFixed(1)}% <span className="text-[8px] font-semibold text-slate-500">vs {averageLabel}</span>
              </span>
            </div>

            {isEmissionEstimated && (
              <div className="flex items-start space-x-1.5 mt-3 pt-2.5 border-t border-slate-800/40 text-[9px] text-slate-500 font-semibold leading-relaxed">
                <HelpCircle className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Carbon emission estimated from electricity generation mix (coal/renewable ratio) for this region.
                </span>
              </div>
            )}
          </div>

          {/* Demographics details */}
          <div className={`p-4 rounded-xl border space-y-3 text-xs ${
            isDarkMode ? 'bg-[#060A12]/30 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-slate-450 font-semibold flex items-center">
                <Users className="h-3.5 w-3.5 mr-2 text-slate-500" /> Population
              </span>
              <span className="font-extrabold text-slate-205">{pop || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800/40 pt-2.5">
              <span className="text-slate-450 font-semibold flex items-center">
                <Globe className="h-3.5 w-3.5 mr-2 text-slate-500" /> Est GDP Per Capita
              </span>
              <span className="font-extrabold text-slate-205">
                {gdp ? `₹${gdp.toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Legacy Rule-based Optimization Recommendations Panel */}
          <div className="pt-2 border-t border-slate-700/20">
            <OptimizationPanel 
              electricityConsumption={electricityConsumption}
              carbonEmission={carbonEmission}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {activeTab === 'prediction' && (
        <div className="space-y-4">
          {isDistrict && (
            <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl text-[10px] text-blue-400 font-semibold leading-relaxed">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Forecasting model is loaded for the parent state of <strong>{parentState}</strong>.
              </span>
            </div>
          )}
          <PredictionPanel 
            stateName={forecastState} 
            activeMetric={activeMetric} 
            isDarkMode={isDarkMode} 
          />
        </div>
      )}

      {activeTab === 'optimization' && (
        <div className="space-y-4">
          {isDistrict && (
            <div className="flex items-start space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-[10px] text-emerald-400 font-semibold leading-relaxed">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Optimization scenario models are loaded for the parent state of <strong>{parentState}</strong>.
              </span>
            </div>
          )}
          <OptimizationResultPanel 
            stateName={forecastState} 
            isDarkMode={isDarkMode} 
          />
        </div>
      )}

    </div>
  );
}

export default DetailPanel;
