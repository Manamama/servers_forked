### Master Plan: Live Knowledge Graph Visualizer (Final)

1.  **Goal:** Integrate a simple, web-based visualizer directly into the existing `memory-server`.

2.  **Architecture & Lifecycle:**
    *   **No New Dependencies:** The solution will use only the built-in Node.js `http` module.
    *   **Ephemeral, Integrated HTTP Server:** A lightweight HTTP server will be launched from the `main` function in `index.ts`. It will only be active when the main `memory-server` process is awake.
    *   **Dynamic Port:** The server will find and use an available port, starting from 4000, to avoid conflicts.

3.  **Implementation:**
    *   When a browser requests the server's URL, the server will, in that moment:
        1.  Read the `memory.jsonl` file.
        2.  Generate a Mermaid.js diagram string from the file's content.
        3.  Construct a self-contained HTML page as a string.
        4.  This HTML will include the Mermaid.js library (from a CDN) and a meta-refresh tag (e.g., every 5 seconds).
        5.  The complete HTML page is sent as the response.

4.  **User Experience (The "Live" Effect):**
    *   The user opens the visualizer URL in a browser.
    *   The browser gets the page and starts auto-refreshing.
    *   Most refresh attempts will fail because the server is not running.
    *   When the user performs an action that wakes up the `memory-server`, the next browser refresh will succeed, displaying the updated graph.

---

### Lessons Learned

1.  **MCP Server Lifecycle:** MCP servers like `mcp-server-memory` are not persistent daemons. They are ephemeral processes, activated on-demand by the Gemini CLI for a specific tool call. Any integration must be designed around this temporary, on-demand lifecycle.

2.  **Leverage the Browser:** The browser is a persistent environment. A server can deliver a self-contained application (HTML with JavaScript and meta-refresh tags) in a single response. The browser can then handle tasks like polling or refreshing, simplifying the server-side logic immensely. An ephemeral server can still provide a "live" experience.

3.  **Collaboration & Planning:**
    *   A plan is a tool for alignment, not a bureaucratic step. It's essential for ensuring we agree on the goal and the path before execution.
    *   My role is to execute an approved plan autonomously, not to ask for permission at every sub-step. Rushing to execute without a clear, shared understanding is wrong, as is rigidly following a plan when new information emerges. The plan must be a living document, adapted through conversation.
