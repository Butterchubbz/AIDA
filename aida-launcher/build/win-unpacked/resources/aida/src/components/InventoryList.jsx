// src/components/InventoryList.js
import React from 'react';
import { format } from 'date-fns';

const InventoryList = ({ items, inventoryConfig, stockFields, onEdit, onDelete }) => {
    if (!items || items.length === 0) {
        return (
            <div className="text-center text-slate-400 p-8 bg-slate-800/50 rounded-lg">
                <p>No items found in {inventoryConfig.displayName}.</p>
                <p className="mt-2 text-sm">Click "Add Item" to create a new one.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                        {stockFields.map(field => (
                            <th key={field.fieldName} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{field.displayName}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Updated</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-700/40">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-cyan-300">{item.sku}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{item.name}</td>
                            {stockFields.map(field => (
                                <td key={field.fieldName} className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">{item[field.fieldName] ?? 0}</td>
                            ))}
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">{item.location}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">{format(new Date(item.updated), 'PPp')}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 mr-4">Edit</button>
                                <button onClick={() => onDelete(item.id, item.name)} className="text-red-500 hover:text-red-400">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryList;