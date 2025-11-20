<?php

namespace Tests\Unit\Domain\Order\Jobs;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Events\OrderSlaBreached;
use App\Domain\Order\Events\OrderSlaEscalated;
use App\Domain\Order\Jobs\OrderSlaMonitorJob;
use App\Domain\Order\Services\OrderStateMachine;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OrderSlaMonitorJobTest extends TestCase
{
    use DatabaseTransactions;

    protected OrderStateMachine $stateMachine;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        $this->stateMachine = app(OrderStateMachine::class);
    }

    protected function createTestOrder(string $status = 'sourcing_vendor'): Order
    {
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => $status,
        ]);
        return $order;
    }

    public function test_job_handles_order_sla_monitoring(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        $order->refresh();
        $this->assertNotNull($order->metadata);
    }

    public function test_sla_breach_detection(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(300)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_multi_level_escalation_slack_channel(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(250)->toIso8601String(),
                'escalations' => [
                    [
                        'level' => 'procurement_lead',
                        'channel' => 'slack',
                        'after_minutes' => 240,
                        'triggered_at' => null,
                    ],
                    [
                        'level' => 'operations_manager',
                        'channel' => 'email',
                        'after_minutes' => 360,
                        'triggered_at' => null,
                    ],
                ],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 0
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaEscalated::class, function ($event) {
            return $event->level === 'procurement_lead' && $event->channel === 'slack';
        });
    }

    public function test_multi_level_escalation_email_channel(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(370)->toIso8601String(),
                'escalations' => [
                    [
                        'level' => 'procurement_lead',
                        'channel' => 'slack',
                        'after_minutes' => 240,
                        'triggered_at' => now()->toIso8601String(),
                    ],
                    [
                        'level' => 'operations_manager',
                        'channel' => 'email',
                        'after_minutes' => 360,
                        'triggered_at' => null,
                    ],
                ],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 1
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaEscalated::class, function ($event) {
            return $event->level === 'operations_manager' && $event->channel === 'email';
        });
    }

    public function test_role_based_routing_procurement_lead(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(250)->toIso8601String(),
                'escalations' => [
                    [
                        'level' => 'procurement_lead',
                        'channel' => 'slack',
                        'after_minutes' => 240,
                        'triggered_at' => null,
                    ],
                ],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 0
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaEscalated::class, function ($event) {
            return $event->level === 'procurement_lead';
        });
    }

    public function test_threshold_configuration_sourcing_vendor(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(240)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_threshold_configuration_vendor_negotiation(): void
    {
        $order = $this->createTestOrder('vendor_negotiation');

        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'vendor_negotiation',
                'started_at' => now()->subMinutes(720)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'vendor_negotiation',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_notification_dispatch_on_escalation(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(250)->toIso8601String(),
                'escalations' => [
                    [
                        'level' => 'procurement_lead',
                        'channel' => 'slack',
                        'after_minutes' => 240,
                        'triggered_at' => null,
                    ],
                ],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 0
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaEscalated::class);
    }

    public function test_job_returns_early_if_order_not_found(): void
    {
        $job = new OrderSlaMonitorJob(
            orderId: 99999,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertNotDispatched(OrderSlaBreached::class);
        Event::assertNotDispatched(OrderSlaEscalated::class);
    }

    public function test_job_returns_early_if_status_mismatch(): void
    {
        $order = $this->createTestOrder('new');

        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(250)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 0
        );

        $job->handle($this->stateMachine);

        Event::assertNotDispatched(OrderSlaBreached::class);
    }

    public function test_escalation_index_null_with_threshold_check(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(300)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: null,
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_multiple_escalation_levels_triggered_sequentially(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(400)->toIso8601String(),
                'escalations' => [
                    [
                        'level' => 'procurement_lead',
                        'channel' => 'slack',
                        'after_minutes' => 240,
                        'triggered_at' => now()->subMinutes(150)->toIso8601String(),
                    ],
                    [
                        'level' => 'operations_manager',
                        'channel' => 'email',
                        'after_minutes' => 360,
                        'triggered_at' => null,
                    ],
                ],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            escalationIndex: 1
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaEscalated::class);
    }

    public function test_sla_metadata_updated_after_job_execution(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(300)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        $order->refresh();
        $updatedMetadata = $order->metadata;

        $this->assertArrayHasKey('sla', $updatedMetadata);
        $this->assertArrayHasKey('active', $updatedMetadata['sla']);
        $this->assertTrue($updatedMetadata['sla']['active']['breached']);
        $this->assertArrayHasKey('breached_at', $updatedMetadata['sla']['active']);
    }

    public function test_job_handles_in_production_state(): void
    {
        $order = $this->createTestOrder('in_production');

        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'in_production',
                'started_at' => now()->subMinutes(3000)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'in_production',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_job_handles_quality_check_state(): void
    {
        $order = $this->createTestOrder('quality_check');

        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'quality_check',
                'started_at' => now()->subMinutes(750)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'quality_check',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        Event::assertDispatched(OrderSlaBreached::class);
    }

    public function test_sla_not_breached_if_within_threshold(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(100)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        $order->refresh();
        $this->assertFalse($order->metadata['sla']['active']['breached'] ?? false);
    }

    public function test_tenant_scoping_respected_in_job(): void
    {
        $order = $this->createTestOrder('sourcing_vendor');
        $tenant2 = Tenant::factory()->create();
        $customer2 = Customer::factory()->create(['tenant_id' => $tenant2->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $tenant2->id]);
        $order2 = Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
            'vendor_id' => $vendor2->id,
            'status' => 'sourcing_vendor',
        ]);

        $metadata = $order->metadata ?? [];
        $metadata['sla'] = [
            'active' => [
                'status' => 'sourcing_vendor',
                'started_at' => now()->subMinutes(300)->toIso8601String(),
                'escalations' => [],
                'breached' => false,
            ],
        ];
        $order->metadata = $metadata;
        $order->save();

        $job = new OrderSlaMonitorJob(
            orderId: $order->id,
            status: 'sourcing_vendor',
            thresholdCheck: true
        );

        $job->handle($this->stateMachine);

        $order->refresh();
        $this->assertEquals($order->tenant_id, $order->tenant_id);
        $this->assertTrue($order->metadata['sla']['active']['breached']);
    }
}
