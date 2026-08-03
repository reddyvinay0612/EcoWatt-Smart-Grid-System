import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function NotificationBell({ selectedHouseholdId }) {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cardBg = isDarkMode ? '#0f172a' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9';

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!selectedHouseholdId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/${selectedHouseholdId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [selectedHouseholdId]);

  // Click outside detection to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/${selectedHouseholdId}/read/${id}`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error("Error marking read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/${selectedHouseholdId}/read-all`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isDarkMode ? '#CBD5E1' : '#475569',
          padding: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#EF4444',
            borderRadius: '50%',
            width: 14,
            height: 14,
            fontSize: 8,
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 36,
          right: 0,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 12,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          width: 320,
          zIndex: 100,
          overflow: 'hidden'
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: `1px solid ${cardBorder}`
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: titleColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Anomaly Alerts
            </span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List items */}
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: labelColor, fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Check size={20} color="#10B981" />
                No notification alerts
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 14px',
                    borderBottom: `1px solid ${cardBorder}`,
                    cursor: n.isRead ? 'default' : 'pointer',
                    background: n.isRead ? 'transparent' : hoverBg,
                    transition: 'background 0.15s'
                  }}
                >
                  <ShieldAlert size={14} color={n.isRead ? labelColor : "#EF4444"} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: n.isRead ? 600 : 800,
                      color: n.isRead ? labelColor : titleColor,
                      lineHeight: 1.3
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 8, color: labelColor, fontWeight: 500 }}>
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#3B82F6',
                      alignSelf: 'center',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
