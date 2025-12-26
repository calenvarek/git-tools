import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as git from '../src/git';
import * as child from '../src/child';
import { spawn } from 'child_process';
import * as semver from 'semver';

// Mock dependencies
vi.mock('../src/child', () => ({
    run: vi.fn(),
    runSecure: vi.fn(),
    validateGitRef: vi.fn(),
    validateFilePath: vi.fn(),
    escapeShellArg: vi.fn(),
}));

vi.mock('../src/logger', () => ({
    getLogger: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    })),
}));

vi.mock('fs/promises');
vi.mock('child_process');
vi.mock('semver', () => ({
    parse: vi.fn(),
    validRange: vi.fn(),
    satisfies: vi.fn(),
    coerce: vi.fn(),
    lt: vi.fn(),
    gt: vi.fn(),
    rcompare: vi.fn(),
}));

const mockRun = child.run as any;
const mockRunSecure = child.runSecure as any;
const mockValidateGitRef = child.validateGitRef as any;
const mockSemver = vi.mocked(semver);

describe('Coverage Improvements - Additional Git Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockValidateGitRef.mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isGitRepository', () => {
        it('should return true when directory is a git repository', async () => {
            mockRun.mockResolvedValue({ stdout: 'true' });

            const result = await git.isGitRepository('/test/dir');

            expect(result).toBe(true);
            expect(mockRun).toHaveBeenCalledWith('git rev-parse --is-inside-work-tree', {
                cwd: '/test/dir',
                suppressErrorLogging: true
            });
        });

        it('should return false when directory is not a git repository', async () => {
            mockRun.mockRejectedValue(new Error('not a git repository'));

            const result = await git.isGitRepository('/test/dir');

            expect(result).toBe(false);
        });

        it('should use current directory when cwd not provided', async () => {
            mockRun.mockResolvedValue({ stdout: 'true' });

            await git.isGitRepository();

            expect(mockRun).toHaveBeenCalledWith(
                'git rev-parse --is-inside-work-tree',
                { cwd: undefined, suppressErrorLogging: true }
            );
        });
    });

    describe('safeSyncBranchWithRemote - Error Paths', () => {
        it('should handle invalid remote name starting with dash', async () => {
            const result = await git.safeSyncBranchWithRemote('main', '--bad-remote');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid remote name');
        });

        it('should handle diverged branches on pull', async () => {
            mockValidateGitRef.mockReturnValue(true);
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // localBranchExists
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockRejectedValueOnce(new Error('error: Your branch and \'origin/main\' have diverged')); // pull fails

            const result = await git.safeSyncBranchWithRemote('main');

            expect(result.success).toBe(false);
            expect(result.conflictResolutionRequired).toBe(true);
            expect(result.error).toContain('diverged');
        });

        it('should handle merge conflict errors', async () => {
            mockValidateGitRef.mockReturnValue(true);
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // localBranchExists
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockRejectedValueOnce(new Error('CONFLICT (content): Merge conflict in file.txt')); // pull fails

            const result = await git.safeSyncBranchWithRemote('main');

            expect(result.success).toBe(false);
            expect(result.conflictResolutionRequired).toBe(true);
            expect(result.error).toContain('requires manual conflict resolution');
        });

        it('should gracefully handle checkout errors after pull failure', async () => {
            mockValidateGitRef.mockReturnValue(true);
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // localBranchExists
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockResolvedValueOnce({ stdout: '' }) // status
                .mockResolvedValueOnce({}) // checkout to feature-branch
                .mockRejectedValueOnce(new Error('pull failed')) // pull fails
                .mockRejectedValueOnce(new Error('checkout back failed')); // checkout back fails

            const result = await git.safeSyncBranchWithRemote('feature-branch');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to sync branch');
        });
    });

    describe('getGitStatusSummary - Edge Cases', () => {
        it('should handle complex status with multiple change types', async () => {
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({ stdout: 'M  file1.txt\nA  file2.txt\nD  file3.txt\nR  file4.txt\n?? file5.txt' }) // mixed changes
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockResolvedValueOnce({ stdout: '5' }); // unpushed commits

            const result = await git.getGitStatusSummary();

            expect(result.hasUncommittedChanges).toBe(true);
            expect(result.hasUnstagedFiles).toBe(true);
            expect(result.hasUnpushedCommits).toBe(true);
            expect(result.status).toContain('unstaged');
            expect(result.status).toContain('uncommitted');
        });

        it('should handle rename status codes', async () => {
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({ stdout: 'R  file.txt' }) // Renamed
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockResolvedValueOnce({ stdout: '0' }); // unpushed commits

            const result = await git.getGitStatusSummary();

            expect(result.hasUncommittedChanges).toBe(true);
            expect(result.uncommittedCount).toBe(1); // R is in first position
        });

        it('should handle copy status codes', async () => {
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({ stdout: 'C  file.txt' }) // Copied
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockResolvedValueOnce({ stdout: '0' }); // unpushed commits

            const result = await git.getGitStatusSummary();

            expect(result.hasUncommittedChanges).toBe(true);
        });

        it('should handle mixed staged and unstaged on same file', async () => {
            mockRunSecure
                .mockResolvedValueOnce({ stdout: 'main' }) // current branch
                .mockResolvedValueOnce({ stdout: 'MM file.txt' }) // Modified staged AND unstaged
                .mockResolvedValueOnce({}) // fetch
                .mockResolvedValueOnce({ stdout: 'abc123' }) // remoteBranchExists
                .mockResolvedValueOnce({ stdout: '0' }); // unpushed commits

            const result = await git.getGitStatusSummary();

            expect(result.hasUncommittedChanges).toBe(true);
            expect(result.hasUnstagedFiles).toBe(true);
        });
    });

    describe('findPreviousReleaseTag - Edge Cases with Version Extraction', () => {
        it('should handle tags with various version formats', async () => {
            mockRunSecure.mockResolvedValue({
                stdout: 'release/v2.0.0\nv1.9.5\nv1.8.0'
            });

            mockSemver.parse.mockImplementation((version: string | any) => {
                if (!version || typeof version !== 'string') return null;
                const clean = version.startsWith('v') ? version.substring(1) : version;
                const versions: any = {
                    '2.0.0': { major: 2, minor: 0, patch: 0, version: '2.0.0' },
                    '1.9.5': { major: 1, minor: 9, patch: 5, version: '1.9.5' },
                    '1.8.0': { major: 1, minor: 8, patch: 0, version: '1.8.0' }
                };
                return versions[clean] || null;
            });

            mockSemver.lt.mockImplementation((a: any, b: any) => {
                if (a.major !== b.major) return a.major < b.major;
                if (a.minor !== b.minor) return a.minor < b.minor;
                return a.patch < b.patch;
            });

            mockSemver.gt.mockImplementation((a: any, b: any) => {
                if (a.major !== b.major) return a.major > b.major;
                if (a.minor !== b.minor) return a.minor > b.minor;
                return a.patch > b.patch;
            });

            const result = await git.findPreviousReleaseTag('2.0.0');

            expect(result).toBeTruthy();
            // Should find v1.9.5 as the highest version less than 2.0.0
            expect(result).toBe('v1.9.5');
        });

        it('should handle tags with no version pattern match', async () => {
            mockRunSecure.mockResolvedValue({
                stdout: 'release\nv1.0.0'
            });

            mockSemver.parse.mockImplementation((version: string | any) => {
                if (!version || typeof version !== 'string') return null;
                const versions: any = {
                    '1.0.0': { major: 1, minor: 0, patch: 0, version: '1.0.0' }
                };
                return versions[version] || null;
            });

            mockSemver.lt.mockReturnValue(true);

            const result = await git.findPreviousReleaseTag('1.0.0');

            // Should handle the "release" tag that doesn't match version pattern
            expect(result).toBeTruthy();
        });
    });

    describe('getDefaultFromRef - Branch Priority Testing', () => {
        it('should try main branch before master', async () => {
            mockRunSecure
                .mockRejectedValueOnce(new Error('No version')) // getCurrentVersion
                .mockRejectedValueOnce(new Error('Not found')) // main branch check - fails
                .mockResolvedValueOnce({ stdout: 'abc123' }); // master branch check - succeeds

            const result = await git.getDefaultFromRef();

            expect(result).toBe('master');
            expect(mockRunSecure).toHaveBeenCalledWith(
                'git',
                ['rev-parse', '--verify', 'main'],
                { stdio: 'ignore' }
            );
        });

        it('should use origin/main as fallback when no local branches exist', async () => {
            mockRunSecure
                .mockRejectedValueOnce(new Error('No version')) // getCurrentVersion
                .mockRejectedValueOnce(new Error('Not found')) // main
                .mockRejectedValueOnce(new Error('Not found')) // master
                .mockResolvedValueOnce({ stdout: 'abc123' }); // origin/main - succeeds

            const result = await git.getDefaultFromRef();

            expect(result).toBe('origin/main');
        });

        it('should use origin/master as last resort', async () => {
            mockRunSecure
                .mockRejectedValueOnce(new Error('No version')) // getCurrentVersion
                .mockRejectedValueOnce(new Error('Not found')) // main
                .mockRejectedValueOnce(new Error('Not found')) // master
                .mockRejectedValueOnce(new Error('Not found')) // origin/main
                .mockResolvedValueOnce({ stdout: 'abc123' }); // origin/master - succeeds

            const result = await git.getDefaultFromRef();

            expect(result).toBe('origin/master');
        });
    });
});

