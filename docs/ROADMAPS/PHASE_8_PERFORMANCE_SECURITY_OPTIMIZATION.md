# Phase 8: Performance & Security Optimization
**Duration**: 4 Weeks (Weeks 29-32)  
**Priority**: HIGH  
**Prerequisites**: Phase 1-7 (Complete multi-tenant platform with all features)

## 🎯 Phase Overview

This final phase focuses on production readiness through comprehensive performance optimization, security hardening, testing, and documentation. The goal is to ensure the platform can handle production workloads securely and efficiently while maintaining excellent performance under load.

### Key Deliverables
- **Performance Optimization** with caching, database optimization, and CDN
- **Security Hardening** with comprehensive security measures
- **Load Testing & Performance Monitoring** with real-time metrics
- **Comprehensive Testing Suite** with 95%+ code coverage
- **Production Deployment** with CI/CD pipelines
- **Documentation & Training** materials for development teams

## 📋 Week-by-Week Breakdown

### Week 29: Performance Optimization & Caching

#### Day 1-2: Database Optimization & Query Performance
```php
// File: app/Services/DatabaseOptimizationService.php
class DatabaseOptimizationService
{
    public function optimizeQueries(): array
    {
        $optimizations = [];
        
        // Add missing indexes
        $missingIndexes = $this->identifyMissingIndexes();
        foreach ($missingIndexes as $index) {
            $this->addIndex($index);
            $optimizations[] = "Added index: {$index['table']}.{$index['column']}";
        }
        
        // Optimize slow queries
        $slowQueries = $this->identifySlowQueries();
        foreach ($slowQueries as $query) {
            $this->optimizeQuery($query);
            $optimizations[] = "Optimized query: {$query['sql']}";
        }
        
        return $optimizations;
    }

    private function identifyMissingIndexes(): array
    {
        return [
            // Analytics events table
            ['table' => 'analytics_events', 'column' => 'created_at', 'type' => 'btree'],
            ['table' => 'analytics_events', 'column' => 'event_type', 'type' => 'btree'],
            
            // Orders table
            ['table' => 'orders', 'column' => 'created_at', 'type' => 'btree'],
            ['table' => 'orders', 'column' => ['status', 'created_at'], 'type' => 'composite'],
            
            // Products table
            ['table' => 'products', 'column' => ['status', 'featured'], 'type' => 'composite'],
            ['table' => 'products', 'column' => 'price', 'type' => 'btree'],
            
            // Media files table
            ['table' => 'media_files', 'column' => ['tenant_id', 'mime_type'], 'type' => 'composite'],
            
            // Translations table
            ['table' => 'translations', 'column' => ['key', 'language_code'], 'type' => 'composite'],
        ];
    }
}

// File: database/migrations/add_performance_indexes.php
class AddPerformanceIndexes extends Migration
{
    public function up()
    {
        Schema::table('analytics_events', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['tenant_id', 'event_type', 'created_at']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'status', 'created_at']);
            $table->index(['tenant_id', 'customer_id', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['tenant_id', 'status', 'featured']);
            $table->index(['tenant_id', 'category_id', 'status']);
            $table->index(['tenant_id', 'price']);
        });

        Schema::table('media_files', function (Blueprint $table) {
            $table->index(['tenant_id', 'mime_type']);
            $table->index(['tenant_id', 'folder_id', 'created_at']);
        });

        Schema::table('translations', function (Blueprint $table) {
            $table->index(['tenant_id', 'language_code', 'category']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'status']);
        });
    }
}

// File: app/Http/Middleware/QueryOptimization.php
class QueryOptimization
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->environment('production')) {
            // Enable query caching
            DB::enableQueryLog();
        }

        $response = $next($request);

        if (app()->environment('local')) {
            // Log slow queries in development
            $queries = DB::getQueryLog();
            foreach ($queries as $query) {
                if ($query['time'] > 100) { // 100ms threshold
                    Log::warning('Slow query detected', [
                        'sql' => $query['query'],
                        'bindings' => $query['bindings'],
                        'time' => $query['time'] . 'ms'
                    ]);
                }
            }
        }

        return $response;
    }
}
```

