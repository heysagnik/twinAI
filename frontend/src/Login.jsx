import React from 'react';
import { useAuth } from './AuthContext';
import { Sparkles } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-200 relative overflow-hidden">
                {/* Decorative elements styled to match app's orange theme */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-orange-50 opacity-60"></div>
                    <div className="absolute top-20 -right-10 w-32 h-32 rounded-full bg-orange-100 opacity-40"></div>
                    <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-orange-100 opacity-50"></div>
                    <div className="absolute -bottom-10 right-10 w-28 h-28 rounded-full bg-orange-50 opacity-60"></div>
                </div>
                
                <div className="relative z-10">
                    {/* Top badge */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500 mr-2" />
                            <p className="text-orange-700 font-medium text-xs">WELCOME TO TWINAI</p>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-3 text-gray-900">Sign in to continue</h1>
                    <p className="text-center text-gray-600 mb-8 max-w-xs mx-auto">
                        Your digital companion that helps manage your tasks, research, and communications
                    </p>
                    
                    {/* Main login button styled to match app's orange theme */}
                    <button 
                        onClick={login}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-medium">Sign in with Google</span>
                    </button>

                    {/* Alternative buttons */}
                    <div className="mt-4 flex gap-3">
                        <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors">
                            Guest Demo
                        </button>
                        <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm">
                            Learn More
                        </button>
                    </div>
                    
                    {/* Features highlight - matches the style of BlankPage feature cards */}
                    <div className="mt-10 grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">Time Saving</h3>
                            <p className="text-xs text-gray-500 mt-1">Automate your daily tasks</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">Smart Drafts</h3>
                            <p className="text-xs text-gray-500 mt-1">AI-powered writing</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">Research</h3>
                            <p className="text-xs text-gray-500 mt-1">Deep insights on any topic</p>
                        </div>
                    </div>

                    {/* Privacy notice */}
                    <p className="text-xs text-center text-gray-500 mt-8">
                        By signing in, you agree to our 
                        <a href="#" className="text-orange-600 hover:underline mx-1">Terms of Service</a>
                        and 
                        <a href="#" className="text-orange-600 hover:underline ml-1">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;