# Customer Quote Alerting System

## Overview

The Customer Quote Alerting System monitors critical metrics and sends automated alerts to administrators when thresholds are exceeded. This ensures timely response to issues that could impact business operations.

## Features

### Alert Types

1. **High Rejection Rate** - Critical alert when quote rejection rate exceeds threshold
2. **Low Acceptance Rate** - Warning when quote acceptance rate falls below threshold
3. **High Expiry Rate** - Warning when too many quotes expire without response
4. **PDF Generation Errors** - Critical alert for document generation failures
5. **Email Delivery Errors** - Critical alert for email delivery failures
6. **Overdue Approvals** - Warning when quotes pending approval exceed SLA

### Alert Channels

- **Email** - Sent to tenant admins via Laravel notifications
- **Slack** - Sent to configured Slack webhook (optional)
- **Database** - Stored in notifications table for in-app display
- **Logs** - All alerts logged to `customer-quote.log`

### Alert Cooldown

To prevent alert fatigue, each alert type has a 1-hour cooldown period. Once an alert is sent, the same alert type won't be sent again for the same tenant within 1 hour.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Alert System
QUOTE_ALERTS_ENABLED=true
QUOTE_ALERT_MONITORING_PERIOD=7  # days to monitor for metrics
QUOTE_ALERT_ERROR_PERIOD=1       # days to monitor for errors

# Alert Thresholds
QUOTE_ALERT_REJECTION_RATE=20    # % - Alert if rejection rate exceeds this
QUOTE_ALERT_ACCEPTANCE_RATE=50   # % - Alert if acceptance rate below this
QUOTE_ALERT_EXPIRY_RATE=15       # % - Alert if expiry rate exceeds this
QUOTE_ALERT_PDF_ERRORS=5         # count - Alert if PDF errors exceed this
QUOTE_ALERT_EMAIL_ERRORS=5       # count - Alert if email errors exceed this
QUOTE_ALERT_APPROVAL_SLA=24      # hours - Alert if approvals overdue

# Slack Integration (Optional)
LOG_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Default Values

If not configured, the system uses these defaults:

- **Monitoring Period**: 7 days
- **Error Period**: 1 day
- **Rejection Rate Threshold**: 20%
- **Acceptance Rate Threshold**: 50%
- **Expiry Rate Threshold**: 15%
- **PDF Error Threshold**: 5 errors
- **Email Error Threshold**: 5 errors
- **Approval SLA**: 24 hours

## Scheduled Monitoring

The alerting system runs automatically via Laravel scheduler:

### Schedule Configuration

```php
// In app/Console/Kernel.php
$schedule->command('quotes:check-metrics')
    ->everyFourHours()
    ->name('check-quote-metrics')
    ->withoutOverlapping()
    ->runInBackground();
```

### Manual Execution

You can manually trigger the metrics check:

```bash
# Check all tenants
php artisan quotes:check-metrics

# Check specific tenant
php artisan quotes:check-metrics --tenant=1
```

## API Endpoints

### Trigger Manual Alert Check

```http
POST /api/v1/tenant/customer-quotes/metrics/trigger-alert-check
Authorization: Bearer {token}
```

**Response:**
```json
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

## Alert Notification Format

### Email Notification

**Subject:** `[CRITICAL] High Quote Rejection Rate`

**Body:**
```
Alert: High Quote Rejection Rate

Quote rejection rate is 25% (threshold: 20%)

Details:
- Rejection Rate: 25
- Threshold: 20
- Period Days: 7

[View Dashboard Button]

This requires immediate attention.
```

### Slack Notification

```
🚨 **High Quote Rejection Rate**
Quote rejection rate is 25% (threshold: 20%)

rejection_rate: 25
threshold: 20
period_days: 7
```

### Database Notification

Stored in `notifications` table:

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

## Alert Recipients

### Tenant Alerts

For tenant-specific alerts (rejection rate, acceptance rate, etc.):
- Sent to all users with `admin` role in the tenant
- Filtered by `tenant_id`

### Platform Alerts

For platform-wide alerts (PDF errors, email errors):
- Sent to all platform administrators
- Filtered by `account_type = 'platform'`

## Monitoring & Troubleshooting

### View Alert Logs

```bash
# View all customer quote logs
tail -f storage/logs/customer-quote.log

# Search for alerts
grep "Alert:" storage/logs/customer-quote.log

