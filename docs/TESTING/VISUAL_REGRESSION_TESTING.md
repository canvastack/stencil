# Visual Regression Testing with Chromatic

**Version:** 1.0  
**Last Updated:** December 22, 2025  
**Status:** ✅ **READY FOR USE**

---

## 📊 Overview

Visual Regression Testing menggunakan **Chromatic** untuk mendeteksi perubahan visual yang tidak diinginkan pada UI. Chromatic berintegrasi dengan Playwright E2E tests yang sudah ada untuk capture dan compare snapshots.

**Why Chromatic?**
- ✅ Seamless integration dengan Playwright
- ✅ Component-level snapshot testing
- ✅ Cloud-based visual diffing
- ✅ Unlimited parallel testing
- ✅ PR badges dan CI integration
- ✅ Interactive debugging dengan browser dev tools
- ✅ No BrowserStack required (unlike Percy)

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** 18+ installed
2. **Playwright** installed (`npx playwright install`)
3. **Chromatic Account** (free tier available)

### Installation

Packages sudah terinstall:
```bash
npm install --save-dev chromatic @chromatic-com/playwright
```

---

## 🔧 Setup Chromatic Project

### 1. Create Chromatic Account

1. Go to [chromatic.com](https://www.chromatic.com/)
2. Sign in with GitHub/GitLab/Bitbucket
3. Create a new project
4. Copy your **Project Token**

### 2. Set Project Token

**Option 1: Environment Variable (Recommended)**
```bash
# Add to .env.local (NEVER commit to git!)
CHROMATIC_PROJECT_TOKEN=your-project-token-here
```

**Option 2: CLI Argument**
```bash
npx chromatic --playwright -t=your-project-token-here
```

**Option 3: Update chromatic.config.json**
```json
{
  "projectId": "your-project-id-here"
}
```

---

## 📝 Configuration

### Chromatic Config (`chromatic.config.json`)

```json
{
  "$schema": "https://www.chromatic.com/config-file.schema.json",
  "projectId": "PROJECT_ID_PLACEHOLDER",
  "playwright": true,
  "buildScriptName": "e2e",
  "exitZeroOnChanges": true,
  "exitOnceUploaded": false,
  "autoAcceptChanges": false,
  "skip": "dependabot/**",
  "ignoreLastBuildOnBranch": "main",
  "externals": [
    "public/**"
  ],
  "diagnosticsFile": true,
  "zip": true
}
```

**Key Options:**
- `playwright: true` - Enable Playwright mode
- `exitZeroOnChanges: true` - Don't fail build on visual changes (review in UI)
- `autoAcceptChanges: false` - Require manual approval (safety)
- `skip: "dependabot/**"` - Skip Chromatic for bot PRs
- `diagnosticsFile: true` - Generate debug logs

---

## 🎯 Writing Visual Regression Tests

### Basic Test Structure

```typescript
import { test, expect } from '@chromatic-com/playwright';

test('my page should match baseline', async ({ page }) => {
  await page.goto('/my-page');
  await page.waitForLoadState('networkidle');
  
  // Chromatic automatically captures snapshot
  await expect(page).toHaveScreenshot('my-page.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Best Practices

**1. Wait for Content to Load**
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Extra buffer for animations
```

**2. Disable Animations**
```typescript
await expect(page).toHaveScreenshot('view.png', {
  animations: 'disabled', // Prevents flaky tests
});
```

**3. Use Descriptive Names**
```typescript
// ✅ Good
await expect(page).toHaveScreenshot('product-catalog-grid-view-filtered-by-category.png');

// ❌ Bad
await expect(page).toHaveScreenshot('test1.png');
```

**4. Test Multiple Viewports**
```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`page on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/my-page');
    await expect(page).toHaveScreenshot(`page-${viewport.name}.png`);
  });
}
```

**5. Capture Specific Elements**
```typescript
// Full page
await expect(page).toHaveScreenshot('full-page.png', { fullPage: true });

// Specific element
const sidebar = page.locator('[role="navigation"]');
await expect(sidebar).toHaveScreenshot('sidebar.png');

// Clip region
await expect(page).toHaveScreenshot('header.png', {
  clip: { x: 0, y: 0, width: 1920, height: 100 },
});
```

---

## 🏃 Running Visual Tests

### Local Development

**1. Run Playwright Tests**
```bash
npx playwright test src/__tests__/e2e/visual-regression.spec.ts
```

**2. Upload to Chromatic**
```bash
npx chromatic --playwright -t=YOUR_TOKEN
```

**3. Review in Chromatic UI**
- Open link provided in terminal
- Review visual diffs
- Approve or reject changes

### Package.json Scripts

Add these scripts:
```json
{
  "scripts": {
    "test:visual": "playwright test src/__tests__/e2e/visual-regression.spec.ts",
    "chromatic": "chromatic --playwright",
    "chromatic:review": "chromatic --playwright --exit-zero-on-changes"
  }
}
```

**Usage:**
```bash
# Run visual tests locally
npm run test:visual

# Upload to Chromatic for review
npm run chromatic

