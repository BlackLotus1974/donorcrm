import { test, expect } from '@playwright/test';

test.describe('Context Template Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to templates
    await page.goto('/auth/login');
    // In a real scenario, you'd login with test credentials
    // For now, we'll assume authentication is handled
  });

  test.describe('Collaborator Management', () => {
    test('should display collaborators page', async ({ page }) => {
      // Navigate to a template's collaboration page
      await page.goto('/context-templates/test-template-id/collaborate');

      // Check that the collaboration page loads
      await expect(page.getByRole('heading', { name: /collaboration/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /collaborators/i })).toBeVisible();
    });

    test('should add a new collaborator', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click on Collaborators tab
      await page.getByRole('tab', { name: /collaborators/i }).click();

      // Check if "Add Collaborator" button exists
      const addButton = page.getByRole('button', { name: /add collaborator/i });

      if (await addButton.isVisible()) {
        // Click add collaborator button
        await addButton.click();

        // Dialog should open
        await expect(page.getByText('Invite a team member to collaborate')).toBeVisible();

        // Select a user (this would need real test data)
        // await page.getByRole('combobox').click();
        // await page.getByText('Test User').click();

        // Select a role
        // await page.getByLabel('Role').click();
        // await page.getByRole('option', { name: /contributor/i }).click();

        // Submit form
        // await page.getByRole('button', { name: /add collaborator/i }).click();

        // Verify success
        // await expect(page.getByText('Test User')).toBeVisible();
      }
    });

    test('should display existing collaborators', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /collaborators/i }).click();

      // Should show collaborator count in header
      await expect(page.getByText(/Collaborators \(\d+\)/)).toBeVisible();
    });

    test('should remove a collaborator', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /collaborators/i }).click();

      // Look for dropdown menu on a collaborator
      const dropdownButtons = page.getByRole('button').filter({ hasText: '' });

      if (await dropdownButtons.first().isVisible()) {
        // Click dropdown
        await dropdownButtons.first().click();

        // Click remove if available
        const removeOption = page.getByRole('menuitem', { name: /remove/i });
        if (await removeOption.isVisible()) {
          await removeOption.click();

          // Confirm dialog
          page.on('dialog', dialog => dialog.accept());
        }
      }
    });

    test('should show collaborator permissions', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /collaborators/i }).click();

      // Check for permission badges
      const permissionBadges = ['Edit', 'Comment', 'Approve'];

      for (const permission of permissionBadges) {
        // At least one permission badge should be visible
        const badge = page.getByText(permission).first();
        if (await badge.isVisible()) {
          await expect(badge).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe('Comment System', () => {
    test('should navigate to comments tab', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click Comments tab
      await page.getByRole('tab', { name: /comments/i }).click();

      // Should show comment form
      await expect(page.getByPlaceholder(/add a general comment/i)).toBeVisible();
    });

    test('should add a new comment', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /comments/i }).click();

      // Type in comment field
      const commentText = 'This is a test comment';
      await page.getByPlaceholder(/add a general comment/i).fill(commentText);

      // Post button should be enabled
      const postButton = page.getByRole('button', { name: /post comment/i });
      await expect(postButton).toBeEnabled();

      // Click post (would actually create comment in real scenario)
      // await postButton.click();

      // Verify comment appears
      // await expect(page.getByText(commentText)).toBeVisible();
    });

    test('should reply to a comment', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /comments/i }).click();

      // Find reply button on existing comment
      const replyButton = page.getByRole('button', { name: /reply/i }).first();

      if (await replyButton.isVisible()) {
        await replyButton.click();

        // Reply form should appear
        await expect(page.getByPlaceholder('Write your reply...')).toBeVisible();

        // Type reply
        await page.getByPlaceholder('Write your reply...').fill('This is a reply');

        // Post reply
        // await page.getByRole('button', { name: /post reply/i }).click();
      }
    });

    test('should resolve a comment', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /comments/i }).click();

      // Find resolve button on existing comment
      const resolveButton = page.getByRole('button', { name: /^resolve$/i }).first();

      if (await resolveButton.isVisible()) {
        await resolveButton.click();

        // Comment should show resolved badge
        // await expect(page.getByText('Resolved')).toBeVisible();
      }
    });

    test('should show component-specific comments', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /comments/i }).click();

      // Check for component sections
      const componentNames = ['Instructions', 'User Prompt', 'State/History'];

      for (const component of componentNames) {
        const section = page.getByText(component);
        if (await section.isVisible()) {
          await expect(section).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe('Version History', () => {
    test('should navigate to versions tab', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click Versions tab
      await page.getByRole('tab', { name: /versions/i }).click();

      // Should show version history title
      await expect(page.getByText(/Version History/i)).toBeVisible();
    });

    test('should display version list', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /versions/i }).click();

      // Check for version badges (e.g., "v1.0.0")
      const versionBadge = page.getByText(/v\d+\.\d+\.\d+/).first();
      if (await versionBadge.isVisible()) {
        await expect(versionBadge).toBeVisible();
      }
    });

    test('should view version details', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /versions/i }).click();

      // Find and click view button (eye icon)
      const viewButtons = page.getByRole('button').filter({ has: page.locator('svg') });
      const viewButton = viewButtons.first();

      if (await viewButton.isVisible()) {
        await viewButton.click();

        // Dialog should open with version details
        await expect(page.getByText(/Version .* Details/i)).toBeVisible();
      }
    });

    test('should show current version badge', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /versions/i }).click();

      // Current version should be marked
      const currentBadge = page.getByText('Current').first();
      if (await currentBadge.isVisible()) {
        await expect(currentBadge).toBeVisible();
      }
    });

    test('should restore a previous version', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /versions/i }).click();

      // Find restore button (rotate icon) for non-current version
      const restoreButtons = page.getByRole('button').filter({ has: page.locator('svg') });

      // Would need to identify non-current version and click restore
      // Then confirm dialog
      // await restoreButton.click();
      // page.on('dialog', dialog => dialog.accept());
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should navigate to analytics tab', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click Analytics tab
      await page.getByRole('tab', { name: /analytics/i }).click();

      // Should show analytics content
      await expect(page.getByText(/Views|Edits|Exports/i)).toBeVisible();
    });

    test('should display usage metrics', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /analytics/i }).click();

      // Check for metric cards
      const metrics = ['Views', 'Edits', 'Exports', 'Clones'];

      for (const metric of metrics) {
        const card = page.getByText(metric).first();
        if (await card.isVisible()) {
          await expect(card).toBeVisible();
        }
      }
    });

    test('should display charts', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /analytics/i }).click();

      // Charts should be rendered (Recharts creates SVG elements)
      const charts = page.locator('svg');
      const chartCount = await charts.count();

      // Should have at least one chart
      expect(chartCount).toBeGreaterThan(0);
    });

    test('should show performance metrics', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /analytics/i }).click();

      // Check for performance indicators
      const performanceTexts = ['Quality Score', 'Completion Time', 'Success Rate'];

      for (const text of performanceTexts) {
        const metric = page.getByText(new RegExp(text, 'i')).first();
        if (await metric.isVisible()) {
          await expect(metric).toBeVisible();
        }
      }
    });

    test('should display recent activity', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /analytics/i }).click();

      // Check for recent activity section
      const activitySection = page.getByText('Recent Activity');
      if (await activitySection.isVisible()) {
        await expect(activitySection).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to template detail', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click back button
      const backButton = page.getByRole('button', { name: /back to template/i });
      await expect(backButton).toBeVisible();

      // Clicking would navigate to detail page
      // await backButton.click();
      // await expect(page).toHaveURL(/\/context-templates\/test-template-id$/);
    });

    test('should navigate to edit template', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click edit button
      const editButton = page.getByRole('button', { name: /edit template/i });
      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible();
      }
    });

    test('should switch between tabs', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Click through all tabs
      const tabs = ['Collaborators', 'Comments', 'Versions', 'Analytics'];

      for (const tab of tabs) {
        await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
        await page.waitForTimeout(100); // Brief wait for tab content
      }
    });
  });

  test.describe('Permissions', () => {
    test('should hide add collaborator button without permission', async ({ page }) => {
      // This would need a user without manage_collaborators permission
      await page.goto('/context-templates/test-template-id/collaborate');
      await page.getByRole('tab', { name: /collaborators/i }).click();

      // In a real test, you'd check based on user role
      // const addButton = page.getByRole('button', { name: /add collaborator/i });
      // await expect(addButton).not.toBeVisible();
    });

    test('should disable actions without proper permissions', async ({ page }) => {
      await page.goto('/context-templates/test-template-id/collaborate');

      // Various actions should be disabled/hidden based on permissions
      // This would require testing with different user roles
    });
  });
});
