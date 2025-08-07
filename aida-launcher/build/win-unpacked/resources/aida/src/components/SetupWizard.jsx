// src/components/SetupWizard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessageBox } from './MessageBox';
import LoadingSpinner from './LoadingSpinner';

// Helper to convert a user-friendly name to a valid PocketBase collection name.
// Eg: "Finished Goods" -> "finished_goods"
const toCollectionName = (name) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_ ]/g, '') // Remove special chars except underscore and space
        .replace(/\s+/g, '_');      // Replace spaces with underscores
};

// NEW Helper to convert a user-friendly name to a valid PocketBase field name (camelCase).
// Eg: "Warehouse Stock" -> "warehouseStock"
const toFieldName = (name) => {
    let fieldName = name
        .trim()
        .replace(/\s+(.)/g, (match, chr) => chr.toUpperCase());

    fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    fieldName = fieldName.replace(/[^a-zA-Z0-9]/g, '');

    if (!/^[a-zA-Z]/.test(fieldName)) {
        fieldName = 'field' + fieldName;
    }
    return fieldName;
};

const SetupWizard = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [inventoryCount, setInventoryCount] = useState(1);
    const [inventoryNames, setInventoryNames] = useState(['']);
    const [stockCount, setStockCount] = useState(2);
    const [stockNames, setStockNames] = useState(['In Stock', 'On Order']);
    const [enableForecasting, setEnableForecasting] = useState(true);
    const [enableInboundShipments, setEnableInboundShipments] = useState(true);
    const [inboundStatuses, setInboundStatuses] = useState(['In Transit', 'Arrived at Customs', 'Customs Cleared', 'Out for Delivery', 'Complete', 'Delayed']);
    const [rmaStatuses, setRmaStatuses] = useState(['Incoming', 'Received', 'Processing', 'Complete', 'Cancelled']);
    const [rmaRequirement, setRmaRequirement] = useState('orderNumber'); // 'orderNumber', 'ticketNumber', 'both'
    const [isProcessing, setIsProcessing] = useState(false);
    const { pb } = useAuth(); // Get PocketBase instance for API calls
    const { showToast } = useMessageBox();

    // Reset state when the modal is closed/re-opened
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setInventoryCount(1);
            setInventoryNames(['']);
            setStockCount(2);
            setStockNames(['In Stock', 'On Order']);
            setEnableForecasting(true);
            setEnableInboundShipments(true);
            setInboundStatuses(['In Transit', 'Arrived at Customs', 'Customs Cleared', 'Out for Delivery', 'Complete', 'Delayed']);
            setRmaStatuses(['Incoming', 'Received', 'Processing', 'Complete', 'Cancelled']);
            setRmaRequirement('orderNumber');
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handleInventoryCountChange = (e) => {
        const count = Math.max(1, parseInt(e.target.value, 10) || 1);
        setInventoryCount(count);
    };

    const handleInventoryNameChange = (index, value) => {
        const newNames = [...inventoryNames];
        newNames[index] = value;
        setInventoryNames(newNames);
    };

    const goToStep2 = () => {
        // Initialize names array based on count
        setInventoryNames(Array(inventoryCount).fill(''));
        setStep(2);
    };

    const goToStep3 = () => {
        if (inventoryNames.some(name => name.trim() === '')) {
            showToast('All inventory types must have a name.', 'error');
            return;
        }
        const uniqueNames = new Set(inventoryNames.map(n => n.trim()));
        if (uniqueNames.size !== inventoryNames.length) {
            showToast('Inventory names must be unique.', 'error');
            return;
        }
        setStep(3);
    };

    const goToStep4 = () => {
        const sanitizedStockNames = stockNames.map(name => name.trim());
        if (sanitizedStockNames.some(name => name === '')) {
            showToast('All stock count types must have a name.', 'error');
            return;
        }
        const uniqueStockNames = new Set(sanitizedStockNames);
        if (uniqueStockNames.size !== sanitizedStockNames.length) {
            showToast('Stock count names must be unique.', 'error');
            return;
        }
        setStep(4);
    };

    const handleNextFromForecastToggle = () => {
        setStep(5); // Go to Inbound Shipments config
    };

    const handleBackFromInbound = () => {
        setStep(4); // Go back to Forecasting toggle
    };

    const handleNextFromInbound = () => {
        if (enableInboundShipments) {
            setStep(6); // Go to new Inbound Statuses config
        } else {
            setStep(7); // Skip to RMA config
        }
    };

    const handleNextFromRmaReq = () => {
        setStep(8); // Go to RMA Statuses config
    };

    const handleBackFromRma = () => {
        if (enableInboundShipments) {
            setStep(6); // Go back to Inbound Statuses config
        } else {
            setStep(5); // Go back to Inbound toggle
        }
    };

    const handleStockCountChange = (e) => {
        const count = Math.max(1, parseInt(e.target.value, 10) || 1);
        setStockCount(count);
        // Adjust the names array to the new count
        const newNames = [...stockNames];
        while (newNames.length < count) {
            newNames.push('');
        }
        setStockNames(newNames.slice(0, count));
    };

    const handleStockNameChange = (index, value) => {
        const newNames = [...stockNames];
        newNames[index] = value;
        setStockNames(newNames);
    };

    const handleStatusChange = (index, value) => {
        const newStatuses = [...inboundStatuses];
        newStatuses[index] = value;
        setInboundStatuses(newStatuses);
    };

    const addStatus = () => {
        setInboundStatuses([...inboundStatuses, 'New Status']);
    };

    const removeStatus = (index) => {
        if (inboundStatuses.length > 1) {
            setInboundStatuses(inboundStatuses.filter((_, i) => i !== index));
        }
    };

    const handleRmaStatusChange = (index, value) => {
        const newStatuses = [...rmaStatuses];
        newStatuses[index] = value;
        setRmaStatuses(newStatuses);
    };

    const addRmaStatus = () => {
        setRmaStatuses([...rmaStatuses, 'New Status']);
    };

    const removeRmaStatus = (index) => {
        if (rmaStatuses.length > 1) {
            setRmaStatuses(rmaStatuses.filter((_, i) => i !== index));
        }
    };

    const handleFinishSetup = async () => {
        setIsProcessing(true);
        showToast('Starting setup...', 'info');

        // 1. Validation
        const sanitizedInventoryNames = inventoryNames.map(name => name.trim());
        const sanitizedStockNames = stockNames.map(name => name.trim());
        const sanitizedInboundStatuses = inboundStatuses.map(s => s.trim()).filter(s => s);
        const sanitizedRmaStatuses = rmaStatuses.map(s => s.trim()).filter(s => s);

        // Final safeguard validation, though each step's "Next" button handles this.
        if (sanitizedInventoryNames.some(n => n === '') || sanitizedStockNames.some(n => n === '')) {
            showToast('All fields must be filled out.', 'error');
            setIsProcessing(false);
            return;
        }
        if (enableInboundShipments && sanitizedInboundStatuses.length === 0) {
            showToast('You must define at least one status for inbound shipments.', 'error');
            setIsProcessing(false);
            return;
        }
        if (sanitizedRmaStatuses.length === 0) {
            showToast('You must define at least one status for RMAs.', 'error');
            setIsProcessing(false);
            return;
        }
        
        const createCollectionIfNotExists = async (collectionName, schema, rules) => {
            try {
                await pb.collections.getOne(collectionName);
                // Collection already exists, so we can skip it.
            } catch (error) {
                if (error.status === 404) {
                    // Collection doesn't exist, create it.
                    showToast(`Creating collection: ${collectionName}...`, 'info');
                    await pb.collections.create({
                        name: collectionName,
                        type: 'base',
                        schema,
                        ...rules,
                    });
                } else {
                    throw error; // Re-throw other unexpected errors
                }
            }
        };

        try {
            // 2. Define the schema based on user input
            const stockSchemaFields = sanitizedStockNames.map(name => ({
                name: toFieldName(name),
                type: 'number',
                required: true,
                options: { min: 0 }
            }));

            const inventorySchema = [
                { name: 'name', type: 'text', required: true },
                { name: 'sku', type: 'text', required: true, unique: true },
                { name: 'description', type: 'editor' },
                ...stockSchemaFields,
                { name: 'location', type: 'text' },
                { name: 'image', type: 'file', options: { maxSize: 5242880, maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] } },
            ];

            const defaultRules = {
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.role = "Admin" || @request.auth.role = "Manager"',
                updateRule: '@request.auth.role = "Admin" || @request.auth.role = "Manager"',
                deleteRule: '@request.auth.role = "Admin"',
            };

            // 3. Loop and create each inventory collection
            for (const name of sanitizedInventoryNames) {
                const collectionName = toCollectionName(name);

                if (collectionName.length < 3) {
                    throw new Error(`The name "${name}" is too short to be a valid collection name.`);
                }

                await createCollectionIfNotExists(collectionName, inventorySchema, defaultRules);
            }

            // 4. Create standard module collections based on user choices
            if (enableInboundShipments) {
                const inboundShipmentsSchema = [
                    { name: 'poNumber', type: 'text', required: true },
                    { name: 'vendor', type: 'text', required: true },
                    { name: 'trackingNumber', type: 'text' },
                    { name: 'shipmentType', type: 'select', options: { values: ['Air Shipment', 'Sea Shipment'], maxSelect: 1 } },
                    { name: 'estimatedDOA', type: 'date' },
                    { name: 'status', type: 'select', required: true, options: {
                        values: sanitizedInboundStatuses, maxSelect: 1
                    }},
                    { name: 'notes', type: 'editor' },
                ];
                await createCollectionIfNotExists('inboundShipments', inboundShipmentsSchema, defaultRules);
            }

            if (enableForecasting) {
                const salesDataSchema = [
                    { name: 'sku', type: 'text', required: true },
                    { name: 'netSales', type: 'number', required: true },
                    { name: 'year', type: 'number', required: true },
                    { name: 'week', type: 'number', required: true },
                ];
                await createCollectionIfNotExists('salesData', salesDataSchema, defaultRules);
            }

            // Create other standard collections that are always part of AIDA
            const rmaEntriesSchema = [ // This schema is now dynamic
                { name: 'rmaNumber', type: 'text', required: true, unique: true },
                { name: 'customerName', type: 'text' },
                { name: 'orderId', type: 'text', required: rmaRequirement === 'orderNumber' || rmaRequirement === 'both' },
                { name: 'ticketNumber', type: 'text', required: rmaRequirement === 'ticketNumber' || rmaRequirement === 'both' },
                { name: 'status', type: 'select', required: true, options: { values: sanitizedRmaStatuses, maxSelect: 1 } },
                { name: 'items', type: 'json' },
                { name: 'notes', type: 'editor' },
                { name: 'dateCreated', type: 'date', required: true },
            ];
            await createCollectionIfNotExists('rmaEntries', rmaEntriesSchema, defaultRules);


            // 5. Create a settings collection to mark setup as complete
            showToast('Finalizing setup...', 'info');
            try {
                await pb.collections.getOne('aida_settings');
            } catch (error) {
                if (error.status === 404) {
                    await pb.collections.create({
                        name: 'aida_settings',
                        type: 'base',
                        schema: [
                            { name: 'key', type: 'text', required: true, unique: true },
                            { name: 'value', type: 'json' },
                        ],
                        listRule: '@request.auth.role = "Admin"',
                        viewRule: '@request.auth.role = "Admin"',
                        createRule: '@request.auth.role = "Admin"',
                        updateRule: '@request.auth.role = "Admin"',
                        deleteRule: '@request.auth.role = "Admin"',
                    });
                } else {
                    throw error;
                }
            }

            // 6. Store a "setup complete" flag and the list of created inventories
            await pb.collection('aida_settings').create({
                key: 'initial_setup_complete',
                value: {
                    completed: true,
                    timestamp: new Date().toISOString(),
                    inventories: sanitizedInventoryNames.map(name => ({
                        displayName: name,
                        collectionName: toCollectionName(name),
                    })),
                    stockFields: sanitizedStockNames.map(name => ({
                        displayName: name,
                        fieldName: toFieldName(name),
                    })),
                    forecasting: {
                        enabled: enableForecasting,
                    },
                    inboundShipments: {
                        enabled: enableInboundShipments,
                        statuses: sanitizedInboundStatuses,
                    },
                    rma: {
                        requirement: rmaRequirement,
                        statuses: sanitizedRmaStatuses,
                    },
                },
            });

            showToast('Setup complete! The application will reload.', 'success', 4000);
            
            // Reload the app to re-initialize contexts and routes based on the new collections
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Setup failed:", error);
            const errorMessage = error.response?.data?.message || error.message;
            showToast(`Setup failed: ${errorMessage}`, 'error', 8000);
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-xl text-slate-100">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">AIDA Initial Setup</h2>
                <p className="text-slate-400 mb-1">Step {step} of 8</p>
                <p className="text-slate-400 mb-6">Let's configure your inventory management system.</p>

                {step === 1 && (
                    <div>
                        <label htmlFor="inventory-count" className="block text-sm font-medium text-slate-300 mb-2">
                            How many types of inventories do you need to track?
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            For example, if you track "Finished Goods" and "Raw Components" separately, you would enter 2.
                        </p>
                        <input
                            id="inventory-count"
                            type="number"
                            min="1"
                            value={inventoryCount}
                            onChange={handleInventoryCountChange}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="mt-6 flex justify-end">
                            <button onClick={goToStep2} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Please name your inventory types.</label>
                        <p className="text-xs text-slate-500 mb-4">Use singular, capitalized names (e.g., "Device", "Component"). This will be used to name database collections.</p>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {Array.from({ length: inventoryCount }).map((_, index) => (
                                <div key={index}>
                                    <input type="text" placeholder={`Inventory Type #${index + 1}`} value={inventoryNames[index] || ''} onChange={(e) => handleInventoryNameChange(index, e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={goToStep3} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Define Your Stock Counts</label>
                        <p className="text-xs text-slate-500 mb-4">
                            How many ways do you count stock? (e.g., "In Stock", "On Order", "Warehouse", "Production").
                        </p>
                        <div className="mb-4">
                            <label htmlFor="stock-count" className="block text-sm font-medium text-slate-300 mb-2">
                                Number of Stock Types:
                            </label>
                            <input
                                id="stock-count"
                                type="number"
                                min="1"
                                value={stockCount}
                                onChange={handleStockCountChange}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {Array.from({ length: stockCount }).map((_, index) => (
                                <div key={index}>
                                    <input type="text" placeholder={`Stock Count Name #${index + 1}`} value={stockNames[index] || ''} onChange={(e) => handleStockNameChange(index, e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={goToStep4} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Enable Forecasting</label>
                        <p className="text-xs text-slate-500 mb-4">
                            Do you want to enable sales forecasting features? This will add forecasting views and require sales data uploads.
                        </p>
                        <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                            <span className="font-medium text-slate-100">Enable Sales Forecasting</span>
                            <label htmlFor="forecasting-toggle" className="inline-flex relative items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="forecasting-toggle" 
                                    className="sr-only peer" 
                                    checked={enableForecasting}
                                    onChange={() => setEnableForecasting(!enableForecasting)}
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(3)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={handleNextFromForecastToggle} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Enable Inbound Shipments</label>
                        <p className="text-xs text-slate-500 mb-4">
                            Do you want to track inbound shipments from suppliers? This will add the Inbound Shipments module to your sidebar.
                        </p>
                        <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                            <span className="font-medium text-slate-100">Enable Inbound Shipments</span>
                            <label htmlFor="inbound-toggle" className="inline-flex relative items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="inbound-toggle" 
                                    className="sr-only peer" 
                                    checked={enableInboundShipments}
                                    onChange={() => setEnableInboundShipments(!enableInboundShipments)}
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={handleBackFromInbound} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={handleNextFromInbound} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Define Inbound Shipment Statuses</label>
                        <p className="text-xs text-slate-500 mb-4">
                            Create the status options for your inbound shipment tracking (e.g., "In Transit", "At Port", "Delivered").
                        </p>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {inboundStatuses.map((status, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Status #${index + 1}`}
                                        value={status}
                                        onChange={(e) => handleStatusChange(index, e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"
                                    />
                                    <button type="button" onClick={() => removeStatus(index)} disabled={inboundStatuses.length <= 1} className="px-3 py-2 bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addStatus} className="mt-3 text-sm text-blue-400 hover:text-blue-300">+ Add Status</button>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(5)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={() => setStep(7)} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 7 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Configure RMA Requirements</label>
                        <p className="text-xs text-slate-500 mb-4">
                            What information should be required when creating a new RMA (Return) entry?
                        </p>
                        <div className="bg-slate-700 rounded-lg p-4">
                            <label htmlFor="rma-requirement" className="block text-sm font-medium text-slate-300 mb-2">RMA Requirement</label>
                            <select
                                id="rma-requirement"
                                value={rmaRequirement}
                                onChange={(e) => setRmaRequirement(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="orderNumber">Order Number is Required</option>
                                <option value="ticketNumber">Ticket Number is Required</option>
                                <option value="both">Both Order & Ticket Number are Required</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={handleBackFromRma} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={handleNextFromRmaReq} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Next <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {step === 8 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Define RMA Statuses</label>
                        <p className="text-xs text-slate-500 mb-4">
                            Create the status options for your RMA workflow (e.g., "Incoming", "Received", "Repaired", "Shipped").
                        </p>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {rmaStatuses.map((status, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Status #${index + 1}`}
                                        value={status}
                                        onChange={(e) => handleRmaStatusChange(index, e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md"
                                    />
                                    <button type="button" onClick={() => removeRmaStatus(index)} disabled={rmaStatuses.length <= 1} className="px-3 py-2 bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addRmaStatus} className="mt-3 text-sm text-blue-400 hover:text-blue-300">+ Add Status</button>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(7)} className="px-6 py-2 rounded-md bg-slate-600 text-white font-semibold hover:bg-slate-500">
                                <i className="fas fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={handleFinishSetup} disabled={isProcessing} className="px-6 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                                {isProcessing ? <LoadingSpinner /> : 'Finish Setup'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetupWizard;