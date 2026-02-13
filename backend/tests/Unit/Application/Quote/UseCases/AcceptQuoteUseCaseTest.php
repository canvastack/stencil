<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Quote\UseCases;

use Tests\TestCase;
use App\Application\Quote\UseCases\AcceptQuoteUseCase;
use App\Application\Quote\Commands\AcceptQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\Event;
use Mockery;
use InvalidArgumentException;
use DateTimeImmutable;

/**
 * AcceptQuoteUseCaseTest
 * 
 * Comprehensive unit tests for AcceptQuoteUseCase with mocked dependencies.
 * Tests all business rules, validations, and edge cases.
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.11, 6.12, 6.13, 6.14, 6.15, 18.3, 16.3, 23.2
 */
class AcceptQuoteUseCaseTest extends TestCase
{
    private QuoteRepositoryInterface $quoteRepository;
    private AuditLogRepositoryInterface $auditLogRepository;
    private AcceptQuoteUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->quoteRepository = Mockery::mock(QuoteRepositoryInterface::class);
        $this->auditLogRepository = Mockery::mock(AuditLogRepositoryInterface::class);
        
        $this->useCase = new AcceptQuoteUseCase(
            $this->quoteRepository,
            $this->auditLogRepository
        );

        Event::fake();
    }

    /** @test */
    public function it_successfully_accepts_quote_with_valid_data(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14,
            notes: 'We can deliver in 2 weeks',
            userId: 10,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        $quote->shouldReceive('accept')
            ->once()
            ->with(14, 'We can deliver in 2 weeks', 10);

        $this->quoteRepository
            ->shouldReceive('save')
            ->once()
            ->with($quote);

        $this->auditLogRepository
            ->shouldReceive('create')
            ->once()
            ->with(Mockery::on(function ($data) {
                return $data['action_type'] === 'quote_accepted'
                    && $data['tenant_id'] === 1
                    && $data['user_id'] === 10
                    && $data['metadata']['estimated_delivery_days'] === 14;
            }));

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals('quote-uuid-123', $result['quote_uuid']);
        $this->assertEquals('accepted', $result['status']);
        $this->assertEquals(14, $result['estimated_delivery_days']);
        $this->assertEquals('We can deliver in 2 weeks', $result['notes']);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'non-existent-uuid',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('non-existent-uuid', 1)
            ->andReturn(null);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_does_not_own_quote(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 2, // Different vendor
            status: QuoteStatus::SENT
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('You do not have permission to respond to this quote');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_is_expired(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: false,
            isExpired: true
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        // Assert
        $this->expectException(QuoteExpiredException::class);
        $this->expectExceptionMessage('This quote has expired');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_status_does_not_allow_acceptance(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::ACCEPTED, // Already accepted
            canRespond: false,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidStatusTransitionException::class);
        $this->expectExceptionMessage('This quote cannot be accepted in its current status');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_for_zero_estimated_delivery_days(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 0 // Invalid
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Estimated delivery days must be a positive number');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_for_negative_estimated_delivery_days(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: -5 // Invalid
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Estimated delivery days must be a positive number');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_audit_log_with_correct_data(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14,
            notes: 'Test notes',
            userId: 10,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('accept')->once();
        $this->quoteRepository->shouldReceive('save')->once();

        $this->auditLogRepository
            ->shouldReceive('create')
            ->once()
            ->with(Mockery::on(function ($data) {
                return $data['tenant_id'] === 1
                    && $data['user_id'] === 10
                    && $data['user_type'] === 'vendor'
                    && $data['action_type'] === 'quote_accepted'
                    && $data['resource_type'] === 'quote'
                    && $data['resource_id'] === 1
                    && isset($data['old_values'])
                    && isset($data['new_values'])
                    && $data['metadata']['vendor_id'] === 1
                    && $data['metadata']['estimated_delivery_days'] === 14
                    && $data['ip_address'] === '192.168.1.1'
                    && $data['user_agent'] === 'Mozilla/5.0';
            }));

        // Act
        $this->useCase->execute($command);

        // Assert - expectations verified by Mockery
    }

    /** @test */
    public function it_dispatches_domain_events_after_acceptance(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('accept')->once();
        $this->quoteRepository->shouldReceive('save')->once();
        $this->auditLogRepository->shouldReceive('create')->once();

        // Mock domain events
        $mockEvent = Mockery::mock('DomainEvent');
        $quote->shouldReceive('getDomainEvents')
            ->once()
            ->andReturn([$mockEvent]);
        $quote->shouldReceive('clearDomainEvents')->once();

        // Act
        $this->useCase->execute($command);

        // Assert
        Event::assertDispatched(function ($event) use ($mockEvent) {
            return $event === $mockEvent;
        });
    }

    /** @test */
    public function it_accepts_quote_without_optional_notes(): void
    {
        // Arrange
        $command = new AcceptQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            estimatedDeliveryDays: 14,
            notes: null // No notes
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('accept')
            ->once()
            ->with(14, null, null);

        $this->quoteRepository->shouldReceive('save')->once();
        $this->auditLogRepository->shouldReceive('create')->once();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertNull($result['notes']);
    }

    /**
     * Helper method to create mock quote
     */
    private function createMockQuote(
        int $id,
        string $uuid,
        int $vendorId,
        QuoteStatus $status,
        bool $canRespond = true,
        bool $isExpired = false
    ): Mockery\MockInterface {
        $quote = Mockery::mock(Quote::class);
        
        $quote->shouldReceive('getId')->andReturn($id);
        $quote->shouldReceive('getUuid')->andReturn($uuid);
        $quote->shouldReceive('getVendorId')->andReturn($vendorId);
        $quote->shouldReceive('getStatus')->andReturn($status);
        $quote->shouldReceive('canRespond')->andReturn($canRespond);
        $quote->shouldReceive('isExpired')->andReturn($isExpired);
        $quote->shouldReceive('getRespondedAt')->andReturn(new DateTimeImmutable());
        $quote->shouldReceive('getResponseType')->andReturn('accept');
        $quote->shouldReceive('getClosedAt')->andReturn(new DateTimeImmutable());
        $quote->shouldReceive('getDomainEvents')->andReturn([]);
        $quote->shouldReceive('clearDomainEvents')->andReturn(null);

        return $quote;
    }
}
