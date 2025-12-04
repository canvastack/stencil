<?php

declare(strict_types=1);

namespace App\Domain\Content\Repositories;

use App\Domain\Content\Entities\TenantPage;
use Illuminate\Database\Eloquent\Collection;

interface TenantPageRepositoryInterface
{
    public function findAll(): Collection;
    
    public function findBySlug(string $slug): ?TenantPage;
    
    public function findByType(string $type): Collection;
    
    public function findPublished(): Collection;
    
    public function findHomepage(): ?TenantPage;
    
    public function create(array $data): TenantPage;
    
    public function update(TenantPage $page, array $data): TenantPage;
    
    public function delete(TenantPage $page): bool;
    
    public function publish(TenantPage $page): TenantPage;
    
    public function archive(TenantPage $page): TenantPage;
    
    public function findByLanguage(string $language = 'en'): Collection;
}