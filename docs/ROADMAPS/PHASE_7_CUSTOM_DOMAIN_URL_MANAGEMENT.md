# Phase 7: Custom Domain & URL Management
**Duration**: 4 Weeks (Weeks 25-28)  
**Priority**: MEDIUM  
**Prerequisites**: Phase 1-6 (Complete platform with all business and management features)

## 🎯 Phase Overview

This phase implements advanced URL routing and custom domain management, enabling tenants to use their own domains while maintaining multi-tenant architecture. This includes automated SSL certificate provisioning, domain verification, and seamless routing between subdirectory and custom domain patterns.

### Key Deliverables
- **Custom Domain Management** with automated DNS verification
- **SSL Certificate Automation** with Let's Encrypt integration  
- **Dynamic Routing System** supporting both subdirectory and custom domains
- **CDN Integration** for global content delivery
- **Domain Health Monitoring** with SSL expiration tracking
- **SEO-Friendly URL Structure** with proper redirects

## 📋 Week-by-Week Breakdown

### Week 25: Domain Management Foundation

#### Day 1-2: Domain Models & DNS Management
```php
// File: database/migrations/create_tenant_domains_table.php
Schema::create('tenant_domains', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('domain'); // example.com
    $table->string('subdomain')->nullable(); // www, shop, store
    $table->string('full_domain')->index(); // www.example.com or example.com
    $table->enum('type', ['primary', 'redirect', 'alias'])->default('primary');
    $table->enum('status', ['pending', 'active', 'failed', 'suspended'])->default('pending');
    $table->boolean('is_custom')->default(true); // false for platform subdomains
    $table->json('dns_records')->nullable(); // Required DNS records
    $table->datetime('verified_at')->nullable();
    $table->datetime('ssl_issued_at')->nullable();
    $table->datetime('ssl_expires_at')->nullable();
    $table->string('ssl_provider')->nullable(); // letsencrypt, custom, etc.
    $table->json('ssl_details')->nullable(); // Certificate details
    $table->text('verification_token')->nullable(); // For domain verification
    $table->json('redirect_settings')->nullable(); // Redirect configuration
    $table->boolean('force_https')->default(true);
    $table->boolean('cdn_enabled')->default(false);
    $table->string('cdn_provider')->nullable(); // cloudflare, aws, etc.
    $table->json('cdn_settings')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->unique(['full_domain']);
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'type']);
});

// File: database/migrations/create_domain_verification_attempts_table.php
Schema::create('domain_verification_attempts', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('domain_id');
    $table->enum('method', ['dns', 'http', 'email']); // Verification method
    $table->string('challenge_type'); // TXT record, file upload, email click
    $table->string('challenge_value'); // Expected value or token
    $table->string('expected_response'); // What we expect to find
    $table->string('actual_response')->nullable(); // What we actually found
    $table->enum('status', ['pending', 'completed', 'failed', 'expired'])->default('pending');
    $table->datetime('expires_at');
    $table->text('error_message')->nullable();
    $table->integer('attempt_count')->default(0);
    $table->datetime('last_attempt_at')->nullable();
    $table->timestamps();
    
    $table->foreign('tenant_id')->references('id')->on('tenants');
    $table->foreign('domain_id')->references('id')->on('tenant_domains');
    $table->index(['domain_id', 'status']);
});
```

