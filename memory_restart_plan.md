# Memory Server Debugging Plan

This plan outlines the steps to debug and resolve the "Unexpected non-whitespace character after JSON" error encountered when interacting with the Memory API. It incorporates a refined understanding of the system's architecture and the project's build process.

## System Architecture (The Forest)

Here's a high-level overview of how the components interact, emphasizing the file structure and the role of `settings.json`:

1.  **The Gemini CLI (Me):**
    *   **Role:** The orchestrator. I issue high-level commands (e.g., `default_api.create_entities`, `default_api.read_graph`).
    *   **Location:** Remote from your local machine.

2.  **The Tool Wrapper/Executor:**
    *   **Role:** This is the intermediary layer on your local machine that translates my `default_api` calls into concrete actions.
    *   **Interaction:** It receives my API calls and then, crucially, consults the `settings.json` file to determine how to interact with the specific "server" processes.

3.  **`npx` (The Default Launcher):**
    *   **Role:** By default, `npx` is used to fetch and launch packages from the npm registry (internet). This is why the `mcp-server-memory` was running "more or less fine" initially, as `npx` was providing a functional, internet-sourced version.
    *   **How it works (Default):** When an MCP server is first needed and not explicitly configured otherwise, `npx` fetches the package and starts a persistent Node.js process for that server.
    *   **Location:** Runs on your local machine.

4.  **`settings.json` (The Configuration Override):**
    *   **Role:** This file (`/home/zezen/Downloads/GitHub/servers/.gemini/settings.json`) is paramount. It allows us to **override** the default `npx` behavior and explicitly tell the Gemini CLI to use a *locally built* version of an MCP server.
    *   **How it works (Override):** By modifying the `settings.json` entry for `memory`, we instruct the CLI to directly execute our locally compiled `dist/index.js` using `node`, rather than relying on `npx` to fetch from the internet.
    *   **Location:** On your local disk, within the project's `.gemini/` directory.

5.  **`mcp-server-memory` (The Persistent Server Process - The Executable):**
    *   **Role:** The actual Node.js application that manages the knowledge graph. Once launched (either by `npx` from the internet, or directly by `node` via `settings.json`), it runs continuously in the background.
    *   **Source Code Location:** The human-readable source code is in TypeScript (`.ts` files) located in `/home/zezen/Downloads/GitHub/servers/src/memory/` (e.g., `index.ts`). These are **development files** and are not directly used by `npx` unless explicitly built and configured.
    *   **Compilation:** These `.ts` files are compiled into JavaScript (`.js` files) using `tsc` (TypeScript compiler), as defined by `npm run build` in `package.json` and configured by `tsconfig.json`.
    *   **Compiled Output Location:** The compiled `.js` files are placed in the `/home/zezen/Downloads/GitHub/servers/src/memory/dist/` directory. This `dist/` directory was previously not found, indicating the local development version was not built.
    *   **Executable Entry Point:** The `package.json` specifies `dist/index.js` as the `bin` entry point, meaning this is the specific `.js` file that `node` executes to run the server when configured via `settings.json`.
    *   **Interaction:** It listens for commands on its standard input (stdin) and sends JSON responses to its standard output (stdout).
    *   **Persistent Storage:** It reads from and writes to a `memory.json` file to maintain its state across restarts.
    *   **Location:** Runs as a background process on your local machine.

6.  **`memory.json` (Persistent Storage):**
    *   **Role:** A file on your local filesystem where the `mcp-server-memory` process stores the knowledge graph data.
    *   **Location:** On your local disk, typically within the server's working directory: `/home/zezen/Downloads/GitHub/servers/src/memory/memory.json`.

7.  **Shell Environment:**
    *   **Role:** The underlying operating system environment where `npx` and the Node.js server processes execute.
    *   **Location:** Your local Linux system.

### The "Unexpected non-whitespace character after JSON" Error

This error was likely caused by an older, buggy version of the `mcp-server-memory` pulled by `npx`. The local build and explicit configuration via `settings.json` to use the newer, locally cloned version has resolved this issue. The error manifests as non-JSON output being sent to `stdout`.

**Further Analysis of the Error (NDJSON Communication):**

Through analysis of `stdio.js` and `shared/stdio.js` within the `@modelcontextprotocol/sdk` dependency, it has been confirmed that the memory server communicates using **Newline-Delimited JSON (NDJSON)**. Each message is a complete JSON object followed by a newline character. The "Unexpected non-whitespace character after JSON" error strongly suggests that something *other than* a newline character is appearing immediately after a JSON message, or that a JSON message itself is malformed. Possible causes include:

