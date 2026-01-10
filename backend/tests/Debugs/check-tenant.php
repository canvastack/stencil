<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

$tenants = Tenant::select('id', 'name', 'slug')->limit(10)->get();

echo "Tenants found: " . $tenants->count() . "\n\n";

foreach ($tenants as $tenant) {
    echo "ID: {$tenant->id}, Name: {$tenant->name}, Slug: {$tenant->slug}\n";
}
