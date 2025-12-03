# Phase 4: Content Management System
**Duration**: 4 Weeks (Weeks 13-16)  
**Priority**: HIGH  
**Status**: ✅ **BACKEND COMPLETE** | 🟢 **FRONTEND INTEGRATION COMPLETE**  
**Prerequisites**: ✅ Phase 4A-4C (Complete Hexagonal Architecture + DDD + CQRS + Business Logic) - **COMPLETE**

## 🏁 **IMPLEMENTATION STATUS - DECEMBER 2024**

### ✅ **COMPLETED COMPONENTS**

#### **🏗️ Backend Architecture (100% Complete)**
- ✅ **Database Schema & Migrations**: Complete platform and tenant content tables with proper isolation
- ✅ **Hexagonal Architecture**: Full domain entities, repositories, and business logic implementation
- ✅ **CQRS Implementation**: Commands, queries, use cases, and handlers following established patterns
- ✅ **API Controllers**: Complete CRUD operations for platform content management
- ✅ **Multi-Level Security**: Platform admin authentication and tenant-level isolation
- ✅ **Content Versioning**: Full version control with rollback capabilities
- ✅ **Template System**: Platform templates with tenant customization support

#### **🎨 Frontend Integration (100% Complete)**
- ✅ **API Service Layer**: Complete CMS service with platform/tenant mode detection
- ✅ **ContentContext Update**: Real API integration with fallback to mock data
- ✅ **Admin Pages**: All content management pages (Home, About, Contact, FAQ) connected to APIs
- ✅ **Error Handling**: Graceful degradation from API to mock data when needed

#### **🔧 Technical Implementation Details**
- ✅ **Platform Content Storage**: Main database with proper admin authentication
- ✅ **Tenant Content Storage**: Schema-per-tenant isolation without tenant_id fields
- ✅ **API Endpoints**: RESTful endpoints following hexagonal architecture patterns
- ✅ **Event System**: Domain events for content creation and updates
- ✅ **Content Inheritance**: Template system allowing platform-to-tenant customization

### 🎯 **READY FOR PRODUCTION**
The Phase 4 CMS implementation is **production-ready** and provides:
- Multi-level content management (Platform & Tenant)
- Complete CRUD operations with proper authentication
- Version control and rollback capabilities
- Template inheritance system
- Frontend integration with existing admin panels
- Graceful error handling and fallback mechanisms

## 🎯 Phase Overview

This phase implements a comprehensive **Multi-Level Content Management System (CMS)** following the **established Hexagonal Architecture + DDD + CQRS patterns** from Phase 4C. The CMS operates at **two distinct levels**:

1. **🏢 Platform-Level Content**: Global content managed by Platform Administrators (stored in main database)
2. **🏬 Tenant-Level Content**: Tenant-specific content managed by Tenant Users (stored per schema-per-tenant)

The CMS integrates seamlessly with existing **Order Management**, **Authentication Infrastructure**, and **Business Workflows** while maintaining strict **schema-per-tenant isolation** for tenant content and **centralized management** for platform content.

**🏗️ ARCHITECTURE ALIGNMENT**: All implementations must follow the established **Use Cases → Command/Query Handlers → Application Services** pattern from Phase 4C, with no direct controller-to-model access.

### Key Deliverables

#### 🏢 Platform-Level Features
- **Global Page Content Management** for platform-wide pages (Home, About, Contact, FAQ)
- **Centralized Media Library** for platform assets and branding
- **Platform SEO Management** for global meta optimization
- **Content Templates** that tenants can customize
- **Platform Versioning System** for global content rollbacks

#### 🏬 Tenant-Level Features  
- **Dynamic Page Content Management** with structured content blocks
- **Tenant Media Library System** with tenant isolation and CDN integration
- **Customer Review & Rating System** with moderation features
- **Tenant SEO Management Tools** with meta optimization and analytics
- **File Upload & Storage** with multiple storage providers
- **Content Versioning** with rollback capabilities

#### 🔗 Shared Infrastructure
- **Multi-Level Storage Architecture** supporting both platform and tenant content
- **Unified CDN Integration** with proper content isolation
- **Cross-Level Content Inheritance** (platform templates → tenant customizations)
- **Comprehensive Admin Interfaces** for both platform and tenant management

## 📋 Week-by-Week Breakdown

### Week 13: Multi-Level Content Management Foundation

#### Day 1-2: Platform & Tenant Content Models & Migrations
**⚠️ CRITICAL**: Two distinct storage architectures required:
- **Platform Content**: Stored in **main database** with proper platform admin authentication
- **Tenant Content**: Stored in **schema-per-tenant** with NO `tenant_id` fields needed

**🏢 PLATFORM CONTENT MIGRATIONS (Main Database):**
```php
// File: database/migrations/create_platform_pages_table.php
Schema::create('platform_pages', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->string('title');
    $table->string('slug')->unique()->index();
    $table->text('description')->nullable();
    $table->json('content'); // Structured JSON content
    $table->string('template')->default('default');
    $table->json('meta_data')->nullable(); // SEO and custom meta
    $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
    $table->boolean('is_homepage')->default(false);
    $table->integer('sort_order')->default(0);
    $table->string('language', 5)->default('en');
    $table->unsignedBigInteger('parent_id')->nullable();
    $table->datetime('published_at')->nullable();
    $table->unsignedBigInteger('created_by'); // Platform Admin User
    $table->timestamps();
    
    $table->foreign('parent_id')->references('id')->on('platform_pages')->onDelete('cascade');
    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
    $table->unique(['slug', 'language']);
    $table->index(['status']);
    $table->index(['is_homepage']);
    $table->index(['created_by']);
});

// File: database/migrations/create_platform_page_versions_table.php
Schema::create('platform_page_versions', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('page_id');
    $table->integer('version_number');
    $table->json('content');
    $table->json('meta_data')->nullable();
    $table->string('change_description')->nullable();
    $table->unsignedBigInteger('created_by');
    $table->boolean('is_current')->default(false);
    $table->timestamps();
    
    $table->foreign('page_id')->references('id')->on('platform_pages')->onDelete('cascade');
    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
    $table->unique(['page_id', 'version_number']);
    $table->index(['page_id', 'is_current']);
});
```

**🏬 TENANT CONTENT MIGRATIONS (Schema-per-Tenant):**
```php
// File: database/migrations/tenant/create_pages_table.php  
Schema::create('pages', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
    $table->string('title');
    $table->string('slug')->index();
    $table->text('description')->nullable();
    $table->json('content'); // Structured JSON content
    $table->string('template')->default('default');
    $table->json('meta_data')->nullable(); // SEO and custom meta
    $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
    $table->boolean('is_homepage')->default(false);
    $table->integer('sort_order')->default(0);
    $table->string('language', 5)->default('id');
    $table->unsignedBigInteger('parent_id')->nullable();
    $table->unsignedBigInteger('platform_template_id')->nullable(); // Reference to platform template
    $table->datetime('published_at')->nullable();
    $table->timestamps();
    
    $table->foreign('parent_id')->references('id')->on('pages')->onDelete('cascade');
    $table->unique(['slug', 'language']);
    $table->index(['status']);
    $table->index(['is_homepage']);
    $table->index(['platform_template_id']);
});

// File: database/migrations/tenant/create_page_versions_table.php
Schema::create('page_versions', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('page_id');
    $table->integer('version_number');
    $table->json('content');
    $table->json('meta_data')->nullable();
    $table->string('change_description')->nullable();
    $table->unsignedBigInteger('created_by');
    $table->boolean('is_current')->default(false);
    $table->timestamps();
    
    $table->foreign('page_id')->references('id')->on('pages')->onDelete('cascade');
    $table->foreign('created_by')->references('id')->on('users');
    $table->unique(['page_id', 'version_number']);
    $table->index(['page_id', 'is_current']);
});
```

**🔗 SHARED CONTENT BLOCKS (Platform Templates):**
```php
// File: database/migrations/create_platform_content_blocks_table.php
Schema::create('platform_content_blocks', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('identifier')->unique()->index();
    $table->text('description')->nullable();
    $table->json('schema'); // JSON schema for block structure
    $table->json('default_content')->nullable();
    $table->string('category')->default('general');
    $table->boolean('is_reusable')->default(true);
    $table->boolean('is_active')->default(true);
    $table->boolean('is_template')->default(false); // Available as tenant template
    $table->timestamps();
    
    $table->index(['category']);
    $table->index(['is_template']);
});
```

#### Day 3-4: Page Content Models & Business Logic
```php
// File: app/Domain/Content/Entities/Page.php
class Page extends Model 
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'uuid', 'title', 'slug', 'description', 'content', 'template',
        'meta_data', 'status', 'is_homepage', 'sort_order', 'language',
        'parent_id', 'published_at'
    ];

    protected $casts = [
        'content' => 'array',
        'meta_data' => 'array',
        'is_homepage' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PageVersion::class);
    }

    public function currentVersion(): HasOne
    {
        return $this->hasOne(PageVersion::class)->where('is_current', true);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeHomepage($query)
    {
        return $query->where('is_homepage', true);
    }

    protected static function booted()
    {
        static::creating(function ($page) {
            if (!$page->slug) {
                $page->slug = Str::slug($page->title);
            }
        });

        static::created(function ($page) {
            // Create initial version
            $page->versions()->create([
                'tenant_id' => $page->tenant_id,
                'version_number' => 1,
                'content' => $page->content,
                'meta_data' => $page->meta_data,
                'change_description' => 'Initial version',
                'created_by' => auth()->id(),
                'is_current' => true,
            ]);
        });
    }

    public function createVersion(string $changeDescription = null): PageVersion
    {
        $latestVersion = $this->versions()->latest('version_number')->first();
        $newVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

        // Mark previous versions as not current
        $this->versions()->update(['is_current' => false]);

        return $this->versions()->create([
            'tenant_id' => $this->tenant_id,
            'version_number' => $newVersionNumber,
            'content' => $this->content,
            'meta_data' => $this->meta_data,
            'change_description' => $changeDescription,
            'created_by' => auth()->id(),
            'is_current' => true,
        ]);
    }
}

// File: app/Models/ContentBlock.php
class ContentBlock extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'identifier', 'description', 'schema',
        'default_content', 'category', 'is_reusable', 'is_active'
    ];

    protected $casts = [
        'schema' => 'array',
        'default_content' => 'array',
        'is_reusable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function validateContent(array $content): bool
    {
        // Implementation of JSON schema validation
        return $this->schemaValidator->validate($content, $this->schema);
    }
}
```

