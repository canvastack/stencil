<?php

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    /** @test */
    public function it_can_create_money_from_cents()
    {
        $money = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        
        $this->assertEquals(100000, $money->getAmountInCents());
        $this->assertEquals(1000.0, $money->getAmount());
        $this->assertEquals('IDR', $money->getCurrency());
    }

    /** @test */
    public function it_can_create_money_from_decimal()
    {
        $money = Money::fromDecimal(1000.50, 'IDR');
        
        $this->assertEquals(100050, $money->getAmountInCents());
        $this->assertEquals(1000.50, $money->getAmount());
        $this->assertEquals('IDR', $money->getCurrency());
    }

    /** @test */
    public function it_can_create_zero_money()
    {
        $money = Money::zero('USD');
        
        $this->assertEquals(0, $money->getAmountInCents());
        $this->assertEquals(0.0, $money->getAmount());
        $this->assertTrue($money->isZero());
        $this->assertFalse($money->isPositive());
    }

    /** @test */
    public function it_can_add_money_amounts()
    {
        $money1 = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        $money2 = Money::fromCents(50000, 'IDR');  // Rp 500.00
        
        $result = $money1->add($money2);
        
        $this->assertEquals(150000, $result->getAmountInCents());
        $this->assertEquals(1500.0, $result->getAmount());
    }

    /** @test */
    public function it_can_subtract_money_amounts()
    {
        $money1 = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        $money2 = Money::fromCents(30000, 'IDR');  // Rp 300.00
        
        $result = $money1->subtract($money2);
        
        $this->assertEquals(70000, $result->getAmountInCents());
        $this->assertEquals(700.0, $result->getAmount());
    }

    /** @test */
    public function it_can_multiply_money_amount()
    {
        $money = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        
        $result = $money->multiply(1.5);
        
        $this->assertEquals(150000, $result->getAmountInCents());
        $this->assertEquals(1500.0, $result->getAmount());
    }

    /** @test */
    public function it_can_calculate_percentage()
    {
        $money = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        
        $result = $money->percentage(30); // 30%
        
        $this->assertEquals(30000, $result->getAmountInCents());
        $this->assertEquals(300.0, $result->getAmount());
    }

    /** @test */
    public function it_can_compare_money_amounts()
    {
        $money1 = Money::fromCents(100000, 'IDR');
        $money2 = Money::fromCents(50000, 'IDR');
        $money3 = Money::fromCents(100000, 'IDR');
        
        $this->assertTrue($money1->isGreaterThan($money2));
        $this->assertFalse($money2->isGreaterThan($money1));
        $this->assertTrue($money2->isLessThan($money1));
        $this->assertTrue($money1->equals($money3));
    }

    /** @test */
    public function it_formats_idr_currency_correctly()
    {
        $money = Money::fromCents(100000, 'IDR'); // Rp 1,000.00
        
        $formatted = $money->format();
        
        $this->assertEquals('Rp 1.000', $formatted);
    }

    /** @test */
    public function it_formats_usd_currency_correctly()
    {
        $money = Money::fromCents(100050, 'USD'); // $1,000.50
        
        $formatted = $money->format();
        
        $this->assertEquals('$1,000.50', $formatted);
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $money = Money::fromCents(100000, 'IDR');
        
        $array = $money->toArray();
        
        $this->assertEquals([
            'amount' => 100000,
            'currency' => 'IDR',
        ], $array);
    }

    /** @test */
    public function it_can_create_from_array()
    {
        $data = [
            'amount' => 100000,
            'currency' => 'IDR',
        ];
        
        $money = Money::fromArray($data);
        
        $this->assertEquals(100000, $money->getAmountInCents());
        $this->assertEquals('IDR', $money->getCurrency());
    }

    /** @test */
    public function it_throws_exception_for_negative_amount()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Money amount cannot be negative');
        
        Money::fromCents(-1000, 'IDR');
    }

    /** @test */
    public function it_throws_exception_for_invalid_currency()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid currency code: XYZ');
        
        Money::fromCents(100000, 'XYZ');
    }

    /** @test */
    public function it_throws_exception_when_adding_different_currencies()
    {
        $money1 = Money::fromCents(100000, 'IDR');
        $money2 = Money::fromCents(100000, 'USD');
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot perform operation on different currencies: IDR vs USD');
        
        $money1->add($money2);
    }

    /** @test */
    public function it_throws_exception_when_subtracting_results_in_negative()
    {
        $money1 = Money::fromCents(50000, 'IDR');
        $money2 = Money::fromCents(100000, 'IDR');
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Money amount cannot be negative');
        
        $money1->subtract($money2);
    }

    /** @test */
    public function it_throws_exception_for_negative_multiplier()
    {
        $money = Money::fromCents(100000, 'IDR');
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Multiplier cannot be negative');
        
        $money->multiply(-1.5);
    }

    /** @test */
    public function it_throws_exception_for_invalid_percentage()
    {
        $money = Money::fromCents(100000, 'IDR');
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Percentage must be between 0 and 100');
        
        $money->percentage(150);
    }

    /** @test */
    public function it_handles_rounding_correctly()
    {
        $money = Money::fromDecimal(10.999, 'USD'); // Should round to 11.00
        
        $this->assertEquals(1100, $money->getAmountInCents());
        $this->assertEquals(11.0, $money->getAmount());
    }

    /** @test */
    public function it_can_check_positive_amount()
    {
        $positiveAmount = Money::fromCents(100, 'IDR');
        $zeroAmount = Money::zero('IDR');
        
        $this->assertTrue($positiveAmount->isPositive());
        $this->assertFalse($zeroAmount->isPositive());
    }

    /** @test */
    public function it_converts_to_string_correctly()
    {
        $money = Money::fromCents(100000, 'IDR');
        
        $this->assertEquals('Rp 1.000', (string) $money);
    }
}