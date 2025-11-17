<?php

namespace App\Application\Product\Commands;

class CreateProductCategoryCommand
{
    public readonly string $id;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $name,
        ?string $id = null,
        public readonly ?string $slug = null,
        public readonly ?string $description = null,
        public readonly ?string $parentId = null,
        public readonly ?int $sortOrder = null,
        public readonly ?string $image = null,
        public readonly ?string $icon = null,
        public readonly ?string $colorScheme = null,
        public readonly ?bool $isActive = null,
        public readonly ?bool $isFeatured = null,
        public readonly ?bool $showInMenu = null,
        public readonly ?array $allowedMaterials = null,
        public readonly ?array $qualityLevels = null,
        public readonly ?array $customizationOptions = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly ?array $seoKeywords = null,
        public readonly ?float $baseMarkupPercentage = null,
        public readonly ?bool $requiresQuote = null,
    ) {
        $this->id = $id ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            name: $data['name'],
            id: $data['id'] ?? null,
            slug: $data['slug'] ?? null,
            description: $data['description'] ?? null,
            parentId: $data['parent_id'] ?? null,
            sortOrder: $data['sort_order'] ?? null,
            image: $data['image'] ?? null,
            icon: $data['icon'] ?? null,
            colorScheme: $data['color_scheme'] ?? null,
            isActive: $data['is_active'] ?? null,
            isFeatured: $data['is_featured'] ?? null,
            showInMenu: $data['show_in_menu'] ?? null,
            allowedMaterials: $data['allowed_materials'] ?? null,
            qualityLevels: $data['quality_levels'] ?? null,
            customizationOptions: $data['customization_options'] ?? null,
            seoTitle: $data['seo_title'] ?? null,
            seoDescription: $data['seo_description'] ?? null,
            seoKeywords: $data['seo_keywords'] ?? null,
            baseMarkupPercentage: $data['base_markup_percentage'] ?? null,
            requiresQuote: $data['requires_quote'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenantId,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'parent_id' => $this->parentId,
            'sort_order' => $this->sortOrder,
            'image' => $this->image,
            'icon' => $this->icon,
            'color_scheme' => $this->colorScheme,
            'is_active' => $this->isActive,
            'is_featured' => $this->isFeatured,
            'show_in_menu' => $this->showInMenu,
            'allowed_materials' => $this->allowedMaterials,
            'quality_levels' => $this->qualityLevels,
            'customization_options' => $this->customizationOptions,
            'seo_title' => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'seo_keywords' => $this->seoKeywords,
            'base_markup_percentage' => $this->baseMarkupPercentage,
            'requires_quote' => $this->requiresQuote,
        ];
    }
}