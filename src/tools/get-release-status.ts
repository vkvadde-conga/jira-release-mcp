/**
 * Tool: Get detailed status of a specific release
 */

import { JiraClient } from '../jira-client.js';
import { ReleaseValidator } from '../release-validator.js';
import { ToolInput } from '../types.js';

export async function getReleaseStatus(
  jiraClient: JiraClient,
  validator: ReleaseValidator,
  input: ToolInput
): Promise<string> {
  const version = input.version as string;

  if (!version) {
    return 'Error: version parameter is required';
  }

  try {
    const issues = await jiraClient.getIssuesByVersion(version);

    if (issues.length === 0) {
      return `No issues found for release **${version}**.`;
    }

    const summary = validator.getIssueSummary(issues);

    const formatted = `
**Release: ${version}**

📊 **Issue Summary:**
- Total: ${summary.total}
- ✅ Done: ${summary.done}
- 🔄 In Progress: ${summary.inProgress}
- 📝 To Do: ${summary.todo}
- 🔴 Critical: ${summary.critical}

**Issue Breakdown:**
${issues
  .map(
    (issue) =>
      `- [${issue.key}](https://your-jira.atlassian.net/browse/${issue.key}): ${issue.fields.summary} (${issue.fields.status.name})`
  )
  .join('\n')}
    `.trim();

    return formatted;
  } catch (error) {
    return `Error fetching release status: ${String(error)}`;
  }
}

export const getReleaseStatusTool = {
  name: 'get_release_status',
  description:
    'Get detailed status of a specific release including all associated issues, their statuses, and a summary.',
  inputSchema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'The release version name (e.g., "v2.5.0", "Q3-2024")',
      },
    },
    required: ['version'],
  },
};