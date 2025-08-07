"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchBrowser = exports.BrowserLauncher = void 0;
const electron_1 = require("electron");
class BrowserLauncher {
    constructor() {
        this.mainWindow = null;
    }
    async launch(url) {
        if (this.mainWindow) {
            this.mainWindow.loadURL(url);
            return;
        }
        this.mainWindow = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            show: false // Don't show until content is loaded
        });
        try {
            await this.mainWindow.loadURL(url);
            this.mainWindow.show(); // Show window after content loads
            // Open DevTools in development
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow.webContents.openDevTools();
            }
            this.mainWindow.on('closed', () => {
                this.mainWindow = null;
            });
        }
        catch (error) {
            console.error('Failed to load URL:', error);
            throw error;
        }
    }
    close() {
        if (this.mainWindow) {
            this.mainWindow.close();
            this.mainWindow = null;
        }
    }
}
exports.BrowserLauncher = BrowserLauncher;
// Export the launchBrowser function that main.ts is trying to import
const launchBrowser = async (url) => {
    const launcher = new BrowserLauncher();
    await launcher.launch(url);
};
exports.launchBrowser = launchBrowser;