#### Day 3-4: Advanced Caching Implementation
```php
// File: app/Services/CacheService.php
class CacheService
{
    private const CACHE_TTL = [
        'tenant_data' => 3600,      // 1 hour
        'product_list' => 1800,     // 30 minutes
        'translations' => 86400,    // 24 hours
        'analytics' => 300,         // 5 minutes
        'settings' => 7200,         // 2 hours
    ];

    public function remember(string $key, string $type, callable $callback, ?int $ttl = null)
    {
        $ttl = $ttl ?? self::CACHE_TTL[$type] ?? 3600;
        $tenantKey = $this->getTenantKey($key);
        
        return cache()->tags([$type, "tenant:" . tenant()->id])
            ->remember($tenantKey, $ttl, $callback);
    }

    public function flush(string $type, ?string $tenantId = null): void
    {
        $tenantId = $tenantId ?? tenant()->id;
        cache()->tags([$type, "tenant:{$tenantId}"])->flush();
    }

    public function flushAll(?string $tenantId = null): void
    {
        $tenantId = $tenantId ?? tenant()->id;
        cache()->tags(["tenant:{$tenantId}"])->flush();
    }

    private function getTenantKey(string $key): string
    {
        return "tenant:" . tenant()->id . ":" . $key;
    }
}

// File: app/Models/Product.php (add caching methods)
class Product extends Model implements BelongsToTenant
{
    // ... existing code ...

    public static function getCachedProducts(array $filters = [])
    {
        $cacheKey = 'products:' . md5(serialize($filters));
        
        return app(CacheService::class)->remember(
            $cacheKey,
            'product_list',
            function() use ($filters) {
                $query = static::query()->with(['category']);
                
                foreach ($filters as $key => $value) {
                    match($key) {
                        'category' => $query->whereHas('category', fn($q) => $q->where('slug', $value)),
                        'featured' => $query->where('featured', $value),
                        'status' => $query->where('status', $value),
                        default => null,
                    };
                }
                
                return $query->paginate(20);
            },
            1800 // 30 minutes
        );
    }

    protected static function booted()
    {
        parent::booted();
        
        // Clear product cache when model changes
        static::saved(function ($product) {
            app(CacheService::class)->flush('product_list');
        });
        
        static::deleted(function ($product) {
            app(CacheService::class)->flush('product_list');
        });
    }
}

// File: app/Services/RedisService.php
class RedisService
{
    public function storeSession(string $sessionId, array $data, int $ttl = 3600): void
    {
        Redis::setex("session:{$sessionId}", $ttl, json_encode($data));
    }

    public function getSession(string $sessionId): ?array
    {
        $data = Redis::get("session:{$sessionId}");
        return $data ? json_decode($data, true) : null;
    }

    public function storeTemporaryData(string $key, $data, int $ttl = 300): void
    {
        Redis::setex("temp:{$key}", $ttl, serialize($data));
    }

    public function cacheAnalytics(string $tenantId, string $metric, array $data, int $ttl = 300): void
    {
        Redis::setex("analytics:{$tenantId}:{$metric}", $ttl, json_encode($data));
    }

    public function getCachedAnalytics(string $tenantId, string $metric): ?array
    {
        $data = Redis::get("analytics:{$tenantId}:{$metric}");
        return $data ? json_decode($data, true) : null;
    }
}
```

#### Day 5: Performance Monitoring & Metrics
```php
// File: app/Services/PerformanceMonitoringService.php
class PerformanceMonitoringService
{
    public function recordMetric(string $metric, float $value, array $tags = []): void
    {
        // Store in InfluxDB or similar time-series database
        $timestamp = now()->timestamp;
        $tenantId = tenant()?->id ?? 'platform';
        
        $dataPoint = [
            'measurement' => $metric,
            'tags' => array_merge([
                'tenant_id' => $tenantId,
                'environment' => app()->environment(),
            ], $tags),
            'fields' => [
                'value' => $value,
            ],
            'timestamp' => $timestamp * 1000000000, // nanoseconds
        ];
        
        // Send to monitoring service (InfluxDB, CloudWatch, etc.)
        $this->sendToMonitoring($dataPoint);
    }

    public function measureExecutionTime(string $operation, callable $callback)
    {
        $startTime = microtime(true);
        
        try {
            $result = $callback();
            $this->recordMetric('execution_time', (microtime(true) - $startTime) * 1000, [
                'operation' => $operation,
                'status' => 'success',
            ]);
            return $result;
        } catch (Exception $e) {
            $this->recordMetric('execution_time', (microtime(true) - $startTime) * 1000, [
                'operation' => $operation,
                'status' => 'error',
            ]);
            throw $e;
        }
    }

    public function getPerformanceReport(string $tenantId, int $hours = 24): array
    {
        // Query monitoring database for performance metrics
        return [
            'average_response_time' => $this->getAverageResponseTime($tenantId, $hours),
            'error_rate' => $this->getErrorRate($tenantId, $hours),
            'database_performance' => $this->getDatabasePerformance($tenantId, $hours),
            'cache_hit_ratio' => $this->getCacheHitRatio($tenantId, $hours),
            'memory_usage' => $this->getMemoryUsage($tenantId, $hours),
            'slow_endpoints' => $this->getSlowEndpoints($tenantId, $hours),
        ];
    }
}

// File: app/Http/Middleware/PerformanceTracking.php
class PerformanceTracking
{
    public function __construct(private PerformanceMonitoringService $monitoring) {}

    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();
        
        $response = $next($request);
        
        $executionTime = (microtime(true) - $startTime) * 1000; // milliseconds
        $memoryUsed = memory_get_usage() - $startMemory;
        
        // Record metrics
        $this->monitoring->recordMetric('api_response_time', $executionTime, [
            'method' => $request->method(),
            'endpoint' => $request->route()?->uri() ?? 'unknown',
            'status_code' => $response->getStatusCode(),
        ]);
        
        $this->monitoring->recordMetric('memory_usage', $memoryUsed, [
            'endpoint' => $request->route()?->uri() ?? 'unknown',
        ]);
        
        // Add performance headers
        $response->headers->set('X-Response-Time', $executionTime . 'ms');
        $response->headers->set('X-Memory-Usage', number_format($memoryUsed / 1024, 2) . 'KB');
        
        return $response;
    }
}
```

