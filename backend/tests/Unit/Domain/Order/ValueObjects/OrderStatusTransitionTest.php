<?php

namespace Tests\Unit\Domain\Order\ValueObjects;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\ValueObjects\OrderStatusTransition;
use PHPUnit\Framework\TestCase;

class OrderStatusTransitionTest extends TestCase
{
    public function test_can_transition_validates_allowed_transitions(): void
    {
        $this->assertTrue(
            OrderStatusTransition::canTransition(OrderStatus::DRAFT, OrderStatus::PENDING)
        );

        $this->assertTrue(
            OrderStatusTransition::canTransition(OrderStatus::PENDING, OrderStatus::VENDOR_SOURCING)
        );

        $this->assertFalse(
            OrderStatusTransition::canTransition(OrderStatus::DRAFT, OrderStatus::COMPLETED)
        );
    }

    public function test_get_required_fields_returns_correct_fields(): void
    {
        $vendorNegotiationFields = OrderStatusTransition::getRequiredFields(OrderStatus::VENDOR_NEGOTIATION);
        $this->assertContains('vendor_id', $vendorNegotiationFields);

        $customerQuoteFields = OrderStatusTransition::getRequiredFields(OrderStatus::CUSTOMER_QUOTE);
        $this->assertContains('vendor_cost', $customerQuoteFields);
        $this->assertContains('markup_percentage', $customerQuoteFields);
        $this->assertContains('customer_price', $customerQuoteFields);

        $shippingFields = OrderStatusTransition::getRequiredFields(OrderStatus::SHIPPING);
        $this->assertContains('tracking_number', $shippingFields);
    }

    public function test_validate_transition_data_identifies_missing_fields(): void
    {
        $orderData = [
            'vendor_cost' => 1000000,
        ];

        $missing = OrderStatusTransition::validateTransitionData($orderData, OrderStatus::CUSTOMER_QUOTE);

        $this->assertCount(2, $missing);
        
        $missingFields = array_column($missing, 'field');
        $this->assertContains('markup_percentage', $missingFields);
        $this->assertContains('customer_price', $missingFields);
    }

    public function test_validate_transition_data_passes_with_complete_data(): void
    {
        $orderData = [
            'vendor_cost' => 1000000,
            'markup_percentage' => 20,
            'customer_price' => 1200000,
        ];

        $missing = OrderStatusTransition::validateTransitionData($orderData, OrderStatus::CUSTOMER_QUOTE);

        $this->assertEmpty($missing);
    }

    public function test_validate_payment_type(): void
    {
        $this->assertTrue(OrderStatusTransition::validatePaymentType('dp_50'));
        $this->assertTrue(OrderStatusTransition::validatePaymentType('full_100'));
        $this->assertFalse(OrderStatusTransition::validatePaymentType('invalid'));
        $this->assertFalse(OrderStatusTransition::validatePaymentType(null));
    }

    public function test_validate_payment_amount(): void
    {
        $customerPrice = 1000000;
        $dpAmount = 500000;

        $this->assertTrue(
            OrderStatusTransition::validatePaymentAmount($dpAmount, $customerPrice)
        );

        $this->assertFalse(
            OrderStatusTransition::validatePaymentAmount(300000, $customerPrice)
        );
    }

    public function test_validate_full_payment(): void
    {
        $customerPrice = 1000000;

        $this->assertTrue(
            OrderStatusTransition::validateFullPayment($customerPrice, $customerPrice)
        );

        $this->assertFalse(
            OrderStatusTransition::validateFullPayment(900000, $customerPrice)
        );
    }

    public function test_validate_pricing(): void
    {
        $vendorCost = 1000000;
        $markupPercentage = 20;
        $customerPrice = 1200000;

        $this->assertTrue(
            OrderStatusTransition::validatePricing($vendorCost, $markupPercentage, $customerPrice)
        );

        $this->assertFalse(
            OrderStatusTransition::validatePricing($vendorCost, $markupPercentage, 1500000)
        );
    }
}
