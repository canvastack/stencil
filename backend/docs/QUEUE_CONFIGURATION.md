# Queue Configuration for Vendor Portal

## Overview

The vendor portal uses Laravel's queue system to process email notifications asynchronously. This ensures that email sending doesn't block the main application flow and provides automatic retry logic for failed emails.

## Queue Driver

**Driver**: Database  
**Connection**: `database`  
**Queue Name**: `vendor-emails`

The database driver was chosen for its simplicity and reliability. It stores jobs in the `jobs` table and failed jobs in the `failed_jobs` table.

## Configuration

### Environment Variables

```env
QUEUE_CONNECTION=database
```

### Queue Configuration

Location: `config/queue.php`

```php
'vendor-emails' => [
    'driver' => 'database',
    'table' => 'jobs',
    'queue' => 'vendor-emails',
    'retry_after' => 180, // 3 minutes for email processing
    'after_commit' => false,
],
```

## Retry Logic

All vendor email jobs implement the following retry strategy:

- **Maximum Attempts**: 3
- **Backoff Strategy**: Exponential
  - 1st retry: 60 seconds (1 minute)
  - 2nd retry: 300 seconds (5 minutes)
  - 3rd retry: 900 seconds (15 minutes)
- **Timeout**: 120 seconds per attempt
- **Retry Until**: 2 hours from first attempt

### Example Job Configuration

```php
public $tries = 3;
public $backoff = [60, 300, 900];
public $timeout = 120;
```

## Email Job Classes

All vendor email jobs extend the base `SendVendorEmailJob` class:

1. **SendVendorWelcomeEmailJob** - Welcome email with login credentials
2. **SendNewQuoteEmailJob** - New quote notification
3. **SendQuoteReminderEmailJob** - Quote expiration reminder
4. **SendQuoteExpiredEmailJob** - Quote expired notification
5. **SendQuoteResponseEmailJob** - Quote response notification (to admins)
6. **SendQuoteMessageEmailJob** - Quote message notification

## Running Queue Workers

### Development

For development, you can run the queue worker manually:

```bash
php artisan queue:work --queue=vendor-emails --tries=3 --timeout=120
```

Or use the default queue:

```bash
php artisan queue:work
```

### Production

For production, use a process manager like Supervisor to keep the queue worker running:

#### Supervisor Configuration

Create a file at `/etc/supervisor/conf.d/canvastencil-worker.conf`:

```ini
[program:canvastencil-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/backend/artisan queue:work database --queue=vendor-emails --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Then reload Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start canvastencil-worker:*
```

### Windows Development

For Windows development, you can use the following PowerShell script:

```powershell
# Start queue worker
php artisan queue:work --queue=vendor-emails --tries=3 --timeout=120 --sleep=3
```

Or create a batch file `start-queue-worker.bat`:

```batch
@echo off
cd /d %~dp0
php artisan queue:work --queue=vendor-emails --tries=3 --timeout=120 --sleep=3
pause
```

## Monitoring

### View Queued Jobs

```bash
# Count jobs in queue
php artisan queue:monitor vendor-emails

# List all jobs
php artisan tinker
>>> DB::table('jobs')->where('queue', 'vendor-emails')->get();
```

### View Failed Jobs

```bash
# List failed jobs
php artisan queue:failed

# Retry a specific failed job
php artisan queue:retry {job-id}

# Retry all failed jobs
php artisan queue:retry all

# Delete a failed job
php artisan queue:forget {job-id}

# Flush all failed jobs
php artisan queue:flush
```

### Logs

All email jobs log their execution:

- **Success**: `storage/logs/laravel.log` (INFO level)
- **Failures**: `storage/logs/laravel.log` (ERROR level)
- **Critical Failures**: `storage/logs/laravel.log` (CRITICAL level)

Log format:

```
[timestamp] local.INFO: Sending vendor welcome email {"tenant_id":"...","recipient":"...","attempt":1}
[timestamp] local.INFO: Vendor welcome email sent successfully {"tenant_id":"...","recipient":"..."}
```

