# Fix Memory Server Configuration - Tasks Document

This document outlines the specific, actionable tasks required to implement the design for fixing the `mcp-server-memory` toolset.

## Tasks

### 1. Code Refinement and Versioning

- [ ] **Task 1.1: Update `package.json` version**
    - Update the `version` field in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/package.json` from `0.6.3` to `0.6.4-localfix`.
- [ ] **Task 1.2: Add defensive logging to `_executeWithLock`**
    - Add `console.error` statements at the entry and exit points of the `_executeWithLock` method in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/index.ts` to log lock acquisition and release.
- [ ] **Task 1.3: Add defensive logging to `loadGraph`**
    - Add `console.error` statements within the `loadGraph` method in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/index.ts` to log file read operations and parsing.
- [ ] **Task 1.4: Add defensive logging to `saveGraph`**
    - Add `console.error` statements within the `saveGraph` method in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/index.ts` to log file write operations.

### 2. Unit & Integration Testing

- [ ] **Task 2.1: Create `test_fix.mjs`**
    - Create a new file `/home/zezen/Downloads/GitHub/servers_forked/src/memory/test_fix.mjs` with Node.js `node:test` logic to simulate concurrent operations and verify `memory.json` integrity.
- [ ] **Task 2.2: Add `test` script to `package.json`**
    - Add a `"test": "node --test test_fix.mjs"` script to the `scripts` section of `/home/zezen/Downloads/GitHub/servers_forked/src/memory/package.json`.
- [ ] **Task 2.3: Run `npm install`**
    - Execute `npm install` in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/` to ensure all test dependencies are met.
- [ ] **Task 2.4: Run `npm run test`**
    - Execute `npm run test` in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/` to run the newly created unit tests.

### 3. Environment Reconfiguration

- [ ] **Task 3.1: Run `npm run build`**
    - Execute `npm run build` in `/home/zezen/Downloads/GitHub/servers_forked/src/memory/` to compile the updated `index.ts` to `dist/index.js`.
- [ ] **Task 3.2: Locate `settings.json`**
    - Identify the absolute path to the active `settings.json` file for the MCP environment. (This may require user input or a search in common locations like `~/.gemini/settings.json` or project root `.gemini/settings.json`).
- [ ] **Task 3.3: Read `settings.json` content**
    - Read the content of the located `settings.json` file.
- [ ] **Task 3.4: Modify `settings.json`**
    - Update the `settings.json` file to change the `mcp-server-memory` configuration. The `command` should be changed to `node /home/zezen/Downloads/GitHub/servers_forked/src/memory/dist/index.js`.

### 4. Deployment and Verification

- [ ] **Task 4.1: Find and kill old server processes**
    - Use `ps aux | grep mcp-server-memory` to find the process ID(s) of any running `mcp-server-memory` instances and then `kill` them.
- [ ] **Task 4.2: Verify server restart**
    - Confirm that the `mcp-server-memory` process has automatically restarted with the new configuration (e.g., by checking `ps aux` again or looking for new logs).
- [ ] **Task 4.3: Execute `create_entities` test**
    - Run `default_api.create_entities(entities=[{"entityType": "test", "name": "test_entity", "observations": ["This is a test entity"]}])` to verify the fix.
- [ ] **Task 4.4: Execute `read_graph` test**
    - Run `default_api.read_graph()` to verify the created entity is present in the graph.