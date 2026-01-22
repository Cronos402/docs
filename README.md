![Cronos402 Logo](https://raw.githubusercontent.com/Cronos402/assets/main/Cronos402-logo-light.svg)

# Cronos402 Documentation

Complete technical documentation for the Cronos402 MCP payment gateway ecosystem.

Production URL: https://docs.cronos402.dev

## Overview

The Cronos402 documentation site provides comprehensive guides, API references, and integration examples for developers building with the Cronos402 ecosystem. Built with Fumadocs and Next.js, it offers a modern, searchable documentation experience with code examples, interactive demos, and detailed API references.

## Architecture

- **Framework**: Next.js 15 with Fumadocs
- **Content**: MDX-based documentation
- **Search**: Built-in full-text search
- **UI**: Responsive design with dark mode
- **Deployment**: Vercel-optimized static generation

## Documentation Structure

- **Getting Started**: Quick start guides and installation
- **SDK Reference**: Complete SDK API documentation
- **MCP Server**: Building paid MCP servers
- **Gateway**: Wrapping existing servers with payments
- **CLI**: Command-line tool usage
- **Examples**: Integration examples and templates
- **API Reference**: HTTP API documentation
- **Guides**: In-depth tutorials and best practices

## Development

### Local Development

```bash
pnpm install
pnpm dev
```

Documentation runs on `http://localhost:3003`

### Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
docs/
├── app/
│   ├── (home)/           # Landing page
│   ├── docs/             # Documentation pages
│   └── api/search/       # Search API
├── content/
│   └── docs/             # MDX documentation files
├── lib/
│   ├── source.ts         # Content source adapter
│   └── layout.shared.tsx # Shared layout configuration
├── components/           # React components
└── public/              # Static assets
```

## Adding Documentation

### Create New Page

1. Add MDX file to `content/docs/`:

```mdx
---
title: Your Page Title
description: Brief description
---

# Your Page Title

Content goes here...
```

2. Update navigation in `source.config.ts`

### Code Examples

Use syntax highlighting:

````mdx
```typescript
import { Cronos402Server } from 'cronos402';

const server = new Cronos402Server({
  network: 'cronos-testnet',
  recipient: '0xYourAddress'
});
```
````

### Callouts

```mdx
> **Note**: Important information

> **Warning**: Critical warnings

> **Tip**: Helpful tips
```

## Content Management

### MDX Features

- Syntax highlighting
- Code blocks with copy button
- Callout boxes
- Interactive components
- Table of contents
- Frontmatter metadata

### Source Configuration

Configure in `source.config.ts`:

```typescript
export const source = {
  baseUrl: '/docs',
  pageTree: {
    // Navigation structure
  }
};
```

## Search

Full-text search powered by Fumadocs:

- Automatic indexing
- Instant results
- Keyboard shortcuts (Cmd/Ctrl + K)

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Self-Hosted

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3003
CMD ["pnpm", "start"]
```

## Environment Variables

```env
# Optional analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional search configuration
SEARCH_ENABLED=true
```

## Contributing

To contribute to documentation:

1. Fork the repository
2. Create a branch for your changes
3. Add/edit MDX files in `content/docs/`
4. Test locally with `pnpm dev`
5. Submit a pull request

## Documentation Topics

### Core Guides

- Installation and setup
- Quick start tutorials
- SDK integration
- CLI usage
- MCP server development

### API Reference

- SDK methods and classes
- HTTP endpoints
- Payment protocols
- Error codes
- Type definitions

### Advanced Topics

- Payment flow details
- Security best practices
- Deployment strategies
- Monitoring and analytics
- Troubleshooting

## Resources

- **Production**: [docs.cronos402.dev](https://docs.cronos402.dev)
- **SDK**: [npmjs.com/package/cronos402](https://www.npmjs.com/package/cronos402)
- **Dashboard**: [cronos402.dev](https://cronos402.dev)
- **GitHub**: [github.com/Cronos402/docs](https://github.com/Cronos402/docs)

## License

MIT
