<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;

$t = TenantModel::where('slug', 'etchinx')->first();
$total = Product::where('tenant_id', $t->id)->count();
$published = Product::where('tenant_id', $t->id)->where('status', 'published')->count();

echo "Total: $total\n";
echo "Published: $published\n";
