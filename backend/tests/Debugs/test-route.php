<?php

require_once 'vendor/autoload.php';

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$routes = \Illuminate\Support\Facades\Route::getRoutes();

echo "Looking for auth routes:\n";
foreach ($routes as $route) {
    $uri = $route->uri();
    if (str_contains($uri, 'auth')) {
        echo "- " . $route->methods()[0] . " " . $uri . "\n";
    }
}

echo "\nTesting direct controller instantiation:\n";
try {
    $controller = new \App\Http\Controllers\Auth\TenantAuthController();
    echo "✅ TenantAuthController can be instantiated\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}