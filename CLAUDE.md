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
2. **Authentication Flow**: Three-step authentication process:
   - API key → Session ID (via `/api/v1/embed/generate-session`)
   - Session ID → Bearer token (via `/api/v1/embed/session/token`)
   - Bearer token → Chat API access
3. **Streaming Chat**: Processes newline-delimited JSON streaming responses from Cube's AI agent

### Authentication Architecture

The server uses a session-based authentication system:
- **API Key**: Long-lived credential from Cube admin panel (stored in `CUBE_API_KEY`)
- **Deployment ID**: Identifies the specific deployment (stored in `CUBE_DEPLOYMENT_ID`)
- **Session Generation**: Creates a session with deployment ID, external user ID, and optional user attributes for personalization/RLS
- **Token Exchange**: Converts the session into a short-lived bearer token (also requires deployment ID)
- **Chat Authorization**: Uses the bearer token to access the streaming chat API

### Environment Variables

Required configuration:
- `CUBE_API_KEY`: API key from Admin → Agents → API Key
- `CUBE_TENANT_NAME`: Tenant name from URL (e.g., 'acme' in acme.cubecloud.dev)
- `CUBE_DEPLOYMENT_ID`: Deployment ID from Admin → Settings
- `CUBE_AGENT_ID`: Agent ID from Admin → Agents panel
- `USER_ID`: External user ID for session generation (e.g., email or user ID)

Optional:
- `CUBE_AUTH_BASE_URL`: Override auth endpoint (defaults to https://{tenant}.cubecloud.dev)

### API Endpoints

**Chat Base URL**: `https://ai-engineer.cubecloud.dev` (hardcoded)
**Auth Base URL**: `https://{tenant}.cubecloud.dev` (configurable via env)

Key endpoints:
- `POST /api/v1/embed/generate-session` - Generate session from API key
- `POST /api/v1/embed/session/token` - Exchange session for token
- `POST /api/v1/public/{tenant}/agents/{agentId}/chat/stream-chat-state` - Streaming chat

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
- Optional: `chatId` (generated if not provided), `externalId` (overrides USER_ID), `userAttributes` (array of {name, value} for RLS)
- Returns: Streaming response with AI insights, tool calls, and metadata

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