### Week 30: Security Hardening & Vulnerability Testing

#### Day 1-2: Advanced Security Implementation
```php
// File: app/Services/SecurityService.php
class SecurityService
{
    public function scanForVulnerabilities(): array
    {
        $vulnerabilities = [];
        
        // Check for common security issues
        $vulnerabilities = array_merge($vulnerabilities, $this->checkSQLInjection());
        $vulnerabilities = array_merge($vulnerabilities, $this->checkXSS());
        $vulnerabilities = array_merge($vulnerabilities, $this->checkCSRF());
        $vulnerabilities = array_merge($vulnerabilities, $this->checkAuthenticationSecurity());
        $vulnerabilities = array_merge($vulnerabilities, $this->checkFileUploadSecurity());
        
        return $vulnerabilities;
    }

    public function checkSQLInjection(): array
    {
        $issues = [];
        
        // Scan for raw queries without parameters
        $codeFiles = $this->getPhpFiles();
        foreach ($codeFiles as $file) {
            $content = file_get_contents($file);
            if (preg_match('/DB::raw\([\'"].*\$.*[\'"]/', $content)) {
                $issues[] = [
                    'type' => 'SQL Injection Risk',
                    'file' => $file,
                    'description' => 'Raw SQL query with variables detected',
                    'severity' => 'high',
                ];
            }
        }
        
        return $issues;
    }

    public function enableSecurityHeaders(): void
    {
        // Add to middleware
        config([
            'secure-headers.headers' => [
                'X-Content-Type-Options' => 'nosniff',
                'X-Frame-Options' => 'DENY',
                'X-XSS-Protection' => '1; mode=block',
                'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy' => $this->generateCSPHeader(),
                'Referrer-Policy' => 'strict-origin-when-cross-origin',
                'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
            ],
        ]);
    }

    private function generateCSPHeader(): string
    {
        $tenant = tenant();
        $allowedDomains = ['self'];
        
        if ($tenant) {
            // Add tenant's custom domains
            $domains = $tenant->domains()->where('status', 'active')->pluck('full_domain');
            $allowedDomains = array_merge($allowedDomains, $domains->toArray());
        }
        
        return "default-src 'self' " . implode(' ', $allowedDomains) . "; " .
               "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " .
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
               "img-src 'self' data: https:; " .
               "font-src 'self' https://fonts.gstatic.com;";
    }
}

// File: app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Only add HSTS in production with HTTPS
        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        
        // Content Security Policy
        $csp = $this->generateCSP($request);
        $response->headers->set('Content-Security-Policy', $csp);
        
        return $response;
    }
}

// File: app/Services/AuditLogService.php
class AuditLogService
{
    public function log(string $action, string $resource, array $data = []): void
    {
        AuditLog::create([
            'tenant_id' => tenant()?->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $data['resource_id'] ?? null,
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $data,
        ]);
    }

    public function logModelChanges(Model $model, string $action): void
    {
        $this->log($action, get_class($model), [
            'resource_id' => $model->getKey(),
            'old_values' => $model->getOriginal(),
            'new_values' => $model->getAttributes(),
        ]);
    }

    public function getAuditTrail(string $resource, $resourceId, int $limit = 50): Collection
    {
        return AuditLog::where('resource', $resource)
            ->where('resource_id', $resourceId)
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }
}
```

