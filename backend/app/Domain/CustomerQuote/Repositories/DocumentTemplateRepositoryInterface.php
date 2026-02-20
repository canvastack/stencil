<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Repositories;

use App\Domain\CustomerQuote\ValueObjects\DocumentTemplate;

/**
 * DocumentTemplateRepositoryInterface
 * 
 * Repository interface (port) for DocumentTemplate persistence.
 * Implementation will be in Infrastructure layer.
 */
interface DocumentTemplateRepositoryInterface
{
    /**
     * Get template by tenant and type
     */
    public function getByTenantAndType(int $tenantId, string $templateType): ?DocumentTemplate;

    /**
     * Get default template by type
     */
    public function getDefaultByType(string $templateType): ?DocumentTemplate;

    /**
     * Save template for tenant
     */
    public function save(int $tenantId, DocumentTemplate $template): void;

    /**
     * Check if tenant has custom template
     */
    public function hasCustomTemplate(int $tenantId, string $templateType): bool;

    /**
     * Delete custom template (revert to default)
     */
    public function delete(int $tenantId, string $templateType): void;

    /**
     * Get all templates for tenant
     */
    public function getAllByTenant(int $tenantId): array;

    /**
     * Get available template types
     */
    public function getAvailableTypes(): array;
}
