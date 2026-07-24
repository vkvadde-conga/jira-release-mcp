import { JiraClient } from '../src/jira-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraClient', () => {
  let client: JiraClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new JiraClient('https://test.atlassian.net', 'test_token', 'PROJ');
  });

  describe('getVersions', () => {
    it('should fetch and format versions correctly', async () => {
      const mockResponse = {
        data: [
          {
            name: 'v1.0.0',
            description: 'First release',
            releaseDate: '2024-01-01',
            released: true,
          },
          {
            name: 'v1.1.0',
            description: 'Second release',
            released: false,
          },
        ],
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      client = new JiraClient('https://test.atlassian.net', 'test_token', 'PROJ');
      const versions = await client.getVersions();

      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe('v1.0.0');
      expect(versions[0].released).toBe(true);
    });
  });

  describe('validateConnection', () => {
    it('should return true on successful connection', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { key: 'PROJ', name: 'Test Project' } }),
      } as any);

      client = new JiraClient('https://test.atlassian.net', 'test_token', 'PROJ');
      const isValid = await client.validateConnection();

      expect(isValid).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Connection failed')),
      } as any);

      client = new JiraClient('https://test.atlassian.net', 'test_token', 'PROJ');
      const isValid = await client.validateConnection();

      expect(isValid).toBe(false);
    });
  });
});
