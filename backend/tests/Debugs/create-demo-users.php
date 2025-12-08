<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

try {
    echo "🔧 Creating Demo Users for Testing...\n\n";

    // 1. Create Demo Etching Tenant
    $demoTenant = TenantEloquentModel::where('slug', 'etchinx')->first();
    if (!$demoTenant) {
        $demoTenant = TenantEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'Demo Etching Company',
            'slug' => 'etchinx',
            'domain' => 'etchinx.canvastencil.com',
            'status' => 'active',
            'subscription_status' => 'trial',
            'subscription_plan' => 'starter',
            'trial_ends_at' => now()->addDays(30),
            'settings' => json_encode([
                'timezone' => 'Asia/Jakarta',
                'currency' => 'IDR',
                'language' => 'id'
            ])
        ]);
        echo "✅ Demo Etching tenant created!\n";
    } else {
        echo "ℹ️  Demo Etching tenant already exists\n";
    }

    // 2. Create Demo Tenant Admin User
    $demoAdmin = UserEloquentModel::where('email', 'admin@etchinx.com')
        ->where('tenant_id', $demoTenant->id)
        ->first();

    if (!$demoAdmin) {
        $demoAdmin = UserEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'Demo Admin',
            'email' => 'admin@etchinx.com',
            'email_verified_at' => now(),
            'password' => Hash::make('DemoAdmin2024!'),
            'tenant_id' => $demoTenant->id,
            'role' => 'admin',
            'status' => 'active'
        ]);
        echo "✅ Demo Admin user created!\n";
    } else {
        echo "ℹ️  Demo Admin user already exists\n";
    }

    // 3. Create Demo Tenant Manager User
    $demoManager = UserEloquentModel::where('email', 'manager@etchinx.com')
        ->where('tenant_id', $demoTenant->id)
        ->first();

    if (!$demoManager) {
        $demoManager = UserEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'Demo Manager',
            'email' => 'manager@etchinx.com',
            'email_verified_at' => now(),
            'password' => Hash::make('DemoManager2024!'),
            'tenant_id' => $demoTenant->id,
            'role' => 'manager',
            'status' => 'active'
        ]);
        echo "✅ Demo Manager user created!\n";
    } else {
        echo "ℹ️  Demo Manager user already exists\n";
    }

    // 4. Create Platform Admin Account
    $platformAdmin = AccountEloquentModel::where('email', 'admin@canvastencil.com')->first();

    if (!$platformAdmin) {
        $platformAdmin = AccountEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'Platform Admin',
            'email' => 'admin@canvastencil.com',
            'email_verified_at' => now(),
            'password' => Hash::make('SuperAdmin2024!'),
            'account_type' => 'platform_owner',
            'status' => 'active',
            'permissions' => json_encode(['platform.all'])
        ]);
        echo "✅ Platform Admin account created!\n";
    } else {
        echo "ℹ️  Platform Admin account already exists\n";
    }

    echo "\n🔗 Login Credentials:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📊 PLATFORM OWNER:\n";
    echo "   Email: admin@canvastencil.com\n";
    echo "   Password: SuperAdmin2024!\n\n";
    
    echo "🏢 TENANT - Demo Etching Company:\n";
    echo "   Admin: admin@etchinx.com | Password: DemoAdmin2024!\n";
    echo "   Manager: manager@etchinx.com | Password: DemoManager2024!\n\n";
    
    echo "🏢 TENANT - PT CEX:\n";
    echo "   Admin: admin@pt-cex.com | Password: PTCexAdmin2024!\n";
    echo "   Manager: manager@pt-cex.com | Password: PTCexManager2024!\n\n";

    echo "✨ All demo users created successfully!\n";
    echo "🚀 You can now login with any of the above credentials.\n";

} catch (\Exception $e) {
    echo "❌ Error creating demo users: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}