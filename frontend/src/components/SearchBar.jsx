import React, { useState } from 'react';
import { Search } from 'lucide-react';

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
            ? 'bg-slate-900/80 border-slate-800 text-slate-200 focus:border-slate-700' 
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

export default SearchBar;
