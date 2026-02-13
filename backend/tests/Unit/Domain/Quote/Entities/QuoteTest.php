<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use PHPUnit\Framework\TestCase;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use InvalidArgumentException;
use DateTimeImmutable;

/**
 * Quote Entity Tests
 * 
 * Tests the Quote domain entity business logic.
 * Covers: vendor response actions, state transitions, business rules.
 * 
 * Requirements: 6.1-6.14, 10.1, 10.2, 23.1
 */
class QuoteTest extends TestCase
{
    /** @test */
    public function it_accepts_quote_with_positive_delivery_days(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $deliveryDays = 14;
        
        // Act
        $quote->accept($deliveryDays, 'We can deliver in 2 weeks', 1);
        
        // Assert
        $this->assertEquals(QuoteStatus::ACCEPTED, $quote->getStatus());
        $this->assertEquals(14, $quote->getQuoteDetails()['estimated_delivery_days']);
        $this->assertNotNull($quote->getRespondedAt());
        $this->assertEquals('accept', $quote->getResponseType());
    }

    /** @test */
    public function it_throws_exception_for_zero_delivery_days(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Estimated delivery days must be positive');
        
        // Act
        $quote->accept(0);
    }

    /** @test */
    public function it_throws_exception_for_negative_delivery_days(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Estimated delivery days must be positive');
        
        // Act
        $quote->accept(-5);
    }

    /** @test */
    public function it_stores_delivery_estimate_in_quote_details(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act
        $quote->accept(21, 'Delivery in 3 weeks');
        
        // Assert
        $details = $quote->getQuoteDetails();
        $this->assertEquals(21, $details['estimated_delivery_days']);
        $this->assertEquals('Delivery in 3 weeks', $details['acceptance_notes']);
    }

    /** @test */
    public function it_records_responded_at_timestamp_on_accept(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $beforeResponse = new DateTimeImmutable();
        
        // Act
        $quote->accept(14);
        $afterResponse = new DateTimeImmutable();
        
        // Assert
        $this->assertNotNull($quote->getRespondedAt());
        $this->assertGreaterThanOrEqual($beforeResponse, $quote->getRespondedAt());
        $this->assertLessThanOrEqual($afterResponse, $quote->getRespondedAt());
    }

    /** @test */
    public function it_rejects_quote_with_reason(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $reason = 'Cannot meet the specifications';
        
        // Act
        $quote->reject($reason, 1);
        
        // Assert
        $this->assertEquals(QuoteStatus::REJECTED, $quote->getStatus());
        $this->assertEquals($reason, $quote->getQuoteDetails()['rejection_reason']);
        $this->assertNotNull($quote->getRespondedAt());
        $this->assertEquals('reject', $quote->getResponseType());
    }

    /** @test */
    public function it_throws_exception_for_empty_rejection_reason(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rejection reason is required');
        
        // Act
        $quote->reject('');
    }

    /** @test */
    public function it_throws_exception_for_whitespace_only_rejection_reason(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rejection reason is required');
        
        // Act
        $quote->reject('   ');
    }

    /** @test */
    public function it_stores_rejection_reason_in_quote_details(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $reason = 'Material not available';
        
        // Act
        $quote->reject($reason);
        
        // Assert
        $details = $quote->getQuoteDetails();
        $this->assertEquals($reason, $details['rejection_reason']);
    }

    /** @test */
    public function it_submits_counter_offer_with_positive_amount(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $counterAmount = 500000; // 5000 IDR in cents
        
        // Act
        $quote->counterOffer($counterAmount, 'Our best price', 1);
        
        // Assert
        $this->assertEquals(QuoteStatus::COUNTERED, $quote->getStatus());
        $this->assertEquals($counterAmount, $quote->getLatestOffer());
        $this->assertEquals($counterAmount, $quote->getQuoteDetails()['counter_offer_amount']);
        $this->assertNotNull($quote->getRespondedAt());
        $this->assertEquals('counter', $quote->getResponseType());
    }

    /** @test */
    public function it_throws_exception_for_zero_counter_offer_amount(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter offer amount must be positive');
        
        // Act
        $quote->counterOffer(0);
    }

    /** @test */
    public function it_throws_exception_for_negative_counter_offer_amount(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter offer amount must be positive');
        
        // Act
        $quote->counterOffer(-1000);
    }

    /** @test */
    public function it_increments_round_number_on_counter_offer(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $initialRound = $quote->getRound();
        
        // Act
        $quote->counterOffer(500000);
        
        // Assert
        $this->assertEquals($initialRound + 1, $quote->getRound());
    }

    /** @test */
    public function it_updates_latest_offer_on_counter(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $initialOffer = $quote->getInitialOffer();
        $counterAmount = 600000;
        
        // Act
        $quote->counterOffer($counterAmount);
        
        // Assert
        $this->assertEquals($initialOffer, $quote->getInitialOffer()); // Initial unchanged
        $this->assertEquals($counterAmount, $quote->getLatestOffer()); // Latest updated
    }

