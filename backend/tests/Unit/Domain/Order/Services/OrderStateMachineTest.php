<?php

namespace Tests\Unit\Domain\Order\Services;

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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    protected OrderStateMachine $stateMachine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stateMachine = app(OrderStateMachine::class);
    }

    public function test_can_transition_from_new_to_sourcing_vendor(): void
    {
        $currentStatus = OrderStatus::NEW;
        $newStatus = OrderStatus::SOURCING_VENDOR;

        $this->assertTrue($this->stateMachine->canTransition($currentStatus, $newStatus));
    }

    public function test_cannot_transition_from_new_to_completed(): void
    {
        $currentStatus = OrderStatus::NEW;
        $newStatus = OrderStatus::COMPLETED;

        $this->assertFalse($this->stateMachine->canTransition($currentStatus, $newStatus));
    }

    public function test_cannot_transition_to_same_status(): void
    {
        $status = OrderStatus::NEW;

        $this->assertFalse($this->stateMachine->canTransition($status, $status));
    }

    public function test_get_available_transitions_returns_valid_next_states(): void
    {
        $order = Order::factory()->create(['status' => 'new']);

        $transitions = $this->stateMachine->getAvailableTransitions($order);

        $this->assertIsArray($transitions);
        $this->assertNotEmpty($transitions);
        
        foreach ($transitions as $transition) {
            $this->assertArrayHasKey('status', $transition);
            $this->assertArrayHasKey('label', $transition);
            $this->assertArrayHasKey('description', $transition);
        }
    }

    public function test_validate_transition_requires_vendor_for_negotiation(): void
    {
        $order = Order::factory()->create([
            'status' => 'sourcing_vendor',
            'vendor_id' => null,
        ]);

        $errors = $this->stateMachine->validateTransition(
            $order, 
            OrderStatus::VENDOR_NEGOTIATION,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('Vendor', $errors[0]);
    }

    public function test_validate_transition_requires_quotation_amount(): void
    {
        $order = Order::factory()->create([
            'status' => 'vendor_negotiation',
        ]);

        $errors = $this->stateMachine->validateTransition(
            $order,
            OrderStatus::CUSTOMER_QUOTATION,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('penawaran', strtolower($errors[0]));
    }

    public function test_validate_transition_requires_tracking_number_for_shipped(): void
    {
        $order = Order::factory()->create([
            'status' => 'ready_to_ship',
            'tracking_number' => null,
        ]);

        $errors = $this->stateMachine->validateTransition(
            $order,
            OrderStatus::SHIPPED,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('resi', strtolower($errors[0]));
    }

    public function test_validate_transition_requires_cancellation_reason(): void
    {
        $order = Order::factory()->create(['status' => 'new']);

        $errors = $this->stateMachine->validateTransition(
            $order,
            OrderStatus::CANCELLED,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('pembatalan', strtolower($errors[0]));
    }

    public function test_transition_updates_order_status_successfully(): void
    {
        $order = Order::factory()->create(['status' => 'new']);

        $result = $this->stateMachine->transitionTo(
            $order,
            OrderStatus::SOURCING_VENDOR,
            []
        );

        $this->assertTrue($result);
        $this->assertEquals('sourcing_vendor', $order->fresh()->status);
    }

    public function test_transition_throws_exception_for_invalid_transition(): void
    {
        $order = Order::factory()->create(['status' => 'new']);

        $this->expectException(\DomainException::class);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::COMPLETED,
            []
        );
    }

    public function test_transition_to_payment_received_updates_payment_info(): void
    {
        $order = Order::factory()->create([
            'status' => 'waiting_payment',
            'payment_status' => 'unpaid',
            'total_paid_amount' => 0,
        ]);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::PAYMENT_RECEIVED,
            [
                'payment' => [
                    'amount' => $order->total_amount,
                    'method' => 'transfer_bank',
                    'reference' => 'INV-001',
                ],
            ]
        );

        $order->refresh();

        $this->assertEquals('payment_received', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals($order->total_amount, $order->total_paid_amount);
        $this->assertNotNull($order->payment_date);
        $this->assertEquals('transfer_bank', $order->payment_method);
        $this->assertCount(1, $order->paymentTransactions);
        $transaction = $order->paymentTransactions()->first();
        $this->assertEquals('incoming', $transaction->direction);
        $this->assertEquals($order->total_amount, $transaction->amount);
    }

    public function test_partial_payment_sets_partially_paid_status(): void
    {
        $order = Order::factory()->create([
            'status' => 'waiting_payment',
            'payment_status' => 'unpaid',
            'total_paid_amount' => 0,
        ]);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::PAYMENT_RECEIVED,
            [
                'payment' => [
                    'amount' => (int) ($order->total_amount / 2),
                    'method' => 'cash',
                ],
            ]
        );

        $order->refresh();

        $this->assertEquals('payment_received', $order->status);
        $this->assertEquals('partially_paid', $order->payment_status);
        $this->assertEquals((int) ($order->total_amount / 2), $order->total_paid_amount);
        $this->assertNotNull($order->down_payment_paid_at);
        $this->assertCount(1, $order->paymentTransactions);
    }

    public function test_additional_payment_during_production_completes_balance(): void
    {
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->for($tenant, 'tenant')->create();

        $order = Order::factory()
            ->for($tenant, 'tenant')
            ->for($customer)
            ->state([
                'status' => 'waiting_payment',
                'payment_status' => 'unpaid',
                'total_paid_amount' => 0,
            ])
            ->create();

        $downPayment = (int) ($order->total_amount / 3);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::PAYMENT_RECEIVED,
            [
                'payment' => [
                    'amount' => $downPayment,
                    'method' => 'credit_card',
                ],
            ]
        );

        $order->refresh();

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::IN_PRODUCTION,
            [
                'payment' => [
                    'amount' => $order->total_amount - $downPayment,
                    'method' => 'bank_transfer',
                ],
            ]
        );

        $order->refresh();

        $this->assertEquals('in_production', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals($order->total_amount, $order->total_paid_amount);
        $this->assertCount(2, $order->paymentTransactions);
    }

    public function test_vendor_disbursement_is_recorded_during_production_transition(): void
    {
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->for($tenant, 'tenant')->create();
        $vendor = Vendor::factory()->for($tenant, 'tenant')->create();

        $order = Order::factory()
            ->for($tenant, 'tenant')
            ->for($customer)
            ->state([
                'status' => 'payment_received',
                'payment_status' => 'paid',
                'vendor_id' => $vendor->id,
                'total_paid_amount' => 200000,
                'total_amount' => 200000,
            ])
            ->create();

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::IN_PRODUCTION,
            [
                'disbursement' => [
                    'amount' => 80000,
                    'method' => 'bank_transfer',
                    'reference' => 'PAY-VND-001',
                ],
            ]
        );

        $order->refresh();

        $this->assertEquals('in_production', $order->status);
        $this->assertEquals(80000, $order->total_disbursed_amount);
        $this->assertCount(1, $order->vendorDisbursements);
        $disbursement = $order->vendorDisbursements()->first();
        $this->assertEquals('outgoing', $disbursement->direction);
        $this->assertEquals($vendor->id, $disbursement->vendor_id);
    }

    public function test_transition_to_shipped_records_tracking_number(): void
    {
        $order = Order::factory()->create(['status' => 'ready_to_ship']);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::SHIPPED,
            ['tracking_number' => 'TRACK123456']
        );

        $order->refresh();

        $this->assertEquals('shipped', $order->status);
        $this->assertEquals('TRACK123456', $order->tracking_number);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_transition_to_cancelled_stores_reason_in_metadata(): void
    {
        $order = Order::factory()->create(['status' => 'new']);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::CANCELLED,
            ['cancellation_reason' => 'Customer request']
        );

        $order->refresh();

        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('cancelled', $order->payment_status);
        $this->assertArrayHasKey('cancellation_reason', $order->metadata);
        $this->assertEquals('Customer request', $order->metadata['cancellation_reason']);
    }

    public function test_transition_to_vendor_negotiation_creates_negotiation_record(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 09:00:00'));

        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->for($tenant, 'tenant')->create();
        $vendor = Vendor::factory()->for($tenant, 'tenant')->create();

        $order = Order::factory()
            ->for($tenant, 'tenant')
            ->for($customer)
            ->state([
                'status' => 'sourcing_vendor',
                'vendor_id' => $vendor->id,
                'total_amount' => 200000,
                'metadata' => null,
            ])
            ->create();

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::VENDOR_NEGOTIATION,
            [
                'vendor_id' => $vendor->id,
                'negotiation' => [
                    'initial_offer' => 180000,
                    'currency' => 'IDR',
                    'notes' => 'Targeting better pricing',
                    'expires_at' => '2025-01-05 09:00:00',
                ],
            ]
        );

        $order->refresh();
        $negotiations = $order->vendorNegotiations;

        $this->assertCount(1, $negotiations);

        $negotiation = $negotiations->first();
        $this->assertEquals('open', $negotiation->status);
        $this->assertEquals(180000, $negotiation->initial_offer);
        $this->assertEquals(180000, $negotiation->latest_offer);
        $this->assertEquals('IDR', $negotiation->currency);
        $this->assertTrue(Carbon::parse('2025-01-05 09:00:00')->equalTo($negotiation->expires_at));
        $this->assertNotEmpty($negotiation->history);

        $this->assertArrayHasKey('negotiation', $order->metadata);
        $this->assertEquals($negotiation->id, $order->metadata['negotiation']['negotiation_id']);
        $this->assertEquals($vendor->id, $order->metadata['negotiation']['vendor_id']);
    }

    public function test_transition_initializes_sla_timer_for_status_with_policy(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 08:00:00'));

        $order = Order::factory()->create(['status' => 'new']);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::SOURCING_VENDOR,
            []
        );

        $order->refresh();
        $metadata = $order->metadata ?? [];

        $this->assertArrayHasKey('sla', $metadata);
        $this->assertArrayHasKey('active', $metadata['sla']);

        $active = $metadata['sla']['active'];

        $this->assertEquals('sourcing_vendor', $active['status']);
        $this->assertEquals(Carbon::now()->toIso8601String(), $active['started_at']);
        $this->assertNotNull($active['due_at']);
        $this->assertNotNull($active['threshold_minutes']);
        $this->assertArrayHasKey('escalations', $active);

        $startedAt = Carbon::parse($active['started_at']);
        $dueAt = Carbon::parse($active['due_at']);

        $this->assertEquals($active['threshold_minutes'], $startedAt->diffInMinutes($dueAt));
    }

    public function test_transition_records_sla_history_and_triggers_escalation_on_breach(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 14:30:00'));

        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->for($tenant, 'tenant')->create();
        $vendor = Vendor::factory()->for($tenant, 'tenant')->create();

        $order = Order::factory()
            ->for($tenant, 'tenant')
            ->for($customer)
            ->state([
                'status' => 'sourcing_vendor',
                'vendor_id' => $vendor->id,
                'metadata' => [
                    'sla' => [
                        'active' => [
                            'status' => 'sourcing_vendor',
                            'started_at' => Carbon::parse('2025-01-01 08:00:00')->toIso8601String(),
                            'due_at' => Carbon::parse('2025-01-01 12:00:00')->toIso8601String(),
                            'threshold_minutes' => 240,
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
                        ],
                        'history' => [],
                    ],
                ],
            ])
            ->create();

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::VENDOR_NEGOTIATION,
            [
                'vendor_id' => $vendor->id,
                'negotiation' => [
                    'initial_offer' => 125000,
                    'notes' => 'Initial negotiation entry',
                ],
            ]
        );

        $order->refresh();
        $metadata = $order->metadata ?? [];

        $this->assertArrayHasKey('sla', $metadata);
        $this->assertArrayHasKey('history', $metadata['sla']);

        $history = $metadata['sla']['history'];
        $this->assertNotEmpty($history);

        $entry = $history[array_key_last($history)];

        $this->assertEquals('sourcing_vendor', $entry['status']);
        $this->assertTrue($entry['breached']);
        $this->assertEquals('vendor_negotiation', $entry['next_status']);
        $this->assertEquals(23400, $entry['duration_seconds']);
        $this->assertEquals(Carbon::now()->toIso8601String(), $entry['breached_at']);
        $this->assertNotEmpty($entry['escalations_triggered']);
        $this->assertCount(2, $entry['escalations_triggered']);

        foreach ($entry['escalations_triggered'] as $escalation) {
            $this->assertNotNull($escalation['triggered_at']);
        }

        $this->assertArrayHasKey('active', $metadata['sla']);
        $this->assertEquals('vendor_negotiation', $metadata['sla']['active']['status']);
        $this->assertArrayHasKey('negotiation', $metadata);
        $this->assertEquals($vendor->id, $metadata['negotiation']['vendor_id'] ?? null);
    }

    public function test_initialize_sla_schedules_monitor_jobs(): void
    {
        Bus::fake();

        Carbon::setTestNow(Carbon::parse('2025-01-01 08:00:00'));

        $order = Order::factory()->create(['status' => 'new']);

        $this->stateMachine->transitionTo(
            $order,
            OrderStatus::SOURCING_VENDOR,
            []
        );

        Bus::assertDispatched(OrderSlaMonitorJob::class, function ($job) use ($order) {
            return $job->orderId === $order->id
                && $job->status === 'sourcing_vendor'
                && $job->thresholdCheck
                && $job->delay instanceof \DateTimeInterface
                && Carbon::instance($job->delay)->equalTo(Carbon::now()->addMinutes(240));
        });

        Bus::assertDispatched(OrderSlaMonitorJob::class, function ($job) use ($order) {
            return $job->orderId === $order->id
                && $job->status === 'sourcing_vendor'
                && $job->escalationIndex === 0
                && !$job->thresholdCheck
                && $job->delay instanceof \DateTimeInterface
                && Carbon::instance($job->delay)->equalTo(Carbon::now()->addMinutes(240));
        });

        Bus::assertDispatched(OrderSlaMonitorJob::class, function ($job) use ($order) {
            return $job->orderId === $order->id
                && $job->status === 'sourcing_vendor'
                && $job->escalationIndex === 1
                && !$job->thresholdCheck
                && $job->delay instanceof \DateTimeInterface
                && Carbon::instance($job->delay)->equalTo(Carbon::now()->addMinutes(360));
        });

        Bus::assertDispatchedTimes(OrderSlaMonitorJob::class, 3);
    }

    public function test_sla_escalation_job_updates_metadata_and_dispatches_event(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 12:00:00'));
        Event::fake([OrderSlaEscalated::class]);

        $order = Order::factory()->create([
            'status' => 'sourcing_vendor',
            'metadata' => [
                'sla' => [
                    'active' => [
                        'status' => 'sourcing_vendor',
                        'started_at' => Carbon::parse('2025-01-01 08:00:00')->toIso8601String(),
                        'due_at' => Carbon::parse('2025-01-01 12:00:00')->toIso8601String(),
                        'threshold_minutes' => 240,
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
                    ],
                ],
            ],
        ]);

        $job = new OrderSlaMonitorJob($order->id, 'sourcing_vendor', 0);

        $job->handle($this->stateMachine);

        $order->refresh();
        $metadata = $order->metadata ?? [];
        $active = $metadata['sla']['active'];

        $this->assertNotNull($active['escalations'][0]['triggered_at']);
        $this->assertNull($active['escalations'][1]['triggered_at']);

        Event::assertDispatched(OrderSlaEscalated::class, function ($event) use ($order) {
            return $event->order->is($order)
                && $event->status === 'sourcing_vendor'
                && $event->level === 'procurement_lead'
                && $event->channel === 'slack';
        });
    }

    public function test_sla_threshold_job_marks_breach_and_dispatches_event(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 12:05:00'));
        Event::fake([OrderSlaBreached::class]);

        $order = Order::factory()->create([
            'status' => 'sourcing_vendor',
            'metadata' => [
                'sla' => [
                    'active' => [
                        'status' => 'sourcing_vendor',
                        'started_at' => Carbon::parse('2025-01-01 08:00:00')->toIso8601String(),
                        'due_at' => Carbon::parse('2025-01-01 12:00:00')->toIso8601String(),
                        'threshold_minutes' => 240,
                        'escalations' => [
                            [
                                'level' => 'procurement_lead',
                                'channel' => 'slack',
                                'after_minutes' => 240,
                                'triggered_at' => null,
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $job = new OrderSlaMonitorJob($order->id, 'sourcing_vendor', null, true);

        $job->handle($this->stateMachine);

        $order->refresh();
        $metadata = $order->metadata ?? [];
        $active = $metadata['sla']['active'];

        $this->assertTrue($active['breached']);
        $this->assertEquals(Carbon::now()->toIso8601String(), $active['breached_at']);

        Event::assertDispatched(OrderSlaBreached::class, function ($event) use ($order) {
            return $event->order->is($order)
                && $event->status === 'sourcing_vendor'
                && $event->breachedAt === Carbon::now()->toIso8601String();
        });
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
}
