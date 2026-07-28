import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

function Breadcrumb({ currentView, selectedState, selectedDistrict, onNavigate }) {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold py-3 px-4 rounded-xl bg-[#0B0F19] border border-darkBorder/40 transition-all select-none">
      <button 
        onClick={() => onNavigate('india')}
        className="flex items-center space-x-1.5 text-slate-400 hover:text-accentBlue transition-all"
      >
        <Home className="h-3.5 w-3.5" />
        <span>India</span>
      </button>

      {selectedState && (
        <>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <button
            onClick={() => onNavigate('state')}
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

export default Breadcrumb;
