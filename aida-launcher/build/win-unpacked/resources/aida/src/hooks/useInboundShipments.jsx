// src/hooks/useInboundShipments.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessageBox } from '@/components/MessageBox';

const useInboundShipments = () => {
    const { pb } = useAuth();
    const { showToast } = useMessageBox();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const collectionName = 'inbound_shipments';

    const fetchShipments = useCallback(async () => {
        if (!pb) return;
        setLoading(true);
        setError(null);
        try {
            const records = await pb.collection(collectionName).getFullList({ sort: '-created', expand: 'items(shipment)' });
            setShipments(records);
        } catch (err) {
            const errorMessage = 'Failed to fetch inbound shipments.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pb, showToast]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    const addShipment = useCallback(async (data) => {
        try {
            const newShipment = await pb.collection(collectionName).create(data);
            setShipments(prev => [newShipment, ...prev]);
            showToast('Shipment added successfully!', 'success');
        } catch (err) {
            showToast(`Failed to add shipment: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    const updateShipment = useCallback(async (id, data) => {
        try {
            const updatedShipment = await pb.collection(collectionName).update(id, data);
            setShipments(prev => prev.map(s => s.id === id ? updatedShipment : s));
            showToast('Shipment updated successfully!', 'success');
        } catch (err) {
            showToast(`Failed to update shipment: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    const deleteShipment = useCallback(async (id) => {
        try {
            await pb.collection(collectionName).delete(id);
            setShipments(prev => prev.filter(s => s.id !== id));
            showToast('Shipment deleted successfully!', 'success');
        } catch (err) {
            showToast(`Failed to delete shipment: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    return { shipments, loading, error, refetch: fetchShipments, addShipment, updateShipment, deleteShipment };
};

export default useInboundShipments;