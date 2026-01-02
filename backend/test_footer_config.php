<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING FOOTER CONFIG IN DATABASE ===" . PHP_EOL . PHP_EOL;

$tenant = DB::table('tenants')->first();
echo "Tenant: {$tenant->name} (ID: {$tenant->id})" . PHP_EOL . PHP_EOL;

$footer = DB::table('tenant_footer_configs')
    ->where('tenant_id', $tenant->id)
    ->first();

if ($footer) {
    echo "✓ Footer Config Found:" . PHP_EOL;
    echo "  - UUID: {$footer->uuid}" . PHP_EOL;
    echo "  - Contact Address: " . ($footer->contact_address ?? 'NULL') . PHP_EOL;
    echo "  - Contact Phone: " . ($footer->contact_phone ?? 'NULL') . PHP_EOL;
    echo "  - Contact Email: " . ($footer->contact_email ?? 'NULL') . PHP_EOL;
    echo "  - Business Hours: " . ($footer->business_hours ?? 'NULL') . PHP_EOL;
    echo "  - Show Contact: " . ($footer->show_contact_info ? 'Yes' : 'No') . PHP_EOL;
    echo "  - Is Active: " . ($footer->is_active ? 'Yes' : 'No') . PHP_EOL;
    echo PHP_EOL;
} else {
    echo "✗ NO FOOTER CONFIG FOUND FOR THIS TENANT" . PHP_EOL;
}
