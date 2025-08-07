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
exports.LoadingWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class LoadingWindow {
    constructor() {
        this.window = null;
        // Set up proper cache directory
        this.userDataPath = path.join(electron_1.app.getPath('userData'), 'Cache');
        this.ensureCacheDirectory();
        this.window = new electron_1.BrowserWindow({
            width: 400,
            height: 300,
            frame: false,
            transparent: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                // Set proper cache path
                partition: `persist:${this.userDataPath}`,
                additionalArguments: [`--disk-cache-dir=${this.userDataPath}`]
            }
        });
        const loadingHtmlPath = path.join(__dirname, '..', '..', 'static', 'loading.html');
        this.window.loadFile(loadingHtmlPath).catch(err => {
            console.error('Failed to load loading window:', err);
        });
        this.window.center();
    }
    ensureCacheDirectory() {
        try {
            fs.ensureDirSync(this.userDataPath);
            fs.chmodSync(this.userDataPath, '766');
        }
        catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }
    updateStatus(message, isError = false) {
        if (this.window) {
            this.window.webContents.send('update-status', { message, isError });
        }
    }
    showError(message) {
        this.updateStatus(message, true);
    }
    close() {
        if (this.window) {
            this.window.close();
            this.window = null;
        }
    }
}
exports.LoadingWindow = LoadingWindow;
