// src/components/DashboardView.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import useInboundShipments from '@/hooks/useInboundShipments';
import useRMATracker from '@/hooks/useRMATracker';
import useUsers from '@/hooks/useUsers';
import LoadingSpinner from '@/components/LoadingSpinner';

// A reusable stat card component for the dashboard
const StatCard = ({ title, value, icon, linkTo, color = 'cyan' }) => {
    const colorClasses = {
        cyan: 'text-cyan-500',
        emerald: 'text-emerald-500',
        blue: 'text-blue-500',
        yellow: 'text-yellow-500',
        purple: 'text-purple-500',
    };

    const cardContent = (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-center justify-between transition-transform duration-200 hover:scale-105 h-full">
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-3xl font-bold text-white">
                    {value === null ? <div className="pt-2"><LoadingSpinner /></div> : value}
                </p>
            </div>
            <div className={`text-5xl ${colorClasses[color] || 'text-cyan-500'} opacity-20`}>
                <i className={`fas ${icon}`}></i>
            </div>
        </div>
    );

    return linkTo ? <Link to={linkTo}>{cardContent}</Link> : <div>{cardContent}</div>;
};

// A small component to fetch and display total inventory count from multiple collections
const TotalInventoryStat = () => {
    const { appConfig } = useAppContext();
    const { pb } = useAuth();
    const [total, setTotal] = useState(null); // null for loading state

    useEffect(() => {
        const inventories = appConfig?.inventories;
        if (!pb || !inventories) return;

        if (inventories.length === 0) {
            setTotal(0);
            return;
        }

        const fetchCounts = async () => {
            try {
                const counts = await Promise.all(
                    inventories.map(inv =>
                        pb.collection(inv.collectionName).getList(1, 1, { filter: 'id != ""' })
                    )
                );
                const totalItems = counts.reduce((sum, result) => sum + result.totalItems, 0);
                setTotal(totalItems);
            } catch (e) {
                console.error("Failed to fetch inventory counts", e);
                setTotal('N/A');
            }
        };

        fetchCounts();
    }, [appConfig, pb]);

    return total;
};

const DashboardView = () => {
    const { currentUser, userRole } = useAuth();
    const { shipments } = useInboundShipments();
    const { rmas } = useRMATracker();
    const { users, loading: loadingUsers } = useUsers();

    // Calculate stats
    const pendingRmas = rmas.filter(rma => rma.status !== 'Complete' && rma.status !== 'Cancelled').length;
    const activeShipments = shipments.filter(shipment => shipment.status !== 'Received').length;

    return (
        <div className="space-y-8">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-white">Welcome back, {currentUser?.name || 'User'}!</h1>
                <p className="text-slate-400 mt-1">Here's a quick overview of your AIDA system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Inventory Items" value={<TotalInventoryStat />} icon="fa-boxes" color="emerald" />
                <StatCard title="Active Inbound Shipments" value={activeShipments} icon="fa-truck-loading" linkTo="/inbound-shipments" color="blue" />
                <StatCard title="Pending RMAs" value={pendingRmas} icon="fa-undo-alt" linkTo="/rma-tracking" color="yellow" />
                {userRole === 'Admin' && (
                    <StatCard title="Total Users" value={loadingUsers ? null : users.length} icon="fa-users" linkTo="/user-management" color="purple" />
                )}
            </div>
        </div>
    );
};

export default DashboardView;