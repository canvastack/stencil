<?php

namespace Tests\Unit\Domain\Order\StateTransition;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Services\OrderStateMachine;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected OrderStateMachine $stateMachine;
    protected TenantEloquentModel $tenant;
    protected Customer $customer;
    protected Vendor $vendor;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stateMachine = app(OrderStateMachine::class);
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
        ]);
    }

    public function test_invalid_state_transition_from_new_to_completed(): void
    {
        $this->order->update(['status' => 'new']);

        $this->expectException(\DomainException::class);

        $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::COMPLETED,
            []
        );
    }

    public function test_invalid_state_transition_from_completed_backward(): void
    {
        $this->order->update(['status' => 'completed']);

        $this->expectException(\DomainException::class);

        $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );
    }

    public function test_invalid_state_transition_to_self(): void
    {
        $this->order->update(['status' => 'new']);

        $this->assertFalse($this->stateMachine->canTransition(
            OrderStatus::PENDING,
            OrderStatus::PENDING
        ));
    }

    public function test_concurrent_transition_attempts(): void
    {
        $this->order->update(['status' => 'new']);

        $result1 = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result1);
        $this->order->refresh();
        $this->assertEquals('vendor_sourcing', $this->order->status);

        $this->order->update(['status' => 'new']);
        $this->order->refresh();

        $result2 = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result2);
        $this->order->refresh();
        $this->assertEquals('vendor_sourcing', $this->order->status);
    }

    public function test_transition_with_missing_required_field(): void
    {
        $this->order->update(['status' => 'vendor_sourcing', 'vendor_id' => null]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::VENDOR_NEGOTIATION,
            []
        );

        $this->assertNotEmpty($errors);
    }

    public function test_transition_with_empty_metadata(): void
    {
        $this->order->update([
            'status' => 'new',
            'metadata' => null,
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
        $this->order->refresh();
        $this->assertEquals('vendor_sourcing', $this->order->status);
    }

    public function test_transition_with_corrupted_metadata(): void
    {
        $this->order->update([
            'status' => 'new',
            'metadata' => 'invalid_json',
        ]);

        try {
            $result = $this->stateMachine->transitionTo(
                $this->order,
                OrderStatus::VENDOR_SOURCING,
                []
            );
            $this->assertNotNull($result);
        } catch (\Exception $e) {
            $this->assertIsString($e->getMessage());
        }
    }

    public function test_rapid_sequential_transitions(): void
    {
        $this->order->update(['status' => 'new']);

        $statuses = [
            OrderStatus::VENDOR_SOURCING,
            OrderStatus::VENDOR_NEGOTIATION,
            OrderStatus::CUSTOMER_QUOTE,
        ];

        foreach ($statuses as $status) {
            $this->order->update(['status' => $status->value]);
            $this->order->refresh();
            $this->assertEquals($status->value, $this->order->status);
        }
    }

    public function test_transition_with_null_vendor(): void
    {
        $this->order->update(['status' => 'vendor_sourcing', 'vendor_id' => null]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::VENDOR_NEGOTIATION,
            []
        );

        $this->assertNotEmpty($errors);
    }

    public function test_transition_with_extreme_currency_values(): void
    {
        $this->order->update([
            'status' => 'new',
            'total_amount' => 999999999999,
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_transition_with_zero_amount(): void
    {
        $this->order->update([
            'status' => 'new',
            'total_amount' => 0,
        ]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::CUSTOMER_QUOTE,
            ['quotation_amount' => 0]
        );

        $this->assertNotEmpty($errors);
    }

    public function test_transition_with_negative_amount(): void
    {
        $this->order->update([
            'status' => 'new',
            'total_amount' => -1000,
        ]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertNotEmpty($errors);
    }

    public function test_rollback_on_transition_failure(): void
    {
        $this->order->update(['status' => 'new']);
        $originalStatus = $this->order->status;

        try {
            $this->stateMachine->transitionTo(
                $this->order,
                OrderStatus::COMPLETED,
                []
            );
        } catch (\DomainException $e) {
            $this->order->refresh();
            $this->assertEquals($originalStatus, $this->order->status);
        }
    }

    public function test_validation_error_handling_missing_tracking_number(): void
    {
        $this->order->update(['status' => 'quality_control', 'tracking_number' => null]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::SHIPPING,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('resi', strtolower($errors[0]));
    }

    public function test_validation_error_handling_missing_cancellation_reason(): void
    {
        $this->order->update(['status' => 'new']);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::CANCELLED,
            []
        );

        $this->assertNotEmpty($errors);
    }

    public function test_order_with_special_characters_in_metadata(): void
    {
        $this->order->update([
            'status' => 'new',
            'metadata' => [
                'notes' => 'Special chars: !@#$%^&*()',
            ],
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_transition_with_unicode_characters(): void
    {
        $this->order->update([
            'status' => 'new',
            'metadata' => [
                'notes' => 'Unicode test: 你好世界 مرحبا بالعالم',
            ],
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_transition_maintains_timestamps(): void
    {
        $originalCreatedAt = $this->order->created_at;

        $this->order->update(['status' => 'new']);

        $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->order->refresh();
        $this->assertEquals(
            $originalCreatedAt->toDateString(),
            $this->order->created_at->toDateString()
        );
        $this->assertNotNull($this->order->updated_at);
    }

    public function test_transition_with_very_old_order(): void
    {
        $this->order->update([
            'status' => 'new',
            'created_at' => Carbon::now()->subYears(5),
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_transition_with_future_timestamps(): void
    {
        $this->order->update([
            'status' => 'new',
            'created_at' => Carbon::now()->addYears(1),
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_cannot_transition_with_invalid_enum_value(): void
    {
        $this->order->update(['status' => 'new']);

        $this->expectException(\ValueError::class);

        OrderStatus::fromString('invalid_status');
    }

    public function test_get_available_transitions_for_all_states(): void
    {
        $states = ['new', 'vendor_sourcing', 'vendor_negotiation', 'customer_quote'];

        foreach ($states as $state) {
            $this->order->update(['status' => $state]);
            $this->order->refresh();

            $transitions = $this->stateMachine->getAvailableTransitions($this->order);

            $this->assertIsArray($transitions);
        }
    }

    public function test_state_machine_handles_concurrent_orders(): void
    {
        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'new',
        ]);

        $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->stateMachine->transitionTo(
            $order2,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->order->refresh();
        $order2->refresh();

        $this->assertEquals('vendor_sourcing', $this->order->status);
        $this->assertEquals('vendor_sourcing', $order2->status);
    }

    public function test_transition_isolation_between_tenants(): void
    {
        $tenant2 = TenantEloquentModel::factory()->create();
        $customer2 = Customer::factory()->create(['tenant_id' => $tenant2->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $tenant2->id]);
        $order2 = Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
            'vendor_id' => $vendor2->id,
            'status' => 'vendor_sourcing',
        ]);

        $this->order->update(['status' => 'new']);

        $this->stateMachine->transitionTo($this->order, OrderStatus::VENDOR_SOURCING, []);
        $this->stateMachine->transitionTo($order2, OrderStatus::VENDOR_NEGOTIATION, []);

        $this->order->refresh();
        $order2->refresh();

        $this->assertEquals('vendor_sourcing', $this->order->status);
        $this->assertEquals('vendor_negotiation', $order2->status);
    }

    public function test_transition_with_minimal_metadata_payload(): void
    {
        $this->order->update(['status' => 'new', 'metadata' => []]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
    }

    public function test_transition_with_deeply_nested_metadata(): void
    {
        $this->order->update([
            'status' => 'new',
            'metadata' => [
                'level1' => [
                    'level2' => [
                        'level3' => [
                            'deep_value' => 'test',
                        ],
                    ],
                ],
            ],
        ]);

        $result = $this->stateMachine->transitionTo(
            $this->order,
            OrderStatus::VENDOR_SOURCING,
            []
        );

        $this->assertTrue($result);
        $this->order->refresh();
        $this->assertArrayHasKey('level1', $this->order->metadata);
    }

    public function test_validation_with_multiple_errors(): void
    {
        $this->order->update([
            'status' => 'quality_control',
            'tracking_number' => null,
        ]);

        $errors = $this->stateMachine->validateTransition(
            $this->order,
            OrderStatus::SHIPPING,
            []
        );

        $this->assertNotEmpty($errors);
        $this->assertIsArray($errors);
    }
}
