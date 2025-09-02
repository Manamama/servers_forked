# Fix Memory Server Configuration - Design Document

This document outlines the technical design to fix the `mcp-server-memory` toolset by addressing potential code issues, implementing unit tests, and ensuring the correct server version is executed.

## Technical Solution

The solution is a multi-step process involving code review, testing, environment reconfiguration, and verification.

### 1. Code Refinement and Versioning
- **Review Locking Mechanism:** Although the `_executeWithLock` promise chain in `index.ts` appears to be a functional async lock for a single Node.js process, it will be reviewed for any subtle race conditions.
- **Add Defensive Logging:** Add detailed logging to `stdout` at the entry and exit points of `_executeWithLock`, `loadGraph`, and `saveGraph` to provide clear insight into file operations during testing.
- **Bump Version:** The version number in `package.json` will be updated from `0.6.3` to `0.6.4-localfix` to clearly identify the newly deployed version.

### 2. Unit & Integration Testing
- **Test Framework:** A new test script (`test_fix.mjs`) will be created using Node.js's built-in `node:test` runner.
- **Test Logic:** The script will simulate concurrent operations by rapidly calling the `KnowledgeGraphManager`'s methods multiple times without `await`ing each one individually, and then checking the final state of the `memory.json` file.
- **Assertions:** The test will assert that:
    1. The final `memory.json` file is valid NDJSON.
    2. The number of entities and relations in the file matches the number of successful write operations.
    3. No data is lost or corrupted.
- **Execution:** A new `test` script will be added to `package.json` to run this test file.

### 3. Environment Reconfiguration
- **Locate `settings.json`:** The first step of execution will be to locate the active `settings.json` file for the MCP environment.
- **Modify `settings.json`:** The configuration for `mcp-server-memory` will be updated to replace the `npx` command with a direct `node` execution command pointing to the local build.
    - **Target Executable:** `/home/zezen/Downloads/GitHub/servers_forked/src/memory/dist/index.js`
- **Build the Code:** The `npm run build` command will be executed to ensure the latest code from `index.ts` is compiled to `dist/index.js`.

### 4. Deployment and Verification
- **Process Restart:** A shell command (`ps aux | grep mcp-server-memory` followed by `kill`) will be used to find and terminate any old, running instances of the server. The environment will then launch the new version based on the updated `settings.json`.
- **Final Verification:** The original test case (`default_api.create_entities(...)`) will be executed. A successful response (no JSON parsing error) will confirm the fix.

## System Components
- **`index.ts`:** Main source file to be reviewed and potentially modified.
- **`package.json`:** To be modified for version bump and to add a `test` script.
- **`test_fix.mjs`:** New file to be created for unit/integration testing.
- **`settings.json`:** The core configuration file to be modified.
- **`mcp-server-memory` process:** The running Node.js process that needs to be restarted.
- **`memory.json`:** The persistent storage file that will be checked during testing.

## Data Models
The existing data models (`Entity`, `Relation`, `KnowledgeGraph`) defined in `index.ts` will be used without modification.

## User Interface
This is a backend fix; no user interface changes are required.