#### Day 3-4: Domain Management Models & Services
```php
// File: app/Models/TenantDomain.php
class TenantDomain extends Model
{
    protected $fillable = [
        'tenant_id', 'domain', 'subdomain', 'full_domain', 'type', 'status',
        'is_custom', 'dns_records', 'verified_at', 'ssl_issued_at', 'ssl_expires_at',
        'ssl_provider', 'ssl_details', 'verification_token', 'redirect_settings',
        'force_https', 'cdn_enabled', 'cdn_provider', 'cdn_settings'
    ];

    protected $casts = [
        'dns_records' => 'array',
        'ssl_details' => 'array',
        'redirect_settings' => 'array',
        'cdn_settings' => 'array',
        'is_custom' => 'boolean',
        'force_https' => 'boolean',
        'cdn_enabled' => 'boolean',
        'verified_at' => 'datetime',
        'ssl_issued_at' => 'datetime',
        'ssl_expires_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function verificationAttempts(): HasMany
    {
        return $this->hasMany(DomainVerificationAttempt::class, 'domain_id');
    }

    public function getFullDomainAttribute(): string
    {
        if ($this->subdomain) {
            return $this->subdomain . '.' . $this->domain;
        }
        return $this->domain;
    }

    public function isVerified(): bool
    {
        return $this->status === 'active' && !is_null($this->verified_at);
    }

    public function hasValidSSL(): bool
    {
        return !is_null($this->ssl_issued_at) 
            && ($this->ssl_expires_at === null || $this->ssl_expires_at > now());
    }

    public function needsSSLRenewal(): bool
    {
        return $this->ssl_expires_at && $this->ssl_expires_at->subDays(30) < now();
    }

    public function generateVerificationToken(): string
    {
        $token = Str::random(64);
        $this->update(['verification_token' => $token]);
        return $token;
    }

    protected static function booted()
    {
        static::creating(function ($domain) {
            if (!$domain->full_domain) {
                $domain->full_domain = $domain->subdomain 
                    ? $domain->subdomain . '.' . $domain->domain
                    : $domain->domain;
            }
        });

        static::created(function ($domain) {
            // Start domain verification process
            DomainVerificationJob::dispatch($domain);
        });
    }
}

// File: app/Services/DomainService.php
class DomainService
{
    public function __construct(
        private DNSService $dnsService,
        private SSLService $sslService,
        private CDNService $cdnService
    ) {}

    public function addCustomDomain(Tenant $tenant, string $domain, string $subdomain = null): TenantDomain
    {
        // Validate domain format
        if (!$this->isValidDomain($domain)) {
            throw new InvalidDomainException("Invalid domain format: {$domain}");
        }

        // Check if domain is already taken
        $fullDomain = $subdomain ? "{$subdomain}.{$domain}" : $domain;
        if (TenantDomain::where('full_domain', $fullDomain)->exists()) {
            throw new DomainAlreadyExistsException("Domain {$fullDomain} is already in use");
        }

        $tenantDomain = TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => $domain,
            'subdomain' => $subdomain,
            'full_domain' => $fullDomain,
            'type' => 'primary',
            'status' => 'pending',
            'is_custom' => true,
            'verification_token' => Str::random(64),
            'dns_records' => $this->generateRequiredDNSRecords($fullDomain),
        ]);

        return $tenantDomain;
    }

    public function verifyDomain(TenantDomain $domain): bool
    {
        // Create verification attempt
        $attempt = DomainVerificationAttempt::create([
            'tenant_id' => $domain->tenant_id,
            'domain_id' => $domain->id,
            'method' => 'dns',
            'challenge_type' => 'TXT',
            'challenge_value' => "_canvastack-verification.{$domain->full_domain}",
            'expected_response' => "canvastack-verification={$domain->verification_token}",
            'status' => 'pending',
            'expires_at' => now()->addHours(72),
        ]);

        try {
            // Check DNS TXT record
            $txtRecords = $this->dnsService->getTXTRecords("_canvastack-verification.{$domain->full_domain}");
            $expectedValue = "canvastack-verification={$domain->verification_token}";
            
            $attempt->update([
                'actual_response' => implode(', ', $txtRecords),
                'last_attempt_at' => now(),
                'attempt_count' => $attempt->attempt_count + 1,
            ]);

            if (in_array($expectedValue, $txtRecords)) {
                // Domain verified successfully
                $domain->update([
                    'status' => 'active',
                    'verified_at' => now(),
                ]);

                $attempt->update(['status' => 'completed']);

                // Start SSL certificate provisioning
                $this->provisionSSLCertificate($domain);

                return true;
            }

            $attempt->update([
                'status' => 'failed',
                'error_message' => 'TXT record not found or incorrect value'
            ]);

            return false;

        } catch (Exception $e) {
            $attempt->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            return false;
        }
    }

    public function provisionSSLCertificate(TenantDomain $domain): bool
    {
        try {
            $certificate = $this->sslService->issueCertificate($domain->full_domain);

            $domain->update([
                'ssl_issued_at' => now(),
                'ssl_expires_at' => $certificate['expires_at'],
                'ssl_provider' => 'letsencrypt',
                'ssl_details' => $certificate,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('SSL certificate provisioning failed', [
                'domain' => $domain->full_domain,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    private function generateRequiredDNSRecords(string $domain): array
    {
        $platformIP = config('app.platform_ip', '127.0.0.1');
        
        return [
            [
                'type' => 'A',
                'name' => '@',
                'value' => $platformIP,
                'description' => 'Points your domain to our platform'
            ],
            [
                'type' => 'CNAME',
                'name' => 'www',
                'value' => $domain . '.',
                'description' => 'Redirects www subdomain to your main domain'
            ],
            [
                'type' => 'TXT',
                'name' => '_canvastack-verification',
                'value' => "canvastack-verification={$domain->verification_token}",
                'description' => 'Used for domain ownership verification'
            ]
        ];
    }

    private function isValidDomain(string $domain): bool
    {
        return filter_var("http://{$domain}", FILTER_VALIDATE_URL) !== false;
    }
}
```

