<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;
use Illuminate\Support\Facades\DB;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

echo "Checking customers table:\n";
echo "========================================\n";

try {
    $total = DB::table('customers')->count();
    echo "Total customers: $total\n";
    
    if ($total > 0) {
        $etchinxCustomers = DB::table('customers')
            ->where('tenant_id', $etchinx->id)
            ->count();
        echo "Etchinx customers: $etchinxCustomers\n";
        
        // Sample customers
        $samples = DB::table('customers')
            ->where('tenant_id', $etchinx->id)
            ->limit(5)
            ->get(['id', 'name', 'email']);
        
        echo "\nSample customers:\n";
        foreach ($samples as $c) {
            echo "  - ID {$c->id}: {$c->name} ({$c->email})\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "========================================\n";
