// src/layouts/ProtectedLayout.js
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

const ProtectedLayout = () => {
    const { currentUser, userRole } = useAuth();
    const { appConfig } = useAppContext();

    if (!currentUser) {
        // This should be handled by auth state, but as a fallback:
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-slate-900">
            <Sidebar userRole={userRole} appConfig={appConfig} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ProtectedLayout;