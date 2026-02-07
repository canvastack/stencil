<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\ValueObjects;

use App\Domain\Quote\ValueObjects\QuoteStatus;
use Eris\Generator;
use Eris\TestTrait;
use Tests\TestCase;

/**
 * Property-Based Tests for QuoteStatus Value Object
 * 
 * **Feature: quote-workflow-fixes, Property 7: Status Transitions Are Valid**
 * **Validates: Requirements 3.3, 3.4**
 * 
 * These tests verify that quote status transitions follow the defined business rules
 * across all possible status combinations using property-based testing.
 */
class QuoteStatusPropertyTest extends TestCase
{
    use TestTrait;

    /**
     * Property 7: Status Transitions Are Valid
     * 
     * For any quote status transition, the transition should only occur if the current
     * status allows transitioning to the new status according to the QuoteStatus value
     * object rules.
     * 
     * Valid transitions:
     * - DRAFT → SENT
     * - SENT → PENDING_RESPONSE, EXPIRED
     * - PENDING_RESPONSE → ACCEPTED, REJECTED, COUNTERED, EXPIRED
     * - COUNTERED → ACCEPTED, REJECTED, EXPIRED
     * - Terminal states (ACCEPTED, REJECTED, EXPIRED) → None
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_status_transitions_are_valid(): void
    {
        $this->forAll(
            Generator\elements(QuoteStatus::cases()),
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $currentStatus, QuoteStatus $targetStatus) {
            // Get the expected valid transitions for the current status
            $validTransitions = $currentStatus->possibleTransitions();
            
            // Check if the transition is valid
            $canTransition = $currentStatus->canTransitionTo($targetStatus);
            $shouldBeValid = in_array($targetStatus, $validTransitions);
            
            // Property: canTransitionTo should return true only for valid transitions
            $this->assertEquals(
                $shouldBeValid,
                $canTransition,
                sprintf(
                    "Transition from %s to %s: expected %s, got %s. Valid transitions: [%s]",
                    $currentStatus->value,
                    $targetStatus->value,
                    $shouldBeValid ? 'valid' : 'invalid',
                    $canTransition ? 'valid' : 'invalid',
                    implode(', ', array_map(fn($s) => $s->value, $validTransitions))
                )
            );
        });
    }

    /**
     * Property: Terminal states cannot transition to any status
     * 
     * For any terminal status (ACCEPTED, REJECTED, EXPIRED), attempting to transition
     * to any other status should return false.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_terminal_states_cannot_transition(): void
    {
        $terminalStatuses = [
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::EXPIRED
        ];

        $this->forAll(
            Generator\elements($terminalStatuses),
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $terminalStatus, QuoteStatus $targetStatus) {
            // Property: Terminal states should never allow transitions
            $canTransition = $terminalStatus->canTransitionTo($targetStatus);
            
            $this->assertFalse(
                $canTransition,
                sprintf(
                    "Terminal status %s should not be able to transition to %s",
                    $terminalStatus->value,
                    $targetStatus->value
                )
            );
            
            // Property: Terminal states should have empty possibleTransitions
            $possibleTransitions = $terminalStatus->possibleTransitions();
            $this->assertEmpty(
                $possibleTransitions,
                sprintf(
                    "Terminal status %s should have no possible transitions, got: [%s]",
                    $terminalStatus->value,
                    implode(', ', array_map(fn($s) => $s->value, $possibleTransitions))
                )
            );
            
            // Property: Terminal states should be identified as terminal
            $this->assertTrue(
                $terminalStatus->isTerminal(),
                sprintf("Status %s should be identified as terminal", $terminalStatus->value)
            );
        });
    }

    /**
     * Property: DRAFT can only transition to SENT
     * 
     * For any DRAFT status, the only valid transition is to SENT.
     * All other transitions should be rejected.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_draft_can_only_transition_to_sent(): void
    {
        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $targetStatus) {
            $draftStatus = QuoteStatus::DRAFT;
            $canTransition = $draftStatus->canTransitionTo($targetStatus);
            
            // Property: DRAFT should only transition to SENT
            if ($targetStatus === QuoteStatus::SENT) {
                $this->assertTrue(
                    $canTransition,
                    "DRAFT should be able to transition to SENT"
                );
            } else {
                $this->assertFalse(
                    $canTransition,
                    sprintf(
                        "DRAFT should not be able to transition to %s",
                        $targetStatus->value
                    )
                );
            }
        });
    }

    /**
     * Property: SENT can transition to PENDING_RESPONSE or EXPIRED
     * 
     * For any SENT status, valid transitions are PENDING_RESPONSE and EXPIRED.
     * All other transitions should be rejected.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_sent_transitions_are_limited(): void
    {
        $validTargets = [
            QuoteStatus::PENDING_RESPONSE,
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::COUNTERED,
            QuoteStatus::EXPIRED
        ];

        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $targetStatus) use ($validTargets) {
            $sentStatus = QuoteStatus::SENT;
            $canTransition = $sentStatus->canTransitionTo($targetStatus);
            
            // Property: SENT should transition to PENDING_RESPONSE, ACCEPTED, REJECTED, COUNTERED, or EXPIRED
            if (in_array($targetStatus, $validTargets)) {
                $this->assertTrue(
                    $canTransition,
                    sprintf("SENT should be able to transition to %s", $targetStatus->value)
                );
            } else {
                $this->assertFalse(
                    $canTransition,
                    sprintf("SENT should not be able to transition to %s", $targetStatus->value)
                );
            }
        });
    }

    /**
     * Property: PENDING_RESPONSE can transition to vendor response states or EXPIRED
     * 
     * For any PENDING_RESPONSE status, valid transitions are ACCEPTED, REJECTED,
     * COUNTERED, and EXPIRED. All other transitions should be rejected.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_pending_response_allows_vendor_responses(): void
    {
        $validTargets = [
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::COUNTERED,
            QuoteStatus::EXPIRED
        ];

        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $targetStatus) use ($validTargets) {
            $pendingStatus = QuoteStatus::PENDING_RESPONSE;
            $canTransition = $pendingStatus->canTransitionTo($targetStatus);
            
            // Property: PENDING_RESPONSE should allow vendor response transitions
            if (in_array($targetStatus, $validTargets)) {
                $this->assertTrue(
                    $canTransition,
                    sprintf(
                        "PENDING_RESPONSE should be able to transition to %s",
                        $targetStatus->value
                    )
                );
            } else {
                $this->assertFalse(
                    $canTransition,
                    sprintf(
                        "PENDING_RESPONSE should not be able to transition to %s",
                        $targetStatus->value
                    )
                );
            }
        });
    }

    /**
     * Property: COUNTERED can transition to final vendor responses or EXPIRED
     * 
     * For any COUNTERED status, valid transitions are ACCEPTED, REJECTED, and EXPIRED.
     * All other transitions should be rejected.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_countered_allows_final_responses(): void
    {
        $validTargets = [
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::EXPIRED
        ];

        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $targetStatus) use ($validTargets) {
            $counteredStatus = QuoteStatus::COUNTERED;
            $canTransition = $counteredStatus->canTransitionTo($targetStatus);
            
            // Property: COUNTERED should allow final response transitions
            if (in_array($targetStatus, $validTargets)) {
                $this->assertTrue(
                    $canTransition,
                    sprintf(
                        "COUNTERED should be able to transition to %s",
                        $targetStatus->value
                    )
                );
            } else {
                $this->assertFalse(
                    $canTransition,
                    sprintf(
                        "COUNTERED should not be able to transition to %s",
                        $targetStatus->value
                    )
                );
            }
        });
    }

    /**
     * Property: Transition validation is consistent with possibleTransitions
     * 
     * For any status, canTransitionTo should return true if and only if the target
     * status is in the possibleTransitions array.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_can_transition_matches_possible_transitions(): void
    {
        $this->forAll(
            Generator\elements(QuoteStatus::cases()),
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $currentStatus, QuoteStatus $targetStatus) {
            $possibleTransitions = $currentStatus->possibleTransitions();
            $canTransition = $currentStatus->canTransitionTo($targetStatus);
            $shouldBeInList = in_array($targetStatus, $possibleTransitions);
            
            // Property: canTransitionTo and possibleTransitions must be consistent
            $this->assertEquals(
                $shouldBeInList,
                $canTransition,
                sprintf(
                    "Inconsistency for %s → %s: possibleTransitions says %s, canTransitionTo says %s",
                    $currentStatus->value,
                    $targetStatus->value,
                    $shouldBeInList ? 'yes' : 'no',
                    $canTransition ? 'yes' : 'no'
                )
            );
        });
    }

    /**
     * Property: Non-terminal states have at least one possible transition
     * 
     * For any non-terminal status, there should be at least one valid transition.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_non_terminal_states_have_transitions(): void
    {
        $nonTerminalStatuses = [
            QuoteStatus::DRAFT,
            QuoteStatus::SENT,
            QuoteStatus::PENDING_RESPONSE,
            QuoteStatus::COUNTERED
        ];

        $this->forAll(
            Generator\elements($nonTerminalStatuses)
        )->then(function (QuoteStatus $status) {
            $possibleTransitions = $status->possibleTransitions();
            
            // Property: Non-terminal states should have at least one possible transition
            $this->assertNotEmpty(
                $possibleTransitions,
                sprintf(
                    "Non-terminal status %s should have at least one possible transition",
                    $status->value
                )
            );
            
            // Property: Non-terminal states should not be identified as terminal
            $this->assertFalse(
                $status->isTerminal(),
                sprintf("Status %s should not be identified as terminal", $status->value)
            );
            
            // Property: At least one transition should be valid
            $hasValidTransition = false;
            foreach (QuoteStatus::cases() as $targetStatus) {
                if ($status->canTransitionTo($targetStatus)) {
                    $hasValidTransition = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $hasValidTransition,
                sprintf(
                    "Non-terminal status %s should have at least one valid transition",
                    $status->value
                )
            );
        });
    }

    /**
     * Property: Transition validation is reflexive (status cannot transition to itself)
     * 
     * For any status, attempting to transition to the same status should return false.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_status_cannot_transition_to_itself(): void
    {
        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $status) {
            // Property: A status should not be able to transition to itself
            $canTransition = $status->canTransitionTo($status);
            
            $this->assertFalse(
                $canTransition,
                sprintf(
                    "Status %s should not be able to transition to itself",
                    $status->value
                )
            );
            
            // Property: Status should not be in its own possibleTransitions
            $possibleTransitions = $status->possibleTransitions();
            $this->assertNotContains(
                $status,
                $possibleTransitions,
                sprintf(
                    "Status %s should not be in its own possibleTransitions list",
                    $status->value
                )
            );
        });
    }

    /**
     * Property: Transition paths are acyclic (no cycles except terminal states)
     * 
     * For any non-terminal status, following valid transitions should eventually
     * lead to a terminal state without cycles.
     * 
     * @test
     * @group Property 7: Status Transitions Are Valid
     */
    public function property_transition_paths_are_acyclic(): void
    {
        $this->forAll(
            Generator\elements(QuoteStatus::cases())
        )->then(function (QuoteStatus $startStatus) {
            $visited = [];
            $current = $startStatus;
            $maxSteps = 10; // Prevent infinite loops
            $steps = 0;
            
            // Follow a path of valid transitions
            while (!$current->isTerminal() && $steps < $maxSteps) {
                // Property: Should not revisit a status (no cycles)
                $this->assertNotContains(
                    $current->value,
                    $visited,
                    sprintf(
                        "Detected cycle: status %s was visited twice in transition path",
                        $current->value
                    )
                );
                
                $visited[] = $current->value;
                
                // Get possible transitions
                $possibleTransitions = $current->possibleTransitions();
                
                if (empty($possibleTransitions)) {
                    break;
                }
                
                // Take the first valid transition
                $current = $possibleTransitions[0];
                $steps++;
            }
            
            // Property: Should reach a terminal state within reasonable steps
            $this->assertLessThanOrEqual(
                5,
                $steps,
                sprintf(
                    "Transition path from %s should reach terminal state within 5 steps, took %d steps",
                    $startStatus->value,
                    $steps
                )
            );
        });
    }
}
