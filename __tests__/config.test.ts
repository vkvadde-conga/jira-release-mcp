import { loadConfig, validateConfig } from '../src/config';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should throw error when JIRA_URL is missing', () => {
      delete process.env.JIRA_URL;
      process.env.JIRA_API_TOKEN = 'test_token';
      process.env.JIRA_PROJECT_KEY = 'PROJ';

      expect(() => loadConfig()).toThrow('JIRA_URL environment variable is required');
    });

    it('should throw error when JIRA_API_TOKEN is missing', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      delete process.env.JIRA_API_TOKEN;
      process.env.JIRA_PROJECT_KEY = 'PROJ';

      expect(() => loadConfig()).toThrow('JIRA_API_TOKEN environment variable is required');
    });

    it('should load config with default criteria', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_API_TOKEN = 'test_token_1234567890';
      process.env.JIRA_PROJECT_KEY = 'PROJ';
      delete process.env.RELEASE_CONFIG;

      const config = loadConfig();
      expect(config.jiraUrl).toBe('https://test.atlassian.net');
      expect(config.projectKey).toBe('PROJ');
      expect(config.releaseCriteria.blockingStatuses).toContain('To Do');
    });

    it('should load custom release criteria', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_API_TOKEN = 'test_token_1234567890';
      process.env.JIRA_PROJECT_KEY = 'PROJ';
      process.env.RELEASE_CONFIG = JSON.stringify({
        blockingStatuses: ['Custom Status'],
        blockingIssueTypes: ['Custom Type'],
      });

      const config = loadConfig();
      expect(config.releaseCriteria.blockingStatuses).toContain('Custom Status');
      expect(config.releaseCriteria.blockingIssueTypes).toContain('Custom Type');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = {
        jiraUrl: 'https://test.atlassian.net',
        jiraToken: 'test_token_1234567890',
        projectKey: 'PROJ',
        releaseCriteria: {},
        logLevel: 'info' as const,
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw error on invalid URL', () => {
      const config = {
        jiraUrl: 'invalid-url',
        jiraToken: 'test_token_1234567890',
        projectKey: 'PROJ',
        releaseCriteria: {},
        logLevel: 'info' as const,
      };

      expect(() => validateConfig(config)).toThrow();
    });

    it('should throw error on short token', () => {
      const config = {
        jiraUrl: 'https://test.atlassian.net',
        jiraToken: 'short',
        projectKey: 'PROJ',
        releaseCriteria: {},
        logLevel: 'info' as const,
      };

      expect(() => validateConfig(config)).toThrow();
    });
  });
});