# Search for specific alert type
grep "high_rejection_rate" storage/logs/customer-quote.log
```

### Check Scheduled Jobs

```bash
# List all scheduled jobs
php artisan schedule:list

# Run scheduler manually (for testing)
php artisan schedule:run
```

### Test Alert System

```bash
# 1. Trigger manual check
php artisan quotes:check-metrics --tenant=1

# 2. Check logs for alerts
tail -f storage/logs/customer-quote.log

# 3. Check notifications table
php artisan tinker
>>> \App\Infrastructure\Persistence\Eloquent\Models\User::find(1)->notifications;
```

### Clear Alert Cooldown (Testing)

```php
use App\Application\CustomerQuote\Services\CustomerQuoteAlertingService;

$alertingService = app(CustomerQuoteAlertingService::class);
$alertingService->clearAlertCooldown('high_rejection_rate', 1);
```

## Customization

### Adjust Thresholds

Modify thresholds in `.env` based on your business needs:

```bash
# More sensitive (alert sooner)
QUOTE_ALERT_REJECTION_RATE=15
QUOTE_ALERT_ACCEPTANCE_RATE=60

# Less sensitive (alert later)
QUOTE_ALERT_REJECTION_RATE=30
QUOTE_ALERT_ACCEPTANCE_RATE=40
```

### Change Monitoring Frequency

Modify schedule in `app/Console/Kernel.php`:

```php
// Check every hour
$schedule->command('quotes:check-metrics')->hourly();

// Check twice daily
$schedule->command('quotes:check-metrics')->twiceDaily(9, 17);

// Check daily at specific time
$schedule->command('quotes:check-metrics')->dailyAt('09:00');
```

### Add Custom Alert Types

1. Add new check method in `CustomerQuoteAlertingService`:

```php
private function checkCustomMetric(int $tenantId, array $config): void
{
    $threshold = $config['thresholds']['custom_metric'];
    $value = $this->monitoringService->getCustomMetric($tenantId);
    
    if ($value > $threshold) {
        $this->sendAlert(
            $tenantId,
            'custom_metric',
            'Custom Metric Alert',
            "Custom metric is {$value} (threshold: {$threshold})",
            'warning',
            ['value' => $value, 'threshold' => $threshold]
        );
    }
}
```

2. Call it in `checkCriticalMetrics()`:

```php
public function checkCriticalMetrics(int $tenantId): void
{
    // ... existing checks
    $this->checkCustomMetric($tenantId, $config);
}
```

3. Add threshold to configuration:

```php
'thresholds' => [
    // ... existing thresholds
    'custom_metric' => env('QUOTE_ALERT_CUSTOM_METRIC', 100),
],
```

## Best Practices

1. **Set Realistic Thresholds**: Base thresholds on historical data
2. **Monitor Alert Frequency**: Adjust if receiving too many/few alerts
3. **Review Regularly**: Check alert logs weekly
4. **Test Before Production**: Test alert system in staging
5. **Document Changes**: Document any threshold adjustments
6. **Respond Promptly**: Act on critical alerts within SLA

## Integration with Monitoring

The alerting system works alongside the monitoring system:

- **Monitoring**: Tracks all metrics continuously
- **Alerting**: Sends notifications when thresholds exceeded
- **Logging**: Records all activities for audit trail

See [Customer Quote Monitoring](./CUSTOMER_QUOTE_MONITORING.md) for monitoring details.

## Security Considerations

1. **Webhook Security**: Keep Slack webhook URL secret
2. **Email Security**: Use authenticated SMTP
3. **Access Control**: Only admins can trigger manual checks
4. **Data Privacy**: Alerts don't include sensitive customer data
5. **Rate Limiting**: Cooldown prevents alert spam

## Performance Impact

- **Minimal**: Checks run in background
- **Cached**: Metrics cached for 5 minutes
- **Async**: Notifications queued
- **Non-blocking**: Doesn't impact user requests

## Related Documentation

- [Customer Quote Monitoring](./CUSTOMER_QUOTE_MONITORING.md)
- [Customer Quote Security](./CUSTOMER_QUOTE_SECURITY.md)
- [Queue Configuration](./QUEUE_CONFIGURATION.md)

## Support

For issues or questions:
1. Check logs: `storage/logs/customer-quote.log`
2. Review configuration: `.env` file
3. Test manually: `php artisan quotes:check-metrics`
4. Contact development team if issues persist
