# Phase 4: Content Management System
**Duration**: 4 Weeks (Weeks 13-16)  
**Priority**: HIGH  
**Prerequisites**: ✅ Phase 4A-4C (Complete Hexagonal Architecture + DDD + CQRS + Business Logic) - **MUST BE 100% COMPLETE**

## 🎯 Phase Overview

This phase implements a comprehensive Content Management System (CMS) following the **established Hexagonal Architecture + DDD + CQRS patterns** from Phase 4C. The CMS integrates seamlessly with existing **Order Management**, **Authentication Infrastructure**, and **Business Workflows** while maintaining strict **schema-per-tenant isolation**.

**🏗️ ARCHITECTURE ALIGNMENT**: All implementations must follow the established **Use Cases → Command/Query Handlers → Application Services** pattern from Phase 4C, with no direct controller-to-model access.

### Key Deliverables
- **Dynamic Page Content Management** with structured content blocks
- **Media Library System** with tenant isolation and CDN integration
- **Customer Review & Rating System** with moderation features
- **SEO Management Tools** with meta optimization and analytics
- **File Upload & Storage** with multiple storage providers
- **Content Versioning** with rollback capabilities

## 📋 Week-by-Week Breakdown

### Week 13: Dynamic Content Management Foundation

#### Day 1-2: Page Content Models & Migration
**⚠️ CRITICAL**: All models must follow **schema-per-tenant isolation** - NO `tenant_id` fields needed.

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
    $table->datetime('published_at')->nullable();
    $table->timestamps();
    
    $table->foreign('parent_id')->references('id')->on('pages')->onDelete('cascade');
    $table->unique(['tenant_id', 'slug', 'language']);
    $table->index(['tenant_id', 'status']);
    $table->index(['tenant_id', 'is_homepage']);
});

// File: database/migrations/create_page_versions_table.php
Schema::create('page_versions', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
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
    $table->unique(['tenant_id', 'page_id', 'version_number']);
    $table->index(['tenant_id', 'page_id', 'is_current']);
});

// File: database/migrations/create_content_blocks_table.php
Schema::create('content_blocks', function (Blueprint $table) {
    $table->id();
    $table->string('tenant_id')->index();
    $table->string('name');
    $table->string('identifier')->index();
    $table->text('description')->nullable();
    $table->json('schema'); // JSON schema for block structure
    $table->json('default_content')->nullable();
    $table->string('category')->default('general');
    $table->boolean('is_reusable')->default(true);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    
    $table->unique(['tenant_id', 'identifier']);
    $table->index(['tenant_id', 'category']);
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

### Content & Media Seeding (100+ Records)
```php
// File: database/seeders/ContentManagementSeeder.php
class ContentManagementSeeder extends Seeder
{
    public function run()
    {
        $tenants = Tenant::all();
        
        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            
            // Pages (20 pages including homepage)
            $this->seedPages();
            
            // Media folders (10 organized folders)
            $this->seedMediaFolders();
            
            // Media files (50 files across different types)
            $this->seedMediaFiles();
            
            // Reviews (100 reviews across products)
            $this->seedReviews();
            
            // SEO settings for all content
            $this->seedSeoSettings();
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
    
    private function seedReviews()
    {
        $products = Product::published()->get();
        $customers = Customer::active()->get();
        
        $reviewTexts = [
            'Excellent quality and fast delivery. Highly recommended!',
            'Professional service and attention to detail. Very satisfied with the result.',
            'The product exceeded my expectations. Will definitely order again.',
            'Great communication throughout the process. The final product is perfect.',
            'Outstanding work! The engraving quality is superb.',
            'Very pleased with the service. Professional and reliable.',
            'The acrylic quality is excellent and the finishing is perfect.',
            'Quick turnaround time and excellent customer service.',
            'Highly recommend for custom manufacturing needs.',
            'Professional quality work at competitive prices.'
        ];

        foreach ($products as $product) {
            $reviewCount = rand(3, 15);
            
            for ($i = 0; $i < $reviewCount; $i++) {
                $customer = $customers->random();
                $rating = $this->weightedRandomRating();
                
                Review::create([
                    'product_id' => $product->id,
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'customer_email' => $customer->email,
                    'rating' => $rating,
                    'comment' => $reviewTexts[array_rand($reviewTexts)],
                    'verified' => rand(0, 1),
                    'is_approved' => true,
                    'helpful_count' => rand(0, 10),
                    'status' => 'approved',
                    'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
                ]);
            }
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

## ✅ Testing Requirements

### Integration Tests (95%+ Coverage)
```php
// File: tests/Feature/ContentManagement/PageManagementTest.php
class PageManagementTest extends TestCase
{
    use RefreshDatabase, WithTenant;

    public function test_can_create_page_with_version()
    {
        $page = Page::factory()->create();
        
        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_number' => 1,
            'is_current' => true,
        ]);
    }

    public function test_can_create_new_version_when_updating()
    {
        $page = Page::factory()->create();
        
        $page->update(['title' => 'Updated Title']);
        $page->createVersion('Updated title');
        
        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_number' => 2,
            'is_current' => true,
        ]);
    }

    public function test_pages_are_tenant_isolated()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        tenancy()->initialize($tenant1);
        $page1 = Page::factory()->create();
        
        tenancy()->initialize($tenant2);
        $page2 = Page::factory()->create();
        
        tenancy()->initialize($tenant1);
        $this->assertEquals(1, Page::count());
        
        tenancy()->initialize($tenant2);
        $this->assertEquals(1, Page::count());
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

- **File Upload**: Support files up to 100MB
- **Image Processing**: < 5 seconds for thumbnail generation
- **Content Loading**: < 150ms for page content retrieval
- **Search Performance**: < 100ms for content search queries

## 🚀 Success Metrics

### Technical Metrics
- [x] All content models implement tenant isolation
- [x] File uploads work with multiple storage providers
- [x] Content versioning system functional
- [x] Review system with moderation complete

### Business Metrics
- [x] Dynamic page content management operational
- [x] Media library with 50+ sample files
- [x] Review system with realistic data
- [x] SEO optimization features complete

---

**Next Phase**: [Phase 5: Advanced Features](./PHASE_5_ADVANCED_FEATURES.md)