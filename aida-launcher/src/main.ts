// filepath: aida-launcher/src/main.ts
import { app, ipcMain, BrowserWindow } from 'electron';
import { PocketBaseService } from './services/pocketbase-service';
import { launchBrowser } from './services/browser-launcher';
import { getErrorMessage } from './utils/error-handler';
import { AidaService } from './services/aida-service';
import { SetupManager } from './services/setup-manager';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Setup logging to a file
const logFile = path.join(os.tmpdir(), 'aida-launcher.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
    originalConsoleLog(...args);
    logStream.write(`[LOG] ${new Date().toISOString()} ${args.join(' ')}\n`);
};

console.error = (...args: any[]) => {
    originalConsoleError(...args);
    logStream.write(`[ERROR] ${new Date().toISOString()} ${args.join(' ')}\n`);
};


const pocketBaseService = new PocketBaseService();
const aidaService = new AidaService(path.join(process.resourcesPath, 'aida'));

// Centralized cleanup function to be called before the app quits.
const cleanup = async () => {
    console.log('Shutting down services...');
    try {
        await Promise.all([
            aidaService.stop(),
            pocketBaseService.stop()
        ]);
        console.log('All services stopped successfully.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

const launchAidaAndBrowser = async () => {
    console.log('AIDA setup is complete. Launching application...');
    const aidaPort = await aidaService.start();
    if (aidaPort) {
        console.log(`AIDA is running at http://localhost:${aidaPort}`);
        await launchBrowser(`http://localhost:${aidaPort}`);
    } else {
        console.error("AIDA service not running or port not available.");
    }
};

const createSetupWindow = () => {
    console.log('Performing first-time setup...');
    const setupWindow = new BrowserWindow({
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
app.on('before-quit', async (event) => {
    event.preventDefault(); // Prevent immediate exit
    await cleanup();
    app.exit(); // Exit after cleanup
});

app.whenReady().then(async () => {
    try {
        await cleanup(); // Ensure services are stopped before starting
        await pocketBaseService.start();
        const setupManager = await SetupManager.create();
        if (await setupManager.isSetupCompleted()) {
            await launchAidaAndBrowser();
        } else {
            createSetupWindow();
        }
    } catch (error) {
        console.error('Failed during startup:', getErrorMessage(error));
    }
});

// This is the standard main-window-closed handler.
app.on('window-all-closed', () => {
    // On macOS it's common for applications to stay active until the user quits explicitly with Cmd + Q.
    // On other platforms, we quit, which will trigger the 'before-quit' event.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('start-pocketbase', async () => {
    try {
        await pocketBaseService.start();
        console.log('PocketBase status: running');
    } catch (error) {
        console.error('PocketBase status: error', getErrorMessage(error));
    }
});

ipcMain.on('stop-pocketbase', async () => {
    await pocketBaseService.stop();
    console.log('PocketBase status: stopped');
});

ipcMain.on('start-aida', async () => {
    try {
        const aidaPort = await aidaService.start();
        console.log('AIDA status: running', aidaPort);
    } catch (error) {
        console.error('AIDA status: error', getErrorMessage(error));
    }
});

ipcMain.on('stop-aida', async () => {
    await aidaService.stop();
    console.log('AIDA status: stopped');
});

ipcMain.on('launch-aida', async () => {
    try {
        const aidaPort = aidaService.getPort();
        if (aidaPort) {
            await launchBrowser(`http://localhost:${aidaPort}`);
        } else {
            console.log("AIDA service not running or port not available.");
        }
    } catch (error) {
        console.error('Failed to launch browser:', error);
    }
});

ipcMain.on('submit-setup', async (event, { email, password, databases }) => {
    try {
        const setupManager = await SetupManager.create();
        await setupManager.performFirstTimeSetup(email, password, databases, (progress, percentage) => {
            event.sender.send('setup-progress', progress, percentage);
        });

        console.log('First-time setup complete.');
        await launchAidaAndBrowser();
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.close();

    } catch (error) {
        console.error('Setup error:', getErrorMessage(error));
    }
});
