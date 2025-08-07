// src/components/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { userRole } = useAuth();

    if (userRole !== 'Admin') {
        // Redirect non-admins to the dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />; // Render child routes for admins
};

export default AdminRoute;