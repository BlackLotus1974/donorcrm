# Testing Guide

This project uses a comprehensive testing setup with Jest, React Testing Library, and Playwright.

## Test Structure

```
/
├── __tests__/               # Test files (alternative location)
├── e2e/                     # End-to-end tests (Playwright)
├── lib/                     # Unit tests alongside source files
│   ├── utils.test.ts
│   └── permissions.test.ts
├── components/              # Component tests alongside components
│   └── auth-button.test.tsx
└── jest.config.js           # Jest configuration
```

## Running Tests

### Unit & Integration Tests (Jest + RTL)

```bash
# Run all tests once
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Install Playwright browsers (run once after setup)
npm run playwright:install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

## Test Types

### Unit Tests
Test individual functions and utilities in isolation.

**Example**: `lib/utils.test.ts`
```typescript
import { cn } from './utils'

describe('Utils', () => {
  it('should merge classnames correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })
})
```

### Component Tests
Test React components with user interactions.

**Example**: `components/auth-button.test.tsx`
```typescript
import { render, screen } from '@testing-library/react'
import { AuthButton } from './auth-button'

describe('AuthButton', () => {
  it('renders sign out button when user is authenticated', () => {
    render(<AuthButton />)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })
})
```

### Service Tests
Test API service classes with mocked Supabase client.

**Example**: `lib/services/donor-service.test.ts`
```typescript
import { DonorService } from './donor-service'

describe('DonorService', () => {
  it('should fetch donors with pagination', async () => {
    const result = await donorService.getDonors('org-123', 1, 10)
    expect(result.data).toBeDefined()
  })
})
```

### End-to-End Tests
Test complete user workflows in a real browser.

**Example**: `e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test('should redirect to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/.*\/auth\/login/)
})
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest preset for optimal compatibility
- Configured for TypeScript and JSX
- Includes path mapping for `@/` imports
- Sets up jsdom test environment

### Testing Library Setup (`jest.setup.js`)
- Imports jest-dom matchers
- Mocks browser APIs (IntersectionObserver, ResizeObserver)
- Mocks Next.js navigation
- Mocks Supabase client for testing

### Playwright Configuration (`playwright.config.ts`)
- Tests against Chrome, Firefox, Safari, and mobile browsers
- Configured for local development server
- Includes screenshot and video capture on failures
- Parallel test execution

## Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

### Component Tests
- Test user interactions, not implementation details
- Use `screen.getByRole()` for accessibility-friendly queries
- Mock external services and APIs
- Test different user states and permissions

### E2E Tests
- Test critical user journeys
- Use page object pattern for complex flows
- Keep tests independent and isolated
- Use data-testid sparingly (prefer semantic queries)

### Mocking Guidelines
- Mock at the module boundary
- Use factory functions for reusable mocks
- Reset mocks between tests
- Mock time-dependent functionality

## Coverage Goals

- **Unit Tests**: >90% coverage for utilities and services
- **Component Tests**: >80% coverage for UI components
- **E2E Tests**: Cover all critical user workflows
- **Integration**: Test API endpoints and database operations

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release deployments

Failed tests block deployments to ensure quality.

## Debugging Tests

### Jest Tests
```bash
# Run specific test file
npm run test auth-button.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="should render"

# Run with verbose output
npm run test -- --verbose
```

### Playwright Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run specific test file
npx playwright test auth.spec.ts

# Generate test reports
npx playwright show-report
```

## Writing New Tests

1. Create test files alongside source files (`.test.ts` or `.spec.ts`)
2. Follow existing patterns and naming conventions
3. Include both positive and negative test cases
4. Add E2E tests for new user-facing features
5. Update this documentation when adding new test patterns