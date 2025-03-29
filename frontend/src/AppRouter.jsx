import React from 'react';
import App from './App';
import Login from './Login';
import { useAuth } from './AuthContext';

const AppRouter = () => {
  const { isAuthenticated, loading, authError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center p-6 max-w-md bg-gray-900 rounded-lg">
          <p className="text-red-500 mb-4">Authentication Error</p>
          <p className="mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <App /> : <Login />;
};

export default AppRouter;