import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

function PredictionPanel({ stateName, activeMetric = 'electricity', isDarkMode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stateName) return;

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/predict/${encodeURIComponent(stateName)}/${activeMetric}?years_ahead=5`);
        if (!response.ok) {
          throw new Error("Forecasting model not trained for this state yet.");
        }
        const records = await response.json();
        
        // Split data into historical (<=2026) vs forecast (>2026)
        const formatted = records.map(r => {
          const year = parseInt(r.ds);
          const isForecast = year > 2026;
          
          return {
            year: r.ds,
            // Historical values
            historical: isForecast ? null : r.yhat,
            // Forecast values
            predicted: isForecast ? r.yhat : null,
            // Draw continuous line connection on the boundary year (2026)
            predicted_connector: year >= 2026 ? r.yhat : null,
            yhat_lower: r.yhat_lower,
            yhat_upper: r.yhat_upper
          };
        });

        setData(formatted);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [stateName, activeMetric]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Running Prophet time-series forecast...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl border flex flex-col items-center text-center space-y-3 ${
        isDarkMode ? 'bg-[#0F1626]/20 border-red-500/20 text-slate-300' : 'bg-red-50 border-red-200 text-slate-700'
      }`}>
        <AlertTriangle className="h-8 w-8 text-amber-500 animate-pulse" />
        <div>
          <h4 className="font-bold text-xs text-white uppercase tracking-wider">Model Status Offline</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const metricLabel = activeMetric === 'carbon' ? 'Carbon Emission (kg CO2)' : 'Electricity Consumption (kWh)';
  const metricColor = activeMetric === 'carbon' ? '#10B981' : '#3B82F6';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/20 pb-2">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center">
          <TrendingUp className="h-4 w-4 mr-1.5 text-blue-500" />
          5-Year Prophet Time-Series Forecast
        </h4>
        <span className="text-[9px] bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold px-2 py-0.5 rounded-full">
          Prophet ML Model Active
        </span>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 5, bottom: 5, left: -25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E2E8F0'} />
            <XAxis dataKey="year" stroke="#64748B" fontSize={10} />
            <YAxis stroke="#64748B" fontSize={10} />
            
            {/* Confidence Band Range */}
            <Area 
              type="monotone" 
              dataKey="yhat_upper" 
              stroke="none" 
              fill={metricColor} 
              fillOpacity={0.06} 
              name="Upper Bound"
            />
            <Area 
              type="monotone" 
              dataKey="yhat_lower" 
              stroke="none" 
              fill={metricColor} 
              fillOpacity={0.06} 
              name="Lower Bound"
            />
            
            {/* Historical Solid Line */}
            <Line 
              type="monotone" 
              dataKey="historical" 
              stroke={metricColor} 
              strokeWidth={2.5} 
              dot={{ r: 3 }} 
              name={`Historical ${activeMetric === 'carbon' ? 'Carbon' : 'Elec'}`}
            />
            
            {/* Forecast Dashed Line */}
            <Line 
              type="monotone" 
              dataKey="predicted_connector" 
              stroke={metricColor} 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={{ r: 3, strokeDasharray: '0' }} 
              name={`Forecast ${activeMetric === 'carbon' ? 'Carbon' : 'Elec'}`}
            />

            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const isFc = parseInt(item.year) > 2026;
                  const value = isFc ? item.predicted : item.historical;
                  return (
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                      isDarkMode ? 'bg-[#151D30] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                    }`}>
                      <p className="font-extrabold">{item.year} {isFc ? '(Forecast)' : '(Historical)'}</p>
                      <p>Value: <span className="font-bold">{value?.toLocaleString()}</span></p>
                      <p className="text-[9px] text-slate-500">
                        CI Range: {Math.round(item.yhat_lower).toLocaleString()} - {Math.round(item.yhat_upper).toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[9px] text-slate-500 italic leading-relaxed text-center">
        * Model note: Forecasts are generated using Prophet time-series modeling on historical/simulated data. Optimization recommendations are scenario-based estimates using simplified impact assumptions, not guaranteed outcomes.
      </div>
    </div>
  );
}

export default PredictionPanel;