#### Day 5: Domain Management API
```php
// File: app/Http/Controllers/Api/DomainController.php
class DomainController extends Controller
{
    public function __construct(private DomainService $domainService) {}

    public function index(Request $request)
    {
        $domains = TenantDomain::query()
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->with(['verificationAttempts' => fn($q) => $q->latest()->limit(5)])
            ->latest()
            ->paginate($request->limit ?? 20);

        return TenantDomainResource::collection($domains);
    }

    public function store(AddDomainRequest $request)
    {
        $tenant = tenant();
        
        $domain = $this->domainService->addCustomDomain(
            $tenant,
            $request->domain,
            $request->subdomain
        );

        return new TenantDomainResource($domain);
    }

    public function verify(TenantDomain $domain)
    {
        $verified = $this->domainService->verifyDomain($domain);

        return response()->json([
            'domain' => new TenantDomainResource($domain->fresh()),
            'verified' => $verified,
            'message' => $verified 
                ? 'Domain verified successfully' 
                : 'Domain verification failed. Please check your DNS records.'
        ]);
    }

    public function checkStatus(TenantDomain $domain)
    {
        // Force refresh domain status
        $this->domainService->checkDomainHealth($domain);
        
        return new TenantDomainResource($domain->fresh());
    }

    public function renewSSL(TenantDomain $domain)
    {
        if (!$domain->isVerified()) {
            return response()->json(['error' => 'Domain must be verified before SSL renewal'], 400);
        }

        $renewed = $this->domainService->provisionSSLCertificate($domain);

        return response()->json([
            'domain' => new TenantDomainResource($domain->fresh()),
            'renewed' => $renewed,
            'message' => $renewed 
                ? 'SSL certificate renewed successfully'
                : 'SSL certificate renewal failed'
        ]);
    }

    public function destroy(TenantDomain $domain)
    {
        if ($domain->type === 'primary') {
            return response()->json(['error' => 'Cannot delete primary domain'], 400);
        }

        $domain->delete();
        
        return response()->json(['message' => 'Domain deleted successfully']);
    }
}
```

### Week 26: Dynamic Routing & Middleware System

#### Day 1-3: Multi-Tenant Routing Implementation
```php
// File: app/Http/Middleware/IdentifyTenantByDomain.php
class IdentifyTenantByDomain
{
    public function handle(Request $request, Closure $next)
    {
        $host = $request->getHost();
        $tenant = $this->resolveTenantFromHost($host);

        if (!$tenant) {
            // Check if it's a platform admin request
            if ($this->isPlatformDomain($host)) {
                return $next($request);
            }
            
            // Redirect to main platform or show 404
            return response()->view('errors.domain-not-found', ['domain' => $host], 404);
        }

        // Initialize tenant context
        tenancy()->initialize($tenant);
        
        // Add tenant info to request
        $request->attributes->set('tenant', $tenant);
        $request->attributes->set('domain_type', $this->getDomainType($host));

        return $next($request);
    }

    private function resolveTenantFromHost(string $host): ?Tenant
    {
        // First, try to find by custom domain
        $domain = TenantDomain::where('full_domain', $host)
            ->where('status', 'active')
            ->with('tenant')
            ->first();

        if ($domain) {
            return $domain->tenant;
        }

        // Then try subdirectory pattern: canvastencil.com/tenant_slug
        $pathInfo = request()->getPathInfo();
        if (preg_match('/^\/([^\/]+)/', $pathInfo, $matches)) {
            $tenantSlug = $matches[1];
            
            // Skip if it's an API or admin route
            if (in_array($tenantSlug, ['api', 'admin', 'platform'])) {
                return null;
            }

            return Tenant::where('id', $tenantSlug)
                ->orWhere('slug', $tenantSlug)
                ->first();
        }

        return null;
    }

    private function isPlatformDomain(string $host): bool
    {
        $platformDomains = [
            config('app.platform_domain', 'canvastencil.com'),
            config('app.admin_domain', 'admin.canvastencil.com'),
        ];

        return in_array($host, $platformDomains);
    }

    private function getDomainType(string $host): string
    {
        if ($this->isPlatformDomain($host)) {
            return 'platform';
        }

        $domain = TenantDomain::where('full_domain', $host)->first();
        return $domain ? 'custom' : 'subdirectory';
    }
}

// File: app/Providers/RouteServiceProvider.php
public function boot()
{
    $this->configureRateLimiting();

    $this->routes(function () {
        // Platform routes (admin.canvastencil.com)
        Route::middleware(['web', 'platform.domain'])
            ->domain(config('app.admin_domain'))
            ->prefix('platform')
            ->group(base_path('routes/platform.php'));

        // API routes with tenant identification
        Route::middleware(['api', 'tenant.identify'])
            ->prefix('api')
            ->group(base_path('routes/api.php'));

        // Tenant web routes (custom domains and subdirectories)
        Route::middleware(['web', 'tenant.identify'])
            ->group(base_path('routes/tenant.php'));
    });
}
```