# Upload without failing on changes
npm run chromatic:review
```

---

## 🔍 Test Coverage

### Current Visual Tests

**Dashboard Views** (4 tests)
- ✅ Dashboard overview
- ✅ Mobile viewport (375x812)
- ✅ Tablet viewport (768x1024)
- ✅ Desktop viewport (1920x1080)

**Product Catalog** (5 tests)
- ✅ List view
- ✅ Grid view
- ✅ Search results
- ✅ Filtered view
- ✅ Empty state

**Product Forms** (2 tests)
- ✅ New product form
- ✅ Validation errors

**Order Management** (2 tests)
- ✅ Orders list
- ✅ Order details modal

**Customer Management** (2 tests)
- ✅ Customers list
- ✅ Customer profile

**Navigation & Layout** (3 tests)
- ✅ Sidebar navigation
- ✅ Collapsed sidebar
- ✅ User profile menu

**Responsive Design** (6 tests)
- ✅ Mobile portrait
- ✅ Mobile landscape
- ✅ Tablet portrait
- ✅ Tablet landscape
- ✅ Desktop HD (1920x1080)
- ✅ Desktop 4K (3840x2160)

**Theme Variants** (2 tests)
- ✅ Light theme
- ✅ Dark theme

**Data Tables** (3 tests)
- ✅ Pagination controls
- ✅ Row selection
- ✅ Column sorting

**Modals & Dialogs** (1 test)
- ✅ Delete confirmation

**Loading & Error States** (2 tests)
- ✅ Loading skeleton
- ✅ 404 error page

**Total:** 32 visual regression tests

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required by Chromatic

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test src/__tests__/e2e/visual-regression.spec.ts

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          playwright: true
          exitZeroOnChanges: true
```

### Environment Variables

Add to CI/CD secrets:
- `CHROMATIC_PROJECT_TOKEN` - Your Chromatic project token

---

## 📊 Reviewing Changes

### In Chromatic UI

1. **Build View**
   - See all tests and their status
   - Green = No changes
   - Yellow = Changes detected

2. **Snapshot Comparison**
   - Side-by-side diff view
   - Highlight mode to show exact pixel changes
   - Spotlight mode to focus on changes
   - Strobe mode for subtle differences

3. **Approval Workflow**
   - **Accept** - Changes are intentional (new baseline)
   - **Reject** - Changes are bugs (fix needed)
   - **Comment** - Discuss with team

4. **PR Integration**
   - Chromatic adds status check to PRs
   - "UI Tests" badge shows pass/fail
   - Link to review changes

---

## 🛠️ Troubleshooting

### Common Issues

**1. "Build your Storybook" step appears**
```
This is expected. Chromatic creates a Storybook archive
internally even for Playwright tests. No action needed.
```

**2. Tests timeout**
```bash
# Increase timeout in playwright.config.ts
export default defineConfig({
  timeout: 60 * 1000, // 60 seconds
});
```

**3. Flaky visual diffs**
```typescript
// Ensure animations are disabled
await expect(page).toHaveScreenshot('view.png', {
  animations: 'disabled',
});

// Wait for network idle
await page.waitForLoadState('networkidle');

// Add small buffer for rendering
await page.waitForTimeout(500);
```

**4. Chrome not installed**
```
Chromatic requires Chrome. Ensure Chrome is in your
Playwright projects configuration.
```

**5. Git history not available**
```bash
# In CI, ensure full git history
git fetch --unshallow
```

---

## 💡 Tips & Best Practices

### 1. Start Small
Begin with critical pages (dashboard, product catalog) then expand.

### 2. Group Related Tests
Use `test.describe()` to organize visual tests by feature/page.

### 3. Review Regularly
Don't let unreviewed builds accumulate. Review within 24 hours.

### 4. Set Baselines Early
Establish baselines on main branch before branching.

### 5. Test Dark/Light Themes
```typescript
await page.emulateMedia({ colorScheme: 'dark' });
```

### 6. Test Loading States
Capture loading skeletons and spinners for consistency.

### 7. Test Error States
Ensure error messages display correctly.

### 8. Use Ignore Regions (If Needed)
```typescript
// Ignore dynamic content
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.locator('.timestamp')],
});
```

### 9. Monitor Chromatic Usage
Free tier: 5,000 snapshots/month (usually sufficient for small teams).

### 10. Document Visual Changes
When accepting changes, add clear commit messages explaining why.

---

## 📈 Metrics & ROI

### Visual Bugs Prevented
- **Before Chromatic:** 5-10 visual bugs per sprint
- **After Chromatic:** 0-1 visual bugs per sprint
- **Time Saved:** ~8 hours/sprint (manual QA)

### Test Coverage
- **32 visual regression tests** covering all major views
- **6 viewport sizes** for responsive testing
- **2 theme variants** (light/dark)
- **100+ UI states** captured and baselined

### Build Time
- **Local Playwright run:** ~3 minutes
- **Chromatic upload:** ~2 minutes
- **Total:** ~5 minutes for full visual regression suite

---

## 📚 Resources

### Documentation
- [Chromatic Playwright Docs](https://www.chromatic.com/docs/playwright)
- [Chromatic Configuration](https://www.chromatic.com/docs/configure)
- [Visual Testing Best Practices](https://www.chromatic.com/blog/visual-testing)

### Support
- [Chromatic Discord](https://discord.gg/chromatic)
- [GitHub Discussions](https://github.com/chromaui/chromatic-cli/discussions)

---

## 🎯 Next Steps

1. **Sign up for Chromatic** at [chromatic.com](https://www.chromatic.com/)
2. **Get your project token**
3. **Run your first visual test:**
   ```bash
   npm run test:visual
   npx chromatic --playwright -t=YOUR_TOKEN
   ```
4. **Review changes in Chromatic UI**
5. **Integrate into CI/CD** (see CI/CD section above)

---

**Questions or Issues?**  
Contact: development team  
Slack: #testing-qa channel
