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
use Plugins\PagesEngine\Domain\Services\UrlGenerator;

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

        $this->app->singleton(UrlGenerator::class, function ($app) {
            return new UrlGenerator(
                $app->make(ContentTypeRepositoryInterface::class)
            );
        });
    }

    public function boot(): void
    {
    }
}