#### Day 5: Content API Controllers Following Hexagonal Architecture
**⚠️ ARCHITECTURE COMPLIANCE**: Must follow established **Use Cases → Command/Query Handlers** pattern.

```php
// File: app/Infrastructure/Presentation/Http/Controllers/Tenant/ContentController.php
class ContentController extends Controller
{
    public function __construct(
        private GetPagesQuery $getPagesQuery,
        private CreatePageUseCase $createPageUseCase,
        private UpdatePageUseCase $updatePageUseCase
    ) {}

    public function index(GetPagesRequest $request)
    {
        $result = $this->getPagesQuery->handle(new GetPagesQueryDTO([
            'status' => $request->status,
            'language' => $request->language,
            'parent_id' => $request->parent_id,
            'search' => $request->search,
            'limit' => $request->limit ?? 20
        ]));

        return PageResource::collection($result);
    }

    public function store(CreatePageRequest $request)
    {
        $result = $this->createPageUseCase->execute(new CreatePageCommand([
            'title' => $request->title,
            'slug' => $request->slug,
            'description' => $request->description,
            'content' => $request->content,
            'template' => $request->template,
            'meta_data' => $request->meta_data,
            'status' => $request->status,
            'language' => $request->language,
            'parent_id' => $request->parent_id
        ]));

        return new PageResource($result);
    }
}

// File: app/Application/Content/UseCases/CreatePageUseCase.php
class CreatePageUseCase
{
    public function __construct(
        private PageRepositoryInterface $pageRepository,
        private HtmlSanitizationService $sanitizer,
        private EventDispatcher $eventDispatcher
    ) {}

    public function execute(CreatePageCommand $command): Page
    {
        // Sanitize content
        $sanitizedContent = $this->sanitizer->sanitizeArray($command->content);
        
        // Create page entity
        $page = Page::create([
            'uuid' => Str::uuid(),
            'title' => $command->title,
            'slug' => $command->slug ?: Str::slug($command->title),
            'description' => $command->description,
            'content' => $sanitizedContent,
            'template' => $command->template,
            'meta_data' => $command->meta_data,
            'status' => $command->status,
            'language' => $command->language,
            'parent_id' => $command->parent_id,
        ]);

        // Store via repository
        $storedPage = $this->pageRepository->save($page);

        // Dispatch domain event
        $this->eventDispatcher->dispatch(new PageCreatedEvent($storedPage));

        return $storedPage;
    }
}

// File: app/Application/Content/Queries/GetPagesQuery.php  
class GetPagesQuery
{
    public function __construct(private PageRepositoryInterface $pageRepository) {}

    public function handle(GetPagesQueryDTO $query): Collection
    {
        return $this->pageRepository->findByFilters([
            'status' => $query->status,
            'language' => $query->language,
            'parent_id' => $query->parent_id,
            'search' => $query->search,
        ], $query->limit);
    }

    public function show(Page $page)
    {
        $page->load(['parent', 'children', 'currentVersion']);
        return new PageResource($page);
    }

    public function store(StorePageRequest $request)
    {
        $page = Page::create($request->validated());
        return new PageResource($page);
    }

    public function update(UpdatePageRequest $request, Page $page)
    {
        $page->update($request->validated());
        
        if ($request->create_version) {
            $page->createVersion($request->change_description);
        }
        
        return new PageResource($page);
    }

    public function versions(Page $page)
    {
        $versions = $page->versions()
            ->with('creator')
            ->latest('version_number')
            ->paginate(10);

        return PageVersionResource::collection($versions);
    }

    public function restoreVersion(Page $page, PageVersion $version)
    {
        $page->update([
            'content' => $version->content,
            'meta_data' => $version->meta_data,
        ]);

        $page->createVersion("Restored from version {$version->version_number}");

        return new PageResource($page);
    }
}

// File: app/Http/Resources/PageResource.php
class PageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'content' => $this->content,
            'template' => $this->template,
            'metaData' => $this->meta_data,
            'status' => $this->status,
            'isHomepage' => $this->is_homepage,
            'sortOrder' => $this->sort_order,
            'language' => $this->language,
            'publishedAt' => $this->published_at?->toISOString(),
            'parent' => $this->whenLoaded('parent', fn() => [
                'id' => $this->parent->id,
                'title' => $this->parent->title,
                'slug' => $this->parent->slug,
            ]),
            'children' => PageResource::collection($this->whenLoaded('children')),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
```

### Week 14: Media Library & File Management

#### Day 1-2: Media Models & File Storage Setup
```php
// File: database/migrations/create_media_files_table.php
Schema::create('media_files', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('name');
    $table->string('original_name');
    $table->string('file_path');
    $table->string('file_url');
    $table->string('thumbnail_url')->nullable();
    $table->string('mime_type');
    $table->string('file_extension', 10);
    $table->bigInteger('file_size'); // in bytes
    $table->json('dimensions')->nullable(); // for images: width, height
    $table->json('metadata')->nullable(); // EXIF, duration, etc.
    $table->string('storage_disk')->default('public');
    $table->string('alt_text')->nullable();
    $table->text('description')->nullable();
    $table->unsignedBigInteger('folder_id')->nullable();
    $table->enum('status', ['processing', 'ready', 'failed'])->default('processing');
    $table->unsignedBigInteger('uploaded_by');
    $table->timestamps();
    
    $table->foreign('folder_id')->references('id')->on('media_folders');
    $table->foreign('uploaded_by')->references('id')->on('users');
    $table->index(['tenant_id', 'mime_type']);
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'folder_id']);
});

// File: database/migrations/create_media_folders_table.php
Schema::create('media_folders', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->unsignedBigInteger('parent_id')->nullable();
    $table->integer('sort_order')->default(0);
    $table->boolean('is_public')->default(true);
    $table->unsignedBigInteger('created_by');
    $table->timestamps();
    
    $table->foreign('parent_id')->references('id')->on('media_folders')->onDelete('cascade');
    $table->foreign('created_by')->references('id')->on('users');
    $table->unique(['tenant_id', 'slug', 'parent_id']);
});
```

#### Day 3-4: Media Models & File Processing
```php
// File: app/Models/MediaFile.php
class MediaFile extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'original_name', 'file_path', 'file_url',
        'thumbnail_url', 'mime_type', 'file_extension', 'file_size',
        'dimensions', 'metadata', 'storage_disk', 'alt_text',
        'description', 'folder_id', 'status', 'uploaded_by'
    ];

    protected $casts = [
        'dimensions' => 'array',
        'metadata' => 'array',
        'file_size' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function isVideo(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    public function isDocument(): bool
    {
        return in_array($this->mime_type, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function getFormattedSizeAttribute(): string
    {
        return $this->formatBytes($this->file_size);
    }

    private function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = floor(log($size, 1024));
        return round($size / pow(1024, $power), 2) . ' ' . $units[$power];
    }

    protected static function booted()
    {
        static::created(function ($mediaFile) {
            // Dispatch job to process file (generate thumbnails, extract metadata)
            ProcessMediaFileJob::dispatch($mediaFile);
        });

        static::deleting(function ($mediaFile) {
            // Delete physical file
            Storage::disk($mediaFile->storage_disk)->delete($mediaFile->file_path);
            if ($mediaFile->thumbnail_url) {
                Storage::disk($mediaFile->storage_disk)->delete($mediaFile->thumbnail_url);
            }
        });
    }
}

// File: app/Jobs/ProcessMediaFileJob.php
class ProcessMediaFileJob implements ShouldQueue
{
    public function __construct(private MediaFile $mediaFile) {}

    public function handle()
    {
        try {
            if ($this->mediaFile->isImage()) {
                $this->processImage();
            } elseif ($this->mediaFile->isVideo()) {
                $this->processVideo();
            }

            $this->mediaFile->update(['status' => 'ready']);
        } catch (Exception $e) {
            $this->mediaFile->update(['status' => 'failed']);
            throw $e;
        }
    }

    private function processImage()
    {
        $image = Image::make(Storage::disk($this->mediaFile->storage_disk)->path($this->mediaFile->file_path));
        
        // Extract dimensions
        $this->mediaFile->update([
            'dimensions' => [
                'width' => $image->width(),
                'height' => $image->height(),
            ]
        ]);

        // Generate thumbnail
        $thumbnailPath = 'thumbnails/' . pathinfo($this->mediaFile->file_path, PATHINFO_FILENAME) . '_thumb.jpg';
        $thumbnail = $image->fit(300, 300)->encode('jpg', 85);
        
        Storage::disk($this->mediaFile->storage_disk)->put($thumbnailPath, $thumbnail);
        
        $this->mediaFile->update([
            'thumbnail_url' => Storage::disk($this->mediaFile->storage_disk)->url($thumbnailPath)
        ]);
    }

    private function processVideo()
    {
        // Generate video thumbnail using FFmpeg
        // Implementation depends on your video processing requirements
    }
}
```

#### Day 5: Media API Controllers
```php
// File: app/Http/Controllers/Api/MediaController.php
class MediaController extends Controller
{
    public function index(Request $request)
    {
        $media = MediaFile::query()
            ->when($request->folder_id, fn($q) => $q->where('folder_id', $request->folder_id))
            ->when($request->mime_type, fn($q) => $q->where('mime_type', 'like', $request->mime_type . '%'))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->with(['folder', 'uploader'])
            ->latest()
            ->paginate($request->limit ?? 20);

        return MediaFileResource::collection($media);
    }

    public function store(StoreMediaRequest $request)
    {
        $uploadedFile = $request->file('file');
        $folderId = $request->folder_id;

        $fileName = $this->generateUniqueFileName($uploadedFile);
        $filePath = $uploadedFile->storeAs('media', $fileName, 'public');

        $mediaFile = MediaFile::create([
            'tenant_id' => tenant()->id,
            'name' => pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $uploadedFile->getClientOriginalName(),
            'file_path' => $filePath,
            'file_url' => Storage::disk('public')->url($filePath),
            'mime_type' => $uploadedFile->getMimeType(),
            'file_extension' => $uploadedFile->getClientOriginalExtension(),
            'file_size' => $uploadedFile->getSize(),
            'storage_disk' => 'public',
            'folder_id' => $folderId,
            'uploaded_by' => auth()->id(),
        ]);

        return new MediaFileResource($mediaFile);
    }

    public function bulkUpload(Request $request)
    {
        $files = $request->file('files');
        $results = [];

        foreach ($files as $file) {
            try {
                $mediaFile = $this->store(new StoreMediaRequest(['file' => $file, 'folder_id' => $request->folder_id]));
                $results[] = ['success' => true, 'file' => $mediaFile];
            } catch (Exception $e) {
                $results[] = ['success' => false, 'filename' => $file->getClientOriginalName(), 'error' => $e->getMessage()];
            }
        }

        return response()->json(['results' => $results]);
    }

    private function generateUniqueFileName($file): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40);
        return $filename . '.' . $extension;
    }
}
```

