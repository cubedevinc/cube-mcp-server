# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides chat functionality with Cube's AI agent for analytics and data exploration. It's published as `@cube-dev/mcp-server` on npm and designed to be used with MCP clients like Claude Desktop and Cursor.

## Development Commands

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## Architecture

### Core Components

**index.js** - The main MCP server implementation containing the `CubeD3MCPServer` class. This is a single-file application that handles:

1. **MCP Protocol**: Built on `@modelcontextprotocol/sdk` with stdio transport
2. **Authentication**: Direct API key authentication with session settings for user identity
3. **Streaming Chat**: Processes newline-delimited JSON streaming responses from Cube's AI agent

### Authentication Architecture

The server uses a session-based authentication system with support for both external and internal users:
- **API Key**: Long-lived credential from Cube admin panel (stored in `CUBE_API_KEY`)
- **User Identity**: Either external user ID or internal user ID (email)
  - **External Users** (`externalId`): Third-party users with custom attributes, groups, and RLS settings
  - **Internal Users** (`internalId`): Existing Cube users authenticated by email, using their configured permissions
- **Session Generation**: Creates a session with the appropriate user identity
- **Chat Authorization**: Uses API key authentication to access the streaming chat API

### Environment Variables

Required configuration:
- `CUBE_CHAT_API_URL`: Full Chat API URL from Admin → Agents → Chat API URL field
- `CUBE_API_KEY`: API key from Admin → Agents → API Key

User identity (one of these is required):
- `EXTERNAL_USER_ID`: External user ID for third-party users (e.g., "user-123", "customer@external.com"). Allows custom userAttributes and groups for row-level security.
- `INTERNAL_USER_ID`: Internal user email for existing Cube users (e.g., "analyst@company.com"). Uses the user's existing permissions in Cube.

### Stream Processing

The chat tool processes newline-delimited JSON responses with the following message structure:
- `role`: Message role (assistant, etc.)
- `content`: Message content text
- `isDelta`: Whether this is a delta update
- `toolCall`: Information about tool executions (name, result)

The stream processor:
1. Buffers incomplete lines
2. Parses each complete JSON line
3. Accumulates non-delta assistant content
4. Extracts and displays tool call information
5. Returns formatted response with session metadata

### MCP Tools

**chat** - Primary tool for interacting with Cube AI agent
- Required: `message` (user question/request)
- Optional parameters:
  - `externalId`: External user ID (overrides EXTERNAL_USER_ID env var)
  - `internalId`: Internal user email (overrides INTERNAL_USER_ID env var)
  - `userAttributes`: Array of {name, value} for row-level security (only valid with externalId)
  - `groups`: Array of group names for authorization (only valid with externalId)
- Returns: Streaming response with AI insights, tool calls, and metadata
- Note: Either `externalId` or `internalId` must be provided (via parameter or env var), but not both

### MCP Resources

- `info://server` - Server information
- `config://example` - Example configuration data

## Testing the Server

To test locally with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node index.js
```

Set environment variables in a `.env` file before running.

## Publishing

The package is configured for npm distribution:
- Entry point: `index.js` (executable via `bin: mcp-server`)
- Published files: `index.js`, `README.md`
- Requires: Node.js >= 18.0.0
