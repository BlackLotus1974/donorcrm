# Context7 MCP Integration Guide

This guide explains how to use Context7 MCP (Model Context Protocol) in your Donor CRM project to access up-to-date documentation for your technology stack.

## What is Context7 MCP?

Context7 MCP is a tool that provides Claude Code with access to the latest documentation for thousands of libraries and frameworks. Instead of relying on Claude's training data (which has a cutoff date), you can query real-time documentation directly within your coding session.

## Current Setup

✅ Context7 MCP is already configured in your project at [.claude/.mcp.json](.claude/.mcp.json:42-46):

```json
{
  "context7": {
    "type": "stdio",
    "command": "npx",
    "args": ["@context7/mcp-server"]
  }
}
```

## How to Use Context7 MCP

### Step 1: Resolve Library IDs

Before fetching documentation, you need to find the exact Context7-compatible library ID. Use natural language to search:

**Example Commands:**
- "Use Context7 to find Next.js documentation"
- "Search Context7 for Supabase auth docs"
- "Get React Hook Form documentation via Context7"

**What Happens:**
Claude will use `mcp__MCP_DOCKER__resolve-library-id` to find matching libraries:

```typescript
// Example: Searching for Next.js
{
  "libraryName": "next.js"
}

// Returns:
- /vercel/next.js (Trust Score: 10, 3,232 code snippets)
- /websites/nextjs (Trust Score: 7.5, 7,257 code snippets)
- /llmstxt/nextjs_llms_txt (Trust Score: 8, 2,500 code snippets)
```

### Step 2: Fetch Documentation

Once you have the library ID, request specific documentation:

**Example Commands:**
- "Get Next.js middleware documentation using `/vercel/next.js`"
- "Fetch Supabase RLS policies docs from `/supabase/supabase`"
- "Show me React Hook Form validation examples"

**What Happens:**
Claude uses `mcp__MCP_DOCKER__get-library-docs` with:
- **Library ID**: e.g., `/vercel/next.js`
- **Topic** (optional): e.g., "middleware authentication"
- **Token limit**: How much documentation to retrieve (default: 10,000)

```typescript
// Example: Fetching Next.js middleware docs
{
  "context7CompatibleLibraryID": "/vercel/next.js",
  "topic": "middleware authentication",
  "tokens": 5000
}
```

## Practical Examples for Your Donor CRM Project

### Example 1: Next.js Middleware & Authentication

**Your Request:**
> "Show me the latest Next.js middleware patterns for authentication using Context7"

**What You Get:**
- Official Next.js middleware patterns
- Cookie-based session handling
- Route protection examples
- Redirect strategies for auth flows

**Relevant to Your Code:**
Your [middleware.ts](middleware.ts:1-20) and [lib/supabase/middleware.ts](lib/supabase/middleware.ts:1-142) can be enhanced with official patterns.

### Example 2: Supabase Row Level Security

**Your Request:**
> "Get Supabase RLS policy examples for multi-tenant apps from Context7"

**What You Get:**
- RLS policy patterns for organizations
- Multi-tenancy isolation strategies
- JWT claims in RLS policies
- Role-based access patterns

**Relevant to Your Code:**
Your [supabase/migrations/20250813000002_rls_policies.sql](supabase/migrations/20250813000002_rls_policies.sql) can benefit from official RLS patterns.

### Example 3: React Hook Form + Zod

**Your Request:**
> "Show me React Hook Form with Zod validation patterns from Context7"

**What You Get:**
- Form validation patterns
- Integration with Zod schemas
- Error handling best practices
- Performance optimization tips

**Relevant to Your Code:**
Your donor forms in [components/donors/donor-form.tsx](components/donors/donor-form.tsx) and [app/donors/new/page.tsx](app/donors/new/page.tsx) use React Hook Form.

## Key Libraries in Your Project

Here are the Context7-compatible library IDs for your tech stack:

| Technology | Library ID | Trust Score | Code Snippets |
|------------|-----------|-------------|---------------|
| **Next.js** | `/vercel/next.js` | 10 | 3,232 |
| **Supabase** | `/supabase/supabase` | 10 | 4,580 |
| **React Hook Form** | `/react-hook-form/react-hook-form` | 9.1 | 201 |
| **Recharts** | Search needed | - | - |
| **shadcn/ui** | Search needed | - | - |

## Advanced Usage Patterns

