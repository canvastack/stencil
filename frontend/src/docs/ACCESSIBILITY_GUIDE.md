# Color Accessibility Guide

## Overview

This guide documents the comprehensive color accessibility features implemented in the Order Status Workflow UX system. All features comply with WCAG 2.1 AA standards and provide multiple ways for users to identify status information beyond color alone.

## Features Implemented

### 1. High Contrast Mode Support

**Automatic Detection**: The system automatically detects when users have enabled high contrast mode in their operating system or browser.

**Enhanced Colors**: When high contrast is detected, the system applies:
- Darker primary colors with higher contrast ratios
- Bold text weights for better visibility
- Thicker borders (2-3px) for clear element separation
- Enhanced focus indicators with larger outlines

**CSS Media Query**: Uses `@media (prefers-contrast: high)` to detect preference.

```css
@media (prefers-contrast: high) {
  .status-badge {
    border: 2px solid currentColor !important;
    font-weight: 600 !important;
  }
}
```

### 2. Color-Blind Friendly Color Schemes

**Pattern System**: Each status has a unique visual pattern that can be identified without color:
- **Diagonal Lines**: Pending statuses
- **Horizontal Lines**: In-progress statuses  
- **Dots**: Review/negotiation statuses
- **Cross-hatch**: Refund/return statuses
- **Solid Border**: Error/cancelled statuses
- **Checkered**: Completed statuses

**Symbol System**: Each status includes a unique Unicode symbol:
- ● Gray (Neutral)
- ▲ Blue (In Progress)
- ◆ Indigo (Review)
- ♦ Purple (Negotiation)
- ✦ Pink (Refunded)
- ✖ Red (Error)
- ⚠ Orange (Payment Due)
- ◐ Amber (Partial)
- ⚡ Yellow (Pending)
- ~ Lime (Processing)
- ✓ Green (Success)
- ✔ Emerald (Completed)
- ⊞ Teal (Quality Check)
- ○ Cyan (Shipping)

### 3. Text Alternatives for Color-Coded Information

**Semantic Labels**: Every status has a human-readable semantic label:
- Technical status: `OrderStatus.VendorNegotiation`
- Semantic label: "Negotiation"
- Description: "In negotiation or discussion"

**Screen Reader Support**: Comprehensive ARIA labels and descriptions:
```html
<div 
  role="status"
  aria-label="Status: Pending - awaiting_payment"
  aria-describedby="status-description-awaiting_payment"
>
  <span id="status-description-awaiting_payment" class="sr-only">
    Current status is Pending: Waiting for action or approval
  </span>
</div>
```

**Priority Indicators**: Each status includes a priority level (low, medium, high, critical) for additional context.

## Implementation Details

### StatusColorSystem Enhancements

The `StatusColorSystem` class has been enhanced with accessibility methods:

```typescript
// Get high contrast colors
StatusColorSystem.getHighContrastColor(status)

// Get color-blind patterns
StatusColorSystem.getColorBlindPattern(status)

// Get semantic information
StatusColorSystem.getSemanticInfo(status)

// Validate contrast ratios
StatusColorSystem.validateContrast(foreground, background)

// Get accessibility attributes
StatusColorSystem.getAccessibilityAttributes(status)
```

### AccessibleStatusBadge Component

New component that automatically applies accessibility features:

```tsx
<AccessibleStatusBadge 
  status={OrderStatus.Pending}
  showSymbol={true}
  showPattern={false}
  size="md"
/>
```

**Features**:
- Automatic high contrast detection
- Symbol display for color-blind users
- Pattern overlay option
- Screen reader descriptions
- Semantic HTML structure

### CSS Pattern Classes

Visual patterns for color-blind identification:

```css
.pattern-diagonal-lines {
  background-image: repeating-linear-gradient(45deg, ...);
}

.pattern-dots {
  background-image: radial-gradient(circle at 2px 2px, ...);
}

.pattern-checkered {
  background-image: linear-gradient(45deg, ...);
}
```

