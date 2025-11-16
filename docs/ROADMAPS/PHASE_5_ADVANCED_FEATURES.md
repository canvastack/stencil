# Phase 5: Advanced Features
**Duration**: 4 Weeks (Weeks 17-20)  
**Priority**: MEDIUM  
**Prerequisites**: Phase 1-4 (Multi-Tenant Foundation, Authentication, Business Logic, Content Management)

## 🎯 Phase Overview

This phase implements advanced features that enhance the platform's capabilities and user experience. These features differentiate the platform from basic CMS solutions by providing sophisticated customization, analytics, and operational tools.

### Key Deliverables
- **Theme Management System** with dynamic loading and customization
- **Multi-Language Support** with translation management
- **Advanced Analytics & Reporting** with business intelligence
- **Inventory Management** with real-time tracking
- **Notification System** with multi-channel support
- **Advanced Search & Filtering** with full-text search

## 📋 Week-by-Week Breakdown

### Week 17: Theme Management & Customization System

#### Day 1-2: Theme Models & Storage
```php
// File: database/migrations/create_themes_table.php
Schema::create('themes', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('name');
    $table->string('slug')->index();
    $table->string('version')->default('1.0.0');
    $table->text('description')->nullable();
    $table->string('author')->nullable();
    $table->json('config'); // Theme configuration JSON
    $table->json('assets'); // CSS, JS, image assets
    $table->json('templates'); // Template files
    $table->json('customizations')->nullable(); // User customizations
    $table->boolean('is_active')->default(false);
    $table->boolean('is_default')->default(false);
    $table->string('preview_image')->nullable();
    $table->json('supported_features')->nullable();
    $table->timestamp('installed_at')->nullable();
    $table->timestamps();
    
    $table->unique(['tenant_id', 'slug']);
    $table->index(['tenant_id', 'is_active']);
});

// File: database/migrations/create_theme_customizations_table.php
Schema::create('theme_customizations', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('theme_id');
    $table->string('section'); // header, footer, colors, fonts, etc.
    $table->string('property'); // background-color, font-family, etc.
    $table->text('value'); // CSS value or JSON for complex properties
    $table->text('original_value')->nullable(); // Original theme value
    $table->boolean('is_active')->default(true);
    $table->unsignedBigInteger('customized_by');
    $table->timestamps();
    
    $table->foreign('theme_id')->references('id')->on('themes');
    $table->foreign('customized_by')->references('id')->on('users');
    $table->unique(['tenant_id', 'theme_id', 'section', 'property']);
});
```

#### Day 3-4: Theme Management Models & Logic
```php
// File: app/Models/Theme.php
class Theme extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'slug', 'version', 'description', 'author',
        'config', 'assets', 'templates', 'customizations', 'is_active',
        'is_default', 'preview_image', 'supported_features', 'installed_at'
    ];

    protected $casts = [
        'config' => 'array',
        'assets' => 'array',
        'templates' => 'array',
        'customizations' => 'array',
        'supported_features' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'installed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customizations(): HasMany
    {
        return $this->hasMany(ThemeCustomization::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function activate(): void
    {
        // Deactivate current theme
        static::where('tenant_id', $this->tenant_id)->update(['is_active' => false]);
        
        // Activate this theme
        $this->update(['is_active' => true]);
        
        // Clear theme cache
        cache()->tags(['themes', "tenant:{$this->tenant_id}"])->flush();
        
        // Dispatch theme activated event
        ThemeActivatedEvent::dispatch($this);
    }

    public function generateCSS(): string
    {
        $baseCSS = $this->config['base_css'] ?? '';
        $customizations = $this->customizations()->active()->get();
        
        $customCSS = $customizations->map(function ($customization) {
            return ".{$customization->section} { {$customization->property}: {$customization->value}; }";
        })->implode("\n");
        
        return $baseCSS . "\n" . $customCSS;
    }

    public function exportTheme(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'version' => $this->version,
            'description' => $this->description,
            'author' => $this->author,
            'config' => $this->config,
            'assets' => $this->assets,
            'templates' => $this->templates,
            'customizations' => $this->customizations()->active()->get()->toArray(),
            'supported_features' => $this->supported_features,
        ];
    }
}

// File: app/Models/ThemeCustomization.php
class ThemeCustomization extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'theme_id', 'section', 'property', 'value',
        'original_value', 'is_active', 'customized_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function customizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customized_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

#### Day 5: Theme API & Management
```php
// File: app/Http/Controllers/Api/ThemeController.php
class ThemeController extends Controller
{
    public function index(Request $request)
    {
        $themes = Theme::query()
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->with(['customizations'])
            ->paginate($request->limit ?? 20);

        return ThemeResource::collection($themes);
    }

