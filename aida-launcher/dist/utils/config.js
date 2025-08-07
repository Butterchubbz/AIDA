"use strict";
// src/utils/config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.writeConfig = writeConfig;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const configFilePath = path_1.default.resolve(__dirname, '../../config.json');
function loadConfig() {
    const defaultConfig = {
        ports: {
            pocketbase: 8090,
            aida: 5174,
        },
    };
    const userConfig = fs_extra_1.default.existsSync(configFilePath) ? fs_extra_1.default.readJsonSync(configFilePath) : {};
    const mergedPorts = { ...defaultConfig.ports, ...userConfig.ports };
    return {
        ...userConfig,
        ports: mergedPorts,
        paths: {
            aidaRoot: path_1.default.join(__dirname, '..', '..', '..', '..', 'aida'),
            pocketbasePath: path_1.default.join(__dirname, '..', '..', '..', '..', 'aida', 'pocketbase.exe'),
            userDataPath: path_1.default.join(electron_1.app.getPath('userData'), 'Cache'),
        },
        urls: {
            pocketbaseAdmin: `http://127.0.0.1:${mergedPorts.pocketbase}/_/`,
            aidaApp: `http://localhost:${mergedPorts.aida}`,
        },
    };
}
function writeConfig(config) {
    fs_extra_1.default.writeJsonSync(configFilePath, config, { spaces: 2 });
}
exports.CONFIG = loadConfig();
