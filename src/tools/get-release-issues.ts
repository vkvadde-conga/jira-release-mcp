/**
 * Tool: Filter and retrieve issues from a release by various criteria
 */

import { JiraClient } from '../jira-client.js';
import { ToolInput } from '../types.js';

export async function getReleaseIssues(
  jiraClient: JiraClient,
  input: ToolInput
): Promise<string> {
  const version = input.version as string;
  const status = input.status as string | undefined;
  const priority = input.priority as string | undefined;
  const issueType = input.issueType as string | undefined;

  if (!version) {
    return 'Error: version parameter is required';
  }

  try {
    let issues = await jiraClient.getIssuesByVersion(version);

    // Apply filters
    if (status) {
      issues = issues.filter((i) => i.fields.status.name.toLowerCase() === status.toLowerCase());
    }

    if (priority) {
      issues = issues.filter(
        (i) => i.fields.priority?.name.toLowerCase() === priority.toLowerCase()
      );
    }

    if (issueType) {
      issues = issues.filter((i) => i.fields.issuetype.name.toLowerCase() === issueType.toLowerCase());
    }

    if (issues.length === 0) {
      const filterStr = [status, priority, issueType].filter(Boolean).join(', ');
      return `No issues found for release **${version}** matching filters: ${filterStr || 'none'}`;
    }

    // Format response
    const formatted = `
**Issues in Release: ${version}**
${status ? `Filter: Status = ${status}` : ''}
${priority ? `Filter: Priority = ${priority}` : ''}
${issueType ? `Filter: Type = ${issueType}` : ''}

Found ${issues.length} issue(s):

${issues
  .map(
    (issue) =>
      `- **${issue.key}**: ${issue.fields.summary}
  - Type: ${issue.fields.issuetype.name}
  - Status: ${issue.fields.status.name}
  - Priority: ${issue.fields.priority?.name || 'Unset'}`
  )
  .join('\n\n')}
    `.trim();

    return formatted;
  } catch (error) {
    return `Error fetching release issues: ${String(error)}`;
  }
}

export const getReleaseIssuesTool = {
  name: 'get_release_issues',
  description:
    'Get issues from a release with optional filters by status, priority, or issue type.',
  inputSchema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'The release version name (required)',
      },
      status: {
        type: 'string',
        description: 'Filter by issue status (e.g., "To Do", "In Progress", "Done")',
      },
      priority: {
        type: 'string',
        description: 'Filter by priority (e.g., "Critical", "High", "Medium", "Low")',
      },
      issueType: {
        type: 'string',
        description: 'Filter by issue type (e.g., "Bug", "Story", "Task")',
      },
    },
    required: ['version'],
  },
};