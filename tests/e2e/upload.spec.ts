import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDataDir = path.resolve(__dirname, 'test-data');

test.describe('File upload and dashboard', () => {
  test('uploads a JSON file and shows dashboard stats', async ({ page }) => {
    await page.goto('/');

    const filePath = path.join(testDataDir, 'two-songs.json');

    // Upload via the hidden file input
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for the dashboard to appear (landing page replaced by dashboard view)
    await expect(page.locator('.dashboard-grid.overview')).toBeVisible({ timeout: 15000 });

    // The hero stat cards should be visible
    await expect(page.locator('.stats-grid--hero')).toBeVisible();
  });

  test('displays correct hero stats for uploaded file', async ({ page }) => {
    await page.goto('/');

    const filePath = path.join(testDataDir, 'two-songs.json');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await expect(page.locator('.dashboard-grid.overview')).toBeVisible({ timeout: 15000 });

    // With default filters (hideSkipped=true): 2 non-skipped records
    await expect(page.locator('.stat-card').filter({ hasText: 'Total plays' })).toContainText('2');
    await expect(page.locator('.stat-card').filter({ hasText: 'Unique songs' })).toContainText('2');

    // History span should show 2024 – 2024
    await expect(page.locator('.stat-card').filter({ hasText: 'History span' })).toContainText(
      '2024',
    );
  });

  test('shows correct song and artist in summary', async ({ page }) => {
    await page.goto('/');

    const filePath = path.join(testDataDir, 'two-songs.json');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await expect(page.locator('.dashboard-grid.overview')).toBeVisible({ timeout: 15000 });

    // Navigate to Songs tab
    await page.locator('button.tab-nav__button', { hasText: 'Songs' }).click();

    // Bohemian Rhapsody should be visible in the top songs
    await expect(page.locator('text=Bohemian Rhapsody')).toBeVisible();
  });

  test('shows error for invalid JSON file', async ({ page }) => {
    await page.goto('/');

    const filePath = path.join(testDataDir, 'invalid.json');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Should see error banner
    await expect(page.locator('.error-banner')).toBeVisible({ timeout: 15000 });
  });

  test('loads sample data and shows dashboard', async ({ page }) => {
    await page.goto('/');

    // Click "Try sample data" button
    await page.locator('button', { hasText: 'Try sample data' }).click();

    // Wait for dashboard to appear
    await expect(page.locator('.dashboard-grid.overview')).toBeVisible({ timeout: 20000 });

    // Hero stat cards should be present
    await expect(page.locator('.stats-grid--hero')).toBeVisible();
  });
});
