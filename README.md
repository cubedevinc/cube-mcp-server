# Cube MCP Server

A Model Context Protocol (MCP) server that provides chat functionality with Cube's AI agent for analytics and data exploration.

## Features

This MCP server provides:

### Tools
- **chat**: Chat with Cube AI agent for analytics and data exploration (streams real-time responses)

## MCP Client Configuration

### Cursor or Claude Desktop Configuration

For Cursor and Claude Desktop, add this to your MCP settings:

```json
{
  "mcpServers": {
    "cube-mcp-server": {
      "command": "npx",
      "args": ["@cube-dev/mcp-server"],
      "env": {
        "CUBE_CHAT_API_URL": "https://ai.{cloudRegion}.cubecloud.dev/api/v1/public/{accountName}/agents/{agentId}/chat/stream-chat-state",
        "CUBE_API_KEY": "your_api_key_here",
        "USER_ID": "user@example.com"
      }
    }
  }
}
```

#### Obtaining Credentials

* CUBE_CHAT_API_URL - Copy the complete Chat API URL from **Admin → Agents → Click on Agent → Chat API URL field**. This is the full endpoint URL for your agent.
* CUBE_API_KEY - Navigate to **Admin → Agents → Click on Agent → Enable API Key**.
* USER_ID - A unique identifier for the user (e.g., email address or user ID) used for session settings and personalization.

## Cube Chat Examples

Ask questions like "Show me revenue trends" or "What are our top products?" to get real-time analytics responses with data visualizations and SQL queries.

## Architecture

Standard MCP server with tools, resources, and stdio transport. Integrates with Cube's streaming chat API using API key authentication directly and supports user context through external IDs, email, user attributes, groups, and security context. Built with `@modelcontextprotocol/sdk`.

The server uses the Chat API endpoint directly with API key authentication. The Chat API URL should be copied from your agent settings in the Cube admin panel.
