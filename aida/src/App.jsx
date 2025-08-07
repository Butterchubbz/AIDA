// src/App.js

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from '@/components/DashboardView'; // Import DashboardView

// NEW: Import generic views for dynamic routing
import InventoryView from '@/views/InventoryView';
import InboundShipmentView from '@/views/InboundShipmentView'; // Import from views
import RMATrackerView from '@/views/RMATrackerView'; // Import from views

import ProfileView from '@/views/ProfileView'; // New Profile View
import UserManagementView from '@/views/UserManagementView'; // New User Management View
import DataManagementView from '@/views/DataManagementView';
import ProtectedLayout from '@/layouts/ProtectedLayout'; // NEW: The main layout for authenticated users
import AdminRoute from '@/components/AdminRoute'; // NEW: Guard for admin-only pages
import { useAuth } from '@/context/AuthContext'; // Access authentication state
import FirstTimeSetupView from '@/views/FirstTimeSetupView';
import LoginView from '@/views/LoginView'; // New Login View
import ControlPanelView from '@/views/ControlPanelView'; // NEW: Control Panel

/**
 * The main application component (AIDA - Accurate Inventory Data Assistant).
 * It orchestrates the overall layout, manages the item being edited,
 * conditionally renders content based on authentication status,
 * and now includes a dashboard for multiple functions.
 */
function App() {
    // Access authentication state from AuthContext
    const { pb, userRole, isLoading: authIsLoading } = useAuth();
    const [needsSetup, setNeedsSetup] = useState(null); // null: loading, true: needs setup, false: setup complete

    useEffect(() => {
        if (authIsLoading) return; // Wait for auth context to be ready

        // Only check for setup if the user is not logged in.
        if (!userRole) {
            pb.send('/api/aida-setup-check', { requestKey: null })
                .then(data => {
                    setNeedsSetup(!data.isSetup);
                })
                .catch(err => {
                    console.error("Failed to check setup status:", err);
                    // Fallback to assuming setup is needed if check fails
                    setNeedsSetup(true); 
                });
        } else {
            // If user is logged in, setup is definitely complete.
            setNeedsSetup(false);
        }
    }, [pb, userRole, authIsLoading]); // Rerun when auth state changes

    // Render a loading state while we determine the setup status
    if (needsSetup === null || authIsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-slate-400">
                <p>Loading application...</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-900 font-inter antialiased text-slate-100">
            <Routes>
                {/* NEW: Standalone route for the developer control panel */}
                <Route path="/control-panel" element={<ControlPanelView />} />

                {/* Public route for login */}
                <Route path="/login" element={needsSetup ? <FirstTimeSetupView /> : <LoginView />} />

                {/* Protected routes wrapped by the main layout */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardView />} />
                    {/* DYNAMIC ROUTES */}
                    <Route path="/inventory/:collectionName" element={<InventoryView />} />
                    <Route path="/rma-tracking" element={<RMATrackerView />} />
                    <Route path="/inbound-shipments" element={<InboundShipmentView />} />
                    <Route path="/profile" element={<ProfileView />} />
                    
                    {/* Admin-only routes */}
                    <Route element={<AdminRoute />}>
                        <Route path="/user-management" element={<UserManagementView />} />
                        <Route path="/data-management" element={<DataManagementView />} />
                    </Route>

                    {/* Fallback for any other authenticated route */}
                    <Route path="*" element={<Navigate to={userRole ? "/dashboard" : "/login"} />} />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
