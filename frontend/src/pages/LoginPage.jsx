import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase/auth';
import { auth, isPlaceholder } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader,
  CheckCircle,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

const stats = [
  "Tracking 1,390 kWh avg per capita across India",
  "Mitigating 450+ tons of carbon emissions monthly",
  "Optimizing 12,400+ smart grid nodes in real-time",
  "Empowering 36 Indian states with renewable analytics"
];

function LoginPage({ onToggleRegister }) {
  // 'login' | 'register' mode state
  const [mode, setMode] = useState('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Controls
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Live stats index
  const [activeStatIndex, setActiveStatIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatIndex((prev) => (prev + 1) % stats.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const getFriendlyErrorMessage = (code, rawMessage) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please verify credentials.';
      case 'auth/email-already-in-use':
        return 'This email address is already in use.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password auth is disabled in your Firebase Console settings.';
      case 'auth/network-request-failed':
        return 'Network error. Please verify your config settings.';
      default:
        return rawMessage || 'Authentication failed. Please verify credentials.';
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('success', 'Authenticated successfully.');
    } catch (err) {
      console.error("Login error:", err);
      showToast('error', getFriendlyErrorMessage(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast('error', 'Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Write details to Realtime Database in real Firebase mode
      if (!isPlaceholder && userCredential.user) {
        try {
          const { database } = await import('../firebase/config');
          const { ref, set } = await import('firebase/database');
          await set(ref(database, 'users/' + userCredential.user.uid), {
            uid: userCredential.user.uid,
            fullName: fullName,
            email: email,
            phone: '',
            organization: '',
            role: 'SEMS Operator',
            avatar: '',
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Realtime DB write failed:", dbErr);
        }
      }

      showToast('success', 'Account created successfully!');
    } catch (err) {
      console.error("Registration error:", err);
      showToast('error', getFriendlyErrorMessage(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Trigger
  const handleForgotPassword = async () => {
    if (!email) {
      showToast('error', 'Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    try {
      if (!isPlaceholder) {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, email);
      }
      showToast('success', `Password reset link sent to ${email}.`);
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#07090e] text-slate-100 overflow-hidden relative">
      
      {/* CSS Mesh & Blob animations */}
      <style>{`
        @keyframes float-blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gradient-mesh {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-blob-1 { animation: float-blob 15s infinite alternate ease-in-out; }
        .animate-blob-2 { animation: float-blob 20s infinite alternate-reverse ease-in-out; }
        .animate-mesh { 
          background-size: 200% 200%;
          animation: gradient-mesh 20s infinite ease-in-out;
        }
      `}</style>

      {/* Toast alert system */}
      {toast && (
        <div className={`fixed top-6 left-6 md:left-auto md:right-6 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl z-[100] border transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-accentRed/10 border-accentRed/20 text-accentRed'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Left side: Form Panel */}
      <div className="w-full md:w-[45%] flex flex-col justify-between p-8 md:p-12 relative z-10 bg-[#07090e]">
        
        {/* Animated Background Blur Blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accentBlue/10 rounded-full blur-[100px] pointer-events-none animate-blob-1"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-accentGreen/5 rounded-full blur-[100px] pointer-events-none animate-blob-2"></div>

        {/* Small Header */}
        <div className="flex items-center space-x-2">
          <div className="bg-accentBlue/20 p-2 rounded-xl border border-accentBlue/30">
            <Zap className="h-5 w-5 text-accentBlue" />
          </div>
          <span className="text-sm font-black text-white tracking-wider">EcoWatt AI</span>
        </div>

        {/* Form Container (Framer Motion mount) */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto relative z-20">
          <AnimatePresence mode="wait">
            
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Access SEMS Portal</h2>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">Enter operator credentials to audit grid variables</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@ecowatt.com"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-4 py-3 text-xs text-slate-200 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-11 py-3 text-xs text-slate-200 transition-all placeholder:text-slate-655"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-all"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Check row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer text-slate-450 font-semibold select-none">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-accentBlue focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer accent-accentBlue"
                      />
                      <span>Remember Me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-accentBlue hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-accentBlue to-blue-600 hover:shadow-lg hover:shadow-accentBlue/25 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50 mt-2 min-h-[44px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-white" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Access Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                </form>

                {/* Footer Switch */}
                <div className="border-t border-slate-900 pt-5 text-center">
                  <p className="text-xs text-slate-450 font-medium">
                    New operator?{' '}
                    <button 
                      onClick={() => setMode('register')}
                      className="text-accentBlue hover:underline font-bold"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Create Account</h2>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">Establish your smart energy operator nodes</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="operator@ecowatt.com"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Password (min. 8 chars)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-11 py-2.5 text-xs text-slate-200 transition-all placeholder:text-slate-655"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-all"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full min-h-[44px] bg-white/5 border border-white/10 focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/25 outline-none rounded-xl pl-11 pr-11 py-2.5 text-xs text-slate-200 transition-all placeholder:text-slate-655"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-accentBlue to-blue-600 hover:shadow-lg hover:shadow-accentBlue/25 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50 mt-4 min-h-[44px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-white" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Register Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                </form>

                {/* Footer Switch */}
                <div className="border-t border-slate-900 pt-4 text-center">
                  <p className="text-xs text-slate-450 font-medium">
                    Already registered?{' '}
                    <button 
                      onClick={() => setMode('login')}
                      className="text-accentBlue hover:underline font-bold"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Small Trust footer */}
        <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-500 border-t border-slate-950/20 pt-4 mt-auto">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          <span>AES-256 cloud encryption active. Seeding V1.0.</span>
        </div>

      </div>

      {/* Right side: Visual SaaS Panel (Hidden on mobile) */}
      <div className="hidden md:flex w-[55%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0b0e14] via-[#081223] to-[#041a12] border-l border-white/5 animate-mesh">
        
        {/* Animated grid matrix lines background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accentBlue/10 via-transparent to-transparent opacity-50"></div>
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle_at_center, white 1px, transparent 1px)`, 
            backgroundSize: `24px 24px` 
          }}
        ></div>

        {/* Logo and Tagline Centered */}
        <div className="my-auto flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 relative z-20">
          
          <div className="bg-gradient-to-r from-accentBlue/15 to-accentGreen/10 p-5 rounded-3xl border border-white/10 shadow-2xl shadow-accentBlue/5">
            <Zap className="h-14 w-14 text-accentBlue filter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">
              EcoWatt <span className="bg-gradient-to-r from-accentBlue to-accentGreen bg-clip-text text-transparent">Smart Grid</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              Real-time energy telemetry metrics and machine learning carbon emission optimization model pipeline.
            </p>
          </div>

          {/* Glassmorphism Dashboard Preview card */}
          <div className="w-full max-w-sm p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden transform hover:scale-102 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accentBlue/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 text-xs">
              <span className="font-bold text-slate-350 uppercase tracking-widest">Active State Audit Map</span>
              <span className="h-2 w-2 rounded-full bg-accentGreen animate-ping"></span>
            </div>
            
            {/* Visual preview representation of Indian state map grid */}
            <div className="h-28 w-full bg-slate-950/40 rounded-lg flex flex-col items-center justify-center border border-white/5 relative">
              <div className="h-16 w-16 border-2 border-dashed border-slate-700/60 rounded-full flex items-center justify-center">
                <div className="h-10 w-10 bg-accentBlue/20 rounded-full flex items-center justify-center border border-accentBlue/30">
                  <Zap className="h-4 w-4 text-accentBlue" />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mt-3">Rendering offline State GeoJSON boundaries</span>
            </div>
          </div>

        </div>

        {/* Dynamic rotating statistics bottom panel */}
        <div className="relative z-20 w-full max-w-sm mx-auto p-4 bg-slate-950/20 border border-white/5 rounded-2xl backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeStatIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-slate-350 text-[10px] uppercase font-bold tracking-widest text-center leading-relaxed"
            >
              {stats[activeStatIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}

export default LoginPage;
