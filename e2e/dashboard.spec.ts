import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const testUsername = 'admin';
const testPassword = 'admin123';

test.describe('Auto Docs E2E Workflow', () => {

  test.beforeAll(async () => {
    // Ensure test files exist
    const testFilePath = path.join(__dirname, 'fixtures', 'test_document.txt');
    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
    }
    fs.writeFileSync(testFilePath, 'Hợp đồng thử nghiệm cấp cho ông Nguyễn Văn A. Từ ngày 01/01/2026. Số tiền: 500000', 'utf-8');

    // Create or update test user
    const { execSync } = require('child_process');
    try {
      execSync('npx tsx update-admin-password.js', { stdio: 'ignore' });
    } catch (e) {
      console.log('Failed to run update script, assuming admin exists');
    }
  });

  test.setTimeout(120000); // Allow 2 minutes for slow Next.js dev server compilation

  test('should login and view dashboard', async ({ page }) => {
    // Go to root, should redirect to login
    await page.goto('/');
    
    // We're either on default next-auth or a custom login page
    await expect(page).toHaveURL(/.*\/login|.*\/api\/auth\/signin.*/, { timeout: 30000 });
    
    // Find input fields
    const usernameInput = page.locator('input[id="username"], input[name="username"], input[id="input-username-for-credentials-provider"]').first();
    const passwordInput = page.locator('input[id="password"], input[name="password"], input[id="input-password-for-credentials-provider"]').first();
    
    await usernameInput.fill(testUsername);
    await passwordInput.fill(testPassword);
    
    // Click Sign In (button with type submit)
    await page.locator('button[type="submit"]').first().click();

    // Should redirect back to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Check if either Dashboard text or Error is visible
    const dashboardTitle = page.locator('text=Dashboard').first();
    const errorMsg = page.locator('text=Không thể tải dữ liệu').first();
    await expect(dashboardTitle.or(errorMsg)).toBeVisible({ timeout: 30000 });

    if (await errorMsg.isVisible()) {
       throw new Error('DASHBOARD ERRORED OUT (Likely DB connection failure)');
    } else {
       // Maybe we are still on the login page with an error?
       const loginError = page.locator('text=Tên đăng nhập hoặc mật khẩu không đúng');
       if (await loginError.isVisible({ timeout: 2000 })) {
         throw new Error('LOGIN FAILED: Invalid credentials');
       }

       await expect(page.locator('text=Tạo tài liệu mới').first()).toBeVisible();
       await page.click('text=Tạo tài liệu mới');
       await expect(page).toHaveURL(/.*\/dashboard\/create/);
    }
  });

});
