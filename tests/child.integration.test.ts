import { describe, it, expect } from 'vitest';
import { runSecure, runSecureWithInheritedStdio, validateGitRef, validateFilePath, escapeShellArg } from '../src/child';

/**
 * Integration tests that actually execute commands (not mocked)
 * These test the real implementation paths
 */
describe('child.ts - integration tests', () => {
    describe('runSecure', () => {
        it('should execute simple echo command', async () => {
            const { stdout } = await runSecure('echo', ['hello']);
            expect(stdout.trim()).toBe('hello');
        });

        it('should handle multiple arguments', async () => {
            const { stdout } = await runSecure('echo', ['hello', 'world']);
            expect(stdout.trim()).toContain('hello');
            expect(stdout.trim()).toContain('world');
        });

        it('should capture stderr', async () => {
            // Use a command that writes to stderr
            const { stderr } = await runSecure('node', ['-e', 'console.error("test error")']);
            expect(stderr.trim()).toBe('test error');
        });

        it('should throw error for non-existent command', async () => {
            await expect(runSecure('nonexistent-command-12345', [])).rejects.toThrow();
        });

        it('should throw error for command with non-zero exit code', async () => {
            await expect(runSecure('node', ['-e', 'process.exit(1)'])).rejects.toThrow();
        });

        it('should handle empty args array', async () => {
            const { stdout } = await runSecure('pwd', []);
            expect(stdout).toBeTruthy();
        });
    });

    describe('runSecureWithInheritedStdio', () => {
        it('should execute command successfully', async () => {
            await expect(runSecureWithInheritedStdio('echo', ['test'])).resolves.toBeUndefined();
        });

        it('should throw error for command with non-zero exit code', async () => {
            await expect(runSecureWithInheritedStdio('node', ['-e', 'process.exit(1)'])).rejects.toThrow();
        });

        it('should throw error for non-existent command', async () => {
            await expect(runSecureWithInheritedStdio('nonexistent-cmd-98765', [])).rejects.toThrow();
        });
    });

    describe('validateGitRef', () => {
        it('should return true for valid simple ref', () => {
            expect(validateGitRef('main')).toBe(true);
            expect(validateGitRef('feature-branch')).toBe(true);
            expect(validateGitRef('v1.2.3')).toBe(true);
        });

        it('should return true for refs with slashes', () => {
            expect(validateGitRef('refs/heads/main')).toBe(true);
            expect(validateGitRef('origin/main')).toBe(true);
            expect(validateGitRef('release/v1.2.x')).toBe(true);
        });

        it('should return true for refs with dots', () => {
            expect(validateGitRef('v1.2.3')).toBe(true);
            expect(validateGitRef('release/1.2.x')).toBe(true);
        });

        it('should return false for refs with double dots (directory traversal)', () => {
            expect(validateGitRef('../etc/passwd')).toBe(false);
            expect(validateGitRef('refs/../../../etc')).toBe(false);
        });

        it('should return false for refs starting with dash (flag injection)', () => {
            expect(validateGitRef('-rf')).toBe(false);
            expect(validateGitRef('--delete')).toBe(false);
        });

        it('should return false for refs with shell metacharacters', () => {
            expect(validateGitRef('main; rm -rf /')).toBe(false);
            expect(validateGitRef('main|cat /etc/passwd')).toBe(false);
            expect(validateGitRef('main&whoami')).toBe(false);
            expect(validateGitRef('main`whoami`')).toBe(false);
            expect(validateGitRef('main$(whoami)')).toBe(false);
        });

        it('should return false for refs with spaces', () => {
            expect(validateGitRef('main branch')).toBe(false);
            expect(validateGitRef('feature test')).toBe(false);
        });

        it('should return false for refs with brackets', () => {
            expect(validateGitRef('main[test]')).toBe(false);
            expect(validateGitRef('branch{test}')).toBe(false);
        });

        it('should return true for valid refs with underscores', () => {
            expect(validateGitRef('feature_branch')).toBe(true);
            expect(validateGitRef('test_123')).toBe(true);
        });

        it('should return true for valid refs with numbers', () => {
            expect(validateGitRef('v1234567890')).toBe(true);
            expect(validateGitRef('release123')).toBe(true);
        });
    });

    describe('validateFilePath', () => {
        it('should return true for valid file paths', () => {
            expect(validateFilePath('/path/to/file.txt')).toBe(true);
            expect(validateFilePath('./relative/path.js')).toBe(true);
            expect(validateFilePath('../parent/file.md')).toBe(true);
        });

        it('should return false for paths with shell metacharacters', () => {
            expect(validateFilePath('/path;rm -rf /')).toBe(false);
            expect(validateFilePath('/path|cat /etc/passwd')).toBe(false);
            expect(validateFilePath('/path&whoami')).toBe(false);
            expect(validateFilePath('/path`whoami`')).toBe(false);
            expect(validateFilePath('/path$(whoami)')).toBe(false);
        });

        it('should return false for paths with brackets', () => {
            expect(validateFilePath('/path[test]')).toBe(false);
            expect(validateFilePath('/path{test}')).toBe(false);
        });

        it('should return true for paths with spaces and dots', () => {
            expect(validateFilePath('/path with spaces/file.txt')).toBe(true);
            expect(validateFilePath('/path/to/../file.txt')).toBe(true);
            expect(validateFilePath('./file.txt')).toBe(true);
        });
    });

    describe('escapeShellArg', () => {
        it('should escape single quotes on Unix', () => {
            if (process.platform !== 'win32') {
                const result = escapeShellArg("test'string");
                expect(result).toContain("'\\''");
            }
        });

        it('should escape double quotes on Windows', () => {
            if (process.platform === 'win32') {
                const result = escapeShellArg('test"string');
                expect(result).toContain('\\"');
            }
        });

        it('should handle normal strings without special chars', () => {
            const result = escapeShellArg('normal-string-123');
            expect(result).toBeTruthy();
        });

        it('should handle empty string', () => {
            const result = escapeShellArg('');
            expect(result).toBeTruthy();
        });

        it('should handle strings with spaces', () => {
            const result = escapeShellArg('string with spaces');
            expect(result).toBeTruthy();
        });
    });
});

