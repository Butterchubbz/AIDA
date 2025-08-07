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
// filepath: aida-launcher/src/main.ts
const electron_1 = require("electron");
const pocketbase_service_1 = require("./services/pocketbase-service");
const browser_launcher_1 = require("./services/browser-launcher");
const error_handler_1 = require("./utils/error-handler");
const aida_service_1 = require("./services/aida-service");
const setup_manager_1 = require("./services/setup-manager");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
// Setup logging to a file
const logFile = path.join(os.tmpdir(), 'aida-launcher.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = (...args) => {
    originalConsoleLog(...args);
    logStream.write(`[LOG] ${new Date().toISOString()} ${args.join(' ')}\n`);
};
console.error = (...args) => {
    originalConsoleError(...args);
    logStream.write(`[ERROR] ${new Date().toISOString()} ${args.join(' ')}\n`);
};
const pocketBaseService = new pocketbase_service_1.PocketBaseService();
const aidaService = new aida_service_1.AidaService(path.join(process.resourcesPath, 'aida'));
// Centralized cleanup function to be called before the app quits.
const cleanup = async () => {
    console.log('Shutting down services...');
    try {
        await Promise.all([
            aidaService.stop(),
            pocketBaseService.stop()
        ]);
        console.log('All services stopped successfully.');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
};
const launchAidaAndBrowser = async () => {
    console.log('AIDA setup is complete. Launching application...');
    const aidaPort = await aidaService.start();
    if (aidaPort) {
        console.log(`AIDA is running at http://localhost:${aidaPort}`);
        await (0, browser_launcher_1.launchBrowser)(`http://localhost:${aidaPort}`);
    }
    else {
        console.error("AIDA service not running or port not available.");
    }
};
const createSetupWindow = () => {
    console.log('Performing first-time setup...');
    const setupWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    setupWindow.loadFile(path.join(__dirname, '..', 'static', 'setup.html'));
    return setupWindow;
};
// This is the proper way to handle cleanup before the app quits.
electron_1.app.on('before-quit', async (event) => {
    event.preventDefault(); // Prevent immediate exit
    await cleanup();
    electron_1.app.exit(); // Exit after cleanup
});
electron_1.app.whenReady().then(async () => {
    try {
        await cleanup(); // Ensure services are stopped before starting
        await pocketBaseService.start();
        const setupManager = await setup_manager_1.SetupManager.create();
        if (await setupManager.isSetupCompleted()) {
            await launchAidaAndBrowser();
        }
        else {
            createSetupWindow();
        }
    }
    catch (error) {
        console.error('Failed during startup:', (0, error_handler_1.getErrorMessage)(error));
    }
});
// This is the standard main-window-closed handler.
electron_1.app.on('window-all-closed', () => {
    // On macOS it's common for applications to stay active until the user quits explicitly with Cmd + Q.
    // On other platforms, we quit, which will trigger the 'before-quit' event.
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.on('start-pocketbase', async () => {
    try {
        await pocketBaseService.start();
        console.log('PocketBase status: running');
    }
    catch (error) {
        console.error('PocketBase status: error', (0, error_handler_1.getErrorMessage)(error));
    }
});
electron_1.ipcMain.on('stop-pocketbase', async () => {
    await pocketBaseService.stop();
    console.log('PocketBase status: stopped');
});
electron_1.ipcMain.on('start-aida', async () => {
    try {
        const aidaPort = await aidaService.start();
        console.log('AIDA status: running', aidaPort);
    }
    catch (error) {
        console.error('AIDA status: error', (0, error_handler_1.getErrorMessage)(error));
    }
});
electron_1.ipcMain.on('stop-aida', async () => {
    await aidaService.stop();
    console.log('AIDA status: stopped');
});
electron_1.ipcMain.on('launch-aida', async () => {
    try {
        const aidaPort = aidaService.getPort();
        if (aidaPort) {
            await (0, browser_launcher_1.launchBrowser)(`http://localhost:${aidaPort}`);
        }
        else {
            console.log("AIDA service not running or port not available.");
        }
    }
    catch (error) {
        console.error('Failed to launch browser:', error);
    }
});
electron_1.ipcMain.on('submit-setup', async (event, { email, password, databases }) => {
    try {
        const setupManager = await setup_manager_1.SetupManager.create();
        await setupManager.performFirstTimeSetup(email, password, databases, (progress, percentage) => {
            event.sender.send('setup-progress', progress, percentage);
        });
        console.log('First-time setup complete.');
        await launchAidaAndBrowser();
        const window = electron_1.BrowserWindow.fromWebContents(event.sender);
        window?.close();
    }
    catch (error) {
        console.error('Setup error:', (0, error_handler_1.getErrorMessage)(error));
    }
});
