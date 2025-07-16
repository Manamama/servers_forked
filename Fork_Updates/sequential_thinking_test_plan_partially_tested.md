# Test Plan for Sequential Thinking Tool Proposals

**Current Status and Purpose:** This document outlines the test plan for various proposed versions of the `sequentialthinking` MCP server. It's crucial to note that the `.ts` files in `src/sequentialthinking/proposals/` are **pre-existing implementations** of these versions. The primary objective was to verify that the implemented changes (versioning, source identification, enhanced validation, and new guidance mechanisms) function as expected across different AI-authored versions.

**Current Status of Proposals:**

*   **Grok AI's Version (v0.7.2):** This version has been informally tested and is working successfully in a live environment. Its implementation involved directly copying the proposal over the existing `.js` file.
*   **Gemini AI's Version (v0.7.1):** Testing for this version has been suspended due to the successful performance of Grok AI's version and current time constraints.

**Overall Goal of This Test Plan (The "Forest"):**

The overarching goal with this test plan was to **systematically validate the quality, reliability, and intended behavior of different AI-authored versions of the `sequentialthinking` MCP server.** While Grok AI's version has been successfully deployed, this document remains as a reference for external users (e.g., GitHub users) who may wish to formally retest these proposals themselves, or for potential merging back into the original project via a Pull Request. This testing is crucial for building confidence in AI-generated code, ensuring the `sequentialthinking` tool is reliable for its users, and informing future development of AI-assisted coding.

**Context for These Proposals:** User testing revealed that the current Sequential Thinking tool is defective, as the AI utilizing it does not branch sufficiently. Following extensive discussions, both Grok AI and Gemini AI had proposed fixes, which were then evaluated. The tests outlined in this plan were designed to validate these proposed solutions.

### Role of `settings.json` in Testing

It's important to distinguish between how the `sequential-thinking` MCP server is configured in `settings.json` for general use and how it's launched for these specific tests:

*   **`settings.json` Configuration:** The `settings.json` file (located at `/home/zezen/Downloads/GitHub/servers/.gemini/settings.json`) contains an entry for `sequential-thinking` that typically looks like this:
    ```json
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
    ```
    This configuration tells the Gemini CLI how to launch the *production or installed version* of the `sequential-thinking` server, usually by running a globally available npm package.

*   **Local Testing Mechanism:** For the purpose of this test plan, we are **bypassing the `settings.json` configuration**. Instead, we are employing a "local compilation" and direct execution mechanism:
    1.  **Copying the Proposal:** We copy the content of a specific `.ts` proposal file (from `src/sequentialthinking/proposals/`) into the main `src/sequentialthinking/index.ts` file.
    2.  **Building Locally:** We then run `npm run build` within the `src/sequentialthinking` directory to compile this `index.ts` into `dist/index.js`.
    3.  **Direct Execution:** Finally, we run the compiled server directly using `node dist/index.js`.

This local testing mechanism allows us to isolate and thoroughly test each proposed version without interfering with the globally installed or configured version of the `sequential-thinking` server that the Gemini CLI might use in other contexts.

### Dynamic `settings.json` Configuration for Testing

To enable the Gemini CLI to interact with the *locally compiled development version* of the `sequentialthinking` server (rather than the default published version), the `sequential-thinking` entry in `/home/zezen/Downloads/GitHub/servers/.gemini/settings.json` is dynamically updated during the testing process. This involves changing its `command` and `args` to directly execute the `dist/index.js` file generated from our local build. This ensures that when the Gemini CLI attempts to use the `sequential-thinking` tool, it is interacting with the specific proposal currently being tested.


## 1. Setup and Build Environment

**Pre-Test Setup (Agent-Assisted by Gemini CLI):**

Before proceeding with the tests for each proposed version, the following setup steps must be performed. These steps prepare the environment and "implement" the specific proposal for testing. **The Gemini CLI will assist you with these steps.**

1.  **Navigate to the `sequentialthinking` directory:** `cd /home/zezen/Downloads/GitHub/servers/src/sequentialthinking`
2.  **Install Dependencies (Once):** Run `npm install`. This installs all the necessary packages for building the server and only needs to be done once.
3.  **Backup Current `index.ts`:** Create a backup of the existing `index.ts` file (e.g., `cp index.ts index.ts.bak`). This allows for easy restoration.
4.  **Select and Copy Proposal:** Choose the desired proposal file from `src/sequentialthinking/proposals/`. The available TypeScript proposal files are:
    *   `index.gemini.v0.7.0.ts`
    *   `index.gemini.v0.7.1.ts`
    *   `index.grok.v0.7.0.ts`
    *   `index.grok.v0.7.2.ts`
    Copy its content to `index.ts` in the current directory (e.g., `cp proposals/index.grok.v0.7.2.ts index.ts`). This effectively "implements" the chosen proposal.
