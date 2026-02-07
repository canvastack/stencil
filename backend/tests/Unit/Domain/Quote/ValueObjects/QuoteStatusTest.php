<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\ValueObjects;

use App\Domain\Quote\ValueObjects\QuoteStatus;
use PHPUnit\Framework\TestCase;

class QuoteStatusTest extends TestCase
{
    /** @test */
    public function it_has_all_required_status_values(): void
    {
        $expectedStatuses = [
            'draft',
            'sent',
            'pending_response',
            'accepted',
            'rejected',
            'countered',
            'expired'
        ];

        $actualStatuses = array_map(fn($case) => $case->value, QuoteStatus::cases());

        $this->assertEquals($expectedStatuses, $actualStatuses);
    }

    /** @test */
    public function draft_can_only_transition_to_sent(): void
    {
        $status = QuoteStatus::DRAFT;

        $this->assertTrue($status->canTransitionTo(QuoteStatus::SENT));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::PENDING_RESPONSE));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::ACCEPTED));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::REJECTED));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::COUNTERED));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::EXPIRED));
    }

    /** @test */
    public function sent_can_transition_to_pending_response_or_expired(): void
    {
        $status = QuoteStatus::SENT;

        // SENT can transition to all vendor response states
        $this->assertTrue($status->canTransitionTo(QuoteStatus::PENDING_RESPONSE));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::ACCEPTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::REJECTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::COUNTERED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::EXPIRED));
        
        // SENT cannot transition back to DRAFT
        $this->assertFalse($status->canTransitionTo(QuoteStatus::DRAFT));
    }

    /** @test */
    public function pending_response_can_transition_to_accepted_rejected_countered_or_expired(): void
    {
        $status = QuoteStatus::PENDING_RESPONSE;

        $this->assertTrue($status->canTransitionTo(QuoteStatus::ACCEPTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::REJECTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::COUNTERED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::EXPIRED));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::DRAFT));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::SENT));
    }

    /** @test */
    public function countered_can_transition_to_accepted_rejected_or_expired(): void
    {
        $status = QuoteStatus::COUNTERED;

        $this->assertTrue($status->canTransitionTo(QuoteStatus::ACCEPTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::REJECTED));
        $this->assertTrue($status->canTransitionTo(QuoteStatus::EXPIRED));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::DRAFT));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::SENT));
        $this->assertFalse($status->canTransitionTo(QuoteStatus::PENDING_RESPONSE));
    }

    /** @test */
    public function terminal_states_cannot_transition(): void
    {
        $terminalStatuses = [
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::EXPIRED
        ];

        foreach ($terminalStatuses as $status) {
            foreach (QuoteStatus::cases() as $targetStatus) {
                $this->assertFalse(
                    $status->canTransitionTo($targetStatus),
                    "Terminal status {$status->value} should not transition to {$targetStatus->value}"
                );
            }
        }
    }

    /** @test */
    public function it_returns_correct_labels(): void
    {
        $this->assertEquals('Draft', QuoteStatus::DRAFT->label());
        $this->assertEquals('Sent to Vendor', QuoteStatus::SENT->label());
        $this->assertEquals('Awaiting Response', QuoteStatus::PENDING_RESPONSE->label());
        $this->assertEquals('Accepted', QuoteStatus::ACCEPTED->label());
        $this->assertEquals('Rejected', QuoteStatus::REJECTED->label());
        $this->assertEquals('Counter Offer', QuoteStatus::COUNTERED->label());
        $this->assertEquals('Expired', QuoteStatus::EXPIRED->label());
    }

    /** @test */
    public function it_returns_correct_colors(): void
    {
        $this->assertEquals('gray', QuoteStatus::DRAFT->color());
        $this->assertEquals('blue', QuoteStatus::SENT->color());
        $this->assertEquals('yellow', QuoteStatus::PENDING_RESPONSE->color());
        $this->assertEquals('green', QuoteStatus::ACCEPTED->color());
        $this->assertEquals('red', QuoteStatus::REJECTED->color());
        $this->assertEquals('orange', QuoteStatus::COUNTERED->color());
        $this->assertEquals('gray', QuoteStatus::EXPIRED->color());
    }

    /** @test */
    public function it_identifies_terminal_states_correctly(): void
    {
        $this->assertFalse(QuoteStatus::DRAFT->isTerminal());
        $this->assertFalse(QuoteStatus::SENT->isTerminal());
        $this->assertFalse(QuoteStatus::PENDING_RESPONSE->isTerminal());
        $this->assertTrue(QuoteStatus::ACCEPTED->isTerminal());
        $this->assertTrue(QuoteStatus::REJECTED->isTerminal());
        $this->assertFalse(QuoteStatus::COUNTERED->isTerminal());
        $this->assertTrue(QuoteStatus::EXPIRED->isTerminal());
    }

    /** @test */
    public function it_identifies_statuses_requiring_vendor_action(): void
    {
        $this->assertFalse(QuoteStatus::DRAFT->requiresVendorAction());
        $this->assertTrue(QuoteStatus::SENT->requiresVendorAction());
        $this->assertTrue(QuoteStatus::PENDING_RESPONSE->requiresVendorAction());
        $this->assertFalse(QuoteStatus::ACCEPTED->requiresVendorAction());
        $this->assertFalse(QuoteStatus::REJECTED->requiresVendorAction());
        $this->assertTrue(QuoteStatus::COUNTERED->requiresVendorAction());
        $this->assertFalse(QuoteStatus::EXPIRED->requiresVendorAction());
    }

    /** @test */
    public function it_identifies_statuses_requiring_admin_action(): void
    {
        $this->assertFalse(QuoteStatus::DRAFT->requiresAdminAction());
        $this->assertFalse(QuoteStatus::SENT->requiresAdminAction());
        $this->assertFalse(QuoteStatus::PENDING_RESPONSE->requiresAdminAction());
        $this->assertFalse(QuoteStatus::ACCEPTED->requiresAdminAction());
        $this->assertFalse(QuoteStatus::REJECTED->requiresAdminAction());
        $this->assertTrue(QuoteStatus::COUNTERED->requiresAdminAction());
        $this->assertFalse(QuoteStatus::EXPIRED->requiresAdminAction());
    }

    /** @test */
    public function it_returns_possible_transitions(): void
    {
        // Test DRAFT transitions
        $this->assertEquals([QuoteStatus::SENT], QuoteStatus::DRAFT->possibleTransitions());
        
        // Test SENT transitions
        $this->assertEquals(
            [
                QuoteStatus::PENDING_RESPONSE,
                QuoteStatus::ACCEPTED,
                QuoteStatus::REJECTED,
                QuoteStatus::COUNTERED,
                QuoteStatus::EXPIRED
            ],
            QuoteStatus::SENT->possibleTransitions()
        );
        
        // Test PENDING_RESPONSE transitions
        $this->assertEquals(
            [
                QuoteStatus::ACCEPTED,
                QuoteStatus::REJECTED,
                QuoteStatus::COUNTERED,
                QuoteStatus::EXPIRED
            ],
            QuoteStatus::PENDING_RESPONSE->possibleTransitions()
        );
        
        // Test COUNTERED transitions
        $this->assertEquals(
            [
                QuoteStatus::ACCEPTED,
                QuoteStatus::REJECTED,
                QuoteStatus::EXPIRED
            ],
            QuoteStatus::COUNTERED->possibleTransitions()
        );
        
        // Test terminal states have no transitions
        $this->assertEquals([], QuoteStatus::ACCEPTED->possibleTransitions());
        $this->assertEquals([], QuoteStatus::REJECTED->possibleTransitions());
        $this->assertEquals([], QuoteStatus::EXPIRED->possibleTransitions());
    }

    /** @test */
    public function possible_transitions_match_can_transition_to(): void
    {
        foreach (QuoteStatus::cases() as $status) {
            $possibleTransitions = $status->possibleTransitions();
            
            foreach (QuoteStatus::cases() as $targetStatus) {
                $shouldBeAbleToTransition = in_array($targetStatus, $possibleTransitions);
                $canTransition = $status->canTransitionTo($targetStatus);
                
                $this->assertEquals(
                    $shouldBeAbleToTransition,
                    $canTransition,
                    "Mismatch for {$status->value} -> {$targetStatus->value}: " .
                    "possibleTransitions says " . ($shouldBeAbleToTransition ? 'yes' : 'no') .
                    " but canTransitionTo says " . ($canTransition ? 'yes' : 'no')
                );
            }
        }
    }
}
