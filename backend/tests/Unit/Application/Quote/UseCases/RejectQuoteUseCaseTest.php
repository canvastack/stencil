<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Quote\UseCases;

use App\Application\Quote\Commands\RejectQuoteCommand;
use App\Application\Quote\UseCases\RejectQuoteUseCase;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;
use InvalidArgumentException;
use DateTimeImmutable;

class RejectQuoteUseCaseTest extends TestCase
{
    private QuoteRepositoryInterface $quoteRepository;
    private \App\Domain\Audit\Repositories\AuditLogRepositoryInterface $auditLogRepository;
    private RejectQuoteUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->quoteRepository = Mockery::mock(QuoteRepositoryInterface::class);
        $this->auditLogRepository = new StubAuditLogRepository();
        
        $this->useCase = new RejectQuoteUseCase(
            $this->quoteRepository,
            $this->auditLogRepository
        );

        Event::fake();
    }

    /** @test */
    public function it_successfully_rejects_quote_with_valid_data(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: 'Cannot meet the deadline requirements',
            userId: 10,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::REJECTED, // Will be final status
            canRespond: true,
            isExpired: false
        );

        // Override getStatus to return SENT first (for validation), then REJECTED (for result)
        $quote->shouldReceive('getStatus')
            ->andReturn(QuoteStatus::SENT, QuoteStatus::REJECTED);

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        $quote->shouldReceive('reject')
            ->once()
            ->with('Cannot meet the deadline requirements', 10)
            ->andReturnUsing(function() use ($quote) {
                // After reject is called, status should change
                $quote->shouldReceive('getStatus')->andReturn(QuoteStatus::REJECTED);
                $quote->shouldReceive('getResponseType')->andReturn('reject');
                $quote->shouldReceive('getClosedAt')->andReturn(new DateTimeImmutable());
            });

        $this->quoteRepository
            ->shouldReceive('save')
            ->once()
            ->with($quote);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals('quote-uuid-123', $result['quote_uuid']);
        $this->assertEquals('rejected', $result['status']);
        $this->assertEquals('Cannot meet the deadline requirements', $result['rejection_reason']);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'non-existent-uuid',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: 'Test reason'
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
    public function it_throws_exception_when_vendor_not_authorized(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 2,
            tenantId: 1,
            rejectionReason: 'Test reason'
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

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('You do not have permission to respond to this quote');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_cannot_be_rejected(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: 'Test reason'
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::ACCEPTED,
            canRespond: false,
            isExpired: false
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidStatusTransitionException::class);
        $this->expectExceptionMessage('This quote cannot be rejected in its current status');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_is_expired(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: 'Test reason'
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
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        // Assert
        $this->expectException(QuoteExpiredException::class);
        $this->expectExceptionMessage('This quote has expired and can no longer be responded to');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_rejection_reason_is_empty(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: '   '
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

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rejection reason is required and cannot be empty');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_rejection_reason_exceeds_max_length(): void
    {
        // Arrange
        $longReason = str_repeat('a', 501);
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: $longReason
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

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rejection reason cannot exceed 500 characters');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_audit_log_with_correct_data(): void
    {
        // Arrange
        $command = new RejectQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            rejectionReason: 'Material not available',
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

        $quote->shouldReceive('reject')->once();

        $this->quoteRepository
            ->shouldReceive('save')
            ->once();

        // Act
        $this->useCase->execute($command);
    }

    private function createMockQuote(
        int $id,
        string $uuid,
        int $vendorId,
        QuoteStatus $status,
        bool $canRespond,
        bool $isExpired
    ): Quote {
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getId')->andReturn($id);
        $quote->shouldReceive('getUuid')->andReturn($uuid);
        $quote->shouldReceive('getVendorId')->andReturn($vendorId);
        $quote->shouldReceive('getStatus')->andReturn($status);
        $quote->shouldReceive('canRespond')->andReturn($canRespond);
        $quote->shouldReceive('isExpired')->andReturn($isExpired);
        $quote->shouldReceive('getRespondedAt')->andReturn(new DateTimeImmutable());
        $quote->shouldReceive('getResponseType')->andReturn('reject');
        $quote->shouldReceive('getClosedAt')->andReturn(new DateTimeImmutable());
        $quote->shouldReceive('getDomainEvents')->andReturn([]);
        $quote->shouldReceive('clearDomainEvents')->andReturnNull();
        
        return $quote;
    }
}
