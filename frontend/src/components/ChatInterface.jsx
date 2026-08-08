import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, Play, Terminal, Database, FileText, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ChatInterface({ activeQuery, clearActiveQuery }) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **EcoWatt AI assistant**, connected to Snowflake Cortex. Ask me about monthly usage, average consumption, or anomalous spikes!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // { name, status, query, result }
  const messagesEndRef = useRef(null);

  // ── Theme from reference screenshot ───────────────────────────
  const cardBg     = '#FFFFFF';
  const cardBorder = '#E8EDF2';
  const titleColor = '#0D1B17';
  const labelColor = '#64748B';
  const inputBg    = '#F5F7FA';

  // Watch for quick action clicks from the parent dashboard page
  useEffect(() => {
    if (activeQuery) {
      handleSend(activeQuery);
      clearActiveQuery();
    }
  }, [activeQuery]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, activeTool]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query || !query.trim()) return;

    // Append user message
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setActiveTool(null);

    // Initialize blank assistant message for streaming
    const assistantIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', toolCalls: [] }]);

    // Prepare conversation history
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value, { stream: !done });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep remainder

        for (const line of lines) {
          const cleaned = line.trim();
          if (cleaned.startsWith('data: ')) {
            const dataStr = cleaned.slice(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'text') {
                // Stream text tokens into assistant message (immutable update to avoid StrictMode double-append)
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  const lastMsg = updated[lastIdx];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    updated[lastIdx] = { ...lastMsg, content: lastMsg.content + parsed.text };
                  }
                  return updated;
                });
              } else if (parsed.type === 'tool') {
                // Render tool execution states
                setActiveTool({
                  name: parsed.tool,
                  status: parsed.status,
                  query: parsed.query,
                  result: parsed.result
                });

                // Attach to final message log once successful (immutable update)
                if (parsed.status === 'success') {
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    const lastMsg = updated[lastIdx];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      const existingCalls = lastMsg.toolCalls || [];
                      if (!existingCalls.some(t => t.query === parsed.query)) {
                        updated[lastIdx] = {
                          ...lastMsg,
                          toolCalls: [...existingCalls, {
                            name: parsed.tool,
                            query: parsed.query,
                            result: parsed.result
                          }]
                        };
                      }
                    }
                    return updated;
                  });
                }
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = `❌ Connection failed: ${e.message}. Please ensure the backend Express REST server is running on port 8000.`;
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setActiveTool(null);
    }
  };

  // Helper parser for basic markdown bold, header, list, and tables
  const renderContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let inTable = false;

    const parseTableLine = (line) => {
      return line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        const cells = parseTableLine(line);
        if (line.includes('---')) continue; // skip divider
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
          elements.push(renderLine(line, i));
        }
      }
    }

    if (currentTable) {
      elements.push(renderTable(currentTable, 'final'));
    }

    return <div className="space-y-2">{elements}</div>;
  };

  const renderTable = (tableData, key) => (
    <div key={key} className="overflow-x-auto my-3 border border-slate-700/50 rounded-lg">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-800/40 border-b border-slate-700/50">
            {tableData.headers.map((h, i) => (
              <th key={i} className="p-2.5 font-extrabold text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rIdx) => (
            <tr key={rIdx} className="border-b border-slate-700/30 last:border-b-0 hover:bg-slate-800/20">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-2.5 font-medium text-slate-300">
                  {cell.startsWith('**') ? <strong>{cell.replace(/\*\*/g, '')}</strong> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLine = (line, key) => {
    if (line.startsWith('### ')) {
      return <h4 key={key} className="text-sm font-extrabold text-white mt-4 mb-2 flex items-center gap-1.5"><ChevronRight size={14} className="text-blue-500" /> {line.substring(4)}</h4>;
    }
    const isBullet = line.startsWith('- ') || line.startsWith('* ');
    const cleanedText = isBullet ? line.substring(2) : line;

    // parse inline bolds
    const parts = cleanedText.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-white font-extrabold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <ul key={key} className="list-disc pl-5 my-1 text-slate-300">
          <li className="text-xs leading-relaxed">{content}</li>
        </ul>
      );
    }

    return <p key={key} className="text-xs leading-relaxed text-slate-300 my-1">{content}</p>;
  };

  const getToolIcon = (name) => {
    switch (name) {
      case 'cortex_analyst': return <Database size={12} className="text-emerald-400" />;
      case 'cortex_search': return <FileText size={12} className="text-blue-400" />;
      case 'code_execution': return <Terminal size={12} className="text-amber-400" />;
      default: return <Sparkles size={12} className="text-purple-400" />;
    }
  };

  const getToolLabel = (name) => {
    switch (name) {
      case 'cortex_analyst': return 'Cortex Analyst';
      case 'cortex_search': return 'Cortex Search (RAG)';
      case 'code_execution': return 'Python Compiler';
      default: return 'Cortex Tool';
    }
  };

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${cardBorder}`, background: '#0B1C14', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Snowflake Cortex Agent</span>
        </div>
        <Sparkles size={15} className="text-emerald-400" />
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', gap: 12, display: 'flex', flexDirection: 'column', background: '#F5F7FA' }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Tool Calls Log (For assistant responses) */}
              {!isUser && m.toolCalls && m.toolCalls.map((t, tIdx) => (
                <div style={{ marginBottom: 8, background: '#FFFFFF', border: '1px solid #E8EDF2', borderRadius: 10, padding: '10px 12px', width: '100%', maxWidth: '92%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {getToolIcon(t.name)}
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{getToolLabel(t.name)} (Success)</span>
                </div>
                <pre style={{ fontSize: 9, fontFamily: 'monospace', background: '#F5F7FA', color: '#334155', padding: '8px', borderRadius: 6, overflow: 'auto', border: '1px solid #E8EDF2', margin: 0 }}>
                  {t.query}
                </pre>
                {t.result && (
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#059669', background: '#F0FDF4', padding: '6px 8px', borderRadius: 6, border: '1px solid #D1FAE5', marginTop: 4 }}>
                    <strong>Result:</strong> {JSON.stringify(t.result)}
                  </div>
                )}
              </div>
              ))}

              {/* Chat Bubble */}
              <div 
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 12,
                  lineHeight: 1.65,
                  background: isUser ? '#10B981' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#0D1B17',
                  boxShadow: isUser ? '0 2px 8px rgba(16,185,129,0.25)' : '0 1px 4px rgba(0,0,0,0.08)',
                  border: isUser ? 'none' : '1px solid #E8EDF2',
                  fontWeight: 450,
                }}
              >
                {isUser ? m.content : renderContent(m.content)}
              </div>
            </div>
          );
        })}

        {/* Live Active Tool Stream Indicator */}
        {loading && activeTool && (
          <div className="flex flex-col items-start">
            <div style={{ background: '#FFFFFF', border: '1px solid #E8EDF2', borderRadius: 10, padding: '10px 12px', width: '100%', maxWidth: '92%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="text-emerald-500 animate-spin" />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {getToolLabel(activeTool.name)} ({activeTool.status === 'running' ? 'Running' : 'Done'})
                </span>
              </div>
              {activeTool.query && (
                <pre style={{ fontSize: 9, fontFamily: 'monospace', background: '#F5F7FA', color: '#334155', padding: '8px', borderRadius: 6, overflow: 'auto', border: '1px solid #E8EDF2', margin: 0 }}>
                  {activeTool.query}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && !activeTool && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
            <Loader2 size={13} className="animate-spin text-emerald-500" />
            <span>Cortex is formulating reply...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        style={{ padding: '12px 14px', borderTop: `1px solid ${cardBorder}`, display: 'flex', gap: 8, alignItems: 'center', background: '#FFFFFF' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cortex about facilities, policies, or projections..."
          disabled={loading}
          style={{
            flex: 1,
            borderRadius: 10,
            padding: '9px 14px',
            fontSize: 12,
            outline: 'none',
            border: `1px solid ${cardBorder}`,
            background: inputBg,
            color: titleColor,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#10B981'}
          onBlur={e => e.target.style.borderColor = cardBorder}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#10B981',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          <Send size={15} color="#FFFFFF" />
        </button>
      </form>
    </div>
  );
}
