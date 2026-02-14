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
     * Test that items array is required
     */
    public function test_items_is_required(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * Test that items must be an array
     */
    public function test_items_must_be_array(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['items' => 'not-an-array'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * Test that items array must have at least one item
     */
    public function test_items_must_have_at_least_one_item(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            ['items' => []],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items'));
    }

    /**
     * Test that product_id is required for each item
     */
    public function test_product_id_is_required_for_each_item(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    ['counter_unit_price' => 1000]
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.product_id'));
    }

    /**
     * Test that counter_unit_price is required for each item
     */
    public function test_counter_unit_price_is_required_for_each_item(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    ['product_id' => 'product-1']
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.counter_unit_price'));
    }

    /**
     * Test that counter_unit_price must be numeric
     */
    public function test_counter_unit_price_must_be_numeric(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 'not-a-number'
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.counter_unit_price'));
    }

    /**
     * Test that counter_unit_price must be greater than 0
     */
    public function test_counter_unit_price_must_be_greater_than_zero(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 0
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.counter_unit_price'));
    }

    /**
     * Test that negative counter_unit_price is invalid
     */
    public function test_negative_counter_unit_price_is_invalid(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => -100
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.counter_unit_price'));
    }

    /**
     * Test that valid integer counter_unit_price passes validation
     */
    public function test_valid_integer_counter_unit_price_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid decimal counter_unit_price passes validation
     */
    public function test_valid_decimal_counter_unit_price_passes(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1250.50
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that multiple items can be validated
     */
    public function test_multiple_items_can_be_validated(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ],
                    [
                        'product_id' => 'product-2',
                        'counter_unit_price' => 2000
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that item notes is optional
     */
    public function test_item_notes_is_optional(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('items.0.notes'));
    }

    /**
     * Test that item notes cannot exceed 500 characters
     */
    public function test_item_notes_cannot_exceed_max_length(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000,
                        'notes' => str_repeat('a', 501)
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('items.0.notes'));
    }

    /**
     * Test that general notes is optional
     */
    public function test_notes_is_optional(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ]
            ],
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
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
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
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
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
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
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
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
                'notes' => str_repeat('a', 1000)
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that estimated_delivery_days is optional
     */
    public function test_estimated_delivery_days_is_optional(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that estimated_delivery_days must be integer
     */
    public function test_estimated_delivery_days_must_be_integer(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
                'estimated_delivery_days' => 'not-a-number'
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that estimated_delivery_days must be at least 1
     */
    public function test_estimated_delivery_days_must_be_at_least_one(): void
    {
        $request = new CounterOfferRequest();
        $validator = Validator::make(
            [
                'items' => [
                    [
                        'product_id' => 'product-1',
                        'counter_unit_price' => 1000
                    ]
                ],
                'estimated_delivery_days' => 0
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
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

        $this->assertArrayHasKey('items.required', $messages);
        $this->assertArrayHasKey('items.*.product_id.required', $messages);
        $this->assertArrayHasKey('items.*.counter_unit_price.required', $messages);
        $this->assertArrayHasKey('items.*.counter_unit_price.numeric', $messages);
        $this->assertArrayHasKey('items.*.counter_unit_price.min', $messages);
        $this->assertArrayHasKey('notes.max', $messages);
    }
}
