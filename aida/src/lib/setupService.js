export const collections = [
    {
        name: 'inventory',
        schema: [
            { name: 'sku', type: 'text', required: true, unique: true },
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'editor' },
            { name: 'quantity', type: 'number', required: true, options: { min: 0 } },
            { name: 'price', type: 'number', options: { min: 0 } },
            { name: 'category', type: 'text' },
        ],
        rules: {
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
        }
    },
    {
        name: 'inbound_shipments',
        schema: [
            { name: 'po_number', type: 'text' },
            { name: 'supplier', type: 'text' },
            { name: 'tracking_number', type: 'text' },
            { name: 'expected_date', type: 'date' },
            { name: 'received_date', type: 'date' },
            { name: 'status', type: 'select', required: true, options: { values: ['Pending', 'In Transit', 'Received', 'Cancelled'] } },
            { name: 'items', type: 'json', required: true }, // Example: [{ sku: 'abc', quantity: 10 }]
        ],
        rules: {
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
        }
    },
    {
        name: 'inventory_logs',
        schema: [
            { name: 'timestamp', type: 'date', required: true },
            { name: 'inventory_item', type: 'relation', required: true, options: { collectionId: 'inventory', cascadeDelete: false, maxSelect: 1 } },
            { name: 'type', type: 'select', required: true, options: { values: ['Inbound', 'Outbound', 'Adjustment'] } },
            { name: 'quantity_change', type: 'number', required: true },
            { name: 'reason', type: 'text' },
            { name: 'related_shipment', type: 'relation', options: { collectionId: 'inbound_shipments', cascadeDelete: false, maxSelect: 1 } },
        ],
        rules: {
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
        }
    }
];

export async function createCollections(pb) {
    for (const collection of collections) {
        try {
            await pb.collections.create({
                name: collection.name,
                type: 'base',
                schema: collection.schema,
                ...collection.rules
            });
        } catch (err) {
            // It might fail if the collection already exists, which is fine.
            console.warn(`Could not create collection '${collection.name}':`, err.message);
        }
    }
}

export async function finalizeSetup(pb) {
    try {
        // This setting is checked by the launcher and the app itself.
        await pb.collection('aida_settings').create({
            key: 'database_setup_complete',
            value: { completed: true, version: '1.0' }
        });
    } catch (err) {
        console.warn('Could not create database_setup_complete flag:', err.message);
    }
}
