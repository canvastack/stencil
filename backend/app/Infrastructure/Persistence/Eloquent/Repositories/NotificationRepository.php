<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Notification\Entities\Notification;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Notification as NotificationModel;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Notification Repository Implementation
 * 
 * Implements notification data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Database Integration:
 * - Maps to notifications table
 * - Handles UUID-based operations
 * - Maintains tenant isolation
 * - Converts between domain entities and Eloquent models
 * 
 * Business Rules:
 * - All operations are tenant-scoped
 * - Read tracking with timestamps
 * - Type-based filtering
 * - User-specific queries
 */
class NotificationRepository implements NotificationRepositoryInterface
{
    /**
     * Save notification to persistence
     * 
     * @param Notification $notification
     * @return Notification Persisted notification with ID set
     */
    public function save(Notification $notification): Notification
    {
        try {
            DB::beginTransaction();

            $data = [
                'uuid' => $notification->getUuid(),
                'tenant_id' => $notification->getTenantId(),
                'user_id' => $notification->getUserId(),
                'type' => $notification->getType(),
                'title' => $notification->getTitle(),
                'message' => $notification->getMessage(),
                'data' => $notification->getData(),
                'read_at' => $notification->getReadAt()?->format('Y-m-d H:i:s'),
                'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $notification->getUpdatedAt()->format('Y-m-d H:i:s'),
            ];

            if ($notification->getId() !== null) {
                // Update existing notification
                $model = NotificationModel::where('id', $notification->getId())
                    ->where('tenant_id', $notification->getTenantId())
                    ->firstOrFail();
                
                $model->update($data);
            } else {
                // Create new notification
                $model = NotificationModel::create($data);
                
                // Set ID on domain entity
                $notification->setId($model->id);
            }

            DB::commit();

            Log::info('Notification saved successfully', [
                'notification_id' => $model->id,
                'notification_uuid' => $model->uuid,
                'user_id' => $model->user_id,
                'tenant_id' => $model->tenant_id,
                'type' => $model->type
            ]);

            return $this->toDomainEntity($model->fresh());

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to save notification', [
                'notification_uuid' => $notification->getUuid(),
                'tenant_id' => $notification->getTenantId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    /**
     * Find notification by UUID
     * 
     * @param string $uuid
     * @return Notification|null
     */
    public function findByUuid(string $uuid): ?Notification
    {
        $model = NotificationModel::where('uuid', $uuid)->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find notification by ID
     * 
     * @param int $id
     * @return Notification|null
     */
    public function findById(int $id): ?Notification
    {
        $model = NotificationModel::find($id);
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Get unread notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $limit
     * @return array<Notification>
     */
    public function getUnreadForUser(int $userId, int $tenantId, int $limit = 50): array
    {
        $models = NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get all notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<Notification>, total: int}
     */
    public function getAllForUser(int $userId, int $tenantId, int $page = 1, int $perPage = 20): array
    {
        $query = NotificationModel::where('user_id', $userId)
            ->where('tenant_id', $tenantId);

        $total = $query->count();

        $models = $query->orderBy('created_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $notifications = $models->map(fn($model) => $this->toDomainEntity($model))->toArray();

        return [
            'data' => $notifications,
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
        try {
            $updated = NotificationModel::where('uuid', $uuid)
                ->where('user_id', $userId)
                ->where('tenant_id', $tenantId)
                ->whereNull('read_at')
                ->update([
                    'read_at' => now(),
                    'updated_at' => now()
                ]);

            Log::info('Notification marked as read', [
                'notification_uuid' => $uuid,
                'user_id' => $userId,
                'tenant_id' => $tenantId
            ]);

            return $updated > 0;

        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'notification_uuid' => $uuid,
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
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
        try {
            $updated = NotificationModel::where('user_id', $userId)
                ->where('tenant_id', $tenantId)
                ->whereNull('read_at')
                ->update([
                    'read_at' => now(),
                    'updated_at' => now()
                ]);

            Log::info('All notifications marked as read', [
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'count' => $updated
            ]);

            return $updated;

        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
            
            return 0;
        }
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
        try {
            $deleted = NotificationModel::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->delete();

            Log::info('Notification deleted', [
                'notification_uuid' => $uuid,
                'tenant_id' => $tenantId
            ]);

            return $deleted > 0;

        } catch (\Exception $e) {
            Log::error('Failed to delete notification', [
                'notification_uuid' => $uuid,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Get notifications by type
     * 
     * @param string $type
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<Notification>, total: int}
     */
    public function getByType(string $type, int $tenantId, int $page = 1, int $perPage = 20): array
    {
        $query = NotificationModel::where('type', $type)
            ->where('tenant_id', $tenantId);

        $total = $query->count();

        $models = $query->orderBy('created_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $notifications = $models->map(fn($model) => $this->toDomainEntity($model))->toArray();

        return [
            'data' => $notifications,
            'total' => $total
        ];
    }

    /**
     * Convert Eloquent model to domain entity
     * 
     * @param NotificationModel $model Eloquent model
     * @return Notification Domain entity
     */
    private function toDomainEntity(NotificationModel $model): Notification
    {
        return Notification::reconstitute(
            id: $model->id,
            uuid: $model->uuid,
            tenantId: $model->tenant_id,
            userId: $model->user_id,
            type: $model->type,
            title: $model->title,
            message: $model->message,
            data: $model->data ?? [],
            readAt: $model->read_at ? new DateTimeImmutable($model->read_at->format('Y-m-d H:i:s')) : null,
            createdAt: new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s'))
        );
    }
}