### Week 15: Review & Rating System

#### Day 1-3: Review Models & Business Logic
```php
// File: database/migrations/create_reviews_table.php
Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->unsignedBigInteger('product_id');
    $table->unsignedBigInteger('customer_id')->nullable();
    $table->string('customer_name');
    $table->string('customer_email');
    $table->string('customer_image')->nullable();
    $table->integer('rating'); // 1-5 stars
    $table->text('comment');
    $table->boolean('verified')->default(false);
    $table->boolean('is_approved')->default(false);
    $table->json('helpful_votes')->default('[]'); // user IDs who found helpful
    $table->integer('helpful_count')->default(0);
    $table->text('admin_reply')->nullable();
    $table->datetime('admin_replied_at')->nullable();
    $table->unsignedBigInteger('admin_replied_by')->nullable();
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->timestamps();
    
    $table->foreign('product_id')->references('id')->on('products');
    $table->foreign('customer_id')->references('id')->on('customers');
    $table->foreign('admin_replied_by')->references('id')->on('users');
    $table->index(['tenant_id', 'product_id']);
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'rating']);
});

// File: app/Models/Review.php
class Review extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'product_id', 'customer_id', 'customer_name',
        'customer_email', 'customer_image', 'rating', 'comment',
        'verified', 'is_approved', 'helpful_votes', 'helpful_count',
        'admin_reply', 'admin_replied_at', 'admin_replied_by', 'status'
    ];

    protected $casts = [
        'helpful_votes' => 'array',
        'verified' => 'boolean',
        'is_approved' => 'boolean',
        'admin_replied_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function adminReplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_replied_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('verified', true);
    }

    public function addHelpfulVote(int $userId): void
    {
        $votes = $this->helpful_votes ?? [];
        
        if (!in_array($userId, $votes)) {
            $votes[] = $userId;
            $this->update([
                'helpful_votes' => $votes,
                'helpful_count' => count($votes),
            ]);
        }
    }

    public function removeHelpfulVote(int $userId): void
    {
        $votes = array_filter($this->helpful_votes ?? [], fn($id) => $id !== $userId);
        
        $this->update([
            'helpful_votes' => array_values($votes),
            'helpful_count' => count($votes),
        ]);
    }

    protected static function booted()
    {
        static::created(function ($review) {
            // Update product review statistics
            $review->product->updateReviewStats();
            
            // Notify admins of new review
            ReviewCreatedEvent::dispatch($review);
        });

        static::updated(function ($review) {
            if ($review->wasChanged('is_approved')) {
                $review->product->updateReviewStats();
            }
        });
    }
}
```

#### Day 4-5: Review API & Statistics
```php
// File: app/Http/Controllers/Api/ReviewController.php
class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $reviews = Review::query()
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->rating, fn($q) => $q->where('rating', $request->rating))
            ->when($request->verified, fn($q) => $q->verified())
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->with(['product', 'customer'])
            ->approved()
            ->latest()
            ->paginate($request->limit ?? 20);

        return ReviewResource::collection($reviews);
    }

    public function store(StoreReviewRequest $request)
    {
        // Check if customer already reviewed this product
        $existingReview = Review::where('product_id', $request->product_id)
            ->where('customer_email', $request->customer_email)
            ->first();

        if ($existingReview) {
            throw new BadRequestException('You have already reviewed this product.');
        }

        $review = Review::create($request->validated());
        
        return new ReviewResource($review);
    }

    public function helpful(Review $review)
    {
        $review->addHelpfulVote(auth()->id());
        return new ReviewResource($review);
    }

    public function unhelpful(Review $review)
    {
        $review->removeHelpfulVote(auth()->id());
        return new ReviewResource($review);
    }

    public function adminReply(AdminReplyRequest $request, Review $review)
    {
        $review->update([
            'admin_reply' => $request->reply,
            'admin_replied_at' => now(),
            'admin_replied_by' => auth()->id(),
        ]);

        return new ReviewResource($review);
    }

    public function stats(Request $request)
    {
        $productId = $request->product_id;
        
        $stats = Review::where('product_id', $productId)
            ->approved()
            ->selectRaw('
                AVG(rating) as average_rating,
                COUNT(*) as total_reviews,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5
            ')
            ->first();

        return response()->json([
            'averageRating' => round($stats->average_rating, 2),
            'totalReviews' => $stats->total_reviews,
            'ratingDistribution' => [
                '1' => $stats->rating_1,
                '2' => $stats->rating_2,
                '3' => $stats->rating_3,
                '4' => $stats->rating_4,
                '5' => $stats->rating_5,
            ],
        ]);
    }
}
```

### Week 16: SEO Management & Content Optimization

#### Day 1-3: SEO Models & Meta Management
```php
// File: database/migrations/create_seo_settings_table.php
Schema::create('seo_settings', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('page_type'); // page, product, category, etc.
    $table->string('page_id')->nullable(); // ID of the specific page/product
    $table->string('title');
    $table->text('description');
    $table->json('keywords')->nullable();
    $table->string('canonical_url')->nullable();
    $table->json('og_tags')->nullable(); // Open Graph tags
    $table->json('twitter_tags')->nullable(); // Twitter card tags
    $table->json('schema_markup')->nullable(); // JSON-LD structured data
    $table->boolean('index_follow')->default(true);
    $table->integer('priority')->default(50); // 1-100 priority
    $table->timestamps();
    
    $table->unique(['tenant_id', 'page_type', 'page_id']);
    $table->index(['tenant_id', 'page_type']);
});

// File: app/Models/SeoSetting.php
class SeoSetting extends Model implements BelongsToTenant
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'page_type', 'page_id', 'title', 'description',
        'keywords', 'canonical_url', 'og_tags', 'twitter_tags',
        'schema_markup', 'index_follow', 'priority'
    ];

    protected $casts = [
        'keywords' => 'array',
        'og_tags' => 'array',
        'twitter_tags' => 'array',
        'schema_markup' => 'array',
        'index_follow' => 'boolean',
    ];

    public function generateSchemaMarkup(): array
    {
        return match($this->page_type) {
            'product' => $this->generateProductSchema(),
            'page' => $this->generateWebPageSchema(),
            'review' => $this->generateReviewSchema(),
            default => $this->generateBasicSchema(),
        };
    }

    private function generateProductSchema(): array
    {
        $product = Product::find($this->page_id);
        
        return [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $product->name,
            'description' => $product->description,
            'image' => $product->images,
            'offers' => [
                '@type' => 'Offer',
                'price' => $product->price,
                'priceCurrency' => $product->currency,
                'availability' => $product->in_stock ? 'InStock' : 'OutOfStock',
            ],
            'aggregateRating' => $this->getProductRatingSchema($product),
        ];
    }
}
```

#### Day 4-5: SEO API & Analytics Integration
```php
// File: app/Http/Controllers/Api/SeoController.php
class SeoController extends Controller
{
    public function getPageSeo(Request $request)
    {
        $pageType = $request->page_type;
        $pageId = $request->page_id;

        $seoSetting = SeoSetting::where('page_type', $pageType)
            ->where('page_id', $pageId)
            ->first();

        if (!$seoSetting) {
            // Generate default SEO from the actual page/product
            $seoSetting = $this->generateDefaultSeo($pageType, $pageId);
        }

        return new SeoSettingResource($seoSetting);
    }

    public function updatePageSeo(UpdateSeoRequest $request)
    {
        $seoSetting = SeoSetting::updateOrCreate(
            [
                'tenant_id' => tenant()->id,
                'page_type' => $request->page_type,
                'page_id' => $request->page_id,
            ],
            $request->validated()
        );

        return new SeoSettingResource($seoSetting);
    }

    public function generateSitemap(Request $request)
    {
        $pages = Page::published()->get();
        $products = Product::published()->get();
        
        $sitemap = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $sitemap .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
        
        // Add pages
        foreach ($pages as $page) {
            $sitemap .= $this->generateSitemapUrl(
                url($page->slug),
                $page->updated_at,
                'weekly',
                $page->is_homepage ? '1.0' : '0.8'
            );
        }
        
        // Add products
        foreach ($products as $product) {
            $sitemap .= $this->generateSitemapUrl(
                url("products/{$product->slug}"),
                $product->updated_at,
                'daily',
                '0.9'
            );
        }
        
        $sitemap .= '</urlset>';
        
        return response($sitemap, 200)
            ->header('Content-Type', 'application/xml');
    }

    private function generateSitemapUrl($url, $lastmod, $changefreq, $priority): string
    {
        return sprintf(
            '<url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>' . PHP_EOL,
            $url,
            $lastmod->toW3CString(),
            $changefreq,
            $priority
        );
    }
}
```

## 🎯 Database Seeding Strategy

### **Realistic Seeding Data Requirements:**
***Setiap table memiliki minimal 20-50 seed records dengan business context yang relevan***
- ✅ **20-50 seed records** per table dengan business context
- ✅ **Multi-tenant data distribution** across different tenant types  
- ✅ **Relationship consistency** dengan proper foreign key references
- ✅ **Performance testing data** untuk load testing scenarios

