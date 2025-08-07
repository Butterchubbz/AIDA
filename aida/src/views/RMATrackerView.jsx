// src/views/RMATrackerView.js
import React from 'react';
import useRMATracker from '@/hooks/useRMATracker';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMessageBox } from '@/components/MessageBox';

const RMATrackerView = () => {
    const { rmas, loading, error } = useRMATracker();
    const { showToast } = useMessageBox();

    if (loading) {
        return <div className="p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        return <div className="p-8 text-red-400">{error}</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">RMA Tracker</h1>
            <p className="text-slate-400 mb-6">Tracking {rmas.length} RMAs.</p>
            <div className="bg-slate-800 rounded-lg p-4">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(rmas, null, 2)}</pre>
            </div>
        </div>
    );
};

export default RMATrackerView;