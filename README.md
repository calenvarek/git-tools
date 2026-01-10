# @eldrforge/git-tools

A comprehensive TypeScript library providing secure Git operations, process execution utilities, and NPM link management for automation workflows.

## Overview

`@eldrforge/git-tools` is a production-ready library designed for building Git automation tools. It provides secure command execution primitives and high-level Git operations with a focus on safety, reliability, and ease of use.

**Key Features:**

- 🔒 **Secure Process Execution** - Shell injection prevention with validated arguments
- 🌳 **Comprehensive Git Operations** - 20+ Git utilities for branch management, versioning, and status queries
- 🏷️ **Semantic Version Support** - Intelligent tag finding and version comparison for release automation
- 🔄 **Branch Management** - Sync checking, safe syncing, and detailed status queries
- 🔗 **NPM Link Management** - Link detection, compatibility checking, and problem diagnosis for monorepo workflows
- 📝 **Flexible Logging** - Bring your own logger (Winston, Pino, etc.) or use the built-in console logger
- ✅ **Runtime Validation** - Type-safe JSON parsing and validation utilities
- 🧪 **Well-Tested** - Comprehensive test coverage for reliability

## Installation

```bash
npm install @eldrforge/git-tools
```

### Requirements

- Node.js 14 or higher
- Git 2.0 or higher
- TypeScript 4.5+ (for TypeScript projects)

### Optional Dependencies

```bash
# If you want to use Winston for logging
npm install winston
```

## Quick Start

```typescript
import {
  getCurrentBranch,
  getGitStatusSummary,
  findPreviousReleaseTag,
  runSecure
} from '@eldrforge/git-tools';

// Get current branch
const branch = await getCurrentBranch();
console.log(`Current branch: ${branch}`);

// Get comprehensive status
const status = await getGitStatusSummary();
console.log(`Status: ${status.status}`);
console.log(`Unstaged files: ${status.unstagedCount}`);
console.log(`Uncommitted changes: ${status.uncommittedCount}`);
console.log(`Unpushed commits: ${status.unpushedCount}`);

// Find previous release tag
const previousTag = await findPreviousReleaseTag('1.2.3', 'v*');
console.log(`Previous release: ${previousTag}`);

// Execute Git commands securely
const { stdout } = await runSecure('git', ['log', '--oneline', '-n', '5']);
console.log('Recent commits:', stdout);
```

## Core Concepts

### 1. Secure Process Execution

All process execution functions prioritize security by preventing shell injection attacks:

```typescript
import { runSecure, run } from '@eldrforge/git-tools';

// ✅ SECURE: Uses argument array, no shell interpretation
const { stdout } = await runSecure('git', ['log', '--format=%s', userInput]);

// ⚠️ LESS SECURE: Uses shell command string
const result = await run(`git log --format=%s ${userInput}`);
```

**Best Practice**: Always use `runSecure` or `runSecureWithDryRunSupport` for user input.

### 2. Custom Logger Integration

By default, git-tools uses a console-based logger. You can integrate your own logger:

```typescript
import { setLogger } from '@eldrforge/git-tools';
import winston from 'winston';

// Create Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'git-tools.log' })
  ]
});

// Set global logger for git-tools
setLogger(logger);

// Now all git-tools operations will use your logger
const branch = await getCurrentBranch(); // Logs via Winston
```

### 3. Dry-Run Support

Many automation workflows need dry-run capability:

```typescript
import { runSecureWithDryRunSupport } from '@eldrforge/git-tools';

const isDryRun = process.env.DRY_RUN === 'true';

// This will only log what would happen if isDryRun is true
const result = await runSecureWithDryRunSupport(
  'git',
  ['push', 'origin', 'main'],
  isDryRun
);
```

## Usage Guide

### Branch Operations

#### Check Branch Status

```typescript
import {
  getCurrentBranch,
  localBranchExists,
  remoteBranchExists,
  isBranchInSyncWithRemote
} from '@eldrforge/git-tools';

// Get current branch
const currentBranch = await getCurrentBranch();
console.log(`On branch: ${currentBranch}`);

// Check if branches exist
const hasMain = await localBranchExists('main');
const hasRemoteMain = await remoteBranchExists('main', 'origin');

console.log(`Local main exists: ${hasMain}`);
console.log(`Remote main exists: ${hasRemoteMain}`);

// Check if local and remote are in sync
const syncStatus = await isBranchInSyncWithRemote('main');
console.log(`In sync: ${syncStatus.inSync}`);
console.log(`Local SHA: ${syncStatus.localSha}`);
console.log(`Remote SHA: ${syncStatus.remoteSha}`);
```

