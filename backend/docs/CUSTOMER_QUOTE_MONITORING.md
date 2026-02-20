# Customer Quote Monitoring & Metrics

## Overview

The Customer Quote Monitoring system provides comprehensive tracking, logging, and metrics for the customer quote workflow. It enables administrators to monitor quote performance, identify bottlenecks, and track critical failures.

## Features

### 1. Action Logging

All quote actions are logged with full context:
- Quote creation
- Quote sending
- Customer acceptance/rejection
- Negotiation rounds
- Quote expiration
- Approval decisions

**Log Channel**: `customer_quote`
**Log File**: `storage/logs/customer-quote.log`
**Retention**: 30 days

### 2. Metrics Collection

#### Quote Performance Metrics
- **Acceptance Rate**: Percentage of quotes accepted by customers
- **Rejection Rate**: Percentage of quotes rejected by customers
- **Counter Offer Rate**: Percentage of quotes with negotiation
- **Average Negotiation Rounds**: Average number of negotiation rounds per quote
- **Average Time to Acceptance**: Average time from sending to acceptance
- **Expiry Rate**: Percentage of quotes that expire without response

#### Approval Metrics
- **Auto-Approval Rate**: Percentage of quotes auto-approved
- **Approval Reasons Breakdown**: Distribution of manual approval reasons
- **Rejection Reasons Breakdown**: Distribution of rejection reasons

#### Error Tracking
- **PDF Generation Errors**: Count of failed PDF generations
- **Email Delivery Errors**: Count of failed email deliveries

### 3. Scheduled Monitoring

**Expired Quotes Check**
- **Schedule**: Hourly
- **Command**: `quotes:check-expired`
- **Job**: `CheckExpiredQuotesJob`
- **Actions**:
  - Identifies quotes past their `valid_until` date
  - Marks them as expired
  - Logs expiration events
  - Updates metrics

## API Endpoints

### Metrics Dashboard

Get comprehensive metrics for a tenant:

```http
GET /api/v1/tenant/customer-quotes/metrics/dashboard?days=30
```

**Response**:
```json
{
  "success": true,
  "data": {
    "acceptance_rate": 75.5,
    "rejection_rate": 15.2,
    "counter_offer_rate": 35.8,
    "avg_negotiation_rounds": 1.8,
    "auto_approval_rate": 60.0,
    "avg_time_to_acceptance": 24.5,
    "expiry_rate": 9.3,
    "approval_reasons": {
      "Order value exceeds threshold": 15,
      "Customer email not verified": 8,
      "Order contains custom products": 5
    },
    "rejection_reasons": {
      "Price too high": 12,
      "Delivery time too long": 5,
      "Found alternative supplier": 3
    },
    "pdf_errors": 2,
    "email_errors": 1
  },
  "period": {
    "days": 30,
    "from": "2026-01-20",
    "to": "2026-02-19"
  }
}
```

### Individual Metrics

#### Acceptance Rate
```http
GET /api/v1/tenant/customer-quotes/metrics/acceptance-rate?days=30
```

#### Negotiation Metrics
```http
GET /api/v1/tenant/customer-quotes/metrics/negotiation?days=30
```

#### Approval Metrics
```http
GET /api/v1/tenant/customer-quotes/metrics/approval?days=30
```

#### Rejection Metrics
```http
GET /api/v1/tenant/customer-quotes/metrics/rejection?days=30
```

#### Error Metrics
```http
GET /api/v1/tenant/customer-quotes/metrics/errors?days=7
```

#### Expiry Metrics
```http
GET /api/v1/tenant/customer-quotes/metrics/expiry?days=30
```

## Service Integration

### CustomerQuoteMonitoringService

The monitoring service is automatically injected into key services:

```php
use App\Application\CustomerQuote\Services\CustomerQuoteMonitoringService;

class CustomerQuoteService
{
    public function __construct(
        // ... other dependencies
        private CustomerQuoteMonitoringService $monitoringService
    ) {}
    
    public function createFromVendorQuote(...): CustomerQuote
    {
        // ... create quote
        
        // Log monitoring
        $this->monitoringService->logQuoteAction(
            'quote_created',
            $quote->id,
            $createdBy,
            null,
            ['quote_number' => $quoteNumber]
        );
        
        return $quote;
    }
}
```

### Available Logging Methods

#### logQuoteAction
```php
$monitoringService->logQuoteAction(
    string $action,
    int $quoteId,
    ?int $userId = null,
    ?int $customerId = null,
    array $context = []
): void
```

