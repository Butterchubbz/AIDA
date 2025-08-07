import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const ServiceStatus = {
  CHECKING: 'CHECKING',
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
};

const StatusIndicator = ({ status }) => {
  const color = {
    [ServiceStatus.ONLINE]: 'bg-green-500',
    [ServiceStatus.OFFLINE]: 'bg-red-500',
    [ServiceStatus.CHECKING]: 'bg-yellow-500',
  }[status];

  return (
    <div className="flex items-center">
      <span className={`w-3 h-3 rounded-full mr-2 animate-pulse ${color}`}></span>
      <span className="capitalize">{status.toLowerCase()}</span>
    </div>
  );
};

export default function StatusDashboard({ onReset }) {
  const { pb } = useAuth();
  const [backendStatus, setBackendStatus] = useState(ServiceStatus.CHECKING);
  const [frontendStatus, setFrontendStatus] = useState(ServiceStatus.ONLINE); // It's running if we see this
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (!pb) return;
    // Check backend status periodically
    const checkBackend = async () => {
      try {
        // PocketBase returns a 200 on /api/health if it's running
        await pb.health.check({ requestKey: null });
        setBackendStatus(ServiceStatus.ONLINE);
      } catch (e) {
        setBackendStatus(ServiceStatus.OFFLINE);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [pb]);

  const handleResetClick = async () => {
    if (!pb) return;
    if (!window.confirm('Are you sure you want to reset all application data? This will delete the admin account and require you to run setup again.')) {
      return;
    }
    setIsResetting(true);
    setResetError('');
    try {
      await pb.send('/api/aida-reset-setup', { method: 'POST', requestKey: null });
      // Parent component will handle the state transition
      onReset();
    } catch (err) {
      console.error('Reset failed:', err);
      setResetError(err.data?.error || 'Failed to perform reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">AIDA Control Panel</h2>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Service Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Backend (PocketBase)</span>
              <StatusIndicator status={backendStatus} />
            </div>
            <div className="flex justify-between items-center">
              <span>Frontend (Vite)</span>
              <StatusIndicator status={frontendStatus} />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-semibold">Actions</h3>
            <p className="text-sm text-gray-500">
                Once setup is complete, you can enter the main application.
            </p>
            <button
                onClick={() => window.open('http://127.0.0.1:8090/_/', '_blank')}
                disabled={backendStatus !== ServiceStatus.ONLINE}
                className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
                Enter Application
            </button>
            <hr />
            <p className="text-sm text-gray-500">
                This will close the entire application, including the backend server.
            </p>
            <button
                onClick={() => window.electronAPI?.quitApp()}
                className="w-full px-4 py-2 font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                Quit Application
            </button>
            <p className="text-sm text-gray-500">
                Resetting will delete the admin account and require you to run setup again. This is a destructive action.
            </p>
            {resetError && <p className="text-sm text-red-600">{resetError}</p>}
            <button
                onClick={handleResetClick}
                disabled={isResetting}
                className="w-full px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
            >
                {isResetting ? 'Resetting...' : 'Reset Application Data'}
            </button>
        </div>
      </div>
    </div>
  );
}