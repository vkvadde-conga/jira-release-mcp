# Jira Release Criteria Checker - MCP Server

A Model Context Protocol (MCP) server that enables AI models like Claude to check release readiness in Jira against customizable criteria.

## Features

- ✅ **Check Release Readiness**: Validate releases against configurable criteria
- 📊 **Get Release Status**: Detailed status of all issues in a release
- 📋 **List Releases**: View all versions in your project
- 🔍 **Filter Issues**: Query issues by status, priority, or type
- 🔒 **Secure**: Credentials via environment variables, safe logging
- 🎯 **Customizable**: Define your own release criteria

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Jira Cloud instance with API access

### Setup

1. **Clone or download this repository**

```bash
git clone https://github.com/vkvadde-conga/jira-release-mcp.git
cd jira-release-mcp
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env` file**

Copy `.env.example` and configure with your Jira details:

```bash
cp .env.example .env
```

Edit `.env`:

```env
JIRA_URL=https://your-instance.atlassian.net
JIRA_API_TOKEN=your_api_token_here
JIRA_PROJECT_KEY=PROJ

# Optional: customize release criteria
RELEASE_CONFIG='{"blockingStatuses":["To Do","In Progress"],"blockingIssueTypes":["Blocker","Critical Bug"],"requiredFields":[],"minApprovals":1}'
```

### Getting Your Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Copy it to your `.env` file

## Usage

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

The server will validate your Jira connection and start listening on stdin/stdout.

### Development

For active development with hot reload:

```bash
npm run dev
```

## Tools

### `list_releases`

List all available releases in your project.

**Usage:**
```
User: What releases are available?
Claude: [calls list_releases] → Shows all versions
```

### `get_release_status`

Get detailed status of a specific release.

**Parameters:**
- `version` (required): Release version name (e.g., "v2.5.0")

**Usage:**
```
User: What's the status of v2.5.0?
Claude: [calls get_release_status with version="v2.5.0"]
  → Shows all issues, their statuses, and summary
```

### `check_release_criteria`

Check if a release meets all defined criteria.

**Parameters:**
- `version` (required): Release version name

**Returns:**
- ✅ Ready for release or ❌ Not ready
- Detailed check results
- Blocking issues
- Warnings

**Usage:**
```
User: Is v2.5.0 ready for release?
Claude: [calls check_release_criteria with version="v2.5.0"]
  → Shows readiness status and reasons
```

### `get_release_issues`

Query issues in a release with optional filters.

**Parameters:**
- `version` (required): Release version name
- `status` (optional): Filter by status (e.g., "Done", "In Progress")
- `priority` (optional): Filter by priority (e.g., "Critical", "High")
- `issueType` (optional): Filter by type (e.g., "Bug", "Story")

**Usage:**
```
User: Show me critical bugs in v2.5.0
Claude: [calls get_release_issues with version="v2.5.0", priority="Critical", issueType="Bug"]
  → Shows matching issues
```

## Configuration

### Release Criteria

Define what "ready for release" means in your organization by setting `RELEASE_CONFIG`:

```json
{
  "blockingStatuses": ["To Do", "In Progress"],
  "blockingIssueTypes": ["Blocker", "Critical Bug"],
  "requiredFields": ["customfield_10001"],
  "minApprovals": 1,
  "testCaseFieldId": "customfield_10002"
}
```

**Fields:**

- `blockingStatuses`: Issues with these statuses prevent release
- `blockingIssueTypes`: Issues with these types prevent release
- `requiredFields`: Jira custom field IDs that all issues must have
- `minApprovals`: Minimum number of approvals required (future feature)
- `testCaseFieldId`: Custom field ID for test case links (checked in warnings)

### Finding Custom Field IDs

In Jira, custom field IDs look like `customfield_10001`. You can find them by:

1. Go to **Project Settings → Custom Fields**
2. Hover over a custom field name
3. The ID appears in the URL or tooltip

Or use Jira's REST API:

```bash
curl -u your-email@example.com:YOUR_API_TOKEN \
  https://your-instance.atlassian.net/rest/api/3/field
```

## Integration with Claude Desktop

To use this MCP server with Claude Desktop:

1. Edit `~/.claude/claude_desktop_config.json` (create if not exists)

```json
{
  "mcpServers": {
    "jira-release-mcp": {
      "command": "node",
      "args": ["/path/to/jira-release-mcp/build/server.js"],
      "env": {
        "JIRA_URL": "https://your-instance.atlassian.net",
        "JIRA_API_TOKEN": "your_api_token",
        "JIRA_PROJECT_KEY": "PROJ"
      }
    }
  }
}
```

2. Restart Claude Desktop
3. Ask Claude questions about your Jira releases!

## Testing

```bash
npm test
```

## Security Notes

- 🔐 **Never commit `.env`** — add it to `.gitignore`
- 🔐 **Use API tokens, not passwords** — create tokens in Jira settings
- 🔐 **Rotate tokens regularly** — tokens can be revoked anytime
- 🔐 **Logs never expose secrets** — we sanitize axios errors
- 🔐 **HTTPS only** — all Jira Cloud API calls use HTTPS

## Troubleshooting

### Connection Failed

```
Error: Failed to connect to Jira. Check your credentials.
```

Check:
- `JIRA_URL` is correct (e.g., `https://your-company.atlassian.net`)
- `JIRA_API_TOKEN` is valid and not expired
- `JIRA_PROJECT_KEY` exists in your instance

### Invalid Project Key

```
Error: Failed to fetch project
```

Verify your project key in Jira (Settings → Project Details).

### "No issues found for release"

Ensure issues in Jira are associated with the release version:
- In Jira: **Issue → Fix Version → [Your Release]**

## Performance

For large releases (1000+ issues), consider:
- Using filters in `get_release_issues` to reduce results
- Batching criteria checks
- Caching release info

## Future Enhancements

- [ ] Webhook support for real-time updates
- [ ] Approval workflow integration
- [ ] Custom validators/rules
- [ ] Release notes generation
- [ ] Slack/Teams notifications
- [ ] Multi-project support

## License

MIT

## Support

For issues or questions:
1. Check `.env` configuration
2. Verify Jira API token and permissions
3. Review server logs for detailed errors
4. Open an issue on GitHub

---

**Built with ❤️ using the Model Context Protocol**