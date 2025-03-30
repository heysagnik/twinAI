import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './Login';
import { useAuth } from './AuthContext';
import { Loader, AlertTriangle, RefreshCw } from 'lucide-react';

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
            <div className="flex justify-center mb-6">
                <Loader size={40} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-gray-700 font-medium">Loading your experience...</p>
            <p className="text-gray-500 text-sm mt-2">Checking authentication status</p>
        </div>
    </div>
);

const ErrorScreen = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center p-8 max-w-md border border-gray-200 shadow-sm rounded-xl bg-white">
      <div className="mb-6 p-4 bg-red-50 rounded-lg inline-block mx-auto">
        <AlertTriangle size={32} className="text-orange-500" />
      </div>
      
      <h2 className="text-gray-800 text-xl font-medium mb-2">Authentication Error</h2>
      <p className="mb-6 text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
        {message}
      </p>
      
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mx-auto"
      >
        <RefreshCw size={16} />
        Try Again
      </button>
    </div>
  </div>
);

const AppRouter = () => {
  const { isAuthenticated, loading, authError } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (authError) {
    return <ErrorScreen message={authError} />;
  }

  return (
    <Routes>
      <Route path="/auth-success" element={<Navigate to="/" />} />
      <Route path="/auth-error" element={<Navigate to="/" />} />
      <Route path="/logout" element={<Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <App /> : <Login />} />
    </Routes>
  );
};

export default AppRouter;