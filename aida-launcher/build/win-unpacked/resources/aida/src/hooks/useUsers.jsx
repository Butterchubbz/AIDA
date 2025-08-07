// src/hooks/useUsers.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessageBox } from '@/components/MessageBox';

const useUsers = () => {
    const { pb } = useAuth();
    const { showToast } = useMessageBox();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        if (!pb) return;
        setLoading(true);
        setError(null);
        try {
            const records = await pb.collection('users').getFullList({
                sort: '-created',
            });
            setUsers(records);
        } catch (err) {
            const errorMessage = 'Failed to fetch users.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pb, showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUser = useCallback(async (id, data) => {
        try {
            const updatedUser = await pb.collection('users').update(id, data);
            setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
            showToast('User updated successfully!', 'success');
        } catch (err) {
            showToast(`Failed to update user: ${err.message}`, 'error');
            console.error(err);
            throw err; // Re-throw to be caught in the component
        }
    }, [pb, showToast]);

    return { users, loading, error, refetch: fetchUsers, updateUser };
};

export default useUsers;