// src/components/Header.js

import React from 'react';
import Auth from '@/components/Auth';
import logoUrl from '../assets/AIDA-logo.svg';

/**
 * Header component for AIDA (Accurate Inventory Data Assistant).
 * Displays the application logo, subtitle, and includes the Auth component
 * for sign-in/sign-out functionality and user status display.
 */
const Header = () => {
    const appVersion = "1.0.0-beta"; // Current application version

    return (
        <header className="bg-slate-800/50 shadow-md p-4 flex items-center justify-between h-24">
            {/* Left-side: Version Info */}
            <div className="flex-1">
                <span className="text-xs text-slate-500 font-mono">v{appVersion}</span>
            </div>

            {/* Centered Logo and Subtitle */}
            <div className="flex-1 flex justify-center">
                <div className="text-center">
                    {/* <img src={logoUrl} alt="AIDA Logo" className="h-12 mx-auto" /> */}
                    <h1 className="text-2xl font-bold text-cyan-400">AIDA</h1>
                    <p className="text-xs text-slate-400 mt-1">Bringing clarity when your ERP is MIA</p>
                </div>
            </div>

            {/* Authentication Component */}
            <div className="flex-1 flex justify-end">
                <Auth />
            </div>
        </header>
    );
};

export default Header;