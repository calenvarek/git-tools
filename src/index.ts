/**
 * @eldrforge/git-tools
 *
 * Git utilities for automation - secure process execution and Git operations
 *
 * @module git-tools
 */

// Export logger interface and functions
export type { Logger } from './logger';
export {
    ConsoleLogger,
    setLogger,
    getLogger
} from './logger';

// Export child process execution functions
export {
    runSecure,
    runSecureWithInheritedStdio,
    run,
    runWithInheritedStdio,
    runWithDryRunSupport,
    runSecureWithDryRunSupport,
    validateGitRef,
    validateFilePath,
    escapeShellArg
} from './child';

// Export validation utilities
export {
    safeJsonParse,
    validateString,
    validateHasProperty,
    validatePackageJson
} from './validation';

// Export git utilities
export {
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
    isNpmLinked
} from './git';

