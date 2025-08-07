// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
// import logoUrl from '../assets/AIDA-logo.png'; // FIX: Asset is missing, commented out for now.

// A reusable NavLink component for the sidebar for better styling and consistency
const SidebarLink = ({ to, icon, children }) => (
    <NavLink
        to={to}
        end // Use 'end' prop to ensure only exact matches are 'active' for parent routes
        className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`
        }
    >
        <i className={`${icon} w-6 text-center mr-3`}></i>
        <span>{children}</span>
    </NavLink>
);

const Sidebar = ({ userRole, appConfig }) => {
    const inventories = appConfig?.inventories || [];
    const forecastingEnabled = appConfig?.forecasting?.enabled || false;
    // Default to true for backwards compatibility with setups that don't have this flag
    const inboundEnabled = appConfig?.inboundShipments?.enabled ?? true;
    const amazonEnabled = appConfig?.amazon?.enabled ?? false; // Default to false for consistency

    return (
        <aside className="w-64 bg-slate-800 flex flex-col h-screen shadow-2xl">
            <div className="flex items-center justify-center h-24 border-b border-slate-700">
                {/* <img src={logoUrl} alt="AIDA Logo" className="h-10" /> */}
                <span className="text-xl font-bold text-white">AIDA</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
                <div>
                    <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Main</h3>
                    <SidebarLink to="/dashboard" icon="fas fa-tachometer-alt">Dashboard</SidebarLink>
                </div>

                {/* Dynamic Inventory Links */}
                {inventories.length > 0 && (
                    <div>
                        <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Inventories</h3>
                        {inventories.map(inv => (
                            <SidebarLink key={inv.collectionName} to={`/inventory/${inv.collectionName}`} icon="fas fa-boxes">
                                {inv.displayName}
                            </SidebarLink>
                        ))}
                    </div>
                )}

                {/* Other Modules */}
                <div>
                    <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Modules</h3>
                    {inboundEnabled && (
                        <SidebarLink to="/inbound-shipments" icon="fas fa-truck-loading">Inbound</SidebarLink>
                    )}
                    <SidebarLink to="/rma-tracking" icon="fas fa-undo-alt">RMA Tracker</SidebarLink>
                    {amazonEnabled && (
                        <SidebarLink to="/amazon/overview" icon="fab fa-amazon">Amazon</SidebarLink>
                    )}
                </div>

                {/* Dynamic Forecasting Links */}
                {forecastingEnabled && inventories.length > 0 && (
                    <div>
                        <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Forecasting</h3>
                        {inventories.map(inv => (
                            <SidebarLink key={inv.collectionName} to={`/forecasting/${inv.collectionName}`} icon="fas fa-chart-line">
                                {inv.displayName}
                            </SidebarLink>
                        ))}
                        <SidebarLink to="/forecasting/manual" icon="fas fa-magic">Manual</SidebarLink>
                    </div>
                )}

                {/* Admin Links */}
                {userRole === 'Admin' && (
                    <div>
                        <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Admin</h3>
                        <SidebarLink to="/user-management" icon="fas fa-users-cog">Users</SidebarLink>
                        <SidebarLink to="/data-management" icon="fas fa-database">Data</SidebarLink>
                    </div>
                )}
            </nav>

            <div className="px-4 py-4 border-t border-slate-700">
                <SidebarLink to="/profile" icon="fas fa-user-circle">Profile</SidebarLink>
            </div>
        </aside>
    );
};

export default Sidebar;