import React, { useState } from 'react';
import { Building, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HouseholdSelector({ households = [], selectedId, onSelect }) {
  const { isDarkMode } = useTheme();
  const [search, setSearch] = useState('');

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const selectBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const selectBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : '#CBD5E1';
  const selectText = isDarkMode ? '#CBD5E1' : '#0F172A';

  // Filter households by search
  const filtered = households.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      
      {/* Selector dropdown label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Building size={14} color="#3B82F6" />
        <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#475569' }}>
          Select Residential Unit:
        </span>
      </div>

      {/* Select Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={selectedId}
          onChange={e => onSelect && onSelect(e.target.value)}
          style={{
            background: selectBg,
            border: `1px solid ${selectBorder}`,
            borderRadius: 8,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: selectText,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {households.map(h => (
            <option key={h.id} value={h.id}>
              [{h.id}] {h.name}
            </option>
          ))}
        </select>

        {/* Quick search input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={11} color="#64748B" style={{ position: 'absolute', left: 8 }} />
          <input
            type="text"
            placeholder="Search Units..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: selectBg,
              border: `1px solid ${selectBorder}`,
              borderRadius: 8,
              padding: '4px 8px 4px 24px',
              fontSize: 10,
              color: selectText,
              outline: 'none',
              width: 110
            }}
          />
          {search && filtered.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 8,
              marginTop: 4,
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: 120,
              overflowY: 'auto'
            }}>
              {filtered.map(h => (
                <button
                  key={h.id}
                  onClick={() => {
                    onSelect(h.id);
                    setSearch('');
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 9,
                    fontWeight: 700,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: selectText,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
