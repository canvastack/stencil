# Storybook Setup for ProductionCountdown Component

## Overview

The `ProductionCountdown.stories.tsx` file has been created with comprehensive stories for the ProductionCountdown component. However, Storybook needs to be fully configured before these stories can be used.

## Current Status

- ✅ Story file created with 13 different scenarios
- ✅ Stories follow Storybook 7+ CSF3 format
- ⚠️ Storybook React adapter not installed
- ⚠️ Storybook configuration not set up

## Installation Steps

### 1. Install Storybook Dependencies

```bash
cd frontend
npm install --save-dev @storybook/react @storybook/react-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/testing-library
```

### 2. Initialize Storybook

```bash
npx storybook@latest init --type react
```

This will:
- Create `.storybook` configuration directory
- Add Storybook scripts to package.json
- Set up default addons

### 3. Configure Vite Integration

Create or update `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### 4. Configure Preview

Create `.storybook/preview.ts`:

```typescript
import type { Preview } from '@storybook/react';
import '../src/index.css'; // Import Tailwind styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
};

export default preview;
```

### 5. Add Scripts to package.json

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Running Storybook

After installation:

```bash
npm run storybook
```

This will start Storybook on http://localhost:6006

## Available Stories

The ProductionCountdown component includes the following stories:

### Core Scenarios (Required by Task 2.1.3)

1. **On Track** - Production with >3 days remaining (green indicator)
2. **Approaching Deadline** - Production with 1-3 days remaining (orange indicator)
3. **Overdue** - Production past deadline (red indicator)
4. **Just Accepted** - Production just started (0 days elapsed)

### Additional Scenarios

5. **One Day Remaining** - Critical deadline with 1 day left
6. **Short Timeline** - 3-day production timeline
7. **Long Timeline** - 60-day production timeline
8. **Halfway Complete** - 50% progress
9. **Nearly Complete** - 95% progress
10. **Severely Overdue** - 30+ days overdue
11. **With Custom Styling** - Custom className demonstration
12. **Dark Mode** - Dark theme display
13. **Mobile View** - Responsive mobile layout

## Story Features

Each story includes:
- **Args**: Configurable props for the component
- **Parameters**: Storybook-specific configuration
- **Documentation**: Description of the scenario
- **Controls**: Interactive prop editing in Storybook UI

## Integration with Chromatic

The project already has Chromatic installed for visual regression testing. Once Storybook is configured, you can:

```bash
npm run chromatic
```

This will:
- Build Storybook
- Upload to Chromatic
- Run visual regression tests
- Generate shareable review links

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors in the stories file:
1. Ensure `@storybook/react` is installed
2. Remove the `@ts-nocheck` comment at the top of the file
3. Restart your TypeScript server

### Tailwind Styles Not Loading

If Tailwind styles don't appear in Storybook:
1. Ensure `index.css` is imported in `.storybook/preview.ts`
2. Check that Tailwind is configured in `tailwind.config.ts`
3. Restart Storybook

### Date-fns Import Errors

The stories use `date-fns` which is already installed in the project. If you see import errors:
1. Check that `date-fns` is in package.json dependencies
2. Run `npm install` to ensure it's installed

## Next Steps

After Storybook is configured:

1. Remove `@ts-nocheck` from `ProductionCountdown.stories.tsx`
2. Run `npm run storybook` to view stories
3. Test all scenarios interactively
4. Use Chromatic for visual regression testing
5. Share story links with team for review

## References

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Storybook with Vite](https://storybook.js.org/docs/react/builders/vite)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Component Story Format (CSF)](https://storybook.js.org/docs/react/api/csf)
