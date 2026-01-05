<?php

require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __dir__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Deleting failed migration record...\n";

$deleted = DB::table('migrations')
    ->where('migration', '2026_01_05_092220_fix_product_form_configurations_tenant_id_type')
    ->delete();

echo "Deleted {$deleted} migration record(s)\n";
