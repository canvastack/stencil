<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$seeder = new Database\Seeders\QuoteEnhancementTestDataSeeder();
$seeder->setCommand(new class {
    public function info($message) { echo "✅ $message\n"; }
    public function error($message) { echo "❌ $message\n"; }
});

$seeder->run();

echo "\n✅ Seeder completed!\n";
