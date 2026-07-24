/**
 * Jira API Client
 * Handles all communication with Jira REST API
 */

import axios, { AxiosInstance } from 'axios';
import { JiraIssue, JiraProject, ReleaseInfo } from './types.js';

export class JiraClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private projectKey: string;

  constructor(baseUrl: string, apiToken: string, projectKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.projectKey = projectKey;

    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      auth: {
        username: 'api_token', // Jira Cloud uses 'api_token' as username
        password: apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add error interceptor for logging without exposing credentials
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const sanitizedError = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        };
        console.error('Jira API Error:', sanitizedError);
        throw error;
      }
    );
  }

  /**
   * Get all versions (releases) for the project
   */
  async getVersions(): Promise<ReleaseInfo[]> {
    try {
      const response = await this.client.get(`/project/${this.projectKey}/versions`);
      return response.data.map((v: any) => ({
        version: v.name,
        name: v.description || v.name,
        releaseDate: v.releaseDate,
        released: v.released || false,
        issues: [],
      }));
    } catch (error) {
      throw new Error(`Failed to fetch versions: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get all issues for a specific version
   */
  async getIssuesByVersion(versionName: string): Promise<JiraIssue[]> {
    try {
      // JQL query to find all issues assigned to a specific version
      const jql = `project = ${this.projectKey} AND fixVersion = "${versionName}"`;
      const response = await this.client.get('/search', {
        params: {
          jql,
          maxResults: 100,
          fields: [
            'summary',
            'status',
            'issuetype',
            'priority',
            'labels',
            'assignee',
            'resolution',
          ],
        },
      });

      return response.data.issues;
    } catch (error) {
      throw new Error(
        `Failed to fetch issues for version ${versionName}: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get a specific issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`, {
        params: {
          fields: '*all',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch issue ${issueKey}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get issues by JQL query
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          jql,
          maxResults,
          fields: [
            'summary',
            'status',
            'issuetype',
            'priority',
            'labels',
            'assignee',
            'resolution',
          ],
        },
      });

      return response.data.issues;
    } catch (error) {
      throw new Error(`JQL search failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get project info
   */
  async getProject(): Promise<JiraProject> {
    try {
      const response = await this.client.get(`/project/${this.projectKey}`);
      return {
        key: response.data.key,
        name: response.data.name,
        id: response.data.id,
      };
    } catch (error) {
      throw new Error(`Failed to fetch project: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Validate connection to Jira
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getProject();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper: Extract error message from axios error
   */
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.errorMessages?.[0] || error.message;
    }
    return String(error);
  }
}
