import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from '../firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_session_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      displayName: 'Grid Controller (Vinayprakash)',
      email: 'controller@cea.gov.in',
      role: 'Grid Administrator'
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (!auth) return;
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (e) {
      console.warn('Auth observer fallback active:', e);
    }
  }, []);

  const logout = () => {
    try {
      signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setCurrentUser({
      displayName: 'Grid Controller (Vinayprakash)',
      email: 'controller@cea.gov.in'
    });
  };

  const value = {
    currentUser: currentUser || {
      displayName: 'Grid Controller (Vinayprakash)',
      email: 'controller@cea.gov.in'
    },
    logout,
    loading: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      currentUser: { displayName: 'Grid Controller (Vinayprakash)', email: 'controller@cea.gov.in' },
      logout: () => {},
      loading: false
    };
  }
  return context;
}
export default AuthContext;

