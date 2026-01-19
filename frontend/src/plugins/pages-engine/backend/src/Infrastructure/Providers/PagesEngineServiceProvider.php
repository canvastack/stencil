<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Providers;

use Illuminate\Support\ServiceProvider;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentCommentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentUrlRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentTagRepositoryInterface;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentTypeEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentCategoryEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentCommentEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentRevisionEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentUrlEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Repositories\ContentTagEloquentRepository;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCategoryEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCommentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentRevisionEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentUrlEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTagEloquentModel;
use Plugins\PagesEngine\Domain\Services\SlugGenerator;
use Plugins\PagesEngine\Domain\Services\RevisionManager;
use Plugins\PagesEngine\Domain\Services\ContentUrlBuilder;
use Plugins\PagesEngine\Http\Controllers\Admin\ContentTypeController as AdminContentTypeController;
use Plugins\PagesEngine\Http\Controllers\Admin\ContentController as AdminContentController;
use Plugins\PagesEngine\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use Plugins\PagesEngine\Http\Controllers\Admin\CommentController as AdminCommentController;
use Plugins\PagesEngine\Http\Controllers\Admin\RevisionController as AdminRevisionController;
use Plugins\PagesEngine\Http\Controllers\Admin\UrlController as AdminUrlController;
use Plugins\PagesEngine\Http\Controllers\Public\ContentController as PublicContentController;
use Plugins\PagesEngine\Http\Controllers\Public\CommentController as PublicCommentController;
use Plugins\PagesEngine\Http\Controllers\Public\CategoryController as PublicCategoryController;
use Plugins\PagesEngine\Http\Controllers\Platform\ContentTypeController as PlatformContentTypeController;

