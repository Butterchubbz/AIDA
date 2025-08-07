import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';

export class LoadingWindow {
    private window: BrowserWindow | null = null;
    private readonly userDataPath: string;

    constructor() {
        // Set up proper cache directory
        this.userDataPath = path.join(app.getPath('userData'), 'Cache');
        this.ensureCacheDirectory();

        this.window = new BrowserWindow({
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

    private ensureCacheDirectory() {
        try {
            fs.ensureDirSync(this.userDataPath);
            fs.chmodSync(this.userDataPath, '766');
        } catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }

    updateStatus(message: string, isError = false) {
        if (this.window) {
            this.window.webContents.send('update-status', { message, isError });
        }
    }

    showError(message: string) {
        this.updateStatus(message, true);
    }

    close() {
        if (this.window) {
            this.window.close();
            this.window = null;
        }
    }
}