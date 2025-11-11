# @eldrforge/git-tools

Git utilities for automation - secure process execution and comprehensive Git operations.

## Features

- **Secure Process Execution** - Shell injection prevention with validated arguments
- **Comprehensive Git Operations** - 20+ Git utilities for automation
- **Semantic Version Support** - Intelligent tag finding and version comparison
- **Branch Management** - Sync checking, safe syncing, and status queries
- **NPM Link Management** - Link detection, compatibility checking, and problem diagnosis
- **Flexible Logging** - Bring your own logger or use the built-in console logger

## Installation

```bash
npm install @eldrforge/git-tools
```

## Quick Start

```typescript
import { getCurrentBranch, getGitStatusSummary, findPreviousReleaseTag } from '@eldrforge/git-tools';

// Get current branch
const branch = await getCurrentBranch();
console.log(`Current branch: ${branch}`);

// Get comprehensive status
const status = await getGitStatusSummary();
console.log(`Status: ${status.status}`);

// Find previous release tag
const previousTag = await findPreviousReleaseTag('1.2.3', 'v*');
console.log(`Previous release: ${previousTag}`);
```

## Custom Logger

By default, git-tools uses a console-based logger. You can provide your own logger implementation (e.g., Winston):

```typescript
import { setLogger } from '@eldrforge/git-tools';
import winston from 'winston';

// Create Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

// Use Winston with git-tools
setLogger(logger);
```

## Core Modules

### Process Execution (child.ts)

Secure command execution with shell injection prevention:

```typescript
import { runSecure, runSecureWithDryRunSupport } from '@eldrforge/git-tools';

// Secure execution with argument array
const { stdout } = await runSecure('git', ['status', '--porcelain']);

// With dry-run support
const result = await runSecureWithDryRunSupport('git', ['commit', '-m', 'message'], isDryRun);
```

### Git Operations (git.ts)

Comprehensive Git utilities:

**Branch Operations:**
```typescript
import {
    getCurrentBranch,
    localBranchExists,
    remoteBranchExists,
    isBranchInSyncWithRemote,
    safeSyncBranchWithRemote
} from '@eldrforge/git-tools';

const branch = await getCurrentBranch();
const exists = await localBranchExists('main');
const syncStatus = await isBranchInSyncWithRemote('main');
```

**Tag & Version Operations:**
```typescript
import {
    findPreviousReleaseTag,
    getCurrentVersion,
    getDefaultFromRef
} from '@eldrforge/git-tools';

const currentVersion = await getCurrentVersion();
const previousTag = await findPreviousReleaseTag('1.2.3', 'v*');
const defaultRef = await getDefaultFromRef(false, 'working');
```

**Status Operations:**
```typescript
import { getGitStatusSummary } from '@eldrforge/git-tools';

const status = await getGitStatusSummary();
// {
//   branch: 'main',
//   hasUnstagedFiles: false,
//   hasUncommittedChanges: false,
//   hasUnpushedCommits: true,
//   unstagedCount: 0,
//   uncommittedCount: 0,
//   unpushedCount: 2,
//   status: '2 unpushed'
// }
```

**NPM Link Operations:**
```typescript
import {
    getGloballyLinkedPackages,
    getLinkedDependencies,
    getLinkCompatibilityProblems,
    isNpmLinked
} from '@eldrforge/git-tools';

const globalPackages = await getGloballyLinkedPackages();
const linkedDeps = await getLinkedDependencies('/path/to/package');
const problems = await getLinkCompatibilityProblems('/path/to/package');
const isLinked = await isNpmLinked('/path/to/package');
```

### Validation (validation.ts)

Runtime type validation utilities:

```typescript
import {
    safeJsonParse,
    validateString,
    validatePackageJson
} from '@eldrforge/git-tools';

const data = safeJsonParse(jsonString, 'context');
const validated = validateString(value, 'fieldName');
const packageJson = validatePackageJson(data, 'package.json');
```

## API Documentation

### Git Functions

| Function | Description |
|----------|-------------|
| `isValidGitRef(ref)` | Tests if a git reference exists and is valid |
| `findPreviousReleaseTag(version, pattern?)` | Finds the highest tag less than current version |
| `getCurrentVersion()` | Gets current version from package.json |
| `getDefaultFromRef(forceMain?, branch?)` | Gets reliable default for release comparison |
| `getRemoteDefaultBranch()` | Gets default branch name from remote |
| `localBranchExists(branch)` | Checks if local branch exists |
| `remoteBranchExists(branch, remote?)` | Checks if remote branch exists |
| `getBranchCommitSha(ref)` | Gets commit SHA for a branch |
| `isBranchInSyncWithRemote(branch, remote?)` | Checks if local/remote branches match |
| `safeSyncBranchWithRemote(branch, remote?)` | Safely syncs branch with remote |
| `getCurrentBranch()` | Gets current branch name |
| `getGitStatusSummary(workingDir?)` | Gets comprehensive git status |
| `getGloballyLinkedPackages()` | Gets globally linked npm packages |
| `getLinkedDependencies(packageDir)` | Gets linked dependencies for package |
| `getLinkCompatibilityProblems(packageDir)` | Finds version compatibility issues |
| `isNpmLinked(packageDir)` | Checks if package is globally linked |
| `getBranchNameForVersion(version)` | Gets branch name for a version |

### Process Execution Functions

| Function | Description |
|----------|-------------|
| `runSecure(cmd, args, opts?)` | Securely executes command with argument array |
| `runSecureWithInheritedStdio(cmd, args, opts?)` | Secure execution with inherited stdio |
| `run(command, opts?)` | Executes command string (less secure) |
| `runWithDryRunSupport(cmd, dryRun, opts?)` | Run with dry-run support |
| `runSecureWithDryRunSupport(cmd, args, dryRun, opts?)` | Secure run with dry-run support |
| `validateGitRef(ref)` | Validates git reference for injection |
| `validateFilePath(path)` | Validates file path for injection |
| `escapeShellArg(arg)` | Escapes shell arguments |

### Validation Functions

| Function | Description |
|----------|-------------|
| `safeJsonParse<T>(json, context?)` | Safely parses JSON with error handling |
| `validateString(value, fieldName)` | Validates non-empty string |
| `validateHasProperty(obj, property, context?)` | Validates object has property |
| `validatePackageJson(data, context?, requireName?)` | Validates package.json structure |

## Security

This library prioritizes security in command execution:

- **Shell Injection Prevention**: All `runSecure*` functions use argument arrays without shell execution
- **Input Validation**: Git references and file paths are validated before use
- **No Shell Metacharacters**: Commands are executed directly without shell interpretation
- **Escaped Arguments**: Shell argument escaping utilities provided

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Lint
npm run lint

# Watch mode
npm run watch
```

## License

Apache-2.0 - see [LICENSE](LICENSE) file for details.

## Author

Calen Varek <calenvarek@gmail.com>

## Related Projects

This library was extracted from [kodrdriv](https://github.com/calenvarek/kodrdriv), an AI-powered Git workflow automation tool.