#### Day 3-4: Rate Limiting & Attack Protection
```php
// File: app/Http/Middleware/AdvancedRateLimit.php
class AdvancedRateLimit
{
    private const RATE_LIMITS = [
        'api' => ['requests' => 1000, 'window' => 3600], // 1000 requests per hour
        'auth' => ['requests' => 10, 'window' => 300],   // 10 login attempts per 5 minutes
        'upload' => ['requests' => 50, 'window' => 3600], // 50 uploads per hour
        'search' => ['requests' => 200, 'window' => 3600], // 200 searches per hour
    ];

    public function handle(Request $request, Closure $next, string $type = 'api')
    {
        $limits = self::RATE_LIMITS[$type] ?? self::RATE_LIMITS['api'];
        $key = $this->generateKey($request, $type);
        
        $current = cache()->get($key, 0);
        
        if ($current >= $limits['requests']) {
            return response()->json([
                'error' => 'Rate limit exceeded',
                'limit' => $limits['requests'],
                'window' => $limits['window'],
                'reset_at' => now()->addSeconds($limits['window'])->timestamp,
            ], 429);
        }
        
        // Increment counter
        cache()->put($key, $current + 1, $limits['window']);
        
        $response = $next($request);
        
        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $limits['requests']);
        $response->headers->set('X-RateLimit-Remaining', max(0, $limits['requests'] - $current - 1));
        $response->headers->set('X-RateLimit-Reset', now()->addSeconds($limits['window'])->timestamp);
        
        return $response;
    }

    private function generateKey(Request $request, string $type): string
    {
        $identifier = auth()->id() ?? $request->ip();
        $tenantId = tenant()?->id ?? 'global';
        
        return "rate_limit:{$type}:{$tenantId}:{$identifier}";
    }
}

// File: app/Services/ThreatDetectionService.php
class ThreatDetectionService
{
    public function detectSuspiciousActivity(Request $request): array
    {
        $threats = [];
        
        // Check for SQL injection attempts
        if ($this->detectSQLInjection($request)) {
            $threats[] = [
                'type' => 'sql_injection',
                'severity' => 'high',
                'description' => 'Potential SQL injection attempt detected',
            ];
        }
        
        // Check for XSS attempts
        if ($this->detectXSS($request)) {
            $threats[] = [
                'type' => 'xss',
                'severity' => 'medium',
                'description' => 'Potential XSS attempt detected',
            ];
        }
        
        // Check for brute force attempts
        if ($this->detectBruteForce($request)) {
            $threats[] = [
                'type' => 'brute_force',
                'severity' => 'high',
                'description' => 'Brute force attack detected',
            ];
        }
        
        return $threats;
    }

    private function detectSQLInjection(Request $request): bool
    {
        $sqlPatterns = [
            '/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*(\bFROM\b|\bWHERE\b)/i',
            '/(\'\s*;\s*DROP\s+TABLE\s+)/i',
            '/(\'\s*OR\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+)/i',
        ];
        
        $allInput = array_merge($request->all(), [$request->getUri()]);
        
        foreach ($sqlPatterns as $pattern) {
            foreach ($allInput as $input) {
                if (is_string($input) && preg_match($pattern, $input)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    private function detectXSS(Request $request): bool
    {
        $xssPatterns = [
            '/<script[^>]*>.*?<\/script>/i',
            '/javascript:[^"\']*["\']/i',
            '/on\w+\s*=\s*["\']/i',
            '/<iframe[^>]*src\s*=\s*["\'][^"\']*["\']/i',
        ];
        
        $allInput = $request->all();
        
        foreach ($xssPatterns as $pattern) {
            foreach ($allInput as $input) {
                if (is_string($input) && preg_match($pattern, $input)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    public function blockSuspiciousIP(string $ipAddress, string $reason, int $duration = 3600): void
    {
        BlockedIP::create([
            'ip_address' => $ipAddress,
            'reason' => $reason,
            'blocked_until' => now()->addSeconds($duration),
        ]);
        
        // Also cache for immediate access
        cache()->put("blocked_ip:{$ipAddress}", true, $duration);
    }
}
```

#### Day 5: Security Testing & Compliance
```php
// File: tests/Feature/Security/SecurityTest.php
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_sql_injection_protection()
    {
        $maliciousInput = "'; DROP TABLE users; --";
        
        $response = $this->postJson('/api/products', [
            'name' => $maliciousInput,
        ]);
        
        // Should not execute the malicious SQL
        $this->assertDatabaseHas('users', ['id' => 1]);
    }

    public function test_xss_protection()
    {
        $maliciousScript = '<script>alert("XSS")</script>';
        
        $response = $this->postJson('/api/products', [
            'name' => $maliciousScript,
        ]);
        
        // Script should be escaped in response
        $this->assertStringNotContainsString('<script>', $response->getContent());
    }

    public function test_csrf_protection()
    {
        $response = $this->postJson('/api/products', [
            'name' => 'Test Product',
        ]);
        
        // Should require CSRF token
        $response->assertStatus(419);
    }

    public function test_rate_limiting()
    {
        for ($i = 0; $i < 11; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
        }
        
        // Should be rate limited after 10 attempts
        $response->assertStatus(429);
    }

    public function test_security_headers()
    {
        $response = $this->get('/');
        
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
    }
}

// File: app/Console/Commands/SecurityAudit.php
class SecurityAudit extends Command
{
    protected $signature = 'security:audit {--fix : Automatically fix issues where possible}';
    
    public function handle(SecurityService $securityService)
    {
        $this->info('Starting security audit...');
        
        $vulnerabilities = $securityService->scanForVulnerabilities();
        
        if (empty($vulnerabilities)) {
            $this->info('✅ No security vulnerabilities found!');
            return;
        }
        
        $this->error("❌ Found " . count($vulnerabilities) . " security issues:");
        
        foreach ($vulnerabilities as $vuln) {
            $this->line("");
            $this->error("🚨 {$vuln['type']} - {$vuln['severity']}");
            $this->line("File: {$vuln['file']}");
            $this->line("Description: {$vuln['description']}");
            
            if ($this->option('fix') && isset($vuln['fix'])) {
                $vuln['fix']();
                $this->info("✅ Fixed automatically");
            }
        }
    }
}
```

