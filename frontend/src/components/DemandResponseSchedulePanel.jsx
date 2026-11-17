import React, { useState, useEffect } from 'react';
import { BatteryCharging, Battery, Zap, DollarSign, ArrowDownRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DemandResponseSchedulePanel({ consumerId }) {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const subBg = isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC';

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/optimize/demand-response-schedule/${consumerId || 'HH_001'}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed fetching demand response schedule:", err);
      }
    };
    fetchSchedule();
    const timer = setInterval(fetchSchedule, 30000);
    return () => clearInterval(timer);
  }, [consumerId]);

  if (!data) return null;

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }}>
      {/* Title with Research Gap Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BatteryCharging size={18} color="#10B981" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Q-Learning Automated Demand Response & Battery Dispatch
          </h3>
        </div>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: '#10B981',
          background: isDarkMode ? 'rgba(16,185,129,0.12)' : '#F0FDF4',
          border: '1px solid rgba(16,185,129,0.25)',
          padding: '3px 8px',
          borderRadius: 6
        }}>
          🤖 Part 4: Actionable RL AI Solution
        </span>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: labelColor, fontWeight: 800, textTransform: 'uppercase' }}>Battery State-of-Charge</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {data.current_battery_soc_percentage}% <span style={{ fontSize: 9, fontWeight: 600, color: labelColor }}>({data.battery_capacity_kwh} kWh)</span>
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: '#3B82F6', fontWeight: 800, textTransform: 'uppercase' }}>Peak Demand Shaved</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
            {data.peak_demand_shaved_kw} kW
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>ToU Bill Savings</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            ₹{data.estimated_monthly_bill_savings_inr}/mo
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: subBg, border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <div style={{ fontSize: 8, color: '#EF4444', fontWeight: 800, textTransform: 'uppercase' }}>Avoided Peak Tariff</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>
            {data.avoided_peak_tariff_hours}
          </div>
        </div>
      </div>

      {/* 24-Hour Battery Dispatch Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: labelColor }}>
          <span>24-HOUR OPTIMAL DISPATCH TIMELINE</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#10B981' }}>● Solar Charge (10 AM - 3 PM)</span>
            <span style={{ color: '#3B82F6' }}>● Home Discharge (6 PM - 10 PM)</span>
            <span style={{ color: '#94A3B8' }}>● Eco Standby</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, height: 44, alignItems: 'end' }}>
          {data.hourly_schedule.map((step) => {
            const heightPct = Math.max(25, step.battery_soc_percentage);
            return (
              <div 
                key={step.hour}
                title={`${step.time_label}: ${step.action_name} | Battery: ${step.battery_soc_percentage}% | Tariff: Rs.${step.tariff_inr_per_kwh}/kWh`}
                style={{
                  height: `${heightPct}%`,
                  background: step.badge_color,
                  borderRadius: 3,
                  position: 'relative',
                  border: step.is_current ? '2px solid #FFFFFF' : 'none',
                  boxShadow: step.is_current ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
                  cursor: 'pointer'
                }}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: labelColor, fontWeight: 700 }}>
          <span>00:00 (Standby)</span>
          <span style={{ color: '#10B981', fontWeight: 900 }}>12:00 (Solar Charge)</span>
          <span style={{ color: '#3B82F6', fontWeight: 900 }}>19:00 (Peak Discharge)</span>
          <span>23:00 (Standby)</span>
        </div>
      </div>

      {/* Automated Demand-Response Strategy Banner */}
      <div style={{
        background: isDarkMode ? 'rgba(59,130,246,0.08)' : '#EFF6FF',
        borderLeft: '4px solid #3B82F6',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 10,
        color: isDarkMode ? '#60A5FA' : '#1D4ED8',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <CheckCircle2 size={13} color="#3B82F6" />
        <span>
          <strong>RL Agent Dispatch Policy:</strong> The system automatically stores excess rooftop solar energy during daytime (10:00 AM - 03:00 PM) and discharges 1.4 kW into the home during the high-tariff evening peak (06:00 PM - 10:00 PM at Rs. 11/kWh), cutting monthly electricity bills by Rs. <strong>{data.estimated_monthly_bill_savings_inr}</strong>.
        </span>
      </div>
    </div>
  );
}
