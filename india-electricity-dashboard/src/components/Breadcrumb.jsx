import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

function Breadcrumb({ currentView, selectedState, selectedDistrict, onNavigate }) {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all select-none">
      {/* Home / India */}
      <button 
        onClick={() => onNavigate('india', null, null)}
        className="flex items-center space-x-1.5 text-slate-500 hover:text-accentBlue dark:text-slate-400 dark:hover:text-accentBlue transition-all"
      >
        <Home className="h-3.5 w-3.5" />
        <span>India</span>
      </button>

      {/* State Breadcrumb */}
      {selectedState && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-450 dark:text-slate-650" />
          <button
            onClick={() => onNavigate('state', selectedState, null)}
            className={`hover:text-accentBlue transition-all ${
              currentView === 'state' 
                ? 'text-accentBlue font-bold' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {selectedState}
          </button>
        </>
      )}

      {/* District Breadcrumb */}
      {selectedDistrict && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-450 dark:text-slate-650" />
          <span className="text-accentBlue font-bold">{selectedDistrict.name}</span>
        </>
      )}
    </nav>
  );
}

export default Breadcrumb;