#### Safe Branch Synchronization

```typescript
import { safeSyncBranchWithRemote } from '@eldrforge/git-tools';

// Safely sync branch with remote (handles conflicts gracefully)
const result = await safeSyncBranchWithRemote('main', 'origin');

if (result.success) {
  console.log('Branch successfully synced with remote');
} else if (result.conflictResolutionRequired) {
  console.error('Conflict resolution required:', result.error);
  // Handle conflicts manually
} else {
  console.error('Sync failed:', result.error);
}
```

### Repository Status

#### Get Comprehensive Status

```typescript
import { getGitStatusSummary } from '@eldrforge/git-tools';

const status = await getGitStatusSummary();

console.log(`Branch: ${status.branch}`);
console.log(`Status: ${status.status}`); // e.g., "2 unstaged, 1 uncommitted, 3 unpushed"

// Individual status flags
if (status.hasUnstagedFiles) {
  console.log(`⚠️  ${status.unstagedCount} unstaged files`);
}

if (status.hasUncommittedChanges) {
  console.log(`📝 ${status.uncommittedCount} uncommitted changes`);
}

if (status.hasUnpushedCommits) {
  console.log(`⬆️  ${status.unpushedCount} unpushed commits`);
}

if (status.status === 'clean') {
  console.log('✅ Working directory clean');
}
```

#### Check if Directory is a Git Repository

```typescript
import { isGitRepository } from '@eldrforge/git-tools';

const isRepo = await isGitRepository('/path/to/directory');
if (isRepo) {
  console.log('This is a Git repository');
} else {
  console.log('Not a Git repository');
}
```

### Version and Tag Operations

#### Find Previous Release Tag

Useful for generating release notes or comparing versions:

```typescript
import { findPreviousReleaseTag, getCurrentVersion } from '@eldrforge/git-tools';

// Get current version from package.json
const currentVersion = await getCurrentVersion();
console.log(`Current version: ${currentVersion}`);

// Find previous release tag
// Looks for tags matching "v*" pattern that are < current version
const previousTag = await findPreviousReleaseTag(currentVersion, 'v*');

if (previousTag) {
  console.log(`Previous release: ${previousTag}`);
  // Now you can generate release notes from previousTag..HEAD
} else {
  console.log('No previous release found (possibly first release)');
}
```

#### Working with Tag Patterns

```typescript
import { findPreviousReleaseTag } from '@eldrforge/git-tools';

// Standard version tags (v1.0.0, v1.2.3)
const prevRelease = await findPreviousReleaseTag('1.2.3', 'v*');

// Working branch tags (working/v1.0.0)
const prevWorking = await findPreviousReleaseTag('1.2.3', 'working/v*');

// Custom prefix tags (release/v1.0.0)
const prevCustom = await findPreviousReleaseTag('1.2.3', 'release/v*');
```

#### Get Default Reference for Comparisons

```typescript
import { getDefaultFromRef } from '@eldrforge/git-tools';

// Intelligently determines the best reference for release comparisons
// Tries: previous tag -> main -> master -> origin/main -> origin/master
const fromRef = await getDefaultFromRef(false, 'working');
console.log(`Compare from: ${fromRef}`);

// Force main branch (skip tag detection)
const mainRef = await getDefaultFromRef(true);
console.log(`Compare from main: ${mainRef}`);
```

### NPM Link Management

Perfect for monorepo development and local package testing:

#### Check Link Status

```typescript
import {
  isNpmLinked,
  getGloballyLinkedPackages,
  getLinkedDependencies
} from '@eldrforge/git-tools';

// Check if a package is globally linked
const isLinked = await isNpmLinked('/path/to/my-package');
console.log(`Package is linked: ${isLinked}`);

// Get all globally linked packages
const globalPackages = await getGloballyLinkedPackages();
console.log('Globally linked packages:', Array.from(globalPackages));

// Get packages that this project is linked to (consuming)
const linkedDeps = await getLinkedDependencies('/path/to/consumer');
console.log('Consuming linked packages:', Array.from(linkedDeps));
```

#### Detect Link Compatibility Problems

```typescript
import { getLinkCompatibilityProblems } from '@eldrforge/git-tools';

// Check for version compatibility issues with linked dependencies
const problems = await getLinkCompatibilityProblems('/path/to/package');

if (problems.size > 0) {
  console.error('⚠️  Link compatibility problems detected:');
  for (const packageName of problems) {
    console.error(`  - ${packageName}`);
  }
} else {
  console.log('✅ All linked dependencies are compatible');
}
```

