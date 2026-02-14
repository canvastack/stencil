import { test, expect } from '@playwright/test';

/**
 * QC Workflow E2E Tests
 * 
 * Tests the complete Quality Control inspection workflow including:
 * - Creating QC inspections
 * - Filling out checklist items
 * - Uploading photos
 * - Approving/rejecting inspections
 * - Order status updates
 * - Vendor notifications
 */

test.describe('QC Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@etchinx.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test.describe('QC Inspection Creation', () => {
    test('should navigate to QC inspection form from order detail', async ({ page }) => {
      // Navigate to an order in production
      await page.goto('/admin/orders');
      
      // Find an order in production status
      await page.click('text=In Production');
      
      // Click on first order
      await page.click('[data-testid="order-row"]:first-child');
      
      // Should see QC inspection button
      await expect(page.locator('text=Start QC Inspection')).toBeVisible();
      
      // Click to start inspection
      await page.click('text=Start QC Inspection');
      
      // Should navigate to QC inspection form
      await expect(page).toHaveURL(/\/admin\/orders\/.*\/qc-inspection$/);
      await expect(page.locator('text=Quality Control Inspection')).toBeVisible();
    });


    test('should display all checklist categories', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Check all 5 main categories are present
      await expect(page.locator('text=1. Physical Specifications')).toBeVisible();
      await expect(page.locator('text=2. Etching Quality')).toBeVisible();
      await expect(page.locator('text=3. Finishing Quality')).toBeVisible();
      await expect(page.locator('text=4. Functional Checks')).toBeVisible();
      await expect(page.locator('text=5. Packaging & Presentation')).toBeVisible();
      await expect(page.locator('text=6. Final Approval')).toBeVisible();
    });

    test('should expand and collapse checklist categories', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Click to expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Should see checklist items
      await expect(page.locator('text=Dimensions Accuracy')).toBeVisible();
      await expect(page.locator('text=Material Verification')).toBeVisible();
      await expect(page.locator('text=Weight Check')).toBeVisible();
      
      // Click again to collapse
      await page.click('text=1. Physical Specifications');
      
      // Items should be hidden
      await expect(page.locator('text=Dimensions Accuracy')).not.toBeVisible();
    });
  });

  test.describe('Checklist Item Interaction', () => {
    test('should allow marking items as pass/fail/needs rework', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Mark Dimensions Accuracy as Pass
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      
      // Should show pass status
      await expect(page.locator('[data-testid="dimensions-accuracy-status"]')).toHaveText('Pass');
      
      // Mark Material Verification as Fail
      await page.click('[data-testid="material-verification-fail"]');
      
      // Should show fail status
      await expect(page.locator('[data-testid="material-verification-status"]')).toHaveText('Fail');
    });


    test('should allow adding notes to checklist items', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Add notes to Dimensions Accuracy
      await page.fill('[data-testid="dimensions-accuracy-notes"]', 'All dimensions within tolerance ±1mm');
      
      // Notes should be saved
      await expect(page.locator('[data-testid="dimensions-accuracy-notes"]')).toHaveValue('All dimensions within tolerance ±1mm');
    });

    test('should allow entering measurements', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Enter measurements
      await page.fill('[data-testid="dimensions-length"]', '150');
      await page.fill('[data-testid="dimensions-width"]', '100');
      await page.fill('[data-testid="dimensions-height"]', '3');
      
      // Measurements should be saved
      await expect(page.locator('[data-testid="dimensions-length"]')).toHaveValue('150');
      await expect(page.locator('[data-testid="dimensions-width"]')).toHaveValue('100');
      await expect(page.locator('[data-testid="dimensions-height"]')).toHaveValue('3');
    });
  });

  test.describe('Photo Upload', () => {
    test('should allow uploading photos for checklist items', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Upload photo for Dimensions Accuracy
      const fileInput = page.locator('[data-testid="dimensions-accuracy-photo-upload"]');
      await fileInput.setInputFiles('test-fixtures/sample-photo.jpg');
      
      // Should show photo preview
      await expect(page.locator('[data-testid="dimensions-accuracy-photo-preview"]')).toBeVisible();
    });

    test('should allow uploading multiple photos', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Upload multiple photos
      const fileInput = page.locator('[data-testid="dimensions-accuracy-photo-upload"]');
      await fileInput.setInputFiles([
        'test-fixtures/photo1.jpg',
        'test-fixtures/photo2.jpg',
        'test-fixtures/photo3.jpg'
      ]);
      
      // Should show all photo previews
      const previews = page.locator('[data-testid="dimensions-accuracy-photo-preview"]');
      await expect(previews).toHaveCount(3);
    });


    test('should allow removing uploaded photos', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Upload photo
      const fileInput = page.locator('[data-testid="dimensions-accuracy-photo-upload"]');
      await fileInput.setInputFiles('test-fixtures/sample-photo.jpg');
      
      // Click remove button
      await page.click('[data-testid="dimensions-accuracy-photo-remove-0"]');
      
      // Photo should be removed
      await expect(page.locator('[data-testid="dimensions-accuracy-photo-preview"]')).not.toBeVisible();
    });

    test('should show photo count and requirements', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Should show minimum photo requirement
      await expect(page.locator('text=Minimum 2 required')).toBeVisible();
      
      // Upload 1 photo
      const fileInput = page.locator('[data-testid="dimensions-accuracy-photo-upload"]');
      await fileInput.setInputFiles('test-fixtures/photo1.jpg');
      
      // Should show 1/5 count
      await expect(page.locator('text=1/5')).toBeVisible();
      
      // Upload another photo
      await fileInput.setInputFiles('test-fixtures/photo2.jpg');
      
      // Should show 2/5 count
      await expect(page.locator('text=2/5')).toBeVisible();
    });
  });

  test.describe('Score Calculation', () => {
    test('should calculate score based on checked items', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Initially score should be 0%
      await expect(page.locator('[data-testid="total-score"]')).toHaveText('0%');
      
      // Mark 5 items as pass (out of 15 total)
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      await page.click('[data-testid="material-verification-pass"]');
      await page.click('[data-testid="weight-check-pass"]');
      
      await page.click('text=2. Etching Quality');
      await page.click('[data-testid="etching-depth-pass"]');
      await page.click('[data-testid="design-accuracy-pass"]');
      
      // Score should be 33.33% (5/15)
      await expect(page.locator('[data-testid="total-score"]')).toHaveText('33%');
    });


    test('should track critical items status', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Initially critical items not passed
      await expect(page.locator('[data-testid="critical-items-status"]')).toHaveText('Not All Passed');
      
      // Mark all critical items as pass
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-pass"]'); // Critical
      await page.click('[data-testid="material-verification-pass"]'); // Critical
      
      await page.click('text=2. Etching Quality');
      await page.click('[data-testid="design-accuracy-pass"]'); // Critical
      
      await page.click('text=3. Finishing Quality');
      await page.click('[data-testid="surface-finish-pass"]'); // Critical
      
      // Critical items should now be passed
      await expect(page.locator('[data-testid="critical-items-status"]')).toHaveText('All Passed');
    });

    test('should disable submit if critical items failed', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Mark a critical item as fail
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-fail"]');
      
      // Submit button should be disabled
      await expect(page.locator('button:has-text("Submit Inspection")')).toBeDisabled();
      
      // Should show warning
      await expect(page.locator('text=Cannot submit: Critical items must pass')).toBeVisible();
    });
  });

  test.describe('Final Approval', () => {
    test('should allow selecting overall rating', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Scroll to final approval section
      await page.click('text=6. Final Approval');
      
      // Select overall rating
      await page.selectOption('[data-testid="overall-rating"]', 'excellent');
      
      // Rating should be selected
      await expect(page.locator('[data-testid="overall-rating"]')).toHaveValue('excellent');
    });

    test('should allow selecting final decision', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Scroll to final approval section
      await page.click('text=6. Final Approval');
      
      // Select approved decision
      await page.click('[data-testid="decision-approved"]');
      
      // Decision should be selected
      await expect(page.locator('[data-testid="decision-approved"]')).toBeChecked();
    });


    test('should require decision notes for rejected inspections', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Scroll to final approval section
      await page.click('text=6. Final Approval');
      
      // Select rejected decision
      await page.click('[data-testid="decision-rejected"]');
      
      // Decision notes field should be visible and required
      await expect(page.locator('[data-testid="decision-notes"]')).toBeVisible();
      await expect(page.locator('[data-testid="decision-notes"]')).toHaveAttribute('required');
    });

    test('should allow entering inspector information', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Scroll to final approval section
      await page.click('text=6. Final Approval');
      
      // Enter inspector name
      await page.fill('[data-testid="inspector-name"]', 'John Doe');
      
      // Enter inspection duration
      await page.fill('[data-testid="inspection-duration"]', '25');
      
      // Values should be saved
      await expect(page.locator('[data-testid="inspector-name"]')).toHaveValue('John Doe');
      await expect(page.locator('[data-testid="inspection-duration"]')).toHaveValue('25');
    });
  });

  test.describe('Inspection Submission - Approved', () => {
    test('should submit approved inspection successfully', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out inspection with all pass
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      await page.click('[data-testid="material-verification-pass"]');
      await page.click('[data-testid="weight-check-pass"]');
      
      await page.click('text=2. Etching Quality');
      await page.click('[data-testid="etching-depth-pass"]');
      await page.click('[data-testid="design-accuracy-pass"]');
      await page.click('[data-testid="line-quality-pass"]');
      
      await page.click('text=3. Finishing Quality');
      await page.click('[data-testid="surface-finish-pass"]');
      await page.click('[data-testid="edge-quality-pass"]');
      await page.click('[data-testid="color-consistency-pass"]');
      
      // Final approval
      await page.click('text=6. Final Approval');
      await page.selectOption('[data-testid="overall-rating"]', 'excellent');
      await page.click('[data-testid="decision-approved"]');
      await page.fill('[data-testid="inspector-name"]', 'John Doe');
      
      // Submit
      await page.click('button:has-text("Submit Inspection")');
      
      // Should show success message
      await expect(page.locator('text=QC inspection submitted successfully')).toBeVisible();
      
      // Should redirect to order detail
      await expect(page).toHaveURL(/\/admin\/orders\/.*$/);
    });


    test('should update order status to shipping when approved', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out and submit approved inspection
      // ... (same as above test)
      
      // Navigate to order detail
      await page.goto('/admin/orders/test-order-uuid');
      
      // Order status should be updated to Shipping
      await expect(page.locator('[data-testid="order-status"]')).toHaveText('Shipping');
    });

    test('should not send vendor notification when approved', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out and submit approved inspection
      // ... (same as above test)
      
      // Check that vendor_notified_at is null
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      await expect(page.locator('[data-testid="vendor-notified"]')).toHaveText('No');
    });
  });

  test.describe('Inspection Submission - Rejected', () => {
    test('should submit rejected inspection successfully', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out inspection with some failures
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      await page.click('[data-testid="material-verification-pass"]');
      await page.click('[data-testid="weight-check-pass"]');
      
      await page.click('text=2. Etching Quality');
      await page.click('[data-testid="etching-depth-fail"]');
      await page.click('[data-testid="design-accuracy-pass"]');
      await page.click('[data-testid="line-quality-fail"]');
      
      await page.click('text=3. Finishing Quality');
      await page.click('[data-testid="surface-finish-pass"]');
      await page.click('[data-testid="edge-quality-fail"]');
      
      // Final approval
      await page.click('text=6. Final Approval');
      await page.selectOption('[data-testid="overall-rating"]', 'poor');
      await page.click('[data-testid="decision-rejected"]');
      await page.fill('[data-testid="decision-notes"]', 'Multiple quality issues: etching depth inconsistent, line quality poor, edges rough');
      await page.fill('[data-testid="inspector-name"]', 'John Doe');
      
      // Set rework deadline
      await page.fill('[data-testid="rework-deadline"]', '2026-02-21T10:00');
      
      // Submit
      await page.click('button:has-text("Submit Inspection")');
      
      // Should show success message
      await expect(page.locator('text=QC inspection submitted successfully')).toBeVisible();
    });


    test('should update order status to in_production when rejected', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out and submit rejected inspection
      // ... (same as above test)
      
      // Navigate to order detail
      await page.goto('/admin/orders/test-order-uuid');
      
      // Order status should be updated to In Production
      await expect(page.locator('[data-testid="order-status"]')).toHaveText('In Production');
    });

    test('should send vendor notification when rejected', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out and submit rejected inspection
      // ... (same as above test)
      
      // Check that vendor was notified
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      await expect(page.locator('[data-testid="vendor-notified"]')).toHaveText('Yes');
      await expect(page.locator('[data-testid="vendor-notified-at"]')).toBeVisible();
    });

    test('should display rework deadline when rejected', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out and submit rejected inspection with rework deadline
      // ... (same as above test)
      
      // Check that rework deadline is displayed
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      await expect(page.locator('[data-testid="rework-deadline"]')).toHaveText('Feb 21, 2026 10:00 AM');
    });
  });

  test.describe('Inspection View', () => {
    test('should display inspection summary correctly', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Should show overall result
      await expect(page.locator('[data-testid="overall-result"]')).toBeVisible();
      await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="overall-rating"]')).toBeVisible();
      
      // Should show inspection metadata
      await expect(page.locator('[data-testid="inspector-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="inspection-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="inspection-duration"]')).toBeVisible();
    });

    test('should display checklist results in tabs', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Should have three tabs
      await expect(page.locator('text=Checklist Results')).toBeVisible();
      await expect(page.locator('text=Photos')).toBeVisible();
      await expect(page.locator('text=History')).toBeVisible();
      
      // Checklist tab should be active by default
      await expect(page.locator('[data-testid="tab-checklist"]')).toHaveClass(/active/);
    });


    test('should display all checklist items with status badges', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Click on Checklist Results tab
      await page.click('text=Checklist Results');
      
      // Should show all categories
      await expect(page.locator('text=Physical Specifications')).toBeVisible();
      await expect(page.locator('text=Etching Quality')).toBeVisible();
      await expect(page.locator('text=Finishing Quality')).toBeVisible();
      
      // Should show status badges
      await expect(page.locator('[data-testid="dimensions-accuracy-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="material-verification-badge"]')).toBeVisible();
    });

    test('should display photos in gallery view', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Click on Photos tab
      await page.click('text=Photos');
      
      // Should show photo gallery
      await expect(page.locator('[data-testid="photo-gallery"]')).toBeVisible();
      
      // Should show photo thumbnails
      const photos = page.locator('[data-testid="photo-thumbnail"]');
      await expect(photos).toHaveCount(12); // Assuming 12 photos uploaded
    });

    test('should allow clicking photos to view full size', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Click on Photos tab
      await page.click('text=Photos');
      
      // Click on first photo
      await page.click('[data-testid="photo-thumbnail"]:first-child');
      
      // Should open full-size preview
      await expect(page.locator('[data-testid="photo-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="photo-full-size"]')).toBeVisible();
    });

    test('should display inspection history timeline', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Click on History tab
      await page.click('text=History');
      
      // Should show timeline
      await expect(page.locator('[data-testid="history-timeline"]')).toBeVisible();
      
      // Should show creation event
      await expect(page.locator('text=Inspection Created')).toBeVisible();
      
      // Should show completion event
      await expect(page.locator('text=Inspection Completed')).toBeVisible();
    });
  });

  test.describe('Re-inspection Workflow', () => {
    test('should allow creating re-inspection from rejected inspection', async ({ page }) => {
      await page.goto('/admin/qc-inspections/rejected-inspection-uuid');
      
      // Should see re-inspection button
      await expect(page.locator('button:has-text("Create Re-inspection")')).toBeVisible();
      
      // Click to create re-inspection
      await page.click('button:has-text("Create Re-inspection")');
      
      // Should navigate to new inspection form
      await expect(page).toHaveURL(/\/admin\/orders\/.*\/qc-inspection$/);
      
      // Should show re-inspection indicator
      await expect(page.locator('text=Re-inspection')).toBeVisible();
      await expect(page.locator('text=Original Inspection:')).toBeVisible();
    });


    test('should track re-inspection count', async ({ page }) => {
      await page.goto('/admin/qc-inspections/original-inspection-uuid');
      
      // Should show re-inspection count
      await expect(page.locator('[data-testid="reinspection-count"]')).toHaveText('2');
      
      // Should show link to re-inspections
      await expect(page.locator('text=View Re-inspections')).toBeVisible();
    });

    test('should link re-inspection to original inspection', async ({ page }) => {
      await page.goto('/admin/qc-inspections/reinspection-uuid');
      
      // Should show original inspection link
      await expect(page.locator('[data-testid="original-inspection-link"]')).toBeVisible();
      
      // Click to view original
      await page.click('[data-testid="original-inspection-link"]');
      
      // Should navigate to original inspection
      await expect(page).toHaveURL(/\/admin\/qc-inspections\/original-inspection-uuid$/);
    });
  });

  test.describe('Draft Saving', () => {
    test('should save inspection as draft', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out partial inspection
      await page.click('text=1. Physical Specifications');
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      await page.fill('[data-testid="dimensions-accuracy-notes"]', 'Dimensions look good');
      
      // Save as draft
      await page.click('button:has-text("Save Draft")');
      
      // Should show success message
      await expect(page.locator('text=Draft saved successfully')).toBeVisible();
    });

    test('should load draft when returning to inspection', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Should show draft indicator
      await expect(page.locator('text=Draft')).toBeVisible();
      
      // Should load saved data
      await page.click('text=1. Physical Specifications');
      await expect(page.locator('[data-testid="dimensions-accuracy-pass"]')).toBeChecked();
      await expect(page.locator('[data-testid="dimensions-accuracy-notes"]')).toHaveValue('Dimensions look good');
    });
  });

  test.describe('Validation', () => {
    test('should validate required fields before submission', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Try to submit without filling anything
      await page.click('button:has-text("Submit Inspection")');
      
      // Should show validation errors
      await expect(page.locator('text=Please complete at least one checklist item')).toBeVisible();
      await expect(page.locator('text=Overall rating is required')).toBeVisible();
      await expect(page.locator('text=Final decision is required')).toBeVisible();
      await expect(page.locator('text=Inspector name is required')).toBeVisible();
    });


    test('should validate photo requirements', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Expand Physical Specifications
      await page.click('text=1. Physical Specifications');
      
      // Mark item as checked but don't upload minimum photos
      await page.click('[data-testid="dimensions-accuracy-pass"]');
      
      // Should show warning about minimum photos
      await expect(page.locator('text=Please upload at least 2 photo(s)')).toBeVisible();
    });

    test('should validate rework deadline for rejected inspections', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Fill out inspection
      await page.click('text=6. Final Approval');
      await page.click('[data-testid="decision-rejected"]');
      
      // Try to submit without rework deadline
      await page.click('button:has-text("Submit Inspection")');
      
      // Should show validation error
      await expect(page.locator('text=Rework deadline is required for rejected inspections')).toBeVisible();
    });
  });

  test.describe('PDF Export', () => {
    test('should allow downloading inspection report as PDF', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Should see PDF download button
      await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
      
      // Click to download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Download PDF")');
      const download = await downloadPromise;
      
      // Should download PDF file
      expect(download.suggestedFilename()).toMatch(/QC-Inspection-.*\.pdf/);
    });

    test('should allow printing inspection report', async ({ page }) => {
      await page.goto('/admin/qc-inspections/test-inspection-uuid');
      
      // Should see print button
      await expect(page.locator('button:has-text("Print Report")')).toBeVisible();
      
      // Click to print (will open print dialog)
      await page.click('button:has-text("Print Report")');
      
      // Note: Cannot fully test print dialog in E2E, but can verify button works
    });
  });

  test.describe('Order Detail Integration', () => {
    test('should display QC inspection status on order detail', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid');
      
      // Should show QC inspection section
      await expect(page.locator('[data-testid="qc-inspection-section"]')).toBeVisible();
      
      // Should show inspection status
      await expect(page.locator('[data-testid="qc-status"]')).toHaveText('Passed');
      
      // Should show inspection date
      await expect(page.locator('[data-testid="qc-inspection-date"]')).toBeVisible();
    });


    test('should allow viewing inspection from order detail', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid');
      
      // Click to view inspection
      await page.click('[data-testid="view-qc-inspection"]');
      
      // Should navigate to inspection view
      await expect(page).toHaveURL(/\/admin\/qc-inspections\/.*$/);
    });

    test('should show inspection history on order timeline', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid');
      
      // Scroll to timeline
      await page.click('text=Order Timeline');
      
      // Should show QC inspection events
      await expect(page.locator('text=QC Inspection Started')).toBeVisible();
      await expect(page.locator('text=QC Inspection Completed')).toBeVisible();
      await expect(page.locator('text=Decision: Approved')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Should display mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
      
      // Accordion should work on mobile
      await page.click('text=1. Physical Specifications');
      await expect(page.locator('text=Dimensions Accuracy')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Should display tablet-optimized layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should focus on first checklist item
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focused).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/admin/orders/test-order-uuid/qc-inspection');
      
      // Check for ARIA labels
      await expect(page.locator('[aria-label="Physical Specifications checklist"]')).toBeVisible();
      await expect(page.locator('[aria-label="Etching Quality checklist"]')).toBeVisible();
    });
  });
});
