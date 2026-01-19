<?php

use Illuminate\Support\Facades\Route;

Route::get('/hello', function () {
    return response()->json([
        'message' => 'Hello from Hello World Plugin!',
        'plugin' => 'hello-world',
        'version' => '1.0.0',
        'status' => 'active',
    ]);
});

Route::get('/hello/info', function () {
    return response()->json([
        'plugin_name' => 'Hello World',
        'description' => 'A simple demo plugin to test the plugin infrastructure',
        'features' => [
            'Demo migration',
            'Demo routes',
            'Plugin manifest',
            'Multi-tenant support',
        ],
    ]);
});
