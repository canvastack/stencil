# Order Workflow - Quick Reference Guide

## Overview
Quick reference untuk developer yang bekerja dengan order workflow system.

---

## Order Status Flow

```
NEW → PENDING → VENDOR_SOURCING → VENDOR_NEGOTIATION → 
CUSTOMER_QUOTE → AWAITING_PAYMENT → FULL_PAYMENT → 
IN_PRODUCTION → QUALITY_CONTROL → SHIPPING → COMPLETED
```

### Status Definitions

| Status | Description | Use Case |
|--------|-------------|----------|
| `new` | New order from customer | ✅ Public form submission |
| `draft` | Order being prepared | ❌ Internal use only |
| `pending` | Awaiting review | Admin review needed |
| `vendor_sourcing` | Finding vendor | Vendor matching process |
| `vendor_negotiation` | Negotiating with vendor | Price/terms discussion |
| `customer_quote` | Waiting customer approval | Quote sent to customer |
| `awaiting_payment` | Waiting for payment | Payment pending |
| `full_payment` | Payment complete | Ready for production |
| `in_production` | Being produced | Vendor production |
| `quality_control` | QC inspection | Quality check |
| `shipping` | Being shipped | In transit |
| `completed` | Order complete | Delivered |

---

## Creating Orders

### From Public Form (Customer)

**Status**: Always `new`

```php
// ProductFormController.php
$order = Order::create([
    'status' => 'new', // ✅ CORRECT
    'payment_status' => 'unpaid',
    'production_type' => 'vendor',
    'items' => [/* JSON data */],
    // ...
]);

// Send notification
$customer->notify(new OrderCreatedNotification($order));
```

### From Admin Panel

**Status**: Can be `draft` or `new`

```php
// For incomplete orders
'status' => 'draft'

// For complete orders
'status' => 'new'
```

---

## Order Items Storage

### ✅ CORRECT: JSON Field

```php
// Store dynamic form data
$order->items = [
    [
        'product_id' => $product->id,
        'product_uuid' => $product->uuid,
        'product_name' => $product->name,
        'quantity' => 10,
        'price' => 100000,
        'subtotal' => 1000000,
        'customization' => [
            'material' => 'stainless_steel',
            'size' => '30x40',
            'custom_field' => 'value',
        ],
    ],
];
```

### ❌ WRONG: Relational Table

```php
// DON'T DO THIS for dynamic form data
$order->items()->create([...]);
```

---

## Email Notifications

### Sending Order Created Email

```php
use App\Domain\Order\Notifications\OrderCreatedNotification;

// Send to customer
$customer->notify(new OrderCreatedNotification($order));

// With error handling
try {
    $customer->notify(new OrderCreatedNotification($order));
    Log::info('Email sent', ['customer' => $customer->uuid]);
} catch (\Exception $e) {
    Log::error('Email failed', ['error' => $e->getMessage()]);
    // Don't fail the order creation
}
```

### Available Notifications

- `OrderCreatedNotification` - Order created
- `OrderStatusChangedNotification` - Status changed
- `OrderShippedNotification` - Order shipped
- `OrderDeliveredNotification` - Order delivered
- `PaymentReceivedNotification` - Payment received

---

## WhatsApp Integration

### Frontend Usage

```typescript
import { generateWhatsAppUrl } from '@/utils/whatsapp';

// Generate URL
const url = generateWhatsAppUrl('081234567890', 'Hello World');
// Result: https://wa.me/6281234567890?text=Hello%20World

// Open chat
window.open(url, '_blank');
```

### Phone Number Formats

```typescript
// All these formats work:
'081234567890'      → '6281234567890'
'+62 812 3456 7890' → '6281234567890'
'62-812-345-6789'   → '628123456789'
```

---

## Common Patterns

### 1. Create Order from Form

```php
public function submit(Request $request, string $productUuid)
{
    return DB::transaction(function () use ($request, $productUuid) {
        // 1. Get product
        $product = Product::where('uuid', $productUuid)
            ->where('status', 'published')
            ->firstOrFail();
        
        // 2. Find or create customer
        $customer = $this->findOrCreateCustomer($formData, $product->tenant_id);
        
        // 3. Create order with 'new' status
        $order = Order::create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $product->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => $this->generateOrderNumber(),
            'status' => 'new', // ✅
            'items' => [/* JSON data */],
            // ...
        ]);
        
        // 4. Send notification
        $customer->notify(new OrderCreatedNotification($order));
        
        return response()->json(['data' => [
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
        ]], 201);
    });
}
```

