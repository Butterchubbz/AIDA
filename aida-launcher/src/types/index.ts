// src/types/index.ts

export interface Dependency {
    name: string;
    version: string;
    isInstalled: boolean;
}

export interface SetupStatus {
    isCompleted: boolean;
    setupDate?: Date;
}

export interface ServiceStatus {
    name: string;
    isRunning: boolean;
    lastChecked: Date;
}