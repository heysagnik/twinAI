import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create a context to hold authentication state
const AuthContext = createContext(null);

// Set axios to include credentials in requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/auth/status');
      setIsAuthenticated(response.data.authenticated);
      setAuthError(null);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      setAuthError('Failed to check authentication status');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const logout = () => {
    window.location.href = 'http://localhost:3000/auth/logout';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loading, 
        authError, 
        login, 
        logout, 
        checkAuthStatus 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};