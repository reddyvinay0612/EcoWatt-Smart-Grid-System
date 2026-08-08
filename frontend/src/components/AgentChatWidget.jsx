import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AgentChatWidget() {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **EcoWatt AI assistant**, connected to Snowflake Cortex. Ask me about monthly usage, average consumption, or anomalous spikes!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const messagesEndRef = useRef(null);

  const cardBg = isDarkMode ? '#0f172a' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const bubbleUserBg = '#3B82F6';
  const bubbleBotBg = isDarkMode ? '#1e293b' : '#F1F5F9';
  const textUserColor = '#FFFFFF';
  const textBotColor = isDarkMode ? '#cbd5e1' : '#1e293b';

  const promptChips = [
    "Show anomalies this month",
    "Compare HH_001 and HH_002",
    "Average usage in Greenwood Sector A"
  ];

  // Auto-scroll to bottom of messages with safety check
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.error("scrollIntoView error ignored:", err);
      }
    }
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query || !query.trim()) return;

    setErrorText(null);
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Format chat history for backend (Snowflake Cortex format: list of messages)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('http://localhost:8000/api/v1/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.message || 'Unknown agent execution failure.'}` }]);
      }
    } catch (e) {
      console.error("Agent chat failed:", e);
      setErrorText(e.message || String(e));
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Connection failed: ${e.message || String(e)}. Please ensure the backend server is running.` }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render markdown-style bold text, lists, and tables
  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let inTable = false;

    const parseTableLine = (line) => {
      return line
        .split('|')
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        const cells = parseTableLine(line);

        if (line.includes('---')) {
          continue; // Divider line, skip
        }

        if (!currentTable) {
          currentTable = { headers: cells, rows: [] };
        } else {
          currentTable.rows.push(cells);
        }
      } else {
        if (inTable && currentTable) {
          elements.push(renderTable(currentTable, i));
          currentTable = null;
          inTable = false;
        }

        if (line) {
          elements.push(renderTextLine(line, i));
        }
      }
    }

    if (currentTable) {
      elements.push(renderTable(currentTable, 'final'));
    }

    return <div className="space-y-1.5">{elements}</div>;
  };

  const renderTable = (tableData, key) => {
    return (
      <div key={key} style={{ overflowX: 'auto', margin: '8px 0', border: `1px solid ${cardBorder}`, borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${cardBorder}` }}>
              {tableData.headers.map((h, i) => (
                <th key={i} style={{ padding: '6px 8px', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: rIdx < tableData.rows.length - 1 ? `1px solid ${cardBorder}` : 'none' }}>
                {row.map((cell, cIdx) => {
                  const cellStr = cell ? String(cell) : '';
                  const isBold = cellStr.startsWith('**');
                  return (
                    <td key={cIdx} style={{ padding: '6px 8px', color: textBotColor, fontWeight: isBold ? 800 : 500 }}>
                      {cellStr.replace(/\*\*/g, '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTextLine = (line, key) => {
    // Check if bullet point
    const isBullet = line.startsWith('- ') || line.startsWith('* ');
    const displayLine = isBullet ? line.substring(2) : line;

    const parts = displayLine.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <ul key={key} style={{ listStyleType: 'disc', paddingLeft: 16, margin: '2px 0' }}>
          <li style={{ fontSize: 10.5, lineHeight: 1.4, color: textBotColor }}>{content}</li>
        </ul>
      );
    }

    return (
      <p key={key} style={{ margin: '4px 0', fontSize: 10.5, lineHeight: 1.45, color: textBotColor }}>
        {content}
      </p>
    );
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99 }}>
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            transition: 'transform 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div style={{
          width: 350,
          height: 460,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 16,
          boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#3B82F6" />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Snowflake Cortex AI
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div 
                  key={idx} 
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isUser ? bubbleUserBg : bubbleBotBg,
                    border: `1px solid ${isUser ? 'transparent' : cardBorder}`,
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 12px'
                  }}
                >
                  {isUser ? (
                    <p style={{ margin: 0, fontSize: 10.5, color: textUserColor, lineHeight: 1.4 }}>{m.content}</p>
                  ) : (
                    renderMessageContent(m.content)
                  )}
                </div>
              );
            })}

            {/* Loading / Typing status */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: bubbleBotBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '12px 12px 12px 2px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Loader2 size={12} color="#3B82F6" className="animate-spin" />
                <span style={{ fontSize: 9.5, color: labelColor, fontWeight: 600 }}>Cortex is generating SQL query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          {messages.length === 1 && !loading && (
            <div style={{ padding: '0 12px 6px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {promptChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chip)}
                  style={{
                    background: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 20,
                    padding: '4px 10px',
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: '#3B82F6',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)'}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: 10,
              borderTop: `1px solid ${cardBorder}`,
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Cortex about energy usage..."
              disabled={loading}
              style={{
                flex: 1,
                background: isDarkMode ? '#07090e' : '#F8FAFC',
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 10.5,
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#3B82F6',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
