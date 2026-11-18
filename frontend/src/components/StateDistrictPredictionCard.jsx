// frontend/src/components/StateDistrictPredictionCard.jsx
import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Leaf, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { getRegionPrediction } from '../utils/statePredictionEngine';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function StateDistrictPredictionCard({ 
  selectedRegion, 
  isDistrict = false, 
  parentState = null 
}) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [horizon, setHorizon] = useState('2026-2027');

  const cardBg = isDarkMode ? '#131D2E' : '#FFFFFF';
  const cardBorder = isDarkMode ? '#1E293B' : '#E2E8F0';
  const titleColor = isDarkMode ? '#F8FAFC' : '#0B296B';
  const subtextColor = isDarkMode ? '#94A3B8' : '#64748B';
  const innerBoxBg = isDarkMode ? '#0F172A' : '#F8FAFC';

  const prediction = useMemo(() => {
    return getRegionPrediction(selectedRegion, horizon);
  }, [selectedRegion, horizon]);

  if (!selectedRegion || !prediction) {
    return (
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
        color: subtextColor,
        fontSize: 11
      }}>
        {language === 'kn' ? 'ಮುನ್ಸೂಚನೆಯನ್ನು ವೀಕ್ಷಿಸಲು ನಕ್ಷೆಯಲ್ಲಿ ಯಾವುದೇ ರಾಜ್ಯ ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.' :
         language === 'hi' ? 'लोड पूर्वानुमान देखने के लिए मानचित्र पर किसी भी राज्य या जिले का चयन करें।' :
         'Select any state or district on the map to view econometric demand forecast.'}
      </div>
    );
  }

  const regionName = selectedRegion.name || selectedRegion;

  // Bilingual titles
  const cardPreTitle = language === 'kn' ? 'ಸಿಇಎ ಭವಿಷ್ಯವಾಣಿ ಲೋಡ್ ರವಾನೆ ಮುನ್ಸೂಚನೆ' :
                       language === 'hi' ? 'सीईए पूर्वानुमानित लोड प्रेषण पूर्वानुमान' :
                       'CEA PREDICTIVE LOAD DISPATCH FORECAST';

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      {/* ── Header: Title & Horizon Selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {cardPreTitle}
            </span>
            <span style={{
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
              fontSize: 8.5,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 3
            }}>
              ● ML ARIMA/CAGR
            </span>
          </div>

          <h3 style={{ margin: '2px 0 0 0', fontSize: 15, fontWeight: 900, color: titleColor }}>
            {regionName} {isDistrict ? `(${parentState} District)` : ''}
          </h3>
        </div>

        {/* Horizon Filter Tabs */}
        <div style={{ display: 'flex', background: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 6, padding: 2, border: `1px solid ${cardBorder}` }}>
          {[
            { id: 'Next 30 Days', label: language === 'kn' ? 'ಮುಂದಿನ 30 ದಿನಗಳು' : language === 'hi' ? 'अगले 30 दिन' : 'Next 30 Days' },
            { id: 'Next Quarter', label: language === 'kn' ? 'ಮುಂದಿನ ತ್ರೈಮಾಸಿಕ' : language === 'hi' ? 'अगली तिमाही' : 'Next Quarter' },
            { id: '2026-2027',    label: 'FY 2026-27' }
          ].map((h) => (
            <button
              key={h.id}
              onClick={() => setHorizon(h.id)}
              style={{
                background: horizon === h.id ? '#0B296B' : 'transparent',
                color: horizon === h.id ? '#FFFFFF' : subtextColor,
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 9.5,
                fontWeight: horizon === h.id ? 800 : 600,
                cursor: 'pointer',
                transition: 'background 0.12s'
              }}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Projections: 2 Metric Boxes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        
        {/* Metric 1: Projected Demand (Electricity) */}
        <div style={{
          background: innerBoxBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={13} color="#0284C7" />
              <span>{language === 'kn' ? 'ಅಂದಾಜು ಬೇಡಿಕೆ' : language === 'hi' ? 'अनुमानित मांग' : 'Projected Demand'}</span>
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: '#15803D',
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              padding: '1px 5px',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <ArrowUpRight size={10} />
              <span>+{prediction.deltas.electricityPercent}%</span>
            </span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 900, color: titleColor, letterSpacing: '-0.02em' }}>
            {prediction.predicted.electricity.toLocaleString()} <span style={{ fontSize: 10, color: subtextColor, fontWeight: 500 }}>kWh/capita</span>
          </div>

          <div style={{ fontSize: 9, color: subtextColor, marginTop: 4, borderTop: `1px solid ${cardBorder}`, paddingTop: 4 }}>
            {language === 'kn' ? 'ಪ್ರಸ್ತುತ ಮೂಲರೇಖೆ: ' : language === 'hi' ? 'वर्तमान बेसलाइन: ' : 'Current baseline: '}
            <strong>{prediction.current.electricity.toLocaleString()} kWh</strong>
          </div>
        </div>

        {/* Metric 2: Carbon Trajectory */}
        <div style={{
          background: innerBoxBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: subtextColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Leaf size={13} color="#16A34A" />
              <span>{language === 'kn' ? 'ಇಂಗಾಲದ ಹಾದಿ' : language === 'hi' ? 'कार्बन प्रक्षेपवक्र' : 'Carbon Trajectory'}</span>
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: prediction.deltas.carbonPercent <= 4 ? '#15803D' : '#B45309',
              background: prediction.deltas.carbonPercent <= 4 ? '#DCFCE7' : '#FEF3C7',
              border: prediction.deltas.carbonPercent <= 4 ? '1px solid #86EFAC' : '1px solid #FDE68A',
              padding: '1px 5px',
              borderRadius: 3
            }}>
              +{prediction.deltas.carbonPercent}%
            </span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 900, color: titleColor, letterSpacing: '-0.02em' }}>
            {prediction.predicted.carbon.toLocaleString()} <span style={{ fontSize: 10, color: subtextColor, fontWeight: 500 }}>kg CO₂/capita</span>
          </div>

          <div style={{ fontSize: 9, color: subtextColor, marginTop: 4, borderTop: `1px solid ${cardBorder}`, paddingTop: 4 }}>
            Grid factor: <strong>{prediction.projectedEmissionFactor} kg/kWh</strong> (-1.8% RE target)
          </div>
        </div>

      </div>

      {/* ── Mini Sparkline Area Chart ── */}
      <div style={{
        background: innerBoxBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 8,
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: subtextColor, fontWeight: 700 }}>
          <span>PROJECTED CONSUMPTION TREND ({horizon})</span>
          <span style={{ color: '#0284C7' }}>+6.2% Annual Growth Vector</span>
        </div>
        <div style={{ width: '100%', height: 45 }}>
          <ResponsiveContainer width="100%" height={45}>
            <AreaChart data={prediction.daysTrajectory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="predArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 6, fontSize: 9, padding: '2px 6px' }}
                itemStyle={{ color: titleColor, fontWeight: 700 }}
                formatter={(val) => [`${val} kWh`, 'Projected']}
              />
              <Area type="monotone" dataKey="value" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#predArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Footer: Dispatch Peak & CEA Standard Badge ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 9.5,
        color: subtextColor,
        borderTop: `1px solid ${cardBorder}`,
        paddingTop: 6,
        flexWrap: 'wrap',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color="#0284C7" />
          <span>{language === 'kn' ? 'ಅಂದಾಜು ಗರಿಷ್ಠ ಸಮಯ: ' : language === 'hi' ? 'अपेक्षित पीक लोड: ' : 'Expected Peak: '}<strong>{prediction.peakWindow}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontWeight: 700 }}>
          <ShieldCheck size={11} />
          <span>{prediction.confidenceLevel}</span>
        </div>
      </div>

    </div>
  );
}