**Note**: `getLinkCompatibilityProblems` intelligently handles prerelease versions (e.g., `4.4.53-dev.0` is compatible with `^4.4`).

### Process Execution

#### Secure Command Execution

```typescript
import { runSecure, runSecureWithInheritedStdio } from '@eldrforge/git-tools';

// Execute and capture output
const { stdout, stderr } = await runSecure('git', ['status', '--porcelain']);
console.log(stdout);

// Execute with inherited stdio (output goes directly to terminal)
await runSecureWithInheritedStdio('git', ['push', 'origin', 'main']);
```

#### Suppress Error Logging

Some commands are expected to fail in certain scenarios:

```typescript
import { runSecure } from '@eldrforge/git-tools';

try {
  // Check if a branch exists without logging errors
  await runSecure('git', ['rev-parse', '--verify', 'feature-branch'], {
    suppressErrorLogging: true
  });
  console.log('Branch exists');
} catch (error) {
  console.log('Branch does not exist');
}
```

#### Input Validation

```typescript
import { validateGitRef, validateFilePath } from '@eldrforge/git-tools';

const userBranch = getUserInput();

// Validate before using in commands
if (validateGitRef(userBranch)) {
  await runSecure('git', ['checkout', userBranch]);
} else {
  console.error('Invalid branch name');
}

const userFile = getUserInput();
if (validateFilePath(userFile)) {
  await runSecure('git', ['add', userFile]);
} else {
  console.error('Invalid file path');
}
```

### Validation Utilities

#### Safe JSON Parsing

```typescript
import { safeJsonParse, validatePackageJson } from '@eldrforge/git-tools';

// Parse JSON with automatic error handling
try {
  const data = safeJsonParse(jsonString, 'config.json');
  console.log(data);
} catch (error) {
  console.error('Failed to parse JSON:', error.message);
}

// Validate package.json structure
try {
  const packageJson = safeJsonParse(fileContents, 'package.json');
  const validated = validatePackageJson(packageJson, 'package.json');

  console.log(`Package: ${validated.name}`);
  console.log(`Version: ${validated.version}`);
} catch (error) {
  console.error('Invalid package.json:', error.message);
}
```

#### String Validation

```typescript
import { validateString, validateHasProperty } from '@eldrforge/git-tools';

// Validate non-empty string
try {
  const username = validateString(userInput, 'username');
  console.log(`Valid username: ${username}`);
} catch (error) {
  console.error('Invalid username:', error.message);
}

// Validate object has required property
try {
  validateHasProperty(config, 'apiKey', 'config.json');
  console.log('Config has required apiKey');
} catch (error) {
  console.error('Missing required property:', error.message);
}
```

## Practical Examples

### Example 1: Release Note Generator

```typescript
import {
  getCurrentVersion,
  findPreviousReleaseTag,
  runSecure
} from '@eldrforge/git-tools';

async function generateReleaseNotes() {
  // Get version range
  const currentVersion = await getCurrentVersion();
  const previousTag = await findPreviousReleaseTag(currentVersion, 'v*');

  if (!previousTag) {
    console.log('No previous release found');
    return;
  }

  // Get commits between tags
  const { stdout } = await runSecure('git', [
    'log',
    `${previousTag}..HEAD`,
    '--pretty=format:%s',
    '--no-merges'
  ]);

  const commits = stdout.trim().split('\n');

  console.log(`Release Notes for ${currentVersion}`);
  console.log(`Changes since ${previousTag}:`);
  console.log('');
  commits.forEach(commit => console.log(`- ${commit}`));
}

generateReleaseNotes().catch(console.error);
```

### Example 2: Pre-Push Validation

```typescript
import {
  getGitStatusSummary,
  isBranchInSyncWithRemote
} from '@eldrforge/git-tools';

async function validateBeforePush() {
  const status = await getGitStatusSummary();

  // Check for uncommitted changes
  if (status.hasUnstagedFiles || status.hasUncommittedChanges) {
    console.error('❌ Cannot push with uncommitted changes');
    return false;
  }

  // Check if in sync with remote
  const syncStatus = await isBranchInSyncWithRemote(status.branch);

  if (!syncStatus.inSync) {
    console.error('❌ Branch not in sync with remote');
    console.error(`Local: ${syncStatus.localSha}`);
    console.error(`Remote: ${syncStatus.remoteSha}`);
    return false;
  }

  console.log('✅ Ready to push');
  return true;
}

validateBeforePush().catch(console.error);
```

### Example 3: Monorepo Link Checker