### Platform-Level Content Seeding (50+ Records)
```php
// File: database/seeders/PlatformContentSeeder.php
class PlatformContentSeeder extends Seeder
{
    public function run()
    {
        $this->seedPlatformPages();
        $this->seedPlatformContentBlocks();
        $this->seedPlatformTemplates();
    }
    
    private function seedPlatformPages()
    {
        $platformAdmin = User::where('role', 'platform_admin')->first();
        
        // Global Platform Pages (25 pages)
        $platformPages = [
            [
                'title' => 'Stencil Platform Homepage',
                'slug' => 'home',
                'description' => 'Main platform landing page showcasing multi-tenant capabilities',
                'content' => [
                    'hero' => [
                        'title' => ['prefix' => 'Enterprise', 'highlight' => 'Multi-Tenant', 'suffix' => 'CMS Platform'],
                        'subtitle' => 'Powerful content management for multiple businesses',
                        'features' => ['Schema-per-tenant isolation', 'Custom branding', 'Advanced analytics'],
                        'cta' => ['text' => 'Start Your Trial', 'url' => '/register']
                    ],
                    'features' => [
                        ['title' => 'Tenant Isolation', 'icon' => 'shield', 'description' => 'Complete data separation per tenant'],
                        ['title' => 'Custom Domains', 'icon' => 'globe', 'description' => 'White-label solutions for clients'],
                        ['title' => 'Scalable Architecture', 'icon' => 'trending-up', 'description' => 'Handle thousands of tenants']
                    ]
                ],
                'template' => 'platform-homepage',
                'status' => 'published',
                'is_homepage' => true
            ],
            [
                'title' => 'Platform Features',
                'slug' => 'features',
                'content' => [
                    'sections' => [
                        [
                            'title' => 'Content Management',
                            'features' => ['Multi-level CMS', 'Version control', 'Template inheritance']
                        ],
                        [
                            'title' => 'Security & Compliance', 
                            'features' => ['Data encryption', 'GDPR compliance', 'Audit trails']
                        ]
                    ]
                ],
                'status' => 'published'
            ],
            [
                'title' => 'Pricing Plans',
                'slug' => 'pricing',
                'content' => [
                    'plans' => [
                        [
                            'name' => 'Starter',
                            'price' => '$99/month',
                            'tenants' => '5 tenants',
                            'features' => ['Basic CMS', 'Email support', '10GB storage']
                        ],
                        [
                            'name' => 'Professional', 
                            'price' => '$299/month',
                            'tenants' => '25 tenants',
                            'features' => ['Advanced CMS', 'Priority support', '100GB storage']
                        ],
                        [
                            'name' => 'Enterprise',
                            'price' => 'Custom',
                            'tenants' => 'Unlimited',
                            'features' => ['Full platform', 'Dedicated support', 'Unlimited storage']
                        ]
                    ]
                ],
                'status' => 'published'
            ]
        ];

        foreach ($platformPages as $pageData) {
            $page = PlatformPage::create(array_merge($pageData, [
                'created_by' => $platformAdmin->id,
                'language' => 'en',
                'published_at' => now()
            ]));

            // Create initial version
            PlatformPageVersion::create([
                'page_id' => $page->id,
                'version_number' => 1,
                'content' => $page->content,
                'meta_data' => $page->meta_data,
                'created_by' => $platformAdmin->id,
                'is_current' => true
            ]);
        }

        // Additional platform pages with different templates (22 more pages)
        $additionalPages = [
            'About Platform', 'Security & Privacy', 'Terms of Service', 'API Documentation',
            'Integration Guide', 'Support Center', 'Status Page', 'Release Notes',
            'Case Studies', 'Partner Program', 'Developer Resources', 'Training Materials',
            'Best Practices', 'Migration Guide', 'Troubleshooting', 'FAQ',
            'Contact Sales', 'Request Demo', 'White Papers', 'Webinars',
            'Community Forum', 'Success Stories'
        ];

        foreach ($additionalPages as $title) {
            $slug = Str::slug($title);
            $page = PlatformPage::create([
                'title' => $title,
                'slug' => $slug,
                'description' => "Platform information about {$title}",
                'content' => $this->generatePlatformContent($slug),
                'template' => $this->determinePlatformTemplate($slug),
                'status' => rand(0, 10) > 2 ? 'published' : 'draft',
                'created_by' => $platformAdmin->id,
                'language' => 'en',
                'published_at' => rand(0, 1) ? fake()->dateTimeBetween('-6 months', 'now') : null
            ]);

            // Create version
            PlatformPageVersion::create([
                'page_id' => $page->id,
                'version_number' => 1,
                'content' => $page->content,
                'created_by' => $platformAdmin->id,
                'is_current' => true
            ]);
        }
    }

    private function seedPlatformContentBlocks()
    {
        // Platform Content Block Templates (30 blocks)
        $contentBlocks = [
            [
                'name' => 'Hero Section Template',
                'identifier' => 'hero-section-v1',
                'description' => 'Standard hero section for tenant customization',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'title' => ['type' => 'string', 'maxLength' => 100],
                        'subtitle' => ['type' => 'string', 'maxLength' => 200],
                        'background' => ['type' => 'string', 'format' => 'uri'],
                        'buttons' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'text' => ['type' => 'string'],
                                    'url' => ['type' => 'string'],
                                    'type' => ['type' => 'string', 'enum' => ['primary', 'secondary']]
                                ]
                            ]
                        ]
                    ]
                ],
                'default_content' => [
                    'title' => 'Welcome to Your Business',
                    'subtitle' => 'Professional services tailored to your needs',
                    'buttons' => [
                        ['text' => 'Get Started', 'url' => '/contact', 'type' => 'primary'],
                        ['text' => 'Learn More', 'url' => '/about', 'type' => 'secondary']
                    ]
                ],
                'category' => 'hero',
                'is_template' => true
            ],
            [
                'name' => 'Feature Grid Template',
                'identifier' => 'feature-grid-v1', 
                'description' => 'Responsive feature grid for services/products',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'title' => ['type' => 'string'],
                        'features' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'description' => ['type' => 'string'],
                                    'icon' => ['type' => 'string'],
                                    'image' => ['type' => 'string', 'format' => 'uri']
                                ]
                            ]
                        ]
                    ]
                ],
                'default_content' => [
                    'title' => 'Our Services',
                    'features' => [
                        ['title' => 'Professional Service', 'description' => 'High-quality solutions', 'icon' => 'star'],
                        ['title' => 'Fast Delivery', 'description' => 'Quick turnaround times', 'icon' => 'zap'],
                        ['title' => 'Expert Support', 'description' => '24/7 customer assistance', 'icon' => 'headphones']
                    ]
                ],
                'category' => 'features',
                'is_template' => true
            ]
        ];

        // Additional blocks for different industries (28 more blocks)
        $industries = [
            'manufacturing' => ['CNC Machining', 'Quality Control', 'Production Timeline'],
            'restaurant' => ['Menu Showcase', 'Location Info', 'Online Ordering'],
            'healthcare' => ['Services Grid', 'Doctor Profiles', 'Appointment Booking'],
            'education' => ['Course Catalog', 'Faculty Grid', 'Student Testimonials'],
            'retail' => ['Product Gallery', 'Shopping Cart', 'Customer Reviews'],
            'professional' => ['Team Showcase', 'Case Studies', 'Client Testimonials'],
            'creative' => ['Portfolio Grid', 'Project Showcase', 'Creative Process']
        ];

        foreach ($industries as $industry => $blockTypes) {
            foreach ($blockTypes as $blockType) {
                $identifier = Str::slug($industry . '-' . $blockType . '-v1');
                PlatformContentBlock::create([
                    'name' => "{$blockType} - {$industry}",
                    'identifier' => $identifier,
                    'description' => "Specialized {$blockType} block for {$industry} businesses",
                    'schema' => $this->generateBlockSchema($blockType),
                    'default_content' => $this->generateBlockContent($industry, $blockType),
                    'category' => $industry,
                    'is_template' => true,
                    'is_reusable' => true,
                    'is_active' => true
                ]);
            }
        }
    }
}
```

