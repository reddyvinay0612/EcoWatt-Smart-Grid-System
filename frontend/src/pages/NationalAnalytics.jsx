import React, { useState, useMemo, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import India from '@react-map/india';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  Search, 
  ArrowUpDown, 
  BarChart2, 
  TrendingUp, 
  Download, 
  Sun, 
  Moon, 
  Map, 
  Globe,
  Users,
  IndianRupee,
  ChevronRight,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';

// --- DATASETS & UTILITIES ---

const stateDataset = {
  'Andaman and Nicobar Islands': { value: 900, tier: 'Low', pop: '400k', gdp: 220000 },
  'Andhra Pradesh': { value: 2299.25, tier: 'High', pop: '53M', gdp: 220000 },
  'Arunachal Pradesh': { value: 2562.09, tier: 'High', pop: '1.6M', gdp: 210000 },
  'Assam': { value: 1069.96, tier: 'Medium', pop: '36M', gdp: 100000 },
  'Bihar': { value: 835.03, tier: 'Low', pop: '127M', gdp: 54000 },
  'Chandigarh': { value: 2000, tier: 'Medium', pop: '1.2M', gdp: 350000 },
  'Chhattisgarh': { value: 3105.21, tier: 'High', pop: '30M', gdp: 140000 },
  'Dadra and Nagar Haveli': { value: 15642.35, tier: 'High', pop: '400k', gdp: 350000 },
  'Daman and Diu': { value: 15642.35, tier: 'High', pop: '250k', gdp: 350000 },
  'Delhi': { value: 3636.70, tier: 'High', pop: '20M', gdp: 440000 },
  'Goa': { value: 5485.87, tier: 'High', pop: '1.6M', gdp: 580000 },
  'Gujarat': { value: 4646.19, tier: 'High', pop: '64M', gdp: 280000 },
  'Haryana': { value: 4875.30, tier: 'High', pop: '28M', gdp: 290000 },
  'Himachal Pradesh': { value: 3214.53, tier: 'High', pop: '7.4M', gdp: 220000 },
  'Jammu and Kashmir': { value: 2452.77, tier: 'High', pop: '14M', gdp: 120000 },
  'Jharkhand': { value: 1760.78, tier: 'Medium', pop: '39M', gdp: 90000 },
  'Karnataka': { value: 3357.58, tier: 'High', pop: '67M', gdp: 300000 },
  'Kerala': { value: 2486.49, tier: 'High', pop: '35M', gdp: 250000 },
  'Ladakh': { value: 2000, tier: 'Medium', pop: '300k', gdp: 180000 },
  'Lakshadweep': { value: 800, tier: 'Low', pop: '65k', gdp: 200000 },
  'Madhya Pradesh': { value: 1958.49, tier: 'Medium', pop: '85M', gdp: 140000 },
  'Maharashtra': { value: 2990.07, tier: 'High', pop: '125M', gdp: 240000 },
  'Manipur': { value: 1370.01, tier: 'Medium', pop: '3.0M', gdp: 95000 },
  'Meghalaya': { value: 2688.86, tier: 'High', pop: '3.3M', gdp: 100000 },
  'Mizoram': { value: 2024.78, tier: 'High', pop: '1.2M', gdp: 200000 },
  'Nagaland': { value: 1079.26, tier: 'Medium', pop: '2.2M', gdp: 140000 },
  'Odisha': { value: 2598.14, tier: 'High', pop: '44M', gdp: 150000 },
  'Puducherry': { value: 4479.88, tier: 'High', pop: '1.6M', gdp: 240000 },
  'Punjab': { value: 4120.51, tier: 'High', pop: '30M', gdp: 180000 },
  'Rajasthan': { value: 2544.64, tier: 'High', pop: '81M', gdp: 160000 },
  'Sikkim': { value: 2863.31, tier: 'High', pop: '700k', gdp: 520000 },
  'Tamil Nadu': { value: 3659.96, tier: 'High', pop: '77M', gdp: 270000 },
  'Telangana': { value: 4162.38, tier: 'High', pop: '38M', gdp: 310000 },
  'Tripura': { value: 1102.52, tier: 'Medium', pop: '4.1M', gdp: 140000 },
  'Uttar Pradesh': { value: 1502.60, tier: 'Medium', pop: '235M', gdp: 85000 },
  'Uttarakhand': { value: 2974.95, tier: 'High', pop: '11M', gdp: 230000 },
  'West Bengal': { value: 1508.41, tier: 'Medium', pop: '99M', gdp: 150000 }
};

const NATIONAL_AVG = 1390;
const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/harsh-chhabra/India-States-Districts-GeoJSON/master/India_States.geojson';

const getColorScale = (value, average) => {
  if (average) {
    if (value < average * 0.8) return { color: '#10B981', tier: 'Low' };
    if (value > average * 1.2) return { color: '#EF4444', tier: 'High' };
    return { color: '#F59E0B', tier: 'Medium' };
  }
  if (value < 1000) return { color: '#10B981', tier: 'Low' };
  if (value > 2000) return { color: '#EF4444', tier: 'High' };
  return { color: '#F59E0B', tier: 'Medium' };
};

const getDistrictsForState = (stateName, stateAverage) => {
  const districtNames = {
    'Maharashtra': ['Mumbai City', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati'],
    'Karnataka': ['Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dharwad', 'Dakshina Kannada', 'Kalaburagi', 'Ballari', 'Udupi'],
    'Uttar Pradesh': ['Noida (G.B. Nagar)', 'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Ghaziabad', 'Meerut'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Jamnagar', 'Bhavnagar', 'Anand'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode'],
    'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
    'Telangana': ['Hyderabad', 'Medchal-Malkajgiri', 'Ranga Reddy', 'Warangal', 'Nizamabad', 'Khammam'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Hooghly', 'Paschim Medinipur', 'Purba Bardhaman'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
    'Kerala': ['Thiruvananthapuram', 'Ernakulam (Kochi)', 'Kozhikode', 'Thrissur', 'Malappuram', 'Palakkad'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool']
  };

  const names = districtNames[stateName] || [
    `${stateName} North`, `${stateName} South`, `${stateName} East`, 
    `${stateName} West`, `${stateName} Central`, `${stateName} Rural`
  ];

  let seed = 0;
  for (let i = 0; i < stateName.length; i++) {
    seed += stateName.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const cPoints = [];
  for (let r = 0; r < 3; r++) {
    cPoints[r] = [];
    for (let c = 0; c < 4; c++) {
      const baseValX = c * 133.3;
      const baseValY = r * 200.0;
      const offsetX = (c === 0 || c === 3) ? 0 : (random() - 0.5) * 40;
      const offsetY = (r === 0 || r === 2) ? 0 : (random() - 0.5) * 40;
      cPoints[r].push([baseValX + offsetX, baseValY + offsetY]);
    }
  }

  const list = [];
  let nameIdx = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const p0 = cPoints[r][c];
      const p1 = cPoints[r][c+1];
      const p2 = cPoints[r+1][c+1];
      const p3 = cPoints[r+1][c];
      
      const path = `M ${p0[0].toFixed(1)},${p0[1].toFixed(1)} L ${p1[0].toFixed(1)},${p1[1].toFixed(1)} L ${p2[0].toFixed(1)},${p2[1].toFixed(1)} L ${p3[0].toFixed(1)},${p3[1].toFixed(1)} Z`;
      
      const variance = 0.55 + random() * 0.9;
      const val = Math.round(stateAverage * variance * 100) / 100;
      
      let tier = 'Medium';
      if (val < stateAverage * 0.8) tier = 'Low';
      else if (val > stateAverage * 1.2) tier = 'High';
      
      const popEstimate = `${Math.round(1 + random() * 8)}M`;
      const gdpEstimate = Math.round((stateDataset[stateName]?.gdp || 150000) * (0.6 + random() * 0.8));
      
      list.push({
        name: names[nameIdx] || `${stateName} District ${nameIdx + 1}`,
        value: val,
        tier,
        pop: popEstimate,
        gdp: gdpEstimate,
        path
      });
      nameIdx++;
    }
  }

  return list;
};

// --- HELPER COMPONENT DECLARATIONS ---

function Breadcrumb({ currentView, selectedState, selectedDistrict, onNavigate }) {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold py-3 px-4 rounded-xl bg-[#0F1626] border border-darkBorder/40 transition-all select-none">
      <button 
        onClick={() => onNavigate('india', null, null)}
        className="flex items-center space-x-1.5 text-slate-400 hover:text-accentBlue transition-all"
      >
        <span>India</span>
      </button>
      {selectedState && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <button
            onClick={() => onNavigate('state', selectedState, null)}
            className={`hover:text-accentBlue transition-all ${
              currentView === 'state' ? 'text-accentBlue font-bold' : 'text-slate-400'
            }`}
          >
            {selectedState}
          </button>
        </>
      )}
      {selectedDistrict && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className="text-accentBlue font-bold">{selectedDistrict.name}</span>
        </>
      )}
    </nav>
  );
}

function Legend({ view, isDarkMode }) {
  const isNational = view === 'india';
  return (
    <div className={`glass-panel p-4 rounded-xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Consumption Ranges
      </h4>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-accentRed rounded-md"></span>
            <span className="font-semibold text-slate-300">High Consumption</span>
          </div>
          <span className="text-slate-400 font-bold">{isNational ? '> 2,000 kWh' : '> 120% average'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-amber-500 rounded-md"></span>
            <span className="font-semibold text-slate-300">Medium Consumption</span>
          </div>
          <span className="text-slate-400 font-bold">{isNational ? '1,000 – 2,000 kWh' : '80% – 120% average'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 bg-accentGreen rounded-md"></span>
            <span className="font-semibold text-slate-300">Low Consumption</span>
          </div>
          <span className="text-slate-400 font-bold">{isNational ? '< 1,000 kWh' : '< 80% average'}</span>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ name, value, tier, pop, gdp, comparisonToAvg, onClose, averageLabel, isDarkMode }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl border-t p-6 z-50 max-h-[80vh] overflow-y-auto transform transition-transform duration-300 translate-y-0 lg:relative lg:translate-y-0 lg:rounded-2xl lg:shadow-none lg:border lg:z-0 ${
      isDarkMode 
        ? 'bg-[#0B0F19] border-darkBorder/50 text-slate-100 lg:bg-slate-900/40 lg:border-darkBorder/40' 
        : 'bg-white border-slate-205 text-slate-850 lg:bg-white lg:border-slate-200 lg:shadow-sm'
    }`}>
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-700/20">
        <h3 className="font-extrabold text-base">Regional Inspections</h3>
        <button onClick={onClose} className="lg:hidden text-xs font-bold text-slate-400 border px-2.5 py-1 rounded-lg">
          Close
        </button>
      </div>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold truncate max-w-[180px]">{name}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            tier === 'High' ? 'bg-accentRed/10 border border-accentRed/25 text-accentRed'
            : tier === 'Medium' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-505 text-amber-500'
            : 'bg-accentGreen/10 border border-accentGreen/25 text-accentGreen'
          }`}>
            {tier} Consumption
          </span>
        </div>
        <div className={`space-y-3.5 p-4 rounded-xl border ${isDarkMode ? 'bg-[#060A12] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <IndianRupee className="h-3.5 w-3.5 mr-1" /> Per-Capita kWh
            </span>
            <span className="text-base font-extrabold">{value?.toLocaleString()} kWh</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <Users className="h-3.5 w-3.5 mr-1" /> Population
            </span>
            <span className="text-sm font-semibold">{pop || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              <Globe className="h-3.5 w-3.5 mr-1" /> Est GDP Per Capita
            </span>
            <span className="text-sm font-semibold">{gdp ? `₹${gdp.toLocaleString()}` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700/10 pt-3">
            <span className="text-xs text-slate-400 font-semibold">Comparison to {averageLabel}</span>
            <div className="text-right">
              <span className={`text-sm font-bold block ${comparisonToAvg > 0 ? 'text-accentRed' : 'text-accentGreen'}`}>
                {comparisonToAvg > 0 ? '+' : ''}{comparisonToAvg.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-550 font-medium block">vs benchmark average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ data, onSelect, placeholder = 'Search...', isDarkMode }) {
  const [query, setQuery] = useState('');
  const suggestions = query ? data.filter(item => item.name.toLowerCase().includes(query.toLowerCase())) : [];

  const handleSelect = (item) => {
    onSelect(item);
    setQuery('');
  };

  return (
    <div className="relative w-full sm:w-64">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-medium outline-none border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/80 border-slate-800 text-slate-200 focus:border-slate-750 focus:border-slate-700' 
            : 'bg-white border-slate-250 text-slate-800 focus:border-slate-350 shadow-sm'
        }`}
      />
      {query && (
        <div className={`absolute z-50 left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${
          isDarkMode ? 'bg-[#151D30] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {suggestions.slice(0, 5).map(item => (
            <button
              key={item.name}
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-750'
              }`}
            >
              {item.name} ({item.value.toFixed(1)} kWh)
            </button>
          ))}
          {suggestions.length === 0 && (
            <div className="p-3 text-xs text-slate-500 text-center">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

function RankingTable({ data, selectedItem, onSelect, isDarkMode, isNational }) {
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });

  const sortedData = [...data].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (typeof valA === 'string') {
      return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <h3 className={`font-bold text-base mb-4 border-b pb-2 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
        {isNational ? 'State Energy Rankings' : 'District Energy Rankings'}
      </h3>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-700/20 text-slate-400">
              <th className="pb-3 font-semibold text-center w-16">Rank</th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('name')}>
                <div className="flex items-center">
                  {isNational ? 'State / UT' : 'District'} <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('value')}>
                <div className="flex items-center">
                  Consumption (kWh) <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('tier')}>
                <div className="flex items-center">
                  Tier <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
              <th className="pb-3 font-semibold cursor-pointer select-none" onClick={() => requestSort('pop')}>
                <div className="flex items-center">
                  Population <ArrowUpDown className="h-3.5 w-3.5 ml-1" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => {
              const globalIdx = [...data]
                .sort((a, b) => b.value - a.value)
                .findIndex(x => x.name === item.name) + 1;
                
              return (
                <tr 
                  key={item.name} 
                  onClick={() => onSelect(item)}
                  className={`cursor-pointer border-b transition-all ${
                    selectedItem?.name === item.name 
                      ? isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-200 border-slate-300'
                      : isDarkMode ? 'border-slate-850/40 hover:bg-slate-900/20' : 'border-slate-100/65 hover:bg-slate-100/50'
                  }`}
                >
                  <td className="py-3 font-bold text-center text-slate-400">{globalIdx}</td>
                  <td className={`py-3 font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</td>
                  <td className="py-3 font-extrabold">{item.value.toLocaleString()} kWh</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.tier === 'High' ? 'bg-accentRed/10 text-accentRed' 
                      : item.tier === 'Medium' ? 'bg-amber-500/10 text-amber-505 text-amber-500' 
                      : 'bg-accentGreen/10 text-accentGreen'
                    }`}>
                      {item.tier}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 font-medium">{item.pop || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonChart({ itemA, itemB, averageValue, averageLabel, isDarkMode }) {
  const chartData = [
    { 
      name: itemA?.name || 'Region A', 
      Consumption: itemA?.value || 0, 
      fill: itemA?.tier === 'High' ? '#EF4444' : itemA?.tier === 'Medium' ? '#F59E0B' : '#10B981' 
    },
    { 
      name: itemB?.name || 'Region B', 
      Consumption: itemB?.value || 0, 
      fill: itemB?.tier === 'High' ? '#EF4444' : itemB?.tier === 'Medium' ? '#F59E0B' : '#10B981' 
    },
    { 
      name: averageLabel, 
      Consumption: averageValue, 
      fill: '#3B82F6'
    }
  ];

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all ${
      isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
        <BarChart2 className="h-5 w-5 text-accentBlue" />
        <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Side-by-Side Comparison (kWh)
        </h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} unit=" kWh" />
            <ChartTooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#151D30' : '#FFFFFF', 
                borderColor: isDarkMode ? '#1E293B' : '#E5E7EB', 
                borderRadius: '12px' 
              }}
              labelStyle={{ color: '#94A3B8', fontWeight: '600' }}
            />
            <Bar dataKey="Consumption" radius={[6, 6, 0, 0]} maxBarSize={45}>
              {chartData.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FilterButtons({ tierFilter, onFilterChange, isDarkMode }) {
  return (
    <div className={`flex rounded-xl p-1 border transition-all ${
      isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-355 border-slate-300'
    }`}>
      {['All', 'High', 'Medium', 'Low'].map(tier => (
        <button
          key={tier}
          onClick={() => onFilterChange(tier)}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tierFilter === tier 
              ? 'bg-blue-600 text-white shadow' 
              : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          {tier}
        </button>
      ))}
    </div>
  );
}

function IndiaMap({ stateData, selectedState, onSelectState, tierFilter, isDarkMode }) {
  // Compute stateColors based on active datasets and filters
  const stateColors = {};
  stateData.forEach(s => {
    const isFiltered = tierFilter !== 'All' && s.tier !== tierFilter;
    if (isFiltered) {
      stateColors[s.name] = isDarkMode ? '#111827' : '#F3F4F6';
    } else {
      const { color } = getColorScale(s.value);
      stateColors[s.name] = selectedState === s.name ? '#60A5FA' : color;
    }
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]">
      <div className="w-full max-w-[400px] aspect-square flex items-center justify-center my-4">
        <India
          type="select-single"
          size={380}
          mapColor={isDarkMode ? '#1E293B' : '#E5E7EB'}
          strokeColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
          strokeWidth={1.5}
          hoverColor="#38BDF8"
          selectColor="#60A5FA"
          cityColors={stateColors}
          onSelect={(stateCode) => onSelectState(stateCode)}
          hints={true}
          hintTextColor="#FFFFFF"
          hintBackgroundColor="#151D30"
          hintPadding="8px 12px"
          hintBorderRadius={8}
        />
      </div>
    </div>
  );
}

function StateMap({ selectedState, districts, selectedDistrict, onSelectDistrict, tierFilter, isDarkMode, stateAverage }) {
  const [hoveredName, setHoveredName] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[450px]" onMouseMove={handleMouseMove}>
      <div className="w-full max-w-[420px] aspect-square flex items-center justify-center my-4 map">
        <svg version="1.1" viewBox="0 0 400 400" className="w-full h-full select-none">
          {districts.map((d, index) => {
            const { color, tier } = getColorScale(d.value, stateAverage);
            const isFiltered = tierFilter !== 'All' && tier !== tierFilter;
            const baseFill = isFiltered 
              ? (isDarkMode ? '#111827' : '#F3F4F6')
              : (selectedDistrict?.name === d.name ? '#60A5FA' : color);

            return (
              <path
                key={index}
                d={d.path}
                onClick={() => onSelectDistrict(d)}
                onMouseEnter={() => setHoveredName(d.name)}
                onMouseLeave={() => setHoveredName(null)}
                style={{
                  fill: baseFill,
                  stroke: isDarkMode ? '#0B0F19' : '#FFFFFF',
                  strokeWidth: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              />
            );
          })}
        </svg>
      </div>

      {hoveredName && (
        <div 
          style={{
            position: 'fixed',
            backgroundColor: '#151D30',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 1000,
            top: mousePos.y + 20,
            left: mousePos.x + 20,
            fontSize: '11px',
            fontWeight: '700',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
          }}
        >
          {hoveredName} ({districts.find(d => d.name === hoveredName)?.value} kWh)
        </div>
      )}
    </div>
  );
}

// --- MAIN INTEGRATED DASHBOARD COMPONENT ---

function NationalAnalytics({ setViewMode }) {
  const [currentView, setCurrentView] = useState('india'); 
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tierFilter, setTierFilter] = useState('All');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [compareA, setCompareA] = useState('Maharashtra');
  const [compareB, setCompareB] = useState('Uttar Pradesh');

  const stateData = useMemo(() => {
    return Object.keys(stateDataset).map(name => {
      let value = stateDataset[name].value;
      let tier = 'Medium';
      if (value < 1000) tier = 'Low';
      else if (value > 2000) tier = 'High';
      return {
        name,
        value,
        tier,
        pop: stateDataset[name].pop,
        gdp: stateDataset[name].gdp
      };
    });
  }, []);

  const districts = useMemo(() => {
    if (!selectedState) return [];
    return getDistrictsForState(selectedState, stateDataset[selectedState].value);
  }, [selectedState]);

  useEffect(() => {
    if (currentView === 'state' && districts.length >= 2) {
      setCompareA(districts[0].name);
      setCompareB(districts[1].name);
    } else {
      setCompareA('Maharashtra');
      setCompareB('Uttar Pradesh');
    }
  }, [currentView, selectedState, districts]);

  const activeDataset = useMemo(() => {
    if (currentView === 'india') {
      return stateData;
    } else {
      const stateAvg = stateDataset[selectedState]?.value || 1000;
      return districts.map(d => {
        let tier = 'Medium';
        if (d.value < stateAvg * 0.8) tier = 'Low';
        else if (d.value > stateAvg * 1.2) tier = 'High';
        return { ...d, tier };
      });
    }
  }, [currentView, selectedState, districts, stateData]);

  const comparisonItems = useMemo(() => {
    const itemA = activeDataset.find(x => x.name === compareA);
    const itemB = activeDataset.find(x => x.name === compareB);
    return { itemA, itemB };
  }, [compareA, compareB, activeDataset]);

  const correlationData = useMemo(() => {
    return activeDataset.map(item => ({
      name: item.name,
      gdp: (item.gdp || 150000) / 1000, 
      kwh: item.value,
      tier: item.tier
    }));
  }, [activeDataset]);

  const handleNavigate = (view, state, district) => {
    setCurrentView(view);
    setSelectedState(state);
    setSelectedDistrict(district);
  };

  const handleSelectState = (stateName) => {
    setSelectedState(stateName);
    setCurrentView('state');
    setSelectedDistrict(null);
  };

  const handleExportPng = () => {
    const node = document.querySelector('.map-container-export');
    if (!node) return;
    toPng(node, { backgroundColor: isDarkMode ? '#080C14' : '#F8FAFC' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${currentView}_electricity_map.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export map visual', err);
      });
  };

  const detailItem = useMemo(() => {
    if (currentView === 'india') {
      if (!selectedState) return null;
      const stateObj = stateData.find(s => s.name === selectedState);
      if (!stateObj) return null;
      const dev = ((stateObj.value - NATIONAL_AVG) / NATIONAL_AVG) * 100;
      return { ...stateObj, dev };
    } else {
      if (!selectedDistrict) return null;
      const stateAvg = stateDataset[selectedState]?.value || 1000;
      const dev = ((selectedDistrict.value - stateAvg) / stateAvg) * 100;
      return { ...selectedDistrict, dev };
    }
  }, [currentView, selectedState, selectedDistrict, stateData]);

  const themeClass = isDarkMode ? 'dark bg-[#080C14] text-slate-100' : 'light bg-slate-50 text-slate-800';

  return (
    <div className={`p-6 space-y-8 rounded-3xl transition-all duration-300 ${themeClass}`}>
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-slate-700/30">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            National Electricity Consumption Dashboard
          </h2>
          <div className="mt-2">
            <Breadcrumb 
              currentView={currentView}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              onNavigate={handleNavigate}
            />
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {setViewMode && (
            <div className={`flex rounded-xl p-1 border ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-200/50 border-slate-300'
            }`}>
              <button
                onClick={() => setViewMode('national')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accentBlue text-white shadow transition-all"
              >
                National Map
              </button>
              <button
                onClick={() => setViewMode('local')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Local Telemetry
              </button>
            </div>
          )}
          <button
            onClick={handleExportPng}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Export map view as PNG"
          >
            <Download className="h-4 w-4" />
            <span>Export Map</span>
          </button>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-700/60 text-amber-400 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Center Panel (Map & Filters) - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <SearchBar 
              data={activeDataset}
              onSelect={(item) => {
                if (currentView === 'india') {
                  handleSelectState(item.name);
                } else {
                  setSelectedDistrict(item);
                }
              }}
              placeholder={currentView === 'india' ? "Search state..." : "Search district..."}
              isDarkMode={isDarkMode}
            />

            {currentView === 'state' && (
              <button 
                onClick={handleBack => handleNavigate('india', null, null)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-accentBlue text-white hover:bg-blue-600 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>India Map</span>
              </button>
            )}

            <FilterButtons 
              tierFilter={tierFilter}
              onFilterChange={setTierFilter}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Map View Box wrapper */}
          <div className={`map-container-export p-6 rounded-2xl border flex flex-col items-center justify-center relative min-h-[480px] ${
            isDarkMode ? 'border-darkBorder/40 bg-slate-900/10' : 'border-slate-205 bg-white shadow-sm'
          }`}>
            <span className="absolute top-4 left-6 text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {currentView === 'india' ? 'India Choropleth View' : `${selectedState} Districts View`}
            </span>
            
            <div className="w-full max-w-[420px] aspect-square flex items-center justify-center my-4 map">
              <AnimatePresence mode="wait">
                {currentView === 'india' ? (
                  <motion.div
                    key="india-map"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <IndiaMap 
                      stateData={stateData}
                      selectedState={selectedState}
                      onSelectState={handleSelectState}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="state-map"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <StateMap 
                      selectedState={selectedState}
                      districts={districts}
                      selectedDistrict={selectedDistrict}
                      onSelectDistrict={setSelectedDistrict}
                      tierFilter={tierFilter}
                      isDarkMode={isDarkMode}
                      stateAverage={stateDataset[selectedState]?.value || 1000}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Map Legend */}
            <div className="w-full flex justify-around border-t pt-4 border-slate-700/25 text-[10px] sm:text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentRed rounded-sm"></span>
                <span className="text-slate-400">High ({currentView === 'india' ? '>2k' : '>120%'})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                <span className="text-slate-400">Medium ({currentView === 'india' ? '1k-2k' : '80-120%'})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-accentGreen rounded-sm"></span>
                <span className="text-slate-400">Low ({currentView === 'india' ? '<1k' : '<80%'})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Details panel) - Span 5 */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          <Legend view={currentView} isDarkMode={isDarkMode} />
          
          {detailItem ? (
            <DetailPanel 
              name={detailItem.name}
              value={detailItem.value}
              tier={detailItem.tier}
              pop={detailItem.pop}
              gdp={detailItem.gdp}
              comparisonToAvg={detailItem.dev}
              isDarkMode={isDarkMode}
              averageLabel={currentView === 'india' ? 'national average' : 'state average'}
              onClose={() => {
                if (currentView === 'state') setSelectedDistrict(null);
                else setSelectedState(null);
              }}
            />
          ) : (
            <div className={`p-6 rounded-2xl border text-center py-12 flex-1 flex flex-col justify-center items-center ${
              isDarkMode ? 'border-darkBorder/40 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-white text-slate-500 shadow-sm'
            }`}>
              <HelpCircle className="h-8 w-8 mb-3 opacity-60 text-accentBlue animate-bounce" />
              <p className="text-xs font-semibold max-w-[240px] leading-relaxed">
                {currentView === 'india' 
                  ? 'Click on any state on the map to inspect district metrics.' 
                  : 'Click on a district polygon to view per-capita electrical audit.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Tool & GDP Scatter Correlation row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Comparison Tool - Span 6 */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentView === 'india' ? 'State A' : 'District A'}
              </label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-700'
                }`}
              >
                {activeDataset.map(x => (
                  <option key={x.name} value={x.name}>{x.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentView === 'india' ? 'State B' : 'District B'}
              </label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-700'
                }`}
              >
                {activeDataset.map(x => (
                  <option key={x.name} value={x.name}>{x.name}</option>
                ))}
              </select>
            </div>
          </div>

          <ComparisonChart 
            itemA={comparisonItems.itemA}
            itemB={comparisonItems.itemB}
            averageValue={currentView === 'india' ? NATIONAL_AVG : (stateDataset[selectedState]?.value || 1000)}
            averageLabel={currentView === 'india' ? 'National Average' : 'State Average'}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Correlation Scatter Chart - Span 6 */}
        <div className={`lg:col-span-6 glass-panel p-6 rounded-2xl border ${
          isDarkMode ? 'border-darkBorder/40 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 mb-6 border-b pb-2 border-slate-700/20">
            <TrendingUp className="h-5 w-5 text-accentGreen" />
            <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Consumption vs. GDP Per Capita Correlation
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1E293B' : '#E5E7EB'} />
                <XAxis 
                  type="number" 
                  dataKey="gdp" 
                  name="GDP Per Capita" 
                  unit="k" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'GDP (₹ in Thousands)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="kwh" 
                  name="Energy Consumption" 
                  unit=" kWh" 
                  stroke="#64748B" 
                  fontSize={10}
                  label={{ value: 'Per Capita (kWh)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748B', fontSize: 10 }}
                />
                <ZAxis range={[60, 300]} />
                <ChartTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          isDarkMode ? 'bg-[#151D30] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <p className="font-bold">{data.name}</p>
                          <p>Consumption: <span className="font-bold">{data.kwh.toLocaleString()} kWh</span></p>
                          <p>GDP: <span className="font-bold">₹{(data.gdp * 1000).toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Regions" data={correlationData} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Rankings List Table */}
      <RankingTable 
        data={activeDataset}
        selectedItem={currentView === 'india' ? (selectedState ? { name: selectedState } : null) : selectedDistrict}
        onSelect={(item) => {
          if (currentView === 'india') {
            handleSelectState(item.name);
          } else {
            setSelectedDistrict(item);
          }
        }}
        isDarkMode={isDarkMode}
        isNational={currentView === 'india'}
      />
      <div className="text-[10px] text-slate-500 text-center font-medium italic">
        * Footnote: District-level values are illustrative estimates generated relative to the respective state averages.
      </div>
    </div>
  );
}

export default NationalAnalytics;
