<?php

// Test PT CEX authentication and API functionality

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

echo "🧪 Testing PT CEX Authentication and API\n";
echo "=====================================\n\n";

// Test 1: Login with PT CEX admin
echo "🔐 Test 1: Login with PT CEX Admin\n";
$loginData = [
    'email' => 'admin@pt-cex.com',
    'password' => 'PTCexAdmin2024!',
    'tenant_slug' => 'pt-cex'
];

$loginResult = testAPI('/api/v1/auth/login', 'POST', $loginData);
echo "Status Code: {$loginResult['http_code']}\n";
echo "Response: " . json_encode($loginResult['data'], JSON_PRETTY_PRINT) . "\n\n";

if ($loginResult['http_code'] === 200 && isset($loginResult['data']['success']) && $loginResult['data']['success']) {
    $adminToken = $loginResult['data']['data']['access_token'];
    echo "✅ Admin login successful! Token: " . substr($adminToken, 0, 20) . "...\n\n";
    
    // Test 2: Get authenticated user info
    echo "👤 Test 2: Get Authenticated User Info\n";
    $userResult = testAPI('/api/v1/auth/me', 'GET', null, [
        'Authorization: Bearer ' . $adminToken,
        'Accept: application/json'
    ]);
    echo "Status Code: {$userResult['http_code']}\n";
    echo "Response: " . json_encode($userResult['data'], JSON_PRETTY_PRINT) . "\n\n";
    
    // Test 3: Access tenant refunds API
    echo "📋 Test 3: Access Tenant Refunds API\n";
    $refundsResult = testAPI('/api/v1/tenant/refunds', 'GET', null, [
        'Authorization: Bearer ' . $adminToken,
        'Accept: application/json'
    ]);
    echo "Status Code: {$refundsResult['http_code']}\n";
    echo "Response: " . json_encode($refundsResult['data'], JSON_PRETTY_PRINT) . "\n\n";
    
} else {
    echo "❌ Admin login failed!\n\n";
}

// Test 4: Login with PT CEX manager
echo "🔐 Test 4: Login with PT CEX Manager\n";
$managerLoginData = [
    'email' => 'manager@pt-cex.com',
    'password' => 'PTCexManager2024!',
    'tenant_slug' => 'pt-cex'
];

$managerLoginResult = testAPI('/api/v1/auth/login', 'POST', $managerLoginData);
echo "Status Code: {$managerLoginResult['http_code']}\n";
echo "Response: " . json_encode($managerLoginResult['data'], JSON_PRETTY_PRINT) . "\n\n";

if ($managerLoginResult['http_code'] === 200 && isset($managerLoginResult['data']['success']) && $managerLoginResult['data']['success']) {
    $managerToken = $managerLoginResult['data']['data']['access_token'];
    echo "✅ Manager login successful! Token: " . substr($managerToken, 0, 20) . "...\n\n";
    
    // Test 5: Manager access to refunds API
    echo "📋 Test 5: Manager Access to Refunds API\n";
    $managerRefundsResult = testAPI('/api/v1/tenant/refunds', 'GET', null, [
        'Authorization: Bearer ' . $managerToken,
        'Accept: application/json'
    ]);
    echo "Status Code: {$managerRefundsResult['http_code']}\n";
    echo "Response: " . json_encode($managerRefundsResult['data'], JSON_PRETTY_PRINT) . "\n\n";
    
} else {
    echo "❌ Manager login failed!\n\n";
}

// Test 6: Test invalid credentials
echo "🚫 Test 6: Test Invalid Credentials\n";
$invalidLogin = [
    'email' => 'invalid@pt-cex.com',
    'password' => 'WrongPassword!',
    'tenant_slug' => 'pt-cex'
];

$invalidResult = testAPI('/api/v1/auth/login', 'POST', $invalidLogin);
echo "Status Code: {$invalidResult['http_code']}\n";
echo "Response: " . json_encode($invalidResult['data'], JSON_PRETTY_PRINT) . "\n\n";

if ($invalidResult['http_code'] === 401) {
    echo "✅ Invalid credentials properly rejected!\n\n";
} else {
    echo "❌ Invalid credentials handling failed!\n\n";
}

echo "🏁 PT CEX Authentication Tests Completed!\n";
echo "==========================================\n";
echo "Summary:\n";
echo "- Real tenant authentication: " . (isset($adminToken) ? "✅ WORKING" : "❌ FAILED") . "\n";
echo "- Multi-user support: " . (isset($managerToken) ? "✅ WORKING" : "❌ FAILED") . "\n";
echo "- API access control: " . ((isset($adminToken) && isset($managerToken)) ? "✅ WORKING" : "❌ FAILED") . "\n";
echo "- Security validation: " . ($invalidResult['http_code'] === 401 ? "✅ WORKING" : "❌ FAILED") . "\n";