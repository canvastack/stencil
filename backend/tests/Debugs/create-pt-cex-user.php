<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

try {
    // Create PT CEX tenant
    $tenant = TenantEloquentModel::create([
        'uuid' => Str::uuid(),
        'name' => 'PT CEX (Chemical Exchange)',
        'slug' => 'pt-cex',
        'domain' => 'pt-cex.canvastencil.com',
        'status' => 'active',
        'subscription_status' => 'active',
        'subscription_plan' => 'premium',
        'trial_ends_at' => null, // No trial, active subscription
        'settings' => json_encode([
            'timezone' => 'Asia/Jakarta',
            'currency' => 'IDR',
            'language' => 'id',
            'industry' => 'chemical_manufacturing'
        ])
    ]);

    echo "✅ PT CEX tenant created successfully!\n";
    echo "   - ID: {$tenant->id}\n";
    echo "   - UUID: {$tenant->uuid}\n";
    echo "   - Slug: {$tenant->slug}\n";
    echo "   - Domain: {$tenant->domain}\n\n";

    // Create admin user for PT CEX
    $adminUser = UserEloquentModel::create([
        'uuid' => Str::uuid(),
        'name' => 'PT CEX Admin',
        'email' => 'admin@pt-cex.com',
        'email_verified_at' => now(),
        'password' => Hash::make('PTCexAdmin2024!'),
        'tenant_id' => $tenant->id,
        'role' => 'admin',
        'status' => 'active'
    ]);

    echo "✅ PT CEX Admin user created successfully!\n";
    echo "   - ID: {$adminUser->id}\n";
    echo "   - UUID: {$adminUser->uuid}\n";
    echo "   - Email: {$adminUser->email}\n";
    echo "   - Password: PTCexAdmin2024!\n\n";

    // Create manager user for PT CEX
    $managerUser = UserEloquentModel::create([
        'uuid' => Str::uuid(),
        'name' => 'PT CEX Manager',
        'email' => 'manager@pt-cex.com',
        'email_verified_at' => now(),
        'password' => Hash::make('PTCexManager2024!'),
        'tenant_id' => $tenant->id,
        'role' => 'manager',
        'status' => 'active'
    ]);

    echo "✅ PT CEX Manager user created successfully!\n";
    echo "   - ID: {$managerUser->id}\n";
    echo "   - UUID: {$managerUser->uuid}\n";
    echo "   - Email: {$managerUser->email}\n";
    echo "   - Password: PTCexManager2024!\n\n";

    // Create access tokens for testing
    $adminToken = $adminUser->createToken('pt-cex-admin-token', ['*'])->plainTextToken;
    $managerToken = $managerUser->createToken('pt-cex-manager-token', ['*'])->plainTextToken;

    echo "🔑 Access Tokens Created:\n";
    echo "   - Admin Token: {$adminToken}\n";
    echo "   - Manager Token: {$managerToken}\n\n";

    echo "🔗 Login Credentials:\n";
    echo "   Email: admin@pt-cex.com | Password: PTCexAdmin2024!\n";
    echo "   Email: manager@pt-cex.com | Password: PTCexManager2024!\n\n";

    echo "✨ PT CEX setup completed successfully! You can now test with real tenant users.\n";

} catch (\Exception $e) {
    echo "❌ Error creating PT CEX users: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}