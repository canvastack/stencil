# Technical Integration Guide for Tenants

## **Overview**

This guide covers technical integration capabilities available to tenant businesses, including API access, webhooks, third-party integrations, and customization options for developers and technical teams.

---

## **API Access & Integration**

### **🔌 Tenant API Overview**

#### **Available APIs**
- **Products API**: Manage your product catalog programmatically
- **Orders API**: Access order data, update statuses, process fulfillment
- **Customers API**: Manage customer profiles, segments, and communications
- **Analytics API**: Retrieve business performance data and reports
- **Inventory API**: Real-time inventory management and synchronization
- **Webhooks API**: Set up event-driven integrations and notifications

#### **Authentication**
```php
// API authentication example
POST /api/tenant/auth/token
{
  "email": "admin@your-business.com",
  "password": "your-secure-password",
  "tenant_slug": "your-business-slug"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "tenant": {
    "id": 123,
    "name": "Your Business",
    "slug": "your-business-slug"
  }
}
```

### **📊 API Usage & Rate Limits**

#### **Rate Limiting (Per Subscription Tier)**
```json
{
  "starter_plan": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000,
    "requests_per_day": 10000
  },
  "professional_plan": {
    "requests_per_minute": 120,
    "requests_per_hour": 5000, 
    "requests_per_day": 50000
  },
  "enterprise_plan": {
    "requests_per_minute": 300,
    "requests_per_hour": 15000,
    "requests_per_day": 200000
  }
}
```

#### **API Monitoring**
- **Usage Dashboard**: Real-time API usage statistics in your admin panel
- **Alert Notifications**: Email alerts when approaching rate limits
- **Performance Metrics**: Response times, error rates, success rates
- **Usage Analytics**: Historical usage patterns and optimization recommendations

---

## **Product Management API**

### **🛍️ Product Operations**

#### **Create Product**
```php
POST /api/tenant/products
Authorization: Bearer {your-api-token}

{
  "name": "Premium Wireless Headphones",
  "slug": "premium-wireless-headphones",
  "description": "High-quality wireless headphones with active noise cancellation",
  "price": 299.99,
  "sale_price": 249.99,
  "sku": "PWH-2024-001",
  "category_id": 15,
  "stock_quantity": 100,
  "status": "active",
  "images": [
    "https://yourdomain.com/images/headphones-main.jpg",
    "https://yourdomain.com/images/headphones-side.jpg"
  ],
  "variants": [
    {
      "name": "Color",
      "options": ["Black", "White", "Silver"]
    },
    {
      "name": "Size",
      "options": ["Standard", "Large"]
    }
  ],
  "specifications": {
    "battery_life": "40 hours",
    "connectivity": "Bluetooth 5.2",
    "weight": "280g",
    "warranty": "2 years"
  }
}
```

#### **Bulk Product Import**
```php
POST /api/tenant/products/bulk-import
Authorization: Bearer {your-api-token}
Content-Type: application/json

[
  {
    "name": "Product 1",
    "price": 99.99,
    "sku": "PROD-001"
    // ... product data
  },
  {
    "name": "Product 2", 
    "price": 149.99,
    "sku": "PROD-002"
    // ... product data
  }
]
```

### **📦 Inventory Synchronization**

#### **Real-time Inventory Updates**
```php
PATCH /api/tenant/products/{id}/inventory
Authorization: Bearer {your-api-token}

{
  "stock_quantity": 75,
  "reserved_stock": 5,
  "reorder_level": 20,
  "reorder_quantity": 100,
  "supplier_id": 45,
  "last_restocked": "2024-11-18T10:30:00Z"
}
```

#### **Inventory Webhooks**
```php
// Webhook payload when inventory is low
{
  "event": "inventory.low_stock",
  "product": {
    "id": 123,
    "name": "Premium Wireless Headphones",
    "sku": "PWH-2024-001",
    "current_stock": 8,
    "reorder_level": 20,
    "supplier": {
      "id": 45,
      "name": "Audio Tech Supplier",
      "contact": "orders@audiotechsupplier.com"
    }
  },
  "tenant": {
    "id": 15,
    "slug": "your-business-slug"
  },
  "timestamp": "2024-11-18T14:45:00Z"
}
```

---

## **Order Management API**

### **📋 Order Processing**

#### **Retrieve Orders**
```php
GET /api/tenant/orders?status=pending&limit=50&page=1
Authorization: Bearer {your-api-token}

Response:
{
  "data": [
    {
      "id": 1001,
      "order_number": "ORD-2024-001001",
      "status": "pending",
      "customer": {
        "id": 234,
        "name": "John Smith",
        "email": "john@email.com"
      },
      "total": 299.99,
      "currency": "USD", 
      "items": [
        {
          "product_id": 123,
          "product_name": "Premium Wireless Headphones",
          "quantity": 1,
          "price": 299.99
        }
      ],
      "shipping_address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US"
      },
      "created_at": "2024-11-18T09:15:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 125,
    "last_page": 3
  }
}
```