#### Day 4-5: URL Generation & Routing Utilities
```php
// File: app/Services/URLService.php
class URLService
{
    public function tenantUrl(string $path = '/', Tenant $tenant = null): string
    {
        $tenant = $tenant ?? tenant();
        
        if (!$tenant) {
            throw new TenantNotResolvedException('No tenant context available');
        }

        // Try to get primary custom domain
        $primaryDomain = $tenant->domains()
            ->where('type', 'primary')
            ->where('status', 'active')
            ->first();

        if ($primaryDomain) {
            $protocol = $primaryDomain->force_https ? 'https' : 'http';
            return "{$protocol}://{$primaryDomain->full_domain}" . $this->normalizePath($path);
        }

        // Fall back to subdirectory pattern
        $platformDomain = config('app.platform_domain');
        $protocol = app()->isProduction() ? 'https' : 'http';
        
        return "{$protocol}://{$platformDomain}/{$tenant->id}" . $this->normalizePath($path);
    }

    public function adminUrl(string $path = '/', Tenant $tenant = null): string
    {
        return $this->tenantUrl("/admin{$path}", $tenant);
    }

    public function apiUrl(string $path = '/', Tenant $tenant = null): string
    {
        return $this->tenantUrl("/api{$path}", $tenant);
    }

    public function platformUrl(string $path = '/'): string
    {
        $adminDomain = config('app.admin_domain');
        $protocol = app()->isProduction() ? 'https' : 'http';
        
        return "{$protocol}://{$adminDomain}" . $this->normalizePath($path);
    }

    public function generateCanonicalUrl(Request $request): string
    {
        $tenant = tenant();
        
        if (!$tenant) {
            return $request->url();
        }

        $path = $request->getPathInfo();
        
        // Remove tenant slug from path if using subdirectory pattern
        if (request()->attributes->get('domain_type') === 'subdirectory') {
            $path = preg_replace('/^\/[^\/]+/', '', $path);
        }

        return $this->tenantUrl($path, $tenant);
    }

    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim($path, '/');
        return $path === '/' ? '' : $path;
    }
}

// File: app/Http/Middleware/CanonicalRedirect.php
class CanonicalRedirect
{
    public function __construct(private URLService $urlService) {}

    public function handle(Request $request, Closure $next)
    {
        $tenant = tenant();
        
        if (!$tenant) {
            return $next($request);
        }

        $currentUrl = $request->url();
        $canonicalUrl = $this->urlService->generateCanonicalUrl($request);
        
        // Redirect if current URL is not canonical
        if ($currentUrl !== $canonicalUrl && !$request->ajax()) {
            return redirect($canonicalUrl, 301);
        }

        return $next($request);
    }
}
```

### Week 27: SSL Automation & CDN Integration

#### Day 1-3: SSL Certificate Management
```php
// File: app/Services/SSLService.php
class SSLService
{
    public function __construct(
        private AcmeClient $acmeClient,
        private CloudflareService $cloudflareService
    ) {}

    public function issueCertificate(string $domain): array
    {
        try {
            // Use ACME client (Let's Encrypt) to issue certificate
            $challenge = $this->acmeClient->requestCertificate($domain);
            
            // Create HTTP challenge file or DNS record
            $this->createChallenge($domain, $challenge);
            
            // Wait for challenge verification
            $verified = $this->waitForVerification($challenge);
            
            if (!$verified) {
                throw new SSLVerificationException('SSL challenge verification failed');
            }
            
            // Download certificate
            $certificate = $this->acmeClient->downloadCertificate($challenge['order_id']);
            
            // Store certificate files
            $this->storeCertificateFiles($domain, $certificate);
            
            return [
                'domain' => $domain,
                'issued_at' => now(),
                'expires_at' => Carbon::parse($certificate['expires_at']),
                'issuer' => 'Let\'s Encrypt',
                'certificate_path' => "ssl/{$domain}/certificate.pem",
                'private_key_path' => "ssl/{$domain}/private_key.pem",
                'chain_path' => "ssl/{$domain}/chain.pem",
            ];
            
        } catch (Exception $e) {
            Log::error('SSL certificate issuance failed', [
                'domain' => $domain,
                'error' => $e->getMessage()
            ]);
            
            throw new SSLIssuanceException("Failed to issue SSL certificate for {$domain}: " . $e->getMessage());
        }
    }

    public function renewCertificate(TenantDomain $domain): bool
    {
        try {
            $certificate = $this->issueCertificate($domain->full_domain);
            
            $domain->update([
                'ssl_issued_at' => $certificate['issued_at'],
                'ssl_expires_at' => $certificate['expires_at'],
                'ssl_details' => $certificate,
            ]);
            
            // Update web server configuration
            $this->updateWebServerConfig($domain);
            
            return true;
            
        } catch (Exception $e) {
            Log::error('SSL certificate renewal failed', [
                'domain' => $domain->full_domain,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    public function checkCertificateExpiration(): array
    {
        $expiringDomains = TenantDomain::where('status', 'active')
            ->whereNotNull('ssl_expires_at')
            ->where('ssl_expires_at', '<', now()->addDays(30))
            ->get();

        $renewalResults = [];
        
        foreach ($expiringDomains as $domain) {
            $renewed = $this->renewCertificate($domain);
            $renewalResults[] = [
                'domain' => $domain->full_domain,
                'tenant' => $domain->tenant->name,
                'renewed' => $renewed,
                'expires_at' => $domain->ssl_expires_at,
            ];
            
            if (!$renewed) {
                // Send alert to platform admins
                SSLRenewalFailedEvent::dispatch($domain);
            }
        }

        return $renewalResults;
    }

    private function createChallenge(string $domain, array $challenge): void
    {
        if ($challenge['type'] === 'http-01') {
            // Create HTTP challenge file
            $challengeDir = public_path('.well-known/acme-challenge');
            if (!is_dir($challengeDir)) {
                mkdir($challengeDir, 0755, true);
            }
            
            file_put_contents(
                $challengeDir . '/' . $challenge['token'],
                $challenge['key_authorization']
            );
            
        } elseif ($challenge['type'] === 'dns-01') {
            // Create DNS TXT record via Cloudflare API
            $this->cloudflareService->createTXTRecord(
                "_acme-challenge.{$domain}",
                $challenge['key_authorization']
            );
        }
    }

    private function storeCertificateFiles(string $domain, array $certificate): void
    {
        $sslDir = storage_path("app/ssl/{$domain}");
        if (!is_dir($sslDir)) {
            mkdir($sslDir, 0700, true);
        }

        file_put_contents($sslDir . '/certificate.pem', $certificate['certificate']);
        file_put_contents($sslDir . '/private_key.pem', $certificate['private_key']);
        file_put_contents($sslDir . '/chain.pem', $certificate['chain']);
        
        // Set appropriate permissions
        chmod($sslDir . '/private_key.pem', 0600);
    }
}

// File: app/Jobs/CheckSSLCertificatesJob.php
class CheckSSLCertificatesJob implements ShouldQueue
{
    public function __construct() {}

    public function handle(SSLService $sslService)
    {
        Log::info('Starting SSL certificate expiration check');
        
        $renewalResults = $sslService->checkCertificateExpiration();
        
        Log::info('SSL certificate check completed', [
            'domains_checked' => count($renewalResults),
            'renewals_attempted' => collect($renewalResults)->where('renewed', true)->count(),
            'renewals_failed' => collect($renewalResults)->where('renewed', false)->count(),
        ]);
    }
}
```

