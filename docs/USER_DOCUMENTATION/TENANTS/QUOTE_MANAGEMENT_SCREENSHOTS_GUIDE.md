# Quote Management Screenshots Guide

## Overview

This document provides guidance on what screenshots should be captured and added to the Quote Management Guide to enhance user understanding of the new features.

## Required Screenshots

### 1. Product Specifications Display

#### Screenshot 1.1: Specifications Section Collapsed
**Location**: Quote Form - Item Card
**Filename**: `quote-specifications-collapsed.png`
**Description**: Shows the collapsed specifications section with badge indicating field count

**What to capture**:
- Quote item card with product details
- Collapsed specifications section showing "📋 Product Specifications (6 fields) [▼]"
- Badge with field count
- Surrounding context (quantity, price fields)

**Where to add in docs**: Section "Product Specifications Display" → "Specifications Display Features" → "1. Collapsible Section"

---

#### Screenshot 1.2: Specifications Section Expanded
**Location**: Quote Form - Item Card
**Filename**: `quote-specifications-expanded.png`
**Description**: Shows the expanded specifications section with all fields visible

**What to capture**:
- Expanded specifications section
- All specification fields with labels and values
- Example: Jenis Plakat, Jenis Logam, Ketebalan Plat, etc.
- Two-column grid layout on desktop
- Proper formatting and spacing

**Where to add in docs**: Section "Product Specifications Display" → "Where to Find Specifications"

---

#### Screenshot 1.3: Specifications Mobile View
**Location**: Quote Form - Item Card (Mobile)
**Filename**: `quote-specifications-mobile.png`
**Description**: Shows specifications display on mobile device

**What to capture**:
- Mobile viewport (375px width)
- Single-column layout
- Touch-friendly expand/collapse
- Readable text size
- Proper spacing

**Where to add in docs**: Section "Product Specifications Display" → "Specifications Display Features" → "4. Responsive Layout"

---

### 2. Pricing Calculations Breakdown

#### Screenshot 2.1: Pricing Breakdown - Quantity 1
**Location**: Quote Form - Item Card
**Filename**: `quote-calculations-qty1.png`
**Description**: Shows pricing breakdown when quantity is 1 (per-piece only)

**What to capture**:
- Pricing Breakdown card with calculator icon
- Per Piece section with:
  - Vendor Cost: Rp 250,000
  - Unit Price: Rp 3,114,510
  - Profit Margin: 📈 Rp 2,864,510 (1145.8%)
- Green color for profit margin
- No Total section (since qty = 1)

**Where to add in docs**: Section "Pricing Calculations Breakdown" → "Understanding the Calculations" → "Per-Piece Section"

---

#### Screenshot 2.2: Pricing Breakdown - Quantity > 1
**Location**: Quote Form - Item Card
**Filename**: `quote-calculations-qty2.png`
**Description**: Shows pricing breakdown when quantity is greater than 1

**What to capture**:
- Pricing Breakdown card
- Per Piece section (same as above)
- Total section showing:
  - Total Vendor Cost: Rp 500,000
  - Total Unit Price: Rp 6,229,020
  - Total Profit: 📈 Rp 5,729,020 (1145.8%)
- Badge showing "Qty: 2"
- Border separator between sections

**Where to add in docs**: Section "Pricing Calculations Breakdown" → "Understanding the Calculations" → "Total Section (Quantity > 1)"

---

#### Screenshot 2.3: Real-Time Calculation Update
**Location**: Quote Form - Item Card
**Filename**: `quote-calculations-realtime.gif` (animated GIF or video)
**Description**: Shows calculations updating in real-time as user types

**What to capture**:
- User changing quantity from 1 to 5
- Calculations updating instantly
- Total section appearing when qty > 1
- Smooth transition
- No page refresh needed

**Where to add in docs**: Section "Pricing Calculations Breakdown" → "Real-Time Calculation Updates"

---

#### Screenshot 2.4: Pricing Breakdown Mobile View
**Location**: Quote Form - Item Card (Mobile)
**Filename**: `quote-calculations-mobile.png`
**Description**: Shows pricing breakdown on mobile device

**What to capture**:
- Mobile viewport (375px width)
- Stacked layout
- Readable font sizes
- Proper spacing
- Touch-friendly interface

**Where to add in docs**: Section "Pricing Calculations Breakdown" → "Best Practices"

---

### 3. Complete Quote Form View

#### Screenshot 3.1: Full Quote Form with New Features
**Location**: Quote Form Modal
**Filename**: `quote-form-complete.png`
**Description**: Shows complete quote form with both specifications and calculations

**What to capture**:
- Full quote form modal
- Quote item with:
  - Product details
  - Quantity, Unit Price, Vendor Cost fields
  - Specifications section (collapsed)
  - Pricing Breakdown card
- Multiple items if possible
- Form actions (Save, Cancel buttons)

**Where to add in docs**: Section "Creating Quotes" → "Fill Quote Form"

---

#### Screenshot 3.2: Quote Form - Multiple Items
**Location**: Quote Form Modal
**Filename**: `quote-form-multiple-items.png`
**Description**: Shows quote form with multiple items, each with specifications and calculations

**What to capture**:
- Quote form with 2-3 items
- Each item showing:
  - Specifications section
  - Pricing Breakdown
- Scroll behavior
- Item separation

**Where to add in docs**: Section "Viewing Quote Details" → "Quote Items & Pricing"

---

### 4. Comparison Screenshots

#### Screenshot 4.1: Before Enhancement
**Location**: Old Quote Form (if available)
**Filename**: `quote-form-before.png`
**Description**: Shows quote form before specifications and calculations enhancement

