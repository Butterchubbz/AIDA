// src/views/UserManagementView.js
import React from 'react';
import useUsers from '@/hooks/useUsers';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMessageBox } from '@/components/MessageBox';

const UserManagementView = () => {
    const { users, loading, error } = useUsers();
    const { showToast } = useMessageBox();

    if (loading) {
        return <div className="p-8"><LoadingSpinner /></div>;
    }

    if (error) {
        return <div className="p-8 text-red-400">{error}</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">User Management</h1>
            <p className="text-slate-400 mb-6">Managing {users.length} users.</p>
            <div className="bg-slate-800 rounded-lg p-4">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(users, null, 2)}</pre>
            </div>
        </div>
    );
};

export default UserManagementView;