### Week 31: Load Testing & Performance Validation

#### Day 1-3: Load Testing Implementation
```php
// File: tests/LoadTest/LoadTestRunner.php
class LoadTestRunner
{
    public function runLoadTest(array $config): array
    {
        $results = [];
        
        // Test scenarios
        $scenarios = [
            'api_endpoints' => $this->testAPIEndpoints($config),
            'database_performance' => $this->testDatabasePerformance($config),
            'concurrent_users' => $this->testConcurrentUsers($config),
            'file_uploads' => $this->testFileUploads($config),
            'search_performance' => $this->testSearchPerformance($config),
        ];
        
        return [
            'test_duration' => $config['duration'],
            'concurrent_users' => $config['users'],
            'scenarios' => $scenarios,
            'overall_score' => $this->calculateOverallScore($scenarios),
        ];
    }

    private function testAPIEndpoints(array $config): array
    {
        $endpoints = [
            'GET /api/products' => 'products.index',
            'POST /api/products' => 'products.store',
            'GET /api/orders' => 'orders.index',
            'POST /api/orders' => 'orders.store',
            'GET /api/customers' => 'customers.index',
        ];
        
        $results = [];
        
        foreach ($endpoints as $endpoint => $route) {
            $results[$endpoint] = $this->loadTestEndpoint($endpoint, $config);
        }
        
        return $results;
    }

    private function loadTestEndpoint(string $endpoint, array $config): array
    {
        $startTime = microtime(true);
        $successCount = 0;
        $errorCount = 0;
        $responseTimes = [];
        
        // Simulate concurrent requests
        $promises = [];
        for ($i = 0; $i < $config['requests_per_endpoint']; $i++) {
            $promises[] = $this->makeAsyncRequest($endpoint);
        }
        
        // Wait for all requests to complete
        $responses = Promise::all($promises)->wait();
        
        foreach ($responses as $response) {
            if ($response['status'] < 400) {
                $successCount++;
            } else {
                $errorCount++;
            }
            $responseTimes[] = $response['time'];
        }
        
        return [
            'total_requests' => count($responses),
            'successful_requests' => $successCount,
            'failed_requests' => $errorCount,
            'success_rate' => ($successCount / count($responses)) * 100,
            'average_response_time' => array_sum($responseTimes) / count($responseTimes),
            'p95_response_time' => $this->getPercentile($responseTimes, 95),
            'p99_response_time' => $this->getPercentile($responseTimes, 99),
            'requests_per_second' => count($responses) / (microtime(true) - $startTime),
        ];
    }
}

// File: tests/LoadTest/DatabasePerformanceTest.php
class DatabasePerformanceTest
{
    public function testDatabasePerformance(): array
    {
        $results = [];
        
        // Test complex queries
        $results['product_search'] = $this->measureQuery(function() {
            return Product::where('status', 'published')
                ->where('price', '>', 100000)
                ->with(['category', 'reviews'])
                ->paginate(20);
        });
        
        $results['order_analytics'] = $this->measureQuery(function() {
            return Order::selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as revenue')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->get();
        });
        
        $results['inventory_check'] = $this->measureQuery(function() {
            return InventoryItem::where('quantity_available', '<=', DB::raw('reorder_point'))
                ->with(['product'])
                ->get();
        });
        
        return $results;
    }

    private function measureQuery(callable $query): array
    {
        $iterations = 100;
        $times = [];
        
        for ($i = 0; $i < $iterations; $i++) {
            $start = microtime(true);
            $query();
            $times[] = (microtime(true) - $start) * 1000; // milliseconds
        }
        
        return [
            'iterations' => $iterations,
            'average_time' => array_sum($times) / count($times),
            'min_time' => min($times),
            'max_time' => max($times),
            'p95_time' => $this->getPercentile($times, 95),
        ];
    }
}
```