#### **Update Order Status**
```php
PATCH /api/tenant/orders/{id}/status
Authorization: Bearer {your-api-token}

{
  "status": "processing",
  "notes": "Order confirmed and items being prepared for shipment",
  "notify_customer": true,
  "tracking_number": "1Z999AA1234567890", // optional
  "carrier": "UPS" // optional
}
```

### **🚚 Fulfillment Integration**

#### **Shipping Integration**
```php
POST /api/tenant/orders/{id}/fulfill
Authorization: Bearer {your-api-token}

{
  "fulfillment_status": "shipped",
  "tracking_number": "1Z999AA1234567890",
  "carrier": "UPS",
  "carrier_service": "UPS Ground",
  "estimated_delivery": "2024-11-22",
  "shipping_cost": 12.99,
  "items": [
    {
      "product_id": 123,
      "quantity": 1,
      "serial_numbers": ["SN123456"] // optional for trackable items
    }
  ]
}
```

---

## **Customer Management API**

### **👥 Customer Operations**

#### **Customer Data Sync**
```php
GET /api/tenant/customers?updated_since=2024-11-01&include=orders,preferences
Authorization: Bearer {your-api-token}

Response:
{
  "data": [
    {
      "id": 234,
      "name": "John Smith",
      "email": "john@email.com", 
      "phone": "+1-555-0123",
      "status": "active",
      "customer_since": "2024-08-15T00:00:00Z",
      "total_orders": 3,
      "total_spent": 847.97,
      "last_order_date": "2024-11-10T00:00:00Z",
      "preferences": {
        "email_marketing": true,
        "sms_notifications": false,
        "preferred_language": "en",
        "favorite_categories": ["Electronics", "Accessories"]
      },
      "addresses": [
        {
          "type": "shipping",
          "is_default": true,
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "postal_code": "10001",
          "country": "US"
        }
      ]
    }
  ]
}
```

#### **Customer Segmentation**
```php
POST /api/tenant/customers/segments
Authorization: Bearer {your-api-token}

{
  "name": "VIP Customers",
  "description": "High-value customers with multiple orders",
  "criteria": {
    "total_spent": {"operator": ">=", "value": 500},
    "order_count": {"operator": ">=", "value": 3},
    "last_order_days": {"operator": "<=", "value": 90}
  },
  "marketing_permissions": {
    "email_campaigns": true,
    "exclusive_offers": true,
    "early_access": true
  }
}
```

---

## **Analytics & Reporting API**

### **📊 Business Intelligence**

#### **Sales Analytics**
```php
GET /api/tenant/analytics/sales?period=30d&group_by=day
Authorization: Bearer {your-api-token}

Response:
{
  "period": "30d",
  "summary": {
    "total_revenue": 12850.00,
    "total_orders": 78,
    "average_order_value": 164.74,
    "growth_rate": 15.2
  },
  "daily_data": [
    {
      "date": "2024-11-18",
      "revenue": 486.75,
      "orders": 3,
      "customers": 2
    },
    {
      "date": "2024-11-17", 
      "revenue": 1247.50,
      "orders": 8,
      "customers": 6
    }
  ]
}
```

#### **Product Performance**
```php
GET /api/tenant/analytics/products/top-selling?limit=10&period=30d
Authorization: Bearer {your-api-token}

Response:
{
  "data": [
    {
      "product_id": 123,
      "product_name": "Premium Wireless Headphones",
      "sku": "PWH-2024-001",
      "units_sold": 25,
      "revenue": 6247.75,
      "average_price": 249.91,
      "margin_percentage": 32.5
    },
    {
      "product_id": 124,
      "product_name": "Smartphone Charging Cable",
      "sku": "SCC-2024-001",
      "units_sold": 45,
      "revenue": 1347.75,
      "average_price": 29.95,
      "margin_percentage": 58.2
    }
  ]
}
```

---

## **Webhook Integration**

### **🔔 Event-Driven Integration**

#### **Available Webhook Events**
```json
{
  "order_events": [
    "order.created",
    "order.updated", 
    "order.paid",
    "order.shipped",
    "order.delivered",
    "order.cancelled",
    "order.refunded"
  ],
  "product_events": [
    "product.created",
    "product.updated",
    "product.deleted",
    "inventory.low_stock",
    "inventory.out_of_stock"
  ],
  "customer_events": [
    "customer.created",
    "customer.updated",
    "customer.deleted"
  ]
}
```

#### **Webhook Configuration**
```php
POST /api/tenant/webhooks
Authorization: Bearer {your-api-token}

{
  "url": "https://your-system.com/webhooks/canvastencil",
  "events": [
    "order.created",
    "order.paid",
    "inventory.low_stock"
  ],
  "secret": "your-webhook-secret-key",
  "active": true,
  "description": "Integration with internal ERP system"
}
```