*   **Extraneous Output:** Some part of the server (or its environment) printing non-JSON text to `stdout` *before* or *between* the NDJSON messages (e.g., log messages, warnings, or errors not directed to `stderr`).
*   **Corrupted `memory.json`:** If the `memory.json` file contains malformed NDJSON, the `loadGraph()` function might encounter a parsing error, potentially leading to error output on `stdout`.
*   **Partial Writes:** Abrupt termination during `saveGraph()` could leave `memory.json` with incomplete or corrupted lines.
*   **Multiple Server Instances:** If multiple instances of the server are running (despite `settings.json` configuration), their NDJSON outputs could interleave on `stdout`, causing parsing errors.

## Agent Self-Correction and Problem-Solving Methodology (The Agent's Internal Plan)

This section outlines the lessons learned from previous interactions and the refined methodology I will employ for future problem-solving. The "bug" in my previous behavior was characterized by rushing, premature actions (e.g., attempting `kill` commands without full understanding or authorization), and insufficient planning.

**Goal of This Methodology:** To ensure safer, more effective, and transparent operations, prioritizing understanding before action, iterative learning, and clear communication with the user. The ultimate goal of this specific debugging process is to **remove the "Unexpected non-whitespace character after JSON" error** by ensuring the correct memory server instance is running and configured.

### Phase 1: Observe & Understand (The Initial Scan)

*   **The Bug:** My previous behavior of rushing and attempting premature actions (like `kill` commands) without full understanding or authorization. This led to frustration and inefficiency.
*   **Action:** Begin by thoroughly observing the problem statement and the initial context. Go through relevant files (e.g., `README.md`, `package.json`, `tsconfig.json`, source code) to form an initial hypothesis about the likely culprit.
*   **Purpose:** To gain a foundational understanding of the system and the problem, avoiding premature assumptions.

### Phase 2: Deep Dive & Logic Comprehension (The Detailed Analysis)

*   **Action:** If the initial scan doesn't yield a clear solution, delve deeper into related files and source code. Understand the logic, dependencies, and how different components interact. This involves reading code, configuration files, and any available documentation.
    *   **Specific Actions Taken in this Phase:**
        *   Read `src/memory/index.ts` to understand server logic and `memory.json` handling.
        *   Read `src/memory/package.json` to understand dependencies and build scripts.
        *   Read `src/memory/tsconfig.json` to understand TypeScript compilation.
        *   Read `/home/zezen/Downloads/GitHub/servers/tsconfig.json` for root TypeScript configuration.
        *   Read `/home/zezen/Downloads/servers/.gemini/settings.json` to understand server configuration.
        *   Read `node_modules/@modelcontextprotocol/sdk/dist/server/stdio.js` and `node_modules/@modelcontextprotocol/sdk/dist/shared/stdio.js` to understand NDJSON communication.
*   **Purpose:** To build a robust mental model of the system's internal workings and pinpoint the root cause of the issue.

### Phase 3: Report & Confirm Understanding (The User Checkpoint)

*   **Action:** Articulate my current understanding of the problem, the system, and the potential root cause to the user. Explicitly ask for confirmation or correction of my understanding.
    *   **Specific Actions Taken in this Phase:**
        *   Reported that `dist/` directory was missing, indicating the server was not built locally.
        *   Reported that `npx` loads packages from the internet by default, and `settings.json` is needed to override this.
        *   Confirmed that the `memory.json` handling in `index.ts` is graceful for `ENOENT`.
        *   Confirmed NDJSON communication and potential causes for the parsing error.
*   **Purpose:** To ensure alignment with the user's knowledge, prevent misinterpretations, and gather additional context or insights.

### Phase 4: Plan & Propose Solution (The Strategic Outline)

*   **Action:** Based on the confirmed understanding, formulate a detailed, step-by-step plan to address the problem. Propose specific actions and their expected outcomes. Explain potential risks or alternatives.
    *   **Specific Actions Proposed in this Phase:**
        *   Formulate specific actions to address the problem.
*   **Purpose:** To provide a clear roadmap for resolution, allowing the user to review and approve the approach before any modifications are made.

### Phase 5: Execute & Verify (The Controlled Action)

*   **Action:** Only after explicit user approval, execute the planned actions. After execution, verify the results and confirm that the problem has been resolved or that the expected changes have occurred.
*   **Purpose:** To ensure safe and effective problem resolution, with continuous feedback and verification.
