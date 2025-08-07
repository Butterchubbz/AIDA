"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const config_1 = require("../utils/config");
const error_handler_1 = require("../utils/error-handler");
const configFilePath = path.resolve(__dirname, '..', '..', 'config.json');
class SetupManager {
    constructor(pb) {
        this.pb = pb;
    }
    static async create() {
        const { default: PocketBase } = await import('pocketbase');
        const pocketbaseUrl = `http://127.0.0.1:${config_1.CONFIG.ports.pocketbase}`;
        const pb = new PocketBase(pocketbaseUrl);
        return new SetupManager(pb);
    }
    async isSetupCompleted() {
        try {
            await this.pb.collection('aida_settings').getFirstListItem('key = "setup_complete"');
            return true;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                return false;
            }
            return fs.existsSync(configFilePath);
        }
    }
    async waitForPocketBase(retries = 15, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.pb.health.check();
                return;
            }
            catch (error) {
                if (i === retries - 1) {
                    throw new Error('PocketBase did not become responsive in time for setup.');
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    async performFirstTimeSetup(adminEmail, adminPassword, databases, progressCallback) {
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
            }
            else {
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
            (0, config_1.writeConfig)({ ports: config_1.CONFIG.ports });
            progressCallback('Setup complete!', 100);
        }
        catch (error) {
            throw new error_handler_1.LauncherError(`First-time setup failed: ${(0, error_handler_1.getErrorMessage)(error)}`, 'SETUP_FAILED');
        }
    }
    async createCollections(databases, progressCallback) {
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
            if (collection.enabled === false)
                continue;
            try {
                await this.pb.collections.getOne(collection.name);
            }
            catch (error) {
                if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                    await this.pb.collections.create(collection);
                }
                else {
                    throw error;
                }
            }
        }
    }
}
exports.SetupManager = SetupManager;