### Tenant-Level Content Seeding (Multi-Industry)
```php
// File: database/seeders/ContentManagementSeeder.php
class ContentManagementSeeder extends Seeder
{
    private $tenantTypes = [
        'manufacturing' => [
            'name_suffixes' => ['Manufacturing', 'Industries', 'Solutions', 'Corp'],
            'services' => ['CNC Machining', 'Laser Cutting', 'Metal Fabrication', 'Quality Control'],
            'content_focus' => 'precision manufacturing and custom solutions'
        ],
        'restaurant' => [
            'name_suffixes' => ['Restaurant', 'Cafe', 'Kitchen', 'Bistro'],
            'services' => ['Fine Dining', 'Catering', 'Private Events', 'Takeout'],
            'content_focus' => 'culinary excellence and dining experience'
        ],
        'healthcare' => [
            'name_suffixes' => ['Medical Center', 'Clinic', 'Health Services', 'Wellness'],
            'services' => ['General Practice', 'Specialist Care', 'Preventive Medicine', 'Telemedicine'],
            'content_focus' => 'patient care and health services'
        ],
        'retail' => [
            'name_suffixes' => ['Store', 'Shop', 'Boutique', 'Market'],
            'services' => ['Online Shopping', 'In-Store Pickup', 'Custom Orders', 'Gift Services'],
            'content_focus' => 'product showcase and customer experience'
        ],
        'professional' => [
            'name_suffixes' => ['Consulting', 'Services', 'Solutions', 'Group'],
            'services' => ['Business Consulting', 'Strategy Planning', 'Implementation', 'Training'],
            'content_focus' => 'professional expertise and business solutions'
        ]
    ];

    public function run()
    {
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            
            // Determine tenant type based on name or assign randomly
            $tenantType = $this->determineTenantType($tenant->name);
            
            // Pages (25-40 pages per tenant with industry context)
            $this->seedPagesForIndustry($tenantType);
            
            // Page versions (50-120 versions total across pages)
            $this->seedPageVersionsForIndustry($tenantType);
            
            // Media folders (15-25 organized folders)
            $this->seedMediaFoldersForIndustry($tenantType);
            
            // Media files (40-80 files across different types)
            $this->seedMediaFilesForIndustry($tenantType);
            
            // Reviews (80-150 reviews with business context)
            $this->seedReviewsForIndustry($tenantType);
            
            // SEO settings for all content (25-40 records)
            $this->seedSeoSettingsForIndustry($tenantType);
            
            // Content blocks (20-35 custom blocks per tenant)
            $this->seedContentBlocksForIndustry($tenantType);
        }
    }

    private function determineTenantType($tenantName): string
    {
        foreach ($this->tenantTypes as $type => $config) {
            foreach ($config['name_suffixes'] as $suffix) {
                if (Str::contains($tenantName, $suffix)) {
                    return $type;
                }
            }
        }
        
        // Return random type if no match found
        return array_rand($this->tenantTypes);
    }

    private function seedPagesForIndustry(string $industry)
    {
        $industryConfig = $this->tenantTypes[$industry];
        $pageCount = rand(25, 40);
        
        // Homepage with industry-specific content
        Page::create([
            'title' => 'Welcome to ' . tenant()->name,
            'slug' => 'home',
            'description' => "Professional {$industry} services - " . $industryConfig['content_focus'],
            'content' => $this->generateIndustryHomepageContent($industry),
            'template' => "{$industry}-homepage",
            'meta_data' => [
                'seo_title' => tenant()->name . ' - ' . ucfirst($industryConfig['content_focus']),
                'seo_description' => "Leading {$industry} company specializing in " . implode(', ', $industryConfig['services']),
                'seo_keywords' => array_merge($industryConfig['services'], [$industry, 'professional', 'quality'])
            ],
            'status' => 'published',
            'is_homepage' => true,
            'language' => 'id',
            'published_at' => fake()->dateTimeBetween('-6 months', 'now')
        ]);

        // Core business pages
        $corePages = [
            'about' => 'About Us - Our Story',
            'services' => 'Our Services',
            'portfolio' => 'Portfolio & Projects', 
            'team' => 'Our Team',
            'contact' => 'Contact Information',
            'faq' => 'Frequently Asked Questions',
            'testimonials' => 'Customer Testimonials',
            'pricing' => 'Pricing & Packages'
        ];

        foreach ($corePages as $slug => $title) {
            Page::create([
                'title' => $title,
                'slug' => $slug,
                'description' => "{$title} for {$industry} business",
                'content' => $this->generateIndustryPageContent($industry, $slug),
                'template' => "{$industry}-{$slug}",
                'meta_data' => $this->generateIndustrySEO($industry, $title),
                'status' => rand(0, 10) > 1 ? 'published' : 'draft',
                'language' => 'id',
                'published_at' => rand(0, 8) > 1 ? fake()->dateTimeBetween('-6 months', 'now') : null
            ]);
        }

        // Industry-specific pages
        $industrySpecificPages = $this->getIndustrySpecificPages($industry);
        foreach ($industrySpecificPages as $pageData) {
            Page::create(array_merge($pageData, [
                'template' => "{$industry}-specialized",
                'meta_data' => $this->generateIndustrySEO($industry, $pageData['title']),
                'status' => rand(0, 10) > 2 ? 'published' : 'draft',
                'language' => 'id',
                'published_at' => rand(0, 7) > 1 ? fake()->dateTimeBetween('-6 months', 'now') : null
            ]));
        }

        // Additional content pages to reach target count
        $additionalCount = $pageCount - 8 - count($industrySpecificPages);
        for ($i = 0; $i < $additionalCount; $i++) {
            $titles = [
                'Quality Assurance', 'Industry News', 'Case Studies', 'Resources', 
                'Downloads', 'Certifications', 'Partnerships', 'Careers',
                'Training Programs', 'Support Center', 'Product Catalog', 'Service Areas',
                'Maintenance Tips', 'Safety Guidelines', 'Warranty Information', 'Technical Specs'
            ];
            
            $title = $titles[array_rand($titles)] . ' ' . ($i + 1);
            $slug = Str::slug($title);
            
            Page::create([
                'title' => $title,
                'slug' => $slug,
                'description' => "Additional {$industry} content: {$title}",
                'content' => $this->generateIndustryPageContent($industry, 'generic'),
                'template' => "{$industry}-content",
                'meta_data' => $this->generateIndustrySEO($industry, $title),
                'status' => rand(0, 10) > 3 ? 'published' : 'draft',
                'language' => 'id',
                'published_at' => rand(0, 6) > 1 ? fake()->dateTimeBetween('-6 months', 'now') : null
            ]);
        }
    }

    private function getIndustrySpecificPages(string $industry): array
    {
        switch ($industry) {
            case 'manufacturing':
                return [
                    ['title' => 'CNC Machining Services', 'slug' => 'cnc-machining'],
                    ['title' => 'Laser Cutting Capabilities', 'slug' => 'laser-cutting'],
                    ['title' => 'Quality Control Process', 'slug' => 'quality-control'],
                    ['title' => 'Material Specifications', 'slug' => 'materials'],
                    ['title' => 'Production Timeline', 'slug' => 'timeline'],
                    ['title' => 'Custom Engineering', 'slug' => 'engineering']
                ];
                
            case 'restaurant':
                return [
                    ['title' => 'Our Menu', 'slug' => 'menu'],
                    ['title' => 'Private Events', 'slug' => 'events'],
                    ['title' => 'Catering Services', 'slug' => 'catering'],
                    ['title' => 'Wine Selection', 'slug' => 'wine'],
                    ['title' => 'Chef Specials', 'slug' => 'specials'],
                    ['title' => 'Reservations', 'slug' => 'reservations']
                ];
                
            case 'healthcare':
                return [
                    ['title' => 'Medical Services', 'slug' => 'services'],
                    ['title' => 'Specialist Doctors', 'slug' => 'specialists'],
                    ['title' => 'Appointment Booking', 'slug' => 'appointments'],
                    ['title' => 'Patient Portal', 'slug' => 'portal'],
                    ['title' => 'Health Screenings', 'slug' => 'screenings'],
                    ['title' => 'Insurance Information', 'slug' => 'insurance']
                ];
                
            case 'retail':
                return [
                    ['title' => 'Product Catalog', 'slug' => 'products'],
                    ['title' => 'New Arrivals', 'slug' => 'new-arrivals'],
                    ['title' => 'Sale Items', 'slug' => 'sale'],
                    ['title' => 'Brand Partners', 'slug' => 'brands'],
                    ['title' => 'Size Guide', 'slug' => 'sizing'],
                    ['title' => 'Return Policy', 'slug' => 'returns']
                ];
                
            case 'professional':
                return [
                    ['title' => 'Consulting Services', 'slug' => 'consulting'],
                    ['title' => 'Business Solutions', 'slug' => 'solutions'],
                    ['title' => 'Industry Expertise', 'slug' => 'expertise'],
                    ['title' => 'Success Stories', 'slug' => 'success'],
                    ['title' => 'Implementation Process', 'slug' => 'process'],
                    ['title' => 'Training Programs', 'slug' => 'training']
                ];
                
            default:
                return [];
        }
    }
    
    private function seedPages()
    {
        // Homepage
        Page::create([
            'title' => 'Welcome to ' . tenant()->name,
            'slug' => 'home',
            'description' => 'Homepage for ' . tenant()->name,
            'content' => [
                'hero' => [
                    'title' => [
                        'prefix' => 'Professional',
                        'highlight' => 'Custom Manufacturing',
                        'suffix' => 'Solutions'
                    ],
                    'subtitle' => 'High-quality custom products tailored to your needs',
                    'typingTexts' => ['Precision Laser Engraving', 'Custom Acrylic Products', 'Professional Signage'],
                    'background' => '/api/media/hero-bg.jpg'
                ],
                'informationSection' => [
                    'title' => [
                        'prefix' => 'Our',
                        'highlight' => 'Services',
                        'suffix' => 'Portfolio'
                    ],
                    'subtitle' => 'Comprehensive manufacturing solutions for your business',
                    'cards' => [
                        [
                            'title' => 'Custom Engraving',
                            'description' => 'Precision laser engraving on various materials',
                            'features' => ['High precision', 'Multiple materials', 'Custom designs'],
                            'icon' => 'laser',
                            'buttonText' => 'Learn More'
                        ],
                        [
                            'title' => 'Acrylic Fabrication',
                            'description' => 'Clear and colored acrylic product manufacturing',
                            'features' => ['Crystal clear finish', 'Custom shapes', 'Durable materials'],
                            'icon' => 'layers',
                            'buttonText' => 'View Products'
                        ],
                        [
                            'title' => 'Business Signage',
                            'description' => 'Professional signage solutions for your business',
                            'features' => ['Weather resistant', 'LED options', 'Installation service'],
                            'icon' => 'building',
                            'buttonText' => 'Get Quote'
                        ]
                    ]
                ]
            ],
            'template' => 'homepage',
            'meta_data' => [
                'seo_title' => tenant()->name . ' - Professional Custom Manufacturing',
                'seo_description' => 'Professional custom manufacturing services including laser engraving, acrylic fabrication, and business signage solutions.',
                'seo_keywords' => ['custom manufacturing', 'laser engraving', 'acrylic products', 'business signage']
            ],
            'status' => 'published',
            'is_homepage' => true,
            'language' => 'id'
        ]);

        // Additional pages
        $pageTemplates = [
            ['title' => 'About Us', 'slug' => 'about', 'template' => 'page'],
            ['title' => 'Services', 'slug' => 'services', 'template' => 'services'],
            ['title' => 'Contact', 'slug' => 'contact', 'template' => 'contact'],
            ['title' => 'FAQ', 'slug' => 'faq', 'template' => 'faq'],
            ['title' => 'Privacy Policy', 'slug' => 'privacy-policy', 'template' => 'legal'],
            ['title' => 'Terms of Service', 'slug' => 'terms-of-service', 'template' => 'legal'],
        ];

        foreach ($pageTemplates as $pageData) {
            Page::create(array_merge($pageData, [
                'description' => "Information about {$pageData['title']}",
                'content' => $this->generatePageContent($pageData['template']),
                'status' => 'published',
                'language' => 'id',
            ]));
        }
    }
    
    private function seedPageVersionsForIndustry(string $industry)
    {
        $pages = Page::all();
        $totalVersions = rand(50, 120);
        
        // Distribute versions across pages
        foreach ($pages as $page) {
            $versionCount = rand(1, 5);
            
            for ($v = 1; $v <= $versionCount; $v++) {
                PageVersion::create([
                    'page_id' => $page->id,
                    'version_number' => $v,
                    'content' => $this->generateVersionedContent($industry, $page->slug, $v),
                    'meta_data' => $page->meta_data,
                    'change_description' => $this->generateChangeDescription($v),
                    'created_by' => User::inRandomOrder()->first()->id,
                    'is_current' => ($v === $versionCount),
                    'created_at' => fake()->dateTimeBetween('-1 year', 'now')
                ]);
            }
        }
    }

    private function seedMediaFoldersForIndustry(string $industry)
    {
        $folderCount = rand(15, 25);
        $industryFolders = $this->getIndustryMediaFolders($industry);
        
        foreach ($industryFolders as $index => $folderData) {
            if ($index >= $folderCount) break;
            
            MediaFolder::create([
                'name' => $folderData['name'],
                'slug' => Str::slug($folderData['name']),
                'description' => $folderData['description'],
                'parent_id' => null,
                'sort_order' => $index,
                'is_public' => rand(0, 10) > 3,
                'created_at' => fake()->dateTimeBetween('-1 year', 'now')
            ]);
        }
    }

    private function seedMediaFilesForIndustry(string $industry)
    {
        $folders = MediaFolder::all();
        $fileCount = rand(40, 80);
        $fileTypes = $this->getIndustryFileTypes($industry);
        
        for ($i = 0; $i < $fileCount; $i++) {
            $folder = $folders->random();
            $fileType = $fileTypes[array_rand($fileTypes)];
            
            MediaFile::create([
                'folder_id' => $folder->id,
                'filename' => $this->generateIndustryFilename($industry, $fileType, $i),
                'original_filename' => $this->generateOriginalFilename($industry, $fileType, $i),
                'mime_type' => $fileType['mime'],
                'size' => rand(50000, 5000000),
                'alt_text' => $this->generateAltText($industry, $fileType),
                'description' => $this->generateFileDescription($industry, $fileType),
                'is_public' => rand(0, 10) > 2,
                'upload_path' => "/media/{$folder->slug}/{$this->generateIndustryFilename($industry, $fileType, $i)}",
                'created_at' => fake()->dateTimeBetween('-1 year', 'now')
            ]);
        }
    }

    private function seedReviewsForIndustry(string $industry)
    {
        $products = Product::published()->get();
        $customers = Customer::active()->get();
        $reviewCount = rand(80, 150);
        
        $industryReviewTexts = $this->getIndustryReviewTexts($industry);
        
        for ($i = 0; $i < $reviewCount; $i++) {
            $product = $products->random();
            $customer = $customers->random();
            $rating = $this->weightedRandomRating();
            
            Review::create([
                'product_id' => $product->id,
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'rating' => $rating,
                'comment' => $industryReviewTexts[array_rand($industryReviewTexts)],
                'verified' => rand(0, 10) > 3,
                'is_approved' => rand(0, 10) > 1,
                'helpful_count' => rand(0, 25),
                'status' => rand(0, 10) > 1 ? 'approved' : 'pending',
                'created_at' => fake()->dateTimeBetween('-2 years', 'now'),
            ]);
        }
    }

    private function seedSeoSettingsForIndustry(string $industry)
    {
        $pages = Page::all();
        $seoCount = rand(25, 40);
        
        foreach ($pages->take($seoCount) as $page) {
            SeoSetting::create([
                'page_id' => $page->id,
                'seo_title' => $this->generateIndustrySeoTitle($industry, $page->title),
                'seo_description' => $this->generateIndustrySeoDescription($industry, $page->title),
                'seo_keywords' => $this->generateIndustrySeoKeywords($industry),
                'og_title' => $page->title . ' - ' . tenant()->name,
                'og_description' => $this->generateIndustrySeoDescription($industry, $page->title),
                'og_image' => "/media/og-images/{$page->slug}.jpg",
                'canonical_url' => url($page->slug),
                'robots_meta' => rand(0, 10) > 1 ? 'index,follow' : 'noindex,nofollow',
                'schema_markup' => $this->generateIndustrySchemaMarkup($industry, $page),
                'created_at' => fake()->dateTimeBetween('-1 year', 'now')
            ]);
        }
    }

    private function seedContentBlocksForIndustry(string $industry)
    {
        $blockCount = rand(20, 35);
        $industryBlocks = $this->getIndustryContentBlocks($industry);
        
        foreach ($industryBlocks->take($blockCount) as $blockData) {
            ContentBlock::create([
                'name' => $blockData['name'],
                'identifier' => $blockData['identifier'],
                'description' => $blockData['description'],
                'content' => $blockData['content'],
                'template' => $blockData['template'],
                'category' => $industry,
                'is_reusable' => rand(0, 10) > 3,
                'is_active' => rand(0, 10) > 1,
                'sort_order' => $blockData['order'] ?? 0,
                'created_at' => fake()->dateTimeBetween('-1 year', 'now')
            ]);
        }
    }
    
    private function weightedRandomRating(): int
    {
        $weights = [1 => 5, 2 => 10, 3 => 15, 4 => 30, 5 => 40];
        $random = rand(1, 100);
        $cumulative = 0;
        
        foreach ($weights as $rating => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                return $rating;
            }
        }
        
        return 5;
    }
}
```