#### Day 4-5: CDN Integration & Performance
```php
// File: app/Services/CDNService.php
class CDNService
{
    public function __construct(
        private CloudflareService $cloudflareService,
        private AWSCloudFrontService $cloudFrontService
    ) {}

    public function enableCDN(TenantDomain $domain, string $provider = 'cloudflare'): bool
    {
        try {
            $cdnConfig = match($provider) {
                'cloudflare' => $this->setupCloudflare($domain),
                'cloudfront' => $this->setupCloudFront($domain),
                default => throw new UnsupportedCDNProviderException("Unsupported CDN provider: {$provider}"),
            };

            $domain->update([
                'cdn_enabled' => true,
                'cdn_provider' => $provider,
                'cdn_settings' => $cdnConfig,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('CDN setup failed', [
                'domain' => $domain->full_domain,
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    private function setupCloudflare(TenantDomain $domain): array
    {
        // Add domain to Cloudflare
        $zone = $this->cloudflareService->addZone($domain->domain);
        
        // Configure DNS records
        $this->cloudflareService->createRecord($zone['id'], [
            'type' => 'A',
            'name' => $domain->subdomain ?? '@',
            'content' => config('app.platform_ip'),
            'proxied' => true, // Enable Cloudflare proxy
        ]);

        // Configure SSL settings
        $this->cloudflareService->updateSSLSettings($zone['id'], [
            'ssl' => 'flexible', // Let Cloudflare handle SSL termination
            'always_use_https' => true,
            'automatic_https_rewrites' => true,
        ]);

        // Configure caching rules
        $this->cloudflareService->createPageRule($zone['id'], [
            'targets' => [['target' => 'url', 'constraint' => ['operator' => 'matches', 'value' => "*{$domain->full_domain}/*"]]],
            'actions' => [
                ['id' => 'cache_level', 'value' => 'aggressive'],
                ['id' => 'edge_cache_ttl', 'value' => 86400], // 1 day
            ],
        ]);

        return [
            'zone_id' => $zone['id'],
            'nameservers' => $zone['name_servers'],
            'status' => $zone['status'],
        ];
    }

    public function purgeCDNCache(TenantDomain $domain, array $urls = []): bool
    {
        if (!$domain->cdn_enabled) {
            return false;
        }

        try {
            match($domain->cdn_provider) {
                'cloudflare' => $this->purgeCloudflareCache($domain, $urls),
                'cloudfront' => $this->purgeCloudFrontCache($domain, $urls),
                default => throw new UnsupportedCDNProviderException("Unsupported CDN provider: {$domain->cdn_provider}"),
            };

            return true;

        } catch (Exception $e) {
            Log::error('CDN cache purge failed', [
                'domain' => $domain->full_domain,
                'provider' => $domain->cdn_provider,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    private function purgeCloudflareCache(TenantDomain $domain, array $urls): void
    {
        $zoneId = $domain->cdn_settings['zone_id'];
        
        if (empty($urls)) {
            // Purge all cache
            $this->cloudflareService->purgeCache($zoneId);
        } else {
            // Purge specific URLs
            $fullUrls = array_map(fn($url) => "https://{$domain->full_domain}{$url}", $urls);
            $this->cloudflareService->purgeCache($zoneId, $fullUrls);
        }
    }

    public function getCDNStats(TenantDomain $domain, int $days = 7): array
    {
        if (!$domain->cdn_enabled) {
            return [];
        }

        return match($domain->cdn_provider) {
            'cloudflare' => $this->getCloudflareStats($domain, $days),
            'cloudfront' => $this->getCloudFrontStats($domain, $days),
            default => [],
        };
    }
}

// File: app/Http/Controllers/Api/CDNController.php  
class CDNController extends Controller
{
    public function __construct(private CDNService $cdnService) {}

    public function enable(EnableCDNRequest $request, TenantDomain $domain)
    {
        if (!$domain->isVerified()) {
            return response()->json(['error' => 'Domain must be verified before enabling CDN'], 400);
        }

        $enabled = $this->cdnService->enableCDN($domain, $request->provider);

        return response()->json([
            'domain' => new TenantDomainResource($domain->fresh()),
            'enabled' => $enabled,
            'message' => $enabled 
                ? 'CDN enabled successfully' 
                : 'Failed to enable CDN'
        ]);
    }

    public function purgeCache(PurgeCacheRequest $request, TenantDomain $domain)
    {
        $purged = $this->cdnService->purgeCDNCache($domain, $request->urls ?? []);

        return response()->json([
            'purged' => $purged,
            'message' => $purged 
                ? 'Cache purged successfully'
                : 'Failed to purge cache'
        ]);
    }

    public function stats(TenantDomain $domain, Request $request)
    {
        $days = $request->input('days', 7);
        $stats = $this->cdnService->getCDNStats($domain, $days);

        return response()->json($stats);
    }
}
```

