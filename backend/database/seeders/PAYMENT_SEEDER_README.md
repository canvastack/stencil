# 💳 Payment Simulation Seeder Documentation

## Overview

`PaymentSimulationSeeder` creates realistic payment scenarios for testing the complete payment workflow in CanvaStencil platform.

---

## 🎯 Purpose

This seeder generates 5 different payment scenarios to simulate real-world payment processing:

1. **Pending Payment** - Quote accepted, awaiting payment
2. **Partial Payment** - Down payment (50%) received
3. **Fully Paid** - Complete payment received
4. **Overdue Payment** - Payment deadline passed
5. **Refunded Payment** - Order cancelled with refund

---

## 📋 Prerequisites

Before running this seeder, ensure:

1. ✅ Database is migrated: `php artisan migrate`
2. ✅ Customer exists: Run `CustomerSeeder` or ensure `customer@demo.com` exists
3. ✅ Tenant data exists: Basic tenant setup completed

---

## 🚀 How to Run

### Option 1: Using Shell Script (Linux/Mac)

```bash
cd backend
chmod +x run-payment-seeder.sh
./run-payment-seeder.sh
```

### Option 2: Using Batch File (Windows)

```cmd
cd backend
run-payment-seeder.bat
```

### Option 3: Direct Artisan Command

```bash
cd backend
php artisan db:seed --class=PaymentSimulationSeeder
```

---

## 📊 Generated Data Details

### 1. Pending Payment Quote

**Quote Number**: `QT-YYYYMMDD-PENDING`

**Details**:
- Product: Custom Etching Plate - Stainless Steel
- Quantity: 5 pieces
- Grand Total: **IDR 1,581,750**
- Payment Status: `pending`
- Paid Amount: IDR 0
- Status: Accepted 2 hours ago
- Payment Due: Within 3 days

**Use Case**: Test payment initiation flow

---

### 2. Partial Payment Quote

**Quote Number**: `QT-YYYYMMDD-PARTIAL`

**Details**:
- Product: Custom Glass Etching - Premium
- Quantity: 3 pieces
- Grand Total: **IDR 1,975,800**
- Payment Status: `partial`
- Paid Amount: **IDR 987,900** (50% DP)
- Payment Method: Midtrans
- Payment Reference: `MIDTRANS-YYYYMMDDHHMMSS-DP`
- Status: DP paid 3 days ago

**Use Case**: Test remaining payment flow, production tracking

---

### 3. Fully Paid Quote

**Quote Number**: `QT-YYYYMMDD-PAID`

**Details**:
- Product: Award Plaque - Gold Finish
- Quantity: 10 pieces
- Grand Total: **IDR 4,440,000**
- Payment Status: `paid`
- Paid Amount: **IDR 4,440,000** (100%)
- Payment Method: Xendit
- Payment Reference: `XENDIT-YYYYMMDDHHMMSS-FULL`
- Order Status: In Production

**Use Case**: Test production workflow, delivery tracking

---

### 4. Overdue Payment Quote

**Quote Number**: `QT-YYYYMMDD-OVERDUE`

**Details**:
- Product: Metal Name Plate - Aluminum
- Quantity: 20 pieces
- Grand Total: **IDR 2,009,100**
- Payment Status: `pending`
- Paid Amount: IDR 0
- Status: Accepted 5 days ago
- Payment Deadline: **2 days overdue**

**Use Case**: Test overdue notifications, payment reminders, quote expiration

---

### 5. Refunded Payment Quote

**Quote Number**: `QT-YYYYMMDD-REFUND`

**Details**:
- Product: Custom Trophy - Crystal
- Quantity: 2 pieces
- Grand Total: **IDR 2,053,500**
- Payment Status: `refunded`
- Paid Amount: IDR 2,053,500 (was paid, then refunded)
- Payment Method: Bank Transfer
- Payment Reference: `BT-YYYYMMDDHHMMSS-REFUND`
- Order Status: Cancelled
- Rejection Reason: Customer requested cancellation

**Use Case**: Test refund workflow, cancellation process

---

## 🔍 Verification

After running the seeder, verify the data:

### 1. Check Database

```sql
-- View all payment simulation quotes
SELECT 
    quote_number,
    title,
    grand_total,
    payment_status,
    paid_amount,
    payment_method
FROM customer_quotes
WHERE quote_number LIKE 'QT-%PENDING%'
   OR quote_number LIKE 'QT-%PARTIAL%'
   OR quote_number LIKE 'QT-%PAID%'
   OR quote_number LIKE 'QT-%OVERDUE%'
   OR quote_number LIKE 'QT-%REFUND%';
```

