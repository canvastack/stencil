<?php

namespace Tests\Unit\Http\Requests\Vendor;

use App\Http\Requests\Vendor\CounterOfferRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * CounterOfferRequestTest
 * 
 * Tests validation rules for CounterOfferRequest
 * 
 * Requirements: 6.9
 */
class CounterOfferRequestTest extends TestCase
{
    /**
     * Test that counter_offer_amount is required
     */
    public function test_counter_offer_amount_is_required(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('counter_offer_amount'));
    }

    /**
     * Test that counter_offer_amount must be numeric
     */
    public function test_counter_offer_amount_must_be_numeric(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => 'not-a-number'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('counter_offer_amount'));
    }

    /**
     * Test that counter_offer_amount must be at least 0
     */
    public function test_counter_offer_amount_must_be_at_least_zero(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => 0],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that negative counter_offer_amount is invalid
     */
    public function test_negative_counter_offer_amount_is_invalid(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => -100],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('counter_offer_amount'));
    }

    /**
     * Test that valid integer counter_offer_amount passes validation
     */
    public function test_valid_integer_counter_offer_amount_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => 1000],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid decimal counter_offer_amount passes validation
     */
    public function test_valid_decimal_counter_offer_amount_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => 1250.50],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that notes is optional
     */
    public function test_notes_is_optional(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['counter_offer_amount' => 1000],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('notes'));
    }

    /**
     * Test that notes must be a string
     */
    public function test_notes_must_be_string(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'counter_offer_amount' => 1000,
                'notes' => 123
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    /**
     * Test that notes cannot exceed 1000 characters
     */
    public function test_notes_cannot_exceed_max_length(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'counter_offer_amount' => 1000,
                'notes' => str_repeat('a', 1001)
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    /**
     * Test that valid notes passes validation
     */
    public function test_valid_notes_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'counter_offer_amount' => 1000,
                'notes' => 'This is a valid counter offer note'
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that notes with exactly 1000 characters passes
     */
    public function test_notes_with_max_length_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'counter_offer_amount' => 1000,
                'notes' => str_repeat('a', 1000)
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that authorization returns true
     */
    public function test_authorization_returns_true(): void
    {
        $request = new CounterOfferRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * Test custom error messages are defined
     */
    public function test_custom_error_messages_are_defined(): void
    {
        $request = new CounterOfferRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('counter_offer_amount.required', $messages);
        $this->assertArrayHasKey('counter_offer_amount.numeric', $messages);
        $this->assertArrayHasKey('counter_offer_amount.min', $messages);
        $this->assertArrayHasKey('notes.max', $messages);
    }
}
