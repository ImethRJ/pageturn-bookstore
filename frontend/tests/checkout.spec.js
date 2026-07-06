import { test, expect } from '@playwright/test';

test.describe('Bookstore Cart & Checkout Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the React bookstore frontend dev server
    await page.goto('http://localhost:5173');
  });

  test('should successfully sign up, search, add a book to cart, and perform checkout', async ({ page }) => {
    // 1. Sign up a new user
    // Switch to Signup mode
    await page.click('button:has-text("Create an account")');

    // Fill in signup details
    const usernameInput = page.locator('#username-input');
    const passwordInput = page.locator('#password-input');
    
    // Generate a unique test username
    const uniqueUsername = `testuser_${Date.now()}`;
    await usernameInput.fill(uniqueUsername);
    await passwordInput.fill('password123');
    
    // Click submit signup
    await page.click('#submit-auth-btn');

    // Verify catalog is loaded
    await expect(page.locator('text=Available Books')).toBeVisible();

    // 2. Enter search term 'Hobbit' to query the catalog
    const searchInput = page.locator('input[placeholder*="Search title"]');
    await searchInput.fill('Hobbit');
    
    // Verify that 'The Hobbit' book card is visible
    const hobbitCard = page.locator('text=The Hobbit');
    await expect(hobbitCard).toBeVisible();

    // 3. Click 'Add to Cart' for the Hobbit book card
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    await addToCartButton.click();

    // 4. Verify that the shopping cart sidebar lists 'The Hobbit'
    const cartItem = page.locator('section:has-text("Your Cart") >> text=The Hobbit');
    await expect(cartItem).toBeVisible();

    // 5. Click the 'Submit Checkout' button
    const checkoutButton = page.locator('#checkout-btn');
    await checkoutButton.click();

    // 6. Assert that order confirmation dialog is displayed
    const successBanner = page.locator('text=Order Placed!');
    await expect(successBanner).toBeVisible();
  });
});
