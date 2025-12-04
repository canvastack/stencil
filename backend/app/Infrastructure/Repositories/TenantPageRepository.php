<?php

declare(strict_types=1);

namespace App\Infrastructure\Repositories;

use App\Domain\Content\Entities\TenantPage;
use App\Domain\Content\Repositories\TenantPageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class TenantPageRepository implements TenantPageRepositoryInterface
{
    public function findAll(): Collection
    {
        return TenantPage::orderBy('sort_order')->get();
    }

    public function findBySlug(string $slug): ?TenantPage
    {
        return TenantPage::where('slug', $slug)->first();
    }

    public function findByType(string $type): Collection
    {
        return TenantPage::byType($type)->orderBy('sort_order')->get();
    }

    public function findPublished(): Collection
    {
        return TenantPage::published()->orderBy('sort_order')->get();
    }

    public function findHomepage(): ?TenantPage
    {
        return TenantPage::homepage()->published()->first();
    }

    public function create(array $data): TenantPage
    {
        return TenantPage::create($data);
    }

    public function update(TenantPage $page, array $data): TenantPage
    {
        $page->update($data);
        return $page->refresh();
    }

    public function delete(TenantPage $page): bool
    {
        return $page->delete();
    }

    public function publish(TenantPage $page): TenantPage
    {
        $page->publish();
        return $page->refresh();
    }

    public function archive(TenantPage $page): TenantPage
    {
        $page->archive();
        return $page->refresh();
    }

    public function findByLanguage(string $language = 'en'): Collection
    {
        return TenantPage::byLanguage($language)
            ->published()
            ->orderBy('sort_order')
            ->get();
    }
}