# Miro PR Visualizer Demo

A demo Node.js application that automatically generates **living architecture diagrams** on every Pull Request using Miro's **Model Context Protocol (MCP)** server.

## How It Works

When a PR is opened or updated, a GitHub Action triggers the Miro MCP server with the `code_explain_on_board` prompt. This analyzes the code changes and generates an interactive architecture diagram on a Miro board. A link to the board is posted as a PR comment.

## Project Structure

```
visualize-prs-miro/
├── .github/workflows/miro-pr-visualizer.yml
├── src/
│   ├── server.ts       # Main entry point
│   ├── auth.ts         # Middleware to visualize
│   └── routes.ts       # Component relationships
├── README.md
├── package.json
└── tsconfig.json
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure GitHub Secrets

Add the following secret to your GitHub repository:

- **`MIRO_API_TOKEN`**: Your Miro OAuth token

### 3. Authorize MCP

Connect the Miro MCP server to your team via the [Miro Developer Portal](https://developers.miro.com).

## How to Test

1. **Authorize MCP**: Connect the Miro MCP server to your team via the Miro Developer Portal.
2. **Add Secret**: Add your Miro OAuth token as a GitHub Secret named `MIRO_API_TOKEN`.
3. **Open a PR**: Push a change that adds a new route or service. The Action will trigger, and the "**View Interactive Architectural Impact**" link will appear in your PR comments.

## Local Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Why This is Useful

- **Automated Documentation**: Documentation never goes stale because it is recreated from the code on every change.
- **Stakeholder Alignment**: Non-technical team members can "see" the code change in a language they understand.
- **Developer Focus**: Engineers stay in the flow, accessing architectural context directly within their PR workflow.
