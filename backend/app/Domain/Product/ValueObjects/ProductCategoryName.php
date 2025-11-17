<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductCategoryName
{
    private string $value;

    public function __construct(string $value)
    {
        $this->value = trim($value);
        $this->validate();
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(ProductCategoryName $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function generateSlug(): string
    {
        // Convert to lowercase
        $slug = strtolower($this->value);
        
        // Replace special characters with spaces first, then convert to hyphens
        $slug = preg_replace('/[&(),.\/:]+/', ' ', $slug);
        
        // Convert multiple spaces to single space
        $slug = preg_replace('/\s+/', ' ', $slug);
        
        // Trim spaces
        $slug = trim($slug);
        
        // Convert spaces to hyphens
        $slug = str_replace(' ', '-', $slug);
        
        // Remove any remaining special characters except hyphens and alphanumeric
        $slug = preg_replace('/[^a-z0-9\-]/', '', $slug);
        
        // Remove multiple consecutive hyphens
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Remove leading and trailing hyphens
        $slug = trim($slug, '-');
        
        return $slug;
    }

    public function containsEtchingKeywords(): bool
    {
        $etchingKeywords = ['etching', 'laser', 'engraving', 'cutting', 'marking', 'custom'];
        $lowerValue = strtolower($this->value);
        
        foreach ($etchingKeywords as $keyword) {
            if (strpos($lowerValue, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    public function getLength(): int
    {
        return strlen($this->value);
    }

    public function getWordCount(): int
    {
        // Split by spaces and count non-empty parts
        // This will count single letters and symbols as separate words when separated by spaces
        $words = preg_split('/\s+/', trim($this->value));
        return count(array_filter($words, function($word) {
            return !empty($word);
        }));
    }

    public function toTitleCase(): string
    {
        return ucwords(strtolower($this->value));
    }

    public function truncate(int $length): string
    {
        if (strlen($this->value) <= $length) {
            return $this->value;
        }
        
        return substr($this->value, 0, $length - 3) . '...';
    }

    public function containsWord(string $word): bool
    {
        $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
        return preg_match($pattern, $this->value) === 1;
    }

    private function validate(): void
    {
        if (empty($this->value)) {
            throw new InvalidArgumentException('Category name cannot be empty');
        }

        if (strlen($this->value) < 2) {
            throw new InvalidArgumentException('Category name must be between 2 and 100 characters');
        }

        if (strlen($this->value) > 100) {
            throw new InvalidArgumentException('Category name must be between 2 and 100 characters');
        }

        // Allow letters, numbers, spaces, hyphens, common punctuation, and unicode
        if (!preg_match('/^[\p{L}\p{N}\s\-&().,\/:]+$/u', $this->value)) {
            throw new InvalidArgumentException('Category name contains invalid characters');
        }
    }
}