<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\CategorySlug;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;

final class SlugGenerator
{
    public function generateContentSlug(string $title): ContentSlug
    {
        $slug = $this->normalize($title);
        return new ContentSlug($slug);
    }

    public function generateCategorySlug(string $name): CategorySlug
    {
        $slug = $this->normalize($name);
        return new CategorySlug($slug);
    }

    public function generateContentTypeSlug(string $name): ContentTypeSlug
    {
        $slug = $this->normalize($name);
        return new ContentTypeSlug($slug);
    }

    public function generateUniqueSlug(string $baseSlug, callable $exists): string
    {
        $slug = $this->normalize($baseSlug);
        $originalSlug = $slug;
        $counter = 1;

        while ($exists($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;

            if ($counter > 1000) {
                $slug = $originalSlug . '-' . uniqid();
                break;
            }
        }

        return $slug;
    }

    private function normalize(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');

        $text = $this->transliterate($text);

        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);

        $text = preg_replace('/\s+/', '-', $text);

        $text = preg_replace('/-+/', '-', $text);

        $text = trim($text, '-');

        if (empty($text)) {
            $text = 'untitled-' . uniqid();
        }

        return $text;
    }

    private function transliterate(string $text): string
    {
        $transliterations = [
            'á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a', 'å' => 'a',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o', 'ø' => 'o',
            'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ý' => 'y', 'ÿ' => 'y',
            'ñ' => 'n',
            'ç' => 'c',
            'ß' => 'ss',
            'æ' => 'ae',
            'œ' => 'oe',
        ];

        return str_replace(
            array_keys($transliterations),
            array_values($transliterations),
            $text
        );
    }
}