**What to capture**:
- Old quote form without specifications
- Basic pricing display
- No calculation breakdown

**Where to add in docs**: Introduction or "What's New" section (if created)

---

#### Screenshot 4.2: After Enhancement
**Location**: New Quote Form
**Filename**: `quote-form-after.png`
**Description**: Shows quote form after specifications and calculations enhancement

**What to capture**:
- New quote form with specifications
- Pricing breakdown card
- Enhanced UI

**Where to add in docs**: Introduction or "What's New" section (if created)

---

## Screenshot Specifications

### Technical Requirements

- **Format**: PNG for static images, GIF or MP4 for animations
- **Resolution**: Minimum 1920x1080 for desktop, 750x1334 for mobile
- **DPI**: 144 DPI (2x for retina displays)
- **Compression**: Optimize for web (use tools like TinyPNG)
- **File Size**: Maximum 500KB per image, 2MB for animations

### Capture Guidelines

1. **Clean Environment**
   - Use fresh test data
   - Clear browser console
   - Hide personal information
   - Use consistent test data across screenshots

2. **Browser**
   - Use Chrome or Firefox
   - Latest stable version
   - No browser extensions visible
   - Standard zoom level (100%)

3. **Annotations**
   - Add arrows or highlights where needed
   - Use consistent color scheme (red for important, blue for info)
   - Keep annotations minimal and clear
   - Use tools like Snagit or Skitch

4. **Consistency**
   - Use same test data across related screenshots
   - Maintain consistent window size
   - Use same theme (light or dark mode)
   - Capture at same time to ensure consistent UI state

### Test Data for Screenshots

Use the following consistent test data:

**Product**: Plakat 30 Years Beyond Partnership
**Quantity**: 2
**Unit Price**: Rp 3,114,510
**Vendor Cost**: Rp 250,000

**Specifications**:
- Jenis Plakat: Plakat Logam
- Jenis Logam: Stainless Steel 304 (Anti Karat)
- Ketebalan Plat: 2mm
- Ukuran Plakat: 30x40cm
- Text untuk Engraving: 30 Years Beyond Partnership
- Finishing: Polished

## Screenshot Storage

### Directory Structure

```
docs/USER_DOCUMENTATION/TENANTS/images/
├── quote-management/
│   ├── specifications/
│   │   ├── quote-specifications-collapsed.png
│   │   ├── quote-specifications-expanded.png
│   │   └── quote-specifications-mobile.png
│   ├── calculations/
│   │   ├── quote-calculations-qty1.png
│   │   ├── quote-calculations-qty2.png
│   │   ├── quote-calculations-realtime.gif
│   │   └── quote-calculations-mobile.png
│   ├── complete-views/
│   │   ├── quote-form-complete.png
│   │   └── quote-form-multiple-items.png
│   └── comparison/
│       ├── quote-form-before.png
│       └── quote-form-after.png
```

## Adding Screenshots to Documentation

### Markdown Syntax

```markdown
![Alt Text](./images/quote-management/specifications/quote-specifications-expanded.png)
*Caption: Product specifications displayed in expanded view*
```

### Best Practices

1. **Alt Text**: Descriptive text for accessibility
2. **Captions**: Brief explanation below image
3. **Context**: Add screenshots near relevant text
4. **Size**: Use appropriate image size (don't make them too large)
5. **Links**: Consider adding clickable links to full-size images

### Example Integration

```markdown
### Specifications Display Features

#### 1. Collapsible Section

The specifications section is **collapsible** to save space:

![Collapsed Specifications](./images/quote-management/specifications/quote-specifications-collapsed.png)
*Figure 1: Specifications section in collapsed state showing field count*

- **Collapsed State**: Shows badge with field count (e.g., "6 fields")
- **Expanded State**: Shows all specification fields with labels and values

![Expanded Specifications](./images/quote-management/specifications/quote-specifications-expanded.png)
*Figure 2: Specifications section in expanded state showing all fields*

- **Click to Toggle**: Click anywhere on the header to expand/collapse
```

## Maintenance

### When to Update Screenshots

- After UI changes or redesigns
- When new features are added
- If test data changes significantly
- When user feedback indicates confusion
- During major version updates

### Version Control

- Keep old screenshots in `archive/` folder
- Name files with version suffix if needed: `quote-form-v2.0.png`
- Document changes in CHANGELOG.md
- Update screenshot guide when adding new images

## Checklist

Before considering this task complete:

- [ ] All 12 required screenshots captured
- [ ] Screenshots meet technical specifications
- [ ] Consistent test data used across all screenshots
- [ ] Images optimized for web
- [ ] Images stored in correct directory structure
- [ ] Screenshots added to documentation with proper markdown
- [ ] Alt text and captions added
- [ ] Documentation reviewed for image placement
- [ ] Mobile screenshots captured
- [ ] Animation/GIF created for real-time updates
- [ ] Comparison screenshots (before/after) captured
- [ ] All images accessible and loading correctly

---

## Notes for Implementation

Since I cannot actually capture screenshots as an AI, this guide provides:

1. **Detailed specifications** for what each screenshot should contain
2. **Clear instructions** on where to add them in the documentation
3. **Technical requirements** for image quality and format
4. **Consistent test data** to ensure professional appearance
5. **Directory structure** for organized storage

**Action Required**: A human team member with access to the running application should:
1. Follow this guide to capture all required screenshots
2. Store them in the specified directory structure
3. Add them to the documentation using the provided markdown examples
4. Verify all images load correctly and enhance user understanding

---

**Document Version**: 1.0  
**Created**: February 3, 2026  
**Purpose**: Guide for adding screenshots to Quote Management documentation
