// src/utils/config.ts

import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';

const configFilePath = path.resolve(__dirname, '../../config.json');

interface AppConfig {
    paths: {
        aidaRoot: string;
        pocketbasePath: string;
        userDataPath: string;
    };
    ports: {
        pocketbase: number;
        aida: number;
    };
    urls: {
        pocketbaseAdmin: string;
        aidaApp: string;
    };
}

function loadConfig(): AppConfig {
    const defaultConfig = {
        ports: {
            pocketbase: 8090,
            aida: 5174,
        },
    };

    const userConfig = fs.existsSync(configFilePath) ? fs.readJsonSync(configFilePath) : {};

    const mergedPorts = { ...defaultConfig.ports, ...userConfig.ports };

    return {
        ...userConfig,
        ports: mergedPorts,
        paths: {
            aidaRoot: path.join(__dirname, '..', '..', '..', '..', 'aida'),
            pocketbasePath: path.join(__dirname, '..', '..', '..', '..', 'aida', 'pocketbase.exe'),
            userDataPath: path.join(app.getPath('userData'), 'Cache'),
        },
        urls: {
            pocketbaseAdmin: `http://127.0.0.1:${mergedPorts.pocketbase}/_/`,
            aidaApp: `http://localhost:${mergedPorts.aida}`,
        },
    };
}

export function writeConfig(config: object): void {
    fs.writeJsonSync(configFilePath, config, { spaces: 2 });
}

export const CONFIG = loadConfig();