    public function active()
    {
        $activeTheme = Theme::active()->with('customizations')->first();
        
        if (!$activeTheme) {
            return response()->json(['error' => 'No active theme found'], 404);
        }

        return new ThemeResource($activeTheme);
    }

    public function activate(Theme $theme)
    {
        $theme->activate();
        return new ThemeResource($theme);
    }

    public function customize(CustomizeThemeRequest $request, Theme $theme)
    {
        foreach ($request->customizations as $customization) {
            ThemeCustomization::updateOrCreate([
                'tenant_id' => tenant()->id,
                'theme_id' => $theme->id,
                'section' => $customization['section'],
                'property' => $customization['property'],
            ], [
                'value' => $customization['value'],
                'original_value' => $customization['original_value'] ?? null,
                'customized_by' => auth()->id(),
            ]);
        }

        return new ThemeResource($theme->fresh(['customizations']));
    }

    public function generateCSS(Theme $theme)
    {
        $css = $theme->generateCSS();
        
        return response($css, 200)
            ->header('Content-Type', 'text/css')
            ->header('Cache-Control', 'max-age=3600');
    }

    public function install(InstallThemeRequest $request)
    {
        $themeData = $request->validated();
        
        $theme = Theme::create([
            'tenant_id' => tenant()->id,
            'name' => $themeData['name'],
            'slug' => Str::slug($themeData['name']),
            'version' => $themeData['version'],
            'description' => $themeData['description'],
            'author' => $themeData['author'],
            'config' => $themeData['config'],
            'assets' => $themeData['assets'],
            'templates' => $themeData['templates'],
            'supported_features' => $themeData['supported_features'],
            'installed_at' => now(),
        ]);

        return new ThemeResource($theme);
    }

    public function export(Theme $theme)
    {
        $exportData = $theme->exportTheme();
        
        return response()->json($exportData)
            ->header('Content-Disposition', 'attachment; filename="' . $theme->slug . '.json"');
    }
}
```

### Week 18: Multi-Language & Localization System

#### Day 1-2: Translation Models & Management
```php
// File: database/migrations/create_languages_table.php
Schema::create('languages', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('name'); // English, Indonesian
    $table->string('code', 5); // en, id
    $table->string('locale', 10); // en_US, id_ID
    $table->string('flag_icon')->nullable();
    $table->boolean('is_active')->default(true);
    $table->boolean('is_default')->default(false);
    $table->boolean('is_rtl')->default(false); // Right-to-left language
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    
    $table->unique(['tenant_id', 'code']);
    $table->index(['tenant_id', 'is_active']);
});

// File: database/migrations/create_translations_table.php
Schema::create('translations', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('key')->index(); // nav.home, product.details
    $table->text('value'); // Translated text
    $table->string('language_code', 5);
    $table->string('category')->default('general'); // navigation, product, admin
    $table->text('context')->nullable(); // Context for translators
    $table->boolean('is_system')->default(false); // System vs custom translations
    $table->unsignedBigInteger('created_by')->nullable();
    $table->timestamps();
    
    $table->foreign('language_code')->references('code')->on('languages');
    $table->foreign('created_by')->references('id')->on('users');
    $table->unique(['tenant_id', 'key', 'language_code']);
    $table->index(['tenant_id', 'category']);
});

// File: database/migrations/create_translatable_contents_table.php
Schema::create('translatable_contents', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('translatable_type'); // Page, Product, etc.
    $table->unsignedBigInteger('translatable_id');
    $table->string('field'); // title, description, content
    $table->text('value');
    $table->string('language_code', 5);
    $table->timestamps();
    
    $table->foreign('language_code')->references('code')->on('languages');
    $table->index(['translatable_type', 'translatable_id']);
    $table->unique(['tenant_id', 'translatable_type', 'translatable_id', 'field', 'language_code'], 'translatable_unique');
});
```

#### Day 3-4: Translation Models & Services
```php
// File: app/Models/Language.php
class Language extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'code', 'locale', 'flag_icon',
        'is_active', 'is_default', 'is_rtl', 'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'is_rtl' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class, 'language_code', 'code');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}

// File: app/Models/Translation.php  
class Translation extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'key', 'value', 'language_code', 'category',
        'context', 'is_system', 'created_by'
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class, 'language_code', 'code');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

// File: app/Services/TranslationService.php
class TranslationService
{
    private array $loadedTranslations = [];
    private string $currentLanguage = 'id';

