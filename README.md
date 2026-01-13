# Cube MCP Server

A Model Context Protocol (MCP) server that provides chat functionality with Cube's AI agent for analytics and data exploration.

## Features

This MCP server provides:

### Tools
- **chat**: Chat with Cube AI agent for analytics and data exploration (streams real-time responses)

## MCP Client Configuration

### Cursor or Claude Desktop Configuration

For Cursor and Claude Desktop, add this to your MCP settings:

#### For Internal Cube Cloud Users

```json
{
  "mcpServers": {
    "cube-mcp-server": {
      "command": "npx",
      "args": ["@cube-dev/mcp-server"],
      "env": {
        "CUBE_CHAT_API_URL": "https://ai.{cloudRegion}.cubecloud.dev/api/v1/public/{accountName}/agents/{agentId}/chat/stream-chat-state",
        "CUBE_API_KEY": "your_api_key_here",
        "INTERNAL_USER_ID": "analyst@yourcompany.com"
      }
    }
  }
}
```

#### For External Users

```json
{
  "mcpServers": {
    "cube-mcp-server": {
      "command": "npx",
      "args": ["@cube-dev/mcp-server"],
      "env": {
        "CUBE_CHAT_API_URL": "https://ai.{cloudRegion}.cubecloud.dev/api/v1/public/{accountName}/agents/{agentId}/chat/stream-chat-state",
        "CUBE_API_KEY": "your_api_key_here",
        "EXTERNAL_USER_ID": "user-123"
      }
    }
  }
}
```

#### Obtaining Credentials

* **CUBE_CHAT_API_URL** - Copy the complete Chat API URL from **Admin → Agents → Click on Agent → Chat API URL field**. This is the full endpoint URL for your agent.
* **CUBE_API_KEY** - Navigate to **Admin → Agents → Click on Agent → Enable API Key**.
* **User Identity** (choose one):
  * **INTERNAL_USER_ID** - Email address of an existing Cube Cloud user. Use this for internal team members who already have Cube Cloud accounts. The user's existing permissions and settings will be used.
  * **EXTERNAL_USER_ID** - A unique identifier for external/third-party users (e.g., "user-123", "customer@external.com"). Use this when you need to provide custom user attributes, groups, or row-level security settings.

## Cube Chat Examples

Ask questions like "Show me revenue trends" or "What are our top products?" to get real-time analytics responses with data visualizations and SQL queries.

## Architecture

Standard MCP server with tools, resources, and stdio transport. Integrates with Cube's streaming chat API using API key authentication and supports two types of user authentication:

- **Internal Users**: Existing Cube Cloud users authenticated by their email address. They use their configured permissions and settings from Cube Cloud.
- **External Users**: Third-party users with custom identifiers, allowing for dynamic user attributes, groups, and row-level security configuration.

Built with `@modelcontextprotocol/sdk`. The Chat API URL should be copied from your agent settings in the Cube admin panel.
