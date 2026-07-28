import React, { useState } from 'react';
import { getRecommendations } from '../utils/optimizationEngine';
import { 
  Lightbulb, 
  Sun, 
  Plug, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Leaf, 
  TrendingDown 
} from 'lucide-react';

function OptimizationPanel({ 
  electricityConsumption, 
  carbonEmission, 
  avgElec = 1390, 
  avgCarbon = 1140, 
  isDarkMode 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { profileName, profileType, recommendations } = getRecommendations(
    electricityConsumption, 
    carbonEmission, 
    avgElec, 
    avgCarbon
  );

  // Calculate cumulative potential savings
  let energySavingPercent = 0;
  let carbonReductionPercent = 0;

  recommendations.forEach(r => {
    if (r.potentialSavingPercent) energySavingPercent += r.potentialSavingPercent;
    if (r.potentialReductionPercent) carbonReductionPercent += r.potentialReductionPercent;
  });

  // Clamp savings at realistic maxes
  energySavingPercent = Math.min(energySavingPercent, 25);
  carbonReductionPercent = Math.min(carbonReductionPercent, 35);

  const potentialConsumption = Math.round(electricityConsumption * (1 - energySavingPercent / 100));
  const potentialEmission = Math.round(carbonEmission * (1 - carbonReductionPercent / 100));

  // Style tags by profile type
  const getProfileStyles = (type) => {
    switch (type) {
      case 'high-high':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'high-low':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'low-high':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'low-low':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-accentRed/10 border border-accentRed/20 text-accentRed';
      case 'Medium':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-500';
      default:
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
    }
  };

  const getCardBorder = (priority) => {
    switch (priority) {
      case 'High': return 'border-l-4 border-l-red-500';
      case 'Medium': return 'border-l-4 border-l-amber-500';
      default: return 'border-l-4 border-l-blue-500';
    }
  };

  const getIcon = (type) => {
    const sizeClass = "h-4 w-4 shrink-0";
    switch (type) {
      case 'renewable': return <Sun className={`${sizeClass} text-amber-500`} />;
      case 'efficiency': return <Lightbulb className={`${sizeClass} text-blue-400`} />;
      case 'demand': return <Plug className={`${sizeClass} text-violet-400`} />;
      default: return <Award className={`${sizeClass} text-emerald-400`} />;
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${
      isDarkMode 
        ? 'bg-[#0F1626]/30 border-darkBorder/40' 
        : 'bg-white border-slate-200/80 shadow-sm'
    }`}>
      
      {/* Clickable Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-all outline-none"
      >
        <span className="flex items-center">
          <TrendingDown className="h-4 w-4 mr-2 text-accentBlue" />
          Grid Optimization Actions
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-800/20">
          
          {/* Status Badge */}
          <div className="pt-3">
            <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Grid Profile</span>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getProfileStyles(profileType)}`}>
              {profileName}
            </div>
          </div>

          {/* Savings Projection Progress Bars */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${
            isDarkMode ? 'bg-[#060A12]/80 border-slate-800/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mitigation Projections</h5>
            
            {/* Electricity Projection */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 flex items-center"><Activity className="h-3 w-3 mr-1" /> Per Capita Consumption</span>
                <span className="text-white">{electricityConsumption} ➔ <span className="text-blue-400">{potentialConsumption} kWh</span></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden relative border border-slate-800/40">
                {/* Current */}
                <div className="absolute inset-y-0 left-0 bg-slate-700 w-full rounded-full"></div>
                {/* Potential */}
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - energySavingPercent}%` }}
                ></div>
              </div>
              {energySavingPercent > 0 && (
                <div className="text-[9px] text-right font-semibold text-blue-400">
                  Potential saving: -{energySavingPercent}%
                </div>
              )}
            </div>

            {/* Carbon Projection */}
            <div className="space-y-1.5 border-t border-slate-850 pt-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 flex items-center"><Leaf className="h-3 w-3 mr-1" /> Carbon Emission</span>
                <span className="text-white">{carbonEmission} ➔ <span className="text-emerald-400">{potentialEmission} kg</span></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden relative border border-slate-800/40">
                {/* Current */}
                <div className="absolute inset-y-0 left-0 bg-slate-700 w-full rounded-full"></div>
                {/* Potential */}
                <div 
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${100 - carbonReductionPercent}%` }}
                ></div>
              </div>
              {carbonReductionPercent > 0 && (
                <div className="text-[9px] text-right font-semibold text-emerald-400">
                  Potential reduction: -{carbonReductionPercent}%
                </div>
              )}
            </div>
          </div>

          {/* Action suggestions checklist */}
          <div className="space-y-2.5">
            <h5 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Priority Recommendations</h5>
            {recommendations.map((r, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all ${getCardBorder(r.priority)} ${
                  isDarkMode ? 'bg-[#060A12]/40 border-slate-800/40' : 'bg-slate-100/40 border-slate-200'
                }`}
              >
                {getIcon(r.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      {r.type === 'renewable' ? 'Renewable Shift' : r.type === 'efficiency' ? 'Efficiency Gain' : r.type === 'demand' ? 'Demand Control' : 'Showcase'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${getPriorityStyle(r.priority)}`}>
                      {r.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    {r.suggestion}
                  </p>
                  {(r.potentialSavingPercent > 0 || r.potentialReductionPercent > 0) && (
                    <span className="text-[9px] text-blue-400 font-bold block mt-1.5">
                      Est. Impact: {r.potentialSavingPercent ? `Reduce demand by ~${r.potentialSavingPercent}%` : `Lower emissions by ~${r.potentialReductionPercent}%`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[8px] text-slate-500 text-center font-medium italic border-t border-slate-850 pt-2">
            * Note: Recommendations are generated using rule-based heuristics on consumption/emission ratios and are indicative, not prescriptive.
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizationPanel;
