/**
 * Tool: Check if a release meets all criteria
 */

import { JiraClient } from '../jira-client.js';
import { ReleaseValidator } from '../release-validator.js';
import { ToolInput } from '../types.js';

export async function checkReleaseCriteria(
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
      return `No issues found for release **${version}**. Unable to validate criteria.`;
    }

    const result = validator.checkRelease(version, issues);

    // Build response
    let response = `
**Release Readiness Check: ${version}**

${result.isReady ? '✅ **READY FOR RELEASE**' : '❌ **NOT READY FOR RELEASE**'}

**Criteria Check Results:**
${result.checks
  .map((check) => `${check.passed ? '✅' : '❌'} ${check.name}: ${check.details}`)
  .join('\n')}
    `.trim();

    // Add blocking issues if any
    if (result.blockingIssues.length > 0) {
      response += `\n\n**🔴 Blocking Issues (${result.blockingIssues.length}):**\n`;
      response += result.blockingIssues
        .map((issue) => `- ${issue.key}: ${issue.fields.summary} (${issue.fields.status.name})`)
        .join('\n');
    }

    // Add warnings if any
    if (result.warnings.length > 0) {
      response += `\n\n**⚠️ Warnings:**\n`;
      response += result.warnings.map((w) => `- ${w}`).join('\n');
    }

    return response;
  } catch (error) {
    return `Error checking release criteria: ${String(error)}`;
  }
}

export const checkReleaseCriteriaTool = {
  name: 'check_release_criteria',
  description:
    'Check if a release meets all defined criteria for readiness. Validates blockers, critical issues, completeness, and required fields.',
  inputSchema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'The release version name to check (e.g., "v2.5.0", "Q3-2024")',
      },
    },
    required: ['version'],
  },
};