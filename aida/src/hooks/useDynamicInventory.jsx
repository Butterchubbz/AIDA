// src/hooks/useDynamicInventory.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessageBox } from '@/components/MessageBox';

const useDynamicInventory = (collectionName) => {
    const { pb } = useAuth();
    const { showToast } = useMessageBox();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!collectionName || !pb) return;
        setLoading(true);
        setError(null);
        try {
            const records = await pb.collection(collectionName).getFullList({ sort: '-created' });
            setItems(records);
        } catch (err) {
            const errorMessage = `Failed to fetch from ${collectionName}`;
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pb, collectionName, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addItem = useCallback(async (data) => {
        try {
            const newItem = await pb.collection(collectionName).create(data);
            setItems(prev => [newItem, ...prev]);
            showToast('Item added successfully!', 'success');
        } catch (err) {
            showToast(`Failed to add item: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, collectionName, showToast]);

    const updateItem = useCallback(async (id, data) => {
        try {
            const updatedItem = await pb.collection(collectionName).update(id, data);
            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
            showToast('Item updated successfully!', 'success');
        } catch (err) {
            showToast(`Failed to update item: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, collectionName, showToast]);

    const deleteItem = useCallback(async (id) => {
        try {
            await pb.collection(collectionName).delete(id);
            setItems(prev => prev.filter(item => item.id !== id));
            showToast('Item deleted successfully!', 'success');
        } catch (err) {
            showToast(`Failed to delete item: ${err.message}`, 'error');
            console.error(err);
        }
    }, [pb, collectionName, showToast]);

    return { items, loading, error, refetch: fetchData, addItem, updateItem, deleteItem };
};

export default useDynamicInventory;