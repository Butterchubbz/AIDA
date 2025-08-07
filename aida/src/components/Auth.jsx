// src/components/Auth.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessageBox } from './MessageBox';

const Auth = () => {
    const { currentUser, userRole, signOut } = useAuth();
    const { showToast } = useMessageBox();

    const handleSignOut = () => {
        signOut();
        showToast("You have been signed out.", "info");
    };

    // This component is part of a protected layout, so currentUser should always exist.
    if (!currentUser) {
        return null; 
    }

    return (
        <div className="flex items-center space-x-4">
            <div className="text-right">
                <p className="text-sm font-medium text-slate-100">{currentUser.email}</p>
                <p className="text-xs text-slate-400 capitalize">{userRole || 'User'}</p>
            </div>
            <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-md bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
                title="Sign Out"
            >
                <i className="fas fa-sign-out-alt"></i>
            </button>
        </div>
    );
};

export default Auth;