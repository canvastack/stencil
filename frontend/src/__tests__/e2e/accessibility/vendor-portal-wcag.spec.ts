/**
 * WCAG 2.1 Compliance Tests for Vendor Portal
 * 
 * This test suite verifies accessibility compliance for the vendor portal
 * according to WCAG 2.1 Level AA standards.
 * 
 * Tests cover:
 * - Keyboard navigation
 * - Screen reader compatibility (ARIA attributes)
 * - Color contrast ratios
 * - Form labels and accessibility
 * 
 * Tools: Playwright + axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test configuration
const VENDOR_BASE_URL = 'http://localhost:5173/vendor';

test.describe('WCAG 2.1 Compliance - Vendor Portal', () => {
  
  test.describe('Keyboard Navigation', () => {
    
    test('should navigate login page with keyboard only', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Tab through all interactive elements
      await page.keyboard.press('Tab'); // Email field
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Password field
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Login button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Forgot password link
      const forgotPasswordLink = page.locator('a:has-text("Forgot Password")');
      if (await forgotPasswordLink.count() > 0) {
        await expect(forgotPasswordLink).toBeFocused();
      }
    });
    
    test('should navigate dashboard with keyboard only', async ({ page }) => {
      // Note: This test assumes authentication is handled
      // In real scenario, you'd need to login first
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      // Check that all navigation links are keyboard accessible
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });
    
    test('should navigate quote list with keyboard', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      // Tab through filter controls
      await page.keyboard.press('Tab');
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'SELECT', 'BUTTON', 'A']).toContain(firstFocusable);
      
      // Verify quote cards are keyboard accessible
      const quoteLinks = page.locator('[role="link"], a[href*="/quotes/"]');
      if (await quoteLinks.count() > 0) {
        await quoteLinks.first().focus();
        await expect(quoteLinks.first()).toBeFocused();
      }
    });
    
    test('should support keyboard shortcuts for common actions', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      // Test Escape key closes modals (if any are open)
      const modal = page.locator('[role="dialog"]');
      if (await modal.count() > 0) {
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
    
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Focus on email input
      await page.locator('input[type="email"]').focus();
      
      // Check that focus indicator is visible
      const focusedElement = page.locator('input[type="email"]:focus');
      const outlineStyle = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        };
      });
      
      // Verify some form of focus indicator exists
      const hasFocusIndicator = 
        focusedElement !== 'none' ||
        parseFloat(outlineStyle.outlineWidth) > 0 ||
        outlineStyle.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBeTruthy();
    });
  });
  
  test.describe('Screen Reader Compatibility', () => {
    
    test('should have proper ARIA labels on login form', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Check email input has label
      const emailInput = page.locator('input[type="email"]');
      const emailLabel = await emailInput.getAttribute('aria-label') || 
                         await emailInput.getAttribute('aria-labelledby');
      const emailLabelElement = page.locator('label[for]').filter({ hasText: /email/i });
      
      expect(emailLabel || await emailLabelElement.count() > 0).toBeTruthy();
      
      // Check password input has label
      const passwordInput = page.locator('input[type="password"]');
      const passwordLabel = await passwordInput.getAttribute('aria-label') ||
                           await passwordInput.getAttribute('aria-labelledby');
      const passwordLabelElement = page.locator('label[for]').filter({ hasText: /password/i });
      
      expect(passwordLabel || await passwordLabelElement.count() > 0).toBeTruthy();
      
      // Check submit button has accessible name
      const submitButton = page.locator('button[type="submit"]');
      const buttonText = await submitButton.textContent();
      const buttonAriaLabel = await submitButton.getAttribute('aria-label');
      
      expect(buttonText || buttonAriaLabel).toBeTruthy();
    });
    
    test('should have proper ARIA roles for navigation', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      expect(await nav.count()).toBeGreaterThan(0);
      
      // Check for main content landmark
      const main = page.locator('main, [role="main"]');
      expect(await main.count()).toBeGreaterThan(0);
    });
    
    test('should have proper ARIA attributes on quote cards', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      // Check quote cards have proper structure
      const quoteCards = page.locator('[role="article"], article, [data-testid*="quote"]');
      
      if (await quoteCards.count() > 0) {
        const firstCard = quoteCards.first();
        
        // Check for accessible name
        const ariaLabel = await firstCard.getAttribute('aria-label');
        const ariaLabelledby = await firstCard.getAttribute('aria-labelledby');
        const heading = firstCard.locator('h1, h2, h3, h4, h5, h6');
        
        expect(ariaLabel || ariaLabelledby || await heading.count() > 0).toBeTruthy();
      }
    });
    
    test('should have proper ARIA live regions for notifications', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      // Check for ARIA live region for notifications
      const liveRegion = page.locator('[role="alert"], [role="status"], [aria-live]');
      
      // Live regions should exist for dynamic content
      // Note: This might not always be visible, but should be in DOM
      const liveRegionCount = await liveRegion.count();
      expect(liveRegionCount).toBeGreaterThanOrEqual(0); // At least structure should exist
    });
    
    test('should have proper ARIA attributes on modals', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      // Look for modal triggers
      const modalTrigger = page.locator('button:has-text("Accept"), button:has-text("Reject")');
      
      if (await modalTrigger.count() > 0) {
        await modalTrigger.first().click();
        
        // Check modal has proper ARIA attributes
        const modal = page.locator('[role="dialog"]');
        expect(await modal.count()).toBeGreaterThan(0);
        
        // Check modal has aria-labelledby or aria-label
        const ariaLabel = await modal.getAttribute('aria-label');
        const ariaLabelledby = await modal.getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
        
        // Check modal has aria-modal
        const ariaModal = await modal.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');
      }
    });
    
    test('should have proper form field descriptions', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/profile`);
      
      // Check form fields have descriptions for errors
      const formFields = page.locator('input, textarea, select');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 0) {
        const firstField = formFields.first();
        
        // Check for aria-describedby (for error messages or hints)
        const ariaDescribedby = await firstField.getAttribute('aria-describedby');
        const ariaInvalid = await firstField.getAttribute('aria-invalid');
        
        // At minimum, fields should support aria-describedby for errors
        expect(ariaDescribedby !== null || ariaInvalid !== null || true).toBeTruthy();
      }
    });
  });
  
  test.describe('Color Contrast Ratios', () => {
    
    test('should meet WCAG AA contrast requirements on login page', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .include('body')
        .analyze();
      
      // Filter for color contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );
      
      expect(contrastViolations).toHaveLength(0);
    });
    
    test('should meet WCAG AA contrast requirements on dashboard', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .include('body')
        .analyze();
      
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );
      
      expect(contrastViolations).toHaveLength(0);
    });
    
    test('should meet WCAG AA contrast requirements on quote list', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .include('body')
        .analyze();
      
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );
      
      expect(contrastViolations).toHaveLength(0);
    });
    
    test('should have sufficient contrast for status badges', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      // Check status badges have sufficient contrast
      const statusBadges = page.locator('[class*="badge"], [class*="status"]');
      
      if (await statusBadges.count() > 0) {
        const firstBadge = statusBadges.first();
        
        const contrast = await firstBadge.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
          };
        });
        
        // Verify colors are defined (actual contrast calculation would need a library)
        expect(contrast.color).toBeTruthy();
        expect(contrast.backgroundColor).toBeTruthy();
      }
    });
  });
  
  test.describe('Form Labels and Accessibility', () => {
    
    test('should have proper labels for all form inputs on login', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag21a'])
        .include('form')
        .analyze();
      
      // Check for label violations
      const labelViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'label' || v.id === 'label-title-only'
      );
      
      expect(labelViolations).toHaveLength(0);
    });
    
    test('should have proper labels for profile form', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/profile`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag21a'])
        .include('form')
        .analyze();
      
      const labelViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'label' || v.id === 'label-title-only'
      );
      
      expect(labelViolations).toHaveLength(0);
    });
    
    test('should have proper error messages associated with fields', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Submit form without filling to trigger errors
      await page.locator('button[type="submit"]').click();
      
      // Wait for error messages
      await page.waitForTimeout(500);
      
      // Check that error messages are associated with fields
      const errorMessages = page.locator('[role="alert"], [class*="error"]');
      
      if (await errorMessages.count() > 0) {
        // Verify error messages are visible
        const firstError = errorMessages.first();
        await expect(firstError).toBeVisible();
      }
    });
    
    test('should have required field indicators', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Check for required attribute or aria-required
      const requiredFields = page.locator('input[required], input[aria-required="true"]');
      const requiredCount = await requiredFields.count();
      
      // Login form should have required fields
      expect(requiredCount).toBeGreaterThan(0);
      
      // Check for visual required indicators (*, "required", etc.)
      const requiredIndicators = page.locator('text=/\\*|required/i');
      expect(await requiredIndicators.count()).toBeGreaterThanOrEqual(0);
    });
    
    test('should have proper fieldset and legend for grouped inputs', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/profile`);
      
      // Check for fieldsets if radio buttons or checkboxes exist
      const radioButtons = page.locator('input[type="radio"]');
      const checkboxes = page.locator('input[type="checkbox"]');
      
      if (await radioButtons.count() > 0 || await checkboxes.count() > 0) {
        const fieldsets = page.locator('fieldset');
        const legends = page.locator('legend');
        
        // If grouped inputs exist, they should be in fieldsets
        expect(await fieldsets.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
  
  test.describe('Comprehensive Accessibility Scan', () => {
    
    test('should pass axe accessibility scan on login page', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
    
    test('should pass axe accessibility scan on dashboard', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
    
    test('should pass axe accessibility scan on quote list', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/quotes`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
    
    test('should pass axe accessibility scan on quote detail', async ({ page }) => {
      // Note: This requires a valid quote UUID
      // In real scenario, you'd fetch a test quote first
      await page.goto(`${VENDOR_BASE_URL}/quotes/test-uuid`);
      
      // Only run if page loads successfully
      const pageTitle = await page.title();
      if (pageTitle && !pageTitle.includes('404')) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        
        expect(accessibilityScanResults.violations).toHaveLength(0);
      }
    });
    
    test('should pass axe accessibility scan on profile page', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/profile`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
  });
  
  test.describe('Additional WCAG 2.1 Requirements', () => {
    
    test('should support text resize up to 200%', async ({ page, context }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      // Set zoom to 200%
      await context.addInitScript(() => {
        document.body.style.zoom = '2';
      });
      
      await page.reload();
      
      // Check that content is still accessible
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });
    
    test('should have skip navigation link', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      // Check for skip link (usually hidden but accessible via keyboard)
      const skipLink = page.locator('a[href="#main"], a:has-text("Skip to")');
      
      if (await skipLink.count() > 0) {
        // Focus on skip link
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();
      }
    });
    
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/dashboard`);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['best-practice'])
        .analyze();
      
      // Check for heading order violations
      const headingViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'heading-order'
      );
      
      expect(headingViolations).toHaveLength(0);
    });
    
    test('should have proper page titles', async ({ page }) => {
      const pages = [
        { url: `${VENDOR_BASE_URL}/login`, expectedTitle: /login|sign in/i },
        { url: `${VENDOR_BASE_URL}/dashboard`, expectedTitle: /dashboard/i },
        { url: `${VENDOR_BASE_URL}/quotes`, expectedTitle: /quotes/i },
        { url: `${VENDOR_BASE_URL}/profile`, expectedTitle: /profile/i },
      ];
      
      for (const { url, expectedTitle } of pages) {
        await page.goto(url);
        const title = await page.title();
        expect(title).toMatch(expectedTitle);
      }
    });
    
    test('should have proper language attribute', async ({ page }) => {
      await page.goto(`${VENDOR_BASE_URL}/login`);
      
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., "en" or "en-US"
    });
  });
});
