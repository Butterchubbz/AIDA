import * as fs from 'fs-extra';
import * as path from 'path';
import { writeConfig, CONFIG } from '../utils/config';
import { LauncherError, getErrorMessage } from '../utils/error-handler';

const configFilePath = path.resolve(__dirname, '..', '..', 'config.json');

interface Databases {
    inventory: boolean;
    inbound: boolean;
    rma: boolean;
}

export class SetupManager {
    private pb: any;

    private constructor(pb: any) {
        this.pb = pb;
    }

    public static async create(): Promise<SetupManager> {
        const { default: PocketBase } = await import('pocketbase');
        const pocketbaseUrl = `http://127.0.0.1:${CONFIG.ports.pocketbase}`;
        const pb = new PocketBase(pocketbaseUrl);
        return new SetupManager(pb);
    }

    public async isSetupCompleted(): Promise<boolean> {
        try {
            await this.pb.collection('aida_settings').getFirstListItem('key = "setup_complete"');
            return true;
        } catch (error) {
            if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                return false;
            }
            return fs.existsSync(configFilePath);
        }
    }

    private async waitForPocketBase(retries = 15, delay = 1000): Promise<void> {
        for (let i = 0; i < retries; i++) {
            try {
                await this.pb.health.check();
                return;
            } catch (error) {
                if (i === retries - 1) {
                    throw new Error('PocketBase did not become responsive in time for setup.');
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    public async performFirstTimeSetup(
        adminEmail: string,
        adminPassword: string,
        databases: Databases,
        progressCallback: (message: string, percentage: number) => void
    ): Promise<void> {
        try {
            progressCallback('Waiting for backend to start...', 10);
            await this.waitForPocketBase();

            progressCallback('Creating admin account...', 20);
            const admins = await this.pb.collection('admins').getList(1, 1);
            if (admins.totalItems === 0) {
                await this.pb.collection('admins').create({
                    email: adminEmail,
                    password: adminPassword,
                    passwordConfirm: adminPassword,
                });
                progressCallback('Admin account created.', 30);
            } else {
                progressCallback('Admin account already exists.', 30);
            }

            await this.pb.admins.authWithPassword(adminEmail, adminPassword);

            progressCallback('Creating database collections...', 40);
            await this.createCollections(databases, progressCallback);

            progressCallback('Finalizing setup...', 90);
            await this.pb.collection('aida_settings').create({
                key: 'setup_complete',
                value: { completed: true, timestamp: new Date().toISOString() },
            });

            writeConfig({ ports: CONFIG.ports });
            progressCallback('Setup complete!', 100);
        } catch (error: unknown) {
            throw new LauncherError(`First-time setup failed: ${getErrorMessage(error)}`, 'SETUP_FAILED');
        }
    }

    private async createCollections(databases: Databases, progressCallback: (message: string, percentage: number) => void) {
        const collections = [
            {
                name: 'aida_settings',
                type: 'base',
                schema: [
                    { name: 'key', type: 'text', required: true, unique: true },
                    { name: 'value', type: 'json', required: true },
                ],
                listRule: '@request.auth.id = "" || @request.auth.id != ""',
                viewRule: '@request.auth.id = "" || @request.auth.id != ""',
                createRule: '@request.auth.collectionName = "admins"',
                updateRule: '@request.auth.collectionName = "admins"',
                deleteRule: '@request.auth.collectionName = "admins"',
            },
            {
                name: 'inventory',
                enabled: databases.inventory,
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'quantity', type: 'number', required: true },
                    { name: 'price', type: 'number', required: true },
                ]
            },
            {
                name: 'inbound_shipments',
                enabled: databases.inbound,
                schema: [
                    { name: 'tracking_number', type: 'text', required: true },
                    { name: 'carrier', type: 'text', required: true },
                    { name: 'status', type: 'text', required: true },
                ]
            },
            {
                name: 'rma_tracker',
                enabled: databases.rma,
                schema: [
                    { name: 'rma_number', type: 'text', required: true },
                    { name: 'customer_name', type: 'text', required: true },
                    { name: 'status', type: 'text', required: true },
                ]
            }
        ];

        for (const collection of collections) {
            if (collection.enabled === false) continue;

            try {
                await this.pb.collections.getOne(collection.name);
            } catch (error) {
                if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                    await this.pb.collections.create(collection);
                } else {
                    throw error;
                }
            }
        }
    }
}