### Week 28: Domain Health Monitoring & SEO Optimization

#### Day 1-3: Health Monitoring System
```php
// File: app/Services/DomainHealthService.php
class DomainHealthService
{
    public function __construct(
        private DNSService $dnsService,
        private HTTPService $httpService,
        private SSLService $sslService
    ) {}

    public function checkDomainHealth(TenantDomain $domain): array
    {
        $healthChecks = [
            'dns_resolution' => $this->checkDNSResolution($domain),
            'http_response' => $this->checkHTTPResponse($domain),
            'ssl_certificate' => $this->checkSSLCertificate($domain),
            'cdn_status' => $this->checkCDNStatus($domain),
            'seo_factors' => $this->checkSEOFactors($domain),
        ];

        $overallHealth = $this->calculateOverallHealth($healthChecks);
        
        // Store health check results
        DomainHealthCheck::create([
            'domain_id' => $domain->id,
            'tenant_id' => $domain->tenant_id,
            'checked_at' => now(),
            'health_score' => $overallHealth['score'],
            'status' => $overallHealth['status'],
            'checks' => $healthChecks,
            'issues' => $overallHealth['issues'],
        ]);

        return array_merge($healthChecks, $overallHealth);
    }

    private function checkDNSResolution(TenantDomain $domain): array
    {
        try {
            $aRecords = $this->dnsService->getARecords($domain->full_domain);
            $expectedIP = config('app.platform_ip');
            
            $isResolved = in_array($expectedIP, $aRecords);
            $responseTime = $this->dnsService->getResponseTime($domain->full_domain);
            
            return [
                'status' => $isResolved ? 'healthy' : 'failed',
                'resolved_ips' => $aRecords,
                'expected_ip' => $expectedIP,
                'response_time_ms' => $responseTime,
                'issues' => $isResolved ? [] : ['DNS does not resolve to platform IP'],
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'issues' => ['DNS resolution failed'],
            ];
        }
    }

    private function checkHTTPResponse(TenantDomain $domain): array
    {
        try {
            $response = $this->httpService->get("http://{$domain->full_domain}", [
                'timeout' => 10,
                'allow_redirects' => false,
            ]);
            
            $httpsResponse = $this->httpService->get("https://{$domain->full_domain}", [
                'timeout' => 10,
            ]);
            
            $issues = [];
            if ($response['status_code'] !== 200 && $response['status_code'] !== 301) {
                $issues[] = "HTTP returns {$response['status_code']} status";
            }
            
            if ($httpsResponse['response_time'] > 3000) {
                $issues[] = 'HTTPS response time > 3 seconds';
            }
            
            return [
                'status' => empty($issues) ? 'healthy' : 'warning',
                'http_status' => $response['status_code'],
                'https_status' => $httpsResponse['status_code'],
                'response_time_ms' => $httpsResponse['response_time'],
                'redirects_to_https' => $response['status_code'] === 301 && str_contains($response['location'] ?? '', 'https'),
                'issues' => $issues,
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'issues' => ['HTTP request failed'],
            ];
        }
    }

    private function checkSSLCertificate(TenantDomain $domain): array
    {
        try {
            $certificate = $this->sslService->getCertificateInfo($domain->full_domain);
            
            $daysUntilExpiry = $certificate['expires_at']->diffInDays(now());
            $issues = [];
            
            if ($daysUntilExpiry < 7) {
                $issues[] = 'SSL certificate expires in less than 7 days';
            } elseif ($daysUntilExpiry < 30) {
                $issues[] = 'SSL certificate expires in less than 30 days';
            }
            
            if (!$certificate['valid']) {
                $issues[] = 'SSL certificate is invalid';
            }
            
            return [
                'status' => $certificate['valid'] && $daysUntilExpiry > 7 ? 'healthy' : 'warning',
                'issuer' => $certificate['issuer'],
                'expires_at' => $certificate['expires_at']->toISOString(),
                'days_until_expiry' => $daysUntilExpiry,
                'valid' => $certificate['valid'],
                'issues' => $issues,
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'issues' => ['SSL certificate check failed'],
            ];
        }
    }

    private function checkSEOFactors(TenantDomain $domain): array
    {
        try {
            $response = $this->httpService->get("https://{$domain->full_domain}");
            $content = $response['content'];
            
            $issues = [];
            
            // Check for basic SEO elements
            if (!str_contains($content, '<title>')) {
                $issues[] = 'Missing page title';
            }
            
            if (!str_contains($content, 'name="description"')) {
                $issues[] = 'Missing meta description';
            }
            
            if (str_contains($content, 'noindex')) {
                $issues[] = 'Page is set to noindex';
            }
            
            // Check for canonical URL
            $hasCanonical = str_contains($content, 'rel="canonical"');
            if (!$hasCanonical) {
                $issues[] = 'Missing canonical URL';
            }
            
            return [
                'status' => empty($issues) ? 'healthy' : 'warning',
                'has_title' => str_contains($content, '<title>'),
                'has_description' => str_contains($content, 'name="description"'),
                'has_canonical' => $hasCanonical,
                'is_indexed' => !str_contains($content, 'noindex'),
                'issues' => $issues,
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'issues' => ['SEO check failed'],
            ];
        }
    }

    private function calculateOverallHealth(array $checks): array
    {
        $scores = [
            'dns_resolution' => $checks['dns_resolution']['status'] === 'healthy' ? 100 : 0,
            'http_response' => $this->getHealthScore($checks['http_response']['status']),
            'ssl_certificate' => $this->getHealthScore($checks['ssl_certificate']['status']),
            'cdn_status' => $this->getHealthScore($checks['cdn_status']['status']),
            'seo_factors' => $this->getHealthScore($checks['seo_factors']['status']),
        ];
        
        $overallScore = array_sum($scores) / count($scores);
        
        $status = match(true) {
            $overallScore >= 90 => 'healthy',
            $overallScore >= 70 => 'warning',
            default => 'critical',
        };
        
        $allIssues = collect($checks)->flatMap(fn($check) => $check['issues'] ?? [])->toArray();
        
        return [
            'score' => round($overallScore),
            'status' => $status,
            'issues' => $allIssues,
        ];
    }
}

// File: app/Jobs/DomainHealthCheckJob.php
class DomainHealthCheckJob implements ShouldQueue
{
    public function __construct(private TenantDomain $domain) {}

    public function handle(DomainHealthService $healthService)
    {
        $healthReport = $healthService->checkDomainHealth($this->domain);
        
        // Send alerts if critical issues found
        if ($healthReport['status'] === 'critical') {
            DomainHealthAlertEvent::dispatch($this->domain, $healthReport);
        }
        
        Log::info('Domain health check completed', [
            'domain' => $this->domain->full_domain,
            'tenant' => $this->domain->tenant_id,
            'score' => $healthReport['score'],
            'status' => $healthReport['status'],
            'issues_count' => count($healthReport['issues']),
        ]);
    }
}
```

