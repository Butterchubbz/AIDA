// src/components/InventoryFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

const InventoryFormModal = ({ isOpen, onClose, onSubmit, itemToEdit, stockFields, inventoryConfig }) => {
    const [formData, setFormData] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    const initializeForm = useCallback(() => {
        const initialData = {
            sku: '',
            name: '',
            description: '',
            location: '',
        };
        (stockFields || []).forEach(field => {
            initialData[field.fieldName] = 0;
        });
        return initialData;
    }, [stockFields]);

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setFormData({ ...initializeForm(), ...itemToEdit });
            } else {
                setFormData(initializeForm());
            }
        }
    }, [isOpen, itemToEdit, initializeForm]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            // Error toast is handled by the hook, so we just need to stop processing.
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const formTitle = itemToEdit ? `Edit ${itemToEdit.name}` : `Add New ${inventoryConfig.displayName}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-100">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{formTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-slate-300">SKU</label>
                            <input type="text" name="sku" id="sku" value={formData.sku || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Name</label>
                            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                    </div>
                    {stockFields.map(field => (
                        <div key={field.fieldName}>
                            <label htmlFor={field.fieldName} className="block text-sm font-medium text-slate-300">{field.displayName}</label>
                            <input type="number" name={field.fieldName} id={field.fieldName} value={formData[field.fieldName] ?? ''} onChange={handleChange} required min="0" className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                    ))}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-300">Location</label>
                        <input type="text" name="location" id="location" value={formData.location || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
                        <textarea name="description" id="description" rows="3" value={formData.description || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isProcessing} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">Cancel</button>
                        <button type="submit" disabled={isProcessing} className="px-6 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                            {isProcessing ? <LoadingSpinner /> : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryFormModal;