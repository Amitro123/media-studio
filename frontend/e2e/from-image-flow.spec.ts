import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('From Image Flow', () => {
    test('should complete full workflow', async ({ page }) => {
        // Navigate to home
        await page.goto('/');

        // Verify home screen
        await expect(page.getByText('MEDIA STUDIO')).toBeVisible();
        await expect(page.getByText('From Image')).toBeVisible();

        // Click "From Image"
        await page.getByRole('button', { name: 'From Image' }).click();

        // Verify upload area appears
        await expect(page.getByText('Drop your image here')).toBeVisible();

        // Upload test image
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test-image.jpg'));

        // Wait for editor screen
        await expect(page.getByText('PREVIEW')).toBeVisible();
        await expect(page.getByText('DESIGN CONTROLS')).toBeVisible();

        // Fill in title
        await page.getByPlaceholder(/title/i).fill('Test Sale 50%');

        // Fill in CTA
        await page.getByPlaceholder(/call-to-action/i).fill('Buy Now');

        // Select text position
        await page.getByRole('button', { name: 'Top' }).click();

        // Adjust font size
        const fontSlider = page.locator('input[type="range"]').first();
        await fontSlider.fill('100');

        // Generate assets
        await page.getByRole('button', { name: /Generate.*Assets/i }).click();

        // Wait for results
        await expect(page.getByText('Generated Assets')).toBeVisible();

        // Verify 4 cards
        const assetCards = page.locator('.result-card');
        await expect(assetCards).toHaveCount(4);

        // Verify download buttons
        await expect(page.getByRole('button', { name: /Download/i }).first()).toBeVisible();
    });
});
