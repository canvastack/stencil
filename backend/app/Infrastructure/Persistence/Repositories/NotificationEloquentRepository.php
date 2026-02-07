<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Notification\Entities\Notification as NotificationEntity;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Notification as NotificationModel;

/**
 * Eloquent implementation of NotificationRepositoryInterface
 */
class NotificationEloquentRepository implements NotificationRepositoryInterface
{
    /**
     * Save a notification entity
     * 
     * @param NotificationEntity $notification
     * @return NotificationEntity
     */
    public function save(NotificationEntity $notification): NotificationEntity
    {
        $model = NotificationModel::create([
            'uuid' => $notification->getUuid(),
            'tenant_id' => $notification->getTenantId(),
            'user_id' => $notification->getUserId(),
            'type' => $notification->getType(),
            'title' => $notification->getTitle(),
            'message' => $notification->getMessage(),
            'data' => $notification->getData(),
            'read_at' => $notification->getReadAt(),
        ]);

        return $notification;
    }

    /**
     * Find notification by UUID
     * 
     * @param string $uuid
     * @return NotificationEntity|null
     */
    public function findByUuid(string $uuid): ?NotificationEntity
    {
        $model = NotificationModel::where('uuid', $uuid)->first();

        if (!$model) {
            return null;
        }

        return $this->mapToEntity($model);
    }

    /**
     * Find notification by ID
     * 
     * @param int $id
     * @return NotificationEntity|null
     */
    public function findById(int $id): ?NotificationEntity
    {
        $model = NotificationModel::find($id);

        if (!$model) {
            return null;
        }

        return $this->mapToEntity($model);
    }

    /**
     * Get unread notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $limit
     * @return array<NotificationEntity>
     */
    public function getUnreadForUser(int $userId, int $tenantId, int $limit = 50): array
    {
        $models = NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $models->map(fn($model) => $this->mapToEntity($model))->all();
    }

    /**
     * Get all notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<NotificationEntity>, total: int}
     */
    public function getAllForUser(int $userId, int $tenantId, int $page = 1, int $perPage = 20): array
    {
        $query = NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        $models = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return [
            'data' => $models->map(fn($model) => $this->mapToEntity($model))->all(),
            'total' => $total
        ];
    }

    /**
     * Get unread count for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @return int
     */
    public function getUnreadCount(int $userId, int $tenantId): int
    {
        return NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Mark notification as read
     * 
     * @param string $uuid
     * @param int $userId
     * @param int $tenantId
     * @return bool
     */
    public function markAsRead(string $uuid, int $userId, int $tenantId): bool
    {
        return NotificationModel::where('uuid', $uuid)
            ->where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->update(['read_at' => now()]) > 0;
    }

    /**
     * Mark all notifications as read for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @return int Number of notifications marked as read
     */
    public function markAllAsRead(int $userId, int $tenantId): int
    {
        return NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Delete notification
     * 
     * @param string $uuid
     * @param int $tenantId
     * @return bool
     */
    public function delete(string $uuid, int $tenantId): bool
    {
        return NotificationModel::where('uuid', $uuid)
            ->where('tenant_id', $tenantId)
            ->delete() > 0;
    }

    /**
     * Get notifications by type
     * 
     * @param string $type
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<NotificationEntity>, total: int}
     */
    public function getByType(string $type, int $tenantId, int $page = 1, int $perPage = 20): array
    {
        $query = NotificationModel::where('type', $type)
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        $models = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return [
            'data' => $models->map(fn($model) => $this->mapToEntity($model))->all(),
            'total' => $total
        ];
    }

    /**
     * Map Eloquent model to domain entity
     * 
     * @param NotificationModel $model
     * @return NotificationEntity
     */
    private function mapToEntity(NotificationModel $model): NotificationEntity
    {
        // This is a simplified mapping - adjust based on your actual entity structure
        return NotificationEntity::reconstitute(
            uuid: $model->uuid,
            tenantId: $model->tenant_id,
            userId: $model->user_id,
            type: $model->type,
            title: $model->title,
            message: $model->message,
            data: $model->data ?? [],
            readAt: $model->read_at,
            createdAt: $model->created_at,
            updatedAt: $model->updated_at
        );
    }
}
