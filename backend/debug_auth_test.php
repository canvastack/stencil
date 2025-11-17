<?php

// Quick debug script to check authentication endpoint
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Http\Kernel')->bootstrap();

// Set up test database
\Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--seed' => true]);

// Create test account
$account = \App\Infrastructure\Persistence\Eloquent\AccountEloquentModel::create([
    'name' => 'Test Admin',
    'email' => 'admin@test.com',
    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
    'account_type' => 'platform_owner',
    'status' => 'active'
]);

echo "Account created: {$account->id}\n";

// Test the authentication service directly
try {
    $authService = app(\App\Application\Auth\UseCases\AuthenticationService::class);
    $result = $authService->authenticatePlatformAccount('admin@test.com', 'password123', '127.0.0.1');
    echo "Authentication successful:\n";
    print_r($result);
} catch (Exception $e) {
    echo "Authentication error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}