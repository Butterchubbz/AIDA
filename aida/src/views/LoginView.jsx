// src/views/LoginView.js
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMessageBox } from '@/components/MessageBox';
import LoadingSpinner from '@/components/LoadingSpinner';
import SetupWizard from '@/components/SetupWizard'; // Import the new wizard component

const LoginView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // To toggle between Login and Sign Up
    const [error, setError] = useState('');
    const [showSetupWizard, setShowSetupWizard] = useState(false); // State to control the wizard
    const { googleSignIn, emailSignIn, emailSignUp, currentUser, loadingAuth } = useAuth();
    const { showToast } = useMessageBox();

    // If auth state is still loading, show a spinner
    if (loadingAuth) {
        return <div className="flex items-center justify-center min-h-screen bg-slate-900"><LoadingSpinner /></div>;
    }
    // If user is already logged in, redirect them away from the login page
    if (currentUser) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleGoogleSignIn = async () => {
        try {
            await googleSignIn();
            showToast("Successfully signed in with Google!", "success");
        } catch (e) {
            console.error(e);
            setError(e.message);
            showToast("Google sign-in failed.", "error");
        }
    };

    const handleEmailPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                await emailSignUp(email, password);
                showToast("Account created successfully! Please sign in.", "success");
                setIsSignUp(false); // Switch back to login view after signup
            } else {
                await emailSignIn(email, password);
                showToast("Successfully signed in!", "success");
            }
        } catch (e) {
            // Check for our custom setup error flag
            if (e.isSetupError) {
                setError(''); // Clear any previous errors
                setShowSetupWizard(true); // Show the setup guide
            } else {
                console.error(e);
                const errorMessage = e.response?.message || e.message || "An unknown error occurred.";
                setError(errorMessage);
                showToast(errorMessage, "error");
            }
        }
    };

    return (
        <>
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">AIDA</h1>
                    <p className="mt-2 text-slate-400">Bringing clarity when your ERP is MIA</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleEmailPasswordSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button type="submit" disabled={loadingAuth} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            {loadingAuth ? <i className="fas fa-spinner fa-spin"></i> : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </div>
                </form>
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-slate-400">Or</span>
                    <div className="flex-grow border-t border-slate-600"></div>
                </div>
                <div>
                    <button onClick={handleGoogleSignIn} disabled={loadingAuth} className="group relative w-full flex justify-center py-2 px-4 border border-slate-600 text-sm font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50">
                        <i className="fab fa-google mr-2"></i>
                        Sign in with Google
                    </button>
                </div>
                <div className="text-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-sm text-blue-400 hover:text-blue-300">
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
        <SetupWizard 
            isOpen={showSetupWizard} 
            onClose={() => setShowSetupWizard(false)} 
        />
        </>
    );
};

export default LoginView;