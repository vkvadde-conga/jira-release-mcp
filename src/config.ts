/**
 * Configuration loader
 * Loads and validates environment variables and release criteria
 */

import { ReleaseCriteria } from './types.js';

const DEFAULT_RELEASE_CRITERIA: ReleaseCriteria = {
  blockingStatuses: ['To Do', 'In Progress'],
  blockingIssueTypes: ['Blocker', 'Critical Bug'],
  requiredFields: [],
  minApprovals: 0,
  testCaseFieldId: undefined,
};

export function loadConfig() {
  // Load and validate environment variables
  const jiraUrl = process.env.JIRA_URL;
  const jiraToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!jiraUrl) {
    throw new Error('JIRA_URL environment variable is required');
  }

  if (!jiraToken) {
    throw new Error('JIRA_API_TOKEN environment variable is required');
  }

  if (!projectKey) {
    throw new Error('JIRA_PROJECT_KEY environment variable is required');
  }

  // Load release criteria from env or use defaults
  let releaseCriteria = DEFAULT_RELEASE_CRITERIA;

  if (process.env.RELEASE_CONFIG) {
    try {
      const customCriteria = JSON.parse(process.env.RELEASE_CONFIG);
      releaseCriteria = { ...DEFAULT_RELEASE_CRITERIA, ...customCriteria };
    } catch (error) {
      console.warn('Failed to parse RELEASE_CONFIG, using defaults:', error);
    }
  }

  return {
    jiraUrl,
    jiraToken,
    projectKey,
    releaseCriteria,
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  };
}

/**
 * Validate Jira configuration
 */
export function validateConfig(config: ReturnType<typeof loadConfig>): boolean {
  try {
    new URL(config.jiraUrl);
    if (config.jiraToken.length < 10) {
      throw new Error('JIRA_API_TOKEN appears to be invalid (too short)');
    }
    if (!/^[A-Z]+$/.test(config.projectKey)) {
      console.warn(
        'Project key should be uppercase letters. This may cause issues: ' + config.projectKey
      );
    }
    return true;
  } catch (error) {
    throw new Error(`Invalid configuration: ${String(error)}`);
  }
}
