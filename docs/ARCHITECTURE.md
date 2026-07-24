# MCP Tools Overview

## Architecture

```
Claude / AI Model
       |
       v
  MCP Server (server.ts)
       |
       +---> JiraClient (jira-client.ts)
       |
       +---> ReleaseValidator (release-validator.ts)
       |
       +---> Tools (tools/)
             ├── list-releases.ts
             ├── get-release-status.ts
             ├── check-release-criteria.ts
             └── get-release-issues.ts
```

## Tool Flow

### 1. list_releases
**Purpose**: Discover available releases

```
User Request
     ↓
JiraClient.getVersions()
     ↓
Format & return list
```

### 2. get_release_status
**Purpose**: Get detailed release information

```
User Request (version)
     ↓
JiraClient.getIssuesByVersion(version)
     ↓
ReleaseValidator.getIssueSummary()
     ↓
Format & return status
```

### 3. check_release_criteria
**Purpose**: Validate release readiness

```
User Request (version)
     ↓
JiraClient.getIssuesByVersion(version)
     ↓
ReleaseValidator.checkRelease()
     ├── checkNoBlockers()
     ├── checkNoUnresolvedCritical()
     ├── checkAllIssuesComplete()
     ├── checkRequiredFields()
     └── getWarnings()
     ↓
Format & return results
```

### 4. get_release_issues
**Purpose**: Filter and query issues

```
User Request (version, filters)
     ↓
JiraClient.getIssuesByVersion(version)
     ↓
Apply filters (status, priority, type)
     ↓
Format & return filtered issues
```

## Validation Flow

```
check_release_criteria
        ↓
    [Checks]
    ✓ No Blocking Issues
    ✓ No Critical Unresolved
    ✓ All Issues Complete
    ✓ Required Fields Filled
        ↓
    [Result]
    ├── isReady: boolean
    ├── checks: CheckResult[]
    ├── blockingIssues: Issue[]
    └── warnings: string[]
```

## Security

- ✅ No credentials in logs
- ✅ Sanitized error messages
- ✅ Token-based auth only
- ✅ HTTPS connections
- ✅ Environment variable config

## Error Handling

All tools catch errors and return user-friendly messages:
- Connection errors → "Failed to connect to Jira"
- Invalid parameters → "version parameter is required"
- No results → "No issues found for release"
