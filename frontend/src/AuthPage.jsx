// AuthPage.js
import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Mail, RefreshCw, ArrowLeft, Sparkles, Shield } from "lucide-react";

export default function AuthPage({ onAuthComplete }) {
  const [authStatus, setAuthStatus] = useState({
    checking: true,
    authenticated: false,
    error: null,
    services: {}
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthStatus(prev => ({ ...prev, checking: true }));
      const response = await axios.get('http://localhost:3000/auth/status');
      setAuthStatus({
        checking: false,
        authenticated: response.data.authenticated,
        error: response.data.error || null,
        services: response.data.services || {}
      });
    } catch (error) {
      setAuthStatus({
        checking: false,
        authenticated: false,
        error: 'Error checking authentication status',
        services: {}
      });
    }
  };

  const startAuth = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleBackToChat = () => {
    if (onAuthComplete) {
      onAuthComplete(authStatus.authenticated);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 mr-2" />
            <p className="text-orange-700 font-medium text-xs">ACCOUNT CONNECTION</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Connect Google Services
        </h2>
        
        <p className="text-gray-600 text-center mb-8">
          Enable advanced features by connecting your Google account for calendar and email access.
        </p>
        
        {authStatus.checking ? (
          <div className="py-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 border-r-2 border-b-2 border-gray-200 mb-4"></div>
            <p className="text-gray-500">Checking connection status...</p>
          </div>
        ) : authStatus.authenticated ? (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold">Connected to Google</p>
                <p className="text-sm text-gray-500">Your account is securely linked</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-4 mb-4">
              {authStatus.services.calendar && (
                <div className="flex items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <Calendar size={18} className="text-orange-500 mr-3" />
                  <span>Google Calendar access enabled</span>
                </div>
              )}
              
              {authStatus.services.gmail && (
                <div className="flex items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <Mail size={18} className="text-orange-500 mr-3" />
                  <span>Gmail access enabled</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={checkAuthStatus}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center py-2"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh connection status
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mr-3">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold">Not Connected</p>
                <p className="text-sm text-gray-500">{authStatus.error || 'Google account not linked'}</p>
              </div>
            </div>
            
            <ul className="space-y-2 mt-4 mb-5">
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-0.5 mr-2 flex-shrink-0">
                  <span className="text-xs">1</span>
                </div>
                <span className="text-sm text-gray-600">Schedule events to your Google Calendar</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-0.5 mr-2 flex-shrink-0">
                  <span className="text-xs">2</span>
                </div>
                <span className="text-sm text-gray-600">Draft and send emails through Gmail</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-0.5 mr-2 flex-shrink-0">
                  <span className="text-xs">3</span>
                </div>
                <span className="text-sm text-gray-600">Manage your digital life with AI assistance</span>
              </li>
            </ul>
          </div>
        )}
        
        {authStatus.authenticated ? (
          <button
            onClick={handleBackToChat}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Return to Chat
          </button>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={startAuth}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Connect Google Account
            </button>

            <button
              onClick={handleBackToChat}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors flex items-center justify-center"
            >
              <ArrowLeft size={18} className="mr-2" />
              Return to Chat
            </button>
          </div>
        )}
        
        {/* Privacy notice */}
        <p className="text-xs text-center text-gray-500 mt-6">
          We only request necessary permissions and never store your email content.
          <a href="#" className="text-orange-600 hover:underline ml-1">View our privacy policy</a>
        </p>
      </div>
    </div>
  );
}