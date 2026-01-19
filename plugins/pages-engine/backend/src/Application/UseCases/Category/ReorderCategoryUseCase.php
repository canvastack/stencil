<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Category;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Plugins\PagesEngine\Application\Commands\ReorderCategoryCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentCategoryRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class ReorderCategoryUseCase
{
    public function __construct(
        private readonly ContentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function execute(ReorderCategoryCommand $command): void
    {
        $tenantUuid = TenantEloquentModel::where('id', $command->tenantId)->value('uuid');
        
        foreach ($command->categoryOrders as $order) {
            if (!isset($order['uuid']) || !isset($order['sort_order'])) {
                throw new InvalidArgumentException("Invalid category order data");
            }

            $category = $this->categoryRepository->findById(new Uuid($order['uuid']));
            
            if (!$category) {
                continue;
            }

            if (!$category->getTenantId()->equals(new Uuid($tenantUuid))) {
                throw new InvalidArgumentException("Unauthorized access to category");
            }

            $category->reorder((int) $order['sort_order']);
            $this->categoryRepository->save($category);
        }
    }
}