    public function setLanguage(string $languageCode): void
    {
        $this->currentLanguage = $languageCode;
    }

    public function translate(string $key, array $params = [], string $language = null): string
    {
        $language = $language ?? $this->currentLanguage;
        
        if (!isset($this->loadedTranslations[$language])) {
            $this->loadTranslations($language);
        }

        $translation = $this->loadedTranslations[$language][$key] ?? $key;
        
        // Replace parameters in translation
        foreach ($params as $param => $value) {
            $translation = str_replace(":{$param}", $value, $translation);
        }

        return $translation;
    }

    public function getTranslations(string $language, string $category = null): array
    {
        $query = Translation::where('language_code', $language);
        
        if ($category) {
            $query->where('category', $category);
        }

        return $query->pluck('value', 'key')->toArray();
    }

    private function loadTranslations(string $language): void
    {
        $this->loadedTranslations[$language] = cache()
            ->tags(['translations', "tenant:" . tenant()->id])
            ->remember("translations.{$language}", 3600, function() use ($language) {
                return Translation::where('language_code', $language)
                    ->pluck('value', 'key')
                    ->toArray();
            });
    }

    public function addTranslation(string $key, string $value, string $language, string $category = 'general'): Translation
    {
        $translation = Translation::updateOrCreate([
            'tenant_id' => tenant()->id,
            'key' => $key,
            'language_code' => $language,
        ], [
            'value' => $value,
            'category' => $category,
            'created_by' => auth()->id(),
        ]);

        // Clear cache
        cache()->tags(['translations', "tenant:" . tenant()->id])->flush();

        return $translation;
    }
}
```

#### Day 5: Translation API & Management
```php
// File: app/Http/Controllers/Api/TranslationController.php
class TranslationController extends Controller
{
    public function __construct(private TranslationService $translationService) {}

    public function index(Request $request)
    {
        $translations = Translation::query()
            ->when($request->language, fn($q) => $q->where('language_code', $request->language))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q) => $q->where('key', 'like', "%{$request->search}%"))
            ->with(['language', 'creator'])
            ->paginate($request->limit ?? 50);

        return TranslationResource::collection($translations);
    }

    public function show(string $language, string $category = null)
    {
        $translations = $this->translationService->getTranslations($language, $category);
        
        return response()->json([
            'language' => $language,
            'category' => $category,
            'translations' => $translations,
        ]);
    }

    public function store(StoreTranslationRequest $request)
    {
        $translation = $this->translationService->addTranslation(
            $request->key,
            $request->value,
            $request->language_code,
            $request->category ?? 'general'
        );

        return new TranslationResource($translation);
    }

    public function bulkUpdate(BulkTranslationRequest $request)
    {
        $results = [];
        
        foreach ($request->translations as $translationData) {
            $translation = $this->translationService->addTranslation(
                $translationData['key'],
                $translationData['value'],
                $translationData['language_code'],
                $translationData['category'] ?? 'general'
            );
            
            $results[] = new TranslationResource($translation);
        }

        return response()->json(['data' => $results]);
    }

    public function languages()
    {
        $languages = Language::active()
            ->orderBy('sort_order')
            ->get();

        return LanguageResource::collection($languages);
    }
}
```

### Week 19: Advanced Analytics & Reporting

#### Day 1-3: Analytics Models & Data Collection
```php
// File: database/migrations/create_analytics_events_table.php
Schema::create('analytics_events', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('event_type'); // page_view, product_view, order_created, etc.
    $table->string('event_name');
    $table->json('event_data'); // Additional event data
    $table->string('user_id')->nullable(); // Can be guest or authenticated user
    $table->string('session_id');
    $table->string('ip_address', 45);
    $table->string('user_agent');
    $table->string('referrer')->nullable();
    $table->string('utm_source')->nullable();
    $table->string('utm_medium')->nullable();
    $table->string('utm_campaign')->nullable();
    $table->json('device_info')->nullable(); // Browser, OS, screen resolution
    $table->timestamp('created_at');
    
    $table->index(['tenant_id', 'event_type']);
    $table->index(['tenant_id', 'created_at']);
    $table->index(['tenant_id', 'user_id']);
    $table->index(['tenant_id', 'session_id']);
});

// File: database/migrations/create_analytics_summaries_table.php
Schema::create('analytics_summaries', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('metric_type'); // daily_visitors, product_views, orders, etc.
    $table->date('date');
    $table->json('data'); // Aggregated metrics
    $table->timestamps();
    
    $table->unique(['tenant_id', 'metric_type', 'date']);
});

