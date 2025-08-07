// src/components/InboundShipmentFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

const InboundShipmentFormModal = ({ isOpen, onClose, onSubmit, shipmentToEdit, inboundStatuses }) => {
    const [formData, setFormData] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    const defaultStatuses = ['In Transit', 'Arrived at Customs', 'Customs Cleared', 'Out for Delivery', 'Complete', 'Delayed'];
    const statuses = (inboundStatuses && inboundStatuses.length > 0) ? inboundStatuses : defaultStatuses;

    const initializeForm = useCallback(() => ({
        poNumber: '',
        vendor: '',
        trackingNumber: '',
        shipmentType: 'Air Shipment',
        status: statuses[0],
        estimatedDOA: '',
        notes: '',
    }), []);

    useEffect(() => {
        if (isOpen) {
            if (shipmentToEdit) {
                const dataToSet = { ...initializeForm(), ...shipmentToEdit };
                if (shipmentToEdit.estimatedDOA) {
                    dataToSet.estimatedDOA = new Date(shipmentToEdit.estimatedDOA).toISOString().split('T')[0];
                }
                setFormData(dataToSet);
            } else {
                setFormData(initializeForm());
            }
        }
    }, [isOpen, shipmentToEdit, initializeForm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            // Error toast is handled by the hook
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!shipmentToEdit;
    const formTitle = isEditMode ? 'Edit Inbound Shipment' : 'New Inbound Shipment';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-100">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{formTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="poNumber" className="block text-sm font-medium text-slate-300">PO Number <span className="text-red-500">*</span></label>
                            <input type="text" name="poNumber" id="poNumber" value={formData.poNumber || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="vendor" className="block text-sm font-medium text-slate-300">Vendor <span className="text-red-500">*</span></label>
                            <input type="text" name="vendor" id="vendor" value={formData.vendor || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="trackingNumber" className="block text-sm font-medium text-slate-300">Tracking Number</label>
                            <input type="text" name="trackingNumber" id="trackingNumber" value={formData.trackingNumber || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="estimatedDOA" className="block text-sm font-medium text-slate-300">Estimated DOA</label>
                            <input type="date" name="estimatedDOA" id="estimatedDOA" value={formData.estimatedDOA || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="shipmentType" className="block text-sm font-medium text-slate-300">Shipment Type</label>
                            <select name="shipmentType" id="shipmentType" value={formData.shipmentType} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md">
                                <option>Air Shipment</option>
                                <option>Sea Shipment</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-300">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md">
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Notes</label>
                        <textarea name="notes" id="notes" rows="3" value={formData.notes || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isProcessing} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">Cancel</button>
                        <button type="submit" disabled={isProcessing} className="px-6 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                            {isProcessing ? <LoadingSpinner /> : (isEditMode ? 'Update' : 'Save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InboundShipmentFormModal;