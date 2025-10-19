import { test, expect } from '@playwright/test';

test.describe('Donor Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3004/auth/login');

    // Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Log any page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Log network failures
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('should update donor details and persist changes', async ({ page }) => {
    // Login first (adjust credentials as needed)
    // You may need to create a test user or use existing credentials
    console.log('Starting donor edit test...');

    // Navigate to donors list
    await page.goto('http://localhost:3004/donors');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());

    // Check if we're redirected to login (not authenticated)
    if (page.url().includes('/auth/login')) {
      console.log('Not authenticated, test cannot proceed without valid credentials');
      test.skip();
      return;
    }

    // Find and click on first donor
    const firstDonorLink = page.locator('a[href^="/donors/"]').first();
    await expect(firstDonorLink).toBeVisible({ timeout: 10000 });

    const donorId = await firstDonorLink.getAttribute('href');
    console.log('Clicking donor:', donorId);
    await firstDonorLink.click();
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editButton = page.locator('a[href*="/edit"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await page.waitForLoadState('networkidle');

    console.log('On edit page:', page.url());

    // Get current phone value
    const phoneInput = page.locator('#phone');
    await expect(phoneInput).toBeVisible();
    const originalPhone = await phoneInput.inputValue();
    console.log('Original phone:', originalPhone);

    // Update phone number
    const newPhone = '(555) 999-8888';
    await phoneInput.fill('');
    await phoneInput.fill(newPhone);
    console.log('Updated phone to:', newPhone);

    // Also update notes to have another field to check
    const notesTextarea = page.locator('#notes');
    await expect(notesTextarea).toBeVisible();
    const timestamp = new Date().toISOString();
    const newNotes = `Test update at ${timestamp}`;
    await notesTextarea.fill(newNotes);
    console.log('Updated notes to:', newNotes);

    // Set up listeners for network requests
    const updateRequests: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('donors') && response.request().method() === 'PATCH') {
        console.log('PATCH request to donors:', response.status());
        try {
          const responseBody = await response.json();
          console.log('Response body:', JSON.stringify(responseBody, null, 2));
          updateRequests.push({ status: response.status(), body: responseBody });
        } catch (e) {
          console.log('Could not parse response body');
        }
      }
    });

    // Click Update Donor button
    const updateButton = page.locator('button[type="submit"]', { hasText: 'Update Donor' });
    await expect(updateButton).toBeVisible();
    console.log('Clicking Update Donor button...');

    await updateButton.click();

    // Wait for navigation or toast
    await page.waitForTimeout(3000);

    console.log('Current URL after update:', page.url());
    console.log('Update requests captured:', updateRequests.length);

    // Check for toast messages
    const toastSuccess = page.locator('text=successfully');
    const toastError = page.locator('[role="status"]');

    if (await toastSuccess.isVisible({ timeout: 2000 })) {
      console.log('Success toast appeared');
    } else if (await toastError.isVisible({ timeout: 2000 })) {
      const errorText = await toastError.textContent();
      console.log('Error toast appeared:', errorText);
    } else {
      console.log('No toast appeared');
    }

    // Navigate back to donor detail page
    const detailUrl = donorId?.replace('/edit', '');
    if (detailUrl) {
      console.log('Navigating to detail page:', detailUrl);
      await page.goto(`http://localhost:3004${detailUrl}`);
      await page.waitForLoadState('networkidle');

      // Check if changes persisted
      const phoneDisplayed = page.locator(`text=${newPhone}`);
      const notesDisplayed = page.locator(`text=${newNotes}`);

      const phoneExists = await phoneDisplayed.count();
      const notesExists = await notesDisplayed.count();

      console.log('Phone found on detail page:', phoneExists > 0);
      console.log('Notes found on detail page:', notesExists > 0);

      if (phoneExists === 0 && notesExists === 0) {
        console.log('FAILURE: Changes did not persist!');

        // Take a screenshot
        await page.screenshot({ path: 'test-results/donor-edit-failure.png', fullPage: true });

        throw new Error('Donor updates did not persist to database');
      }

      expect(phoneExists).toBeGreaterThan(0);
      console.log('SUCCESS: Changes persisted correctly');
    }
  });
});
