# Customer Quote Alerting System - Implementation Summary

## Overview

Comprehensive alerting system implemented for the Customer Quote & Approval Workflow. This system monitors critical metrics and automatically sends alerts to administrators when thresholds are exceeded, ensuring timely response to issues that could impact business operations.

## Implementation Date

February 19, 2026

## Components Implemented

### 1. Core Alerting Service

**File**: `backend/app/Application/CustomerQuote/Services/CustomerQuoteAlertingService.php`

**Features**:
- Automated metric monitoring
- Configurable alert thresholds
- Multi-channel alert delivery (Email, Slack, Database, Logs)
- Alert cooldown mechanism (1 hour) to prevent alert fatigue
- Manual alert triggering for testing
- Tenant-scoped and platform-wide alerts

**Key Methods**:
- `checkCriticalMetrics()` - Check all metrics and send alerts if needed
- `checkHighRejectionRate()` - Monitor quote rejection rate
- `checkLowAcceptanceRate()` - Monitor quote acceptance rate
- `checkHighExpiryRate()` - Monitor quote expiry rate
- `checkPDFGenerationErrors()` - Monitor PDF generation failures
- `checkEmailDeliveryErrors()` - Monitor email delivery failures
- `checkOverdueApprovals()` - Monitor SLA breaches
- `triggerManualCheck()` - Manually trigger alert check (for testing)
- `clearAlertCooldown()` - Clear cooldown (for testing)

### 2. Notification Class

**File**: `backend/app/Notifications/CustomerQuote/CriticalMetricAlert.php`

**Features**:
- Queued notification for async delivery
- Multi-channel support (mail, database)
- Severity-based formatting (critical, warning, info)
- Rich email templates with action buttons
- Structured database storage for in-app notifications

**Channels**:
- **Email**: Professional formatted emails with severity indicators
- **Database**: Stored in notifications table for in-app display

### 3. Scheduled Command

**File**: `backend/app/Console/Commands/CheckQuoteMetricsCommand.php`

**Features**:
- Runs every 4 hours via Laravel scheduler
- Checks all tenants or specific tenant
- Comprehensive error handling and logging
- Background execution

**Usage**:
```bash
# Check all tenants
php artisan quotes:check-metrics

# Check specific tenant
php artisan quotes:check-metrics --tenant=1
```

### 4. Scheduler Integration

**File**: `backend/app/Console/Kernel.php`

**Schedule**:
```php
$schedule->command('quotes:check-metrics')
    ->everyFourHours()
    ->name('check-quote-metrics')
    ->withoutOverlapping()
    ->runInBackground();
```

### 5. Service Provider Registration

**File**: `backend/app/Providers/CustomerQuoteServiceProvider.php`

**Registered**:
- `CustomerQuoteAlertingService` as singleton
- Integrated with existing monitoring service

### 6. API Endpoint

**File**: `backend/app/Http/Controllers/Admin/CustomerQuoteMetricsController.php`

**Endpoint**:
```http
POST /api/v1/tenant/customer-quotes/metrics/trigger-alert-check
```

**Purpose**: Manual alert check for testing and troubleshooting

### 7. Routes

**File**: `backend/routes/tenant.php`

**Added**:
- Manual alert trigger endpoint under metrics routes

### 8. Configuration

**File**: `backend/.env.example`

**Environment Variables**:
```bash
# Alert System
QUOTE_ALERTS_ENABLED=true
QUOTE_ALERT_MONITORING_PERIOD=7
QUOTE_ALERT_ERROR_PERIOD=1

# Alert Thresholds
QUOTE_ALERT_REJECTION_RATE=20
QUOTE_ALERT_ACCEPTANCE_RATE=50
QUOTE_ALERT_EXPIRY_RATE=15
QUOTE_ALERT_PDF_ERRORS=5
QUOTE_ALERT_EMAIL_ERRORS=5
QUOTE_ALERT_APPROVAL_SLA=24

# Slack Integration (Optional)
LOG_SLACK_WEBHOOK_URL=
```

### 9. Documentation

**Files Created**:
- `backend/docs/CUSTOMER_QUOTE_ALERTING.md` - Complete alerting guide
- `backend/docs/ALERTING_IMPLEMENTATION_SUMMARY.md` - This file

### 10. Tests

**File**: `backend/tests/Unit/CustomerQuote/AlertingServiceTest.php`

**Test Coverage**:
- ✅ Alert cooldown mechanism
- ✅ Notification channel configuration
- ✅ Email content formatting
- ✅ Database notification structure
- ✅ Severity label formatting