### 2. Update Order Status

```php
use App\Domain\Order\Enums\OrderStatus;

// Check if transition is valid
$currentStatus = OrderStatus::from($order->status);
$newStatus = OrderStatus::VENDOR_SOURCING;

if ($currentStatus->canTransitionTo($newStatus)) {
    $order->update(['status' => $newStatus->value]);
} else {
    throw new \Exception('Invalid status transition');
}
```

### 3. Query Orders by Status

```php
// Get new orders
$newOrders = Order::where('status', 'new')
    ->where('tenant_id', $tenantId)
    ->orderBy('created_at', 'desc')
    ->get();

// Get orders in production phase
$inProduction = Order::whereIn('status', [
    'in_production',
    'quality_control',
    'shipping',
])->get();
```

### 4. Access Order Items

```php
// Get items (JSON field)
$items = $order->items; // Array

// Get items count
$count = $order->items_count; // Accessor

// Query by product in items
$orders = Order::whereJsonContains('items', [
    ['product_uuid' => $productUuid]
])->get();
```

---

## Testing

### Frontend Tests

```bash
# Run WhatsApp utility tests
npm run test -- whatsapp

# Run all tests
npm run test
```

### Backend Tests

```bash
# Run order tests
php artisan test --filter=OrderTest

# Run public order creation tests
php artisan test --filter=PublicOrderCreationTest

# Run all tests
php artisan test
```

---

## Debugging

### Check Order Status

```sql
-- Count orders by status
SELECT status, COUNT(*) as count 
FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;

-- Find orders with wrong status
SELECT * FROM orders 
WHERE status = 'draft' 
AND created_at >= NOW() - INTERVAL '1 day';
```

### Check Email Notifications

```sql
-- Check notifications sent
SELECT 
    n.type,
    n.notifiable_type,
    n.created_at,
    n.data
FROM notifications n
WHERE n.created_at >= NOW() - INTERVAL '1 day'
ORDER BY n.created_at DESC;

-- Check failed jobs
SELECT * FROM failed_jobs 
WHERE failed_at >= NOW() - INTERVAL '1 day';
```

### Laravel Logs

```bash
# Tail logs
tail -f storage/logs/laravel.log

# Search for order creation
grep "PublicFormSubmission" storage/logs/laravel.log

# Search for email errors
grep "Email notification" storage/logs/laravel.log
```

---

## Environment Configuration

### Email Setup

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Queue Configuration

```env
QUEUE_CONNECTION=database
# or
QUEUE_CONNECTION=redis
```

### Frontend URL

```env
APP_FRONTEND_URL=http://localhost:5173
```

---

## Common Issues

### Issue: Email not received

**Solutions**:
1. Check spam folder
2. Verify email config: `php artisan tinker` → `config('mail')`
3. Check queue is running: `php artisan queue:work`
4. Check failed jobs: `php artisan queue:failed`

### Issue: WhatsApp button not working

**Solutions**:
1. Check phone number format in footer config
2. Verify browser console for errors
3. Test with different phone formats

### Issue: Order status is 'draft'

**Solutions**:
1. Clear cache: `php artisan cache:clear`
2. Verify code deployment
3. Check ProductFormController line 424

---

## Quick Commands

```bash
# Backend
php artisan test                    # Run all tests
php artisan queue:work              # Process queue
php artisan queue:failed            # View failed jobs
php artisan cache:clear             # Clear cache
php artisan config:clear            # Clear config cache

# Frontend
npm run test                        # Run tests
npm run build                       # Build for production
npm run dev                         # Development server

# Database
php artisan migrate                 # Run migrations
php artisan db:seed                 # Seed database
```

---

## Resources

- [Order Flow Architecture](../../.kiro/steering/order-flow-architecture.md)
- [Order Workflow Issues](../../roadmaps/ISSUES/ORDER_WORKFLOW_ISSUES.md)
- [Order Workflow Fixes](../../roadmaps/ISSUES/ORDER_WORKFLOW_FIXES_SUMMARY.md)
- [OrderStatus Enum](../../backend/app/Domain/Order/Enums/OrderStatus.php)
- [WhatsApp Utils](../../frontend/src/utils/whatsapp.ts)

---

**Last Updated**: 2026-02-07  
**Version**: 1.0
