<?php

namespace Tests\Unit\Domain\Order\Enums;

use App\Domain\Order\Enums\OrderStatus;
use PHPUnit\Framework\TestCase;

class OrderStatusTest extends TestCase
{
    /** @test */
    public function it_has_correct_status_values()
    {
        $this->assertEquals('draft', OrderStatus::DRAFT->value);
        $this->assertEquals('pending', OrderStatus::PENDING->value);
        $this->assertEquals('vendor_sourcing', OrderStatus::VENDOR_SOURCING->value);
        $this->assertEquals('vendor_negotiation', OrderStatus::VENDOR_NEGOTIATION->value);
        $this->assertEquals('customer_quote', OrderStatus::CUSTOMER_QUOTE->value);
        $this->assertEquals('awaiting_payment', OrderStatus::AWAITING_PAYMENT->value);
        $this->assertEquals('partial_payment', OrderStatus::PARTIAL_PAYMENT->value);
        $this->assertEquals('full_payment', OrderStatus::FULL_PAYMENT->value);
        $this->assertEquals('in_production', OrderStatus::IN_PRODUCTION->value);
        $this->assertEquals('quality_control', OrderStatus::QUALITY_CONTROL->value);
        $this->assertEquals('shipping', OrderStatus::SHIPPING->value);
        $this->assertEquals('completed', OrderStatus::COMPLETED->value);
        $this->assertEquals('cancelled', OrderStatus::CANCELLED->value);
        $this->assertEquals('refunded', OrderStatus::REFUNDED->value);
    }

    /** @test */
    public function it_provides_human_readable_labels()
    {
        $this->assertEquals('Draft', OrderStatus::DRAFT->getLabel());
        $this->assertEquals('Pending Review', OrderStatus::PENDING->getLabel());
        $this->assertEquals('Completed', OrderStatus::COMPLETED->getLabel());
    }

    /** @test */
    public function it_provides_status_descriptions()
    {
        $this->assertEquals('Order is being prepared', OrderStatus::DRAFT->getDescription());
        $this->assertEquals('Order has been completed and delivered', OrderStatus::COMPLETED->getDescription());
    }

    /** @test */
    public function it_validates_status_transitions_correctly()
    {
        // Draft can transition to pending or cancelled
        $this->assertTrue(OrderStatus::DRAFT->canTransitionTo(OrderStatus::PENDING));
        $this->assertTrue(OrderStatus::DRAFT->canTransitionTo(OrderStatus::CANCELLED));
        $this->assertFalse(OrderStatus::DRAFT->canTransitionTo(OrderStatus::COMPLETED));

        // Pending can transition to vendor sourcing, customer quote, or cancelled
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::VENDOR_SOURCING));
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::CUSTOMER_QUOTE));
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::CANCELLED));
        $this->assertFalse(OrderStatus::PENDING->canTransitionTo(OrderStatus::COMPLETED));

        // Completed can only transition to refunded
        $this->assertTrue(OrderStatus::COMPLETED->canTransitionTo(OrderStatus::REFUNDED));
        $this->assertFalse(OrderStatus::COMPLETED->canTransitionTo(OrderStatus::PENDING));
    }

    /** @test */
    public function it_identifies_terminal_statuses()
    {
        $this->assertTrue(OrderStatus::COMPLETED->isTerminal());
        $this->assertTrue(OrderStatus::CANCELLED->isTerminal());
        $this->assertTrue(OrderStatus::REFUNDED->isTerminal());
        
        $this->assertFalse(OrderStatus::PENDING->isTerminal());
        $this->assertFalse(OrderStatus::IN_PRODUCTION->isTerminal());
    }

    /** @test */
    public function it_identifies_statuses_that_allow_vendor_assignment()
    {
        $this->assertTrue(OrderStatus::PENDING->allowsVendorAssignment());
        $this->assertTrue(OrderStatus::VENDOR_SOURCING->allowsVendorAssignment());
        $this->assertTrue(OrderStatus::VENDOR_NEGOTIATION->allowsVendorAssignment());
        
        $this->assertFalse(OrderStatus::COMPLETED->allowsVendorAssignment());
        $this->assertFalse(OrderStatus::IN_PRODUCTION->allowsVendorAssignment());
    }

    /** @test */
    public function it_identifies_statuses_that_allow_payment()
    {
        $this->assertTrue(OrderStatus::AWAITING_PAYMENT->allowsPayment());
        $this->assertTrue(OrderStatus::PARTIAL_PAYMENT->allowsPayment());
        
        $this->assertFalse(OrderStatus::PENDING->allowsPayment());
        $this->assertFalse(OrderStatus::COMPLETED->allowsPayment());
    }

    /** @test */
    public function it_identifies_production_phase_statuses()
    {
        $this->assertTrue(OrderStatus::IN_PRODUCTION->isProductionPhase());
        $this->assertTrue(OrderStatus::QUALITY_CONTROL->isProductionPhase());
        $this->assertTrue(OrderStatus::SHIPPING->isProductionPhase());
        
        $this->assertFalse(OrderStatus::PENDING->isProductionPhase());
        $this->assertFalse(OrderStatus::COMPLETED->isProductionPhase());
    }

    /** @test */
    public function it_identifies_payment_phase_statuses()
    {
        $this->assertTrue(OrderStatus::AWAITING_PAYMENT->isPaymentPhase());
        $this->assertTrue(OrderStatus::PARTIAL_PAYMENT->isPaymentPhase());
        $this->assertTrue(OrderStatus::FULL_PAYMENT->isPaymentPhase());
        
        $this->assertFalse(OrderStatus::PENDING->isPaymentPhase());
        $this->assertFalse(OrderStatus::IN_PRODUCTION->isPaymentPhase());
    }

    /** @test */
    public function it_provides_ui_colors()
    {
        $this->assertEquals('gray', OrderStatus::DRAFT->getColor());
        $this->assertEquals('yellow', OrderStatus::PENDING->getColor());
        $this->assertEquals('green', OrderStatus::COMPLETED->getColor());
        $this->assertEquals('red', OrderStatus::CANCELLED->getColor());
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $statuses = OrderStatus::toArray();
        
        $this->assertIsArray($statuses);
        $this->assertContains('draft', $statuses);
        $this->assertContains('pending', $statuses);
        $this->assertContains('completed', $statuses);
    }

    /** @test */
    public function it_provides_options_with_labels()
    {
        $options = OrderStatus::getOptions();
        
        $this->assertIsArray($options);
        $this->assertEquals('Draft', $options['draft']);
        $this->assertEquals('Pending Review', $options['pending']);
        $this->assertEquals('Completed', $options['completed']);
    }

    /** @test */
    public function it_provides_valid_transitions_for_each_status()
    {
        $draftTransitions = OrderStatus::DRAFT->getValidTransitions();
        $this->assertContains(OrderStatus::PENDING, $draftTransitions);
        $this->assertContains(OrderStatus::CANCELLED, $draftTransitions);
        
        $completedTransitions = OrderStatus::COMPLETED->getValidTransitions();
        $this->assertContains(OrderStatus::REFUNDED, $completedTransitions);
        $this->assertCount(1, $completedTransitions);
        
        $cancelledTransitions = OrderStatus::CANCELLED->getValidTransitions();
        $this->assertEmpty($cancelledTransitions);
    }
}