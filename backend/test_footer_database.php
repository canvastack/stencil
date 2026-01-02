<?php

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$database = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== TENANT FOOTER CONFIG - DATABASE STATE ===\n\n";
    
    // Get tenant first
    $stmt = $pdo->query("SELECT id, name, slug FROM tenants WHERE slug = 'etchinx' LIMIT 1");
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        echo "❌ Tenant 'etchinx' not found!\n";
        exit(1);
    }
    
    echo "✅ Tenant Found:\n";
    echo "   - ID: {$tenant['id']}\n";
    echo "   - Name: {$tenant['name']}\n";
    echo "   - Slug: {$tenant['slug']}\n\n";
    
    // Get footer config
    $stmt = $pdo->prepare("
        SELECT 
            id,
            uuid,
            tenant_id,
            footer_sections,
            is_active,
            created_at,
            updated_at
        FROM tenant_footer_configs 
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$tenant['id']]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        echo "❌ No footer config found for this tenant!\n";
        exit(1);
    }
    
    echo "📦 Footer Config:\n";
    echo "   - ID: {$config['id']}\n";
    echo "   - UUID: {$config['uuid']}\n";
    echo "   - Tenant ID: {$config['tenant_id']}\n";
    echo "   - Active: " . ($config['is_active'] ? 'Yes' : 'No') . "\n";
    echo "   - Created: {$config['created_at']}\n";
    echo "   - Updated: {$config['updated_at']}\n\n";
    
    echo "🔍 Footer Sections (Raw JSON):\n";
    echo $config['footer_sections'] . "\n\n";
    
    $sections = json_decode($config['footer_sections'], true);
    
    if ($sections && is_array($sections)) {
        echo "📋 Parsed Footer Sections:\n";
        foreach ($sections as $index => $section) {
            echo "\n   Section #" . ($index + 1) . ":\n";
            echo "   - Title: {$section['title']}\n";
            echo "   - Sort Order: {$section['sort_order']}\n";
            echo "   - Links Count: " . count($section['links']) . "\n";
            foreach ($section['links'] as $link) {
                echo "     • {$link['label']} → {$link['path']}\n";
            }
        }
    } else {
        echo "⚠️  No sections found or invalid JSON\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