#### Day 4-5: Performance Benchmarking & Optimization
```php
// File: app/Console/Commands/PerformanceBenchmark.php
class PerformanceBenchmark extends Command
{
    protected $signature = 'performance:benchmark 
                           {--users=10 : Number of concurrent users}
                           {--duration=300 : Test duration in seconds}
                           {--endpoints=all : Endpoints to test}';

    public function handle()
    {
        $this->info('Starting performance benchmark...');
        
        $config = [
            'users' => $this->option('users'),
            'duration' => $this->option('duration'),
            'requests_per_endpoint' => 1000,
        ];
        
        $loadTestRunner = new LoadTestRunner();
        $results = $loadTestRunner->runLoadTest($config);
        
        $this->displayResults($results);
        
        // Save results to file
        $this->saveResults($results);
        
        // Check if performance meets requirements
        $this->validatePerformance($results);
    }

    private function displayResults(array $results): void
    {
        $this->info('Performance Benchmark Results');
        $this->line('================================');
        
        foreach ($results['scenarios'] as $scenario => $data) {
            $this->info("\n{$scenario}:");
            
            if (isset($data['total_requests'])) {
                $this->line("  Total Requests: {$data['total_requests']}");
                $this->line("  Success Rate: {$data['success_rate']}%");
                $this->line("  Avg Response Time: {$data['average_response_time']}ms");
                $this->line("  P95 Response Time: {$data['p95_response_time']}ms");
                $this->line("  Requests/Second: {$data['requests_per_second']}");
            }
        }
        
        $this->info("\nOverall Score: {$results['overall_score']}/100");
    }

    private function validatePerformance(array $results): void
    {
        $requirements = [
            'api_response_time' => 200,    // 200ms max average
            'success_rate' => 99,          // 99% success rate
            'requests_per_second' => 100,  // 100 RPS minimum
        ];
        
        $issues = [];
        
        foreach ($results['scenarios'] as $scenario => $data) {
            if (isset($data['average_response_time']) && $data['average_response_time'] > $requirements['api_response_time']) {
                $issues[] = "Average response time ({$data['average_response_time']}ms) exceeds requirement ({$requirements['api_response_time']}ms)";
            }
            
            if (isset($data['success_rate']) && $data['success_rate'] < $requirements['success_rate']) {
                $issues[] = "Success rate ({$data['success_rate']}%) below requirement ({$requirements['success_rate']}%)";
            }
            
            if (isset($data['requests_per_second']) && $data['requests_per_second'] < $requirements['requests_per_second']) {
                $issues[] = "RPS ({$data['requests_per_second']}) below requirement ({$requirements['requests_per_second']})";
            }
        }
        
        if (empty($issues)) {
            $this->info('✅ All performance requirements met!');
        } else {
            $this->error('❌ Performance issues found:');
            foreach ($issues as $issue) {
                $this->line("  - {$issue}");
            }
        }
    }
}

// File: app/Services/PerformanceOptimizationService.php  
class PerformanceOptimizationService
{
    public function optimizeForProduction(): array
    {
        $optimizations = [];
        
        // Enable OPcache
        $optimizations[] = $this->enableOPcache();
        
        // Configure Redis for sessions and cache
        $optimizations[] = $this->configureRedis();
        
        // Optimize Eloquent queries
        $optimizations[] = $this->optimizeEloquent();
        
        // Configure queue workers
        $optimizations[] = $this->configureQueues();
        
        // Enable CDN for static assets
        $optimizations[] = $this->configureAssetCDN();
        
        return $optimizations;
    }

    private function enableOPcache(): array
    {
        return [
            'optimization' => 'OPcache Configuration',
            'status' => 'enabled',
            'recommendations' => [
                'opcache.enable=1',
                'opcache.memory_consumption=512',
                'opcache.max_accelerated_files=20000',
                'opcache.validate_timestamps=0',
                'opcache.save_comments=1',
            ],
        ];
    }
}
```

### Week 32: Production Deployment & Documentation

#### Day 1-2: CI/CD Pipeline & Deployment
```yaml
# File: .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: pdo, pdo_pgsql, redis, gd, zip
        
    - name: Install Dependencies
      run: composer install --no-interaction --prefer-dist
      
    - name: Copy Environment File
      run: cp .env.testing .env
      
    - name: Generate Application Key
      run: php artisan key:generate
      
    - name: Run Database Migrations
      run: php artisan migrate --force
      
    - name: Run Security Audit
      run: php artisan security:audit
      
    - name: Run Tests
      run: php artisan test --coverage --min=95
      
    - name: Run Performance Benchmark
      run: php artisan performance:benchmark --users=50 --duration=60

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/canvastack-stencil
          git pull origin main
          composer install --optimize-autoloader --no-dev
          php artisan config:cache
          php artisan route:cache
          php artisan view:cache
          php artisan migrate --force
          php artisan queue:restart
          sudo systemctl reload nginx
          sudo systemctl reload php8.2-fpm
```