// File: app/Models/AnalyticsEvent.php
class AnalyticsEvent extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'event_type', 'event_name', 'event_data', 'user_id',
        'session_id', 'ip_address', 'user_agent', 'referrer',
        'utm_source', 'utm_medium', 'utm_campaign', 'device_info'
    ];

    protected $casts = [
        'event_data' => 'array',
        'device_info' => 'array',
    ];

    public const UPDATED_AT = null; // Only created_at

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public static function track(string $eventType, string $eventName, array $eventData = [], string $userId = null): void
    {
        static::create([
            'tenant_id' => tenant()->id,
            'event_type' => $eventType,
            'event_name' => $eventName,
            'event_data' => $eventData,
            'user_id' => $userId ?? request()->header('X-User-ID'),
            'session_id' => session()->getId(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'referrer' => request()->header('referer'),
            'utm_source' => request()->get('utm_source'),
            'utm_medium' => request()->get('utm_medium'),
            'utm_campaign' => request()->get('utm_campaign'),
            'device_info' => [
                'browser' => static::detectBrowser(request()->userAgent()),
                'os' => static::detectOS(request()->userAgent()),
                'device_type' => static::detectDeviceType(request()->userAgent()),
            ],
        ]);
    }
}

// File: app/Services/AnalyticsService.php
class AnalyticsService
{
    public function getDashboardStats(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'visitors' => $this->getUniqueVisitors($startDate, $endDate),
            'page_views' => $this->getPageViews($startDate, $endDate),
            'orders' => $this->getOrderStats($startDate, $endDate),
            'revenue' => $this->getRevenueStats($startDate, $endDate),
            'top_products' => $this->getTopProducts($startDate, $endDate),
            'traffic_sources' => $this->getTrafficSources($startDate, $endDate),
            'conversion_rate' => $this->getConversionRate($startDate, $endDate),
        ];
    }

    public function getUniqueVisitors(Carbon $startDate, Carbon $endDate): array
    {
        $visitors = AnalyticsEvent::whereBetween('created_at', [$startDate, $endDate])
            ->distinct('session_id')
            ->count();

        $previousPeriod = $this->getPreviousPeriod($startDate, $endDate);
        $previousVisitors = AnalyticsEvent::whereBetween('created_at', $previousPeriod)
            ->distinct('session_id')
            ->count();

        return [
            'total' => $visitors,
            'change' => $this->calculatePercentageChange($visitors, $previousVisitors),
            'daily_breakdown' => $this->getDailyVisitors($startDate, $endDate),
        ];
    }

    public function getTopProducts(Carbon $startDate, Carbon $endDate, int $limit = 10): array
    {
        return AnalyticsEvent::where('event_type', 'product_view')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('event_data->product_id as product_id')
            ->selectRaw('COUNT(*) as views')
            ->groupBy('event_data->product_id')
            ->orderByDesc('views')
            ->limit($limit)
            ->with(['product:id,name,slug,price'])
            ->get()
            ->map(function ($item) {
                $product = Product::find($item->product_id);
                return [
                    'product' => $product ? [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'price' => $product->price,
                    ] : null,
                    'views' => $item->views,
                ];
            });
    }

    public function generateReport(string $reportType, Carbon $startDate, Carbon $endDate): array
    {
        return match($reportType) {
            'sales' => $this->generateSalesReport($startDate, $endDate),
            'customers' => $this->generateCustomerReport($startDate, $endDate),
            'products' => $this->generateProductReport($startDate, $endDate),
            'traffic' => $this->generateTrafficReport($startDate, $endDate),
            default => throw new InvalidArgumentException("Unknown report type: {$reportType}"),
        };
    }
}
```

#### Day 4-5: Analytics API & Visualization
```php
// File: app/Http/Controllers/Api/AnalyticsController.php
class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analyticsService) {}

    public function dashboard(Request $request)
    {
        $startDate = Carbon::parse($request->start_date ?? now()->subDays(30));
        $endDate = Carbon::parse($request->end_date ?? now());

        $stats = $this->analyticsService->getDashboardStats($startDate, $endDate);

        return response()->json($stats);
    }

    public function track(TrackEventRequest $request)
    {
        AnalyticsEvent::track(
            $request->event_type,
            $request->event_name,
            $request->event_data ?? [],
            auth()->id()
        );

        return response()->json(['status' => 'tracked']);
    }

    public function report(GenerateReportRequest $request)
    {
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        
        $report = $this->analyticsService->generateReport(
            $request->report_type,
            $startDate,
            $endDate
        );

        return response()->json($report);
    }

    public function exportReport(ExportReportRequest $request)
    {
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        
        $report = $this->analyticsService->generateReport(
            $request->report_type,
            $startDate,
            $endDate
        );

        // Generate Excel file
        $export = new AnalyticsReportExport($report, $request->report_type);
        
        return Excel::download(
            $export,
            "{$request->report_type}_report_{$startDate->format('Y-m-d')}_to_{$endDate->format('Y-m-d')}.xlsx"
        );
    }
}
```

### Week 20: Inventory Management & Notifications

#### Day 1-3: Inventory Models & Tracking
```php
// File: database/migrations/create_inventory_items_table.php
Schema::create('inventory_items', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('product_id');
    $table->string('sku')->index();
    $table->string('batch_number')->nullable();
    $table->integer('quantity_available');
    $table->integer('quantity_reserved')->default(0);
    $table->integer('quantity_ordered')->default(0);
    $table->integer('reorder_point')->default(10);
    $table->integer('max_stock_level')->nullable();
    $table->decimal('cost_price', 15, 2)->nullable();
    $table->string('supplier_id')->nullable();
    $table->date('expiry_date')->nullable();
    $table->string('location')->nullable(); // Warehouse location
    $table->json('attributes')->nullable(); // Size, color, etc.
    $table->enum('status', ['active', 'discontinued', 'out_of_stock'])->default('active');
    $table->timestamps();
    
    $table->foreign('product_id')->references('id')->on('products');
    $table->unique(['tenant_id', 'sku']);
    $table->index(['tenant_id', 'product_id']);
    $table->index(['tenant_id', 'status']);
});

