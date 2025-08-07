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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PocketBaseService = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const axios_1 = __importDefault(require("axios"));
const tree_kill_1 = __importDefault(require("tree-kill"));
const error_handler_1 = require("../utils/error-handler");
const config_1 = require("../utils/config");
class PocketBaseService {
    constructor() {
        this.process = null;
        this.port = config_1.CONFIG.ports.pocketbase;
        // Correctly point to the bundled executable
        this.pocketBasePath = path.join(process.resourcesPath, 'aida', 'pocketbase.exe');
    }
    async start() {
        try {
            if (!fs.existsSync(this.pocketBasePath)) {
                throw new error_handler_1.LauncherError('PocketBase executable not found in application resources at ' + this.pocketBasePath, 'PB_NOT_FOUND');
            }
            console.log(`Starting PocketBase from ${this.pocketBasePath}`);
            this.process = (0, child_process_1.spawn)(this.pocketBasePath, ['serve', `--http=127.0.0.1:${this.port}`], {
                detached: false,
                stdio: 'pipe'
            });
            this.process.stdout?.on('data', (data) => {
                console.log('PocketBase:', data.toString().trim());
            });
            this.process.stderr?.on('data', (data) => {
                console.error('PocketBase Error:', data.toString().trim());
            });
            await this.waitForReady();
        }
        catch (error) {
            throw new error_handler_1.LauncherError(`PocketBase failed to start: ${(0, error_handler_1.getErrorMessage)(error)}`, 'START_FAILED');
        }
    }
    async waitForReady(retries = 30) {
        const adminUrl = `http://127.0.0.1:${this.port}/_/`;
        for (let i = 0; i < retries; i++) {
            try {
                await axios_1.default.get(adminUrl);
                console.log('PocketBase is ready');
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new error_handler_1.LauncherError('PocketBase failed to respond', 'TIMEOUT');
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.process || !this.process.pid) {
                this.process = null;
                return resolve();
            }
            (0, tree_kill_1.default)(this.process.pid, 'SIGKILL', (err) => {
                if (err) {
                    console.error('Failed to kill PocketBase process tree:', err);
                    reject(err);
                }
                else {
                    console.log('PocketBase process tree killed successfully.');
                    this.process = null;
                    resolve();
                }
            });
        });
    }
}
exports.PocketBaseService = PocketBaseService;
