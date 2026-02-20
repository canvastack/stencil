# Customer Quote Document Template Customization Guide

## Overview

The Customer Quote system includes a flexible document generation engine that creates professional PDF documents for quotations, invoices, purchase orders, and other business documents. This guide explains how to customize document templates to match your brand and business requirements.

## Table of Contents

1. [Document Types](#document-types)
2. [Template Structure](#template-structure)
3. [Customization Options](#customization-options)
4. [Template Variables](#template-variables)
5. [Styling Guidelines](#styling-guidelines)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Document Types

The system supports the following document types:

### 1. Quotation
- **Purpose**: Customer price quote
- **Template**: `resources/views/documents/quotation.blade.php`
- **Generated**: When quote is sent to customer
- **Recipient**: Customer

### 2. Proforma Invoice
- **Purpose**: Pre-payment invoice
- **Template**: `resources/views/documents/proforma-invoice.blade.php`
- **Generated**: After quote acceptance
- **Recipient**: Customer

### 3. Tax Invoice
- **Purpose**: Official tax invoice
- **Template**: `resources/views/documents/tax-invoice.blade.php`
- **Generated**: After payment verification
- **Recipient**: Customer

### 4. Purchase Order
- **Purpose**: Vendor purchase order
- **Template**: `resources/views/documents/purchase-order.blade.php`
- **Generated**: After customer payment
- **Recipient**: Vendor

### 5. Delivery Note
- **Purpose**: Shipment documentation
- **Template**: `resources/views/documents/delivery-note.blade.php`
- **Generated**: When order ships
- **Recipient**: Customer & Vendor

### 6. Receipt
- **Purpose**: Payment receipt
- **Template**: `resources/views/documents/receipt.blade.php`
- **Generated**: After payment completion
- **Recipient**: Customer

## Template Structure

### Basic Template Layout

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        /* Template styles */
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        <div class="company-info">
            <!-- Company logo and details -->
        </div>
        <div class="document-info">
            <!-- Document number, date, etc. -->
        </div>
    </div>

    <!-- Customer/Recipient Section -->
    <div class="recipient">
        <!-- Customer or vendor details -->
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <!-- Order items -->
    </table>

    <!-- Totals Section -->
    <div class="totals">
        <!-- Subtotal, tax, grand total -->
    </div>

    <!-- Terms & Conditions -->
    <div class="terms">
        <!-- Payment terms, delivery terms, etc. -->
    </div>

    <!-- Footer -->
    <div class="footer">
        <!-- Company contact info, signatures -->
    </div>
</body>
</html>
```

### File Locations

```
backend/resources/views/documents/
├── quotation.blade.php
├── proforma-invoice.blade.php
├── tax-invoice.blade.php
├── purchase-order.blade.php
├── delivery-note.blade.php
├── receipt.blade.php
└── partials/
    ├── header.blade.php
    ├── footer.blade.php
    ├── items-table.blade.php
    └── totals.blade.php
```

## Customization Options

### 1. Company Branding

#### Logo

```blade
<div class="company-logo">
    @if($tenant->logo_url)
        <img src="{{ $tenant->logo_url }}" alt="{{ $tenant->name }}" style="max-height: 80px;">
    @else
        <h1>{{ $tenant->name }}</h1>
    @endif
</div>
```

#### Colors

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --accent-color: #f59e0b;
    --text-color: #1e293b;
    --border-color: #e2e8f0;
}
```

#### Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
    font-family: 'Inter', sans-serif;
}
```

### 2. Layout Customization

#### Page Size

```css
@page {
    size: A4;
    margin: 20mm;
}
```

#### Header & Footer

```blade
<!-- Custom Header -->
<div class="header" style="border-bottom: 3px solid var(--primary-color);">
    <table style="width: 100%;">
        <tr>
            <td style="width: 50%;">
                <!-- Company info -->
            </td>
            <td style="width: 50%; text-align: right;">
                <!-- Document info -->
            </td>
        </tr>
    </table>
</div>

<!-- Custom Footer -->
<div class="footer" style="border-top: 1px solid var(--border-color); padding-top: 20px;">
    <p style="text-align: center; font-size: 10px; color: var(--secondary-color);">
        {{ $tenant->name }} | {{ $tenant->address }} | {{ $tenant->phone }}
    </p>
</div>
```

### 3. Content Sections

#### Company Information

```blade
<div class="company-info">
    <h2>{{ $tenant->name }}</h2>
    <p>{{ $tenant->address }}</p>
    <p>Phone: {{ $tenant->phone }}</p>
    <p>Email: {{ $tenant->email }}</p>
    @if($tenant->tax_id)
        <p>Tax ID: {{ $tenant->tax_id }}</p>
    @endif
</div>
```

#### Customer Information

```blade
<div class="customer-info">
    <h3>Bill To:</h3>
    <p><strong>{{ $customer->name }}</strong></p>
    <p>{{ $customer->address }}</p>
    <p>Phone: {{ $customer->phone }}</p>
    <p>Email: {{ $customer->email }}</p>
</div>
```

#### Items Table

```blade
<table class="items-table">
    <thead>
        <tr>
            <th>No</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($items as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>
                <strong>{{ $item['product_name'] }}</strong>
                @if(isset($item['specifications']))
                    <br><small>{{ $item['specifications'] }}</small>
                @endif
            </td>
            <td>{{ $item['quantity'] }}</td>
            <td>{{ formatMoney($item['unit_price']) }}</td>
            <td>{{ formatMoney($item['total_price']) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
```

#### Totals Section

```blade
<div class="totals">
    <table style="width: 300px; margin-left: auto;">
        <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">{{ formatMoney($quote->subtotal) }}</td>
        </tr>
        @if($quote->handling_fee > 0)
        <tr>
            <td>Handling Fee:</td>
            <td style="text-align: right;">{{ formatMoney($quote->handling_fee) }}</td>
        </tr>
        @endif
        @if($quote->shipping_cost > 0)
        <tr>
            <td>Shipping:</td>
            <td style="text-align: right;">{{ formatMoney($quote->shipping_cost) }}</td>
        </tr>
        @endif
        <tr>
            <td>Tax ({{ $quote->tax_rate }}%):</td>
            <td style="text-align: right;">{{ formatMoney($quote->tax_amount) }}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 16px; border-top: 2px solid var(--primary-color);">
            <td>Grand Total:</td>
            <td style="text-align: right;">{{ formatMoney($quote->grand_total) }}</td>
        </tr>
    </table>
</div>
```

## Template Variables

### Available Variables

#### Quote Variables

```php
$quote->quote_number          // CQ-202402-0001
$quote->title                 // Quote title
$quote->description           // Quote description
$quote->valid_until           // Expiry date
$quote->payment_terms         // Payment terms text
$quote->delivery_timeline     // Delivery timeline
$quote->terms_and_conditions  // T&C text
$quote->subtotal              // Subtotal in cents
$quote->tax_rate              // Tax rate (11.00)
$quote->tax_amount            // Tax amount in cents
$quote->grand_total           // Grand total in cents
$quote->created_at            // Creation date
```

#### Order Variables

```php
$order->order_number          // Order number
$order->items                 // Order items array
$order->status                // Order status
$order->created_at            // Order date
```

#### Customer Variables

```php
$customer->name               // Customer name
$customer->email              // Customer email
$customer->phone              // Customer phone
$customer->address            // Customer address
$customer->company_name       // Company name (if B2B)
```

#### Tenant Variables

```php
$tenant->name                 // Company name
$tenant->logo_url             // Logo URL
$tenant->address              // Company address
$tenant->phone                // Company phone
$tenant->email                // Company email
$tenant->website              // Company website
$tenant->tax_id               // Tax ID/NPWP
```

### Helper Functions

```php
// Format money (cents to currency)
formatMoney($cents)           // Rp 50,000

// Format date
formatDate($date)             // 19 Feb 2024

// Format datetime
formatDateTime($datetime)     // 19 Feb 2024 14:30

// Number to words (for invoices)
numberToWords($number)        // "fifty thousand rupiah"
```

## Styling Guidelines

### CSS Best Practices

```css
/* Use inline styles for better PDF rendering */
<div style="color: #333; font-size: 14px;">Content</div>

/* Avoid float and position properties */
/* Use tables for layout instead */

/* Use absolute units (px, pt) not relative (em, rem) */
font-size: 14px;  /* Good */
font-size: 1rem;  /* Avoid */

/* Specify colors in hex or rgb */
color: #2563eb;   /* Good */
color: blue;      /* Avoid */
```

### Print-Friendly Styles

```css
/* Page breaks */
.page-break {
    page-break-after: always;
}

/* Avoid breaking inside elements */
.no-break {
    page-break-inside: avoid;
}

/* Hide elements in print */
@media print {
    .no-print {
        display: none;
    }
}
```

### Table Styling

```css
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

th {
    background-color: #f1f5f9;
    padding: 10px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #cbd5e1;
}

td {
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;
}

tr:last-child td {
    border-bottom: none;
}
```

## Examples

### Example 1: Minimal Quotation

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quotation {{ $quote->quote_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .totals { margin-top: 20px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h1>QUOTATION</h1>
        <p>Number: {{ $quote->quote_number }}</p>
        <p>Date: {{ formatDate($quote->created_at) }}</p>
        <p>Valid Until: {{ formatDate($quote->valid_until) }}</p>
    </div>

    <div class="customer">
        <p><strong>{{ $customer->name }}</strong></p>
        <p>{{ $customer->address }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item['product_name'] }}</td>
                <td>{{ $item['quantity'] }}</td>
                <td>{{ formatMoney($item['unit_price']) }}</td>
                <td>{{ formatMoney($item['total_price']) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <p>Subtotal: {{ formatMoney($quote->subtotal) }}</p>
        <p>Tax: {{ formatMoney($quote->tax_amount) }}</p>
        <p><strong>Total: {{ formatMoney($quote->grand_total) }}</strong></p>
    </div>

    <div class="terms">
        <p>{{ $quote->payment_terms }}</p>
    </div>
</body>
</html>
```

### Example 2: Professional Invoice

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $document->document_number }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            line-height: 1.6;
        }
        
        .header {
            display: table;
            width: 100%;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .header-left, .header-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        
        .header-right {
            text-align: right;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: 700;
            color: #2563eb;
            margin: 0;
        }
        
        .company-logo {
            max-height: 60px;
            margin-bottom: 10px;
        }
        
        .info-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        
        table.items th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        table.items td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .totals-table {
            width: 350px;
            margin-left: auto;
            margin-top: 30px;
        }
        
        .totals-table td {
            padding: 8px;
        }
        
        .grand-total {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 10px !important;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            @if($tenant->logo_url)
                <img src="{{ $tenant->logo_url }}" class="company-logo" alt="{{ $tenant->name }}">
            @endif
            <h2 style="margin: 0;">{{ $tenant->name }}</h2>
            <p style="margin: 5px 0;">{{ $tenant->address }}</p>
            <p style="margin: 5px 0;">Phone: {{ $tenant->phone }}</p>
            <p style="margin: 5px 0;">Email: {{ $tenant->email }}</p>
        </div>
        <div class="header-right">
            <h1 class="invoice-title">INVOICE</h1>
            <p style="margin: 5px 0;"><strong>Invoice #:</strong> {{ $document->document_number }}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{ formatDate($document->document_date) }}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> {{ formatDate($payment->due_date) }}</p>
        </div>
    </div>

    <div class="info-box">
        <h3 style="margin-top: 0;">Bill To:</h3>
        <p style="margin: 5px 0;"><strong>{{ $customer->name }}</strong></p>
        <p style="margin: 5px 0;">{{ $customer->address }}</p>
        <p style="margin: 5px 0;">Phone: {{ $customer->phone }}</p>
        <p style="margin: 5px 0;">Email: {{ $customer->email }}</p>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%;">Description</th>
                <th style="width: 15%;">Quantity</th>
                <th style="width: 17.5%;">Unit Price</th>
                <th style="width: 17.5%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    <strong>{{ $item['product_name'] }}</strong>
                    @if(isset($item['specifications']))
                        <br><small style="color: #64748b;">{{ $item['specifications'] }}</small>
                    @endif
                </td>
                <td>{{ $item['quantity'] }}</td>
                <td>{{ formatMoney($item['unit_price']) }}</td>
                <td>{{ formatMoney($item['total_price']) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">{{ formatMoney($quote->subtotal) }}</td>
        </tr>
        @if($quote->handling_fee > 0)
        <tr>
            <td>Handling Fee:</td>
            <td style="text-align: right;">{{ formatMoney($quote->handling_fee) }}</td>
        </tr>
        @endif
        @if($quote->shipping_cost > 0)
        <tr>
            <td>Shipping:</td>
            <td style="text-align: right;">{{ formatMoney($quote->shipping_cost) }}</td>
        </tr>
        @endif
        <tr>
            <td>Tax ({{ $quote->tax_rate }}%):</td>
            <td style="text-align: right;">{{ formatMoney($quote->tax_amount) }}</td>
        </tr>
        <tr class="grand-total">
            <td>Grand Total:</td>
            <td style="text-align: right;">{{ formatMoney($quote->grand_total) }}</td>
        </tr>
    </table>

    <div class="info-box" style="margin-top: 40px;">
        <h4 style="margin-top: 0;">Payment Terms:</h4>
        <p>{{ $quote->payment_terms }}</p>
        
        @if($tenant->bank_accounts)
        <h4>Bank Details:</h4>
        @foreach($tenant->bank_accounts as $account)
        <p>
            <strong>{{ $account['bank_name'] }}</strong><br>
            Account: {{ $account['account_number'] }}<br>
            Name: {{ $account['account_name'] }}
        </p>
        @endforeach
        @endif
    </div>

    <div class="footer">
        <p>{{ $tenant->name }} | {{ $tenant->address }} | {{ $tenant->phone }} | {{ $tenant->email }}</p>
        @if($tenant->tax_id)
        <p>Tax ID: {{ $tenant->tax_id }}</p>
        @endif
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
```

## Best Practices

### 1. Keep It Simple

- Use clean, readable layouts
- Avoid complex CSS that may not render in PDF
- Test with actual data before deploying

### 2. Brand Consistency

- Use company colors and fonts
- Include logo on all documents
- Maintain consistent spacing and alignment

### 3. Legal Compliance

- Include all required tax information
- Add terms and conditions
- Include company registration details

### 4. Accessibility

- Use sufficient contrast ratios
- Choose readable font sizes (minimum 10px)
- Provide clear document structure

### 5. Testing

```bash
# Generate test documents
php artisan tinker
>>> $quote = App\Models\CustomerQuote::first();
>>> $service = app(App\Application\Document\Services\DocumentGenerationService::class);
>>> $document = $service->generateQuotationPDF($quote);
>>> echo $document->file_url;
```

## Troubleshooting

### Issue: Logo Not Displaying

**Solution**: Use absolute URLs or base64 encoded images

```blade
<!-- Absolute URL -->
<img src="{{ asset('storage/' . $tenant->logo_path) }}">

<!-- Base64 -->
<img src="data:image/png;base64,{{ base64_encode(file_get_contents($logoPath)) }}">
```

### Issue: Styles Not Applied

**Solution**: Use inline styles instead of external CSS

```blade
<!-- Instead of class -->
<div class="header">

<!-- Use inline -->
<div style="border-bottom: 2px solid #333; padding-bottom: 20px;">
```

### Issue: Page Breaks in Wrong Places

**Solution**: Use page-break CSS properties

```css
.no-break {
    page-break-inside: avoid;
}

.page-break {
    page-break-after: always;
}
```

### Issue: Currency Formatting

**Solution**: Use helper function

```php
// In helper.php
function formatMoney($cents, $currency = 'IDR') {
    $amount = $cents / 100;
    if ($currency === 'IDR') {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
    return '$' . number_format($amount, 2, '.', ',');
}
```

## Related Documentation

- [Customer Quote Workflow](./CUSTOMER_QUOTE_WORKFLOW.md)
- [Document Generation Service](./DOCUMENT_GENERATION_SERVICE.md)
- [PDF Service Implementation](./PDF_SERVICE.md)

## Support

For template customization assistance:
- Email: support@example.com
- Documentation: https://docs.example.com/templates