## Failure Handling

When a job fails after all retry attempts:

1. The job is moved to the `failed_jobs` table
2. A CRITICAL log entry is created
3. The `failed()` method on the job is called
4. Administrators can be notified (optional)

### Failed Job Structure

```php
public function failed(\Throwable $exception): void
{
    Log::error('Vendor email job failed', [
        'job_class' => static::class,
        'tenant_id' => $this->tenantId,
        'recipient' => $this->recipientEmail,
        'attempts' => $this->attempts(),
        'exception' => $exception->getMessage(),
        'trace' => $exception->getTraceAsString(),
    ]);
}
```

## Testing

### Dispatch a Test Job

```php
use App\Jobs\Vendor\SendVendorWelcomeEmailJob;

// Dispatch to queue
SendVendorWelcomeEmailJob::dispatch(
    tenantId: 'tenant-uuid',
    recipientEmail: 'vendor@example.com',
    emailData: [
        'vendor_name' => 'Test Vendor',
        'email' => 'vendor@example.com',
        'temporary_password' => 'TempPass123!',
        'login_url' => 'https://example.com/vendor/login',
    ]
);

// Dispatch immediately (bypass queue)
SendVendorWelcomeEmailJob::dispatchSync(...);
```

### Test Queue Processing

```bash
# Process one job and stop
php artisan queue:work --once

# Process jobs for 60 seconds
php artisan queue:work --max-time=60

# Process 10 jobs and stop
php artisan queue:work --max-jobs=10
```

## Performance Considerations

### Queue Workers

- **Development**: 1 worker is sufficient
- **Production**: 2-4 workers recommended for high volume
- **Scaling**: Add more workers if queue depth increases

### Database Optimization

The `jobs` table has indexes on:
- `queue` column for fast queue filtering
- `reserved_at` for job locking

### Cleanup

Old failed jobs should be cleaned up periodically:

```bash
# Delete failed jobs older than 30 days
php artisan queue:prune-failed --hours=720
```

Add to scheduler in `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('queue:prune-failed --hours=720')->daily();
}
```

## Troubleshooting

### Jobs Not Processing

1. Check if queue worker is running:
   ```bash
   ps aux | grep "queue:work"
   ```

2. Check queue connection in `.env`:
   ```env
   QUEUE_CONNECTION=database
   ```

3. Check for errors in logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```

### Jobs Failing Immediately

1. Check email configuration in `.env`
2. Test email sending manually:
   ```bash
   php artisan tinker
   >>> Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); });
   ```

3. Check failed jobs table:
   ```bash
   php artisan queue:failed
   ```

### High Queue Depth

1. Add more workers
2. Increase worker timeout
3. Check for slow email sending
4. Consider using Redis for better performance

## Migration to Redis (Optional)

For higher performance, you can migrate to Redis:

1. Install Redis PHP extension
2. Update `.env`:
   ```env
   QUEUE_CONNECTION=redis
   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379
   ```

3. Update queue configuration in `config/queue.php`
4. Restart queue workers

## Security Considerations

1. **Sensitive Data**: Email data is serialized in the database. Ensure database is secure.
2. **Failed Jobs**: Failed jobs contain email data. Clean up regularly.
3. **Logs**: Email logs may contain sensitive information. Rotate logs regularly.
4. **Queue Workers**: Run workers with appropriate user permissions.

## Requirements Fulfilled

- ✅ **Requirement 7.14**: Queue all emails for asynchronous processing
- ✅ **Requirement 7.15**: Retry failed emails up to 3 times
- ✅ **Task 9.2.1**: Configure Laravel Queue for email processing
  - ✅ Set up queue driver (database)
  - ✅ Configure queue workers
  - ✅ Add retry logic (3 attempts with exponential backoff)
  - ✅ Add failure handling (logging and failed jobs table)

