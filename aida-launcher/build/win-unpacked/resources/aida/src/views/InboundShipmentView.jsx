// src/views/InboundShipmentView.js
import React from 'react';
import useInboundShipments from '@/hooks/useInboundShipments';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMessageBox } from '@/components/MessageBox';

const InboundShipmentView = () => {
    const { shipments, loading, error } = useInboundShipments();
    const { showToast } = useMessageBox();

    if (loading) {
        return <div className="p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        // The hook already shows a toast, so we can just display a message here.
        return <div className="p-8 text-red-400">{error}</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Inbound Shipments</h1>
            <p className="text-slate-400 mb-6">Tracking {shipments.length} shipments.</p>
            <div className="bg-slate-800 rounded-lg p-4">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(shipments, null, 2)}</pre>
            </div>
        </div>
    );
};

export default InboundShipmentView;