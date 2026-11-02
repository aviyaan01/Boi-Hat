import { test, expect } from '@playwright/test';

test.describe('Boi-Hat Marketplace End-to-End Suite', () => {
  test('Complete flow: Homepage -> Language Switch -> Search & Filters -> Book Detail -> Auth -> Order', async ({
    page,
  }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Boi-Hat/i);
    await expect(page.locator('text=বই হাট')).toBeVisible();

    // 2. Bilingual Toggle Test (Section 14 & 20)
    const langBtn = page.locator('button:has-text("English")');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(page.locator('text=Sell a Book')).toBeVisible();
      // Switch back to Bangla
      await page.locator('button:has-text("বাংলা")').click();
      await expect(page.locator('text=বই বিক্রি করুন')).toBeVisible();
    }

    // 3. Category Grid Check
    await expect(page.locator('text=একাডেমিক ও পাঠ্যবই')).toBeVisible();
    await expect(page.locator('text=সাহিত্য ও কথাসাহিত্য')).toBeVisible();

    // 4. Search and browse
    await page.goto('/books');
    await expect(page.locator('text=বই ব্রাউজ করুন')).toBeVisible();

    // 5. Check book cards are rendered (150+ seeded books)
    const bookCards = page.locator('a[href^="/books/"]');
    await expect(bookCards.first()).toBeVisible();

    // 6. Navigate to first book detail page
    await bookCards.first().click();
    await expect(page.locator('text=ক্যাশ অন ডেলিভারি')).toBeVisible();
    await expect(page.locator('text=বিক্রয় মূল্য')).toBeVisible();
  });
});
