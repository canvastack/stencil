<?php

require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$config = DB::selectOne("SELECT id, tenant_id, product_id, is_active, pg_typeof(tenant_id) as tenant_id_type FROM product_form_configurations WHERE id = 482");

echo "Raw Database Query Result:\n";
echo "==========================\n";
echo "Config ID: {$config->id}\n";
echo "Tenant ID value: {$config->tenant_id}\n";
echo "Tenant ID type: {$config->tenant_id_type}\n";
echo "Product ID: {$config->product_id}\n";
echo "Active: {$config->is_active}\n";
