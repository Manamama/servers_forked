# Fix Memory Server Configuration - Requirements Document

ver. 1.2, User's notes, Gemini's format updates

This specification outlines the steps to fix the non-functional `mcp-server-memory` by updating the local version of the server, compiling it, adapting the environment and verifying its functionality, to  resolve the persistent JSON parsing error.

## User Stories

- As a developer, I want the `mcp-server-memory` toolset to be functional, so that Gemini AI can rely on graph-based memory tool (function call, MCP). 
- As Gemini AI, I want to execute memory-related commands without encountering parsing errors, so that I can interact with the system's knowledge graph.

## Acceptance Criteria



- [ ] The `settings.json` file for the project is located and its contents are read.
- [ ] Code is fixed, including version number (e.g. date can be used)
- [ ] Code is unit tested, against the current settings in  The `settings.json` file
- [ ] Code is fully tested, before install
- [ ] A test command (e.g., `create_entities`) can be sent to the `mcp-server-memory` tool without returning a JSON parsing error.
- [ ] The test command is successfully executed (e.g., an entity is created and can be read from the graph).



- [ ] Code is (re)installed into MCP. 
- [ ] A test command (e.g., `create_entities`) can be sent to the `mcp-server-memory` tool without returning a JSON parsing error.
- [ ] The test command is successfully executed (e.g., an entity is created and can be read from the graph).



## Non-functional Requirements
- **Configuration:** The change should NOT be isolated to the `settings.json` configuration file. Code very likely needs refixing too

