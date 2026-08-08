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

  const cardBg = isDarkMode ? '#131824' : '#FFFFFF';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const titleColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const labelColor = isDarkMode ? '#94A3B8' : '#475569';
  const bubbleUserBg = '#3B82F6';
  const bubbleBotBg = isDarkMode ? '#1E293B' : '#F1F5F9';
  const textUserColor = '#FFFFFF';
  const textBotColor = isDarkMode ? '#CBD5E1' : '#1E293B';
  const inputBg = isDarkMode ? '#07090E' : '#F8FAFC';

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
                // Stream text tokens into assistant message
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content += parsed.text;
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

                // Attach to final message log once successful
                if (parsed.status === 'success') {
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      if (!lastMsg.toolCalls) lastMsg.toolCalls = [];
                      if (!lastMsg.toolCalls.some(t => t.query === parsed.query)) {
                        lastMsg.toolCalls.push({
                          name: parsed.tool,
                          query: parsed.query,
                          result: parsed.result
                        });
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
    <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-black text-white tracking-widest uppercase">Snowflake Cortex Agent</span>
        </div>
        <Sparkles size={15} className="text-blue-500" />
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Tool Calls Log (For assistant responses) */}
              {!isUser && m.toolCalls && m.toolCalls.map((t, tIdx) => (
                <div key={tIdx} className="mb-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 w-full max-w-[90%] space-y-2">
                  <div className="flex items-center gap-2">
                    {getToolIcon(t.name)}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getToolLabel(t.name)} (Success)</span>
                  </div>
                  <pre className="text-[9px] font-mono bg-black/40 text-slate-300 p-2 rounded overflow-x-auto border border-slate-900">
                    {t.query}
                  </pre>
                  {t.result && (
                    <div className="text-[9px] font-mono text-emerald-400 bg-slate-950/80 p-1.5 rounded border border-slate-900">
                      <strong>Result:</strong> {JSON.stringify(t.result)}
                    </div>
                  )}
                </div>
              ))}

              {/* Chat Bubble */}
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800/70 border border-slate-700/30 text-slate-300 rounded-bl-none shadow-lg'
                }`}
              >
                {isUser ? m.content : renderContent(m.content)}
              </div>
            </div>
          );
        })}

        {/* Live Active Tool Stream Indicator */}
        {loading && activeTool && (
          <div className="flex flex-col items-start">
            <div className="bg-slate-900/80 border border-blue-900/30 rounded-lg p-3 w-full max-w-[90%] space-y-2 animate-pulse">
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="text-blue-500 animate-spin" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  {getToolLabel(activeTool.name)} ({activeTool.status === 'running' ? 'Running' : 'Done'})
                </span>
              </div>
              {activeTool.query && (
                <pre className="text-[9px] font-mono bg-black/50 text-slate-300 p-2 rounded overflow-x-auto border border-slate-900">
                  {activeTool.query}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && !activeTool && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={13} className="animate-spin text-blue-500" />
            <span>Cortex is formulating reply...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="p-3 border-t border-slate-800/60 flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cortex about facilities, policies, or projections..."
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2.5 text-xs outline-none border transition-all"
          style={{
            background: inputBg,
            borderColor: cardBorder,
            color: titleColor
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white cursor-pointer transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
