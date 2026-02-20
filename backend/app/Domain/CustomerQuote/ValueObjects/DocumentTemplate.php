<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\ValueObjects;

use InvalidArgumentException;

/**
 * DocumentTemplate Value Object
 * 
 * Immutable value object representing a document template configuration.
 */
final class DocumentTemplate
{
    private const VALID_PAPER_SIZES = ['a4', 'a5', 'letter', 'legal'];
    private const VALID_ORIENTATIONS = ['portrait', 'landscape'];

    private function __construct(
        private readonly string $templateType,
        private readonly string $viewPath,
        private readonly string $paperSize,
        private readonly string $orientation,
        private readonly array $defaultData,
        private readonly array $requiredFields,
        private readonly array $optionalFields,
        private readonly array $styling
    ) {
        $this->validate();
    }

    /**
     * Create DocumentTemplate
     */
    public static function create(
        string $templateType,
        string $viewPath,
        string $paperSize = 'a4',
        string $orientation = 'portrait',
        array $defaultData = [],
        array $requiredFields = [],
        array $optionalFields = [],
        array $styling = []
    ): self {
        return new self(
            templateType: $templateType,
            viewPath: $viewPath,
            paperSize: $paperSize,
            orientation: $orientation,
            defaultData: $defaultData,
            requiredFields: $requiredFields,
            optionalFields: $optionalFields,
            styling: $styling
        );
    }

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            templateType: $data['template_type'],
            viewPath: $data['view_path'],
            paperSize: $data['paper_size'] ?? 'a4',
            orientation: $data['orientation'] ?? 'portrait',
            defaultData: $data['default_data'] ?? [],
            requiredFields: $data['required_fields'] ?? [],
            optionalFields: $data['optional_fields'] ?? [],
            styling: $data['styling'] ?? []
        );
    }

    /**
     * Create default quotation template
     */
    public static function quotation(): self
    {
        return new self(
            templateType: 'quotation',
            viewPath: 'documents.quotation',
            paperSize: 'a4',
            orientation: 'portrait',
            defaultData: [],
            requiredFields: ['quote', 'order', 'customer', 'items', 'company'],
            optionalFields: ['notes', 'terms_and_conditions'],
            styling: [
                'font_family' => 'Arial, sans-serif',
                'font_size' => '12px',
                'header_color' => '#333333',
                'accent_color' => '#0066cc',
            ]
        );
    }

    /**
     * Create default proforma invoice template
     */
    public static function proformaInvoice(): self
    {
        return new self(
            templateType: 'proforma_invoice',
            viewPath: 'documents.proforma_invoice',
            paperSize: 'a4',
            orientation: 'portrait',
            defaultData: [],
            requiredFields: ['invoice_number', 'quote', 'order', 'customer', 'items', 'bank_details', 'company'],
            optionalFields: ['dp_amount', 'balance_amount', 'due_date'],
            styling: [
                'font_family' => 'Arial, sans-serif',
                'font_size' => '12px',
                'header_color' => '#333333',
                'accent_color' => '#0066cc',
            ]
        );
    }

    /**
     * Create default tax invoice template
     */
    public static function taxInvoice(): self
    {
        return new self(
            templateType: 'tax_invoice',
            viewPath: 'documents.tax_invoice',
            paperSize: 'a4',
            orientation: 'portrait',
            defaultData: [],
            requiredFields: ['invoice_number', 'order', 'customer', 'items', 'tax_details', 'company'],
            optionalFields: ['payment_info'],
            styling: [
                'font_family' => 'Arial, sans-serif',
                'font_size' => '12px',
                'header_color' => '#333333',
                'accent_color' => '#0066cc',
            ]
        );
    }

    /**
     * Validate template configuration
     */
    private function validate(): void
    {
        if (empty($this->templateType)) {
            throw new InvalidArgumentException('Template type cannot be empty');
        }

        if (empty($this->viewPath)) {
            throw new InvalidArgumentException('View path cannot be empty');
        }

        if (!in_array($this->paperSize, self::VALID_PAPER_SIZES)) {
            throw new InvalidArgumentException(
                sprintf('Invalid paper size. Must be one of: %s', implode(', ', self::VALID_PAPER_SIZES))
            );
        }

        if (!in_array($this->orientation, self::VALID_ORIENTATIONS)) {
            throw new InvalidArgumentException(
                sprintf('Invalid orientation. Must be one of: %s', implode(', ', self::VALID_ORIENTATIONS))
            );
        }
    }

    /**
     * Validate data against required fields
     */
    public function validateData(array $data): array
    {
        $errors = [];

        foreach ($this->requiredFields as $field) {
            if (!isset($data[$field])) {
                $errors[] = "Required field '{$field}' is missing";
            }
        }

        return $errors;
    }

    /**
     * Merge data with defaults
     */
    public function mergeWithDefaults(array $data): array
    {
        return array_merge($this->defaultData, $data);
    }

    /**
     * Check if field is required
     */
    public function isFieldRequired(string $field): bool
    {
        return in_array($field, $this->requiredFields);
    }

    /**
     * Check if field is optional
     */
    public function isFieldOptional(string $field): bool
    {
        return in_array($field, $this->optionalFields);
    }

    /**
     * Get styling value
     */
    public function getStyleValue(string $key, mixed $default = null): mixed
    {
        return $this->styling[$key] ?? $default;
    }

    // Getters

    public function getTemplateType(): string
    {
        return $this->templateType;
    }

    public function getViewPath(): string
    {
        return $this->viewPath;
    }

    public function getPaperSize(): string
    {
        return $this->paperSize;
    }

    public function getOrientation(): string
    {
        return $this->orientation;
    }

    public function getDefaultData(): array
    {
        return $this->defaultData;
    }

    public function getRequiredFields(): array
    {
        return $this->requiredFields;
    }

    public function getOptionalFields(): array
    {
        return $this->optionalFields;
    }

    public function getStyling(): array
    {
        return $this->styling;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'template_type' => $this->templateType,
            'view_path' => $this->viewPath,
            'paper_size' => $this->paperSize,
            'orientation' => $this->orientation,
            'default_data' => $this->defaultData,
            'required_fields' => $this->requiredFields,
            'optional_fields' => $this->optionalFields,
            'styling' => $this->styling,
        ];
    }

    /**
     * Check equality
     */
    public function equals(self $other): bool
    {
        return $this->toArray() === $other->toArray();
    }
}
