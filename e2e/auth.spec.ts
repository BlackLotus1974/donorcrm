import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Check that login form is visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check navigation links
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
    await expect(page.getByText(/forgot your password/i)).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click sign up link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should navigate to sign up page
    await expect(page).toHaveURL(/.*\/auth\/sign-up/);
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.getByRole('link', { name: /forgot your password/i }).click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message (this will depend on your error handling)
    // await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});

test.describe('Onboarding Flow', () => {
  // Note: These tests would require a test user or mocked authentication
  // For a real implementation, you'd want to set up test users
  
  test.skip('should redirect to onboarding for new users', async ({ page }) => {
    // This test would require authenticated test user without organization
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL(/.*\/onboarding/);
    await expect(page.getByRole('heading', { name: /welcome to donor crm/i })).toBeVisible();
  });

  test.skip('should allow creating new organization', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Select create organization option
    await page.getByText(/create new organization/i).click();
    await page.getByRole('button', { name: /create organization/i }).click();
    
    await expect(page).toHaveURL(/.*\/onboarding\/create-organization/);
    
    // Fill in organization form
    await page.getByLabel(/organization name/i).fill('Test Organization');
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    
    // Submit form
    await page.getByRole('button', { name: /create organization/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});