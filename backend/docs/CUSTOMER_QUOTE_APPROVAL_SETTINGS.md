# Customer Quote Approval Settings Configuration Guide

## Overview

The Customer Quote Approval Settings system provides a flexible, configurable approval mechanism for customer quote acceptances. This guide explains how to configure and use the approval settings to control which quotes require manual approval versus automatic approval.

## Table of Contents

1. [Approval Workflow Overview](#approval-workflow-overview)
2. [Configuration Options](#configuration-options)
3. [Auto-Approval Logic](#auto-approval-logic)
4. [Trust Score Calculation](#trust-score-calculation)
5. [Configuration Examples](#configuration-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Approval Workflow Overview

When a customer accepts a quote, the system evaluates whether to:
- **Auto-approve**: Immediately proceed to payment (low-risk orders)
- **Manual approval**: Require admin review before proceeding (high-risk orders)

The decision is based on configurable rules that assess:
- Order value
- Customer trust level
- Product types
- Order history

## Configuration Options

### Access Configuration

**Admin Panel**: Navigate to `/admin/settings/quote-approval`

**API Endpoint**: 
```
GET  /api/v1/tenant/{tenant}/approval-settings
PUT  /api/v1/tenant/{tenant}/approval-settings
```

### Configuration Fields

#### 1. Auto-Approval Master Switch

```json
{
  "auto_approval_enabled": true
}
```

- **Type**: Boolean
- **Default**: `false`
- **Description**: Master switch to enable/disable the entire auto-approval system
- **Impact**: When `false`, all quote acceptances require manual approval

#### 2. Auto-Approval Threshold

```json
{
  "auto_approval_threshold": 5000000
}
```

- **Type**: Integer (cents)
- **Default**: `5000000` (Rp 50,000)
- **Description**: Maximum order value for auto-approval
- **Example**: `5000000` = Rp 50,000 (50 million rupiah)
- **Impact**: Orders above this value always require manual approval

#### 3. Customer Trust Requirements

##### Email Verification

```json
{
  "require_email_verification": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Require customer email to be verified
- **Impact**: Unverified customers require manual approval

##### Minimum Successful Orders

```json
{
  "min_successful_orders": 1
}
```

- **Type**: Integer
- **Default**: `1`
- **Description**: Minimum number of successfully completed orders
- **Impact**: New customers with fewer orders require manual approval

##### Minimum Payment Success Rate

```json
{
  "min_payment_success_rate": 90.0
}
```

- **Type**: Float (0-100)
- **Default**: `90.0`
- **Description**: Minimum payment success rate percentage
- **Impact**: Customers with lower success rates require manual approval

#### 4. Product Type Rules

##### Auto-Approve Standard Products

```json
{
  "auto_approve_standard_products": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Allow auto-approval for standard catalog products
- **Impact**: Standard products can be auto-approved if other conditions met

##### Require Approval for Custom Products

```json
{
  "require_approval_custom_products": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Always require manual approval for custom products
- **Impact**: Orders with custom products always need admin review

#### 5. Negotiation Settings

##### Maximum Negotiation Rounds

```json
{
  "max_negotiation_rounds": 3
}
```

- **Type**: Integer (1-10)
- **Default**: `3`
- **Description**: Maximum number of counter-offer rounds allowed
- **Impact**: After max rounds, customer can only accept or reject

##### Allow Customer Counter Offers

```json
{
  "allow_customer_counter_offer": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable/disable customer counter-offer functionality
- **Impact**: When `false`, customers can only accept or reject quotes

#### 6. Notification Preferences

##### Notify on Auto-Approve

```json
{
  "notify_admin_on_auto_approve": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Send notification when quote is auto-approved
- **Impact**: Admin receives email notification for auto-approved quotes

##### Notify on Pending Approval

```json
{
  "notify_admin_on_pending_approval": true
}
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Send notification when quote requires manual approval
- **Impact**: Admin receives high-priority notification for pending approvals

## Auto-Approval Logic

### Decision Flow

```
Customer Accepts Quote
    ↓
Is auto_approval_enabled?
    ├─ No → Manual Approval
    └─ Yes → Continue
        ↓
Is order_value < auto_approval_threshold?
    ├─ No → Manual Approval (High Value)
    └─ Yes → Continue
        ↓
Is customer email verified? (if required)
    ├─ No → Manual Approval (Unverified)
    └─ Yes → Continue
        ↓
Does customer have min_successful_orders?
    ├─ No → Manual Approval (New Customer)
    └─ Yes → Continue
        ↓
Is payment_success_rate >= min_required?
    ├─ No → Manual Approval (Low Success Rate)
    └─ Yes → Continue
        ↓
Does order have custom products?
    ├─ Yes (and require_approval_custom_products) → Manual Approval
    └─ No → Continue
        ↓
    AUTO-APPROVE ✓
```

### Approval Reasons

When manual approval is required, the system provides specific reasons:

- `"Auto-approval disabled"`
- `"Order value (Rp X) exceeds threshold (Rp Y)"`
- `"Customer email not verified"`
- `"Customer has only X successful orders (min: Y)"`
- `"Customer payment success rate X% below minimum Y%"`
- `"Order contains custom products"`

## Trust Score Calculation

The system calculates a customer trust score (0-100) based on:

### Components

1. **Email Verification** (20 points)
   - Verified: +20 points
   - Not verified: 0 points

2. **Order History** (40 points max)
   - +5 points per successful order
   - Maximum: 40 points (8+ orders)

3. **Payment Success Rate** (40 points max)
   - Proportional to success rate
   - 100% success = 40 points
   - 50% success = 20 points

### Example Calculations

**New Customer (Unverified)**
```
Email: Not verified = 0
Orders: 0 = 0
Payment: N/A = 0
Total: 0/100
```

**Established Customer**
```
Email: Verified = 20
Orders: 5 successful = 25
Payment: 95% success = 38
Total: 83/100
```

**VIP Customer**
```
Email: Verified = 20
Orders: 10+ successful = 40
Payment: 100% success = 40
Total: 100/100
```

## Configuration Examples

### Conservative (High Security)

Suitable for high-value products or new businesses:

```json
{
  "auto_approval_enabled": true,
  "auto_approval_threshold": 2000000,
  "require_email_verification": true,
  "min_successful_orders": 3,
  "min_payment_success_rate": 95.0,
  "auto_approve_standard_products": true,
  "require_approval_custom_products": true,
  "max_negotiation_rounds": 2,
  "allow_customer_counter_offer": true,
  "notify_admin_on_auto_approve": true,
  "notify_admin_on_pending_approval": true
}
```

**Impact**: Only trusted customers with proven track record get auto-approval

### Balanced (Recommended)

Default configuration for most businesses:

```json
{
  "auto_approval_enabled": true,
  "auto_approval_threshold": 5000000,
  "require_email_verification": true,
  "min_successful_orders": 1,
  "min_payment_success_rate": 90.0,
  "auto_approve_standard_products": true,
  "require_approval_custom_products": true,
  "max_negotiation_rounds": 3,
  "allow_customer_counter_offer": true,
  "notify_admin_on_auto_approve": true,
  "notify_admin_on_pending_approval": true
}
```

**Impact**: Reasonable balance between automation and control

### Aggressive (High Automation)

Suitable for established businesses with low-risk products:

```json
{
  "auto_approval_enabled": true,
  "auto_approval_threshold": 10000000,
  "require_email_verification": false,
  "min_successful_orders": 0,
  "min_payment_success_rate": 80.0,
  "auto_approve_standard_products": true,
  "require_approval_custom_products": false,
  "max_negotiation_rounds": 5,
  "allow_customer_counter_offer": true,
  "notify_admin_on_auto_approve": false,
  "notify_admin_on_pending_approval": true
}
```

**Impact**: Maximum automation, minimal manual intervention

### Manual Only (No Auto-Approval)

For businesses requiring full control:

```json
{
  "auto_approval_enabled": false,
  "auto_approval_threshold": 0,
  "require_email_verification": true,
  "min_successful_orders": 0,
  "min_payment_success_rate": 0.0,
  "auto_approve_standard_products": false,
  "require_approval_custom_products": true,
  "max_negotiation_rounds": 3,
  "allow_customer_counter_offer": true,
  "notify_admin_on_auto_approve": false,
  "notify_admin_on_pending_approval": true
}
```

**Impact**: All quote acceptances require manual admin approval

## Best Practices

### 1. Start Conservative

- Begin with stricter settings
- Monitor approval patterns
- Gradually relax rules based on data

### 2. Monitor Metrics

Track these key metrics:
- Auto-approval rate
- Manual approval rate
- Average approval time
- Rejection rate by reason

### 3. Adjust Based on Business

**High-Value Products**:
- Lower threshold
- Higher trust requirements
- More negotiation rounds

**Low-Value Products**:
- Higher threshold
- Lower trust requirements
- Fewer negotiation rounds

### 4. Customer Segmentation

Consider different settings for:
- B2B vs B2C customers
- Wholesale vs retail
- Domestic vs international

### 5. Seasonal Adjustments

- Tighten during peak seasons
- Relax during slow periods
- Adjust for promotional campaigns

## Troubleshooting

### Issue: All Quotes Require Manual Approval

**Possible Causes**:
1. `auto_approval_enabled` is `false`
2. Threshold too low
3. Trust requirements too strict

**Solution**:
```bash
# Check current settings
GET /api/v1/tenant/{tenant}/approval-settings

# Verify auto_approval_enabled is true
# Increase threshold if needed
# Lower trust requirements gradually
```

### Issue: Too Many Auto-Approvals

**Possible Causes**:
1. Threshold too high
2. Trust requirements too lenient
3. Custom products not requiring approval

**Solution**:
- Lower `auto_approval_threshold`
- Increase `min_successful_orders`
- Increase `min_payment_success_rate`
- Enable `require_approval_custom_products`

### Issue: Customers Can't Counter Offer

**Possible Causes**:
1. `allow_customer_counter_offer` is `false`
2. Max rounds reached

**Solution**:
```json
{
  "allow_customer_counter_offer": true,
  "max_negotiation_rounds": 3
}
```

### Issue: Not Receiving Notifications

**Possible Causes**:
1. Notification settings disabled
2. Email configuration issues

**Solution**:
```json
{
  "notify_admin_on_auto_approve": true,
  "notify_admin_on_pending_approval": true
}
```

Check email configuration in `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

## API Usage Examples

### Get Current Settings

```bash
curl -X GET \
  'https://api.example.com/api/v1/tenant/1/approval-settings' \
  -H 'Authorization: Bearer {token}' \
  -H 'Accept: application/json'
```

### Update Settings

```bash
curl -X PUT \
  'https://api.example.com/api/v1/tenant/1/approval-settings' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "auto_approval_enabled": true,
    "auto_approval_threshold": 5000000,
    "require_email_verification": true,
    "min_successful_orders": 1,
    "min_payment_success_rate": 90.0,
    "auto_approve_standard_products": true,
    "require_approval_custom_products": true,
    "max_negotiation_rounds": 3,
    "allow_customer_counter_offer": true,
    "notify_admin_on_auto_approve": true,
    "notify_admin_on_pending_approval": true
  }'
```

## Database Schema

Settings are stored in the `customer_quote_approval_settings` table:

```sql
CREATE TABLE customer_quote_approval_settings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL UNIQUE,
    auto_approval_enabled BOOLEAN DEFAULT false,
    auto_approval_threshold BIGINT DEFAULT 5000000,
    require_email_verification BOOLEAN DEFAULT true,
    min_successful_orders INT DEFAULT 1,
    min_payment_success_rate DECIMAL(5,2) DEFAULT 90.00,
    auto_approve_standard_products BOOLEAN DEFAULT true,
    require_approval_custom_products BOOLEAN DEFAULT true,
    max_negotiation_rounds INT DEFAULT 3,
    allow_customer_counter_offer BOOLEAN DEFAULT true,
    notify_admin_on_auto_approve BOOLEAN DEFAULT true,
    notify_admin_on_pending_approval BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

## Related Documentation

- [Customer Quote Workflow](./CUSTOMER_QUOTE_WORKFLOW.md)
- [Customer Quote Security](./CUSTOMER_QUOTE_SECURITY.md)
- [Customer Quote Monitoring](./CUSTOMER_QUOTE_MONITORING.md)
- [Customer Quote Alerting](./CUSTOMER_QUOTE_ALERTING.md)

## Support

For additional support or questions:
- Check the [FAQ](./FAQ.md)
- Contact: support@example.com
- Documentation: https://docs.example.com
