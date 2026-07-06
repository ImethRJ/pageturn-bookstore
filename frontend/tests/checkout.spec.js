const { test, expect } = require('@playwright/test');

test.describe('Bookstore Cart & Checkout Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the React bookstore frontend dev server
    await page.goto('http://localhost:5173');
  });

  test('should successfully search, add a book to cart, and perform checkout', async ({ page }) => {
    // 1. Enter search term 'Hobbit' to query the catalog
    const searchInput = page.locator('#search-input');
    await searchInput.fill('Hobbit');
    
    // Verify that 'The Hobbit' book card is visible
    const hobbitCard = page.locator('text=The Hobbit');
    await expect(hobbitCard).toBeVisible();

    // 2. Click 'Add to Cart' for the Hobbit book card
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    await addToCartButton.click();

    // 3. Verify that the shopping cart sidebar lists 'The Hobbit'
    const cartItem = page.locator('text=The Hobbit');
    await expect(cartItem).toBeVisible();

    // 4. Fill in the customer name field
    const customerNameInput = page.locator('#customer-name');
    await customerNameInput.fill('Jane Doe E2E');

    // 5. Click the 'Place Order' checkout button
    const checkoutButton = page.locator('#checkout-btn');
    await checkoutButton.click();

    // 6. Assert that checkout success dialog is displayed
    const successBanner = page.locator('text=Checkout Completed!');
    await expect(successBanner).toBeVisible();

    // Verify correct customer details in order summary
    const customerNameText = page.locator('text=Customer: Jane Doe E2E');
    await expect(customerNameText).toBeVisible();
  });
});
