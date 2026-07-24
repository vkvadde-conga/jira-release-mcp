#!/usr/bin/env node

/**
 * Jira Release Criteria Checker - MCP Server
 *
 * Provides tools to check release readiness in Jira against defined criteria.
 * Implements the Model Context Protocol for communication with Claude and other AI models.
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadConfig, validateConfig } from './config.js';
import { JiraClient } from './jira-client.js';
import { ReleaseValidator } from './release-validator.js';
import { listReleases, listReleasesTool } from './tools/list-releases.js';
import { getReleaseStatus, getReleaseStatusTool } from './tools/get-release-status.js';
import { checkReleaseCriteria, checkReleaseCriteriaTool } from './tools/check-release-criteria.js';
import { getReleaseIssues, getReleaseIssuesTool } from './tools/get-release-issues.js';
import { ToolInput } from './types.js';

// Load configuration
const config = loadConfig();
validateConfig(config);

// Initialize Jira client and validator
const jiraClient = new JiraClient(config.jiraUrl, config.jiraToken, config.projectKey);
const validator = new ReleaseValidator(config.releaseCriteria);

// Initialize MCP server
const server = new Server(
  {
    name: 'jira-release-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      listReleasesTool,
      getReleaseStatusTool,
      checkReleaseCriteriaTool,
      getReleaseIssuesTool,
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request;
  const input = args as ToolInput;

  let result: string;

  try {
    switch (name) {
      case 'list_releases':
        result = await listReleases(jiraClient, input);
        break;

      case 'get_release_status':
        result = await getReleaseStatus(jiraClient, validator, input);
        break;

      case 'check_release_criteria':
        result = await checkReleaseCriteria(jiraClient, validator, input);
        break;

      case 'get_release_issues':
        result = await getReleaseIssues(jiraClient, input);
        break;

      default:
        result = `Unknown tool: ${name}`;
    }
  } catch (error) {
    result = `Error executing tool: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: result,
      } as TextContent,
    ],
  };
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();

  console.error('[Jira Release MCP] Starting server...');
  console.error(`[Jira Release MCP] Project: ${config.projectKey}`);
  console.error(`[Jira Release MCP] Validating Jira connection...`);

  try {
    const isValid = await jiraClient.validateConnection();
    if (!isValid) {
      throw new Error('Failed to connect to Jira. Check your credentials.');
    }
    console.error('[Jira Release MCP] ✓ Jira connection valid');
  } catch (error) {
    console.error(`[Jira Release MCP] ✗ Connection validation failed: ${String(error)}`);
    process.exit(1);
  }

  await server.connect(transport);
  console.error('[Jira Release MCP] Server started successfully');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});