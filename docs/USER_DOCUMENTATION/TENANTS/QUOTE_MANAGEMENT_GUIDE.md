# Quote Management Guide

## Overview

The Quote Management system enables tenant administrators to manage vendor quotes for orders, negotiate pricing, and advance orders through the workflow. This guide covers the complete quote lifecycle from creation to acceptance or rejection.

## Table of Contents

1. [Understanding Quote Workflow](#understanding-quote-workflow)
2. [Creating Quotes](#creating-quotes)
3. [Viewing Quote Details](#viewing-quote-details)
4. [Product Specifications Display](#product-specifications-display)
5. [Pricing Calculations Breakdown](#pricing-calculations-breakdown)
6. [Editing Quotes](#editing-quotes)
7. [Accepting Quotes](#accepting-quotes)
8. [Rejecting Quotes](#rejecting-quotes)
9. [Counter Offers](#counter-offers)
10. [Dashboard Notifications](#dashboard-notifications)
11. [Quote List Management](#quote-list-management)
12. [Troubleshooting](#troubleshooting)
13. [FAQ](#faq)

---

## Understanding Quote Workflow

### Quote Lifecycle

```
Draft → Open → Sent → Countered → Accepted/Rejected
                                 ↓
                              Expired
```

### Quote Statuses

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| **Draft** | Quote created but not finalized | Edit, Delete, Send |
| **Open** | Quote ready for negotiation | Edit, Accept, Reject, Counter |
| **Sent** | Quote sent to vendor (Phase 2) | Accept, Reject, Counter |
| **Countered** | Counter offer made | Accept, Reject, Counter Again |
| **Accepted** | Quote accepted, order advanced | View Only (Read-Only) |
| **Rejected** | Quote rejected with reason | View Only (Read-Only) |
| **Expired** | Quote past valid_until date | View Only (Read-Only) |
| **Cancelled** | Quote cancelled/deleted | View Only (Read-Only) |

### Integration with Order Status

When you accept a quote, the system automatically:
- ✅ Updates order status to **"Customer Quote"**
- ✅ Sets vendor information on the order
- ✅ Calculates quotation amount (vendor price × 1.35)
- ✅ Rejects all other quotes for the same order
- ✅ Records the action in order history

---

## Creating Quotes

### Method 1: From Order Detail Page

1. **Navigate to Order**
   - Go to **Orders** → Click on an order in "Vendor Negotiation" stage
   
2. **Click "Manage Quote" Button**
   - Located in the order actions section
   - System checks for existing active quotes

3. **Automatic Mode Detection**
   - **If active quote exists**: Modal opens in **EDIT mode** with existing data
   - **If no active quote**: Modal opens in **CREATE mode** with empty form

4. **Fill Quote Form**
   ```
   Required Fields:
   - Vendor: Select from active vendors
   - Initial Offer: Vendor's quoted price (in IDR)
   - Currency: IDR (default)
   - Valid Until: Quote expiration date
   - Terms & Conditions: Payment terms, warranty, delivery
   
   Optional Fields:
   - Internal Notes: Notes visible only to admins
   - Metadata: Additional structured data
   ```

5. **Submit Quote**
   - Click **"Create Quote"** button
   - System validates all fields
   - Quote created with status "Open"
   - Redirected to quote detail page

### Method 2: From Quotes List Page

1. **Navigate to Quotes**
   - Go to **Quotes** in the admin menu

2. **Click "Create New Quote"**
   - Opens quote creation modal

3. **Select Order**
   - Choose order from dropdown
   - System validates order is in correct stage

4. **Complete Form** (same as Method 1)

### Duplicate Prevention

**Important**: The system prevents duplicate quotes:
- ✅ Only one active quote per order + vendor combination
- ✅ If active quote exists, you'll be directed to edit it
- ✅ You can create multiple quotes for same order with different vendors
- ✅ After rejection, you can create new quote for same vendor

---

## Viewing Quote Details

### Accessing Quote Detail Page

**From Order Detail:**
- Click **"View Quote"** button in order actions

**From Quotes List:**
- Click on any quote row in the table
- Or click **"View"** button in actions column

### Quote Detail Sections

#### 1. Quote Header
```
Quote #Q-000123                    [Status Badge]
Created: February 2, 2026 10:00 AM
Valid Until: February 15, 2026 11:59 PM
```

#### 2. Order Information
- Order Number with link to order detail
- Customer name and company
- Order status
- Order total amount

#### 3. Vendor Information
- Vendor name and company
- Contact email and phone
- Vendor address
- Vendor rating (if available)

#### 4. Quote Items & Pricing
```
┌─────────────────────────────────────────────┐
│ Product/Service    Qty   Unit Price   Total │
├─────────────────────────────────────────────┤
│ Custom Etching     2     Rp 100,000   Rp 200,000 │
│ Plate (10x15cm)          ($6.35)      ($12.70)   │
└─────────────────────────────────────────────┘

Vendor Cost:      Rp 180,000 ($11.43)
Profit Margin:    Rp 20,000 ($1.27) - 11.1%
Total:            Rp 200,000 ($12.70)
```

**Note**: All amounts show both IDR and USD conversion using current exchange rate.

#### 5. Terms & Conditions
- Payment terms
- Warranty information
- Delivery method and timeline
- Special conditions

#### 6. Negotiation History
Timeline of all actions:
- Quote created
- Counter offers made
- Status changes
- User who performed each action
- Timestamps for all events

#### 7. Action Buttons
Based on quote status:
- **Accept**: Accept the quote and advance order
- **Reject**: Reject with reason
- **Counter Offer**: Propose new price
- **Edit**: Modify quote details (if status allows)
- **Back**: Return to previous page

---

## Product Specifications Display

### Overview

The Quote Management system now displays all custom product specifications that customers submitted when placing their orders. This ensures you have complete visibility into what the customer ordered before negotiating with vendors.

### What Are Product Specifications?

Product specifications are the custom fields that customers fill out when ordering products with dynamic forms. For example, when ordering a custom etching plaque, customers specify:

- **Material Type**: Stainless Steel, Brass, Aluminum, etc.
- **Dimensions**: Size of the product (e.g., 30x40cm)
- **Engraving Text**: Custom text to be engraved
- **Finishing**: Polished, Brushed, Matte, etc.
- **Thickness**: Plate thickness (e.g., 2mm, 3mm)
- **Other Custom Fields**: Any product-specific requirements

### Where to Find Specifications

Product specifications are displayed in the **Quote Form** when creating or editing quotes:

```
┌─────────────────────────────────────────────────────────┐
│ Quote Item #1                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Product: Plakat 30 Years Beyond Partnership            │
│ Quantity: 2                                             │
│ Unit Price: Rp 3,114,510                               │
│ Vendor Cost: Rp 250,000                                │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📋 Product Specifications (6 fields)      [▼]   │   │
│ ├─────────────────────────────────────────────────┤   │
│ │                                                 │   │
│ │ Jenis Plakat:                                   │   │
│ │ Plakat Logam                                    │   │
│ │                                                 │   │
│ │ Jenis Logam:                                    │   │
│ │ Stainless Steel 304 (Anti Karat)               │   │
│ │                                                 │   │
│ │ Ketebalan Plat:                                 │   │
│ │ 2mm                                             │   │
│ │                                                 │   │
│ │ Ukuran Plakat:                                  │   │
│ │ 30x40cm                                         │   │
│ │                                                 │   │
│ │ Text untuk Engraving:                           │   │
│ │ 30 Years Beyond Partnership                     │   │
│ │                                                 │   │
│ │ Finishing:                                      │   │
│ │ Polished                                        │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Specifications Display Features

#### 1. Collapsible Section

The specifications section is **collapsible** to save space:

- **Collapsed State**: Shows badge with field count (e.g., "6 fields")
- **Expanded State**: Shows all specification fields with labels and values
- **Click to Toggle**: Click anywhere on the header to expand/collapse

#### 2. Field Labels

Field labels are displayed in **human-readable format**:

- ✅ **Original Form Labels**: Uses the exact labels from the product form configuration
- ✅ **Proper Formatting**: Labels are properly formatted and easy to read
- ✅ **Language Support**: Supports both Indonesian and English labels

**Example**:
- Form field name: `jenis_plakat`
- Display label: **"Jenis Plakat"**

#### 3. Field Values

Field values are displayed in **readable format**:

- ✅ **Text Values**: Displayed as-is
- ✅ **Boolean Values**: Shown as "Yes" or "No"
- ✅ **Empty Values**: Shown as "Not specified"
- ✅ **Long Text**: Properly wrapped for readability

#### 4. Responsive Layout

The specifications display is **fully responsive**:

- **Desktop**: Two-column grid layout
- **Tablet**: Two-column grid layout
- **Mobile**: Single-column layout

### Using Specifications in Quotes

#### When Creating Quotes

1. **Review Specifications First**
   - Expand the specifications section
   - Read all custom requirements
   - Note any special requests or complex specifications

2. **Consider Specifications in Pricing**
   - More complex specifications may require higher vendor costs
   - Special materials or finishes affect pricing
   - Custom engraving or text may add to production time

3. **Communicate with Vendor**
   - Share specification details with vendor
   - Ensure vendor can meet all requirements
   - Confirm vendor understands custom specifications

#### When Negotiating

1. **Reference Specifications**
   - Use specifications to justify pricing
   - Explain complexity to customer if needed
   - Ensure vendor quote covers all specifications

2. **Verify Completeness**
   - Check that all required fields are filled
   - Confirm no missing information
   - Contact customer if clarification needed

### Specifications Data Source

**Important**: Specifications are copied from the original order at the time of quote creation:

- ✅ **Immutable**: Specifications cannot be edited in the quote
- ✅ **Historical Record**: Preserves what customer originally ordered
- ✅ **Audit Trail**: Maintains data integrity for compliance

If specifications need to be changed:
1. Customer must modify the original order
2. Create a new quote with updated specifications
3. Old quote can be rejected or cancelled

### Troubleshooting Specifications

#### Issue: Specifications Not Showing

**Possible Causes**:
1. Product doesn't have a dynamic form configuration
2. Customer didn't fill out specifications when ordering
3. Order was created before specifications feature

**Solutions**:
- ✅ Check if product has form configuration in Product Management
- ✅ Verify order has specifications data
- ✅ Contact customer to provide missing specifications

#### Issue: Field Labels Not Readable

**Possible Causes**:
1. Form configuration missing field labels
2. Field names used instead of labels

**Solutions**:
- ✅ Update product form configuration with proper labels
- ✅ Recreate quote to pull updated labels
- ✅ Contact support if issue persists

#### Issue: Specifications Section Empty

**Possible Causes**:
1. No specifications data in order
2. Product doesn't require specifications

**Solutions**:
- ✅ This is normal for products without custom fields
- ✅ Specifications section won't appear if no data exists
- ✅ Proceed with quote creation normally

---

## Pricing Calculations Breakdown

### Overview

The Quote Management system now provides a **comprehensive pricing breakdown** that clearly shows per-piece costs, total costs, and profit margins. This helps you understand the complete financial picture when negotiating with vendors.

### Calculation Display

The pricing calculations are displayed in a dedicated **Pricing Breakdown** card below each quote item:

```
┌─────────────────────────────────────────────────────────┐
│ 🧮 Pricing Breakdown                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ Per Piece ─────────────────────────────────────┐   │
│ │                                                  │   │
│ │ Vendor Cost:        Rp 250,000                   │   │
│ │ Unit Price:         Rp 3,114,510                 │   │
│ │ Profit Margin:      📈 Rp 2,864,510 (1145.8%)   │   │
│ │                                                  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─ Total (Qty: 2) ────────────────────────────────┐   │
│ │                                                  │   │
│ │ Total Vendor Cost:  Rp 500,000                   │   │
│ │ Total Unit Price:   Rp 6,229,020                 │   │
│ │ Total Profit:       📈 Rp 5,729,020 (1145.8%)   │   │
│ │                                                  │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Understanding the Calculations

#### Per-Piece Section

This section shows the **unit economics** for a single item:

**1. Vendor Cost (Per Piece)**
- The cost charged by the vendor for one unit
- This is the **editable** field you enter when creating/editing quotes
- Represents your cost of goods sold (COGS)

**2. Unit Price (Per Piece)**
- The price you will charge the customer for one unit
- This is the **editable** field you enter when creating/editing quotes
- Should include your desired profit margin

**3. Profit Margin (Per Piece)**
- **Calculation**: Unit Price - Vendor Cost
- **Percentage**: (Profit / Vendor Cost) × 100
- **Display**: Shows both amount and percentage
- **Color**: Green text with trending-up icon (📈)

**Example**:
```
Vendor Cost:   Rp 250,000
Unit Price:    Rp 3,114,510
Profit:        Rp 2,864,510 (1145.8%)
```

#### Total Section (Quantity > 1)

This section appears **only when quantity is greater than 1** and shows the **total economics** for all units:

**1. Total Vendor Cost**
- **Calculation**: Vendor Cost × Quantity
- **Read-Only**: Automatically calculated
- Represents total cost from vendor

**2. Total Unit Price**
- **Calculation**: Unit Price × Quantity
- **Read-Only**: Automatically calculated
- Represents total revenue from customer

**3. Total Profit**
- **Calculation**: Total Unit Price - Total Vendor Cost
- **Percentage**: (Total Profit / Total Vendor Cost) × 100
- **Display**: Shows both amount and percentage
- **Color**: Green text with trending-up icon (📈)

**Example** (Quantity: 2):
```
Total Vendor Cost:  Rp 500,000
Total Unit Price:   Rp 6,229,020
Total Profit:       Rp 5,729,020 (1145.8%)
```

### Real-Time Calculation Updates

The pricing breakdown **updates automatically** when you change:

- ✅ **Quantity**: Total section recalculates instantly
- ✅ **Vendor Cost**: All profit margins update
- ✅ **Unit Price**: All profit margins update

**No need to save or refresh** - calculations happen in real-time as you type!

### Calculation Formulas

#### Per-Piece Calculations

```
Profit Per Piece = Unit Price - Vendor Cost

Profit Percentage = (Profit Per Piece / Vendor Cost) × 100
```

#### Total Calculations

```
Total Vendor Cost = Vendor Cost × Quantity

Total Unit Price = Unit Price × Quantity

Total Profit = Total Unit Price - Total Vendor Cost

Total Profit Percentage = (Total Profit / Total Vendor Cost) × 100
```

### Using Calculations in Decision Making

#### 1. Evaluating Vendor Quotes

**Check Profit Margins**:
- ✅ Is the profit margin acceptable for your business?
- ✅ Does it cover operational costs and desired profit?
- ✅ Compare margins across different vendors

**Example Decision**:
```
Vendor A: Rp 250,000 → Profit: 1145.8% ✅ Excellent
Vendor B: Rp 400,000 → Profit: 678.6%  ✅ Good
Vendor C: Rp 600,000 → Profit: 419.1%  ⚠️ Acceptable
```

#### 2. Setting Customer Prices

**Calculate Desired Margin**:
1. Know your target profit percentage
2. Calculate required unit price
3. Adjust based on market rates

**Formula**:
```
Unit Price = Vendor Cost × (1 + Desired Margin %)

Example:
Vendor Cost: Rp 250,000
Desired Margin: 35%
Unit Price: Rp 250,000 × 1.35 = Rp 337,500
```

#### 3. Negotiating with Vendors

**Use Calculations to Negotiate**:
- Show vendor how their price affects your margins
- Request discounts for bulk orders
- Negotiate better terms for repeat business

**Example**:
```
Current: Rp 250,000 → Margin: 35%
Target:  Rp 200,000 → Margin: 68.75%
Savings: Rp 50,000 per unit
```

#### 4. Quantity-Based Pricing

**Analyze Total Impact**:
- See how quantity affects total profit
- Offer volume discounts to customers
- Calculate break-even points

**Example**:
```
Qty 1:  Profit = Rp 2,864,510
Qty 2:  Profit = Rp 5,729,020 (2× profit)
Qty 10: Profit = Rp 28,645,100 (10× profit)
```

### Visual Indicators

#### Color Coding

The system uses **color coding** to help you quickly assess profitability:

- 🟢 **Green**: Positive profit margin (good)
- 🔴 **Red**: Negative profit margin (loss) - *Future feature*
- ⚠️ **Yellow**: Low profit margin (<10%) - *Future feature*

#### Icons

- 📈 **Trending Up**: Indicates profit/positive margin
- 📉 **Trending Down**: Indicates loss/negative margin - *Future feature*
- 🧮 **Calculator**: Indicates calculated field

### Calculation Accuracy

All calculations are:
- ✅ **Accurate to 2 decimal places**
- ✅ **Rounded using standard rounding rules**
- ✅ **Consistent across all displays**
- ✅ **Validated for correctness**

### Troubleshooting Calculations

#### Issue: Calculations Not Updating

**Possible Causes**:
1. Browser cache issue
2. JavaScript error

**Solutions**:
- ✅ Refresh the page (Ctrl+R or Cmd+R)
- ✅ Clear browser cache
- ✅ Try in incognito/private mode
- ✅ Check browser console for errors

#### Issue: Incorrect Profit Percentage

**Possible Causes**:
1. Vendor cost is zero
2. Rounding differences

**Solutions**:
- ✅ Ensure vendor cost is greater than zero
- ✅ Percentages are calculated as: (Profit / Cost) × 100
- ✅ Minor rounding differences are normal

#### Issue: Total Section Not Showing

**Possible Causes**:
1. Quantity is 1
2. This is expected behavior

**Solutions**:
- ✅ Total section only appears when quantity > 1
- ✅ For quantity = 1, per-piece and total are the same
- ✅ This is intentional to reduce clutter

#### Issue: Negative Profit Margin

**Possible Causes**:
1. Unit price is lower than vendor cost
2. Pricing error

**Solutions**:
- ✅ Review your pricing strategy
- ✅ Increase unit price to cover costs
- ✅ Negotiate lower vendor cost
- ✅ This indicates you're selling at a loss

### Best Practices

#### 1. Always Review Calculations

Before accepting a quote:
- ✅ Check per-piece profit margin
- ✅ Verify total profit for quantity orders
- ✅ Ensure margins meet business targets
- ✅ Compare with similar products

#### 2. Document Pricing Decisions

Use the **Internal Notes** field to document:
- Why you chose specific pricing
- Margin targets for this product
- Special considerations
- Negotiation history

#### 3. Monitor Profit Trends

Track profit margins over time:
- Compare margins across vendors
- Identify most profitable products
- Adjust pricing strategies
- Optimize vendor relationships

#### 4. Consider All Costs

Remember that profit margin should cover:
- Operational costs (5-10%)
- Marketing costs (5-10%)
- Overhead costs (5-10%)
- Desired net profit (10-20%)
- Contingency buffer (5%)

**Example Target**:
```
Vendor Cost:     Rp 250,000
Operational:     Rp 12,500  (5%)
Marketing:       Rp 12,500  (5%)
Overhead:        Rp 12,500  (5%)
Net Profit:      Rp 50,000  (20%)
Contingency:     Rp 12,500  (5%)
─────────────────────────────
Unit Price:      Rp 350,000 (40% markup)
```

---

## Editing Quotes

### When Can You Edit?

You can only edit quotes with status:
- ✅ **Draft**
- ✅ **Open**

You **cannot** edit quotes that are:
- ❌ Accepted
- ❌ Rejected
- ❌ Expired
- ❌ Cancelled

### Editing Process

1. **Open Quote Detail**
   - Navigate to the quote you want to edit

2. **Click "Edit" Button**
   - Available in action buttons section
   - Opens edit form with current data

3. **Modify Fields**
   ```
   Editable Fields:
   - Initial/Latest Offer
   - Valid Until date
   - Terms & Conditions
   - Internal Notes
   
   Immutable Fields (Cannot Change):
   - Order
   - Customer
   - Vendor
   ```

4. **Save Changes**
   - Click **"Save Changes"** button
   - System creates new revision
   - Revision number incremented
   - Changes logged in history

5. **Confirmation**
   - Success notification displayed
   - Redirected to quote detail page
   - Updated data visible immediately

### Edit Mode Indicators

When editing an existing quote:
- Title shows: **"Edit Quote #Q-000123"**
- Quote number displayed prominently
- Revision number shown
- Last modified timestamp visible

---

## Accepting Quotes

### Prerequisites

Before accepting a quote:
- ✅ Quote status must be "Open" or "Countered"
- ✅ Quote must not be expired
- ✅ You must have "accept-quotes" permission
- ✅ Order must be in "Vendor Negotiation" stage

### Acceptance Process

1. **Review Quote Details**
   - Verify pricing is acceptable
   - Check terms and conditions
   - Review vendor information
   - Confirm delivery timeline

2. **Click "Accept" Button**
   - Located in quote actions section
   - Opens confirmation dialog

3. **Confirmation Dialog**
   ```
   ┌─────────────────────────────────────────┐
   │ Accept Quote #Q-000123?                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Vendor: PT Vendor XYZ                   │
   │ Total: Rp 5,000,000 ($317.46)          │
   │                                         │
   │ This will:                              │
   │ • Accept this quote                     │
   │ • Reject all other quotes for order     │
   │ • Advance order to Customer Quote stage │
   │ • Calculate customer quotation (×1.35)  │
   │                                         │
   │ [Cancel]  [Confirm Accept]              │
   └─────────────────────────────────────────┘
   ```

4. **Confirm Acceptance**
   - Click **"Confirm Accept"** button
   - System processes acceptance

5. **System Actions** (Automatic)
   ```
   ✓ Quote status → "Accepted"
   ✓ Quote closed_at → Current timestamp
   ✓ Order vendor_quoted_price → Quote amount
   ✓ Order quotation_amount → Quote × 1.35
   ✓ Order vendor_id → Quote vendor
   ✓ Order status → "Customer Quote"
   ✓ Other quotes → Auto-rejected
   ✓ History entry created
   ```

6. **Success Notification**
   - Green toast notification appears
   - Message: "Quote accepted and order updated"
   - Automatically redirected to order detail page

7. **Verify Order Updated**
   - Order status now shows "Customer Quote"
   - Vendor information populated
   - Quotation amount calculated
   - Ready for customer approval

### What Happens to Other Quotes?

When you accept a quote:
- All other **open** or **countered** quotes for the same order are automatically **rejected**
- Rejection reason: "Another quote was accepted for this order"
- This ensures only one quote is active per order

### Quotation Calculation

The customer quotation is calculated as:
```
Customer Quotation = Vendor Quoted Price × 1.35

Where:
- 30% = PT CEX markup
- 5% = Operational cost
- Total = 35% markup

Example:
Vendor Price: Rp 5,000,000
Customer Quote: Rp 6,750,000 (Rp 5M × 1.35)
```

---

## Rejecting Quotes

### When to Reject

Reject a quote when:
- ❌ Price exceeds budget
- ❌ Vendor cannot meet timeline
- ❌ Terms are unacceptable
- ❌ Quality concerns
- ❌ Better quote received from another vendor

### Rejection Process

1. **Open Quote Detail**
   - Navigate to quote you want to reject

2. **Click "Reject" Button**
   - Opens rejection dialog

3. **Rejection Dialog**
   ```
   ┌─────────────────────────────────────────┐
   │ Reject Quote #Q-000123?                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Rejection Reason (required):            │
   │ ┌─────────────────────────────────────┐ │
   │ │ Price too high compared to market   │ │
   │ │ rate. Exceeds budget by 25%.        │ │
   │ │                                     │ │
   │ └─────────────────────────────────────┘ │
   │ Minimum 10 characters                   │
   │ Character count: 58 / 1000              │
   │                                         │
   │ [Cancel]  [Confirm Reject]              │
   └─────────────────────────────────────────┘
   ```

4. **Enter Rejection Reason**
   - **Required**: Minimum 10 characters
   - **Maximum**: 1000 characters
   - Be specific and professional
   - Reason saved for future reference

5. **Confirm Rejection**
   - Click **"Confirm Reject"** button
   - System processes rejection

6. **System Actions**
   ```
   ✓ Quote status → "Rejected"
   ✓ Quote closed_at → Current timestamp
   ✓ Rejection reason → Saved to history
   ✓ Quote becomes read-only
   ✓ History entry created
   ```

7. **Check Other Quotes**
   - System checks if other active quotes exist
   - **If other quotes exist**: Order remains in "Vendor Negotiation"
   - **If all quotes rejected**: Order reverts to "Vendor Sourcing"

### All Quotes Rejected Scenario

If you reject the last active quote:

```
┌─────────────────────────────────────────────┐
│ ⚠️ All Quotes Rejected                      │
├─────────────────────────────────────────────┤
│                                             │
│ All quotes for this order have been         │
│ rejected. The order status has been         │
│ reverted to "Vendor Sourcing".              │
│                                             │
│ Next Steps:                                 │
│ 1. Select a new vendor                      │
│ 2. Create a new quote                       │
│ 3. Continue negotiation process             │
│                                             │
│ [Go to Order]  [Select New Vendor]          │
└─────────────────────────────────────────────┘
```

### Viewing Rejected Quotes

Rejected quotes are **read-only**:
- ✅ Can view all details
- ✅ Can see rejection reason
- ✅ Can view history
- ❌ Cannot edit
- ❌ Cannot accept
- ❌ Cannot counter offer

Badge shows: **"Rejected - Read Only"**

---

## Counter Offers

### When to Counter

Use counter offers when:
- 💰 Price is close but needs adjustment
- 📅 Timeline needs modification
- 📋 Terms need minor changes
- 🤝 Negotiating better deal

### Counter Offer Process

1. **Open Quote Detail**
   - Navigate to quote in "Open" or "Sent" status

2. **Click "Counter Offer" Button**
   - Opens counter offer dialog

3. **Counter Offer Dialog**
   ```
   ┌─────────────────────────────────────────┐
   │ Counter Offer for Quote #Q-000123       │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Current Offer:                          │
   │ Rp 5,000,000 ($317.46)                 │
   │                                         │
   │ Your Counter Offer:                     │
   │ ┌─────────────────────────────────────┐ │
   │ │ Rp 4,500,000                        │ │
   │ └─────────────────────────────────────┘ │
   │                                         │
   │ Difference: -Rp 500,000 (-10%)         │
   │                                         │
   │ Notes (optional):                       │
   │ ┌─────────────────────────────────────┐ │
   │ │ Budget constraints require lower    │ │
   │ │ price. Can you meet this target?    │ │
   │ └─────────────────────────────────────┘ │
   │                                         │
   │ [Cancel]  [Send Counter Offer]          │
   └─────────────────────────────────────────┘
   ```

4. **Enter Counter Price**
   - Must be positive number
   - Can be higher or lower than current offer
   - System shows difference and percentage

5. **Add Notes** (Optional)
   - Explain reasoning for counter
   - Suggest alternative terms
   - Maximum 1000 characters

6. **Send Counter Offer**
   - Click **"Send Counter Offer"** button
   - System processes counter

7. **System Actions**
   ```
   ✓ Quote status → "Countered"
   ✓ Quote latest_offer → New counter price
   ✓ Quote round → Incremented
   ✓ Counter saved to history
   ✓ Vendor notified (Phase 2)
   ```

8. **Success Notification**
   - Message: "Counter offer sent successfully"
   - Quote detail page refreshed
   - New price and round visible

### Counter Offer Limits

- **Maximum Rounds**: 5 counter offers per quote
- After 5 rounds, you must either:
  - Accept the current offer
  - Reject the quote
  - Create new quote with different vendor

### Negotiation History

All counter offers are tracked:
```
Round 1: Initial Offer - Rp 5,000,000
Round 2: Counter by Admin - Rp 4,500,000 (-10%)
Round 3: Counter by Vendor - Rp 4,750,000 (+5.5%)
Round 4: Counter by Admin - Rp 4,600,000 (-3.2%)
Round 5: Accepted - Rp 4,600,000
```

---

## Dashboard Notifications

### Quote Notifications Widget

Located on the **Dashboard** home page:

```
┌─────────────────────────────────────────┐
│ 📋 Pending Quotes                       │
├─────────────────────────────────────────┤
│                                         │
│ Q-000123                    [Review]    │
│ PT Vendor XYZ • Rp 5,000,000           │
│ Created 2 hours ago                     │
│                                         │
│ Q-000124                    [Review]    │
│ PT Vendor ABC • Rp 4,500,000           │
│ Created 5 hours ago                     │
│                                         │
│ Q-000125                    [Review]    │
│ PT Vendor DEF • Rp 6,000,000           │
│ Created 1 day ago                       │
│                                         │
│ [View All Quotes]                       │
└─────────────────────────────────────────┘
```

**Features**:
- Shows up to 5 most recent pending quotes
- Displays quote number, vendor, and amount
- "Review" button links to quote detail
- "View All" links to quotes list page
- Auto-refreshes when quotes updated

### Notification Badge

The **Quotes** menu item shows a badge with pending count:

```
📋 Quotes [3]  ← Red badge with count
```

**Badge Updates**:
- Appears when pending quotes exist
- Shows count of quotes with status: Open, Countered
- Updates in real-time after actions
- Disappears when no pending quotes

---

## Quote List Management

### Accessing Quotes List

Navigate to: **Admin Menu** → **Quotes**

### List View Features

```
┌──────────────────────────────────────────────────────────────┐
│ Quotes                                    [Create New Quote]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Filters: [Status ▼] [Vendor ▼] [Date Range ▼] [Search]     │
│                                                              │
│ Quote #    Order      Vendor      Amount      Status  Actions│
│ ──────────────────────────────────────────────────────────── │
│ Q-000123  ORD-001  PT Vendor XYZ  Rp 5.0M   Open    [View]  │
│ Q-000124  ORD-002  PT Vendor ABC  Rp 4.5M   Counter [View]  │
│ Q-000125  ORD-003  PT Vendor DEF  Rp 6.0M   Accepted [View] │
│                                                              │
│ Showing 1-20 of 156                    [1] 2 3 4 5 ... Next │
└──────────────────────────────────────────────────────────────┘
```

### Filtering Options

#### 1. Status Filter
- All Statuses
- Open
- Countered
- Accepted
- Rejected
- Expired
- Cancelled

#### 2. Vendor Filter
- All Vendors
- [List of active vendors]

#### 3. Date Range Filter
- Today
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

#### 4. Search
- Search by quote number
- Search by order number
- Search by vendor name

### Sorting Options

Click column headers to sort:
- Quote Number (ascending/descending)
- Created Date (newest/oldest)
- Amount (highest/lowest)
- Status (alphabetical)

### Bulk Actions

Select multiple quotes to:
- Export to CSV
- Print summary report
- Bulk status update (future feature)

### Export to CSV

1. Click **"Export"** button
2. Select date range
3. Choose columns to include
4. Download CSV file

CSV includes:
- Quote number
- Order number
- Customer name
- Vendor name
- Amount (IDR and USD)
- Status
- Created date
- Accepted/Rejected date
- Rejection reason (if applicable)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Cannot Create Quote

**Symptoms**:
- "Create Quote" button disabled
- Error: "Order not in correct stage"

**Solutions**:
1. ✅ Verify order status is "Vendor Negotiation"
2. ✅ Check if vendor is selected for order
3. ✅ Ensure you have "create-quotes" permission
4. ✅ Verify order is not already completed

#### Issue 2: Modal Opens in Edit Mode Unexpectedly

**Symptoms**:
- Expected to create new quote
- Modal shows existing quote data
- Title says "Edit Quote"

**Explanation**:
- This is **correct behavior**
- System detected active quote for order
- Prevents duplicate quotes

**Solutions**:
1. ✅ Edit the existing quote if needed
2. ✅ Or reject existing quote first
3. ✅ Then create new quote

#### Issue 3: Cannot Accept Quote

**Symptoms**:
- "Accept" button disabled or missing
- Error: "Quote has expired"

**Solutions**:
1. ✅ Check quote valid_until date
2. ✅ If expired, create new quote
3. ✅ Verify quote status is "Open" or "Countered"
4. ✅ Check you have "accept-quotes" permission

#### Issue 4: Quote Not Appearing in List

**Symptoms**:
- Created quote but not visible
- List appears empty

**Solutions**:
1. ✅ Check status filter (may be filtering out your quote)
2. ✅ Clear all filters and search
3. ✅ Refresh page (Ctrl+R or Cmd+R)
4. ✅ Verify quote was created successfully (check notifications)

#### Issue 5: Order Status Not Updating

**Symptoms**:
- Accepted quote but order still in "Vendor Negotiation"
- Order data not synced

**Solutions**:
1. ✅ Refresh order detail page
2. ✅ Check order history for status change entry
3. ✅ Verify quote acceptance was successful
4. ✅ Contact support if issue persists

#### Issue 6: Cannot Edit Quote

**Symptoms**:
- "Edit" button missing
- Error: "Quote cannot be modified"

**Explanation**:
- Only "Draft" and "Open" quotes can be edited
- Accepted/Rejected/Expired quotes are read-only

**Solutions**:
1. ✅ Check quote status
2. ✅ If accepted/rejected, create new quote instead
3. ✅ If expired, create new quote with updated date

#### Issue 7: Rejection Reason Too Short

**Symptoms**:
- Error: "Reason must be at least 10 characters"
- Cannot submit rejection

**Solution**:
- ✅ Provide detailed rejection reason (minimum 10 characters)
- ✅ Be specific about why quote is rejected
- ✅ Example: "Price exceeds budget by 25%"

#### Issue 8: Counter Offer Limit Reached

**Symptoms**:
- "Counter Offer" button disabled
- Message: "Maximum rounds reached"

**Explanation**:
- Maximum 5 counter offers per quote
- Prevents endless negotiation

**Solutions**:
1. ✅ Accept current offer if acceptable
2. ✅ Reject quote if not acceptable
3. ✅ Create new quote with different vendor
4. ✅ Contact vendor directly for final negotiation

---

## FAQ

### General Questions

**Q: What is a quote?**
A: A quote is a vendor's offer to fulfill an order at a specific price with defined terms and conditions.

**Q: How many quotes can I create per order?**
A: You can create multiple quotes per order, but only one active quote per vendor. After accepting one quote, all others are automatically rejected.

**Q: Can I delete a quote?**
A: Yes, but only quotes with "Draft" or "Open" status. Deletion is a soft delete (marks as "Cancelled") to preserve audit trail.

**Q: What happens when a quote expires?**
A: Expired quotes become read-only and cannot be accepted. You must create a new quote with an updated expiration date.

### Workflow Questions

**Q: Why does the modal open in edit mode?**
A: The system detected an active quote for the order. This prevents duplicate quotes and ensures you edit the existing quote instead.

**Q: Can I create multiple quotes for the same vendor?**
A: No, only one active quote per order+vendor combination. You must reject or accept the existing quote before creating a new one.

**Q: What happens to other quotes when I accept one?**
A: All other open or countered quotes for the same order are automatically rejected with reason "Another quote was accepted".

**Q: Can I un-reject a quote?**
A: No, rejected quotes are final and read-only. You must create a new quote if you want to reconsider the vendor.

**Q: How is the customer quotation calculated?**
A: Customer quotation = Vendor price × 1.35 (35% markup: 30% profit + 5% operational cost).

### Technical Questions

**Q: Why do I see both IDR and USD amounts?**
A: The system shows both currencies for reference. USD conversion uses the current exchange rate from the system.

**Q: Are quotes tenant-isolated?**
A: Yes, all quotes are completely isolated per tenant. You can only see and manage quotes for your tenant.

**Q: Can vendors see my internal notes?**
A: No, internal notes are only visible to tenant administrators. Vendors cannot access them.

**Q: How long is quote history retained?**
A: Quote history is retained indefinitely for audit purposes. All actions are logged with timestamps and user information.

### Permission Questions

**Q: What permissions do I need to manage quotes?**
A: You need the following permissions:
- `view-quotes`: View quote list and details
- `create-quotes`: Create new quotes
- `edit-quotes`: Edit draft/open quotes
- `accept-quotes`: Accept quotes
- `reject-quotes`: Reject quotes
- `delete-quotes`: Delete/cancel quotes

**Q: Can I delegate quote management to other users?**
A: Yes, assign the appropriate quote permissions to other tenant users through the user management system.

### Notification Questions

**Q: How do I know when I have pending quotes?**
A: Check the dashboard widget or the notification badge on the Quotes menu item.

**Q: Will I receive email notifications?**
A: Email notifications for quotes are planned for Phase 2. Currently, use the dashboard widget and in-app notifications.

**Q: Can I customize notification preferences?**
A: Notification preferences will be available in Phase 2 of the quote management system.

### Specifications Questions

**Q: What are product specifications?**
A: Product specifications are the custom fields that customers fill out when ordering products with dynamic forms (e.g., material type, dimensions, engraving text).

**Q: Where can I see product specifications in quotes?**
A: Specifications are displayed in a collapsible section within each quote item in the Quote Form. Click the header to expand/collapse the section.

**Q: Can I edit specifications in the quote?**
A: No, specifications are immutable and copied from the original order. If changes are needed, the customer must modify the original order and you must create a new quote.

**Q: Why don't I see specifications for some products?**
A: Not all products have dynamic forms. If a product doesn't require custom specifications, the specifications section won't appear.

**Q: What if specifications are missing or incomplete?**
A: Contact the customer to provide the missing information, then update the order and create a new quote with complete specifications.

**Q: How do I know what each specification field means?**
A: Field labels are taken from the product form configuration and should be self-explanatory. If unclear, check the product's form configuration in Product Management.

### Calculations Questions

**Q: What is the Pricing Breakdown section?**
A: The Pricing Breakdown shows detailed calculations including per-piece costs, total costs, and profit margins for each quote item.

**Q: Why do I see both per-piece and total calculations?**
A: Per-piece shows unit economics, while total shows the complete financial picture for quantity orders. Total section only appears when quantity > 1.

**Q: How is profit margin calculated?**
A: Profit Margin = Unit Price - Vendor Cost. Profit Percentage = (Profit / Vendor Cost) × 100.

**Q: Do calculations update in real-time?**
A: Yes! Calculations update automatically as you change quantity, vendor cost, or unit price. No need to save or refresh.

**Q: What if I see a negative profit margin?**
A: A negative margin means you're selling at a loss (unit price < vendor cost). Review your pricing strategy and adjust accordingly.

**Q: Why doesn't the total section appear?**
A: The total section only appears when quantity is greater than 1. For quantity = 1, per-piece and total are the same.

**Q: Are calculations accurate?**
A: Yes, all calculations are accurate to 2 decimal places and use standard rounding rules. They're validated for correctness.

**Q: Can I customize the profit margin formula?**
A: No, the formula is standardized across the platform. However, you can adjust your pricing strategy to achieve desired margins.

---

## Need Help?

### Support Resources

- **User Guide**: This document
- **Video Tutorials**: Coming soon
- **Support Email**: support@canvastencil.com
- **Support Portal**: https://support.canvastencil.com

### Reporting Issues

If you encounter issues:
1. Check this troubleshooting guide
2. Clear browser cache and refresh
3. Try in incognito/private mode
4. Contact support with:
   - Quote number
   - Order number
   - Screenshot of error
   - Steps to reproduce

---

## Document Information

- **Version**: 2.0
- **Last Updated**: February 3, 2026
- **Applies To**: Quote Management Workflow Phase 1 with Dynamic Fields Enhancement
- **Related Docs**: 
  - Order Status Management Guide
  - Vendor Management User Guide
  - Vendor Negotiation Guide
  - Product Management Guide

---

**© 2026 CanvaStencil. All rights reserved.**
