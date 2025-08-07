"use strict";
// src/services/dependency-checker.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyChecker = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const error_handler_1 = require("../utils/error-handler");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DependencyChecker {
    constructor() {
        this.dependencies = {
            required: [
                { name: 'node', versionCommand: 'node --version', minVersion: '16.0.0' },
                { name: 'npm', versionCommand: 'npm --version', minVersion: '7.0.0' },
                { name: 'pocketbase', versionCommand: 'pocketbase --version', minVersion: '0.15.0' },
                { name: 'vite', versionCommand: 'vite --version', minVersion: '4.0.0' }
            ]
        };
    }
    async checkDependencies() {
        console.log('Checking dependencies...');
        for (const dep of this.dependencies.required) {
            try {
                const { stdout } = await execAsync(dep.versionCommand);
                const version = stdout.trim().replace(/^v/, '');
                if (!this.isVersionSatisfied(version, dep.minVersion)) {
                    throw new Error(`${dep.name} version ${version} is below minimum required version ${dep.minVersion}`);
                }
                console.log(`✓ ${dep.name} ${version}`);
            }
            catch (error) {
                throw new error_handler_1.LauncherError(`${dep.name} is not installed or not accessible: ${(0, error_handler_1.getErrorMessage)(error)}`);
            }
        }
        console.log('All dependencies are satisfied.');
    }
    isVersionSatisfied(current, minimum) {
        const currentParts = current.split('.').map(Number);
        const minimumParts = minimum.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if ((currentParts[i] || 0) > (minimumParts[i] || 0))
                return true;
            if ((currentParts[i] || 0) < (minimumParts[i] || 0))
                return false;
        }
        return true;
    }
}
exports.DependencyChecker = DependencyChecker;