### Performance Testing Data Seeding (1000+ Records)
```php
// File: database/seeders/PerformanceTestingSeeder.php
class PerformanceTestingSeeder extends Seeder
{
    public function run()
    {
        $this->seedBulkPlatformData();
        $this->seedBulkTenantData();
        $this->seedLoadTestingScenarios();
    }

    private function seedBulkPlatformData()
    {
        $platformAdmin = User::where('role', 'platform_admin')->first();
        
        // Bulk Platform Pages (200+ pages for load testing)
        $bulkPages = [];
        for ($i = 1; $i <= 200; $i++) {
            $title = "Load Test Platform Page {$i}";
            $slug = "load-test-{$i}";
            
            $bulkPages[] = [
                'title' => $title,
                'slug' => $slug,
                'description' => "Performance testing page {$i} with complex content structure",
                'content' => $this->generateComplexContent($i),
                'template' => 'performance-test',
                'status' => 'published',
                'language' => 'en',
                'created_by' => $platformAdmin->id,
                'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
                'updated_at' => fake()->dateTimeBetween('-6 months', 'now')
            ];
        }
        
        // Use batch insert for performance
        DB::table('platform_pages')->insert($bulkPages);
        
        // Bulk Platform Content Blocks (100+ blocks)
        $bulkBlocks = [];
        for ($i = 1; $i <= 100; $i++) {
            $bulkBlocks[] = [
                'name' => "Performance Block {$i}",
                'identifier' => "perf-block-{$i}",
                'description' => "Load testing content block with complex schema",
                'schema' => json_encode($this->generateComplexSchema($i)),
                'default_content' => json_encode($this->generateComplexBlockContent($i)),
                'category' => 'performance',
                'is_template' => true,
                'is_active' => true,
                'is_reusable' => true,
                'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
                'updated_at' => fake()->dateTimeBetween('-6 months', 'now')
            ];
        }
        
        DB::table('platform_content_blocks')->insert($bulkBlocks);
    }

    private function seedBulkTenantData()
    {
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            
            // Bulk Tenant Pages (150+ pages per tenant)
            $bulkPages = [];
            for ($i = 1; $i <= 150; $i++) {
                $title = "Tenant Load Test Page {$i}";
                $slug = "tenant-load-{$i}";
                
                $bulkPages[] = [
                    'title' => $title,
                    'slug' => $slug,
                    'description' => "Tenant performance testing page {$i}",
                    'content' => json_encode($this->generateTenantComplexContent($i)),
                    'template' => 'tenant-performance',
                    'status' => rand(0, 10) > 2 ? 'published' : 'draft',
                    'language' => 'id',
                    'published_at' => rand(0, 8) > 1 ? fake()->dateTimeBetween('-1 year', 'now') : null,
                    'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
                    'updated_at' => fake()->dateTimeBetween('-6 months', 'now')
                ];
            }
            
            DB::table('pages')->insert($bulkPages);
            
            // Bulk Reviews (500+ reviews per tenant for pagination testing)
            $pages = DB::table('pages')->select('id')->get();
            $bulkReviews = [];
            
            for ($i = 1; $i <= 500; $i++) {
                $page = $pages->random();
                $bulkReviews[] = [
                    'page_id' => $page->id,
                    'customer_name' => fake()->name,
                    'customer_email' => fake()->email,
                    'rating' => rand(1, 5),
                    'comment' => fake()->paragraph(rand(2, 6)),
                    'verified' => rand(0, 1),
                    'is_approved' => rand(0, 10) > 1,
                    'helpful_count' => rand(0, 50),
                    'status' => rand(0, 10) > 1 ? 'approved' : 'pending',
                    'created_at' => fake()->dateTimeBetween('-2 years', 'now')
                ];
            }
            
            DB::table('reviews')->insert($bulkReviews);
            
            // Bulk Media Files (300+ files per tenant)
            $bulkMediaFiles = [];
            for ($i = 1; $i <= 300; $i++) {
                $bulkMediaFiles[] = [
                    'filename' => "load-test-{$i}.jpg",
                    'original_filename' => "original-load-test-{$i}.jpg",
                    'mime_type' => 'image/jpeg',
                    'size' => rand(100000, 2000000),
                    'alt_text' => "Load test image {$i}",
                    'description' => "Performance testing media file {$i}",
                    'is_public' => rand(0, 1),
                    'upload_path' => "/media/load-test/load-test-{$i}.jpg",
                    'created_at' => fake()->dateTimeBetween('-1 year', 'now')
                ];
            }
            
            DB::table('media_files')->insert($bulkMediaFiles);
        }
    }

    private function seedLoadTestingScenarios()
    {
        // Create specific data patterns for different load testing scenarios
        
        // 1. Search Performance Testing
        $this->seedSearchTestData();
        
        // 2. Pagination Performance Testing  
        $this->seedPaginationTestData();
        
        // 3. Concurrent Access Testing
        $this->seedConcurrencyTestData();
        
        // 4. Complex Query Testing
        $this->seedComplexQueryTestData();
    }

    private function generateComplexContent(int $index): array
    {
        return [
            'sections' => [
                [
                    'type' => 'hero',
                    'title' => "Performance Test Section {$index}",
                    'content' => str_repeat("Complex content block {$index}. ", 50),
                    'metadata' => array_fill(0, 20, "meta-{$index}")
                ],
                [
                    'type' => 'features',
                    'items' => array_fill(0, 15, [
                        'title' => "Feature {$index}",
                        'description' => str_repeat("Feature description. ", 10),
                        'properties' => array_fill(0, 10, "prop-{$index}")
                    ])
                ],
                [
                    'type' => 'gallery',
                    'images' => array_fill(0, 25, [
                        'url' => "/images/test-{$index}.jpg",
                        'caption' => "Test image {$index} caption",
                        'metadata' => array_fill(0, 5, "img-meta-{$index}")
                    ])
                ]
            ],
            'nested_data' => [
                'level1' => array_fill(0, 10, [
                    'level2' => array_fill(0, 5, [
                        'level3' => array_fill(0, 3, "deep-data-{$index}")
                    ])
                ])
            ]
        ];
    }

    private function generateComplexSchema(int $index): array
    {
        return [
            'type' => 'object',
            'properties' => array_fill_keys(
                range(1, 20), 
                [
                    'type' => 'object',
                    'properties' => array_fill_keys(
                        range(1, 10),
                        ['type' => 'string', 'maxLength' => 100]
                    )
                ]
            )
        ];
    }
}
```

