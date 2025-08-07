import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * A dedicated view for the application's first-time setup, allowing the user
 * to create the initial administrator account.
 */
function FirstTimeSetupView() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { pb } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await pb.send('/api/aida-create-first-admin', {
                method: 'POST',
                body: { email, password },
            });
            setSuccess('Admin account created! The application will now reload...');
            // Reload the page after a short delay. This will re-trigger the setup check
            // in App.jsx, which will now find an admin and proceed to the login screen.
            setTimeout(() => window.location.reload(), 3000);
        } catch (err) {
            setError(err.data?.error || 'An unknown error occurred during setup.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 font-inter text-slate-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-100">Welcome to AIDA</h1>
                    <p className="mt-2 text-slate-400">This is the first-time setup. Please create your administrator account to begin.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">Admin Email</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                        <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                     <div>
                        <label htmlFor="password-confirm" className="block text-sm font-medium text-slate-300">Confirm Password</label>
                        <input id="password-confirm" name="password-confirm" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="block w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {success && <p className="text-sm text-green-400">{success}</p>}

                    <div>
                        <button type="submit" disabled={isLoading || !!success}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Creating Account...' : (success ? 'Success!' : 'Create Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FirstTimeSetupView;