```typescript
import {
  getLinkedDependencies,
  getLinkCompatibilityProblems
} from '@eldrforge/git-tools';

async function checkMonorepoLinks(packageDirs: string[]) {
  for (const packageDir of packageDirs) {
    console.log(`\nChecking: ${packageDir}`);

    const linked = await getLinkedDependencies(packageDir);
    console.log(`Linked dependencies: ${Array.from(linked).join(', ') || 'none'}`);

    const problems = await getLinkCompatibilityProblems(packageDir);

    if (problems.size > 0) {
      console.error('⚠️  Compatibility issues:');
      for (const pkg of problems) {
        console.error(`  - ${pkg}`);
      }
    } else {
      console.log('✅ All links compatible');
    }
  }
}

checkMonorepoLinks([
  './packages/core',
  './packages/cli',
  './packages/utils'
]).catch(console.error);
```

### Example 4: Branch Sync Script

```typescript
import {
  getCurrentBranch,
  localBranchExists,
  safeSyncBranchWithRemote
} from '@eldrforge/git-tools';

async function syncMainBranch() {
  const currentBranch = await getCurrentBranch();
  const hasMain = await localBranchExists('main');

  if (!hasMain) {
    console.error('❌ Main branch does not exist locally');
    return;
  }

  console.log(`Current branch: ${currentBranch}`);
  console.log('Syncing main branch with remote...');

  const result = await safeSyncBranchWithRemote('main');

  if (result.success) {
    console.log('✅ Main branch synced successfully');
  } else if (result.conflictResolutionRequired) {
    console.error('❌ Conflict resolution required');
    console.error(result.error);
  } else {
    console.error('❌ Sync failed:', result.error);
  }
}

syncMainBranch().catch(console.error);
```

## API Reference

### Git Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `isValidGitRef(ref)` | `ref: string` | `Promise<boolean>` | Tests if a git reference exists and is valid |
| `isGitRepository(cwd?)` | `cwd?: string` | `Promise<boolean>` | Checks if directory is a git repository |
| `findPreviousReleaseTag(version, pattern?)` | `version: string, pattern?: string` | `Promise<string \| null>` | Finds highest tag less than current version |
| `getCurrentVersion()` | - | `Promise<string \| null>` | Gets current version from package.json |
| `getCurrentBranch()` | - | `Promise<string>` | Gets current branch name |
| `getDefaultFromRef(forceMain?, branch?)` | `forceMain?: boolean, branch?: string` | `Promise<string>` | Gets reliable default for release comparison |
| `getRemoteDefaultBranch(cwd?)` | `cwd?: string` | `Promise<string \| null>` | Gets default branch name from remote |
| `localBranchExists(branch)` | `branch: string` | `Promise<boolean>` | Checks if local branch exists |
| `remoteBranchExists(branch, remote?)` | `branch: string, remote?: string` | `Promise<boolean>` | Checks if remote branch exists |
| `getBranchCommitSha(ref)` | `ref: string` | `Promise<string>` | Gets commit SHA for a branch |
| `isBranchInSyncWithRemote(branch, remote?)` | `branch: string, remote?: string` | `Promise<SyncStatus>` | Checks if local/remote branches match |
| `safeSyncBranchWithRemote(branch, remote?)` | `branch: string, remote?: string` | `Promise<SyncResult>` | Safely syncs branch with remote |
| `getGitStatusSummary(workingDir?)` | `workingDir?: string` | `Promise<GitStatus>` | Gets comprehensive git status |
| `getGloballyLinkedPackages()` | - | `Promise<Set<string>>` | Gets globally linked npm packages |
| `getLinkedDependencies(packageDir)` | `packageDir: string` | `Promise<Set<string>>` | Gets linked dependencies for package |
| `getLinkCompatibilityProblems(packageDir)` | `packageDir: string` | `Promise<Set<string>>` | Finds version compatibility issues |
| `isNpmLinked(packageDir)` | `packageDir: string` | `Promise<boolean>` | Checks if package is globally linked |

### Process Execution Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `runSecure(cmd, args, opts?)` | `cmd: string, args: string[], opts?: RunSecureOptions` | `Promise<{stdout, stderr}>` | Securely executes command with argument array |
| `runSecureWithInheritedStdio(cmd, args, opts?)` | `cmd: string, args: string[], opts?: SpawnOptions` | `Promise<void>` | Secure execution with inherited stdio |
| `run(command, opts?)` | `command: string, opts?: RunOptions` | `Promise<{stdout, stderr}>` | Executes command string (less secure) |
| `runWithDryRunSupport(cmd, dryRun, opts?)` | `cmd: string, dryRun: boolean, opts?: ExecOptions` | `Promise<{stdout, stderr}>` | Run with dry-run support |
| `runSecureWithDryRunSupport(cmd, args, dryRun, opts?)` | `cmd: string, args: string[], dryRun: boolean, opts?: SpawnOptions` | `Promise<{stdout, stderr}>` | Secure run with dry-run support |
| `validateGitRef(ref)` | `ref: string` | `boolean` | Validates git reference for injection |
| `validateFilePath(path)` | `path: string` | `boolean` | Validates file path for injection |
| `escapeShellArg(arg)` | `arg: string` | `string` | Escapes shell arguments |

