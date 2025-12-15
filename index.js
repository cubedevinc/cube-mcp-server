#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export class CubeD3MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "@cube-dev/mcp-server",
        version: "1.2.2",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Configuration for Cube API - these should be provided via environment variables
    this.cubeConfig = {
      chatApiUrl: process.env.CUBE_CHAT_API_URL, // Full Chat API URL from Admin → Agents → Chat API URL field
      apiKey: process.env.CUBE_API_KEY, // API Key from Admin → Agents → API Key
      externalId: process.env.USER_ID, // External user ID for session settings
    };

    this.setupHandlers();
  }

  // Stream chat with Cube AI agent
  async streamCubeChat(chatId, input, externalId = null, userAttributes = [], groups = null) {
    if (!this.cubeConfig.chatApiUrl) {
      throw new Error("Cube Chat API URL not configured. Set CUBE_CHAT_API_URL environment variable. Copy it from Admin → Agents → Chat API URL field.");
    }

    if (!this.cubeConfig.apiKey) {
      throw new Error("Cube API key not configured. Set CUBE_API_KEY environment variable.");
    }

    // Use provided externalId or fall back to configured one
    const userExternalId = externalId || this.cubeConfig.externalId;
    if (!userExternalId) {
      throw new Error("External ID not provided. Set USER_ID environment variable or provide externalId parameter.");
    }

    // Build sessionSettings object
    const sessionSettings = {
      externalId: userExternalId,
      ...(userAttributes.length > 0 && { userAttributes }),
      ...(groups && groups.length > 0 && { groups }),
    };

    // Build request body
    const body = {
      ...(input && { input }),
      ...(chatId && { chatId }),
      sessionSettings,
    };
    
    const response = await fetch(this.cubeConfig.chatApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${this.cubeConfig.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cube API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  }

  setupHandlers() {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: "@cube-dev/mcp-server",
          version: "1.2.2",
        },
      };
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "chat",
          description: "Chat with Cube AI agent for analytics and data exploration. Returns streaming response with AI insights, tool calls, and data visualizations.",
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Your question or request for the Cube AI agent (e.g., 'Show me revenue trends for the last 6 months')",
              },
            },
            required: ["message"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "chat":
          try {
            const response = await this.streamCubeChat(
              undefined,
              args.message,
              undefined,
              [],
              undefined
            );
            
            let streamContent = "";
            let allMessages = [];
            
            // Read the streaming response using Node.js streams
            let buffer = "";
            
            for await (const chunk of response.body) {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              
              // Keep the last incomplete line in buffer
              buffer = lines.pop() || "";
              
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const message = JSON.parse(line);
                    allMessages.push(message);
                    
                    // Accumulate assistant content (handle both delta and non-delta messages)
                    if (message.role === 'assistant' && message.content) {
                      if (message.isDelta) {
                        // Delta messages are incremental updates
                        streamContent += message.content;
                      } else {
                        // Non-delta messages are complete content
                        streamContent += message.content + '\n';
                      }
                    }
                    
                    // Add tool call information
                    if (message.toolCall) {
                      const toolInfo = `\n🔧 Tool Call: ${message.toolCall.name}`;
                      if (message.toolCall.result) {
                        streamContent += `${toolInfo} - Completed\n`;
                      } else {
                        streamContent += `${toolInfo} - In Progress\n`;
                      }
                    }
                  } catch (parseError) {
                    console.error('Failed to parse message:', parseError, 'Line:', line);
                  }
                }
              }
            }
            
            // Process any remaining buffer content
            if (buffer.trim()) {
              try {
                const message = JSON.parse(buffer);
                allMessages.push(message);
                if (message.role === 'assistant' && message.content) {
                  if (message.isDelta) {
                    streamContent += message.content;
                  } else {
                    streamContent += message.content + '\n';
                  }
                }
              } catch (parseError) {
                console.error('Failed to parse final message:', parseError);
              }
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: streamContent || "Chat completed with no visible content",
                },
              ],
            };
            
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ Error calling Cube API: ${error.message}\n\nPlease ensure your environment variables are set:\n- CUBE_CHAT_API_URL: Full Chat API URL from Admin → Agents → Chat API URL field\n- CUBE_API_KEY: Your API key from Admin → Agents → API Key\n- USER_ID: External user ID for session settings (e.g., "user@example.com")`,
                },
              ],
            };
          }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "info://server",
          mimeType: "text/plain",
          name: "Server Information",
          description: "Basic information about this MCP server",
        },
        {
          uri: "config://example",
          mimeType: "application/json",
          name: "Example Configuration",
          description: "Example configuration data",
        },
      ],
    }));

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "info://server":
          return {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                                  text: "Cube MCP Server\\nVersion: 1.2.1\\nCreated for Cube.js enterprise examples\\n\\nThis server provides chat functionality for analytics and data exploration with Cube AI.",
              },
            ],
          };

        case "config://example":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({
                  serverName: "@cube-dev/mcp-server",
                  version: "1.2.2",
                  features: ["chat"],
                  description: "A Cube MCP server for analytics and data exploration",
                }, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Cube MCP Server running on stdio");
  }
}

// Start the server
const server = new CubeD3MCPServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});