#### Day 4-5: SEO & Performance Optimization
```php
// File: app/Http/Controllers/Api/DomainHealthController.php
class DomainHealthController extends Controller
{
    public function __construct(private DomainHealthService $healthService) {}

    public function check(TenantDomain $domain)
    {
        $healthReport = $this->healthService->checkDomainHealth($domain);
        
        return response()->json([
            'domain' => $domain->full_domain,
            'health_report' => $healthReport,
            'checked_at' => now()->toISOString(),
        ]);
    }

    public function history(TenantDomain $domain, Request $request)
    {
        $checks = DomainHealthCheck::where('domain_id', $domain->id)
            ->latest('checked_at')
            ->paginate($request->input('limit', 20));

        return DomainHealthCheckResource::collection($checks);
    }

    public function bulkCheck(Request $request)
    {
        $tenantId = tenant()->id;
        $domains = TenantDomain::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->get();

        foreach ($domains as $domain) {
            DomainHealthCheckJob::dispatch($domain);
        }

        return response()->json([
            'message' => 'Health checks queued for all domains',
            'domain_count' => $domains->count(),
        ]);
    }
}

// File: app/Http/Middleware/SEOOptimization.php
class SEOOptimization
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        if ($response->isRedirection()) {
            return $response;
        }
        
        $tenant = tenant();
        if (!$tenant) {
            return $response;
        }
        
        $content = $response->getContent();
        
        // Add canonical URL
        $canonicalUrl = app(URLService::class)->generateCanonicalUrl($request);
        $content = $this->addCanonicalUrl($content, $canonicalUrl);
        
        // Add structured data
        $content = $this->addStructuredData($content, $tenant);
        
        // Optimize meta tags
        $content = $this->optimizeMetaTags($content, $tenant);
        
        $response->setContent($content);
        
        return $response;
    }

    private function addCanonicalUrl(string $content, string $canonicalUrl): string
    {
        if (str_contains($content, 'rel="canonical"')) {
            return $content;
        }
        
        $canonicalTag = '<link rel="canonical" href="' . $canonicalUrl . '">';
        
        return preg_replace('/<\/head>/', $canonicalTag . "\n</head>", $content);
    }

    private function addStructuredData(string $content, Tenant $tenant): string
    {
        $structuredData = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $tenant->business_name,
            'url' => app(URLService::class)->tenantUrl(),
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'email' => $tenant->contact_email,
                'contactType' => 'customer service',
            ],
        ];
        
        $script = '<script type="application/ld+json">' . json_encode($structuredData) . '</script>';
        
        return preg_replace('/<\/head>/', $script . "\n</head>", $content);
    }

    private function optimizeMetaTags(string $content, Tenant $tenant): string
    {
        // Add Open Graph tags if missing
        if (!str_contains($content, 'property="og:')) {
            $ogTags = [
                '<meta property="og:type" content="website">',
                '<meta property="og:site_name" content="' . $tenant->business_name . '">',
                '<meta property="og:url" content="' . app(URLService::class)->tenantUrl() . '">',
            ];
            
            $content = preg_replace('/<\/head>/', implode("\n", $ogTags) . "\n</head>", $content);
        }
        
        return $content;
    }
}
```

