import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleLogger, setLogger, getLogger, Logger } from '../src/logger';

describe('Logger utilities', () => {
    describe('ConsoleLogger', () => {
        let consoleSpy: {
            error: ReturnType<typeof vi.spyOn>;
            warn: ReturnType<typeof vi.spyOn>;
            info: ReturnType<typeof vi.spyOn>;
            log: ReturnType<typeof vi.spyOn>;
        };

        beforeEach(() => {
            // Spy on console methods
            consoleSpy = {
                error: vi.spyOn(console, 'error').mockImplementation(() => {}),
                warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
                info: vi.spyOn(console, 'info').mockImplementation(() => {}),
                log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            };
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should log error messages at error level', () => {
            const logger = new ConsoleLogger('error');
            logger.error('Test error message');

            expect(consoleSpy.error).toHaveBeenCalledWith('Test error message');
        });

        it('should log warn messages at warn level', () => {
            const logger = new ConsoleLogger('warn');
            logger.warn('Test warning');

            expect(consoleSpy.warn).toHaveBeenCalledWith('Test warning');
        });

        it('should log info messages at info level', () => {
            const logger = new ConsoleLogger('info');
            logger.info('Test info');

            expect(consoleSpy.info).toHaveBeenCalledWith('Test info');
        });

        it('should log verbose messages at verbose level', () => {
            const logger = new ConsoleLogger('verbose');
            logger.verbose('Test verbose');

            expect(consoleSpy.log).toHaveBeenCalledWith('[VERBOSE]', 'Test verbose');
        });

        it('should log debug messages at debug level', () => {
            const logger = new ConsoleLogger('debug');
            logger.debug('Test debug');

            expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG]', 'Test debug');
        });

        it('should not log messages below current log level', () => {
            const logger = new ConsoleLogger('error');

            logger.warn('Should not log');
            logger.info('Should not log');
            logger.verbose('Should not log');
            logger.debug('Should not log');

            expect(consoleSpy.warn).not.toHaveBeenCalled();
            expect(consoleSpy.info).not.toHaveBeenCalled();
            expect(consoleSpy.log).not.toHaveBeenCalled();
        });

        it('should log all levels when set to debug', () => {
            const logger = new ConsoleLogger('debug');

            logger.error('error msg');
            logger.warn('warn msg');
            logger.info('info msg');
            logger.verbose('verbose msg');
            logger.debug('debug msg');

            expect(consoleSpy.error).toHaveBeenCalledWith('error msg');
            expect(consoleSpy.warn).toHaveBeenCalledWith('warn msg');
            expect(consoleSpy.info).toHaveBeenCalledWith('info msg');
            expect(consoleSpy.log).toHaveBeenCalledWith('[VERBOSE]', 'verbose msg');
            expect(consoleSpy.log).toHaveBeenCalledWith('[DEBUG]', 'debug msg');
        });

        it('should pass metadata to console methods', () => {
            const logger = new ConsoleLogger('info');
            const metadata = { userId: 123, action: 'login' };

            logger.info('User action', metadata);

            expect(consoleSpy.info).toHaveBeenCalledWith('User action', metadata);
        });

        it('should handle multiple metadata arguments', () => {
            const logger = new ConsoleLogger('error');

            logger.error('Error occurred', 'context1', { detail: 'value' }, 42);

            expect(consoleSpy.error).toHaveBeenCalledWith('Error occurred', 'context1', { detail: 'value' }, 42);
        });

        it('should default to info level when not specified', () => {
            const logger = new ConsoleLogger();

            logger.info('Should log');
            logger.verbose('Should not log');

            expect(consoleSpy.info).toHaveBeenCalledWith('Should log');
            expect(consoleSpy.log).not.toHaveBeenCalled();
        });

        it('should respect warn level threshold', () => {
            const logger = new ConsoleLogger('warn');

            logger.error('error - should log');
            logger.warn('warn - should log');
            logger.info('info - should not log');
            logger.verbose('verbose - should not log');
            logger.debug('debug - should not log');

            expect(consoleSpy.error).toHaveBeenCalledWith('error - should log');
            expect(consoleSpy.warn).toHaveBeenCalledWith('warn - should log');
            expect(consoleSpy.info).not.toHaveBeenCalled();
            expect(consoleSpy.log).not.toHaveBeenCalled();
        });
    });

    describe('setLogger and getLogger', () => {
        let originalLogger: Logger;

        beforeEach(() => {
            originalLogger = getLogger();
        });

        afterEach(() => {
            setLogger(originalLogger);
        });

        it('should set and get custom logger', () => {
            const customLogger: Logger = {
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn(),
                verbose: vi.fn(),
                debug: vi.fn(),
            };

            setLogger(customLogger);
            const retrievedLogger = getLogger();

            expect(retrievedLogger).toBe(customLogger);
        });

        it('should use custom logger for logging', () => {
            const customLogger: Logger = {
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn(),
                verbose: vi.fn(),
                debug: vi.fn(),
            };

            setLogger(customLogger);
            const logger = getLogger();

            logger.error('Test error');
            logger.info('Test info');

            expect(customLogger.error).toHaveBeenCalledWith('Test error');
            expect(customLogger.info).toHaveBeenCalledWith('Test info');
        });

        it('should default to ConsoleLogger', () => {
            const logger = getLogger();
            expect(logger).toBeDefined();
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.info).toBe('function');
        });

        it('should allow replacing logger multiple times', () => {
            const logger1: Logger = {
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn(),
                verbose: vi.fn(),
                debug: vi.fn(),
            };

            const logger2: Logger = {
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn(),
                verbose: vi.fn(),
                debug: vi.fn(),
            };

            setLogger(logger1);
            expect(getLogger()).toBe(logger1);

            setLogger(logger2);
            expect(getLogger()).toBe(logger2);
        });
    });
});

