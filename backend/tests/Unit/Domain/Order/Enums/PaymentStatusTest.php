<?php

namespace Tests\Unit\Domain\Order\Enums;

use App\Domain\Order\Enums\PaymentStatus;
use PHPUnit\Framework\TestCase;

class PaymentStatusTest extends TestCase
{
    /** @test */
    public function it_has_correct_payment_status_values()
    {
        $this->assertEquals('unpaid', PaymentStatus::UNPAID->value);
        $this->assertEquals('partially_paid', PaymentStatus::PARTIALLY_PAID->value);
        $this->assertEquals('paid', PaymentStatus::PAID->value);
        $this->assertEquals('refunded', PaymentStatus::REFUNDED->value);
    }

    /** @test */
    public function it_provides_human_readable_labels()
    {
        $this->assertEquals('Unpaid', PaymentStatus::UNPAID->getLabel());
        $this->assertEquals('Partially Paid', PaymentStatus::PARTIALLY_PAID->getLabel());
        $this->assertEquals('Paid', PaymentStatus::PAID->getLabel());
        $this->assertEquals('Refunded', PaymentStatus::REFUNDED->getLabel());
    }

    /** @test */
    public function it_provides_status_descriptions()
    {
        $this->assertEquals('No payment received', PaymentStatus::UNPAID->getDescription());
        $this->assertEquals('Partial payment received', PaymentStatus::PARTIALLY_PAID->getDescription());
        $this->assertEquals('Full payment received', PaymentStatus::PAID->getDescription());
        $this->assertEquals('Payment has been refunded', PaymentStatus::REFUNDED->getDescription());
    }

    /** @test */
    public function it_validates_payment_status_transitions_correctly()
    {
        // Unpaid can transition to partially paid or paid
        $this->assertTrue(PaymentStatus::UNPAID->canTransitionTo(PaymentStatus::PARTIALLY_PAID));
        $this->assertTrue(PaymentStatus::UNPAID->canTransitionTo(PaymentStatus::PAID));
        $this->assertFalse(PaymentStatus::UNPAID->canTransitionTo(PaymentStatus::REFUNDED));

        // Partially paid can transition to paid or refunded
        $this->assertTrue(PaymentStatus::PARTIALLY_PAID->canTransitionTo(PaymentStatus::PAID));
        $this->assertTrue(PaymentStatus::PARTIALLY_PAID->canTransitionTo(PaymentStatus::REFUNDED));
        $this->assertFalse(PaymentStatus::PARTIALLY_PAID->canTransitionTo(PaymentStatus::UNPAID));

        // Paid can only transition to refunded
        $this->assertTrue(PaymentStatus::PAID->canTransitionTo(PaymentStatus::REFUNDED));
        $this->assertFalse(PaymentStatus::PAID->canTransitionTo(PaymentStatus::UNPAID));
        $this->assertFalse(PaymentStatus::PAID->canTransitionTo(PaymentStatus::PARTIALLY_PAID));

        // Refunded cannot transition to any other status
        $this->assertFalse(PaymentStatus::REFUNDED->canTransitionTo(PaymentStatus::UNPAID));
        $this->assertFalse(PaymentStatus::REFUNDED->canTransitionTo(PaymentStatus::PAID));
    }

    /** @test */
    public function it_identifies_complete_payment_status()
    {
        $this->assertTrue(PaymentStatus::PAID->isComplete());
        
        $this->assertFalse(PaymentStatus::UNPAID->isComplete());
        $this->assertFalse(PaymentStatus::PARTIALLY_PAID->isComplete());
        $this->assertFalse(PaymentStatus::REFUNDED->isComplete());
    }

    /** @test */
    public function it_identifies_statuses_that_allow_refunds()
    {
        $this->assertTrue(PaymentStatus::PARTIALLY_PAID->allowsRefund());
        $this->assertTrue(PaymentStatus::PAID->allowsRefund());
        
        $this->assertFalse(PaymentStatus::UNPAID->allowsRefund());
        $this->assertFalse(PaymentStatus::REFUNDED->allowsRefund());
    }

    /** @test */
    public function it_identifies_statuses_that_allow_additional_payments()
    {
        $this->assertTrue(PaymentStatus::UNPAID->allowsAdditionalPayment());
        $this->assertTrue(PaymentStatus::PARTIALLY_PAID->allowsAdditionalPayment());
        
        $this->assertFalse(PaymentStatus::PAID->allowsAdditionalPayment());
        $this->assertFalse(PaymentStatus::REFUNDED->allowsAdditionalPayment());
    }

    /** @test */
    public function it_provides_ui_colors()
    {
        $this->assertEquals('red', PaymentStatus::UNPAID->getColor());
        $this->assertEquals('yellow', PaymentStatus::PARTIALLY_PAID->getColor());
        $this->assertEquals('green', PaymentStatus::PAID->getColor());
        $this->assertEquals('gray', PaymentStatus::REFUNDED->getColor());
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $statuses = PaymentStatus::toArray();
        
        $this->assertIsArray($statuses);
        $this->assertContains('unpaid', $statuses);
        $this->assertContains('partially_paid', $statuses);
        $this->assertContains('paid', $statuses);
        $this->assertContains('refunded', $statuses);
    }

    /** @test */
    public function it_provides_options_with_labels()
    {
        $options = PaymentStatus::getOptions();
        
        $this->assertIsArray($options);
        $this->assertEquals('Unpaid', $options['unpaid']);
        $this->assertEquals('Partially Paid', $options['partially_paid']);
        $this->assertEquals('Paid', $options['paid']);
        $this->assertEquals('Refunded', $options['refunded']);
    }

    /** @test */
    public function it_provides_valid_transitions_for_each_status()
    {
        $unpaidTransitions = PaymentStatus::UNPAID->getValidTransitions();
        $this->assertContains(PaymentStatus::PARTIALLY_PAID, $unpaidTransitions);
        $this->assertContains(PaymentStatus::PAID, $unpaidTransitions);
        $this->assertCount(2, $unpaidTransitions);

        $partiallyPaidTransitions = PaymentStatus::PARTIALLY_PAID->getValidTransitions();
        $this->assertContains(PaymentStatus::PAID, $partiallyPaidTransitions);
        $this->assertContains(PaymentStatus::REFUNDED, $partiallyPaidTransitions);
        $this->assertCount(2, $partiallyPaidTransitions);

        $paidTransitions = PaymentStatus::PAID->getValidTransitions();
        $this->assertContains(PaymentStatus::REFUNDED, $paidTransitions);
        $this->assertCount(1, $paidTransitions);

        $refundedTransitions = PaymentStatus::REFUNDED->getValidTransitions();
        $this->assertEmpty($refundedTransitions);
    }
}