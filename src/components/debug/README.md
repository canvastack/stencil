# DevDebugger Component

Professional debug panel for development with drag & drop functionality, categorized logging, and clean UI.

## Features

- **🖱️ Draggable Interface**: Drag the debug panel anywhere on screen
- **👁️ Show/Hide Toggle**: Minimize to a floating button or expand to full panel  
- **🏷️ Categorized Logging**: Filter logs by category (auth, data, api, state, performance, general)
- **📱 Responsive Design**: Works on all screen sizes with dark/light mode support
- **🔧 Environment Controlled**: Automatically enabled in development, controlled by `VITE_DEBUG_MODE` in production

## Environment Configuration

Add to your `.env.local` (development) or `.env` (production):

```env
# Enable debug panel (automatically true in development)
VITE_DEBUG_MODE="true"
```

## Usage

### 1. Import and Add to App
Already added to `App.tsx`:
```tsx
import DevDebugger from "@/components/debug/DevDebugger";

// At the bottom of your app
<DevDebugger />
```

### 2. Using Debug Utilities
```tsx
import { debugData, debugAuth, debugApi, debugState, debugPerformance } from '@/utils/debug';

// Category-specific logging
debugAuth('User Login', { userId, token });
debugData('Page Content', pageData);
debugApi('API Response', response);
debugState('Component State', componentState);
debugPerformance('Load Time', { duration: 150 });

// General logging
debugLog('Custom Event', data, 'general');
```

### 3. Global Debug Function
Once DevDebugger is loaded, you can use the global function:
```javascript
window.debugLog('Event Name', data, 'category');
```

## Categories

- **auth**: Authentication & authorization
- **data**: Data structures & content
- **api**: API calls & responses  
- **state**: Component & application state
- **performance**: Performance metrics & timing
- **general**: General purpose logging

## Interface Controls

- **Drag Handle**: Click and drag the header to move the panel
- **Category Filters**: Toggle categories on/off with colored buttons
- **Clear Logs**: Clear all debug entries
- **Expand/Collapse**: Click log entries to show/hide detailed data
- **Hide Panel**: Minimize to floating eye icon button
- **Timestamps**: Each log entry shows when it was created

## Development vs Production

- **Development**: Always enabled, shows console logs + debug panel
- **Production**: Only enabled if `VITE_DEBUG_MODE="true"` is set
- **Performance**: Zero overhead when disabled

## Integration Examples

The debug system is already integrated in:
- Contact page CTA data debugging  
- Authentication state debugging
- Can be added to any component for data inspection

## Styling

- Supports dark/light mode automatically
- Backdrop blur for modern glass effect
- Color-coded categories for quick identification
- Responsive design works on all screen sizes