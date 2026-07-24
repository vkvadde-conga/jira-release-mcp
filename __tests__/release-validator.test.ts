import { JiraClient } from '../src/jira-client';
import { ReleaseValidator } from '../src/release-validator';
import { ReleaseCriteria } from '../src/types';

describe('ReleaseValidator', () => {
  let validator: ReleaseValidator;
  const mockCriteria: ReleaseCriteria = {
    blockingStatuses: ['To Do', 'In Progress'],
    blockingIssueTypes: ['Blocker', 'Critical Bug'],
    requiredFields: [],
    minApprovals: 0,
  };

  beforeEach(() => {
    validator = new ReleaseValidator(mockCriteria);
  });

  describe('checkRelease', () => {
    it('should mark release as ready when all issues are done', () => {
      const mockIssues = [
        {
          key: 'PROJ-1',
          fields: {
            summary: 'Test issue',
            status: { name: 'Done' },
            issuetype: { name: 'Story' },
            priority: { name: 'High' },
          },
        },
      ];

      const result = validator.checkRelease('v1.0.0', mockIssues);
      expect(result.isReady).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it('should mark release as not ready when blocker issues exist', () => {
      const mockIssues = [
        {
          key: 'PROJ-1',
          fields: {
            summary: 'Critical blocker',
            status: { name: 'To Do' },
            issuetype: { name: 'Blocker' },
            priority: { name: 'Critical' },
          },
        },
      ];

      const result = validator.checkRelease('v1.0.0', mockIssues);
      expect(result.isReady).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThan(0);
    });

    it('should detect critical unresolved issues', () => {
      const mockIssues = [
        {
          key: 'PROJ-1',
          fields: {
            summary: 'Critical issue',
            status: { name: 'In Progress' },
            issuetype: { name: 'Story' },
            priority: { name: 'Critical' },
          },
        },
      ];

      const result = validator.checkRelease('v1.0.0', mockIssues);
      const criticalCheck = result.checks.find((c) => c.name === 'No Critical Unresolved Issues');
      expect(criticalCheck?.passed).toBe(false);
    });
  });

  describe('getIssueSummary', () => {
    it('should count issues by status correctly', () => {
      const mockIssues = [
        {
          key: 'PROJ-1',
          fields: { summary: 'Done issue', status: { name: 'Done' }, issuetype: { name: 'Story' }, priority: { name: 'High' } },
        },
        {
          key: 'PROJ-2',
          fields: { summary: 'In Progress', status: { name: 'In Progress' }, issuetype: { name: 'Task' }, priority: { name: 'High' } },
        },
        {
          key: 'PROJ-3',
          fields: { summary: 'To Do', status: { name: 'To Do' }, issuetype: { name: 'Bug' }, priority: { name: 'Critical' } },
        },
      ];

      const summary = validator.getIssueSummary(mockIssues);
      expect(summary.total).toBe(3);
      expect(summary.done).toBe(1);
      expect(summary.inProgress).toBe(1);
      expect(summary.todo).toBe(1);
      expect(summary.critical).toBe(1);
    });
  });
});