#### logQuoteAcceptance
```php
$monitoringService->logQuoteAcceptance(
    int $quoteId,
    string $approvalMethod,
    ?string $approvalReason = null,
    array $metadata = []
): void
```

#### logQuoteRejection
```php
$monitoringService->logQuoteRejection(
    int $quoteId,
    string $rejectedBy,
    string $reason,
    array $context = []
): void
```

#### logNegotiationRound
```php
$monitoringService->logNegotiationRound(
    int $quoteId,
    int $roundNumber,
    string $initiator,
    int $originalAmount,
    int $counterAmount,
    array $context = []
): void
```

#### logQuoteExpiration
```php
$monitoringService->logQuoteExpiration(
    int $quoteId,
    array $context = []
): void
```

#### logPDFGenerationError
```php
$monitoringService->logPDFGenerationError(
    string $documentType,
    int $quoteId,
    \Exception $exception,
    array $context = []
): void
```

#### logEmailDelivery
```php
$monitoringService->logEmailDelivery(
    string $emailType,
    int $quoteId,
    string $recipient,
    bool $success,
    ?string $errorMessage = null,
    array $context = []
): void
```

## Caching Strategy

Metrics are cached to improve performance:

- **Cache Duration**: 5 minutes (300 seconds)
- **Cache Keys**: Tenant-scoped with period
- **Cache Driver**: Redis (recommended) or file

Example cache keys:
```
metrics.quote_acceptance_rate.{tenant_id}.{days}
metrics.auto_approval_rate.{tenant_id}.{days}
metrics.avg_negotiation_rounds.{tenant_id}.{days}
```

## Log Analysis

### Viewing Logs

```bash
# View customer quote logs
tail -f storage/logs/customer-quote.log

# Search for specific actions
grep "Quote Accepted" storage/logs/customer-quote.log

# Search for errors
grep "ERROR" storage/logs/customer-quote.log
```

### Log Format

```json
{
  "timestamp": "2026-02-19T10:30:00Z",
  "level": "info",
  "message": "Quote Action: quote_created",
  "context": {
    "action": "quote_created",
    "quote_id": 123,
    "user_id": 45,
    "customer_id": null,
    "timestamp": "2026-02-19T10:30:00Z",
    "context": {
      "quote_number": "CQ-202602-0001",
      "grand_total": 5000000,
      "vendor_quote_id": 67
    }
  }
}
```

## Alerting (Future Enhancement)

The monitoring system is designed to support alerting:

### Potential Alerts
- High rejection rate (>20%)
- Low acceptance rate (<50%)
- High expiry rate (>15%)
- PDF generation failures
- Email delivery failures
- Overdue manual approvals

### Integration Points
- Slack notifications
- Email alerts
- SMS alerts (critical only)
- Dashboard notifications

## Performance Considerations

### Database Queries

Metrics queries are optimized:
- Use indexes on `tenant_id`, `status`, `created_at`
- Cache results for 5 minutes
- Use query chunking for large datasets

### Log Storage

- Logs rotate daily
- Retention: 30 days for quote logs
- Automatic cleanup via Laravel log rotation

### Cache Management

- Use Redis for production
- Set appropriate TTL values
- Clear cache on settings changes

## Troubleshooting

### High Error Rates

If PDF or email errors are high:

1. Check log files for specific errors
2. Verify external service connectivity
3. Check disk space for PDF storage
4. Verify email configuration

### Missing Metrics

If metrics are not updating:

1. Verify monitoring service is injected
2. Check cache configuration
3. Verify database queries are executing
4. Check for exceptions in logs

### Scheduled Job Not Running

If expired quotes are not being marked:

1. Verify cron is running: `php artisan schedule:list`
2. Check job logs: `storage/logs/laravel.log`
3. Verify job is registered in `Kernel.php`
4. Test manually: `php artisan quotes:check-expired`

## Best Practices

1. **Monitor Regularly**: Check metrics dashboard weekly
2. **Set Baselines**: Establish normal ranges for metrics
3. **Investigate Anomalies**: Sudden changes may indicate issues
4. **Review Logs**: Regularly review error logs
5. **Optimize Thresholds**: Adjust approval thresholds based on metrics
6. **Track Trends**: Monitor metrics over time for patterns

## Related Documentation

- [Customer Quote Security](./CUSTOMER_QUOTE_SECURITY.md)
- [Customer Quote Performance Optimizations](./CUSTOMER_QUOTE_PERFORMANCE_OPTIMIZATIONS.md)
- [Queue Configuration](./QUEUE_CONFIGURATION.md)
