import React, { useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(username, password);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Could not connect to the backend server. Make sure FastAPI is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e] relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accentBlue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative z-10 mx-4">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-accentBlue/25 p-3 rounded-2xl mb-4 border border-accentBlue/30 shadow-lg shadow-accentBlue/10">
            <Zap className="h-8 w-8 text-accentBlue" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to EcoWatt AI</h2>
          <p className="text-slate-400 text-sm mt-1">Smart Energy Consumption & Carbon Emissions Optimization</p>
        </div>

        {error && (
          <div className="bg-accentRed/10 border border-accentRed/20 text-accentRed px-4 py-3 rounded-xl text-xs flex items-start space-x-2 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="Enter operator username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="Enter operator password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accentBlue hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-all focus:outline-none shadow-lg shadow-accentBlue/25 hover:shadow-accentBlue/40 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">B.E. Major Project Prototype Seeding</p>
          <p className="text-xs text-slate-400 mt-2">
            Demo Credentials: <span className="text-accentBlue font-medium">admin</span> / <span className="text-accentBlue font-medium">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
