// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const { pb, currentUser } = useAuth();
    const [appConfig, setAppConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            if (!pb || !currentUser) {
                // Don't fetch if not authenticated. AuthProvider will handle redirects.
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Fetch the setup record from the 'aida_settings' collection
                const configRecord = await pb.collection('aida_settings').getFirstListItem('key="initial_setup_complete"');
                
                if (configRecord && configRecord.value) {
                    setAppConfig(configRecord.value);
                } else {
                    setError("Application configuration not found. Please complete the setup.");
                }
            } catch (e) {
                if (e.status !== 404) {
                    console.error("Failed to load app configuration:", e);
                    setError("Failed to load application configuration. Please try again.");
                }
                setAppConfig(null); // Ensure config is null on error
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [pb, currentUser]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-slate-900"><LoadingSpinner /><p className="ml-4 text-slate-400">Loading application configuration...</p></div>;
    }

    return (
        <AppContext.Provider value={{ appConfig, loadingAppConfig: loading, appConfigError: error }}>
            {children}
        </AppContext.Provider>
    );
};