## 🎯 Database Seeding Strategy

### Domain Management Seeding
```php
// File: database/seeders/DomainManagementSeeder.php
class DomainManagementSeeder extends Seeder
{
    public function run()
    {
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            // Create sample custom domain for some tenants
            if (rand(0, 1)) {
                $domain = fake()->domainName();
                
                TenantDomain::create([
                    'tenant_id' => $tenant->id,
                    'domain' => $domain,
                    'full_domain' => $domain,
                    'type' => 'primary',
                    'status' => 'active',
                    'is_custom' => true,
                    'verified_at' => fake()->dateTimeBetween('-30 days', 'now'),
                    'ssl_issued_at' => fake()->dateTimeBetween('-30 days', 'now'),
                    'ssl_expires_at' => fake()->dateTimeBetween('+60 days', '+90 days'),
                    'ssl_provider' => 'letsencrypt',
                    'force_https' => true,
                    'cdn_enabled' => rand(0, 1),
                    'cdn_provider' => 'cloudflare',
                ]);
            }
        }
    }
}
```

## ✅ Testing Requirements

### Domain Management Testing (95%+ Coverage)
```php
// File: tests/Feature/Domain/DomainManagementTest.php
class DomainManagementTest extends TestCase
{
    use RefreshDatabase, WithTenant;

    public function test_can_add_custom_domain()
    {
        $tenant = Tenant::factory()->create();
        $domainService = app(DomainService::class);
        
        $domain = $domainService->addCustomDomain($tenant, 'example.com');
        
        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'domain' => 'example.com',
            'full_domain' => 'example.com',
        ]);
    }

    public function test_tenant_routing_by_custom_domain()
    {
        $tenant = Tenant::factory()->create();
        $domain = TenantDomain::factory()->create([
            'tenant_id' => $tenant->id,
            'full_domain' => 'example.com',
            'status' => 'active',
        ]);
        
        $response = $this->get('/', ['HTTP_HOST' => 'example.com']);
        
        $this->assertEquals($tenant->id, tenant()->id);
    }
}
```

## 🔒 Security Checkpoints

### Domain Security
- **Domain Verification**: Proper ownership verification before activation
- **SSL Certificate Security**: Automated renewal and secure storage
- **DNS Security**: Protection against DNS hijacking
- **CDN Security**: Proper CDN configuration with security headers

## 📊 Performance Requirements

- **Domain Resolution**: < 50ms DNS resolution time
- **SSL Handshake**: < 200ms SSL connection time
- **CDN Response**: < 100ms for cached content
- **Health Checks**: Complete domain health check in < 5 seconds

## 🚀 Success Metrics

### Technical Metrics
- [x] Custom domain system functional
- [x] SSL automation with 99%+ success rate
- [x] CDN integration operational
- [x] Domain health monitoring active

### Business Metrics
- [x] Tenants can use custom domains
- [x] SSL certificates auto-renew before expiry
- [x] CDN improves page load times by 40%+
- [x] Domain health issues detected proactively

---

**Next Phase**: [Phase 8: Performance & Security Optimization](./PHASE_8_PERFORMANCE_SECURITY_OPTIMIZATION.md)