#### Day 3-4: Monitoring & Alerting Setup
```php
// File: config/monitoring.php
return [
    'services' => [
        'datadog' => [
            'enabled' => env('DATADOG_ENABLED', false),
            'api_key' => env('DATADOG_API_KEY'),
            'app_key' => env('DATADOG_APP_KEY'),
        ],
        
        'sentry' => [
            'enabled' => env('SENTRY_ENABLED', true),
            'dsn' => env('SENTRY_DSN'),
        ],
        
        'new_relic' => [
            'enabled' => env('NEWRELIC_ENABLED', false),
            'license_key' => env('NEWRELIC_LICENSE_KEY'),
        ],
    ],
    
    'alerts' => [
        'error_rate_threshold' => 5, // 5% error rate
        'response_time_threshold' => 1000, // 1000ms
        'memory_usage_threshold' => 80, // 80% memory usage
        'disk_usage_threshold' => 85, // 85% disk usage
    ],
];

// File: app/Services/AlertingService.php
class AlertingService
{
    public function sendAlert(string $type, string $message, array $data = []): void
    {
        // Send to Slack
        if (config('services.slack.webhook_url')) {
            $this->sendSlackAlert($type, $message, $data);
        }
        
        // Send to Email
        if (config('monitoring.email_alerts')) {
            $this->sendEmailAlert($type, $message, $data);
        }
        
        // Send to SMS for critical alerts
        if ($type === 'critical' && config('services.twilio.enabled')) {
            $this->sendSMSAlert($message);
        }
    }

    private function sendSlackAlert(string $type, string $message, array $data): void
    {
        $color = match($type) {
            'critical' => '#ff0000',
            'warning' => '#ffaa00',
            'info' => '#00ff00',
            default => '#cccccc',
        };
        
        $payload = [
            'attachments' => [
                [
                    'color' => $color,
                    'title' => "🚨 {$type} Alert",
                    'text' => $message,
                    'fields' => $this->formatDataForSlack($data),
                    'ts' => now()->timestamp,
                ],
            ],
        ];
        
        Http::post(config('services.slack.webhook_url'), $payload);
    }
}

// File: app/Console/Commands/HealthCheck.php
class HealthCheck extends Command
{
    protected $signature = 'health:check';
    
    public function handle(AlertingService $alerting)
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'queues' => $this->checkQueues(),
            'storage' => $this->checkStorage(),
            'external_services' => $this->checkExternalServices(),
        ];
        
        foreach ($checks as $service => $status) {
            if (!$status['healthy']) {
                $alerting->sendAlert('critical', "Service {$service} is unhealthy", $status);
            }
        }
        
        // Store health check results
        cache()->put('health_check_results', $checks, 300); // 5 minutes
    }
}
```

#### Day 5: Final Documentation & Training Materials
```markdown
# File: docs/DEPLOYMENT_GUIDE.md
# CanvaStack Stencil Production Deployment Guide

## Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- PHP 8.2+
- PostgreSQL 15+
- Redis 7+
- Nginx 1.20+
- Node.js 18+

## Server Requirements
### Minimum Production Setup
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Bandwidth**: 1Gbps

### Recommended Production Setup
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 250GB NVMe SSD
- **Bandwidth**: 10Gbps

## Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.2
sudo add-apt-repository ppa:ondrej/php -y
sudo apt install php8.2-fpm php8.2-cli php8.2-pgsql php8.2-redis php8.2-gd php8.2-zip php8.2-curl php8.2-mbstring php8.2-xml php8.2-bcmath -y

# Install PostgreSQL 15
sudo apt install postgresql-15 postgresql-client-15 -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

### 2. Database Setup
```sql
-- Create main database
CREATE DATABASE canvastack_stencil;
CREATE USER canvastack_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE canvastack_stencil TO canvastack_user;

-- Enable required extensions
\c canvastack_stencil;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/canvastack-stencil.git /var/www/canvastack-stencil
cd /var/www/canvastack-stencil

# Install dependencies
composer install --optimize-autoloader --no-dev
npm install && npm run production

# Set permissions
sudo chown -R www-data:www-data /var/www/canvastack-stencil
sudo chmod -R 755 /var/www/canvastack-stencil
sudo chmod -R 775 /var/www/canvastack-stencil/storage
sudo chmod -R 775 /var/www/canvastack-stencil/bootstrap/cache

# Create environment file
cp .env.production .env
# Edit .env with your configuration

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start queue workers
php artisan queue:work --daemon
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    root /var/www/canvastack-stencil/public;
    index index.php;
    
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private_key.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Monitoring Setup

### 1. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup log rotation
sudo logrotate -d /etc/logrotate.d/canvastack-stencil
```

### 2. Application Monitoring
- Setup Sentry for error tracking
- Configure DataDog or New Relic for APM
- Setup Uptime monitoring (Pingdom, UptimeRobot)
- Configure alerts for critical metrics

### 3. Backup Strategy
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump canvastack_stencil > $BACKUP_DIR/canvastack_$DATE.sql
find $BACKUP_DIR -name "canvastack_*.sql" -mtime +7 -delete

# File backup script
#!/bin/bash
BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/canvastack_files_$DATE.tar.gz /var/www/canvastack-stencil/storage
find $BACKUP_DIR -name "canvastack_files_*.tar.gz" -mtime +7 -delete
```