// File: database/migrations/create_inventory_movements_table.php
Schema::create('inventory_movements', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('inventory_item_id');
    $table->enum('movement_type', ['in', 'out', 'adjustment', 'transfer']);
    $table->string('reference_type')->nullable(); // Order, Purchase, Adjustment
    $table->unsignedBigInteger('reference_id')->nullable();
    $table->integer('quantity');
    $table->integer('quantity_before');
    $table->integer('quantity_after');
    $table->decimal('cost_per_unit', 15, 2)->nullable();
    $table->text('notes')->nullable();
    $table->unsignedBigInteger('created_by');
    $table->timestamp('created_at');
    
    $table->foreign('inventory_item_id')->references('id')->on('inventory_items');
    $table->foreign('created_by')->references('id')->on('users');
    $table->index(['tenant_id', 'movement_type']);
    $table->index(['tenant_id', 'created_at']);
});

// File: app/Models/InventoryItem.php
class InventoryItem extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'product_id', 'sku', 'batch_number', 'quantity_available',
        'quantity_reserved', 'quantity_ordered', 'reorder_point', 'max_stock_level',
        'cost_price', 'supplier_id', 'expiry_date', 'location', 'attributes', 'status'
    ];

    protected $casts = [
        'attributes' => 'array',
        'cost_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function getAvailableQuantityAttribute(): int
    {
        return $this->quantity_available - $this->quantity_reserved;
    }

    public function isLowStock(): bool
    {
        return $this->available_quantity <= $this->reorder_point;
    }

    public function isOutOfStock(): bool
    {
        return $this->available_quantity <= 0;
    }

    public function reserve(int $quantity, string $referenceType = null, int $referenceId = null): void
    {
        if ($quantity > $this->available_quantity) {
            throw new InsufficientStockException("Cannot reserve {$quantity} items. Only {$this->available_quantity} available.");
        }

        $this->increment('quantity_reserved', $quantity);
        
        $this->movements()->create([
            'tenant_id' => $this->tenant_id,
            'movement_type' => 'out',
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'quantity' => -$quantity,
            'quantity_before' => $this->quantity_available + $quantity,
            'quantity_after' => $this->quantity_available,
            'notes' => "Reserved {$quantity} items",
            'created_by' => auth()->id(),
        ]);
    }

    public function adjust(int $newQuantity, string $reason = null): void
    {
        $oldQuantity = $this->quantity_available;
        $adjustment = $newQuantity - $oldQuantity;

        $this->update(['quantity_available' => $newQuantity]);

        $this->movements()->create([
            'tenant_id' => $this->tenant_id,
            'movement_type' => 'adjustment',
            'quantity' => $adjustment,
            'quantity_before' => $oldQuantity,
            'quantity_after' => $newQuantity,
            'notes' => $reason,
            'created_by' => auth()->id(),
        ]);

        // Check for low stock notification
        if ($this->isLowStock()) {
            LowStockNotification::dispatch($this);
        }
    }
}
```

#### Day 4-5: Notification System & API
```php
// File: database/migrations/create_notifications_table.php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('type'); // low_stock, order_created, payment_received, etc.
    $table->string('title');
    $table->text('message');
    $table->json('data')->nullable(); // Additional notification data
    $table->json('recipients'); // User IDs or email addresses
    $table->json('channels'); // email, sms, push, database
    $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamp('sent_at')->nullable();
    $table->enum('status', ['pending', 'sent', 'failed', 'cancelled'])->default('pending');
    $table->json('delivery_status')->nullable(); // Per-channel delivery status
    $table->text('error_message')->nullable();
    $table->timestamps();
    
    $table->index(['tenant_id', 'type']);
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'scheduled_at']);
});

