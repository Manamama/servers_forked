# Knowledge Graph Memory Server

This server provides a persistent memory for AI agents using a local knowledge graph. It allows agents to remember information across interactions by storing entities, relations, and observations.

## Knowledge Graph Visualization

This server now includes a built-in web-based visualizer for the knowledge graph. This allows you to see a live, interactive diagram of the entities and relations stored in `memory.jsonl`.

### How to Use:

1.  **Start the Memory Server:** The visualization server runs alongside the main memory server. So, simply start the memory server as you normally would.

2.  **Open in Browser:** Once the server is running, open your web browser and navigate to `http://localhost:4000/` (or the port reported in the server's console output if 4000 is busy).

    The page will display a Mermaid diagram of your knowledge graph. The diagram will automatically refresh every 5 seconds. If the memory server is not active, the page will simply show the last successful visualization until the server becomes active again.

## Building and Usage

To build the server:

```bash
npm run build
```

To run tests:

```bash
npm test
```
