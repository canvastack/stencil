<?php

use Illuminate\Support\Facades\Route;
use Plugins\PagesEngine\Http\Controllers\Admin\ContentTypeController as AdminContentTypeController;
use Plugins\PagesEngine\Http\Controllers\Platform\ContentTypeController as PlatformContentTypeController;
use Plugins\PagesEngine\Http\Controllers\Admin\ContentController as AdminContentController;
use Plugins\PagesEngine\Http\Controllers\Public\ContentController as PublicContentController;
use Plugins\PagesEngine\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use Plugins\PagesEngine\Http\Controllers\Admin\CommentController as AdminCommentController;
use Plugins\PagesEngine\Http\Controllers\Admin\RevisionController as AdminRevisionController;
use Plugins\PagesEngine\Http\Controllers\Admin\UrlController as AdminUrlController;
use Plugins\PagesEngine\Http\Controllers\Public\CommentController as PublicCommentController;
use Plugins\PagesEngine\Http\Controllers\Public\CategoryController as PublicCategoryController;

Route::prefix('cms')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'plugin' => 'pages-engine',
            'version' => '1.0.0',
            'status' => 'active',
        ]);
    });

    Route::prefix('admin')->middleware(['auth:sanctum', 'tenant.context'])->group(function () {
        Route::prefix('content-types')->group(function () {
            Route::get('/', [AdminContentTypeController::class, 'index'])->name('cms.admin.content-types.index');
            Route::post('/', [AdminContentTypeController::class, 'store'])->name('cms.admin.content-types.store');
            Route::get('/{uuid}', [AdminContentTypeController::class, 'show'])->name('cms.admin.content-types.show');
            Route::put('/{uuid}', [AdminContentTypeController::class, 'update'])->name('cms.admin.content-types.update');
            Route::delete('/{uuid}', [AdminContentTypeController::class, 'destroy'])->name('cms.admin.content-types.destroy');
            Route::post('/{uuid}/activate', [AdminContentTypeController::class, 'activate'])->name('cms.admin.content-types.activate');
            Route::post('/{uuid}/deactivate', [AdminContentTypeController::class, 'deactivate'])->name('cms.admin.content-types.deactivate');
            Route::get('/{uuid}/contents/count', [AdminContentTypeController::class, 'contentsCount'])->name('cms.admin.content-types.contents-count');
        });

        Route::prefix('contents')->group(function () {
            Route::get('/', [AdminContentController::class, 'index'])->name('cms.admin.contents.index');
            Route::post('/', [AdminContentController::class, 'store'])->name('cms.admin.contents.store');
            Route::get('/{uuid}', [AdminContentController::class, 'show'])->name('cms.admin.contents.show');
            Route::put('/{uuid}', [AdminContentController::class, 'update'])->name('cms.admin.contents.update');
            Route::delete('/{uuid}', [AdminContentController::class, 'destroy'])->name('cms.admin.contents.destroy');
            
            Route::post('/{uuid}/publish', [AdminContentController::class, 'publish'])->name('cms.admin.contents.publish');
            Route::post('/{uuid}/unpublish', [AdminContentController::class, 'unpublish'])->name('cms.admin.contents.unpublish');
            Route::post('/{uuid}/schedule', [AdminContentController::class, 'schedule'])->name('cms.admin.contents.schedule');
            Route::post('/{uuid}/archive', [AdminContentController::class, 'archive'])->name('cms.admin.contents.archive');
            
            Route::get('/by-type/{contentTypeUuid}', [AdminContentController::class, 'byType'])->name('cms.admin.contents.by-type');
            Route::get('/by-category/{categoryUuid}', [AdminContentController::class, 'byCategory'])->name('cms.admin.contents.by-category');
            Route::get('/by-status/{status}', [AdminContentController::class, 'byStatus'])->name('cms.admin.contents.by-status');
            Route::get('/by-author/{authorId}', [AdminContentController::class, 'byAuthor'])->name('cms.admin.contents.by-author');
        });

        Route::prefix('categories')->group(function () {
            Route::get('/', [AdminCategoryController::class, 'index'])->name('cms.admin.categories.index');
            Route::get('/tree/{contentTypeUuid?}', [AdminCategoryController::class, 'tree'])->name('cms.admin.categories.tree');
            Route::post('/', [AdminCategoryController::class, 'store'])->name('cms.admin.categories.store');
            Route::put('/reorder', [AdminCategoryController::class, 'reorder'])->name('cms.admin.categories.reorder');
            Route::get('/{uuid}', [AdminCategoryController::class, 'show'])->name('cms.admin.categories.show');
            Route::put('/{uuid}', [AdminCategoryController::class, 'update'])->name('cms.admin.categories.update');
            Route::delete('/{uuid}', [AdminCategoryController::class, 'destroy'])->name('cms.admin.categories.destroy');
            Route::put('/{uuid}/move', [AdminCategoryController::class, 'move'])->name('cms.admin.categories.move');
        });

        Route::prefix('comments')->group(function () {
            Route::get('/', [AdminCommentController::class, 'index'])->name('cms.admin.comments.index');
            Route::post('/{uuid}/approve', [AdminCommentController::class, 'approve'])->name('cms.admin.comments.approve');
            Route::post('/{uuid}/reject', [AdminCommentController::class, 'reject'])->name('cms.admin.comments.reject');
            Route::post('/{uuid}/spam', [AdminCommentController::class, 'spam'])->name('cms.admin.comments.spam');
            Route::delete('/{uuid}', [AdminCommentController::class, 'destroy'])->name('cms.admin.comments.destroy');
            Route::post('/bulk-approve', [AdminCommentController::class, 'bulkApprove'])->name('cms.admin.comments.bulk-approve');
            Route::post('/bulk-delete', [AdminCommentController::class, 'bulkDelete'])->name('cms.admin.comments.bulk-delete');
        });

        Route::prefix('revisions')->group(function () {
            Route::get('/content/{contentUuid}', [AdminRevisionController::class, 'index'])->name('cms.admin.revisions.index');
            Route::get('/{uuid}', [AdminRevisionController::class, 'show'])->name('cms.admin.revisions.show');
            Route::post('/{uuid}/revert', [AdminRevisionController::class, 'revert'])->name('cms.admin.revisions.revert');
        });

        Route::prefix('urls')->group(function () {
            Route::post('/build', [AdminUrlController::class, 'build'])->name('cms.admin.urls.build');
            Route::post('/preview', [AdminUrlController::class, 'preview'])->name('cms.admin.urls.preview');
        });
    });

    Route::prefix('public')->group(function () {
        Route::prefix('contents')->group(function () {
            Route::get('/', [PublicContentController::class, 'index'])->name('cms.public.contents.index');
            Route::get('/search', [PublicContentController::class, 'search'])->name('cms.public.contents.search');
            Route::get('/{slug}', [PublicContentController::class, 'show'])->name('cms.public.contents.show');
            Route::get('/category/{categorySlug}', [PublicContentController::class, 'byCategory'])->name('cms.public.contents.by-category');
            Route::get('/tag/{tagSlug}', [PublicContentController::class, 'byTag'])->name('cms.public.contents.by-tag');
            Route::get('/type/{contentTypeSlug}', [PublicContentController::class, 'byType'])->name('cms.public.contents.by-type');
            Route::get('/{contentUuid}/comments', [PublicCommentController::class, 'index'])->name('cms.public.contents.comments');
        });

        Route::prefix('comments')->group(function () {
            Route::post('/', [PublicCommentController::class, 'store'])->name('cms.public.comments.store');
            Route::post('/{parentUuid}/reply', [PublicCommentController::class, 'reply'])->name('cms.public.comments.reply');
        });

        Route::prefix('categories')->group(function () {
            Route::get('/', [PublicCategoryController::class, 'index'])->name('cms.public.categories.index');
            Route::get('/tree', [PublicCategoryController::class, 'tree'])->name('cms.public.categories.tree');
            Route::get('/{slug}', [PublicCategoryController::class, 'show'])->name('cms.public.categories.show');
        });
    });

    Route::prefix('platform')->middleware(['auth:sanctum'])->group(function () {
        Route::prefix('content-types')->group(function () {
            Route::get('/', [PlatformContentTypeController::class, 'index'])->name('cms.platform.content-types.index');
            Route::post('/', [PlatformContentTypeController::class, 'store'])->name('cms.platform.content-types.store');
        });
    });
});