// File: app/Services/NotificationService.php
class NotificationService
{
    public function send(
        string $type,
        string $title,
        string $message,
        array $recipients,
        array $channels = ['database'],
        array $data = [],
        string $priority = 'normal'
    ): Notification {
        $notification = Notification::create([
            'tenant_id' => tenant()->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'recipients' => $recipients,
            'channels' => $channels,
            'priority' => $priority,
            'status' => 'pending',
        ]);

        // Dispatch job to send notification
        SendNotificationJob::dispatch($notification);

        return $notification;
    }

    public function sendLowStockAlert(InventoryItem $inventoryItem): void
    {
        $admins = User::whereHas('roles', function($q) {
            $q->whereIn('slug', ['admin', 'inventory_manager']);
        })->pluck('id')->toArray();

        $this->send(
            'low_stock',
            'Low Stock Alert',
            "Product {$inventoryItem->product->name} is low on stock ({$inventoryItem->available_quantity} remaining)",
            $admins,
            ['database', 'email'],
            [
                'product_id' => $inventoryItem->product_id,
                'inventory_item_id' => $inventoryItem->id,
                'current_stock' => $inventoryItem->available_quantity,
                'reorder_point' => $inventoryItem->reorder_point,
            ],
            'high'
        );
    }
}

// File: app/Http/Controllers/Api/InventoryController.php
class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $inventory = InventoryItem::query()
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->sku, fn($q) => $q->where('sku', 'like', "%{$request->sku}%"))
            ->when($request->low_stock, fn($q) => $q->whereRaw('quantity_available <= reorder_point'))
            ->when($request->out_of_stock, fn($q) => $q->where('quantity_available', '<=', 0))
            ->with(['product', 'movements' => fn($q) => $q->latest()->limit(5)])
            ->paginate($request->limit ?? 20);

        return InventoryItemResource::collection($inventory);
    }

    public function adjust(AdjustInventoryRequest $request, InventoryItem $inventoryItem)
    {
        $inventoryItem->adjust(
            $request->new_quantity,
            $request->reason
        );

        return new InventoryItemResource($inventoryItem);
    }

    public function movements(InventoryItem $inventoryItem)
    {
        $movements = $inventoryItem->movements()
            ->with(['creator'])
            ->latest()
            ->paginate(20);

        return InventoryMovementResource::collection($movements);
    }

    public function lowStockReport()
    {
        $lowStockItems = InventoryItem::whereRaw('quantity_available <= reorder_point')
            ->with(['product'])
            ->get();

        return InventoryItemResource::collection($lowStockItems);
    }
}
```

## 🎯 Database Seeding Strategy

### Advanced Features Seeding (200+ Records)
```php
// File: database/seeders/AdvancedFeaturesSeeder.php
class AdvancedFeaturesSeeder extends Seeder
{
    public function run()
    {
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            
            // Languages (5 languages)
            $this->seedLanguages();
            
            // Translations (500+ translations)
            $this->seedTranslations();
            
            // Themes (3 themes)
            $this->seedThemes();
            
            // Inventory (100+ inventory items)
            $this->seedInventory();
            
            // Analytics events (1000+ events)
            $this->seedAnalyticsEvents();
            
            // Notifications (50+ notifications)
            $this->seedNotifications();
        }
    }
    
    private function seedLanguages()
    {
        $languages = [
            ['name' => 'Indonesian', 'code' => 'id', 'locale' => 'id_ID', 'flag_icon' => '🇮🇩', 'is_default' => true],
            ['name' => 'English', 'code' => 'en', 'locale' => 'en_US', 'flag_icon' => '🇺🇸'],
            ['name' => 'Mandarin', 'code' => 'zh', 'locale' => 'zh_CN', 'flag_icon' => '🇨🇳'],
            ['name' => 'Japanese', 'code' => 'ja', 'locale' => 'ja_JP', 'flag_icon' => '🇯🇵'],
            ['name' => 'Korean', 'code' => 'ko', 'locale' => 'ko_KR', 'flag_icon' => '🇰🇷'],
        ];

        foreach ($languages as $language) {
            Language::create($language);
        }
    }
    
    private function seedTranslations()
    {
        $translationKeys = [
            // Navigation
            'nav.home' => ['id' => 'Beranda', 'en' => 'Home', 'zh' => '首页', 'ja' => 'ホーム', 'ko' => '홈'],
            'nav.products' => ['id' => 'Produk', 'en' => 'Products', 'zh' => '产品', 'ja' => '製品', 'ko' => '제품'],
            'nav.about' => ['id' => 'Tentang Kami', 'en' => 'About Us', 'zh' => '关于我们', 'ja' => '私たちについて', 'ko' => '회사소개'],
            'nav.contact' => ['id' => 'Kontak', 'en' => 'Contact', 'zh' => '联系', 'ja' => 'お問い合わせ', 'ko' => '연락처'],
            
            // Products
            'product.details' => ['id' => 'Detail Produk', 'en' => 'Product Details', 'zh' => '产品详情', 'ja' => '製品詳細', 'ko' => '제품 상세정보'],
            'product.price' => ['id' => 'Harga', 'en' => 'Price', 'zh' => '价格', 'ja' => '価格', 'ko' => '가격'],
            'product.order' => ['id' => 'Pesan Sekarang', 'en' => 'Order Now', 'zh' => '立即订购', 'ja' => '今すぐ注文', 'ko' => '지금 주문'],
            
            // Common
            'common.search' => ['id' => 'Cari', 'en' => 'Search', 'zh' => '搜索', 'ja' => '検索', 'ko' => '검색'],
            'common.save' => ['id' => 'Simpan', 'en' => 'Save', 'zh' => '保存', 'ja' => '保存', 'ko' => '저장'],
            'common.cancel' => ['id' => 'Batal', 'en' => 'Cancel', 'zh' => '取消', 'ja' => 'キャンセル', 'ko' => '취소'],
            'common.loading' => ['id' => 'Memuat...', 'en' => 'Loading...', 'zh' => '加载中...', 'ja' => '読み込み中...', 'ko' => '로딩 중...'],
            
            // Business specific
            'business.custom_engraving' => ['id' => 'Ukiran Kustom', 'en' => 'Custom Engraving', 'zh' => '定制雕刻', 'ja' => 'カスタム彫刻', 'ko' => '맞춤 조각'],
            'business.lead_time' => ['id' => 'Waktu Pengerjaan', 'en' => 'Lead Time', 'zh' => '交货时间', 'ja' => 'リードタイム', 'ko' => '제작 시간'],
            'business.quotation' => ['id' => 'Penawaran Harga', 'en' => 'Quotation', 'zh' => '报价', 'ja' => '見積書', 'ko' => '견적서'],
        ];

        $languages = Language::all();
        
        foreach ($translationKeys as $key => $translations) {
            $category = explode('.', $key)[0];
            
            foreach ($languages as $language) {
                if (isset($translations[$language->code])) {
                    Translation::create([
                        'key' => $key,
                        'value' => $translations[$language->code],
                        'language_code' => $language->code,
                        'category' => $category,
                        'is_system' => true,
                    ]);
                }
            }
        }
    }
    
    private function seedThemes()
    {
        $themes = [
            [
                'name' => 'Professional Blue',
                'slug' => 'professional-blue',
                'description' => 'Clean and professional theme with blue accents',
                'config' => [
                    'colors' => [
                        'primary' => '#2563eb',
                        'secondary' => '#64748b',
                        'accent' => '#0ea5e9',
                        'background' => '#ffffff',
                        'text' => '#1e293b',
                    ],
                    'typography' => [
                        'font_family' => 'Inter',
                        'heading_weight' => '600',
                        'body_weight' => '400',
                    ],
                ],
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Elegant Dark',
                'slug' => 'elegant-dark',
                'description' => 'Sophisticated dark theme for modern businesses',
                'config' => [
                    'colors' => [
                        'primary' => '#8b5cf6',
                        'secondary' => '#6b7280',
                        'accent' => '#a78bfa',
                        'background' => '#111827',
                        'text' => '#f9fafb',
                    ],
                    'typography' => [
                        'font_family' => 'Poppins',
                        'heading_weight' => '700',
                        'body_weight' => '400',
                    ],
                ],
            ],
            [
                'name' => 'Minimal Green',
                'slug' => 'minimal-green',
                'description' => 'Minimal design with eco-friendly green tones',
                'config' => [
                    'colors' => [
                        'primary' => '#059669',
                        'secondary' => '#6b7280',
                        'accent' => '#10b981',
                        'background' => '#f9fafb',
                        'text' => '#374151',
                    ],
                    'typography' => [
                        'font_family' => 'Roboto',
                        'heading_weight' => '500',
                        'body_weight' => '400',
                    ],
                ],
            ],
        ];

        foreach ($themes as $themeData) {
            Theme::create($themeData);
        }
    }
    
    private function seedInventory()
    {
        $products = Product::all();
        
        foreach ($products as $product) {
            $inventoryCount = rand(1, 3); // 1-3 inventory items per product
            
            for ($i = 0; $i < $inventoryCount; $i++) {
                $quantity = rand(5, 100);
                
                InventoryItem::create([
                    'product_id' => $product->id,
                    'sku' => strtoupper(Str::random(3)) . '-' . str_pad($product->id, 4, '0', STR_PAD_LEFT) . '-' . ($i + 1),
                    'quantity_available' => $quantity,
                    'reorder_point' => rand(5, 15),
                    'max_stock_level' => $quantity + rand(50, 200),
                    'cost_price' => $product->price * 0.7, // 30% markup
                    'location' => 'WH-' . chr(65 + rand(0, 2)) . '-' . rand(1, 10),
                    'status' => 'active',
                ]);
            }
        }
    }
}
```

## ✅ Testing Requirements

### Advanced Features Testing (95%+ Coverage)
```php
// File: tests/Feature/AdvancedFeatures/ThemeManagementTest.php
class ThemeManagementTest extends TestCase
{
    use RefreshDatabase, WithTenant;

