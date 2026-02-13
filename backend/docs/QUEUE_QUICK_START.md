# Queue Quick Start Guide

## Starting the Queue Worker

### Windows
```bash
cd backend
start-queue-worker.bat
```

### Linux/Mac
```bash
cd backend
chmod +x start-queue-worker.sh
./start-queue-worker.sh
```

### Manual Command
```bash
php artisan queue:work --queue=vendor-emails --tries=3 --timeout=120 --sleep=3 --verbose
```

## Dispatching Email Jobs

```php
use App\Jobs\Vendor\SendVendorWelcomeEmailJob;

// Dispatch to queue
SendVendorWelcomeEmailJob::dispatch(
    tenantId: $tenant->uuid,
    recipientEmail: $vendor->email,
    emailData: [
        'vendor_name' => $vendor->company_name,
        'email' => $vendor->email,
        'temporary_password' => $temporaryPassword,
        'login_url' => config('app.frontend_url') . '/vendor/login',
    ]
);
```

## Common Commands

```bash
# View failed jobs
php artisan queue:failed

# Retry all failed jobs
php artisan queue:retry all

# Retry specific job
php artisan queue:retry {job-id}

# Clear failed jobs
php artisan queue:flush

# Process one job and stop
php artisan queue:work --once
```

## Monitoring

```bash
# Check queue status
php artisan tinker
>>> DB::table('jobs')->count()
>>> DB::table('failed_jobs')->count()
```

## Troubleshooting

### Jobs not processing?
1. Check if worker is running: `ps aux | grep "queue:work"`
2. Check `.env`: `QUEUE_CONNECTION=database`
3. Check logs: `tail -f storage/logs/laravel.log`

### Emails not sending?
1. Check email config in `.env`
2. Test email: `php artisan tinker` then `Mail::raw('Test', fn($m) => $m->to('test@example.com')->subject('Test'));`
3. Check failed jobs: `php artisan queue:failed`

## See Also

- Full documentation: `backend/docs/QUEUE_CONFIGURATION.md`
- Job classes: `backend/app/Jobs/Vendor/`
- Tests: `backend/tests/Feature/Queue/VendorEmailQueueTest.php`