### Accessibility Hooks

Custom React hooks for detecting user preferences:

```typescript
const { 
  prefersHighContrast,
  prefersReducedMotion,
  colorScheme,
  contrastLevel 
} = useAccessibilityPreferences();
```

## Usage Examples

### Basic Status Badge

```tsx
import { OrderStatusBadge } from '@/components/ui/AccessibleStatusBadge';

<OrderStatusBadge 
  status={OrderStatus.Pending}
  showSymbol={true}
/>
```

### Status Legend

```tsx
import { StatusLegend } from '@/components/ui/AccessibleStatusBadge';

<StatusLegend type="status" />
```

### Custom Implementation

```tsx
import { StatusColorSystem } from '@/utils/StatusColorSystem';

const status = OrderStatus.Pending;
const colorConfig = StatusColorSystem.getAccessibleStatusColor(status);
const semantic = StatusColorSystem.getSemanticInfo(status);
const pattern = StatusColorSystem.getColorBlindPattern(status);

<div 
  {...StatusColorSystem.getAccessibilityAttributes(status)}
  style={{ 
    backgroundColor: colorConfig.secondary,
    color: colorConfig.text 
  }}
  className={pattern.cssClass}
>
  <span className="status-symbol" data-symbol={pattern.symbol} />
  {semantic.label}
</div>
```

## Testing

### Automated Tests

Comprehensive test suite covers:
- WCAG AA contrast ratio validation
- High contrast mode detection
- Color-blind pattern generation
- Screen reader compatibility
- Keyboard navigation
- Semantic information accuracy

### Manual Testing

**High Contrast Mode**:
1. Enable high contrast in OS settings
2. Verify enhanced colors and borders
3. Check focus indicators are more prominent

**Color-Blind Testing**:
1. Use browser extensions to simulate color blindness
2. Verify patterns and symbols are visible
3. Confirm status identification without color

**Screen Reader Testing**:
1. Use NVDA, JAWS, or VoiceOver
2. Verify status announcements are clear
3. Check navigation between status elements

## Browser Support

**High Contrast Detection**:
- Chrome 76+
- Firefox 80+
- Safari 14+
- Edge 79+

**Pattern Support**:
- All modern browsers
- Graceful degradation in older browsers

**Media Queries**:
- `prefers-contrast: high`
- `prefers-reduced-motion: reduce`
- `prefers-color-scheme: dark/light`

## Compliance

### WCAG 2.1 AA Standards

✅ **1.4.3 Contrast (Minimum)**: All color combinations meet 4.5:1 ratio
✅ **1.4.6 Contrast (Enhanced)**: High contrast mode provides 7:1 ratio
✅ **1.4.1 Use of Color**: Information not conveyed by color alone
✅ **2.4.7 Focus Visible**: Enhanced focus indicators
✅ **4.1.2 Name, Role, Value**: Proper ARIA implementation

### Additional Standards

✅ **Section 508**: Federal accessibility requirements
✅ **EN 301 549**: European accessibility standard
✅ **ISO 14289**: PDF accessibility (for exported reports)

## Maintenance

### Adding New Statuses

1. Add status to `OrderStatus` enum
2. Add color mapping in `StatusColorSystem.ORDER_STATUS_COLORS`
3. Define semantic information in color palette
4. Add pattern and symbol
5. Update tests

### Updating Colors

1. Validate new colors meet WCAG AA standards
2. Update high contrast variants
3. Test with color-blind simulation tools
4. Update documentation

### Performance Considerations

- Pattern CSS is optimized for minimal impact
- Media query listeners are properly cleaned up
- Color calculations are memoized where possible
- Accessibility attributes are generated once per render

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Colour Blindness Simulator](https://www.colour-blindness.com/colour-blindness-tests/)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)

## Support

For questions about accessibility features or to report accessibility issues, please contact the development team or create an issue in the project repository.