**Test Results**: 6 tests passing, 15 assertions

## Alert Types

### 1. High Rejection Rate (Critical)
- **Threshold**: 20% (configurable)
- **Monitoring Period**: 7 days (configurable)
- **Recipients**: Tenant admins
- **Action**: Review pricing strategy and quote terms

### 2. Low Acceptance Rate (Warning)
- **Threshold**: 50% (configurable)
- **Monitoring Period**: 7 days (configurable)
- **Recipients**: Tenant admins
- **Action**: Analyze rejection reasons and adjust approach

### 3. High Expiry Rate (Warning)
- **Threshold**: 15% (configurable)
- **Monitoring Period**: 7 days (configurable)
- **Recipients**: Tenant admins
- **Action**: Review quote validity periods and follow-up process

### 4. PDF Generation Errors (Critical)
- **Threshold**: 5 errors (configurable)
- **Monitoring Period**: 1 day (configurable)
- **Recipients**: Platform admins
- **Action**: Check PDF service, disk space, and logs

### 5. Email Delivery Errors (Critical)
- **Threshold**: 5 errors (configurable)
- **Monitoring Period**: 1 day (configurable)
- **Recipients**: Platform admins
- **Action**: Check email service configuration and connectivity

### 6. Overdue Approvals (Warning)
- **Threshold**: 24 hours (configurable)
- **Monitoring Period**: Real-time
- **Recipients**: Tenant admins
- **Action**: Review and approve/reject pending quotes

## Alert Channels

### Email Notifications

**Format**:
```
Subject: [CRITICAL] High Quote Rejection Rate

Alert: High Quote Rejection Rate

Quote rejection rate is 25% (threshold: 20%)

Details:
- Rejection Rate: 25
- Threshold: 20
- Period Days: 7

[View Dashboard Button]

This requires immediate attention.
```

### Slack Notifications

**Format**:
```
🚨 **High Quote Rejection Rate**
Quote rejection rate is 25% (threshold: 20%)

rejection_rate: 25
threshold: 20
period_days: 7
```

### Database Notifications

**Stored in**: `notifications` table

**Structure**:
```json
{
  "title": "High Quote Rejection Rate",
  "message": "Quote rejection rate is 25% (threshold: 20%)",
  "severity": "critical",
  "data": {
    "rejection_rate": 25,
    "threshold": 20,
    "period_days": 7
  },
  "timestamp": "2026-02-19T10:30:00Z"
}
```

### Log Notifications

**Log File**: `storage/logs/customer-quote.log`

**Format**:
```json
{
  "timestamp": "2026-02-19T10:30:00Z",
  "level": "warning",
  "message": "Alert: High Quote Rejection Rate",
  "context": {
    "alert_type": "high_rejection_rate",
    "severity": "critical",
    "message": "Quote rejection rate is 25% (threshold: 20%)",
    "tenant_id": 1,
    "data": {
      "rejection_rate": 25,
      "threshold": 20,
      "period_days": 7
    }
  }
}
```

## Alert Cooldown Mechanism

To prevent alert fatigue, each alert type has a 1-hour cooldown period:

- Once an alert is sent, the same alert type won't be sent again for the same tenant within 1 hour
- Cooldown is tracked using Laravel cache
- Cooldown can be manually cleared for testing
- Different alert types have independent cooldowns

## Configuration

### Default Thresholds

```php
[
    'enabled' => true,
    'monitoring_period_days' => 7,
    'error_monitoring_period_days' => 1,
    'thresholds' => [
        'high_rejection_rate' => 20,      // %
        'low_acceptance_rate' => 50,      // %
        'high_expiry_rate' => 15,         // %
        'pdf_generation_errors' => 5,     // count
        'email_delivery_errors' => 5,     // count
        'approval_sla_hours' => 24,       // hours
    ],
]
```

### Customization

Thresholds can be adjusted via environment variables to match business needs:

```bash
# More sensitive (alert sooner)
QUOTE_ALERT_REJECTION_RATE=15
QUOTE_ALERT_ACCEPTANCE_RATE=60

# Less sensitive (alert later)
QUOTE_ALERT_REJECTION_RATE=30
QUOTE_ALERT_ACCEPTANCE_RATE=40
```

## Integration with Monitoring

The alerting system works alongside the monitoring system:

- **Monitoring Service**: Tracks all metrics continuously
- **Alerting Service**: Sends notifications when thresholds exceeded
- **Logging**: Records all activities for audit trail
- **Caching**: Metrics cached for 5 minutes to improve performance

## Testing

### Unit Tests

