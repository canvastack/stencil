<?php

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\Timeline;
use DateTimeImmutable;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class TimelineTest extends TestCase
{
    /** @test */
    public function it_can_create_timeline_with_basic_dates()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        
        $timeline = new Timeline($startDate, $endDate);
        
        $this->assertEquals($startDate, $timeline->getStartDate());
        $this->assertEquals($endDate, $timeline->getEndDate());
        $this->assertEquals(9, $timeline->getDurationInDays());
        $this->assertEmpty($timeline->getMilestones());
        $this->assertNull($timeline->getActualCompletionDate());
    }

    /** @test */
    public function it_can_create_timeline_for_order_production()
    {
        $orderDate = new DateTimeImmutable('2024-01-01 10:00:00');
        
        $timeline = Timeline::forOrderProduction($orderDate, 7);
        
        $this->assertEquals($orderDate, $timeline->getStartDate());
        $this->assertEquals(7, $timeline->getDurationInDays());
        $this->assertCount(5, $timeline->getMilestones()); // Default PT CEX milestones
        
        $milestones = $timeline->getMilestones();
        $this->assertEquals('Design Review', $milestones[0]['name']);
        $this->assertEquals('Packaging & Shipping', $milestones[4]['name']);
    }

    /** @test */
    public function it_can_create_timeline_for_vendor_negotiation()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        
        $timeline = Timeline::forVendorNegotiation($startDate, 5);
        
        $this->assertEquals($startDate, $timeline->getStartDate());
        $this->assertEquals(5, $timeline->getDurationInDays());
        $this->assertCount(3, $timeline->getMilestones());
        
        $milestones = $timeline->getMilestones();
        $this->assertEquals('Quote Request Sent', $milestones[0]['name']);
        $this->assertEquals('completed', $milestones[0]['status']);
        $this->assertEquals('Negotiation Deadline', $milestones[2]['name']);
    }

    /** @test */
    public function it_can_complete_milestone()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $milestones = [
            [
                'name' => 'Design Review',
                'target_date' => '2024-01-02 10:00:00',
                'status' => 'pending',
                'description' => 'Review design'
            ]
        ];
        
        $timeline = new Timeline($startDate, $endDate, $milestones);
        $completedTimeline = $timeline->completeMilestone('Design Review');
        
        $updatedMilestones = $completedTimeline->getMilestones();
        $this->assertEquals('completed', $updatedMilestones[0]['status']);
        $this->assertArrayHasKey('completed_at', $updatedMilestones[0]);
    }

    /** @test */
    public function it_can_mark_timeline_as_completed()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $completionDate = new DateTimeImmutable('2024-01-08 15:00:00');
        
        $timeline = new Timeline($startDate, $endDate);
        $completedTimeline = $timeline->markCompleted($completionDate);
        
        $this->assertEquals($completionDate, $completedTimeline->getActualCompletionDate());
        $this->assertTrue($completedTimeline->isCompleted());
    }

    /** @test */
    public function it_can_calculate_progress_percentage()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $milestones = [
            [
                'name' => 'Milestone 1',
                'target_date' => '2024-01-02 10:00:00',
                'status' => 'completed',
                'description' => 'First milestone'
            ],
            [
                'name' => 'Milestone 2',
                'target_date' => '2024-01-05 10:00:00',
                'status' => 'completed',
                'description' => 'Second milestone'
            ],
            [
                'name' => 'Milestone 3',
                'target_date' => '2024-01-08 10:00:00',
                'status' => 'pending',
                'description' => 'Third milestone'
            ]
        ];
        
        $timeline = new Timeline($startDate, $endDate, $milestones);
        
        $this->assertEquals(66.67, round($timeline->getProgressPercentage(), 2));
    }

    /** @test */
    public function it_can_get_next_pending_milestone()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $milestones = [
            [
                'name' => 'Milestone 1',
                'target_date' => '2024-01-02 10:00:00',
                'status' => 'completed',
                'description' => 'First milestone'
            ],
            [
                'name' => 'Milestone 2',
                'target_date' => '2024-01-05 10:00:00',
                'status' => 'pending',
                'description' => 'Second milestone'
            ]
        ];
        
        $timeline = new Timeline($startDate, $endDate, $milestones);
        $nextMilestone = $timeline->getNextMilestone();
        
        $this->assertEquals('Milestone 2', $nextMilestone['name']);
        $this->assertEquals('pending', $nextMilestone['status']);
    }

    /** @test */
    public function it_returns_null_when_no_pending_milestones()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $milestones = [
            [
                'name' => 'Milestone 1',
                'target_date' => '2024-01-02 10:00:00',
                'status' => 'completed',
                'description' => 'First milestone'
            ]
        ];
        
        $timeline = new Timeline($startDate, $endDate, $milestones);
        
        $this->assertNull($timeline->getNextMilestone());
    }

    /** @test */
    public function it_can_detect_overdue_timeline()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-05 18:00:00'); // Past date
        
        $timeline = new Timeline($startDate, $endDate);
        
        $this->assertTrue($timeline->isOverdue());
    }

    /** @test */
    public function it_can_calculate_remaining_days()
    {
        $now = new DateTimeImmutable();
        $startDate = $now->modify('-1 day');
        $endDate = $now->modify('+5 days'); // 5 days from now
        
        $timeline = new Timeline($startDate, $endDate);
        $remainingDays = $timeline->getRemainingDays();
        
        // Allow for some flexibility due to time precision
        $this->assertGreaterThanOrEqual(4, $remainingDays);
        $this->assertLessThanOrEqual(5, $remainingDays);
    }

    /** @test */
    public function it_returns_zero_remaining_days_when_overdue()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-05 18:00:00'); // Past date
        
        $timeline = new Timeline($startDate, $endDate);
        
        $this->assertEquals(0, $timeline->getRemainingDays());
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $milestones = [
            [
                'name' => 'Test Milestone',
                'target_date' => '2024-01-05 10:00:00',
                'status' => 'pending',
                'description' => 'Test description'
            ]
        ];
        
        $timeline = new Timeline($startDate, $endDate, $milestones);
        $array = $timeline->toArray();
        
        $this->assertArrayHasKey('start_date', $array);
        $this->assertArrayHasKey('end_date', $array);
        $this->assertArrayHasKey('milestones', $array);
        $this->assertArrayHasKey('duration_days', $array);
        $this->assertArrayHasKey('progress_percentage', $array);
        $this->assertArrayHasKey('is_overdue', $array);
        $this->assertArrayHasKey('is_completed', $array);
        $this->assertArrayHasKey('is_on_track', $array);
        
        $this->assertEquals('2024-01-01 10:00:00', $array['start_date']);
        $this->assertEquals(9, $array['duration_days']);
    }

    /** @test */
    public function it_can_create_from_array()
    {
        $data = [
            'start_date' => '2024-01-01 10:00:00',
            'end_date' => '2024-01-10 18:00:00',
            'milestones' => [
                [
                    'name' => 'Test Milestone',
                    'target_date' => '2024-01-05 10:00:00',
                    'status' => 'pending',
                    'description' => 'Test description'
                ]
            ],
            'actual_completion_date' => '2024-01-08 15:00:00'
        ];
        
        $timeline = Timeline::fromArray($data);
        
        $this->assertEquals('2024-01-01 10:00:00', $timeline->getStartDate()->format('Y-m-d H:i:s'));
        $this->assertEquals('2024-01-10 18:00:00', $timeline->getEndDate()->format('Y-m-d H:i:s'));
        $this->assertCount(1, $timeline->getMilestones());
        $this->assertEquals('2024-01-08 15:00:00', $timeline->getActualCompletionDate()->format('Y-m-d H:i:s'));
    }

    /** @test */
    public function it_throws_exception_for_invalid_date_range()
    {
        $startDate = new DateTimeImmutable('2024-01-10 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-01 18:00:00'); // End before start
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Start date must be before end date');
        
        new Timeline($startDate, $endDate);
    }

    /** @test */
    public function it_throws_exception_for_invalid_milestone_structure()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $invalidMilestones = [
            [
                'name' => 'Test Milestone',
                // Missing target_date and status
            ]
        ];
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Milestone must have name, target_date, and status');
        
        new Timeline($startDate, $endDate, $invalidMilestones);
    }

    /** @test */
    public function it_throws_exception_for_invalid_milestone_status()
    {
        $startDate = new DateTimeImmutable('2024-01-01 10:00:00');
        $endDate = new DateTimeImmutable('2024-01-10 18:00:00');
        $invalidMilestones = [
            [
                'name' => 'Test Milestone',
                'target_date' => '2024-01-05 10:00:00',
                'status' => 'invalid_status',
                'description' => 'Test'
            ]
        ];
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Milestone status must be pending, completed, or skipped');
        
        new Timeline($startDate, $endDate, $invalidMilestones);
    }
}