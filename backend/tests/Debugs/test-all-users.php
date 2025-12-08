<?php

// Test all user types

function testAPI($endpoint, $method = 'GET', $data = null, $headers = []) {
    $url = 'http://localhost:8000' . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($headers) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        if (!in_array('Content-Type: application/json', $headers)) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => $response,
        'error' => $error,
        'data' => json_decode($response, true)
    ];
}

echo "🧪 Testing All User Types Authentication\n";
echo "========================================\n\n";

$users = [
    [
        'type' => 'Platform Admin',
        'email' => 'admin@canvastencil.com',
        'password' => 'SuperAdmin2024!',
        'account_type' => 'platform'
    ],
    [
        'type' => 'Demo Tenant Admin',
        'email' => 'admin@etchinx.com',
        'password' => 'DemoAdmin2024!',
        'account_type' => 'tenant',
        'tenant_slug' => 'etchinx'
    ],
    [
        'type' => 'Demo Tenant Manager',
        'email' => 'manager@etchinx.com',
        'password' => 'DemoManager2024!',
        'account_type' => 'tenant',
        'tenant_slug' => 'etchinx'
    ],
    [
        'type' => 'PT CEX Admin',
        'email' => 'admin@pt-cex.com',
        'password' => 'PTCexAdmin2024!',
        'account_type' => 'tenant',
        'tenant_slug' => 'pt-cex'
    ]
];

foreach ($users as $userConfig) {
    echo "🔐 Testing {$userConfig['type']} Login\n";
    
    $loginData = [
        'email' => $userConfig['email'],
        'password' => $userConfig['password'],
        'account_type' => $userConfig['account_type']
    ];
    
    if (isset($userConfig['tenant_slug'])) {
        $loginData['tenant_slug'] = $userConfig['tenant_slug'];
    }
    
    $result = testAPI('/api/v1/auth/login', 'POST', $loginData);
    
    echo "Status: {$result['http_code']} | ";
    
    if ($result['http_code'] === 200 && isset($result['data']['success']) && $result['data']['success']) {
        echo "✅ SUCCESS\n";
        $token = $result['data']['data']['access_token'];
        echo "Token: " . substr($token, 0, 20) . "...\n";
        
        if (isset($result['data']['data']['user'])) {
            echo "User: {$result['data']['data']['user']['name']}\n";
        }
        if (isset($result['data']['data']['account'])) {
            echo "Account: {$result['data']['data']['account']['name']}\n";
        }
        if (isset($result['data']['data']['tenant'])) {
            echo "Tenant: {$result['data']['data']['tenant']['name']}\n";
        }
    } else {
        echo "❌ FAILED\n";
        if (isset($result['data']['message'])) {
            echo "Error: {$result['data']['message']}\n";
        }
    }
    
    echo "\n";
}

echo "🏁 Authentication Tests Completed!\n";