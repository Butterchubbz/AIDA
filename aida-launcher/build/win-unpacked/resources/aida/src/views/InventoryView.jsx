// src/views/InventoryView.js
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import useDynamicInventory from '@/hooks/useDynamicInventory';
import InventoryList from '@/components/InventoryList';
import InventoryFormModal from '@/components/InventoryFormModal';
import { useMessageBox } from '@/components/MessageBox';

const InventoryView = () => {
    const { collectionName } = useParams();
    const { appConfig, loadingAppConfig } = useAppContext();
    const { showMessageBox } = useMessageBox();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    // FIX: Hooks must be called at the top level, not inside conditions.
    const { items, loading, error, addItem, updateItem, deleteItem } = useDynamicInventory(collectionName);

    if (loadingAppConfig) {
        return <LoadingSpinner />;
    }

    const inventoryConfig = appConfig?.inventories?.find(
        inv => inv.collectionName === collectionName
    );
    const stockFields = appConfig?.stockFields || [];

    if (!inventoryConfig) {
        return (
            <div className="text-red-400 bg-red-900/20 p-4 rounded-md text-center">
                <p className="font-semibold">Configuration Error</p>
                <p>Inventory type "{collectionName}" not found in application configuration.</p>
            </div>
        );
    }

    const handleAddItem = () => {
        setItemToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleDeleteItem = async (itemId, itemName) => {
        const confirmed = await showMessageBox(
            'Confirm Deletion',
            `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
            true
        );
        if (confirmed) {
            await deleteItem(itemId);
        }
    };

    const handleFormSubmit = async (formData) => {
        if (itemToEdit) {
            // Update existing item
            const { id, ...dataToUpdate } = formData;
            await updateItem(id, dataToUpdate);
        } else {
            // Add new item
            await addItem(formData);
        }
    };

    return (
        <>
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                    <h2 className="text-2xl font-semibold text-cyan-400">
                        <i className="fas fa-boxes mr-3 text-emerald-400"></i>
                        {inventoryConfig.displayName} Inventory
                    </h2>
                    <button onClick={handleAddItem} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <i className="fas fa-plus"></i> Add Item
                    </button>
                </div>

                {loading && <LoadingSpinner />}
                {error && <div className="text-red-400 bg-red-900/20 p-4 rounded-md text-center"><p>{error}</p></div>}
                {!loading && !error && <InventoryList items={items} inventoryConfig={inventoryConfig} stockFields={stockFields} onEdit={handleEditItem} onDelete={handleDeleteItem} />}
            </div>
            <InventoryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                itemToEdit={itemToEdit}
                stockFields={stockFields}
                inventoryConfig={inventoryConfig}
            />
        </>
    );
};

export default InventoryView;