#### **Webhook Payload Example**
```php
// POST to your webhook URL
{
  "event": "order.created",
  "data": {
    "order": {
      "id": 1001,
      "order_number": "ORD-2024-001001",
      "status": "pending",
      "total": 299.99,
      "customer": {
        "id": 234,
        "email": "john@email.com"
      },
      "items": [...],
      "created_at": "2024-11-18T09:15:00Z"
    }
  },
  "tenant": {
    "id": 15,
    "slug": "your-business-slug"
  },
  "webhook_id": "webhook_abc123",
  "timestamp": "2024-11-18T09:15:05Z"
}
```

---

## **Third-Party Integrations**

### **🔗 Popular Integration Partners**

#### **Accounting Software**
```php
// QuickBooks Online integration example
POST /api/tenant/integrations/quickbooks/sync-orders
Authorization: Bearer {your-api-token}

{
  "date_range": {
    "start": "2024-11-01",
    "end": "2024-11-18"
  },
  "sync_type": "incremental", // full, incremental
  "include_refunds": true,
  "quickbooks_company_id": "123456789"
}
```

#### **Email Marketing Platforms**
```php
// Mailchimp integration
POST /api/tenant/integrations/mailchimp/sync-customers
Authorization: Bearer {your-api-token}

{
  "list_id": "abc123def456",
  "segment_criteria": {
    "customer_status": "active",
    "email_marketing": true,
    "last_order_days": 90
  },
  "merge_fields": [
    "total_spent",
    "last_order_date", 
    "favorite_categories"
  ]
}
```

#### **Inventory Management**
```php
// Integration with external inventory system
POST /api/tenant/integrations/inventory/sync
Authorization: Bearer {your-api-token}

{
  "direction": "bidirectional", // import, export, bidirectional
  "products": "all", // all, changed_only, specific_skus
  "include_pricing": true,
  "include_categories": true,
  "external_system": {
    "type": "cin7",
    "api_endpoint": "https://api.cin7.com/",
    "credentials_id": "stored_credential_123"
  }
}
```

---

## **Custom Development & Extensions**

### **🛠️ Development Framework**

#### **Custom Themes**
```php
// Custom theme structure
/themes/your-custom-theme/
├── templates/
│   ├── product/
│   │   ├── index.blade.php
│   │   ├── show.blade.php
│   │   └── category.blade.php
│   ├── checkout/
│   │   ├── cart.blade.php
│   │   └── payment.blade.php
│   └── layouts/
│       ├── app.blade.php
│       └── admin.blade.php
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── theme.json
```

#### **Custom Plugins**
```php
// Plugin development example
<?php
namespace YourBusiness\Plugins\CustomShipping;

class CustomShippingPlugin extends TenantPlugin 
{
    public function boot()
    {
        $this->addShippingMethod('custom_local', [
            'name' => 'Local Delivery',
            'description' => 'Same-day local delivery service',
            'calculator' => LocalDeliveryCalculator::class
        ]);
    }

    public function calculateShipping($order, $address)
    {
        // Custom shipping calculation logic
        if ($this->isLocalAddress($address)) {
            return 15.00; // $15 flat rate for local delivery
        }
        return null; // Not available for this address
    }
}
```

### **📱 Mobile App Integration**

#### **Mobile API Optimization**
```php
GET /api/tenant/mobile/products?category=electronics&limit=20&include=images
Authorization: Bearer {your-api-token}

Response:
{
  "data": [
    {
      "id": 123,
      "name": "Premium Wireless Headphones",
      "price": 299.99,
      "sale_price": 249.99,
      "image": "https://cdn.yourstore.com/thumb/headphones-300x300.jpg",
      "rating": 4.8,
      "reviews_count": 45,
      "in_stock": true
    }
  ],
  "meta": {
    "cache_key": "products_electronics_20241118_1430",
    "cache_expires": "2024-11-18T15:30:00Z"
  }
}
```

---

## **Security & Best Practices**

### **🔒 API Security**

#### **Authentication Best Practices**
- **Token Rotation**: Regularly rotate API tokens (every 90 days recommended)
- **Scope Limitation**: Use specific permissions for API tokens (read-only, write-only, admin)
- **IP Whitelisting**: Restrict API access to known IP addresses
- **HTTPS Only**: All API communications must use HTTPS encryption
- **Rate Limiting**: Implement client-side rate limiting to avoid hitting platform limits

#### **Data Protection**
```php
// Secure API configuration example
{
  "api_settings": {
    "token_expiry": 3600, // 1 hour
    "rate_limit_mode": "strict",
    "allowed_ips": [
      "203.0.113.10",
      "203.0.113.11"
    ],
    "permissions": [
      "products:read",
      "orders:write", 
      "customers:read"
    ],
    "webhook_verification": true,
    "data_encryption": "AES-256"
  }
}
```

### **⚡ Performance Optimization**

#### **API Best Practices**
- **Pagination**: Always use pagination for large datasets
- **Field Selection**: Use `include` and `exclude` parameters to optimize response size
- **Caching**: Implement client-side caching for frequently accessed data
- **Batch Operations**: Use bulk endpoints for multiple operations
- **Compression**: Enable gzip compression for API responses

---

*This technical integration guide provides comprehensive API documentation and integration examples for advanced tenant implementations. Contact support for additional integration assistance or custom development requirements.*