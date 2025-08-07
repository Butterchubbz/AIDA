// src/components/RMAFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

const RMAFormModal = ({ isOpen, onClose, onSubmit, rmaToEdit, rmaConfig, rmaStatuses }) => {
    const [formData, setFormData] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    const defaultStatuses = ['Incoming', 'Received', 'Processing', 'Complete', 'Cancelled'];
    const statuses = (rmaStatuses && rmaStatuses.length > 0) ? rmaStatuses : defaultStatuses;

    const initializeForm = useCallback(() => ({
        rmaNumber: '',
        customerName: '',
        orderId: '',
        ticketNumber: '',
        status: statuses[0],
        notes: '',
        dateCreated: new Date().toISOString().split('T')[0],
    }), []);

    useEffect(() => {
        if (isOpen) {
            if (rmaToEdit) {
                const dataToSet = { ...initializeForm(), ...rmaToEdit };
                if (rmaToEdit.dateCreated) {
                    dataToSet.dateCreated = new Date(rmaToEdit.dateCreated).toISOString().split('T')[0];
                }
                setFormData(dataToSet);
            } else {
                setFormData(initializeForm());
            }
        }
    }, [isOpen, rmaToEdit, initializeForm]);

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

    const isEditMode = !!rmaToEdit;
    const formTitle = isEditMode ? `Edit RMA ${rmaToEdit.rmaNumber}` : 'New RMA Entry';
    const requirement = rmaConfig?.requirement || 'orderNumber'; // Default to orderNumber if not configured

    const isOrderRequired = requirement === 'orderNumber' || requirement === 'both';
    const isTicketRequired = requirement === 'ticketNumber' || requirement === 'both';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-100">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">{formTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="rmaNumber" className="block text-sm font-medium text-slate-300">RMA Number <span className="text-red-500">*</span></label>
                            <input type="text" name="rmaNumber" id="rmaNumber" value={formData.rmaNumber || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-slate-300">Customer Name</label>
                            <input type="text" name="customerName" id="customerName" value={formData.customerName || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="orderId" className="block text-sm font-medium text-slate-300">Order ID {isOrderRequired && <span className="text-red-500">*</span>}</label>
                            <input type="text" name="orderId" id="orderId" value={formData.orderId || ''} onChange={handleChange} required={isOrderRequired} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="ticketNumber" className="block text-sm font-medium text-slate-300">Ticket Number {isTicketRequired && <span className="text-red-500">*</span>}</label>
                            <input type="text" name="ticketNumber" id="ticketNumber" value={formData.ticketNumber || ''} onChange={handleChange} required={isTicketRequired} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-300">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md">
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dateCreated" className="block text-sm font-medium text-slate-300">Date
 Created</label>
                            <input type="date" name="dateCreated" id="dateCreated" value={formData.dateCreated || ''} onChange={handleChange} required className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-300">Notes</label>
                        <textarea name="notes" id="notes" rows="3" value={formData.notes || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md disabled:opacity-50 flex items-center">
                            {isProcessing && <LoadingSpinner />}
                            <span className={isProcessing ? 'ml-2' : ''}>{isEditMode ? 'Save Changes' : 'Create RMA'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RMAFormModal;