    public function test_can_activate_theme()
    {
        $theme1 = Theme::factory()->create(['is_active' => true]);
        $theme2 = Theme::factory()->create(['is_active' => false]);
        
        $theme2->activate();
        
        $this->assertTrue($theme2->fresh()->is_active);
        $this->assertFalse($theme1->fresh()->is_active);
    }

    public function test_can_customize_theme()
    {
        $theme = Theme::factory()->create();
        
        ThemeCustomization::create([
            'tenant_id' => tenant()->id,
            'theme_id' => $theme->id,
            'section' => 'header',
            'property' => 'background-color',
            'value' => '#ff0000',
            'customized_by' => User::factory()->create()->id,
        ]);
        
        $css = $theme->generateCSS();
        $this->assertStringContains('background-color: #ff0000', $css);
    }
}

// File: tests/Feature/AdvancedFeatures/InventoryManagementTest.php
class InventoryManagementTest extends TestCase
{
    use RefreshDatabase, WithTenant;

    public function test_can_reserve_inventory()
    {
        $inventory = InventoryItem::factory()->create(['quantity_available' => 100]);
        
        $inventory->reserve(50);
        
        $this->assertEquals(50, $inventory->fresh()->quantity_reserved);
        $this->assertEquals(50, $inventory->fresh()->available_quantity);
    }

