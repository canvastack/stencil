<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Create a test request with demo token
$request = Illuminate\Http\Request::create(
    'http://localhost:8000/api/v1/tenant/refunds',
    'GET',
    [], // parameters
    [], // cookies
    [], // files
    [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_AUTHORIZATION' => 'Bearer demo_token_1765125444',
        'REQUEST_URI' => '/api/v1/tenant/refunds',
        'PATH_INFO' => '/api/v1/tenant/refunds',
    ]
);

// Process the request
$response = $kernel->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

$kernel->terminate($request, $response);