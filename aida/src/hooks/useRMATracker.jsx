// src/hooks/useRMATracker.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessageBox } from '@/components/MessageBox';

const useRMATracker = () => {
    const { pb } = useAuth();
    const { showToast } = useMessageBox();
    const [rmas, setRmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const collectionName = 'rma_tracker';

    const fetchRmas = useCallback(async () => {
        if (!pb) return;
        setLoading(true);
        setError(null);
        try {
            const records = await pb.collection(collectionName).getFullList({ sort: '-dateCreated' });
            setRmas(records);
        } catch (err) {
            const errorMessage = 'Failed to fetch RMAs.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pb, showToast]);

    useEffect(() => {
        fetchRmas();
    }, [fetchRmas]);

    const addRma = useCallback(async (data) => {
        try {
            const newRma = await pb.collection(collectionName).create(data);
            setRmas(prev => [newRma, ...prev]);
            showToast('RMA added successfully!', 'success');
        } catch (err) {
            showToast(`Failed to add RMA: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    const updateRma = useCallback(async (id, data) => {
        try {
            const updatedRma = await pb.collection(collectionName).update(id, data);
            setRmas(prev => prev.map(r => r.id === id ? updatedRma : r));
            showToast('RMA updated successfully!', 'success');
        } catch (err) {
            showToast(`Failed to update RMA: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    const deleteRma = useCallback(async (id) => {
        try {
            await pb.collection(collectionName).delete(id);
            setRmas(prev => prev.filter(r => r.id !== id));
            showToast('RMA deleted successfully!', 'success');
        } catch (err) {
            showToast(`Failed to delete RMA: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, showToast]);

    return { rmas, loading, error, refetch: fetchRmas, addRma, updateRma, deleteRma };
};

export default useRMATracker;