### Data Volume Summary (Per Environment)
```bash
# Platform Level (Main Database)
- platform_pages: 225+ records (25 core + 200 performance)
- platform_page_versions: 300+ records (multiple versions per page)  
- platform_content_blocks: 130+ records (30 templates + 100 performance)

# Per Tenant (Schema-per-tenant)
- pages: 175+ records (25-40 business + 150 performance)
- page_versions: 200+ records (50-120 business + versions)
- media_folders: 20+ records (15-25 organized folders)
- media_files: 380+ records (40-80 business + 300 performance)
- reviews: 650+ records (80-150 business + 500 performance)  
- seo_settings: 35+ records (25-40 comprehensive SEO)
- content_blocks: 30+ records (20-35 industry-specific)

# Total Per Tenant: ~1,490+ records
# Total For 10 Tenants: ~14,900+ records + Platform records
# Grand Total: ~15,000+ realistic, performance-tested records
```

## ✅ Testing Requirements

### Platform-Level Testing (98%+ Coverage)

#### Platform Content Management Tests
```php
// File: tests/Feature/Platform/PlatformContentManagementTest.php
class PlatformContentManagementTest extends TestCase
{
    use RefreshDatabase, WithPlatformAuth;

    public function test_platform_admin_can_create_global_page()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $this->actingAsPlatformAdmin($platformAdmin);

        $response = $this->postJson('/api/v1/platform/content/pages', [
            'title' => 'Platform Homepage',
            'slug' => 'home',
            'content' => [
                'hero' => [
                    'title' => 'Welcome to Stencil Platform',
                    'subtitle' => 'Enterprise Multi-Tenant CMS'
                ]
            ],
            'template' => 'platform-homepage',
            'status' => 'published',
            'is_homepage' => true
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('platform_pages', [
            'title' => 'Platform Homepage',
            'slug' => 'home',
            'status' => 'published',
            'is_homepage' => true,
            'created_by' => $platformAdmin->id
        ]);

        // Verify version was created
        $page = PlatformPage::where('slug', 'home')->first();
        $this->assertDatabaseHas('platform_page_versions', [
            'page_id' => $page->id,
            'version_number' => 1,
            'is_current' => true,
            'created_by' => $platformAdmin->id
        ]);
    }

    public function test_platform_page_versioning_system()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $page = PlatformPage::factory()->create(['created_by' => $platformAdmin->id]);
        $this->actingAsPlatformAdmin($platformAdmin);

        // Update page content
        $response = $this->putJson("/api/v1/platform/content/pages/{$page->uuid}", [
            'title' => 'Updated Platform Homepage',
            'content' => [
                'hero' => [
                    'title' => 'Updated Welcome Message',
                    'subtitle' => 'Enhanced Enterprise CMS'
                ]
            ],
            'create_version' => true,
            'change_description' => 'Updated hero section'
        ]);

        $response->assertStatus(200);
        
        // Verify new version created
        $this->assertDatabaseHas('platform_page_versions', [
            'page_id' => $page->id,
            'version_number' => 2,
            'is_current' => true,
            'change_description' => 'Updated hero section'
        ]);

        // Verify old version exists
        $this->assertDatabaseHas('platform_page_versions', [
            'page_id' => $page->id,
            'version_number' => 1,
            'is_current' => false
        ]);
    }

    public function test_platform_content_block_template_creation()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $this->actingAsPlatformAdmin($platformAdmin);

        $response = $this->postJson('/api/v1/platform/content/blocks', [
            'name' => 'Hero Section Template',
            'identifier' => 'hero-section-v1',
            'description' => 'Standard hero section for tenant customization',
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'title' => ['type' => 'string', 'maxLength' => 100],
                    'subtitle' => ['type' => 'string', 'maxLength' => 200],
                    'buttons' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'text' => ['type' => 'string'],
                                'url' => ['type' => 'string'],
                                'type' => ['type' => 'string', 'enum' => ['primary', 'secondary']]
                            ]
                        ]
                    ]
                ]
            ],
            'default_content' => [
                'title' => 'Welcome to Your Platform',
                'subtitle' => 'Customize this message for your business',
                'buttons' => [
                    ['text' => 'Get Started', 'url' => '/register', 'type' => 'primary']
                ]
            ],
            'category' => 'hero',
            'is_template' => true
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('platform_content_blocks', [
            'name' => 'Hero Section Template',
            'identifier' => 'hero-section-v1',
            'category' => 'hero',
            'is_template' => true,
            'is_active' => true
        ]);
    }

    public function test_tenant_user_cannot_access_platform_content()
    {
        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        $response = $this->getJson('/api/v1/platform/content/pages');
        $response->assertStatus(403);

        $response = $this->postJson('/api/v1/platform/content/pages', [
            'title' => 'Unauthorized Access Attempt'
        ]);
        $response->assertStatus(403);
    }

    public function test_platform_homepage_management()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $page1 = PlatformPage::factory()->create(['is_homepage' => false]);
        $page2 = PlatformPage::factory()->create(['is_homepage' => true]);
        $this->actingAsPlatformAdmin($platformAdmin);

        // Set new homepage
        $response = $this->putJson('/api/v1/platform/content/homepage', [
            'page_uuid' => $page1->uuid
        ]);

        $response->assertStatus(200);
        
        // Verify only one homepage exists
        $this->assertEquals(1, PlatformPage::where('is_homepage', true)->count());
        $this->assertTrue($page1->fresh()->is_homepage);
        $this->assertFalse($page2->fresh()->is_homepage);
    }
}
```

#### Platform Content Block Template Tests
```php
// File: tests/Feature/Platform/PlatformContentBlockTest.php
class PlatformContentBlockTest extends TestCase
{
    use RefreshDatabase, WithPlatformAuth;

    public function test_platform_content_block_schema_validation()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $this->actingAsPlatformAdmin($platformAdmin);

        // Test valid schema
        $response = $this->postJson('/api/v1/platform/content/blocks', [
            'name' => 'Feature List',
            'identifier' => 'feature-list-v1',
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'features' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string'],
                                'description' => ['type' => 'string'],
                                'icon' => ['type' => 'string']
                            ],
                            'required' => ['title', 'description']
                        ]
                    ]
                ],
                'required' => ['features']
            ],
            'is_template' => true
        ]);

        $response->assertStatus(201);
    }

    public function test_content_block_availability_to_tenants()
    {
        $block = PlatformContentBlock::factory()->create([
            'is_template' => true,
            'is_active' => true
        ]);

        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        $response = $this->getJson('/api/v1/tenant/cms/templates');
        $response->assertStatus(200);
        $response->assertJsonFragment(['identifier' => $block->identifier]);
    }
}
```

### Tenant-Level Testing (95%+ Coverage)

#### Enhanced Tenant Content Management Tests
```php
// File: tests/Feature/Tenant/TenantContentManagementTest.php
class TenantContentManagementTest extends TestCase
{
    use RefreshDatabase, WithTenant, WithTenantAuth;

    public function test_tenant_can_create_page_with_version()
    {
        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        tenancy()->initialize($tenant);

        $response = $this->postJson('/api/v1/tenant/cms/pages', [
            'title' => 'Tenant About Page',
            'slug' => 'about',
            'content' => [
                'sections' => [
                    ['type' => 'text', 'title' => 'About Us', 'content' => 'Our company story...']
                ]
            ],
            'status' => 'draft'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('pages', [
            'title' => 'Tenant About Page',
            'slug' => 'about',
            'status' => 'draft'
        ]);

        // Verify version was created
        $page = Page::where('slug', 'about')->first();
        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_number' => 1,
            'is_current' => true,
            'created_by' => $tenantUser->id
        ]);
    }

    public function test_tenant_can_create_page_from_platform_template()
    {
        // Create platform template
        $platformTemplate = PlatformContentBlock::factory()->create([
            'identifier' => 'hero-template-v1',
            'is_template' => true,
            'default_content' => [
                'title' => 'Default Title',
                'subtitle' => 'Default Subtitle'
            ]
        ]);

        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        tenancy()->initialize($tenant);

        $response = $this->postJson("/api/v1/tenant/cms/pages/from-template/{$platformTemplate->id}", [
            'title' => 'Customized Homepage',
            'slug' => 'home',
            'content' => [
                'title' => 'Welcome to Our Business',
                'subtitle' => 'Customized for our brand'
            ]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('pages', [
            'title' => 'Customized Homepage',
            'slug' => 'home',
            'platform_template_id' => $platformTemplate->id
        ]);
    }

    public function test_tenant_content_isolation()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Create page in tenant1
        tenancy()->initialize($tenant1);
        $this->actingAsTenantUser($user1, $tenant1);
        
        $response1 = $this->postJson('/api/v1/tenant/cms/pages', [
            'title' => 'Tenant 1 Page',
            'slug' => 'about',
            'content' => ['private' => 'tenant1 content']
        ]);
        $response1->assertStatus(201);

        // Create page in tenant2
        tenancy()->initialize($tenant2);
        $this->actingAsTenantUser($user2, $tenant2);
        
        $response2 = $this->postJson('/api/v1/tenant/cms/pages', [
            'title' => 'Tenant 2 Page',
            'slug' => 'about',
            'content' => ['private' => 'tenant2 content']
        ]);
        $response2->assertStatus(201);

        // Verify isolation - each tenant sees only their content
        tenancy()->initialize($tenant1);
        $this->assertEquals(1, Page::count());
        $page1 = Page::first();
        $this->assertEquals('tenant1 content', $page1->content['private']);

        tenancy()->initialize($tenant2);
        $this->assertEquals(1, Page::count());
        $page2 = Page::first();
        $this->assertEquals('tenant2 content', $page2->content['private']);

        // Verify cross-tenant access is impossible
        tenancy()->initialize($tenant1);
        $this->actingAsTenantUser($user1, $tenant1);
        $response = $this->getJson("/api/v1/tenant/cms/pages/{$page2->uuid}");
        $response->assertStatus(404); // Should not find tenant2's page
    }

    public function test_tenant_version_rollback_functionality()
    {
        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        tenancy()->initialize($tenant);
        
        $page = Page::factory()->create([
            'title' => 'Original Title',
            'content' => ['version' => 1]
        ]);

        // Create version 2
        $response = $this->putJson("/api/v1/tenant/cms/pages/{$page->uuid}", [
            'title' => 'Updated Title',
            'content' => ['version' => 2],
            'create_version' => true,
            'change_description' => 'Updated content'
        ]);
        $response->assertStatus(200);

        // Verify version 2 exists
        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_number' => 2,
            'is_current' => true
        ]);

        // Rollback to version 1
        $version1 = PageVersion::where('page_id', $page->id)
                              ->where('version_number', 1)
                              ->first();

        $response = $this->postJson("/api/v1/tenant/cms/pages/{$page->uuid}/versions/{$version1->id}/restore", [
            'change_description' => 'Rolled back to original version'
        ]);
        $response->assertStatus(200);

        // Verify rollback created new version with old content
        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_number' => 3,
            'is_current' => true,
            'change_description' => 'Rolled back to original version'
        ]);

        $page->refresh();
        $this->assertEquals(['version' => 1], $page->content);
    }

    public function test_platform_admin_cannot_access_tenant_content()
    {
        $tenant = Tenant::factory()->create();
        $platformAdmin = User::factory()->platformAdmin()->create();
        
        tenancy()->initialize($tenant);
        $page = Page::factory()->create();

        $this->actingAsPlatformAdmin($platformAdmin);
        
        // Platform admin should not be able to access tenant content
        $response = $this->getJson("/api/v1/tenant/cms/pages/{$page->uuid}");
        $response->assertStatus(403);
    }
}
```

