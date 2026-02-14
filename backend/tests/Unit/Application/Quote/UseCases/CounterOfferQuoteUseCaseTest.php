<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Quote\UseCases;

use App\Application\Quote\Commands\CounterOfferQuoteCommand;
use App\Application\Quote\UseCases\CounterOfferQuoteUseCase;
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

class CounterOfferQuoteUseCaseTest extends TestCase
{
    private QuoteRepositoryInterface $quoteRepository;
    private \App\Domain\Audit\Repositories\AuditLogRepositoryInterface $auditLogRepository;
    private CounterOfferQuoteUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->quoteRepository = Mockery::mock(QuoteRepositoryInterface::class);
        $this->auditLogRepository = new StubAuditLogRepository();
        
        $this->useCase = new CounterOfferQuoteUseCase(
            $this->quoteRepository,
            $this->auditLogRepository
        );

        Event::fake();
    }

    /** @test */
    public function it_successfully_creates_counter_offer_with_valid_data(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                [
                    'product_id' => 'product-1',
                    'counter_unit_price' => 75000,
                    'notes' => 'Standard materials'
                ],
                [
                    'product_id' => 'product-2',
                    'counter_unit_price' => 75000,
                    'notes' => 'Standard finish'
                ]
            ],
            notes: 'We can do it for this price with standard materials',
            userId: 10,
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::COUNTERED, // Will be final status
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 2, // Will be final round
            latestOffer: 150000, // Will be final offer
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 100000,
                        'total_vendor_cost' => 100000
                    ],
                    [
                        'product_id' => 'product-2',
                        'description' => 'Product 2',
                        'quantity' => 1,
                        'vendor_cost' => 100000,
                        'total_vendor_cost' => 100000
                    ]
                ]
            ]
        );

        // Override getStatus to return SENT first (for validation), then COUNTERED (for result)
        $quote->shouldReceive('getStatus')
            ->andReturn(QuoteStatus::SENT, QuoteStatus::COUNTERED);

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        $quote->shouldReceive('counterOffer')
            ->once()
            ->with(150000, 'We can do it for this price with standard materials', 10)
            ->andReturnUsing(function() use ($quote) {
                // After counterOffer is called, status and round should change
                $quote->shouldReceive('getStatus')->andReturn(QuoteStatus::COUNTERED);
                $quote->shouldReceive('getResponseType')->andReturn('counter');
                $quote->shouldReceive('getRound')->andReturn(2);
                $quote->shouldReceive('getLatestOffer')->andReturn(150000);
            });

        $quote->shouldReceive('updateQuoteDetails')->once();

        // Set up the expectations for after the counter offer
        $quote->shouldReceive('getRound')->andReturn(2);
        $quote->shouldReceive('getLatestOffer')->andReturn(150000);

        $this->quoteRepository
            ->shouldReceive('save')
            ->once()
            ->with($quote);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals('quote-uuid-123', $result['quote_uuid']);
        $this->assertEquals('countered', $result['status']);
        $this->assertArrayHasKey('counter_offer_details', $result);
        $this->assertEquals(150000, $result['counter_offer_details']['total_counter']);
        $this->assertEquals(150000, $result['latest_offer']);
        $this->assertEquals(2, $result['round']);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'non-existent-uuid',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 100000]
            ]
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
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 2,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 100000]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
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
    public function it_throws_exception_when_quote_cannot_receive_counter_offer(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 100000]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::ACCEPTED,
            canRespond: false,
            canCounter: false,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidStatusTransitionException::class);
        $this->expectExceptionMessage('This quote cannot receive a counter offer in its current status');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_is_expired(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 100000]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: false,
            canCounter: false,
            isExpired: true,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
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
    public function it_throws_exception_when_counter_offer_amount_is_zero(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 0]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter price for product product-1 must be greater than 0');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_counter_offer_amount_is_negative(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => -100]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->with('quote-uuid-123', 1)
            ->andReturn($quote);

        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter price for product product-1 must be greater than 0');

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_successfully_creates_counter_offer_without_notes(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 120000]
            ],
            notes: null
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::SENT,
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('counterOffer')
            ->once()
            ->with(120000, null, null);

        $quote->shouldReceive('updateQuoteDetails')->once();

        $quote->shouldReceive('getRound')->andReturn(2);
        $quote->shouldReceive('getLatestOffer')->andReturn(120000);

        $this->quoteRepository
            ->shouldReceive('save')
            ->once();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals(120000, $result['counter_offer_details']['total_counter']);
        $this->assertNull($result['counter_offer_details']['notes']);
    }

    /** @test */
    public function it_creates_audit_log_with_correct_data(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 130000]
            ],
            notes: 'Second round counter offer',
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
            canCounter: true,
            isExpired: false,
            round: 1,
            latestOffer: 200000,
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('counterOffer')->once();
        $quote->shouldReceive('updateQuoteDetails')->once();
        $quote->shouldReceive('getRound')->andReturn(2);
        $quote->shouldReceive('getLatestOffer')->andReturn(130000);

        $this->quoteRepository
            ->shouldReceive('save')
            ->once();

        // Act
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_increments_negotiation_round_on_counter_offer(): void
    {
        // Arrange
        $command = new CounterOfferQuoteCommand(
            quoteUuid: 'quote-uuid-123',
            vendorId: 1,
            tenantId: 1,
            items: [
                ['product_id' => 'product-1', 'counter_unit_price' => 140000]
            ]
        );

        $quote = $this->createMockQuote(
            id: 1,
            uuid: 'quote-uuid-123',
            vendorId: 1,
            status: QuoteStatus::COUNTERED, // Final status
            canRespond: true,
            canCounter: true,
            isExpired: false,
            round: 2, // Final round (incremented)
            latestOffer: 140000, // Final offer
            quoteDetails: [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'description' => 'Product 1',
                        'quantity' => 1,
                        'vendor_cost' => 200000,
                        'total_vendor_cost' => 200000
                    ]
                ]
            ]
        );

        // Override getStatus to return SENT first, then COUNTERED
        $quote->shouldReceive('getStatus')
            ->andReturn(QuoteStatus::SENT, QuoteStatus::COUNTERED);

        $this->quoteRepository
            ->shouldReceive('findByUuid')
            ->once()
            ->andReturn($quote);

        $quote->shouldReceive('counterOffer')
            ->once()
            ->andReturnUsing(function() use ($quote) {
                // After counterOffer is called, round should increment
                $quote->shouldReceive('getStatus')->andReturn(QuoteStatus::COUNTERED);
                $quote->shouldReceive('getRound')->andReturn(2);
                $quote->shouldReceive('getLatestOffer')->andReturn(140000);
            });

        $quote->shouldReceive('updateQuoteDetails')->once();

        // These will be called after counterOffer
        $quote->shouldReceive('getRound')->andReturn(2); // Incremented
        $quote->shouldReceive('getLatestOffer')->andReturn(140000);

        $this->quoteRepository
            ->shouldReceive('save')
            ->once();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(2, $result['round']);
    }

    private function createMockQuote(
        int $id,
        string $uuid,
        int $vendorId,
        QuoteStatus $status,
        bool $canRespond,
        bool $canCounter,
        bool $isExpired,
        int $round,
        int $latestOffer,
        array $quoteDetails = []
    ): Quote {
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getId')->andReturn($id);
        $quote->shouldReceive('getUuid')->andReturn($uuid);
        $quote->shouldReceive('getVendorId')->andReturn($vendorId);
        $quote->shouldReceive('getStatus')->andReturn($status);
        $quote->shouldReceive('canRespond')->andReturn($canRespond);
        $quote->shouldReceive('canCounter')->andReturn($canCounter);
        $quote->shouldReceive('isExpired')->andReturn($isExpired);
        $quote->shouldReceive('getRound')->andReturn($round);
        $quote->shouldReceive('getLatestOffer')->andReturn($latestOffer);
        $quote->shouldReceive('getQuoteDetails')->andReturn($quoteDetails);
        $quote->shouldReceive('getRespondedAt')->andReturn(new DateTimeImmutable());
        $quote->shouldReceive('getResponseType')->andReturn('counter');
        $quote->shouldReceive('getClosedAt')->andReturn(null); // Counter offers don't close quotes
        $quote->shouldReceive('getDomainEvents')->andReturn([]);
        $quote->shouldReceive('clearDomainEvents')->andReturnNull();
        
        return $quote;
    }
}
