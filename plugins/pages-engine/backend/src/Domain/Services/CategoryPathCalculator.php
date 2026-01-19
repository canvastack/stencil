<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\CategoryPath;
use Plugins\PagesEngine\Domain\Entities\ContentCategory;
use InvalidArgumentException;

final class CategoryPathCalculator
{
    public function calculatePath(ContentCategory $category, ?ContentCategory $parent = null): CategoryPath
    {
        if ($parent === null) {
            return new CategoryPath('/' . $category->getId()->getValue());
        }

        $parentPath = $parent->getPath()->getValue();
        $newPath = rtrim($parentPath, '/') . '/' . $category->getId()->getValue();

        return new CategoryPath($newPath);
    }

    public function calculateLevel(?ContentCategory $parent = null): int
    {
        if ($parent === null) {
            return 0;
        }

        return $parent->getLevel() + 1;
    }

    public function detectCircularReference(
        Uuid $categoryId,
        ?Uuid $newParentId,
        callable $getCategory
    ): bool {
        if ($newParentId === null) {
            return false;
        }

        if ($categoryId->equals($newParentId)) {
            return true;
        }

        $current = $getCategory($newParentId);
        $visited = [];

        while ($current !== null) {
            if ($current->getId()->equals($categoryId)) {
                return true;
            }

            if (isset($visited[$current->getId()->getValue()])) {
                return true;
            }

            $visited[$current->getId()->getValue()] = true;

            if ($current->getParentId() === null) {
                break;
            }

            $current = $getCategory($current->getParentId());
        }

        return false;
    }

    public function getAllAncestorIds(ContentCategory $category, callable $getCategory): array
    {
        $ancestors = [];
        $current = $category;

        while ($current->getParentId() !== null) {
            $parent = $getCategory($current->getParentId());

            if ($parent === null) {
                break;
            }

            $ancestors[] = $parent->getId();
            $current = $parent;
        }

        return array_reverse($ancestors);
    }
}
