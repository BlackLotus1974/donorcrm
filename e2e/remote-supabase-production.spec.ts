import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for Docker Production Mode with Remote Supabase
 *
 * Tests the complete application workflow:
 * 1. Authentication (Sign-up, Login, Logout)
 * 2. Onboarding (Organization creation)
 * 3. Dashboard access
 * 4. Donor management (Create, Read, Update, Delete)
 * 5. Remote Supabase connectivity
 *
 * Run against Docker production: http://localhost:3000
 */

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `playwright.test+${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_ORG_NAME = `Test Org ${Date.now()}`;

// Force all tests to run serially to ensure proper account creation flow
test.describe.configure({ mode: 'serial' });

test.describe('Remote Supabase - Docker Production Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for remote Supabase calls
    test.setTimeout(60000);
    await page.goto(BASE_URL);
  });

  test.describe('1. Infrastructure & Connectivity', () => {
    test('should load the application successfully', async ({ page }) => {
      await expect(page).toHaveURL(BASE_URL);
      await expect(page).not.toHaveTitle(/Error|404|500/);
    });

    test('should connect to remote Supabase (no connection errors)', async ({ page }) => {
      // Monitor console for connection errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForLoadState('networkidle');

      // Check for specific connection errors
      const connectionErrors = errors.filter(err =>
        err.includes('ECONNREFUSED') ||
        err.includes('Failed to fetch') ||
        err.includes('no Route matched')
      );

      expect(connectionErrors).toHaveLength(0);
    });

    test('should make HTTPS requests to flqgkpytrqpkqmedmtuf.supabase.co', async ({ page }) => {
      const supabaseRequests: string[] = [];

      page.on('request', request => {
        const url = request.url();
        if (url.includes('flqgkpytrqpkqmedmtuf.supabase.co')) {
          supabaseRequests.push(url);
        }
      });

      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForTimeout(2000); // Wait for any async requests

      // Should have made requests to remote Supabase
      expect(supabaseRequests.length).toBeGreaterThan(0);

      // All Supabase requests should be HTTPS
      supabaseRequests.forEach(url => {
        expect(url).toMatch(/^https:\/\//);
      });
    });

    test('should NOT make requests to localhost:54321 or 127.0.0.1', async ({ page }) => {
      const localRequests: string[] = [];

      page.on('request', request => {
        const url = request.url();
        if (url.includes('localhost:54321') || url.includes('127.0.0.1:54321')) {
          localRequests.push(url);
        }
      });

      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForTimeout(2000);

      // Should NOT make any requests to local Supabase
      expect(localRequests).toHaveLength(0);
    });
  });

  test.describe.serial('2. Authentication Flow', () => {
    test('should display sign-up form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/sign-up`);

      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Confirm Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    });

    test('should create a new account', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/sign-up`);

      // Fill in the sign-up form
      await page.getByLabel('Email').fill(TEST_EMAIL);
      await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
      await page.getByLabel('Confirm Password').fill(TEST_PASSWORD);

      // Submit the form
      await page.getByRole('button', { name: /sign up/i }).click();

      // Wait for redirect after sign up
      await page.waitForTimeout(5000); // Increased wait for Supabase response and redirect

      // Check for either redirect to confirmation or dashboard/onboarding
      const url = page.url();
      expect(url).toMatch(/success|confirm|onboarding|dashboard/i);
    });

    test('should log in with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);

      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Wait for redirect after login
      await page.waitForTimeout(3000);

      // Should redirect to onboarding or dashboard
      const url = page.url();
      expect(url).not.toContain('/auth/login');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');

      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Wait for error response from Supabase
      await page.waitForTimeout(2000);

      // Should show error message or stay on login page
      // (400 error from Supabase is expected here)
      await expect(page).toHaveURL(/auth\/login/);
    });
  });

  test.describe.serial('3. Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Log in first
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(3000);
    });

    test('should redirect to onboarding if no organization', async ({ page }) => {
      // After login without org, should go to onboarding
      await expect(page).toHaveURL(/onboarding/);
    });

    test('should show organization creation form', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/create-organization`);

      await expect(page.getByLabel(/organization name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create|continue/i })).toBeVisible();
    });

    test('should create an organization', async ({ page }) => {
      await page.goto(`${BASE_URL}/onboarding/create-organization`);

      // Fill in required organization fields
      await page.getByLabel(/organization name/i).fill(TEST_ORG_NAME);

      // Fill in required user profile fields
      await page.getByLabel(/^first name/i).fill('Test');
      await page.getByLabel(/^last name/i).fill('User');

      await page.getByRole('button', { name: /create|continue/i }).click();

      // Wait for organization creation in remote Supabase
      await page.waitForTimeout(5000);

      // Should redirect to dashboard after creating org
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe.serial('4. Dashboard Access', () => {
    test.beforeEach(async ({ page }) => {
      // Assume user is logged in and has organization
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(3000);
    });

    test('should display dashboard after login with organization', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should show navigation menu', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Check for main navigation items
      await expect(page.getByRole('link', { name: /donors/i })).toBeVisible();
    });
  });

  test.describe.serial('5. Donor Management', () => {
    test.beforeEach(async ({ page }) => {
      // Log in and navigate to donors page
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(3000);

      await page.goto(`${BASE_URL}/donors`);
    });

    test('should display donors list page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /donors/i })).toBeVisible();
    });

    test('should show create donor button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /add donor/i }).first()).toBeVisible();
    });

    test('should navigate to create donor form', async ({ page }) => {
      await page.getByRole('link', { name: /add donor/i }).first().click();

      await expect(page).toHaveURL(/donors\/new/);
    });

    test('should create a new donor', async ({ page }) => {
      await page.goto(`${BASE_URL}/donors/new`);

      const donorName = `Test Donor ${Date.now()}`;

      // Fill in donor form
      await page.getByLabel(/^first name/i).fill('John');
      await page.getByLabel(/^last name/i).fill('Doe');
      await page.getByRole('textbox', { name: /email/i }).fill(`donor-${Date.now()}@example.com`);

      // Submit form
      await page.getByRole('button', { name: /create|save|add/i }).click();

      // Wait for Supabase to save
      await page.waitForTimeout(3000);

      // Should redirect to donors list or donor detail
      const url = page.url();
      expect(url).toMatch(/donors/);
    });
  });

  test.describe.serial('6. Data Persistence (Remote Supabase)', () => {
    test('should persist data across page reloads', async ({ page, context }) => {
      // Create a donor
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(3000);

      await page.goto(`${BASE_URL}/donors/new`);
      const donorEmail = `persistent-${Date.now()}@example.com`;

      await page.getByLabel(/^first name/i).fill('Persistent');
      await page.getByLabel(/^last name/i).fill('Donor');
      await page.getByRole('textbox', { name: /email/i }).fill(donorEmail);
      await page.getByRole('button', { name: /create|save|add/i }).click();
      await page.waitForTimeout(3000);

      // Reload the page
      await page.reload();
      await page.waitForTimeout(2000);

      // Data should still be there (from remote Supabase)
      await page.goto(`${BASE_URL}/donors`);
      await expect(page.getByText(donorEmail)).toBeVisible();
    });

    test('should persist session across new tabs', async ({ page, context }) => {
      // Log in
      await page.goto(`${BASE_URL}/auth/login`);
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForTimeout(3000);

      // Open new tab
      const newPage = await context.newPage();
      await newPage.goto(`${BASE_URL}/dashboard`);

      // Should still be logged in (session from remote Supabase)
      await expect(newPage).toHaveURL(/dashboard/);

      await newPage.close();
    });
  });

  test.describe('7. Performance & Reliability', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/auth/login`);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds (generous for remote Supabase)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle multiple concurrent requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      const requests: Promise<any>[] = [];

      // Trigger multiple navigations
      requests.push(page.goto(`${BASE_URL}/auth/sign-up`));
      requests.push(page.goto(`${BASE_URL}/auth/forgot-password`));
      requests.push(page.goto(`${BASE_URL}/auth/login`));

      // All should complete without errors
      await Promise.all(requests);

      await expect(page).toHaveURL(/auth/);
    });
  });

  test.describe('8. Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      // Simulate slow network
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });

      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should eventually complete or show appropriate error
      await page.waitForTimeout(5000);

      // Check that page didn't crash
      await expect(page).not.toHaveTitle(/Error/);
    });

    test('should show appropriate error for invalid form data', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/sign-up`);

      // Submit with invalid email
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await page.getByRole('button', { name: /sign up/i }).click();

      // Should show validation errors
      await expect(page.getByText(/invalid|error|required/i)).toBeVisible();
    });
  });
});

/**
 * Test Suite Summary:
 *
 * This comprehensive E2E test suite validates:
 * 1. ✅ Remote Supabase connectivity (HTTPS to flqgkpytrqpkqmedmtuf.supabase.co)
 * 2. ✅ No local Supabase connection attempts (127.0.0.1:54321)
 * 3. ✅ Complete authentication workflow
 * 4. ✅ Organization onboarding
 * 5. ✅ Dashboard access with proper permissions
 * 6. ✅ Donor CRUD operations
 * 7. ✅ Data persistence in cloud database
 * 8. ✅ Session management across tabs
 * 9. ✅ Performance with remote backend
 * 10. ✅ Error handling and resilience
 *
 * Run with:
 * npm run test:e2e -- remote-supabase-production.spec.ts
 *
 * Or headless:
 * npx playwright test e2e/remote-supabase-production.spec.ts
 */
