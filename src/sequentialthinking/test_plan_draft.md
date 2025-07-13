# Draft Test Plan for Sequential Thinking Tool Proposals

This document outlines a draft plan for testing the various proposed versions of the `sequentialthinking` MCP server. The primary goal is to verify that the implemented changes (versioning, source identification, enhanced validation, and new guidance mechanisms) function as expected across different AI-authored versions.

## 1. Setup and Build Environment

**Objective:** Ensure each proposed server version can be built and run locally.

**Steps:**
1.  Navigate to the `src/sequentialthinking` directory: `cd /home/zezen/Downloads/GitHub/servers/src/sequentialthinking`
2.  Install dependencies (if not already done): `npm install`
3.  For each proposed `.ts` file (e.g., `proposals/index.grok.v0.7.2.ts`):
    *   Copy the content of the proposal file to `index.ts` (e.g., `cp proposals/index.grok.v0.7.2.ts index.ts`).
    *   Build the project: `npm run build` (This will transpile `index.ts` to `dist/index.js`).
    *   Run the server: `node dist/index.js` (The server should start and log "Sequential Thinking MCP Server running on stdio").
    *   Keep the server running in a separate terminal or background it.

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