5.  **Build the Project:** Run `npm run build`. This compiles the `index.ts` file into `dist/index.js`.
6.  **Run the Server:** Start the compiled server using `node dist/index.js`. The server should start and log "Sequential Thinking MCP Server running on stdio". Keep this server running in a separate terminal or background it for the duration of the tests.

Once these steps are completed for a specific proposal, you (the human tester) can proceed with the detailed test cases outlined below. The recommended testing order for the proposals is:

0.  **Original Version:** Test the `index.ts` file as it exists in the repository (without copying any proposal files into it) to establish a baseline and confirm basic compilation.
1.  **Newest Grok's Version:** Test `index.grok.v0.7.2.ts`.
2.  **Newest Gemini's Version:** Test `index.gemini.v0.7.1.ts`.

Remember to repeat steps 4-6 for each different proposal you wish to test.

**Objective:** Ensure each proposed server version can be built and run locally.

**Steps:**
1.  Navigate to the `src/sequentialthinking` directory: `cd /home/zezen/Downloads/GitHub/servers/src/sequentialthinking`
2.  Install dependencies (if not already done): `npm install`
3.  For each proposed `.ts` file (e.g., `proposals/index.grok.v0.7.2.ts`):
    *   Copy the content of the proposal file to `index.ts` (e.g., `cp proposals/index.grok.v0.7.2.ts index.ts`).
    *   Build the project: `npm run build` (This will transpile `index.ts` to `dist/index.js`).
    *   Run the server: `node dist/index.js` (The server should start and log "Sequential Thinking MCP Server running on stdio").
    *   Keep the server running in a separate terminal or background it.

## Test Execution Log

This section tracks the compilation status and reported version/source for each tested proposal.

| Version/Proposal | Compilation Status | Reported Version | Reported Source | Fix Details |
| :--------------- | :----------------- | :--------------- | :-------------- | :---------- |
| Original Version | Success            | 0.2.0            | N/A (not reported) | N/A |
| Newest Grok's Version | Success            | 0.7.2.grok-dev   | Grok AI         | Initially failed because the `Server` instance did not expose `version` and `source` directly or via an `info` property. The fix involved two steps: First, attempting to access `server.version` and `server.source` directly, which also failed. Second, the successful approach was to define a `serverMetadata` constant containing the `name`, `version`, and `source`, pass this constant to the `Server` constructor, and then reference `serverMetadata.version` and `serverMetadata.source` in the console log. This ensures proper access to the server's metadata. |

## 2. Version and Source Verification

**Objective:** Verify that each server correctly reports its version and source via the MCP `ListToolsRequestSchema` handler.

**Steps (for each running server):**
1.  Send a `ListToolsRequestSchema` request to the running server.
    *   *Note: This will require an MCP client capable of sending such requests. If a direct client is not available, this step might need to be simulated or observed via server logs if the server prints its startup info.*
2.  Inspect the response to confirm:
    *   The `name` of the tool is `sequentialthinking`.
    *   The `version` field matches the expected version for that proposal (e.g., `0.7.2.grok-dev`, `0.7.1.gemini-dev`).
    *   The `source` field matches the expected AI author (e.g., `Grok AI`, `Gemini AI`).

## 3. Core Functionality (Linear Thoughts)

**Objective:** Verify that basic linear thought progression still works correctly.

**Steps (for each running server):**
1.  Send a `CallToolRequestSchema` for `sequentialthinking` with basic linear inputs:
    ```json
    {
      "thought": "Initial thought for a linear process.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 1,
      "totalThoughts": 5
    }
    ```
2.  Send subsequent linear thoughts, incrementing `thoughtNumber`.
3.  Verify the server's response for each call:
    *   `thoughtNumber` and `totalThoughts` are correct.
    *   `nextThoughtNeeded` reflects the input.
    *   No unexpected errors.

## 4. Revision Functionality (`isRevision`, `revisesThought`)

**Objective:** Verify correct handling of thought revisions, including new validation.

**Steps (for each running server):**
1.  Send an initial thought (e.g., `thoughtNumber: 1`).
2.  Send a revision thought:
    ```json
    {
      "thought": "Revising thought 1 due to new information.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 2,
      "totalThoughts": 5,
      "isRevision": true,
      "revisesThought": 1
    }
    ```
