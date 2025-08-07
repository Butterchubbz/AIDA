// src/services/dependency-checker.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { LauncherError, getErrorMessage } from '../utils/error-handler';

const execAsync = promisify(exec);

export class DependencyChecker {
    private dependencies = {
        required: [
            { name: 'node', versionCommand: 'node --version', minVersion: '16.0.0' },
            { name: 'npm', versionCommand: 'npm --version', minVersion: '7.0.0' },
            { name: 'pocketbase', versionCommand: 'pocketbase --version', minVersion: '0.15.0' },
            { name: 'vite', versionCommand: 'vite --version', minVersion: '4.0.0' }
        ]
    };

    async checkDependencies(): Promise<void> {
        console.log('Checking dependencies...');
        
        for (const dep of this.dependencies.required) {
            try {
                const { stdout } = await execAsync(dep.versionCommand);
                const version = stdout.trim().replace(/^v/, '');
                
                if (!this.isVersionSatisfied(version, dep.minVersion)) {
                    throw new Error(`${dep.name} version ${version} is below minimum required version ${dep.minVersion}`);
                }
                
                console.log(`✓ ${dep.name} ${version}`);
            } catch (error: unknown) {
                throw new LauncherError(
                    `${dep.name} is not installed or not accessible: ${getErrorMessage(error)}`
                );
            }
        }

        console.log('All dependencies are satisfied.');
    }

    private isVersionSatisfied(current: string, minimum: string): boolean {
        const currentParts = current.split('.').map(Number);
        const minimumParts = minimum.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if ((currentParts[i] || 0) > (minimumParts[i] || 0)) return true;
            if ((currentParts[i] || 0) < (minimumParts[i] || 0)) return false;
        }
        
        return true;
    }
}