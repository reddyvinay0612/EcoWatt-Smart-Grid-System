import React, { useState, useEffect } from 'react';
import { 
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
  Cpu, 
  Play, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  Check, 
  X,
  Gauge
} from 'lucide-react';
import { optimizeService } from '../services/api';
function Optimization({ consumerId, activeConsumer, onActionComplete }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isTrainingRl, setIsTrainingRl] = useState(false);
  const [rlLog, setRlLog] = useState('');
  const [rlResults, setRlResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!consumerId) return;
    setIsLoading(true);
    try {
      const recs = await optimizeService.getRecommendations(consumerId, 'Pending');
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to load optimization actions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for custom navigation trigger or simulator ticks
    const handleNav = () => loadData();
    window.addEventListener('nav-to-opt', handleNav);
    window.addEventListener('grid-tick', loadData);

    return () => {
      window.removeEventListener('nav-to-opt', handleNav);
      window.removeEventListener('grid-tick', loadData);
    };
  }, [consumerId]);

  const handleAction = async (id, status) => {
    try {
      await optimizeService.updateStatus(id, status);
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error("Failed to update recommendation status", err);
    }
  };

  const handleTrainRl = async () => {
    setIsTrainingRl(true);
    setRlLog('Running Markov Decision Process (MDP) episodes in environment...');
    try {
      const results = await optimizeService.getRlTraining(1200);
      setRlResults(results);
      setRlLog('Policy trained! Q-table updated successfully.');
      setTimeout(() => setRlLog(''), 4000);
    } catch (err) {
      setRlLog('RL Simulation failed.');
      console.error(err);
    } finally {
      setIsTrainingRl(false);
    }
  };

  // Format RL results for charting
  const rewardChartData = rlResults?.episode_rewards.map((reward, index) => ({
    episode: index * 50,
    Reward: reward
  })) || [];

  const loadComparisonChartData = rlResults?.hours.map((hour) => ({
    hourLabel: `${hour}:00`,
    'Standard Grid Draw': rlResults.baseline_grid_load[hour],
    'RL-Optimized Draw': rlResults.optimized_grid_load[hour],
    'Price (₹/kWh)': rlResults.electricity_price[hour],
    'Battery SoC (kWh)': rlResults.battery_soc[hour]
  })) || [];

  if (isLoading && recommendations.length === 0 && !rlResults) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-sm pulse-soft">Loading optimizer dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Demand-Response Optimization</h2>
          <p className="text-slate-400 text-sm mt-1">
            Optimizing energy schedules and renewable self-consumption for <span className="text-slate-200 font-semibold">{activeConsumer?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendation Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-base">Active Recommendations</h3>
            <span className="bg-accentAmber/10 border border-accentAmber/20 text-accentAmber text-xs font-bold px-2 py-0.5 rounded-full">
              {recommendations.length} Pending
            </span>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {recommendations.map((rec) => (
                <div key={rec.id} className="glass-panel p-5 rounded-2xl border border-darkBorder flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {rec.recommendation}
                  </p>

                  <div className="flex justify-between items-center text-xs font-bold border-t border-darkBorder/40 pt-3">
                    <span className="text-accentGreen">Save: ₹{rec.est_cost_saving}</span>
                    <span className="text-accentBlue">Avoid: {rec.est_co2_saving} kg CO₂</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleAction(rec.id, 'Accepted')}
                      className="flex-1 bg-accentGreen/15 border border-accentGreen/30 text-accentGreen hover:bg-accentGreen hover:text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleAction(rec.id, 'Dismissed')}
                      className="bg-slate-800 border border-slate-700/50 hover:bg-accentRed/10 hover:text-accentRed hover:border-accentRed/20 p-1.5 rounded-lg text-slate-400 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center">
              <span className="text-slate-500 text-xs block">All loads operating within optimal threshold baselines.</span>
            </div>
          )}
        </div>

        {/* Reinforcement Learning Controller */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center border-b border-darkBorder pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center">
                <Cpu className="h-5 w-5 text-accentBlue mr-2" />
                RL Q-Learning Scheduler (Stretch Goal Demo)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Optimizes battery storage charge/discharge scheduling to reduce peak pricing draw</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {rlLog && (
                <span className="text-xs text-accentGreen pulse-soft font-semibold bg-accentGreen/10 px-3 py-1 rounded-full">
                  {rlLog}
                </span>
              )}
              <button
                onClick={handleTrainRl}
                disabled={isTrainingRl}
                className="flex items-center space-x-1.5 bg-accentBlue hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-accentBlue/15 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isTrainingRl ? 'Training Agent...' : 'Train Q-Learning Agent'}</span>
              </button>
            </div>
          </div>

          {rlResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rewards convergence curve */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Q-Learning Rewards Convergence</span>
                <div className="h-52 w-full bg-[#090d16] p-2 rounded-xl border border-darkBorder">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rewardChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="episode" stroke="#64748B" fontSize={8} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={8} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#1E293B', borderRadius: '12px', fontSize: 10 }} />
                      <Line type="monotone" dataKey="Reward" stroke="#10B981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">Agent learns to maximize rewards (moving closer to zero grid cost) as policy converges over 1200 episodes.</span>
              </div>

              {/* Peak shifting curve comparison */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Optimized Daily Peak Shaving</span>
                <div className="h-52 w-full bg-[#090d16] p-2 rounded-xl border border-darkBorder">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loadComparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="hourLabel" stroke="#64748B" fontSize={8} tickLine={false} interval={5} />
                      <YAxis stroke="#64748B" fontSize={8} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#151D30', borderColor: '#1E293B', borderRadius: '12px', fontSize: 10 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 8 }} />
                      <Line type="monotone" dataKey="Standard Grid Draw" stroke="#FF4D4D" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="RL-Optimized Draw" stroke="#10B981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">The agent charges battery at off-peak rates and discharges during peak hours (17:00-20:00) to shave grid load.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-darkBorder p-12 rounded-2xl text-center">
              <Gauge className="h-12 w-12 text-slate-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">RL Policy Uninitialized</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal">
                Execute a tabular Q-learning simulation in the environment to train the neural scheduler and inspect the peak-shaving policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Optimization;