3.  **Test Validation (Negative Case):** Attempt to send a revision without `revisesThought` or with an invalid `revisesThought` (e.g., `0` or non-number). Verify an error is returned.
    ```json
    {
      "thought": "Invalid revision attempt.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 3,
      "totalThoughts": 5,
      "isRevision": true
      // missing revisesThought
    }
    ```
    ```json
    {
      "thought": "Invalid revision attempt.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 3,
      "totalThoughts": 5,
      "isRevision": true,
      "revisesThought": 0 // invalid
    }
    ```
4.  Verify the server's response and logs (if enabled) for correct formatting of revision thoughts.

## 5. Branching Functionality (`branchFromThought`, `branchId`)

**Objective:** Verify correct handling of branching, including new validation and deterministic `branchId` (for Grok's v0.7.2).

**Steps (for each running server):**
1.  Send an initial thought (e.g., `thoughtNumber: 1`).
2.  Send a branched thought:
    ```json
    {
      "thought": "Exploring alternative path from thought 1.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 2,
      "totalThoughts": 5,
      "branchFromThought": 1,
      "branchId": "AlternativePathA"
    }
    ```
3.  Send another branched thought from the same point, with a different `branchId`:
    ```json
    {
      "thought": "Exploring another alternative path from thought 1.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 3,
      "totalThoughts": 5,
      "branchFromThought": 1,
      "branchId": "AlternativePathB"
    }
    ```
4.  **Test Validation (Negative Case):** Attempt to send a branched thought without `branchId`. Verify an error is returned.
    ```json
    {
      "thought": "Invalid branching attempt.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 4,
      "totalThoughts": 5,
      "branchFromThought": 1
      // missing branchId
    }
    ```
5.  **For Grok's v0.7.2.ts only:**
    *   Verify that if `branchFromThought` is provided but `branchId` is *not* (and the validation is temporarily bypassed for this test, or if the validation is removed in a future version), the `branchId` is deterministically auto-generated (e.g., `Branch_1_2`).
6.  Verify the server's response and logs (if enabled) for correct formatting of branched thoughts and that `branches` in the response reflects the new branches.

## 6. Error Handling (General)

**Objective:** Verify that the server gracefully handles other invalid inputs.

**Steps (for each running server):**
1.  Send requests with missing required fields (e.g., `thought`, `nextThoughtNeeded`).
2.  Send requests with incorrect data types (e.g., `thoughtNumber` as a string).
3.  Verify that appropriate error messages are returned in the response (`isError: true` and a descriptive `error` field).

## 7. Suggestion Mechanism (Grok's Versions Only)

**Objective:** Verify that Grok's versions correctly provide suggestions based on thought content.

**Steps (for Grok's v0.7.0.ts and v0.7.2.ts):**
1.  Send a thought containing "fail" or "error":
    ```json
    {
      "thought": "The previous step failed.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 1,
      "totalThoughts": 5
    }
    ```
    Verify the response includes a `suggestion` to revise.
2.  Send a thought containing "try" or "alternative":
    ```json
    {
      "thought": "I will try an alternative approach.",
      "nextThoughtNeeded": true,
      "thoughtNumber": 2,
      "totalThoughts": 5
    }
    ```
    Verify the response includes a `suggestion` to branch.
3.  **For Grok's v0.7.2.ts only:**
    *   Test the `enableSuggestions` environment variable:
        *   Run server with `ENABLE_SUGGESTIONS=false node dist/index.js`. Verify no suggestions are returned.
        *   Run server with `ENABLE_SUGGESTIONS=true node dist/index.js`. Verify suggestions are returned.
    *   Test the refined heuristic: Send a thought that *doesn't* contain "fail"/"error" but follows a previous thought that *did* fail, and verify a revision suggestion is given (if not already a revision).

## 8. Documentation Consistency

**Objective:** Verify that the `description` field within the `SEQUENTIAL_THINKING_TOOL` accurately reflects the tool's behavior and includes the new examples and error messages.

**Steps (for each running server):**
1.  Send a `ListToolsRequestSchema` request.
2.  Extract the `description` field from the `SEQUENTIAL_THINKING_TOOL`.
3.  Manually review the `description` to ensure it matches the expected content for that specific version (e.g., Grok's v0.7.2.ts should have the "Parallel branching" example, specific error messages, etc.).

---

**Note on MCP Client:**
To fully execute this test plan, a simple MCP client capable of sending `ListToolsRequestSchema` and `CallToolRequestSchema` requests over stdio would be beneficial. Alternatively, manual inspection of server console output and careful crafting of JSON inputs would be required.
