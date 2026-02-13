<?php

namespace Tests\Integration\Infrastructure\Repositories;

use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private AuditLogRepositoryInterface $repository;
    private int $tenantId;
    private TenantEloquentModel $tenant;
    private UserEloquentModel $user;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = app(AuditLogRepositoryInterface::class);

        // Create tenant using factory
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $this->tenant->id;

        // Create test vendor and user
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $this->user = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->uuid, // Use UUID instead of ID
            'account_type' => 'vendor',
        ]);
    }

    /** @test */
    public function it_creates_audit_log_correctly(): void
    {
        // Arrange
        $tenantId = $this->tenantId;
        $action = 'vendor_login';
        $entityType = 'vendor';
        $entityId = $this->vendor->uuid; // Use UUID
        $userId = $this->user->id;
        $metadata = ['timestamp' => now()->toIso8601String()];
        $ipAddress = '192.168.1.1';

        // Act
        $auditLog = $this->repository->create(
            tenantId: $tenantId,
            action: $action,
            entityType: $entityType,
            entityId: $entityId,
            userId: $userId,
            metadata: $metadata,
            ipAddress: $ipAddress
        );

        // Assert
        $this->assertIsArray($auditLog);
        $this->assertEquals($tenantId, $auditLog['tenant_id']);
        $this->assertEquals($userId, $auditLog['user_id']);
        $this->assertEquals('vendor', $auditLog['user_type']);
        $this->assertEquals($action, $auditLog['action_type']);
        $this->assertEquals($entityType, $auditLog['resource_type']);
        $this->assertEquals($entityId, $auditLog['resource_id']);
        $this->assertEquals($ipAddress, $auditLog['ip_address']);
        $this->assertNotNull($auditLog['metadata']);
        $this->assertDatabaseHas('audit_logs', [
            'id' => $auditLog['id'],
            'action_type' => $action,
        ]);
    }

    /** @test */
    public function it_finds_audit_logs_by_entity(): void
    {
        // Arrange
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id, // Set user_id
            'resource_type' => 'vendor',
            'resource_id' => $this->vendor->uuid, // Use UUID
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id, // Set user_id
            'resource_type' => 'quote',
            'resource_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(), // Use UUID
        ]);

        // Act
        $result = $this->repository->findByEntity(
            tenantId: $this->tenantId,
            entityType: 'vendor',
            entityId: $this->vendor->uuid, // Use UUID
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(3, $result['data']);
        $this->assertEquals(3, $result['total']);
        foreach ($result['data'] as $log) {
            $this->assertEquals('vendor', $log['resource_type']);
            $this->assertEquals($this->vendor->uuid, $log['resource_id']);
        }
    }

    /** @test */
    public function it_finds_audit_logs_by_user(): void
    {
        // Arrange
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'user_type' => 'vendor',
        ]);

        // Create another user for comparison
        $otherUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $otherUser->id,
            'user_type' => 'platform',
        ]);

        // Act
        $result = $this->repository->findByUser(
            tenantId: $this->tenantId,
            userId: $this->user->id,
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(5, $result['data']);
        $this->assertEquals(5, $result['total']);
        foreach ($result['data'] as $log) {
            $this->assertEquals($this->user->id, $log['user_id']);
        }
    }

    /** @test */
    public function it_finds_audit_logs_by_action(): void
    {
        // Arrange
        AuditLog::factory()->count(4)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_login',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_logout',
        ]);

        // Act
        $result = $this->repository->findByAction(
            tenantId: $this->tenantId,
            action: 'vendor_login',
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(4, $result['data']);
        $this->assertEquals(4, $result['total']);
        foreach ($result['data'] as $log) {
            $this->assertEquals('vendor_login', $log['action_type']);
        }
    }

    /** @test */
    public function it_finds_audit_logs_with_complex_filters(): void
    {
        // Arrange
        $startDate = now()->subDays(7);
        $endDate = now();

        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_login',
            'resource_type' => 'vendor',
            'created_at' => now()->subDays(3),
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_logout',
            'resource_type' => 'vendor',
            'created_at' => now()->subDays(10), // Outside date range
        ]);

        // Act
        $result = $this->repository->findWithFilters(
            tenantId: $this->tenantId,
            filters: [
                'user_id' => $this->user->id,
                'action_type' => 'vendor_login',
                'resource_type' => 'vendor',
                'date_from' => $startDate,
                'date_to' => $endDate,
            ],
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(3, $result['data']);
        $this->assertEquals(3, $result['total']);
        foreach ($result['data'] as $log) {
            $this->assertEquals($this->user->id, $log['user_id']);
            $this->assertEquals('vendor_login', $log['action_type']);
            $this->assertEquals('vendor', $log['resource_type']);
        }
    }

    /** @test */
    public function it_exports_audit_logs_to_csv(): void
    {
        // Arrange
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_login',
        ]);

        // Act
        $csv = $this->repository->exportToCsv(
            tenantId: $this->tenantId,
            filters: ['user_id' => $this->user->id]
        );

        // Assert
        $this->assertIsString($csv);
        $this->assertStringContainsString('ID,Tenant ID,User ID,User Type,Action Type', $csv);
        $this->assertStringContainsString('vendor_login', $csv);
        $this->assertStringContainsString((string)$this->user->id, $csv);
        
        // Count lines (header + 5 data rows)
        $lines = explode("\n", trim($csv));
        $this->assertCount(6, $lines);
    }

    /** @test */
    public function it_calculates_statistics_correctly(): void
    {
        // Arrange
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_login',
            'user_type' => 'vendor',
            'resource_type' => 'vendor',
        ]);

        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'quote_accepted',
            'user_type' => 'vendor',
            'resource_type' => 'quote',
        ]);

        // Create another user for platform actions
        $platformUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'account_type' => 'platform',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $platformUser->id,
            'action_type' => 'vendor_logout',
            'user_type' => 'platform',
            'resource_type' => 'vendor',
        ]);

        // Act
        $stats = $this->repository->getStatistics($this->tenantId);

        // Assert
        $this->assertEquals(10, $stats['total_logs']);
        $this->assertArrayHasKey('top_actions', $stats);
        $this->assertArrayHasKey('user_type_distribution', $stats);
        $this->assertArrayHasKey('top_resources', $stats);
    }

    /** @test */
    public function it_deletes_old_audit_logs(): void
    {
        // Arrange
        $retentionDate = \DateTimeImmutable::createFromMutable(now()->subYears(2));

        // Create old logs (should be deleted)
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'created_at' => now()->subYears(3),
        ]);

        // Create recent logs (should be kept)
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'created_at' => now()->subMonths(6),
        ]);

        // Act
        $deletedCount = $this->repository->deleteOlderThan($retentionDate);

        // Assert
        $this->assertEquals(3, $deletedCount);
        $this->assertEquals(5, AuditLog::where('tenant_id', $this->tenantId)->count());
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherTenantId = $otherTenant->id;

        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'user_id' => $this->user->id,
            'action_type' => 'vendor_login',
        ]);

        // Create user for other tenant
        $otherUser = UserEloquentModel::factory()->create([
            'tenant_id' => $otherTenantId,
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $otherTenantId,
            'user_id' => $otherUser->id,
            'action_type' => 'vendor_login',
        ]);

        // Act
        $result = $this->repository->findByAction(
            tenantId: $this->tenantId,
            action: 'vendor_login',
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(3, $result['data']);
        foreach ($result['data'] as $log) {
            $this->assertEquals($this->tenantId, $log['tenant_id']);
        }
    }
}
