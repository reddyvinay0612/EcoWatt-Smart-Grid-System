import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from '../firebase/auth';
import { auth, isPlaceholder } from '../firebase/config';
import { Zap, AlertCircle, Loader } from 'lucide-react';

function RegisterPage({ onToggleLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getFriendlyErrorMessage = (code, rawMessage) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email address is already in use by another account.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. It must be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Registration is disabled. Please enable "Email/Password" provider under Firebase Console -> Authentication -> Sign-in method.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Check your internet connection or Firebase API config.';
      default:
        return `Registration failed: ${rawMessage || 'Please verify config.'}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-submit validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name profile
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
          console.error("Realtime Database document write failed:", dbErr);
        }
      }
      
    } catch (err) {
      console.error("Registration error:", err);
      setError(getFriendlyErrorMessage(err.code, err.message));
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
        <div className="text-center mb-6">
          <div className="inline-flex bg-accentBlue/25 p-3 rounded-2xl mb-4 border border-accentBlue/30 shadow-lg shadow-accentBlue/10">
            <Zap className="h-8 w-8 text-accentBlue" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Set up your EcoWatt operator credentials</p>
        </div>

        {error && (
          <div className="bg-accentRed/10 border border-accentRed/20 text-accentRed px-4 py-3 rounded-xl text-xs flex items-start space-x-2 mb-6 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="operator@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password (min. 8 characters)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="Enter secure password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#090d16] border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue/20 transition-all"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accentBlue hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-all focus:outline-none shadow-lg shadow-accentBlue/25 hover:shadow-accentBlue/40 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin text-white" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-850 pt-5">
          <p className="text-[11px] text-slate-400">
            Already have an account?{' '}
            <button 
              onClick={onToggleLogin}
              className="text-accentBlue hover:underline font-semibold"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
