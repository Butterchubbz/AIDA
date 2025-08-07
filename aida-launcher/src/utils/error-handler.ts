export class LauncherError extends Error {
    constructor(
        message: string,
        public readonly code: string = 'UNKNOWN_ERROR'
    ) {
        super(message);
        this.name = 'LauncherError';
    }
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}