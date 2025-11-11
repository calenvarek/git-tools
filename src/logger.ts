/**
 * Minimal logging interface that git-tools requires.
 * Allows consumers to provide their own logger implementation (e.g., Winston, console, etc.)
 */
export interface Logger {
    error(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    info(message: string, ...meta: any[]): void;
    verbose(message: string, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}

/**
 * Default console-based logger implementation
 */
export class ConsoleLogger implements Logger {
    constructor(private level: string = 'info') {}

    private shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'verbose', 'debug'];
        const currentLevelIndex = levels.indexOf(this.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }

    error(message: string, ...meta: any[]): void {
        if (this.shouldLog('error')) {
            // eslint-disable-next-line no-console
            console.error(message, ...meta);
        }
    }

    warn(message: string, ...meta: any[]): void {
        if (this.shouldLog('warn')) {
            // eslint-disable-next-line no-console
            console.warn(message, ...meta);
        }
    }

    info(message: string, ...meta: any[]): void {
        if (this.shouldLog('info')) {
            // eslint-disable-next-line no-console
            console.info(message, ...meta);
        }
    }

    verbose(message: string, ...meta: any[]): void {
        if (this.shouldLog('verbose')) {
            // eslint-disable-next-line no-console
            console.log('[VERBOSE]', message, ...meta);
        }
    }

    debug(message: string, ...meta: any[]): void {
        if (this.shouldLog('debug')) {
            // eslint-disable-next-line no-console
            console.log('[DEBUG]', message, ...meta);
        }
    }
}

/**
 * Global logger instance - defaults to console logger
 * Use setLogger() to replace with your own implementation
 */
let globalLogger: Logger = new ConsoleLogger();

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
    globalLogger = logger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
    return globalLogger;
}