    public function test_cannot_reserve_more_than_available()
    {
        $inventory = InventoryItem::factory()->create(['quantity_available' => 10]);
        
        $this->expectException(InsufficientStockException::class);
        $inventory->reserve(15);
    }

    public function test_low_stock_detection()
    {
        $inventory = InventoryItem::factory()->create([
            'quantity_available' => 5,
            'reorder_point' => 10
        ]);
        
        $this->assertTrue($inventory->isLowStock());
    }
}
```

## 🔒 Security Checkpoints

### Advanced Security Features
- **Theme Security**: Theme files validated and sanitized
- **Translation Security**: Input sanitization for translations
- **Analytics Privacy**: PII data anonymization
- **Notification Security**: Recipient validation and rate limiting

## 📊 Performance Requirements

- **Theme Loading**: < 100ms for theme assets
- **Translation Loading**: < 50ms for translation lookups
- **Analytics Queries**: < 500ms for dashboard stats
- **Inventory Updates**: < 200ms for stock movements

## 🚀 Success Metrics

### Technical Metrics
- [x] Theme system with customization functional
- [x] Multi-language support with 5+ languages
- [x] Analytics system tracking 10+ event types
- [x] Inventory management with real-time tracking

### Business Metrics
- [x] Theme switching operational across tenants
- [x] Translation management interface complete
- [x] Analytics dashboard with business insights
- [x] Inventory low-stock alerts functioning

---

**Next Phase**: [Phase 6: Platform Management](./PHASE_6_PLATFORM_MANAGEMENT.md)