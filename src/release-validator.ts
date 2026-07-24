/**
 * Release Criteria Validator
 * Validates releases against defined criteria
 */

import { JiraIssue, ReleaseCriteria, ReleaseCheckResult } from './types.js';

export class ReleaseValidator {
  private criteria: ReleaseCriteria;

  constructor(criteria: ReleaseCriteria) {
    this.criteria = criteria;
  }

  /**
   * Check if a release meets all criteria
   */
  checkRelease(version: string, issues: JiraIssue[]): ReleaseCheckResult {
    const checks = [
      this.checkNoBlockers(issues),
      this.checkNoUnresolvedCritical(issues),
      this.checkAllIssuesComplete(issues),
      this.checkRequiredFields(issues),
    ];

    const blockingIssues = this.getBlockingIssues(issues);
    const warnings = this.getWarnings(issues);

    const isReady = checks.every((check) => check.passed) && blockingIssues.length === 0;

    return {
      version,
      isReady,
      checks,
      blockingIssues,
      warnings,
    };
  }

  /**
   * Check 1: No blocking issue types or statuses
   */
  private checkNoBlockers(issues: JiraIssue[]): { name: string; passed: boolean; details: string } {
    const blockers = issues.filter(
      (issue) =>
        this.criteria.blockingIssueTypes.includes(issue.fields.issuetype.name) ||
        this.criteria.blockingStatuses.includes(issue.fields.status.name)
    );

    return {
      name: 'No Blocking Issues',
      passed: blockers.length === 0,
      details:
        blockers.length === 0
          ? 'All blockers resolved'
          : `Found ${blockers.length} blocking issue(s): ${blockers.map((i) => i.key).join(', ')}`,
    };
  }

  /**
   * Check 2: No critical/high priority unresolved issues
   */
  private checkNoUnresolvedCritical(issues: JiraIssue[]): {
    name: string;
    passed: boolean;
    details: string;
  } {
    const unresolved = issues.filter(
      (issue) =>
        (issue.fields.priority?.name === 'Critical' ||
          issue.fields.priority?.name === 'Highest') &&
        issue.fields.status.name !== 'Done' &&
        issue.fields.status.name !== 'Closed' &&
        issue.fields.status.name !== 'Resolved'
    );

    return {
      name: 'No Critical Unresolved Issues',
      passed: unresolved.length === 0,
      details:
        unresolved.length === 0
          ? 'No critical unresolved issues'
          : `Found ${unresolved.length} critical unresolved issue(s)`,
    };
  }

  /**
   * Check 3: All issues should be in done/resolved state
   */
  private checkAllIssuesComplete(issues: JiraIssue[]): {
    name: string;
    passed: boolean;
    details: string;
  } {
    const doneStates = ['Done', 'Closed', 'Resolved'];
    const incomplete = issues.filter((issue) => !doneStates.includes(issue.fields.status.name));

    return {
      name: 'All Issues Complete',
      passed: incomplete.length === 0,
      details:
        incomplete.length === 0
          ? 'All issues complete'
          : `${incomplete.length} issue(s) still in progress`,
    };
  }

  /**
   * Check 4: Required fields are filled
   */
  private checkRequiredFields(issues: JiraIssue[]): {
    name: string;
    passed: boolean;
    details: string;
  } {
    const missing = issues.filter((issue) =>
      this.criteria.requiredFields.some((field) => !issue.fields[field])
    );

    return {
      name: 'Required Fields Filled',
      passed: missing.length === 0,
      details:
        missing.length === 0
          ? 'All required fields present'
          : `${missing.length} issue(s) missing required fields`,
    };
  }

  /**
   * Get all blocking issues
   */
  private getBlockingIssues(issues: JiraIssue[]): JiraIssue[] {
    return issues.filter(
      (issue) =>
        this.criteria.blockingIssueTypes.includes(issue.fields.issuetype.name) ||
        this.criteria.blockingStatuses.includes(issue.fields.status.name)
    );
  }

  /**
   * Get warnings (issues that should be reviewed but aren't blockers)
   */
  private getWarnings(issues: JiraIssue[]): string[] {
    const warnings: string[] = [];

    // Check for issues with missing test case links
    if (this.criteria.testCaseFieldId) {
      const noTestCase = issues.filter((issue) => !issue.fields[this.criteria.testCaseFieldId!]);
      if (noTestCase.length > 0) {
        warnings.push(
          `${noTestCase.length} issue(s) missing test case link: ${noTestCase.map((i) => i.key).join(', ')}`
        );
      }
    }

    // Check for issues without priority
    const noPriority = issues.filter((issue) => !issue.fields.priority);
    if (noPriority.length > 0) {
      warnings.push(
        `${noPriority.length} issue(s) missing priority: ${noPriority.map((i) => i.key).join(', ')}`
      );
    }

    // Check for unassigned issues
    const unassigned = issues.filter((issue) => !issue.fields.assignee);
    if (unassigned.length > 0) {
      warnings.push(
        `${unassigned.length} issue(s) unassigned: ${unassigned.map((i) => i.key).join(', ')}`
      );
    }

    return warnings;
  }

  /**
   * Get critical issues that require attention
   */
  getCriticalIssues(issues: JiraIssue[]): JiraIssue[] {
    return issues.filter(
      (issue) =>
        issue.fields.priority?.name === 'Critical' ||
        issue.fields.priority?.name === 'Highest'
    );
  }

  /**
   * Get issue summary for a release
   */
  getIssueSummary(
    issues: JiraIssue[]
  ): {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    critical: number;
  } {
    return {
      total: issues.length,
      done: issues.filter((i) => ['Done', 'Closed', 'Resolved'].includes(i.fields.status.name))
        .length,
      inProgress: issues.filter((i) => i.fields.status.name === 'In Progress').length,
      todo: issues.filter((i) => i.fields.status.name === 'To Do').length,
      critical: this.getCriticalIssues(issues).length,
    };
  }
}
