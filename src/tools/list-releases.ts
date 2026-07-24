/**
 * Tool: List all releases in the project
 */

import { JiraClient } from '../jira-client.js';
import { ToolInput } from '../types.js';

export async function listReleases(jiraClient: JiraClient, _input: ToolInput): Promise<string> {
  try {
    const versions = await jiraClient.getVersions();

    if (versions.length === 0) {
      return 'No releases found in this project.';
    }

    // Format releases for display
    const formatted = versions
      .map(
        (v) =>
          `• **${v.version}** ${v.released ? '(Released)' : '(Unreleased)'}${v.releaseDate ? ` - ${v.releaseDate}` : ''}`
      )
      .join('\n');

    return `Found ${versions.length} release(s):\n\n${formatted}`;
  } catch (error) {
    return `Error listing releases: ${String(error)}`;
  }
}

export const listReleasesTool = {
  name: 'list_releases',
  description:
    'List all available releases (versions) in the Jira project. Shows active and upcoming releases.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};