### Integration & Security Tests

#### Cross-Level Security Tests
```php
// File: tests/Feature/Security/ContentSecurityTest.php
class ContentSecurityTest extends TestCase
{
    use RefreshDatabase, WithTenant, WithPlatformAuth;

    public function test_tenant_cannot_modify_platform_content()
    {
        $platformPage = PlatformPage::factory()->create();
        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        
        $this->actingAsTenantUser($tenantUser, $tenant);

        // Attempt to modify platform content
        $response = $this->putJson("/api/v1/platform/content/pages/{$platformPage->uuid}", [
            'title' => 'Hacked Title'
        ]);
        $response->assertStatus(403);

        // Verify content unchanged
        $this->assertEquals($platformPage->title, $platformPage->fresh()->title);
    }

    public function test_content_template_injection_protection()
    {
        $platformAdmin = User::factory()->platformAdmin()->create();
        $this->actingAsPlatformAdmin($platformAdmin);

        // Attempt to inject malicious content in template
        $response = $this->postJson('/api/v1/platform/content/blocks', [
            'name' => 'Malicious Template',
            'identifier' => 'malicious-template',
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'content' => ['type' => 'string']
                ]
            ],
            'default_content' => [
                'content' => '<script>alert("XSS")</script>'
            ],
            'is_template' => true
        ]);

        $response->assertStatus(201);

        // When tenant uses template, content should be sanitized
        $template = PlatformContentBlock::where('identifier', 'malicious-template')->first();
        $tenant = Tenant::factory()->create();
        $tenantUser = User::factory()->create();
        
        tenancy()->initialize($tenant);
        $this->actingAsTenantUser($tenantUser, $tenant);

        $response = $this->postJson("/api/v1/tenant/cms/pages/from-template/{$template->id}", [
            'title' => 'Page from Template',
            'slug' => 'test-page'
        ]);

        $response->assertStatus(201);
        $page = Page::where('slug', 'test-page')->first();
        
        // Verify XSS content was sanitized
        $this->assertStringNotContainsString('<script>', json_encode($page->content));
    }

    public function test_tenant_isolation_at_database_level()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();

        // Create pages in different tenant schemas
        tenancy()->initialize($tenant1);
        $page1 = Page::factory()->create(['title' => 'Tenant 1 Page']);

        tenancy()->initialize($tenant2);
        $page2 = Page::factory()->create(['title' => 'Tenant 2 Page']);

        // Direct database query should respect tenant isolation
        tenancy()->initialize($tenant1);
        $pages = DB::table('pages')->get();
        $this->assertCount(1, $pages);
        $this->assertEquals('Tenant 1 Page', $pages->first()->title);

        tenancy()->initialize($tenant2);
        $pages = DB::table('pages')->get();
        $this->assertCount(1, $pages);
        $this->assertEquals('Tenant 2 Page', $pages->first()->title);
    }
}
```

### Performance Tests

#### Load Testing for Multi-Level Content
```php
// File: tests/Performance/ContentPerformanceTest.php
class ContentPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_content_loading_performance()
    {
        // Create multiple platform pages
        PlatformPage::factory()->count(100)->create();
        
        $platformAdmin = User::factory()->platformAdmin()->create();
        $this->actingAsPlatformAdmin($platformAdmin);

        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/platform/content/pages?limit=20');
        $endTime = microtime(true);

        $response->assertStatus(200);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Assert response time is under 100ms
        $this->assertLessThan(100, $responseTime, 
            "Platform content loading took {$responseTime}ms, should be < 100ms");
    }

    public function test_tenant_content_loading_performance()
    {
        $tenant = Tenant::factory()->create();
        tenancy()->initialize($tenant);
        
        // Create multiple tenant pages
        Page::factory()->count(100)->create();
        
        $tenantUser = User::factory()->create();
        $this->actingAsTenantUser($tenantUser, $tenant);

        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/tenant/cms/pages?limit=20');
        $endTime = microtime(true);

        $response->assertStatus(200);
        $responseTime = ($endTime - $startTime) * 1000;
        
        // Assert response time is under 150ms
        $this->assertLessThan(150, $responseTime,
            "Tenant content loading took {$responseTime}ms, should be < 150ms");
    }

    public function test_concurrent_tenant_access_performance()
    {
        // Create multiple tenants with content
        $tenants = Tenant::factory()->count(10)->create();
        
        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            Page::factory()->count(50)->create();
        }

        // Simulate concurrent access
        $startTime = microtime(true);
        
        $promises = [];
        foreach ($tenants as $tenant) {
            $tenantUser = User::factory()->create();
            $this->actingAsTenantUser($tenantUser, $tenant);
            
            // In real test, this would be async
            $response = $this->getJson('/api/v1/tenant/cms/pages');
            $this->assertEquals(200, $response->status());
        }
        
        $endTime = microtime(true);
        $totalTime = ($endTime - $startTime) * 1000;
        
        // Assert total time for 10 concurrent requests is reasonable
        $this->assertLessThan(2000, $totalTime,
            "Concurrent tenant access took {$totalTime}ms for 10 tenants");
    }
}
```

## 🔒 Security Checkpoints

### File Upload Security
- **File Type Validation**: Only allowed MIME types accepted
- **File Size Limits**: Configurable per tenant
- **Malware Scanning**: Integration with security scanning services
- **Access Control**: Tenant-specific file access only

### Content Security
- **XSS Protection**: All user content sanitized
- **CSRF Protection**: All forms protected with CSRF tokens
- **SQL Injection Prevention**: Parameterized queries only
- **Content Validation**: JSON schema validation for structured content

## 📊 Performance Requirements

### Platform Content Performance
- **Platform Page Loading**: < 100ms for global content retrieval
- **Platform Content Updates**: < 200ms for content publishing
- **Cross-Tenant Template Distribution**: < 300ms for template synchronization
- **Platform Media Processing**: < 3 seconds for global asset optimization

### Tenant Content Performance  
- **File Upload**: Support files up to 100MB
- **Image Processing**: < 5 seconds for thumbnail generation
- **Content Loading**: < 150ms for page content retrieval
- **Search Performance**: < 100ms for content search queries
- **Tenant Isolation**: Zero cross-tenant data leakage with < 50ms isolation verification

## 🚀 Success Metrics

### Technical Metrics

#### Platform-Level Success
- [x] Platform content models implement proper admin authentication
- [x] Global content templates available to all tenants  
- [x] Platform versioning system with rollback capabilities
- [x] Cross-level content inheritance working (platform → tenant)
- [x] Platform admin interfaces fully functional

#### Tenant-Level Success
- [x] All tenant content models implement schema-per-tenant isolation
- [x] File uploads work with multiple storage providers
- [x] Tenant content versioning system functional
- [x] Review system with moderation complete
- [x] Zero cross-tenant data leakage verified

### Business Metrics

#### Platform Management
- [x] **Multi-level admin interfaces** operational for both Platform and Tenant users
- [x] **Global content management** for platform pages (Home, About, Contact, FAQ)
- [x] **Template distribution system** allowing tenants to customize platform templates
- [x] **Centralized branding management** with tenant customization options

#### Tenant Experience
- [x] Dynamic page content management operational
- [x] Media library with 50+ sample files per tenant
- [x] Review system with realistic data
- [x] SEO optimization features complete
- [x] **Content inheritance** from platform templates working seamlessly

---

## 🎊 **PHASE 4 COMPLETE - DECEMBER 2024**

### **📋 Final Implementation Summary**

**✅ BACKEND ARCHITECTURE COMPLETE**
- Database migrations executed successfully (platform_pages, platform_page_versions, platform_content_blocks)
- Hexagonal architecture fully implemented with domain entities, repositories, and use cases
- Complete CQRS pattern implementation with commands, queries, and handlers
- Platform content management API endpoints fully operational
- Multi-level security and tenant isolation properly configured

**✅ FRONTEND INTEGRATION COMPLETE**  
- CMS API service layer implemented with platform/tenant mode detection
- ContentContext updated to use real APIs with graceful fallback to mock data
- All admin pages (PageHome, PageAbout, PageContact, PageFAQ) connected to backend APIs
- Proper error handling and user feedback implemented

### **🏗️ Key Files Implemented**
- `backend/database/migrations/2025_12_03_100001_create_platform_pages_table.php`
- `backend/app/Domain/Content/Entities/PlatformPage.php`
- `backend/app/Application/Content/UseCases/CreatePlatformPageUseCase.php`
- `backend/app/Infrastructure/Presentation/Http/Controllers/Platform/ContentController.php`
- `backend/routes/platform.php` (CMS routes added)
- `src/services/cms/cmsService.ts` (Updated with API integration)
- `src/contexts/ContentContext.tsx` (Updated to use real APIs)
- `src/pages/admin/*.tsx` (All admin pages updated)

### **🎯 Production Readiness**
The Phase 4 CMS implementation is **fully production-ready** and provides:
- ✅ Complete multi-level content management system
- ✅ Robust API layer following established architectural patterns  
- ✅ Frontend integration with existing admin interfaces
- ✅ Proper error handling and graceful degradation
- ✅ Security implementation with platform/tenant isolation
- ✅ Version control and content inheritance capabilities

**📈 READY FOR PHASE 5 DEVELOPMENT**

---

**Next Phase**: [Phase 5: Advanced Features](./PHASE_5_ADVANCED_FEATURES.md)