    /** @test */
    public function it_sends_quote_to_vendor(): void
    {
        // Arrange
        $quote = $this->createDraftQuote();
        
        // Act
        $quote->send(1);
        
        // Assert
        $this->assertEquals(QuoteStatus::SENT, $quote->getStatus());
        $this->assertNotNull($quote->getSentAt());
    }

    /** @test */
    public function it_records_sent_at_timestamp(): void
    {
        // Arrange
        $quote = $this->createDraftQuote();
        $beforeSend = new DateTimeImmutable();
        
        // Act
        $quote->send();
        $afterSend = new DateTimeImmutable();
        
        // Assert
        $this->assertNotNull($quote->getSentAt());
        $this->assertGreaterThanOrEqual($beforeSend, $quote->getSentAt());
        $this->assertLessThanOrEqual($afterSend, $quote->getSentAt());
    }

    /** @test */
    public function it_expires_quote(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act
        $quote->expire(1);
        
        // Assert
        $this->assertEquals(QuoteStatus::EXPIRED, $quote->getStatus());
        $this->assertNotNull($quote->getClosedAt());
    }

    /** @test */
    public function it_sets_closed_at_timestamp_on_expire(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $beforeExpire = new DateTimeImmutable();
        
        // Act
        $quote->expire();
        $afterExpire = new DateTimeImmutable();
        
        // Assert
        $this->assertNotNull($quote->getClosedAt());
        $this->assertGreaterThanOrEqual($beforeExpire, $quote->getClosedAt());
        $this->assertLessThanOrEqual($afterExpire, $quote->getClosedAt());
    }

    /** @test */
    public function it_can_respond_when_status_is_sent(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act & Assert
        $this->assertTrue($quote->canRespond());
    }

    /** @test */
    public function it_cannot_respond_when_expired(): void
    {
        // Arrange
        $quote = $this->createExpiredQuote();
        
        // Act & Assert
        $this->assertFalse($quote->canRespond());
    }

    /** @test */
    public function it_cannot_respond_when_already_responded(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $quote->accept(14);
        
        // Act & Assert
        $this->assertFalse($quote->canRespond());
    }

    /** @test */
    public function it_throws_exception_when_responding_to_expired_quote(): void
    {
        // Arrange
        $quote = $this->createExpiredQuote();
        
        // Assert
        $this->expectException(QuoteExpiredException::class);
        $this->expectExceptionMessage('Quote has expired and cannot be modified');
        
        // Act
        $quote->accept(14);
    }

    /** @test */
    public function it_throws_exception_when_responding_to_already_responded_quote(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        $quote->accept(14);
        
        // Assert
        $this->expectException(InvalidStatusTransitionException::class);
        
        // Act
        $quote->reject('Changed my mind');
    }

    /** @test */
    public function it_sets_closed_at_on_accept(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act
        $quote->accept(14);
        
        // Assert
        $this->assertNotNull($quote->getClosedAt());
    }

    /** @test */
    public function it_sets_closed_at_on_reject(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act
        $quote->reject('Cannot fulfill');
        
        // Assert
        $this->assertNotNull($quote->getClosedAt());
    }

    /** @test */
    public function it_does_not_set_closed_at_on_counter_offer(): void
    {
        // Arrange
        $quote = $this->createSentQuote();
        
        // Act
        $quote->counterOffer(500000);
        
        // Assert
        $this->assertNull($quote->getClosedAt());
    }

    /**
     * Helper method to create a draft quote
     */
    private function createDraftQuote(): Quote
    {
        return Quote::create(
            tenantId: 1,
            orderId: 1,
            vendorId: 1,
            productId: 1,
            quantity: 10,
            specifications: ['material' => 'stainless_steel'],
            notes: 'Test quote',
            initialOffer: 1000000,
            quoteDetails: [],
            currency: 'IDR',
            expiresAt: (new DateTimeImmutable())->modify('+30 days')
        );
    }

    /**
     * Helper method to create a sent quote
     */
    private function createSentQuote(): Quote
    {
        $quote = $this->createDraftQuote();
        $quote->send();
        return $quote;
    }

    /**
     * Helper method to create an expired quote
     */
    private function createExpiredQuote(): Quote
    {
        return Quote::create(
            tenantId: 1,
            orderId: 1,
            vendorId: 1,
            productId: 1,
            quantity: 10,
            specifications: ['material' => 'stainless_steel'],
            notes: 'Test quote',
            initialOffer: 1000000,
            quoteDetails: [],
            currency: 'IDR',
            expiresAt: (new DateTimeImmutable())->modify('-1 day') // Already expired
        );
    }
}
