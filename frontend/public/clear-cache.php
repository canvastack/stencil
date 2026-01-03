<?php
// Clear DomaiNesia/LiteSpeed Cache Script
// Upload ke public_html/, akses via browser, lalu hapus file ini

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔧 Clear Cache Tool</h1>";

// Clear opcache if available
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "<p>✅ OPcache cleared</p>";
}

// Clear LiteSpeed cache via header
header('X-LiteSpeed-Purge: *');
echo "<p>✅ LiteSpeed Cache purge signal sent</p>";

// Clear browser cache header
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

echo "<p>✅ Browser cache headers sent</p>";
echo "<hr>";
echo "<h2>Next Steps:</h2>";
echo "<ol>";
echo "<li>Close this page</li>";
echo "<li>Delete file: <code>clear-cache.php</code> dari server (security!)</li>";
echo "<li>Hard refresh browser: <strong>Ctrl + F5</strong></li>";
echo "<li>Visit: <a href='/'>https://etchingxenial.com</a></li>";
echo "</ol>";
?>
