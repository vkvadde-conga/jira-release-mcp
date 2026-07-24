# Development Guide

## Setup

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Edit .env with your Jira credentials
```

## Building

```bash
# Build TypeScript
npm run build

# Output: ./build/server.js
```

## Running

```bash
# Production
npm start

# Development (with hot reload)
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
jira-release-mcp/
├── src/
│   ├── server.ts              # MCP server entry point
│   ├── jira-client.ts         # Jira API wrapper
│   ├── release-validator.ts   # Validation logic
│   ├── config.ts              # Config loader
│   ├── types.ts               # TypeScript interfaces
│   └── tools/                 # MCP tools
│       ├── list-releases.ts
│       ├── get-release-status.ts
│       ├── check-release-criteria.ts
│       └── get-release-issues.ts
├── __tests__/                 # Jest tests
│   ├── config.test.ts
│   ├── jira-client.test.ts
│   └── release-validator.test.ts
├── build/                     # Compiled output (generated)
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
├── .env.example
├── .gitignore
└── README.md
```

## Adding a New Tool

1. Create `src/tools/new-tool.ts`:

```typescript
import { JiraClient } from '../jira-client.js';
import { ToolInput } from '../types.js';

export async function newTool(
  jiraClient: JiraClient,
  input: ToolInput
): Promise<string> {
  try {
    // Implement tool logic
    return 'Tool result';
  } catch (error) {
    return `Error: ${String(error)}`;
  }
}

export const newToolDefinition = {
  name: 'new_tool',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param1'],
  },
};
```

2. Register in `src/server.ts`:

```typescript
import { newTool, newToolDefinition } from './tools/new-tool.js';

// In ListToolsRequestSchema handler:
tools: [
  listReleasesTool,
  // ... other tools
  newToolDefinition,  // Add here
]

// In CallToolRequestSchema handler:
case 'new_tool':
  result = await newTool(jiraClient, input);
  break;
```

3. Add tests in `__tests__/new-tool.test.ts`

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- config.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Code Style

We use:
- **ESLint**: Code linting
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (configured in eslintrc)

```bash
# Fix linting issues
npm run lint -- --fix
```

## Debugging

Enable debug logging:

```bash
# In .env
LOG_LEVEL=debug

# Server stderr will show debug output
npm run dev 2>&1 | grep DEBUG
```

## Common Issues

### Build fails with "Cannot find module"
- Run `npm install`
- Ensure all imports use `.js` extensions (ES modules)

### Tests fail with "Cannot find module"
- Ensure `jest.config.js` has correct paths
- Tests import from `src/`, not `build/`

### Server won't connect to Jira
- Check `.env` values
- Verify API token hasn't expired
- Ensure project key exists in Jira

## Release Process

1. Update `package.json` version
2. Run `npm test` to ensure all tests pass
3. Run `npm run build` to compile
4. Commit and tag: `git tag v1.0.0`
5. Push: `git push origin main --tags`

## Contributing

1. Create a feature branch
2. Make changes and add tests
3. Run `npm test` and `npm run lint`
4. Submit PR with description of changes

---

For questions, check `docs/ARCHITECTURE.md` for design details.
