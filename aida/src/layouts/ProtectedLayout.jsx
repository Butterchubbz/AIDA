import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AidaSetupWizardView from '@/views/AidaSetupWizardView';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function ProtectedLayout() {
    const { pb, user, userRole, isLoading: authIsLoading } = useAuth();
    const [isSetupComplete, setIsSetupComplete] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (authIsLoading || !user) return;

        // Only admins can and need to run the setup wizard.
        if (userRole !== 'admin') {
            setIsSetupComplete(true);
            return;
        }

        const checkSetupStatus = async () => {
            try {
                // This flag is created by the setup wizard upon completion.
                await pb.collection('aida_settings').getFirstListItem('key = "database_setup_complete"');
                setIsSetupComplete(true);
            } catch (err) {
                if (err.status === 404) {
                    // 404 means the flag doesn't exist, so setup is needed.
                    setIsSetupComplete(false);
                } else {
                    console.error("Error checking setup status:", err);
                    setError('Could not verify application setup. Please try again later.');
                }
            }
        };

        checkSetupStatus();
    }, [user, userRole, authIsLoading, pb]);

    if (authIsLoading || isSetupComplete === null) {
        return <div className="flex items-center justify-center min-h-screen bg-slate-900"><LoadingSpinner /></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center text-slate-300">
                <h2 className="text-2xl font-bold text-red-400">Application Error</h2>
                <p className="mt-2">{error}</p>
            </div>
        );
    }

    if (!isSetupComplete) {
        // The onSetupComplete callback from the wizard will re-trigger the check by updating state.
        return <AidaSetupWizardView onSetupComplete={() => setIsSetupComplete(true)} />;
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default ProtectedLayout;