### Pattern 1: Topic-Specific Documentation

```typescript
// Narrow down to specific topics
"Get Supabase documentation on SSR authentication"
"Fetch Next.js App Router caching strategies"
"Show React Hook Form performance optimization"
```

### Pattern 2: Version-Specific Docs

Some libraries support version-specific documentation:

```typescript
// Next.js has versions: v14.3.0-canary.87, v13.5.11, v15.1.8, etc.
"Get Next.js v15.1.8 documentation on parallel routes"
```

### Pattern 3: Cross-Reference Multiple Libraries

```typescript
"Show me how to integrate Supabase Auth with Next.js middleware using Context7"
// Claude will fetch docs from both libraries and synthesize the answer
```

## Benefits for Your Donor CRM Project

### 1. **Up-to-Date Patterns**
Your middleware implementation can use the latest Next.js 15 patterns instead of relying on outdated tutorials.

### 2. **Official Best Practices**
Get Supabase RLS policies directly from official docs, ensuring security best practices for your multi-tenant architecture.

### 3. **Code Snippets**
Context7 provides working code examples you can adapt immediately:
- Over 3,200 Next.js code snippets
- Over 4,500 Supabase code snippets
- Over 200 React Hook Form code snippets

### 4. **Problem-Solving**
When debugging issues with:
- SSR authentication in Next.js 15
- RLS policies for organizations
- Form validation edge cases

...you can get current solutions instead of guessing.

## Common Use Cases

### 🔒 Authentication & Authorization
```
"Get Context7 docs on Next.js middleware authentication patterns"
"Show Supabase RLS policies for role-based access control"
```

### 🗄️ Database Operations
```
"Fetch Supabase documentation on complex queries with RLS"
"Get examples of Postgres full-text search in Supabase"
```

### 📝 Form Handling
```
"Show React Hook Form patterns for multi-step forms"
"Get Zod schema validation examples from Context7"
```

### 🎨 UI Components
```
"Find shadcn/ui table component documentation"
"Get Recharts examples for dashboard visualizations"
```

## Tips for Effective Usage

### ✅ DO:
1. **Be specific with topics**: "middleware authentication" not just "middleware"
2. **Use official library IDs**: `/vercel/next.js` instead of guessing
3. **Request relevant examples**: Ask for patterns similar to your use case
4. **Cross-reference**: Combine docs from multiple libraries when integrating

### ❌ DON'T:
1. **Don't ask for deprecated versions**: Unless specifically needed
2. **Don't request too much**: Start with 5,000 tokens, increase if needed
3. **Don't ignore trust scores**: Prefer libraries with score 8+
4. **Don't skip the resolve step**: Always resolve library ID first

## Troubleshooting

### Issue: "Library not found"
**Solution:** Use resolve-library-id to search for alternative names:
```
"Search Context7 for recharts" → might be under different org
```

### Issue: "Topic not specific enough"
**Solution:** Add more context to your topic:
```
❌ "authentication"
✅ "SSR authentication with cookies in Next.js 15"
```

### Issue: "Too many results"
**Solution:** Reduce token limit or narrow topic:
```typescript
{
  "topic": "middleware authentication JWT",
  "tokens": 3000
}
```

## Integration with Your Development Workflow

### When Adding New Features
1. **Before coding**: Query Context7 for best practices
2. **During coding**: Reference specific patterns
3. **While debugging**: Search for similar issues/solutions

### Example Workflow
```
Task: Add email verification to signup flow

Step 1: "Search Context7 for Supabase auth email verification"
Step 2: Review code snippets and patterns
Step 3: "Get Next.js Server Actions examples for auth flows"
Step 4: Implement using official patterns
```

## Resources

- **Context7 Official**: https://context7.com
- **Your MCP Config**: [.claude/.mcp.json](.claude/.mcp.json)
- **Docker Desktop**: Required (✅ Installed)
- **MCP Documentation**: Check Claude Code docs

## Next Steps

1. ✅ Docker Desktop is installed and running
2. ✅ Context7 MCP is configured
3. ✅ Library IDs are identified for your stack
4. 🎯 **Start using**: Just ask Claude to "use Context7 to get..." in your coding sessions

---

**Pro Tip:** Bookmark this guide and reference it when you need to fetch documentation. The more you use Context7, the more productive you'll become with up-to-date, official documentation at your fingertips! 🚀
