# Model Context Protocol servers - Working Fork

This repository is a FORK of a collection of *reference implementations* for the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP). This fork focuses on providing working and improved versions of key MCP servers, addressing known issues and enhancing functionality.

- **[Everything](src/everything)** - Reference / test server with prompts, resources, and tools
- **[Fetch](src/fetch)** - Web content fetching and conversion for efficient LLM usage
- **[Filesystem](src/filesystem)** - Secure file operations with configurable access controls
- **[Git](src/git)** - Tools to read, search, and manipulate Git repositories
- **[Memory](src/memory)** - Knowledge graph-based persistent memory system
- **[Sequential Thinking](src/sequentialthinking)** - Dynamic and reflective problem-solving through thought sequences
- **[Time](src/time)** - Time and timezone conversion capabilities

## Key Improvements in this Fork

### Sequential Thinking Tool

Significant work has been done on the **Sequential Thinking** tool. Previously, the AI utilizing this tool struggled with branching sufficiently, leading to suboptimal thought processes. Through extensive collaboration and the successful implementation of Grok AI's proposals, this tool has been significantly improved. The updated version, which was directly integrated and is now working effectively in a live environment, provides enhanced validation and proactive guidance, leading to more robust and dynamic problem-solving capabilities.

For a detailed account of the proposals and their current status, please refer to:
[Sequential Thinking Tool Proposals Status](Fork_Updates/Solved/sequential_thinking_tool_proposals_status.md)

### Memory Server

The "Unexpected non-whitespace character after JSON" error encountered when interacting with the Memory API has been successfully debugged and resolved in this fork. This ensures a more stable and reliable persistent memory system.

For more details on the resolution of this issue, please see:
[Memory Server Debugging Resolved](Fork_Updates/Solved/memory_server_debug_resolved.md)

We encourage you to explore these updated implementations and the detailed documentation provided.

#ver. 2.0
