# GEMINI.md

## Project Overview

This is a Donor CRM (Customer Relationship Management) system built with Next.js and Supabase. It is designed to help nonprofit organizations manage donor relationships, track contributions, and optimize fundraising efforts.

The application uses:
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Server Components + Zustand for client state
- **Forms**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API routes with Server Actions
- **Testing**: Jest and Playwright

## Building and Running

### Prerequisites
- Node.js 18+
- Supabase account and project

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in the Supabase credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

### Testing

- **Unit/Integration Tests:**
  ```bash
  npm test
  ```

- **E2E Tests:**
  ```bash
  npx playwright test
  ```

## Development Conventions

- **Styling**: Use Tailwind CSS classes for styling. Dark/light theme is supported.
- **Components**: Use shadcn/ui components where possible.
- **State Management**: Prefer React Server Components for data fetching and rendering. Use Zustand for client-side state management when necessary.
- **Forms**: Use React Hook Form with Zod for validation.
- **Data Fetching**: Use Server Actions and `lib/services` for data fetching.
- **Authentication**: Use Supabase Auth. Middleware in `middleware.ts` handles route protection.
- **Database**: Database schema is managed with Supabase migrations. See `supabase/migrations` for the schema.
- **Testing**: Write unit/integration tests for components, services, and utility functions. Write E2E tests for user flows.

## Implementation Notes

### Best Practices

*   **Environment Variables**: Never commit `.env.local` files to version control. Use `.env.example` as a template.
*   **Supabase RLS**: Enable and configure Row Level Security (RLS) in your Supabase project for all tables containing sensitive data.
*   **Server Components**: Use React Server Components (RSCs) for data fetching whenever possible to reduce client-side bundle size and improve performance.
*   **Client Components**: Only use the `"use client"` directive for components that require interactivity (e.g., event handlers, state hooks).
*   **Error Handling**: Implement robust error handling for all data fetching and form submissions.
*   **Reusable Components**: Create reusable components for UI elements to maintain consistency and reduce code duplication.
*   **Code Formatting**: Run the linter and formatter before committing code to maintain a consistent style.

### Common Pitfalls

*   **Missing RLS Policies**: Forgetting to set up RLS policies can expose your data to unauthorized users.
*   **Exposing Secret Keys**: Be careful not to expose your Supabase service role key or other secret keys on the client-side.
*   **Large Client-Side State**: Avoid storing large amounts of data in client-side state. Fetch data on the server when possible.
*   **Inefficient Queries**: Write efficient Supabase queries to avoid performance bottlenecks. Use indexes on frequently queried columns.
*   **Ignoring Test Coverage**: Make sure to write tests for new features and bug fixes to prevent regressions.

## Quality Assessment

Overall, the codebase is well-structured and follows modern best practices for Next.js and Supabase development. 

### Strengths

*   **Clear Project Structure**: The project is organized logically, with a clear separation of concerns between UI components, services, and Supabase-related code.
*   **Consistent Coding Style**: The code is well-formatted and follows a consistent style, making it easy to read and understand.
*   **Modern Technologies**: The project uses a modern tech stack, including Next.js with the App Router, Tailwind CSS, and Supabase.
*   **Robust Database Schema**: The database schema is well-designed with appropriate indexes and relationships.
*   **Good Test Coverage**: The project includes both unit/integration tests and E2E tests, which is a good indicator of code quality and maintainability.

### Areas for Improvement

*   **Component-Level Documentation**: While the `README.md` provides a good overview, adding component-level documentation (e.g., using JSDoc) would improve clarity and maintainability.
*   **Complex Components**: Some components, like `DonorList`, are quite large and could be broken down into smaller, more manageable components.
*   **Hardcoded Strings**: There are some hardcoded strings that could be moved to a constants file for better maintainability.
