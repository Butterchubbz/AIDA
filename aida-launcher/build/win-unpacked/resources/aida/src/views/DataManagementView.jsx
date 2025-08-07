// src/views/DataManagementView.js
import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useMessageBox } from '@/components/MessageBox';
import { parseCsvFile } from '@/utils/csvParser';
import ProgressBar from '@/components/ProgressBar';
import LoadingSpinner from '@/components/LoadingSpinner';

const DataManagementView = () => {
    const { currentUser, pb } = useAuth(); // Get PocketBase instance
    const { appConfig } = useAppContext();
    const { showToast, showMessageBox } = useMessageBox();

    const [isExporting, setIsExporting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importStatus, setImportStatus] = useState('');
    const [historyUploadTab, setHistoryUploadTab] = useState('vaults');
    const [historyFile, setHistoryFile] = useState(null);
    const [isUploadingHistory, setIsUploadingHistory] = useState(false);
    const [salesFile, setSalesFile] = useState(null);
    const [isUploadingSales, setIsUploadingSales] = useState(false);

    // Refs for file inputs to allow programmatic clearing
    const csvImportInputRef = useRef(null);
    const jsonImportInputRef = useRef(null);
    const salesInputRef = useRef(null);
    const historyInputRef = useRef(null);
    
    const collectionMapping = useMemo(() => {
        const mapping = {};
        // Add standard, non-inventory collections
        if (appConfig?.inboundShipments?.enabled) mapping.inboundShipments = 'inboundShipments';
        if (appConfig?.rma) mapping.rmaEntries = 'rmaEntries';
        if (appConfig?.forecasting?.enabled) mapping.salesData = 'salesData';
        // You can add other static collections like amazonPOs here if needed
        mapping.amazonPOs = 'amazonPOs';

        // Dynamically add inventory collections from the config
        appConfig?.inventories?.forEach(inv => {
            mapping[inv.collectionName] = inv.collectionName;
        });
        return mapping;
    }, [appConfig]);

    const handleExportData = async () => {
        if (!currentUser || !pb) {
            showToast("You must be logged in to export data.", "error");
            return;
        }

        showToast("Starting data export...", "info");
        setIsExporting(true);

        const exportedData = {};

        try {
            for (const key in collectionMapping) {
                const collectionName = collectionMapping[key];
                const records = await pb.collection(collectionName).getFullList();
                exportedData[key] = records;
            }

            const jsonString = JSON.stringify(exportedData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `pocketbase-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast("Data export completed successfully!", "success");
        } catch (error) {
            showToast("An error occurred during the export.", "error");
            console.error("Error during data export:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const coerceDataTypes = (data) => {
        // Handle null or undefined values
        if (data === null || data === undefined) {
            return data;
        }

        // Handle Firebase Timestamp objects (both common formats)
        if (typeof data === 'object' && !Array.isArray(data)) {
            const hasSeconds = typeof data.seconds === 'number' && typeof data.nanoseconds === 'number';
            const hasUnderscoreSeconds = typeof data._seconds === 'number' && typeof data._nanoseconds === 'number';

            if (hasSeconds || hasUnderscoreSeconds) {
                const seconds = hasSeconds ? data.seconds : data._seconds;
                const nanoseconds = hasSeconds ? data.nanoseconds : data._nanoseconds;
                return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
            }
        }

        // Recursively process arrays
        if (Array.isArray(data)) {
            return data.map(item => coerceDataTypes(item));
        }

        // Recursively process objects, ensuring 'sku' is not converted from a string
        if (typeof data === 'object') {
            const coerced = {};
            for (const key in data) {
                // Keep 'sku' as a string, but coerce other fields
                coerced[key] = (key === 'sku') ? data[key] : coerceDataTypes(data[key]);
            }
            return coerced;
        }

        // Coerce string values to boolean or number if they match
        if (typeof data === 'string') {
            if (data.toLowerCase() === 'true') return true;
            if (data.toLowerCase() === 'false') return false;
            if (!isNaN(data) && data.trim() !== '') return Number(data);
        }

        return data;
    };

    const sanitizeRecordForUpsert = (record, collectionName) => {
        const {
            id,
            collectionId,
            collectionName: recordCollectionName, // aliased to avoid conflict
            created,
            updated,
            expand,
            ...data
        } = record;

        let finalData = { ...data };

        // Apply default values for specific collections to prevent validation errors
        // for required fields that might be missing in the source data.
        if (collectionName === 'inventory') {
            const inventoryDefaults = {
                name: '',
                sku: '',
                wooStock: 0,
                productionStock: 0,
                warehouseStock: 0,
                reserveStock: 0,
            };
            for (const key in inventoryDefaults) {
                if (finalData[key] === undefined) {
                    finalData[key] = inventoryDefaults[key];
                }
            }
        }

        if (collectionName === 'rmaEntries') {
            const rmaDefaults = {
                status: 'Incoming', // Default status for new entries
            };
            for (const key in rmaDefaults) {
                // Set default only if the field is missing or empty in the CSV.
                if (finalData[key] === undefined || finalData[key] === '') {
                    finalData[key] = rmaDefaults[key];
                }
            }
        }

        return { id, data: coerceDataTypes(finalData) };
    };

    const processUpsert = async (doc, collectionName) => {
        // Normalize keys to start with a lowercase letter (e.g., "Device" -> "device")
        // to better match PocketBase field names.
        const normalizedDoc = Object.keys(doc).reduce((acc, key) => {
            if (key) {
                const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
                acc[normalizedKey] = doc[key];
            }
            return acc;
        }, {});
        const { id, data: sanitizedData } = sanitizeRecordForUpsert(normalizedDoc, collectionName);

        if (!id) {
            // No ID, so we must create.
            console.log(`No ID found for collection "${collectionName}", creating new record.`);
            return pb.collection(collectionName).create(sanitizedData, { '$autoCancel': false });
        }

        try {
            // ID exists, try to update.
            return await pb.collection(collectionName).update(id, sanitizedData, { '$autoCancel': false });
        } catch (e) {
            if (e.status === 404) {
                // Not found, so create. Preserve original ID in a separate field.
                // This assumes your collection has a 'firebaseId' text field.
                const recordToCreate = { ...sanitizedData, firebaseId: id };
                console.log(`Record with ID ${id} not found in "${collectionName}". Creating new record.`);
                try {
                    return await pb.collection(collectionName).create(recordToCreate, { '$autoCancel': false });
                } catch (createErr) {
                    if (createErr.status === 400 && createErr.response?.data) {
                        const validationErrors = createErr.response.data;
                        const errorMessages = Object.entries(validationErrors).map(([field, err]) => `'${field}': ${err.message}`).join('; ');
                        const hint = `This usually means the data in your file doesn't match the schema in PocketBase for the '${collectionName}' collection. Please ensure the collection has a text field named 'firebaseId' if you are migrating data.`;
                        const detailedError = new Error(`Validation failed for '${collectionName}': ${errorMessages}. ${hint}`);
                        console.warn(`Validation warning for collection '${collectionName}':`, { record: recordToCreate, error: createErr.toJSON() });
                        return Promise.reject(detailedError);
                    }
                    return Promise.reject(createErr);
                }
            }
            // Re-throw other update errors
            return Promise.reject(new Error(`Collection ${collectionName}, Record ID ${id}: ${e.message}`));
        }
    };

    const handleCsvImport = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const confirmed = await showMessageBox('Confirm CSV Import', `This will update or create records in ${files.length} collection(s) based on the provided IDs. This action cannot be undone.`, true);
        if (!confirmed) return;

        setIsProcessing(true);

        for (const file of files) {
            setImportProgress(0);
            const baseName = file.name.replace(/\.csv$/, '');
            const collectionName = collectionMapping[baseName];

            if (!collectionName) {
                showToast(`Skipping file: Unknown collection for "${file.name}"`, 'warning');
                continue;
            }

            try {
                setImportStatus(`Parsing ${file.name}...`);
                const documentsData = await parseCsvFile(file);

                if (!documentsData.length) {
                    showToast(`Skipping: "${file.name}" appears to be empty.`, 'warning');
                    continue;
                }

                setImportStatus(`Importing ${documentsData.length} records into ${collectionName}...`);
                let processedCount = 0;

                const upsertPromises = documentsData.map(doc => {
                    return processUpsert(doc, collectionName)
                        .then(res => ({ status: 'fulfilled', value: res }))
                        .catch(e => ({ status: 'rejected', reason: e }))
                        .finally(() => {
                            processedCount++;
                            setImportProgress(Math.round((processedCount / documentsData.length) * 100));
                        });
                });

                const results = await Promise.all(upsertPromises);
                const successfulCount = results.filter(r => r.status === 'fulfilled').length;
                const failedCount = results.length - successfulCount;

                if (failedCount > 0) {
                    showToast(`In ${collectionName}: ${successfulCount} succeeded, ${failedCount} failed. Check console.`, "warning", 8000);
                    results.filter(r => r.status === 'rejected').forEach(r => console.error(r.reason));
                } else {
                    showToast(`Successfully imported ${successfulCount} records into "${collectionName}".`, 'success');
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                showToast(`An error occurred while processing ${file.name}: ${error.message}`, "error");
            }
        }

        setIsProcessing(false);
        setImportStatus('');
        setImportProgress(0);
    };

    const handleJsonImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const confirmed = await showMessageBox('Confirm JSON Import', `This will update or create records from the JSON file based on the provided IDs. This action cannot be undone.`, true);
        if (!confirmed) {
            if (jsonImportInputRef.current) jsonImportInputRef.current.value = null;
            return;
        }

        setIsProcessing(true);
        setImportStatus('Reading JSON file...');
        setImportProgress(0);

        try {
            const fileContent = await file.text();
            const dataToImport = JSON.parse(fileContent);

            const collectionsToProcess = Object.keys(dataToImport).filter(key => collectionMapping[key]);
            const totalRecords = collectionsToProcess.reduce((sum, key) => sum + (dataToImport[key]?.length || 0), 0) || 1;
            let processedCount = 0;

            for (const key of collectionsToProcess) {
                const collectionName = collectionMapping[key];
                const documentsData = dataToImport[key];

                if (!documentsData || !Array.isArray(documentsData)) {
                    showToast(`Skipping: Invalid data format for "${key}" in JSON file.`, 'warning');
                    continue;
                }

                setImportStatus(`Importing ${documentsData.length} records into ${collectionName}...`);

                const upsertPromises = documentsData.map(doc => {
                    return processUpsert(doc, collectionName)
                        .then(res => ({ status: 'fulfilled', value: res }))
                        .catch(e => ({ status: 'rejected', reason: e }))
                        .finally(() => {
                            processedCount++;
                            setImportProgress(Math.round((processedCount / totalRecords) * 100));
                        });
                });

                const results = await Promise.all(upsertPromises);
                const successfulCount = results.filter(r => r.status === 'fulfilled').length;
                const failedCount = results.filter(r => r.status === 'rejected').length;

                if (failedCount > 0) {
                    showToast(`In ${collectionName}: ${successfulCount} succeeded, ${failedCount} failed. Check console.`, "warning", 8000);
                    results.filter(r => r.status === 'rejected').forEach(r => console.error(r.reason));
                } else {
                    showToast(`Successfully imported ${successfulCount} records into "${collectionName}".`, 'success');
                }
            }
            showToast("JSON import finished.", "success");
        } catch (error) {
            console.error("Error during JSON import:", error);
            showToast(`An error occurred during the import: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
            setImportStatus('');
            setImportProgress(0);
            if (jsonImportInputRef.current) jsonImportInputRef.current.value = null;
        }
    };

    const handleSalesDataUpload = async () => {
        if (!salesFile || !pb) return;
        setIsUploadingSales(true);
        try {
            const salesData = await parseCsvFile(salesFile);
            const requiredHeaders = ['sku', 'netSales', 'year', 'week'];
            if (!salesData.length || !requiredHeaders.every(h => Object.keys(salesData[0] || {}).includes(h))) {
                throw new Error(`CSV must contain headers: ${requiredHeaders.join(', ')}`);
            }

            const createPromises = salesData.map(record => {
                 const { sku, netSales, year, week } = record;
                 if (!sku || isNaN(Number(netSales)) || isNaN(Number(year)) || isNaN(Number(week))) {
                    console.warn("Skipping invalid sales record:", record);
                    return null;
                 }
                 return pb.collection('salesData').create({
                    sku: sku.trim(),
                    netSales: Number(netSales),
                    year: Number(year),
                    week: Number(week),
                 });
            }).filter(Boolean);

            if (createPromises.length > 0) {
                await Promise.all(createPromises);
                showToast(`Successfully uploaded ${createPromises.length} sales records.`, "success");
            } else {
                showToast("No valid sales records found to upload.", "info");
            }
        } catch (error) {
            console.error("Sales data upload failed:", error);
            showToast(`Sales data upload failed: ${error.message}`, "error");
        } finally {
            setIsUploadingSales(false);
            setSalesFile(null);
            if (salesInputRef.current) salesInputRef.current.value = null;
        }
    };

    const handleHistoryUpload = async () => {
        if (!historyFile || !pb) return;
        setIsUploadingHistory(true);
        try {
            const historyData = await parseCsvFile(historyFile);

            // FIX: Define placeholder variables for this incomplete feature to resolve 'not defined' error.
            const vaultInventory = [];
            const componentInventory = [];

            const inventoryToSearch = historyUploadTab === 'vaults' ? vaultInventory : componentInventory;
            const historyCollectionName = historyUploadTab === 'vaults' ? 'inventoryStockHistory' : 'componentStockHistory';
            const relationField = historyUploadTab === 'vaults' ? 'item' : 'component';

            const skuMap = new Map(inventoryToSearch.map(item => [item.sku, item.id]));
            const notFoundSkus = new Set();

            const createPromises = historyData.map(record => {
                const { sku, date, field, oldValue, newValue, changedByEmail } = record;
                if (!sku || !date || !field || newValue === undefined) return null;

                const itemId = skuMap.get(sku);
                if (!itemId) {
                    notFoundSkus.add(sku);
                    return null;
                }

                return pb.collection(historyCollectionName).create({
                    [relationField]: itemId,
                    field,
                    oldValue: Number(oldValue) || 0,
                    newValue: Number(newValue),
                    change: Number(newValue) - (Number(oldValue) || 0),
                    changedByEmail: changedByEmail || 'Manual Upload',
                    operation: 'Manual History Upload',
                    date: new Date(date).toISOString(),
                });
            }).filter(Boolean);

            if (notFoundSkus.size > 0) {
                showToast(`SKUs not found and skipped: ${Array.from(notFoundSkus).slice(0, 5).join(', ')}...`, "warning", 8000);
            }

            if (createPromises.length > 0) {
                await Promise.all(createPromises);
                showToast(`Successfully uploaded ${createPromises.length} history records.`, "success");
            } else {
                showToast("No valid history records found to upload.", "info");
            }
        } catch (error) {
            showToast(`History upload failed: ${error.message}`, "error");
        } finally {
            setIsUploadingHistory(false);
            setHistoryFile(null);
            if (historyInputRef.current) historyInputRef.current.value = null;
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl text-slate-100">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-6 border-b pb-3 border-slate-700">
                <i className="fas fa-database text-green-400 mr-2"></i>Data Management
            </h2>
            <div className="space-y-6">
                {/* Export Data Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Export Data</h3>
                    <p className="text-sm text-slate-400 mb-3">Export all collections to a single JSON backup file.</p>
                    <button onClick={handleExportData} disabled={isExporting} className="px-6 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                        <i className="fas fa-file-export"></i> {isExporting ? 'Exporting...' : 'Export All Data'}
                    </button>
                </div>

                {/* Import from CSV Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Import from CSV</h3>
                    <p className="text-sm text-slate-400 mb-3">Import data from CSV files. Filename must match a collection name (e.g., `inventory.csv`).</p>
                    <label htmlFor="csv-import-file" className={`px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <i className="fas fa-upload"></i> {isProcessing ? 'Processing...' : 'Select CSV File(s)'}
                    </label>
                    <input ref={csvImportInputRef} type="file" id="csv-import-file" accept=".csv" onChange={handleCsvImport} disabled={isProcessing} className="hidden" multiple />
                    {isProcessing && importStatus && (
                        <div className="w-full mt-3">
                            <p className="text-blue-300 text-sm mb-1">{importStatus} {importProgress}%</p>
                            <ProgressBar progress={importProgress} />
                        </div>
                    )}
                </div>

                {/* Import from JSON Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Import from JSON</h3>
                    <p className="text-sm text-slate-400 mb-3">Import data from a single JSON backup file. This will overwrite or create records across multiple collections.</p>
                    <label htmlFor="json-import-file" className={`px-6 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <i className="fas fa-file-code"></i> {isProcessing ? 'Processing...' : 'Select JSON File'}
                    </label>
                    <input ref={jsonImportInputRef} type="file" id="json-import-file" accept=".json" onChange={handleJsonImport} disabled={isProcessing} className="hidden" />
                    {isProcessing && importStatus && (
                        <div className="w-full mt-3">
                            <p className="text-purple-300 text-sm mb-1">{importStatus} {importProgress}%</p>
                            <ProgressBar progress={importProgress} />
                        </div>
                    )}
                </div>

                {/* Sales Data Upload Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Sales Data Upload</h3>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-4">
                            <input ref={salesInputRef} id="sales-upload-input" type="file" accept=".csv" onChange={(e) => setSalesFile(e.target.files[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                            <button onClick={handleSalesDataUpload} disabled={isUploadingSales || !salesFile} className="px-6 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 w-32 flex-shrink-0">
                                {isUploadingSales ? <LoadingSpinner /> : 'Upload Sales'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stock History Upload Section */}
                <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Manual Stock History Upload</h3>
                    <div className="bg-slate-700 p-4 rounded-lg opacity-50">
                        <div className="flex border-b border-slate-600 mb-4">
                            <button onClick={() => setHistoryUploadTab('vaults')} className={`py-2 px-4 font-medium text-sm w-1/2 ${historyUploadTab === 'vaults' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400'}`}>Vaults History</button>
                            <button onClick={() => setHistoryUploadTab('components')} className={`py-2 px-4 font-medium text-sm w-1/2 ${historyUploadTab === 'components' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400'}`}>Components History</button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <input ref={historyInputRef} id="history-upload-input" type="file" accept=".csv" onChange={(e) => setHistoryFile(e.target.files[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                            <button onClick={handleHistoryUpload} disabled={isUploadingHistory || !historyFile} className="px-6 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 w-32 flex-shrink-0">
                                {isUploadingHistory ? <LoadingSpinner /> : 'Upload History'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Note: This section is not yet dynamic. History upload must be implemented separately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementView;