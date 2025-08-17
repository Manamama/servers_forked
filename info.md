# Gemini CLI and MCP Roots Protocol

As of the current date (July 28, 2025), the Gemini CLI does not support the "MCP Roots" protocol for dynamically updating allowed directories for filesystem servers.

This conclusion was reached after consulting the following documentation:

1.  **`gemini-cli/docs/tools/mcp-server.md`**: This internal documentation details the architecture and configuration of MCP servers within the Gemini CLI. It describes various transport mechanisms and configuration properties but does not mention any client-side functionality for the "Roots" protocol.
2.  **Context7 documentation for "Gemini CLI"**: A thorough search of the Context7 materials for the `/google-gemini/gemini-cli` library, specifically looking for information related to "Roots" or dynamic directory access, yielded no relevant results.

Therefore, while some MCP filesystem servers (like the `mcp-server-filesystem`) may support the "Roots" protocol, the Gemini CLI currently requires allowed directories to be explicitly defined via command-line arguments in the `settings.json` configuration.

---

## Configuration Attempts for Filesystem MCP Server

We have attempted to configure the `filesystem` MCP server in `settings.json` with the following approaches:

1.  **Initial `npx` command with variable expansion (`${workspaceFolder}`, `~/Downloads`):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "npx",
          "args": [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "${workspaceFolder}",
            "~/Downloads"
          ]
        }
        ```
    *   **Outcome:** The server remained disconnected, indicating that `npx` did not correctly expand these variables or pass them as absolute paths to the `mcp-server-filesystem`.

2.  **Direct `mcp-server-filesystem` command with variable expansion (`${workspaceFolder}`, `${HOME}/Downloads`):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "mcp-server-filesystem",
          "stdio": true,
          "args": [
            "${workspaceFolder}",
            "${HOME}/Downloads"
          ]
        }
        ```
    *   **Outcome:** The server remained disconnected. This suggests that even when directly calling `mcp-server-filesystem`, the Gemini CLI's variable expansion for `args` might not be occurring as expected, or there's another underlying issue preventing the server from connecting with these paths.

3.  **Tactical Hardcoded Paths (Working Configuration in `/home/zezen/Downloads/GitHub/servers_forked/gemini_settings_global_link/settings.json`):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "mcp-server-filesystem",
          "stdio": true,
          "args": [
            "/home/zezen/Downloads/GitHub/servers_forked",
            "/home/zezen/Downloads"
          ]
        }
        ```
    *   **Outcome:** This variant (hardcoded, tactical) works as it should. The server now connects and its tools are available.

4.  **Experiment: Partial Variable Expansion (`${workspaceFolder}` for project root):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "mcp-server-filesystem",
          "stdio": true,
          "args": [
            "${workspaceFolder}",
            "/home/zezen/Downloads"
          ]
        }
        ```
    *   **Outcome:** `filesystem - Disconnected (0 tools cached)`. The server is disconnected, and no tools are available. This indicates that the `${workspaceFolder}` variable is not being correctly expanded or passed to the server.

5.  **Experiment: Partial Variable Expansion (`${HOME}` for Downloads):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "mcp-server-filesystem",
          "stdio": true,
          "args": [
            "/home/zezen/Downloads/GitHub/servers_forked",
            "${HOME}/Downloads"
          ]
        }
        ```
    *   **Outcome:** `filesystem - Ready (12 tools)`. The server is connected and all tools are available. This indicates that the `${HOME}` variable is correctly expanded, but `${workspaceFolder}` is not.

6.  **Experiment: Dynamic Variable Expansion (`${PWD}` for project root):**
    *   **Configuration:**
        ```json
        "filesystem": {
          "command": "mcp-server-filesystem",
          "stdio": true,
          "args": [
            "${PWD}",
            "${HOME}/Downloads"
          ]
        }
        ```
    *   **Outcome:** `filesystem - Ready (12 tools)`. The server is connected and all tools are available. This confirms that `${PWD}` is successfully expanded by the Gemini CLI, making it a reliable variable for dynamically setting the project root directory.

---

## Variable Expansion in `settings.json`

Based on the documentation in `gemini-cli/docs/tools/mcp-server.md`, the `mcpServers` configuration in `settings.json` only supports environment variable expansion (e.g., `${HOME}`, `${PWD}`) within the `args` and `env` fields.

The variable `${workspaceFolder}` is not a standard environment variable and is therefore not expanded by the Gemini CLI. This is why configurations using `${workspaceFolder}` fail, while configurations using `${HOME}` succeed.

---

## Filesystem Tool Testing

The following 12 filesystem tools were tested and are confirmed to be working correctly in both the project directory (`/home/zezen/Downloads/GitHub/servers_forked`) and a non-subfolder directory (`/home/zezen/Downloads`):

*   `create_directory`
*   `directory_tree`
*   `edit_file`
*   `get_file_info`
*   `list_allowed_directories`
*   `filesystem__list_directory`
*   `list_directory_with_sizes`
*   `move_file`
*   `filesystem__read_file`
*   `read_multiple_files`
*   `search_files`
*   `filesystem__write_file`

### Learning and Corrections

During testing, I encountered initial errors with the `edit_file` and `search_files` tools.

*   **A. Initial Errors:**
    *   `edit_file`: I initially provided the `edits` as separate `new_string` and `old_string` parameters, which was incorrect.
    *   `search_files`: I used a `query` parameter instead of the correct `pattern` parameter.

*   **B. Correction Process:**
    *   For `edit_file`, I learned that the `edits` parameter expects a list of JSON objects, each with `oldText` and `newText` keys.
    *   For `search_files`, I corrected the call to use the `pattern` parameter to specify the search pattern.

*   **C. Suggested Tool Improvements:**
    *   To prevent these types of errors, the tool documentation should include clear, copy-pastable JSON snippets for each parameter, especially for complex data structures like the `edits` parameter in `edit_file`. For example:
        ```json
        "edits": [
          {
            "oldText": "text to be replaced",
            "newText": "replacement text"
          }
        ]
        ```

### Most Useful Functions

Based on the testing, the following functions are likely to be the most useful:

*   **Core File Operations:**
    *   `create_directory`: Essential for creating new folders.
    *   `filesystem__write_file`: For creating or overwriting files with new content.
    *   `filesystem__read_file`: For reading the contents of a file.
    *   `move_file`: For renaming or moving files and directories.
    *   `directory_tree`: For getting a recursive view of a directory's structure.
*   **Advanced Editing:**
    *   `edit_file`: A powerful tool for making targeted changes within a file, despite my initial error. It's particularly useful for precise modifications.
*   **File Discovery:**
    *   `search_files`: Useful for finding files by name or pattern, which is a common task.