### Logger Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `setLogger(logger)` | `logger: Logger` | `void` | Sets the global logger instance |
| `getLogger()` | - | `Logger` | Gets the global logger instance |

### Validation Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `safeJsonParse<T>(json, context?)` | `json: string, context?: string` | `T` | Safely parses JSON with error handling |
| `validateString(value, fieldName)` | `value: any, fieldName: string` | `string` | Validates non-empty string |
| `validateHasProperty(obj, property, context?)` | `obj: any, property: string, context?: string` | `void` | Validates object has property |
| `validatePackageJson(data, context?, requireName?)` | `data: any, context?: string, requireName?: boolean` | `any` | Validates package.json structure |

### Type Definitions

```typescript
interface GitStatus {
  branch: string;
  hasUnstagedFiles: boolean;
  hasUncommittedChanges: boolean;
  hasUnpushedCommits: boolean;
  unstagedCount: number;
  uncommittedCount: number;
  unpushedCount: number;
  status: string;
}

interface SyncStatus {
  inSync: boolean;
  localSha?: string;
  remoteSha?: string;
  localExists: boolean;
  remoteExists: boolean;
  error?: string;
}

interface SyncResult {
  success: boolean;
  error?: string;
  conflictResolutionRequired?: boolean;
}

interface Logger {
  error(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  verbose(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
}

interface RunSecureOptions extends SpawnOptions {
  suppressErrorLogging?: boolean;
}

interface RunOptions extends ExecOptions {
  suppressErrorLogging?: boolean;
}
```

## Security Considerations

This library prioritizes security in command execution:

### Shell Injection Prevention

All `runSecure*` functions use argument arrays without shell execution:

```typescript
// ✅ SAFE: No shell interpretation
await runSecure('git', ['log', userInput]);

// ⚠️ UNSAFE: Shell interprets special characters
await run(`git log ${userInput}`);
```

### Input Validation

Git references and file paths are validated before use:

```typescript
// Validates against: .., leading -, shell metacharacters
if (!validateGitRef(userRef)) {
  throw new Error('Invalid git reference');
}

// Validates against: shell metacharacters
if (!validateFilePath(userPath)) {
  throw new Error('Invalid file path');
}
```

### Best Practices

1. **Always use `runSecure` for user input**
2. **Validate all git references with `validateGitRef`**
3. **Validate all file paths with `validateFilePath`**
4. **Use `suppressErrorLogging` to avoid leaking sensitive info**
5. **Set custom logger for production environments**

## Testing

The library includes comprehensive test coverage:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test

# Watch mode
npm run watch
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/grunnverk/git-tools.git
cd git-tools

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

### Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `npm test`
2. Code is linted: `npm run lint`
3. Add tests for new features
4. Update documentation for API changes

## Troubleshooting

### Common Issues

**"Command failed with exit code 128"**
- Check if the directory is a git repository
- Verify git is installed and accessible
- Check git configuration

**"Invalid git reference"**
- Ensure branch/tag names don't contain special characters
- Verify the reference exists: `git rev-parse --verify <ref>`

**"Branch not in sync"**
- Run `git fetch` to update remote refs
- Use `safeSyncBranchWithRemote` to sync automatically

**NPM link detection not working**
- Verify package is globally linked: `npm ls -g <package-name>`
- Check symlinks in global node_modules: `npm prefix -g`

## License

Apache-2.0 - see [LICENSE](LICENSE) file for details.

## Author

**Tim O'Brien**
Email: tobrien@discursive.com
GitHub: [@grunnverk](https://github.com/grunnverk)

## Related Projects

This library was extracted from [kodrdriv](https://github.com/grunnverk/kodrdriv), an AI-powered Git workflow automation tool that uses these utilities for:

- Automated commit message generation
- Release note creation
- Branch management
- Monorepo publishing workflows

## Changelog

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for version history and changes.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/grunnverk/git-tools/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/grunnverk/git-tools/discussions)
- 📧 **Email**: tobrien@discursive.com
