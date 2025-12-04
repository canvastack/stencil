<?php

declare(strict_types=1);

namespace App\Domain\Content\Repositories;

use App\Domain\Content\Entities\PlatformPage;
use Illuminate\Database\Eloquent\Collection;

interface PlatformPageRepositoryInterface
{
    public function findAll(): Collection;
    
    public function findBySlug(string $slug): ?PlatformPage;
    
    public function findByType(string $type): Collection;
    
    public function findPublished(): Collection;
    
    public function findHomepage(): ?PlatformPage;
    
    public function create(array $data): PlatformPage;
    
    public function update(PlatformPage $page, array $data): PlatformPage;
    
    public function delete(PlatformPage $page): bool;
    
    public function publish(PlatformPage $page): PlatformPage;
    
    public function archive(PlatformPage $page): PlatformPage;
    
    public function findByLanguage(string $language = 'en'): Collection;
}