final class PagesEngineServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            ContentTypeRepositoryInterface::class,
            function ($app) {
                return new ContentTypeEloquentRepository(
                    new ContentTypeEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentRepositoryInterface::class,
            function ($app) {
                return new ContentEloquentRepository(
                    new ContentEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentCategoryRepositoryInterface::class,
            function ($app) {
                return new ContentCategoryEloquentRepository(
                    new ContentCategoryEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentCommentRepositoryInterface::class,
            function ($app) {
                return new ContentCommentEloquentRepository(
                    new ContentCommentEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentRevisionRepositoryInterface::class,
            function ($app) {
                return new ContentRevisionEloquentRepository(
                    new ContentRevisionEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentUrlRepositoryInterface::class,
            function ($app) {
                return new ContentUrlEloquentRepository(
                    new ContentUrlEloquentModel()
                );
            }
        );

        $this->app->bind(
            ContentTagRepositoryInterface::class,
            function ($app) {
                return new ContentTagEloquentRepository(
                    new ContentTagEloquentModel()
                );
            }
        );

        $this->app->singleton(SlugGenerator::class, function ($app) {
            return new SlugGenerator(
                $app->make(ContentRepositoryInterface::class)
            );
        });

        $this->app->singleton(RevisionManager::class, function ($app) {
            return new RevisionManager(
                $app->make(ContentRevisionRepositoryInterface::class)
            );
        });

        $this->app->singleton(ContentUrlBuilder::class, function ($app) {
            return new ContentUrlBuilder();
        });
    }

    public function boot(): void
    {
        $this->loadMigrations();
        $this->loadRoutes();
    }

    protected function loadMigrations(): void
    {
        $migrationsPath = __DIR__ . '/../../../database/migrations';
        
        if (is_dir($migrationsPath)) {
            $this->loadMigrationsFrom($migrationsPath);
        }
    }

    protected function loadRoutes(): void
    {
        $this->loadTenantRoutes();
        $this->loadPublicRoutes();
        $this->loadPlatformRoutes();
    }

    protected function loadTenantRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('api/tenant/cms/admin')
            ->middleware(['api', 'auth:sanctum', 'tenant.context'])
            ->group(function () {
                $this->registerContentTypeRoutes();
                $this->registerContentRoutes();
                $this->registerCategoryRoutes();
                $this->registerCommentRoutes();
                $this->registerRevisionRoutes();
                $this->registerUrlRoutes();
            });
    }

    protected function loadPublicRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('api/cms/public')
            ->middleware(['api'])
            ->group(function () {
                $this->registerPublicContentRoutes();
                $this->registerPublicCommentRoutes();
                $this->registerPublicCategoryRoutes();
            });
    }

    protected function loadPlatformRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('api/platform/cms/platform')
            ->middleware(['api', 'auth:sanctum'])
            ->group(function () {
                $this->registerPlatformContentTypeRoutes();
            });
    }

    protected function registerContentTypeRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('content-types')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [AdminContentTypeController::class, 'index'])->name('cms.admin.content-types.index');
            \Illuminate\Support\Facades\Route::post('/', [AdminContentTypeController::class, 'store'])->name('cms.admin.content-types.store');
            \Illuminate\Support\Facades\Route::get('/{uuid}', [AdminContentTypeController::class, 'show'])->name('cms.admin.content-types.show');
            \Illuminate\Support\Facades\Route::put('/{uuid}', [AdminContentTypeController::class, 'update'])->name('cms.admin.content-types.update');
            \Illuminate\Support\Facades\Route::delete('/{uuid}', [AdminContentTypeController::class, 'destroy'])->name('cms.admin.content-types.destroy');
            \Illuminate\Support\Facades\Route::post('/{uuid}/activate', [AdminContentTypeController::class, 'activate'])->name('cms.admin.content-types.activate');
            \Illuminate\Support\Facades\Route::post('/{uuid}/deactivate', [AdminContentTypeController::class, 'deactivate'])->name('cms.admin.content-types.deactivate');
            \Illuminate\Support\Facades\Route::get('/{uuid}/contents/count', [AdminContentTypeController::class, 'contentsCount'])->name('cms.admin.content-types.contents-count');
        });
    }

    protected function registerContentRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('contents')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [AdminContentController::class, 'index'])->name('cms.admin.contents.index');
            \Illuminate\Support\Facades\Route::post('/', [AdminContentController::class, 'store'])->name('cms.admin.contents.store');
            \Illuminate\Support\Facades\Route::get('/{uuid}', [AdminContentController::class, 'show'])->name('cms.admin.contents.show');
            \Illuminate\Support\Facades\Route::put('/{uuid}', [AdminContentController::class, 'update'])->name('cms.admin.contents.update');
            \Illuminate\Support\Facades\Route::delete('/{uuid}', [AdminContentController::class, 'destroy'])->name('cms.admin.contents.destroy');
            
            \Illuminate\Support\Facades\Route::post('/{uuid}/publish', [AdminContentController::class, 'publish'])->name('cms.admin.contents.publish');
            \Illuminate\Support\Facades\Route::post('/{uuid}/unpublish', [AdminContentController::class, 'unpublish'])->name('cms.admin.contents.unpublish');
            \Illuminate\Support\Facades\Route::post('/{uuid}/schedule', [AdminContentController::class, 'schedule'])->name('cms.admin.contents.schedule');
            \Illuminate\Support\Facades\Route::post('/{uuid}/archive', [AdminContentController::class, 'archive'])->name('cms.admin.contents.archive');
            
            \Illuminate\Support\Facades\Route::get('/by-type/{contentTypeUuid}', [AdminContentController::class, 'byType'])->name('cms.admin.contents.by-type');
            \Illuminate\Support\Facades\Route::get('/by-category/{categoryUuid}', [AdminContentController::class, 'byCategory'])->name('cms.admin.contents.by-category');
            \Illuminate\Support\Facades\Route::get('/by-status/{status}', [AdminContentController::class, 'byStatus'])->name('cms.admin.contents.by-status');
            \Illuminate\Support\Facades\Route::get('/by-author/{authorId}', [AdminContentController::class, 'byAuthor'])->name('cms.admin.contents.by-author');
        });
    }

    protected function registerCategoryRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('categories')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [AdminCategoryController::class, 'index'])->name('cms.admin.categories.index');
            \Illuminate\Support\Facades\Route::get('/tree/{contentTypeUuid?}', [AdminCategoryController::class, 'tree'])->name('cms.admin.categories.tree');
            \Illuminate\Support\Facades\Route::post('/', [AdminCategoryController::class, 'store'])->name('cms.admin.categories.store');
            \Illuminate\Support\Facades\Route::put('/reorder', [AdminCategoryController::class, 'reorder'])->name('cms.admin.categories.reorder');
            \Illuminate\Support\Facades\Route::get('/{uuid}', [AdminCategoryController::class, 'show'])->name('cms.admin.categories.show');
            \Illuminate\Support\Facades\Route::put('/{uuid}', [AdminCategoryController::class, 'update'])->name('cms.admin.categories.update');
            \Illuminate\Support\Facades\Route::delete('/{uuid}', [AdminCategoryController::class, 'destroy'])->name('cms.admin.categories.destroy');
            \Illuminate\Support\Facades\Route::put('/{uuid}/move', [AdminCategoryController::class, 'move'])->name('cms.admin.categories.move');
        });
    }

    protected function registerCommentRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('comments')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [AdminCommentController::class, 'index'])->name('cms.admin.comments.index');
            \Illuminate\Support\Facades\Route::post('/{uuid}/approve', [AdminCommentController::class, 'approve'])->name('cms.admin.comments.approve');
            \Illuminate\Support\Facades\Route::post('/{uuid}/reject', [AdminCommentController::class, 'reject'])->name('cms.admin.comments.reject');
            \Illuminate\Support\Facades\Route::post('/{uuid}/spam', [AdminCommentController::class, 'spam'])->name('cms.admin.comments.spam');
            \Illuminate\Support\Facades\Route::delete('/{uuid}', [AdminCommentController::class, 'destroy'])->name('cms.admin.comments.destroy');
            \Illuminate\Support\Facades\Route::post('/bulk-approve', [AdminCommentController::class, 'bulkApprove'])->name('cms.admin.comments.bulk-approve');
            \Illuminate\Support\Facades\Route::post('/bulk-delete', [AdminCommentController::class, 'bulkDelete'])->name('cms.admin.comments.bulk-delete');
        });
    }

    protected function registerRevisionRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('revisions')->group(function () {
            \Illuminate\Support\Facades\Route::get('/content/{contentUuid}', [AdminRevisionController::class, 'index'])->name('cms.admin.revisions.index');
            \Illuminate\Support\Facades\Route::get('/{uuid}', [AdminRevisionController::class, 'show'])->name('cms.admin.revisions.show');
            \Illuminate\Support\Facades\Route::post('/{uuid}/revert', [AdminRevisionController::class, 'revert'])->name('cms.admin.revisions.revert');
        });
    }

    protected function registerUrlRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('urls')->group(function () {
            \Illuminate\Support\Facades\Route::post('/build', [AdminUrlController::class, 'build'])->name('cms.admin.urls.build');
            \Illuminate\Support\Facades\Route::post('/preview', [AdminUrlController::class, 'preview'])->name('cms.admin.urls.preview');
        });
    }

    protected function registerPublicContentRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('contents')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [PublicContentController::class, 'index'])->name('cms.public.contents.index');
            \Illuminate\Support\Facades\Route::get('/search', [PublicContentController::class, 'search'])->name('cms.public.contents.search');
            \Illuminate\Support\Facades\Route::get('/{slug}', [PublicContentController::class, 'show'])->name('cms.public.contents.show');
            \Illuminate\Support\Facades\Route::get('/category/{categorySlug}', [PublicContentController::class, 'byCategory'])->name('cms.public.contents.by-category');
            \Illuminate\Support\Facades\Route::get('/tag/{tagSlug}', [PublicContentController::class, 'byTag'])->name('cms.public.contents.by-tag');
            \Illuminate\Support\Facades\Route::get('/type/{contentTypeSlug}', [PublicContentController::class, 'byType'])->name('cms.public.contents.by-type');
            \Illuminate\Support\Facades\Route::get('/{contentUuid}/comments', [PublicCommentController::class, 'index'])->name('cms.public.contents.comments');
        });
    }

    protected function registerPublicCommentRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('comments')->group(function () {
            \Illuminate\Support\Facades\Route::post('/', [PublicCommentController::class, 'store'])->name('cms.public.comments.store');
            \Illuminate\Support\Facades\Route::post('/{parentUuid}/reply', [PublicCommentController::class, 'reply'])->name('cms.public.comments.reply');
        });
    }

    protected function registerPublicCategoryRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('categories')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [PublicCategoryController::class, 'index'])->name('cms.public.categories.index');
            \Illuminate\Support\Facades\Route::get('/tree', [PublicCategoryController::class, 'tree'])->name('cms.public.categories.tree');
            \Illuminate\Support\Facades\Route::get('/{slug}', [PublicCategoryController::class, 'show'])->name('cms.public.categories.show');
        });
    }

    protected function registerPlatformContentTypeRoutes(): void
    {
        \Illuminate\Support\Facades\Route::prefix('content-types')->group(function () {
            \Illuminate\Support\Facades\Route::get('/', [PlatformContentTypeController::class, 'index'])->name('cms.platform.content-types.index');
            \Illuminate\Support\Facades\Route::post('/', [PlatformContentTypeController::class, 'store'])->name('cms.platform.content-types.store');
        });
    }
}