### 2. Check Frontend

1. Login to customer portal: http://localhost:5173/customer/login
2. Use credentials: `customer@demo.com` / `password`
3. Navigate to: http://localhost:5173/customer/quotes
4. You should see 5 new quotes with different payment statuses

### 3. Check Payment Details

```sql
-- Payment summary
SELECT 
    payment_status,
    COUNT(*) as count,
    SUM(grand_total) as total_amount,
    SUM(paid_amount) as total_paid
FROM customer_quotes
WHERE quote_number LIKE 'QT-%'
GROUP BY payment_status;
```

---

## 🧪 Testing Scenarios

### Scenario 1: Process Pending Payment

1. Open quote: `QT-YYYYMMDD-PENDING`
2. Click "Pay Now" button
3. Select payment method (Midtrans/Xendit/Bank Transfer)
4. Complete payment
5. Verify payment status changes to `paid`

### Scenario 2: Complete Partial Payment

1. Open quote: `QT-YYYYMMDD-PARTIAL`
2. View remaining balance: IDR 987,900
3. Click "Pay Remaining Balance"
4. Complete payment
5. Verify payment status changes to `paid`

### Scenario 3: View Fully Paid Order

1. Open quote: `QT-YYYYMMDD-PAID`
2. View payment receipt
3. Track production status
4. View delivery timeline

### Scenario 4: Handle Overdue Payment

1. Open quote: `QT-YYYYMMDD-OVERDUE`
2. See overdue warning
3. Option to pay with late fee (if configured)
4. Or cancel the quote

### Scenario 5: Review Refunded Order

1. Open quote: `QT-YYYYMMDD-REFUND`
2. View refund details
3. Check refund status
4. View cancellation reason

---

## 🔧 Customization

### Modify Payment Amounts

Edit the seeder file and adjust the pricing:

```php
// In PaymentSimulationSeeder.php
'grand_total' => 200000000, // Change to desired amount (in cents)
'paid_amount' => 100000000,  // Change paid amount
```

### Add More Scenarios

Add new methods to create additional scenarios:

```php
private function createCustomScenario(Customer $customer): void
{
    // Your custom payment scenario
}
```

Then call it in the `run()` method:

```php
public function run(): void
{
    // ... existing scenarios
    $this->createCustomScenario($customer);
}
```

---

## 📝 Data Structure

### CustomerQuote Payment Fields

```php
[
    // Pricing (all in cents)
    'vendor_total_cost' => 100000000,    // IDR 1,000,000
    'base_profit_amount' => 25000000,    // IDR 250,000
    'handling_fee' => 5000000,           // IDR 50,000
    'shipping_cost' => 10000000,         // IDR 100,000
    'insurance' => 2500000,              // IDR 25,000
    'subtotal' => 142500000,             // IDR 1,425,000
    'tax_amount' => 15675000,            // IDR 156,750
    'grand_total' => 158175000,          // IDR 1,581,750
    'currency' => 'IDR',
    
    // Payment tracking
    'payment_status' => 'pending',       // pending|partial|paid|refunded
    'paid_amount' => 0,                  // Amount paid (in cents)
    'payment_method' => null,            // midtrans|xendit|bank_transfer
    'payment_reference' => null,         // Gateway reference ID
]
```

---

## 🚨 Troubleshooting

### Error: Customer not found

**Solution**: Run CustomerSeeder first
```bash
php artisan db:seed --class=CustomerSeeder
```

### Error: Foreign key constraint

**Solution**: Ensure migrations are up to date
```bash
php artisan migrate:fresh
php artisan db:seed
```

### Error: Duplicate quote numbers

**Solution**: The seeder uses timestamps, so running multiple times will create unique quote numbers.

---

## 🔗 Related Documentation

- [Payment Flow Documentation](../../PAYMENT_FLOW_DOCUMENTATION.md)
- [Payment Configuration](../../config/payment.php)
- [Customer Quote API](../../app/Http/Controllers/CustomerPortal/QuoteController.php)

---

## 📞 Support

For issues or questions:
1. Check the main README.md
2. Review payment configuration in `config/payment.php`
3. Check logs in `storage/logs/laravel.log`

---

**Last Updated**: February 20, 2026
**Version**: 1.0.0
