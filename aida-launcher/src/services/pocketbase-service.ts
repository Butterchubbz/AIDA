import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import axios from 'axios';
import treeKill from 'tree-kill';
import { LauncherError, getErrorMessage } from '../utils/error-handler';
import { CONFIG } from '../utils/config';

export class PocketBaseService {
    private process: ChildProcess | null = null;
    private readonly port = CONFIG.ports.pocketbase;
    private readonly pocketBasePath: string;

    constructor() {
        // Correctly point to the bundled executable
        this.pocketBasePath = path.join(process.resourcesPath, 'aida', 'pocketbase.exe');
    }

    async start(): Promise<void> {
        try {
            if (!fs.existsSync(this.pocketBasePath)) {
                throw new LauncherError('PocketBase executable not found in application resources at ' + this.pocketBasePath, 'PB_NOT_FOUND');
            }

            console.log(`Starting PocketBase from ${this.pocketBasePath}`);
            this.process = spawn(this.pocketBasePath, ['serve', `--http=127.0.0.1:${this.port}`], {
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

        } catch (error: unknown) {
            throw new LauncherError(
                `PocketBase failed to start: ${getErrorMessage(error)}`,
                'START_FAILED'
            );
        }
    }

    private async waitForReady(retries = 30): Promise<void> {
        const adminUrl = `http://127.0.0.1:${this.port}/_/`;
        for (let i = 0; i < retries; i++) {
            try {
                await axios.get(adminUrl);
                console.log('PocketBase is ready');
                return;
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new LauncherError('PocketBase failed to respond', 'TIMEOUT');
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.process || !this.process.pid) {
                this.process = null;
                return resolve();
            }

            treeKill(this.process.pid, 'SIGKILL', (err) => {
                if (err) {
                    console.error('Failed to kill PocketBase process tree:', err);
                    reject(err);
                } else {
                    console.log('PocketBase process tree killed successfully.');
                    this.process = null;
                    resolve();
                }
            });
        });
    }
}

