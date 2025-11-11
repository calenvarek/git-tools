import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { run, runWithDryRunSupport, runWithInheritedStdio, runSecure, runSecureWithInheritedStdio, validateGitRef, validateFilePath } from '../src/child';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { getLogger } from '../src/logger';

// Mock the dependencies
vi.mock('child_process');
vi.mock('util');
vi.mock('../src/logger');

describe('child.ts - run function', () => {
    const mockExec = vi.mocked(exec);
    const mockPromisify = vi.mocked(promisify);
    const mockExecPromise = vi.fn();
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        verbose: vi.fn(),
    };
    const mockGetLogger = vi.mocked(getLogger);

    beforeEach(() => {
        vi.clearAllMocks();
        mockPromisify.mockReturnValue(mockExecPromise);
        mockGetLogger.mockReturnValue(mockLogger as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should execute command successfully and return stdout and stderr', async () => {
        const expectedResult = {
            stdout: 'Command executed successfully',
            stderr: ''
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('echo "hello world"');

        expect(mockPromisify).toHaveBeenCalledWith(mockExec);
        expect(mockExecPromise).toHaveBeenCalledWith('echo "hello world"', expect.objectContaining({
            encoding: 'utf8'
        }));
        expect(result).toEqual(expectedResult);
    });

    test('should log verbose messages during successful execution', async () => {
        const command = 'echo "test"';
        const options = { cwd: '/test/dir', env: { TEST: 'value' } };
        const expectedResult = { stdout: 'test output', stderr: 'warning message' };

        mockExecPromise.mockResolvedValue(expectedResult);

        await run(command, options);

        expect(mockLogger.verbose).toHaveBeenCalledWith(`Executing command: ${command}`);
        expect(mockLogger.verbose).toHaveBeenCalledWith('Working directory: /test/dir');
        expect(mockLogger.verbose).toHaveBeenCalledWith('Environment variables: 1 variables');
        expect(mockLogger.verbose).toHaveBeenCalledWith('Command completed successfully');
        expect(mockLogger.verbose).toHaveBeenCalledWith('stdout: test output');
        expect(mockLogger.verbose).toHaveBeenCalledWith('stderr: warning message');
    });

    test('should log default working directory when cwd is not specified', async () => {
        const expectedResult = { stdout: 'test', stderr: '' };
        mockExecPromise.mockResolvedValue(expectedResult);

        await run('test-command');

        expect(mockLogger.verbose).toHaveBeenCalledWith(`Working directory: ${process.cwd()}`);
    });

    test('should count environment variables correctly', async () => {
        const options = {
            env: {
                NODE_ENV: 'test',
                DEBUG: 'true',
                PATH: '/usr/bin'
            }
        };
        const expectedResult = { stdout: 'test', stderr: '' };
        mockExecPromise.mockResolvedValue(expectedResult);

        await run('env-test', options);

        expect(mockLogger.verbose).toHaveBeenCalledWith('Environment variables: 3 variables');
    });

    test('should use process.env count when env option not provided', async () => {
        const expectedResult = { stdout: 'test', stderr: '' };
        mockExecPromise.mockResolvedValue(expectedResult);

        await run('env-test');

        expect(mockLogger.verbose).toHaveBeenCalledWith(`Environment variables: ${Object.keys(process.env).length} variables`);
    });

    test('should not log stderr verbose message when stderr is empty', async () => {
        const expectedResult = { stdout: 'output', stderr: '' };
        mockExecPromise.mockResolvedValue(expectedResult);

        await run('test-command');

        expect(mockLogger.verbose).toHaveBeenCalledWith('stdout: output');
        // Should not call verbose for empty stderr
        expect(mockLogger.verbose).not.toHaveBeenCalledWith('stderr: ');
    });

    test('should execute command with custom options', async () => {
        const expectedResult = {
            stdout: 'Command output',
            stderr: ''
        };
        const options = {
            cwd: '/custom/directory',
            env: { NODE_ENV: 'test' },
            timeout: 5000
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('npm --version', options);

        expect(mockExecPromise).toHaveBeenCalledWith('npm --version', expect.objectContaining({
            ...options,
            encoding: 'utf8'
        }));
        expect(result).toEqual(expectedResult);
    });

    test('should handle commands that produce stderr output', async () => {
        const expectedResult = {
            stdout: '',
            stderr: 'Warning: deprecated feature used'
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('some-command-with-warnings');

        expect(result).toEqual(expectedResult);
        expect(result.stderr).toBe('Warning: deprecated feature used');
    });

    test('should handle commands that produce both stdout and stderr', async () => {
        const expectedResult = {
            stdout: 'Success message',
            stderr: 'Warning message'
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('command-with-mixed-output');

        expect(result).toEqual(expectedResult);
        expect(result.stdout).toBe('Success message');
        expect(result.stderr).toBe('Warning message');
    });

    test('should reject when command execution fails', async () => {
        const error = new Error('Command failed');
        mockExecPromise.mockRejectedValue(error);

        await expect(run('invalid-command')).rejects.toThrow('Command failed');
        expect(mockExecPromise).toHaveBeenCalledWith('invalid-command', expect.objectContaining({
            encoding: 'utf8'
        }));
    });

    test('should log detailed error information when command fails', async () => {
        const command = 'failing-command';
        const error = Object.assign(new Error('Command execution failed'), {
            code: 1,
            signal: null,
            stdout: 'partial output',
            stderr: 'error details'
        });

        mockExecPromise.mockRejectedValue(error);

        await expect(run(command)).rejects.toThrow('Command execution failed');

        expect(mockLogger.error).toHaveBeenCalledWith(`Command failed: ${command}`);
        expect(mockLogger.error).toHaveBeenCalledWith('Error: Command execution failed');
        expect(mockLogger.error).toHaveBeenCalledWith('Exit code: 1');
        expect(mockLogger.error).toHaveBeenCalledWith('Signal: null');
        expect(mockLogger.error).toHaveBeenCalledWith('stdout: partial output');
        expect(mockLogger.error).toHaveBeenCalledWith('stderr: error details');
    });

    test('should not log stdout/stderr in error when they are empty', async () => {
        const command = 'failing-command';
        const error = Object.assign(new Error('Command execution failed'), {
            code: 1,
            signal: null
            // No stdout/stderr properties
        });

        mockExecPromise.mockRejectedValue(error);

        await expect(run(command)).rejects.toThrow('Command execution failed');

        expect(mockLogger.error).toHaveBeenCalledWith(`Command failed: ${command}`);
        expect(mockLogger.error).toHaveBeenCalledWith('Error: Command execution failed');
        expect(mockLogger.error).toHaveBeenCalledWith('Exit code: 1');
        expect(mockLogger.error).toHaveBeenCalledWith('Signal: null');
        // Should not log stdout/stderr when they don't exist
        expect(mockLogger.error).not.toHaveBeenCalledWith('stdout: undefined');
        expect(mockLogger.error).not.toHaveBeenCalledWith('stderr: undefined');
    });

    test('should log only existing stdout/stderr in error scenarios', async () => {
        const command = 'partial-failure';
        const error = Object.assign(new Error('Partial failure'), {
            code: 1,
            signal: null,
            stdout: 'some output',
            // stderr property missing
        });

        mockExecPromise.mockRejectedValue(error);

        await expect(run(command)).rejects.toThrow('Partial failure');

        expect(mockLogger.error).toHaveBeenCalledWith('stdout: some output');
        expect(mockLogger.error).not.toHaveBeenCalledWith('stderr: undefined');
    });

    test('should handle error with undefined code and signal', async () => {
        const command = 'undefined-error';
        const error = Object.assign(new Error('Undefined error'), {
            // code and signal are undefined
        });

        mockExecPromise.mockRejectedValue(error);

        await expect(run(command)).rejects.toThrow('Undefined error');

        expect(mockLogger.error).toHaveBeenCalledWith('Exit code: undefined');
        expect(mockLogger.error).toHaveBeenCalledWith('Signal: undefined');
    });

    test('should handle command with exit code error', async () => {
        const error = Object.assign(new Error('Command failed with exit code 1'), {
            code: 1,
            killed: false,
            signal: null,
            cmd: 'failing-command'
        });

        mockExecPromise.mockRejectedValue(error);

        await expect(run('failing-command')).rejects.toMatchObject({
            message: 'Command failed with exit code 1',
            code: 1,
            killed: false,
            signal: null,
            cmd: 'failing-command'
        });
    });

    test('should handle timeout errors', async () => {
        const timeoutError = Object.assign(new Error('Command timed out'), {
            killed: true,
            signal: 'SIGTERM',
            code: null
        });

        mockExecPromise.mockRejectedValue(timeoutError);

        await expect(run('long-running-command', { timeout: 1000 })).rejects.toMatchObject({
            message: 'Command timed out',
            killed: true,
            signal: 'SIGTERM'
        });
    });

    test('should handle empty command string', async () => {
        const expectedResult = {
            stdout: '',
            stderr: ''
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('');

        expect(mockExecPromise).toHaveBeenCalledWith('', expect.objectContaining({
            encoding: 'utf8'
        }));
        expect(result).toEqual(expectedResult);
    });

    test('should handle commands with special characters', async () => {
        const command = 'echo "Hello & goodbye; echo $HOME | grep user"';
        const expectedResult = {
            stdout: 'Hello & goodbye; echo $HOME | grep user',
            stderr: ''
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run(command);

        expect(mockExecPromise).toHaveBeenCalledWith(command, expect.objectContaining({
            encoding: 'utf8'
        }));
        expect(result).toEqual(expectedResult);
    });

    test('should handle large output', async () => {
        const largeOutput = 'x'.repeat(10000);
        const expectedResult = {
            stdout: largeOutput,
            stderr: ''
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('command-with-large-output');

        expect(result.stdout).toBe(largeOutput);
        expect(result.stdout.length).toBe(10000);
    });

    test('should handle unicode characters in output', async () => {
        const unicodeOutput = '🚀 Deployment successful! 中文测试 émojis 🎉';
        const expectedResult = {
            stdout: unicodeOutput,
            stderr: ''
        };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await run('echo "unicode test"');

        expect(result.stdout).toBe(unicodeOutput);
    });

    test('should handle multiple consecutive calls', async () => {
        const results = [
            { stdout: 'First command', stderr: '' },
            { stdout: 'Second command', stderr: '' },
            { stdout: 'Third command', stderr: '' }
        ];

        mockExecPromise
            .mockResolvedValueOnce(results[0])
            .mockResolvedValueOnce(results[1])
            .mockResolvedValueOnce(results[2]);

        const [result1, result2, result3] = await Promise.all([
            run('command1'),
            run('command2'),
            run('command3')
        ]);

        expect(result1).toEqual(results[0]);
        expect(result2).toEqual(results[1]);
        expect(result3).toEqual(results[2]);
        expect(mockExecPromise).toHaveBeenCalledTimes(3);
    });

    test('should preserve options object immutability', async () => {
        const options = {
            cwd: '/test',
            env: { TEST: 'value' }
        };
        const originalOptions = { ...options };

        mockExecPromise.mockResolvedValue({ stdout: 'test', stderr: '' });

        await run('test-command', options);

        expect(options).toEqual(originalOptions);
        expect(mockExecPromise).toHaveBeenCalledWith('test-command', expect.objectContaining({
            ...options,
            encoding: 'utf8'
        }));
    });
});

describe('child.ts - runWithDryRunSupport function', () => {
    const mockExec = vi.mocked(exec);
    const mockPromisify = vi.mocked(promisify);
    const mockExecPromise = vi.fn();
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        verbose: vi.fn(),
    };
    const mockGetLogger = vi.mocked(getLogger);

    beforeEach(() => {
        vi.clearAllMocks();
        mockPromisify.mockReturnValue(mockExecPromise);
        mockGetLogger.mockReturnValue(mockLogger as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should log command and return empty result when isDryRun is true', async () => {
        const command = 'echo "test command"';
        const isDryRun = true;

        const result = await runWithDryRunSupport(command, isDryRun);

        expect(mockGetLogger).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(`DRY RUN: Would execute command: ${command}`);
        expect(result).toEqual({ stdout: '', stderr: '' });
        expect(mockExecPromise).not.toHaveBeenCalled();
    });

    test('should log command and return empty result when isDryRun is true with options', async () => {
        const command = 'npm install';
        const isDryRun = true;
        const options = { cwd: '/test/directory' };

        const result = await runWithDryRunSupport(command, isDryRun, options);

        expect(mockLogger.info).toHaveBeenCalledWith(`DRY RUN: Would execute command: ${command}`);
        expect(result).toEqual({ stdout: '', stderr: '' });
        expect(mockExecPromise).not.toHaveBeenCalled();
    });

    test('should execute command normally when isDryRun is false', async () => {
        const command = 'echo "real command"';
        const isDryRun = false;
        const expectedResult = { stdout: 'real command output', stderr: '' };

        mockExecPromise.mockResolvedValue(expectedResult);

        const result = await runWithDryRunSupport(command, isDryRun);

        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockExecPromise).toHaveBeenCalledWith(command, expect.objectContaining({
            encoding: 'utf8'
        }));
        expect(result).toEqual(expectedResult);
    });
});

describe('child.ts - runWithInheritedStdio function', () => {
    const mockSpawn = vi.mocked(spawn);
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        verbose: vi.fn(),
    };
    const mockGetLogger = vi.mocked(getLogger);

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetLogger.mockReturnValue(mockLogger as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should execute command successfully with inherited stdio', async () => {
        const mockChild = {
            on: vi.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10); // Simulate successful completion
                }
                return mockChild;
            })
        };

        mockSpawn.mockReturnValue(mockChild as any);

        const promise = runWithInheritedStdio('echo "hello world"');

        await expect(promise).resolves.toBeUndefined();
        expect(mockSpawn).toHaveBeenCalledWith('echo', ['"hello', 'world"'], {
            shell: false,
            stdio: 'inherit'
        });
        expect(mockLogger.verbose).toHaveBeenCalledWith('Executing command securely with inherited stdio: echo "hello world"');
        expect(mockLogger.verbose).toHaveBeenCalledWith('Command completed successfully with code 0');
    });

    test('should execute command with custom options', async () => {
        const options = {
            cwd: '/custom/directory',
            env: { NODE_ENV: 'test' }
        };

        const mockChild = {
            on: vi.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(0), 10);
                }
                return mockChild;
            })
        };

        mockSpawn.mockReturnValue(mockChild as any);

        await runWithInheritedStdio('npm test', options);

        expect(mockSpawn).toHaveBeenCalledWith('npm', ['test'], {
            ...options,
            shell: false,
            stdio: 'inherit'
        });
        expect(mockLogger.verbose).toHaveBeenCalledWith('Working directory: /custom/directory');
    });

    test('should handle command that fails with non-zero exit code', async () => {
        const mockChild = {
            on: vi.fn((event, callback) => {
                if (event === 'close') {
                    setTimeout(() => callback(1), 10); // Simulate failure
                }
                return mockChild;
            })
        };

        mockSpawn.mockReturnValue(mockChild as any);

        await expect(runWithInheritedStdio('failing-command')).rejects.toThrow('Command "failing-command" failed with exit code 1');
        expect(mockLogger.error).toHaveBeenCalledWith('Command failed with exit code 1');
    });

    test('should handle spawn error', async () => {
        const spawnError = new Error('spawn ENOENT');
        const mockChild = {
            on: vi.fn((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(spawnError), 10);
                }
                return mockChild;
            })
        };

        mockSpawn.mockReturnValue(mockChild as any);

        await expect(runWithInheritedStdio('invalid-command')).rejects.toThrow('spawn ENOENT');
        expect(mockLogger.error).toHaveBeenCalledWith('Command failed to start: spawn ENOENT');
    });
});

