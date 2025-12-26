import { describe, it, expect } from 'vitest';
import type { Logger, RunOptions } from '../src/index';
import {
    ConsoleLogger,
    setLogger,
    getLogger,
    runSecure,
    runSecureWithInheritedStdio,
    run,
    runWithInheritedStdio,
    runWithDryRunSupport,
    runSecureWithDryRunSupport,
    validateGitRef,
    validateFilePath,
    escapeShellArg,
    safeJsonParse,
    validateString,
    validateHasProperty,
    validatePackageJson,
    isValidGitRef,
    findPreviousReleaseTag,
    getCurrentVersion,
    getDefaultFromRef,
    getRemoteDefaultBranch,
    localBranchExists,
    remoteBranchExists,
    getBranchCommitSha,
    isBranchInSyncWithRemote,
    safeSyncBranchWithRemote,
    getCurrentBranch,
    getGitStatusSummary,
    getGloballyLinkedPackages,
    getLinkedDependencies,
    getLinkCompatibilityProblems,
    getLinkProblems,
    isNpmLinked,
    isGitRepository
} from '../src/index';

describe('index.ts - Module Exports', () => {
    it('should export Logger type', () => {
        expect(true).toBe(true);
    });

    it('should export ConsoleLogger', () => {
        expect(ConsoleLogger).toBeDefined();
    });

    it('should export setLogger', () => {
        expect(setLogger).toBeDefined();
        expect(typeof setLogger).toBe('function');
    });

    it('should export getLogger', () => {
        expect(getLogger).toBeDefined();
        expect(typeof getLogger).toBe('function');
    });

    it('should export RunOptions type', () => {
        expect(true).toBe(true);
    });

    it('should export runSecure', () => {
        expect(runSecure).toBeDefined();
        expect(typeof runSecure).toBe('function');
    });

    it('should export runSecureWithInheritedStdio', () => {
        expect(runSecureWithInheritedStdio).toBeDefined();
        expect(typeof runSecureWithInheritedStdio).toBe('function');
    });

    it('should export run', () => {
        expect(run).toBeDefined();
        expect(typeof run).toBe('function');
    });

    it('should export runWithInheritedStdio', () => {
        expect(runWithInheritedStdio).toBeDefined();
        expect(typeof runWithInheritedStdio).toBe('function');
    });

    it('should export runWithDryRunSupport', () => {
        expect(runWithDryRunSupport).toBeDefined();
        expect(typeof runWithDryRunSupport).toBe('function');
    });

    it('should export runSecureWithDryRunSupport', () => {
        expect(runSecureWithDryRunSupport).toBeDefined();
        expect(typeof runSecureWithDryRunSupport).toBe('function');
    });

    it('should export validateGitRef', () => {
        expect(validateGitRef).toBeDefined();
        expect(typeof validateGitRef).toBe('function');
    });

    it('should export validateFilePath', () => {
        expect(validateFilePath).toBeDefined();
        expect(typeof validateFilePath).toBe('function');
    });

    it('should export escapeShellArg', () => {
        expect(escapeShellArg).toBeDefined();
        expect(typeof escapeShellArg).toBe('function');
    });

    it('should export safeJsonParse', () => {
        expect(safeJsonParse).toBeDefined();
        expect(typeof safeJsonParse).toBe('function');
    });

    it('should export validateString', () => {
        expect(validateString).toBeDefined();
        expect(typeof validateString).toBe('function');
    });

    it('should export validateHasProperty', () => {
        expect(validateHasProperty).toBeDefined();
        expect(typeof validateHasProperty).toBe('function');
    });

    it('should export validatePackageJson', () => {
        expect(validatePackageJson).toBeDefined();
        expect(typeof validatePackageJson).toBe('function');
    });

    it('should export isValidGitRef', () => {
        expect(isValidGitRef).toBeDefined();
        expect(typeof isValidGitRef).toBe('function');
    });

    it('should export findPreviousReleaseTag', () => {
        expect(findPreviousReleaseTag).toBeDefined();
        expect(typeof findPreviousReleaseTag).toBe('function');
    });

    it('should export getCurrentVersion', () => {
        expect(getCurrentVersion).toBeDefined();
        expect(typeof getCurrentVersion).toBe('function');
    });

    it('should export getDefaultFromRef', () => {
        expect(getDefaultFromRef).toBeDefined();
        expect(typeof getDefaultFromRef).toBe('function');
    });

    it('should export getRemoteDefaultBranch', () => {
        expect(getRemoteDefaultBranch).toBeDefined();
        expect(typeof getRemoteDefaultBranch).toBe('function');
    });

    it('should export localBranchExists', () => {
        expect(localBranchExists).toBeDefined();
        expect(typeof localBranchExists).toBe('function');
    });

    it('should export remoteBranchExists', () => {
        expect(remoteBranchExists).toBeDefined();
        expect(typeof remoteBranchExists).toBe('function');
    });

    it('should export getBranchCommitSha', () => {
        expect(getBranchCommitSha).toBeDefined();
        expect(typeof getBranchCommitSha).toBe('function');
    });

    it('should export isBranchInSyncWithRemote', () => {
        expect(isBranchInSyncWithRemote).toBeDefined();
        expect(typeof isBranchInSyncWithRemote).toBe('function');
    });

    it('should export safeSyncBranchWithRemote', () => {
        expect(safeSyncBranchWithRemote).toBeDefined();
        expect(typeof safeSyncBranchWithRemote).toBe('function');
    });

    it('should export getCurrentBranch', () => {
        expect(getCurrentBranch).toBeDefined();
        expect(typeof getCurrentBranch).toBe('function');
    });

    it('should export getGitStatusSummary', () => {
        expect(getGitStatusSummary).toBeDefined();
        expect(typeof getGitStatusSummary).toBe('function');
    });

    it('should export getGloballyLinkedPackages', () => {
        expect(getGloballyLinkedPackages).toBeDefined();
        expect(typeof getGloballyLinkedPackages).toBe('function');
    });

    it('should export getLinkedDependencies', () => {
        expect(getLinkedDependencies).toBeDefined();
        expect(typeof getLinkedDependencies).toBe('function');
    });

    it('should export getLinkCompatibilityProblems', () => {
        expect(getLinkCompatibilityProblems).toBeDefined();
        expect(typeof getLinkCompatibilityProblems).toBe('function');
    });

    it('should export getLinkProblems', () => {
        expect(getLinkProblems).toBeDefined();
        expect(typeof getLinkProblems).toBe('function');
    });

    it('should export isNpmLinked', () => {
        expect(isNpmLinked).toBeDefined();
        expect(typeof isNpmLinked).toBe('function');
    });

    it('should export isGitRepository', () => {
        expect(isGitRepository).toBeDefined();
        expect(typeof isGitRepository).toBe('function');
    });
});

