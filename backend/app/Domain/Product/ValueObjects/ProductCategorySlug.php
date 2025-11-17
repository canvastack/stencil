<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductCategorySlug
{
    private string $value;
    private ?string $originalPath = null;

    public function __construct(string $value)
    {
        $originalValue = trim($value);
        
        // Check if this looks like a path (contains /)
        if (str_contains($originalValue, '/')) {
            $this->originalPath = $originalValue;
            // Convert path to slug format by replacing / with -
            $originalValue = str_replace('/', '-', $originalValue);
        }
        
        $this->validate($originalValue);
        $this->value = strtolower($originalValue);
    }

    public static function fromName(string $name): self
    {
        // Define stopwords to be removed
        $stopwords = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        // Convert to lowercase
        $slug = strtolower($name);
        
        // Handle unicode characters by transliterating
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $slug);
        
        // Replace special characters with hyphens, but preserve alphanumeric sequences
        // Handle slashes specially - replace with hyphens to preserve "a/b" as "a-b"
        $slug = preg_replace('/[\/]+/', '-', $slug);
        
        // Replace other special characters with spaces
        $slug = preg_replace('/[&(),.:!]+/', ' ', $slug);
        
        // Normalize multiple whitespace to single space
        $slug = preg_replace('/\s+/', ' ', $slug);
        
        // Split into words and filter stopwords
        $words = preg_split('/\s+/', trim($slug));
        $filteredWords = [];
        
        foreach ($words as $i => $word) {
            if (empty($word)) continue;
            
            // Check if this is a single letter that might be part of a compound
            if (strlen($word) == 1 && ctype_alpha($word)) {
                // Look at the next word to see if it's also a single letter followed by other words
                // This handles cases like "a-b" in "Type A/B Products"
                if (isset($words[$i + 1]) && strlen($words[$i + 1]) == 1 && ctype_alpha($words[$i + 1])) {
                    $filteredWords[] = $word; // Keep it as it's part of a sequence like "a b"
                } elseif (in_array($word, $stopwords)) {
                    // It's a standalone stopword, remove it
                    continue;
                } else {
                    $filteredWords[] = $word; // Keep it as it's not a stopword
                }
            } elseif (!in_array($word, $stopwords)) {
                $filteredWords[] = $word;
            }
        }
        
        $words = $filteredWords;
        
        // Join words with hyphens
        $slug = implode('-', $words);
        
        // Remove any non-alphanumeric characters except hyphens
        $slug = preg_replace('/[^a-z0-9\-]/', '', $slug);
        
        // Remove multiple consecutive hyphens
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Remove leading and trailing hyphens
        $slug = trim($slug, '-');
        
        return new self($slug);
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(ProductCategorySlug $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function getParentSlug(): ?string
    {
        // If we have an original path, use that to determine the parent
        if ($this->originalPath) {
            $parts = explode('/', $this->originalPath);
            if (count($parts) > 1) {
                // Remove the last part and join the rest
                array_pop($parts);
                return implode('/', $parts);
            }
            return null;
        }
        
        // For regular slugs without an original path, they don't have hierarchical parents
        return null;
    }

    public function isEtchingRelated(): bool
    {
        $etchingKeywords = ['etching', 'laser', 'engraving', 'cutting', 'marking'];
        
        foreach ($etchingKeywords as $keyword) {
            if (str_contains($this->value, $keyword)) {
                return true;
            }
        }
        
        return false;
    }

    public function isMaterialRelated(): bool
    {
        $materialKeywords = ['akrilik', 'kuningan', 'tembaga', 'stainless', 'aluminum', 'metal', 'plastic'];
        
        foreach ($materialKeywords as $keyword) {
            if (str_contains($this->value, $keyword)) {
                return true;
            }
        }
        
        return false;
    }

    public function getDepth(): int
    {
        // If this was created from a path, calculate depth based on path segments
        if ($this->originalPath) {
            return substr_count($this->originalPath, '/');
        }
        
        // Regular slugs have depth 0 (they are single-level)
        return 0;
    }

    public function appendSuffix(string $suffix): self
    {
        if (!preg_match('/^[a-z0-9\-]+$/', $suffix)) {
            throw new InvalidArgumentException('Suffix must be valid slug format');
        }
        
        return new self($this->value . '-' . $suffix);
    }

    public function prependPrefix(string $prefix): self
    {
        if (!preg_match('/^[a-z0-9\-]+$/', $prefix)) {
            throw new InvalidArgumentException('Prefix must be valid slug format');
        }
        
        return new self($prefix . '-' . $this->value);
    }

    public function containsWord(string $word): bool
    {
        $word = strtolower($word);
        $pattern = '/\b' . preg_quote($word, '/') . '\b/';
        return preg_match($pattern, str_replace('-', ' ', $this->value)) === 1;
    }

    public function generateUniqueVariation(array $existingSlugs): self
    {
        if (!in_array($this->value, $existingSlugs)) {
            return $this;
        }
        
        $counter = 2;
        while (in_array($this->value . '-' . $counter, $existingSlugs)) {
            $counter++;
        }
        
        return new self($this->value . '-' . $counter);
    }

    private function validate(string $value): void
    {
        if (empty($value)) {
            throw new InvalidArgumentException('Category slug cannot be empty');
        }

        if (strlen($value) < 2) {
            throw new InvalidArgumentException('Category slug must be between 2 and 100 characters');
        }

        if (strlen($value) > 100) {
            throw new InvalidArgumentException('Category slug must be between 2 and 100 characters');
        }

        // Check for uppercase letters before other validations
        if (preg_match('/[A-Z]/', $value)) {
            throw new InvalidArgumentException('Category slug can only contain lowercase letters, numbers, and hyphens');
        }

        // Check for spaces
        if (str_contains($value, ' ')) {
            throw new InvalidArgumentException('Category slug can only contain lowercase letters, numbers, and hyphens');
        }

        // Only allow lowercase letters, numbers, and hyphens
        if (!preg_match('/^[a-z0-9\-]+$/', strtolower($value))) {
            throw new InvalidArgumentException('Category slug can only contain lowercase letters, numbers, and hyphens');
        }

        $lowerValue = strtolower($value);
        
        // Cannot start or end with hyphen
        if (str_starts_with($lowerValue, '-') || str_ends_with($lowerValue, '-')) {
            throw new InvalidArgumentException('Category slug cannot start or end with hyphen');
        }

        // Cannot have consecutive hyphens
        if (str_contains($lowerValue, '--')) {
            throw new InvalidArgumentException('Category slug cannot contain consecutive hyphens');
        }
    }
}