<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Create or get tenant
$tenant = App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::first();
if (!$tenant) {
    $tenant = App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::create([
        'uuid' => '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'name' => 'Demo Tenant', 
        'slug' => 'demo-tenant',
        'domain' => 'demo.canvastencil.com',
        'status' => 'active',
        'subscription_status' => 'trial',
        'subscription_plan' => 'starter',
        'trial_ends_at' => now()->addDays(30),
        'settings' => json_encode(['timezone' => 'Asia/Jakarta', 'currency' => 'IDR', 'language' => 'id'])
    ]);
}

// Create or get user
$user = App\Infrastructure\Persistence\Eloquent\UserEloquentModel::firstOrCreate([
    'email' => 'test@demo.com'
], [
    'uuid' => Illuminate\Support\Str::uuid(),
    'name' => 'Test User',
    'email_verified_at' => now(),
    'password' => bcrypt('password'),
    'tenant_id' => $tenant->id,
    'role' => 'admin',
    'status' => 'active'
]);

// Generate token
$token = $user->createToken('test-token')->plainTextToken;

echo "Token: " . $token . "\n";
echo "User ID: " . $user->id . "\n";
echo "Tenant ID: " . $tenant->id . "\n";