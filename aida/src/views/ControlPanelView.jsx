import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Setup from '@/components/Setup';
import StatusDashboard from '@/components/StatusDashboard';

const AppState = {
  LOADING: 'LOADING',
  NEEDS_SETUP: 'NEEDS_SETUP',
  SETUP_COMPLETE: 'SETUP_COMPLETE',
};

export default function ControlPanelView() {
  const { pb } = useAuth();
  const [appState, setAppState] = useState(AppState.LOADING);

  useEffect(() => {
    if (!pb) return;
    const checkSetupStatus = async () => {
      setAppState(AppState.LOADING);
      try {
        const result = await pb.send('/api/aida-setup-check', { requestKey: null });
        setAppState(result.isSetup ? AppState.SETUP_COMPLETE : AppState.NEEDS_SETUP);
      } catch (error) {
        console.error("Could not connect to backend to check status:", error);
        setAppState(AppState.SETUP_COMPLETE);
      }
    };

    checkSetupStatus();
  }, [pb]);

  const handleSetupComplete = () => {
    setAppState(AppState.SETUP_COMPLETE);
  };
  
  const handleReset = () => {
    setAppState(AppState.NEEDS_SETUP);
  }

  switch (appState) {
    case AppState.LOADING:
      return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">Loading Application Status...</div>;
    case AppState.NEEDS_SETUP:
      return <Setup onSetupComplete={handleSetupComplete} />;
    case AppState.SETUP_COMPLETE:
      return <StatusDashboard onReset={handleReset} />;
    default:
      return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-500">An unexpected error occurred. Please refresh the page.</div>;
  }
}