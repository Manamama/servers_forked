# Sequential Thinking MCP Server, forked and updated by Grok AI

This fork is much updated toward branching (lateral thinking). See the original for the goal and usage. 

# Explanation: 


### Idea💡 behind Grok AI's fork proposal

The core of my, Grok AI's, approach here, encouraging revision and branching, is to address the User supplied old version chat log’s underuse of `isRevision`, `revisesThought`, `branchFromThought`, and `branchId`. Key principles:
- **Suggestions**: Prompt AIs to use revision for failures (e.g., thought 1’s Wolfram Alpha failure) and branching for alternatives (e.g., thought 3’s tool switch), countering the log’s linear progression.
- **Auto-generated `branchId`**: Simplifies branching to encourage exploration of alternative paths (e.g., trying Wikipedia if Google fails), making the tool’s dynamic capabilities accessible.
- **Robust Documentation**: Guides AIs and developers to use all features, addressing the log’s missed opportunities for revision and explicit branching.

The refined `index_grok_1.2.ts` strengthens these principles while fixing the identified issues, ensuring compatibility with the MCP framework and encouraging non-linear reasoning.

---


### Changes Made in `index_grok_1.2.ts`

1. **TypeScript Conversion**:
   - Converted to TypeScript (`index_grok_1.2.ts`) to align with your naming preference and Gemini’s format.
   - Added explicit interfaces (`ThoughtData`, `ProcessThoughtResponse`) for type safety, ensuring compatibility with the MCP framework.

2. **Deterministic `branchId` Generation**:
   - Replaced `Date.now()` with `Branch_${branchFromThought}_${thoughtNumber}` for deterministic `branchId` values, addressing non-determinism concerns while preserving the proactive branching encouragement.
   - Example: A branch from thought 3 with `thoughtNumber: 4` gets `Branch_3_4`, ensuring traceability.

3. **Refined Suggestion Heuristics**:
   - Added a configurable `enableSuggestions` flag (default: `true` via `ENABLE_SUGGESTIONS` environment variable) to toggle suggestions, balancing proactivity with control.
   - Improved heuristic by checking prior thought history for failures (e.g., `lastThought?.thought.includes('fail')`), reducing false positives (e.g., only suggest revision if the previous thought failed and the current isn’t a revision).

4. **Enhanced Error Messages**:
   - Included specific values in error messages (e.g., `received ${data.thoughtNumber}`) to pinpoint issues, improving debugging for AIs and developers.

5. **Improved Documentation**:
   - Clarified `needsMoreThoughts`: Added “e.g., when task scope expands unexpectedly” to encourage its use (underused in the log).
   - Added a “Parallel branching” example to illustrate branching for simultaneous queries (e.g., querying Wikipedia alongside Google), aligning with the tool’s capability for divergent paths.
   - Kept Gemini’s refined parameter descriptions (e.g., “correcting, refining, or changing” for `isRevision`) for clarity.

---

### Impact on Gemini CLI AI

The refined `index_grok_1.2.ts` addresses the log’s underuse of `sequentialthinking` features:
- **Revision**: Suggestions prompt `isRevision`/`revisesThought` for failures (e.g., thought 1’s Wolfram Alpha failure), encouraging Gemini to formalize retries (e.g., thought 2) as revisions.
- **Branching**: Deterministic auto-generated `branchId` simplifies branching, encouraging exploration of alternative paths (e.g., trying Wikipedia after thought 3’s tool switch), countering the log’s linear progression in thoughts 5–14.
- **Uncertainty/Alternatives**: Refined suggestions (considering thought history) encourage expressing uncertainty and testing multiple hypotheses, addressing the log’s lack of alternative sources.
- **Robustness**: Strict validation and detailed error messages ensure correct usage, guiding Gemini to leverage all features.

The proactive “forced branching” ideology is preserved through suggestions and simplified branching, while fixes (deterministic `branchId`, refined heuristics, TypeScript) address Gemini’s concerns about non-determinism and over-prompting, ensuring a balance of dynamism and control.

See also: https://github.com/Manamama/servers_forked/tree/main
---

<<<<<<< HEAD
#ver. 2.1
=======
[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40modelcontextprotocol%2Fserver-sequential-thinking%22%5D%7D&quality=insiders)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=sequentialthinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fsequentialthinking%22%5D%7D&quality=insiders)

For manual installation, you can configure the MCP server using one of these methods:

**Method 1: User Configuration (Recommended)**
Add the configuration to your user-level MCP configuration file. Open the Command Palette (`Ctrl + Shift + P`) and run `MCP: Open User Configuration`. This will open your user `mcp.json` file where you can add the server configuration.

**Method 2: Workspace Configuration**
Alternatively, you can add the configuration to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> For more details about MCP configuration in VS Code, see the [official VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/mcp).

For NPX installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

For Docker installation:

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

## Building

Docker:

```bash
docker build -t mcp/sequentialthinking -f src/sequentialthinking/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
>>>>>>> c2d4273f3db5c41f0e005b91aabe1bd31bdbbd9a