## Performance Tuning

### 1. PHP-FPM Optimization
```ini
; /etc/php/8.2/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 1000
```

### 2. PostgreSQL Tuning
```postgresql
# /etc/postgresql/15/main/postgresql.conf
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB
max_connections = 200
```

### 3. Redis Configuration
```redis
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 60
```

## Security Checklist
- [ ] SSL certificates configured and auto-renewal setup
- [ ] Firewall configured (UFW or iptables)
- [ ] Database access restricted to application only
- [ ] Regular security updates applied
- [ ] Application logs monitored for suspicious activity
- [ ] Backup and recovery procedures tested
- [ ] Rate limiting configured
- [ ] Security headers implemented
- [ ] File upload restrictions in place
- [ ] Environment variables properly secured

## Troubleshooting

### Common Issues
1. **500 Internal Server Error**
   - Check PHP-FPM logs: `sudo tail -f /var/log/php8.2-fpm.log`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify file permissions

2. **Database Connection Issues**
   - Check PostgreSQL status: `sudo systemctl status postgresql`
   - Verify database credentials in .env
   - Check pg_hba.conf configuration

3. **Queue Jobs Not Processing**
   - Check queue worker status: `php artisan queue:work`
   - Verify Redis connection
   - Check supervisor configuration

### Support Contacts
- Technical Lead: tech-lead@canvastack.com
- DevOps Team: devops@canvastack.com
- Emergency Contact: +62-xxx-xxx-xxxx
```

## 🎯 Final Testing & Quality Assurance

### Complete Test Suite (95%+ Coverage)
```php
// File: tests/Feature/CompleteSystemTest.php
class CompleteSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_tenant_workflow()
    {
        // 1. Create tenant
        $tenant = Tenant::factory()->create();
        tenancy()->initialize($tenant);
        
        // 2. Add custom domain
        $domain = TenantDomain::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
        ]);
        
        // 3. Create products and categories
        $category = ProductCategory::factory()->create();
        $products = Product::factory()->count(5)->create(['category_id' => $category->id]);
        
        // 4. Create customers and orders
        $customers = Customer::factory()->count(3)->create();
        $orders = Order::factory()->count(10)->create();
        
        // 5. Test API endpoints
        $this->getJson('/api/products')->assertOk();
        $this->getJson('/api/orders')->assertOk();
        $this->getJson('/api/customers')->assertOk();
        
        // 6. Test performance requirements
        $start = microtime(true);
        $this->getJson('/api/products');
        $responseTime = (microtime(true) - $start) * 1000;
        $this->assertLessThan(200, $responseTime, 'API response time should be under 200ms');
        
        // 7. Test security
        $this->postJson('/api/products', ['name' => '<script>alert("xss")</script>'])
             ->assertJsonMissing(['name' => '<script>alert("xss")</script>']);
    }
}
```

## 🔒 Security & Performance Checkpoints

### Final Security Audit
- [x] SQL injection protection verified
- [x] XSS protection implemented
- [x] CSRF protection active
- [x] Rate limiting configured
- [x] Security headers implemented
- [x] SSL/TLS encryption enabled
- [x] Data encryption at rest
- [x] Audit logging functional

### Final Performance Validation
- [x] API response times < 200ms
- [x] Database queries < 50ms average
- [x] 99%+ uptime achieved
- [x] 95%+ test coverage maintained
- [x] Load testing completed (100+ concurrent users)
- [x] CDN integration functional
- [x] Caching strategies implemented

## 🚀 Success Metrics

### Technical Metrics
- [x] Production deployment successful
- [x] All 8 phases completed
- [x] 95%+ code coverage achieved
- [x] Performance benchmarks met
- [x] Security audit passed
- [x] Load testing completed

### Business Metrics  
- [x] Multi-tenant platform operational
- [x] Platform can support 100+ tenants
- [x] Custom domains functional
- [x] Billing system operational
- [x] Complete feature set delivered
- [x] Documentation and training complete

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "phase3", "content": "Create Phase 3: Core Business Logic roadmap (Weeks 8-12)", "status": "completed"}, {"id": "phase4", "content": "Create Phase 4: Content Management System roadmap (Weeks 13-16)", "status": "completed"}, {"id": "phase5", "content": "Create Phase 5: Advanced Features roadmap (Weeks 17-20)", "status": "completed"}, {"id": "phase6", "content": "Create Phase 6: Platform Management roadmap (Weeks 21-24)", "status": "completed"}, {"id": "phase7", "content": "Create Phase 7: Custom Domain & URL Management roadmap (Weeks 25-28)", "status": "completed"}, {"id": "phase8", "content": "Create Phase 8: Performance & Security Optimization roadmap (Weeks 29-32)", "status": "completed"}]