**File**: `backend/tests/Unit/CustomerQuote/AlertingServiceTest.php`

**Coverage**:
- Alert cooldown mechanism
- Notification channels
- Email formatting
- Database structure
- Severity labels

**Results**: ✅ 6 tests passing, 15 assertions

### Manual Testing

```bash
# 1. Trigger manual check
php artisan quotes:check-metrics --tenant=1

# 2. Check logs for alerts
tail -f storage/logs/customer-quote.log

# 3. Check notifications table
php artisan tinker
>>> \App\Infrastructure\Persistence\Eloquent\Models\User::find(1)->notifications;

# 4. Clear cooldown for testing
php artisan tinker
>>> app(\App\Application\CustomerQuote\Services\CustomerQuoteAlertingService::class)
    ->clearAlertCooldown('high_rejection_rate', 1);
```

### API Testing

```bash
# Trigger manual alert check via API
curl -X POST "http://localhost:8000/api/v1/tenant/customer-quotes/metrics/trigger-alert-check" \
  -H "Authorization: Bearer {token}"
```

## Deployment Checklist

- [x] Alerting service implemented
- [x] Notification class created
- [x] Scheduled command created
- [x] Scheduler configured
- [x] Service provider updated
- [x] API endpoint added
- [x] Routes registered
- [x] Environment variables documented
- [x] Documentation written
- [x] Tests passing
- [ ] Configure Slack webhook (optional)
- [ ] Deploy to staging
- [ ] Verify scheduled job execution
- [ ] Test alert delivery
- [ ] Monitor alert frequency
- [ ] Adjust thresholds if needed
- [ ] Deploy to production

## Usage Examples

### Check Metrics Manually

```bash
# Check all tenants
php artisan quotes:check-metrics

# Check specific tenant
php artisan quotes:check-metrics --tenant=1
```

### Trigger Alert via API

```php
POST /api/v1/tenant/customer-quotes/metrics/trigger-alert-check
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Alert check completed",
  "data": {
    "status": "completed",
    "tenant_id": 1,
    "checked_at": "2026-02-19T10:30:00Z"
  }
}
```

### View Alert Logs

```bash
# View all alerts
tail -f storage/logs/customer-quote.log

# Search for specific alert type
grep "high_rejection_rate" storage/logs/customer-quote.log

# Search for critical alerts
grep "critical" storage/logs/customer-quote.log
```

## Performance Impact

- **Minimal**: Checks run in background every 4 hours
- **Cached**: Metrics cached for 5 minutes
- **Async**: Notifications queued for async delivery
- **Non-blocking**: Doesn't impact user requests
- **Efficient**: Uses existing monitoring service

## Security Considerations

1. **Webhook Security**: Keep Slack webhook URL secret
2. **Email Security**: Use authenticated SMTP
3. **Access Control**: Only admins can trigger manual checks
4. **Data Privacy**: Alerts don't include sensitive customer data
5. **Rate Limiting**: Cooldown prevents alert spam

## Future Enhancements

### Additional Alert Types
- High negotiation round count
- Low profit margin warnings
- Customer trust score drops
- Seasonal trend anomalies

### Advanced Features
- SMS alerts for critical issues
- Dashboard notifications (real-time)
- Alert escalation (if not acknowledged)
- Custom alert rules per tenant
- Alert analytics and reporting

### Integration
- Integration with external monitoring tools (DataDog, New Relic)
- Webhook support for custom integrations
- Mobile push notifications
- Microsoft Teams integration

## Related Documentation

- [Customer Quote Monitoring](./CUSTOMER_QUOTE_MONITORING.md)
- [Customer Quote Alerting Guide](./CUSTOMER_QUOTE_ALERTING.md)
- [Customer Quote Security](./CUSTOMER_QUOTE_SECURITY.md)
- [Queue Configuration](./QUEUE_CONFIGURATION.md)

## Related Tasks

- ✅ Task 11.1 - Security (Completed)
- ✅ Task 11.2 - Performance Optimization (Completed)
- ✅ Task 11.3 - Monitoring (Completed)
- ✅ Task 11.3 - Set up alerts for critical failures (Completed - This Task)

## Conclusion

The alerting system is fully implemented and integrated into the customer quote workflow. It provides automated monitoring of critical metrics with multi-channel alert delivery, ensuring administrators are promptly notified of issues that require attention.

All tests pass and the system is ready for deployment. The alerting system complements the existing monitoring infrastructure and provides proactive issue detection to maintain high service quality.

**Status**: ✅ COMPLETE - Ready for deployment
