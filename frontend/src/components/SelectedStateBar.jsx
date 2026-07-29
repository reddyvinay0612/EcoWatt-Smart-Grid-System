import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { stateData } from '../data/stateData';

function SelectedStateBar({ selectedState }) {
  const state = stateData.find(s => s.name === selectedState);

  if (!state) {
    return (
      <div className="bg-[#131824] border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-center">
        <p className="text-[10px] text-slate-500 font-medium">Click any state on the map to view detailed analytics</p>
      </div>
    );
  }

  const renewableShare = ((1 - state.emissionFactor) * 100).toFixed(1);
  const demandForecast = (state.electricityConsumption * 1.092).toFixed(0);

  const metrics = [
    { label: 'Consumption', value: `${state.electricityConsumption.toLocaleString()} kWh`, trend: '+8.7%', up: true },
    { label: 'Carbon Emission', value: `${state.carbonEmission.toLocaleString()} kg`, trend: '-6.3%', up: false },
    { label: 'Renewable Share', value: `${renewableShare}%`, trend: '+12.4%', up: true },
    { label: 'Demand Forecast', value: `${Number(demandForecast).toLocaleString()} kWh`, trend: '+9.2%', up: true },
  ];

  return (
    <div className="bg-[#131824] border border-white/5 rounded-xl px-4 py-2.5 flex items-center space-x-6 overflow-x-auto">
      <div className="shrink-0">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Selected State</p>
        <p className="text-sm font-black text-accentBlue mt-0.5">{state.name}</p>
      </div>
      <div className="w-px h-8 bg-white/5 shrink-0"></div>
      {metrics.map((m) => (
        <div key={m.label} className="shrink-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
          <p className="text-sm font-bold text-white mt-0.5">{m.value}</p>
          <div className={`flex items-center space-x-0.5 text-[9px] font-bold mt-0.5 ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {m.up
              ? <TrendingUp className="h-2.5 w-2.5" />
              : <TrendingDown className="h-2.5 w-2.5" />
            }
            <span>{m.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SelectedStateBar;
