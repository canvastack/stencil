<?php

declare(strict_types=1);

namespace App\Infrastructure\Repositories;

use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class PlatformPageRepository implements PlatformPageRepositoryInterface
{
    public function findAll(): Collection
    {
        return PlatformPage::orderBy('sort_order')->get();
    }

    public function findBySlug(string $slug): ?PlatformPage
    {
        return PlatformPage::where('slug', $slug)->first();
    }

    public function findByType(string $type): Collection
    {
        return PlatformPage::byType($type)->orderBy('sort_order')->get();
    }

    public function findPublished(): Collection
    {
        return PlatformPage::published()->orderBy('sort_order')->get();
    }

    public function findHomepage(): ?PlatformPage
    {
        return PlatformPage::homepage()->published()->first();
    }

    public function create(array $data): PlatformPage
    {
        return PlatformPage::create($data);
    }

    public function update(PlatformPage $page, array $data): PlatformPage
    {
        $page->update($data);
        return $page->refresh();
    }

    public function delete(PlatformPage $page): bool
    {
        return $page->delete();
    }

    public function publish(PlatformPage $page): PlatformPage
    {
        $page->publish();
        return $page->refresh();
    }

    public function archive(PlatformPage $page): PlatformPage
    {
        $page->archive();
        return $page->refresh();
    }

    public function findByLanguage(string $language = 'en'): Collection
    {
        return PlatformPage::byLanguage($language)
            ->published()
            ->orderBy('sort_order')
            ->get();
    }
}