<?php

namespace Tests\Feature\Api\Public;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerReview;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PublicProductsReviewAggregationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = Tenant::factory()->create([
            'slug' => 'test-tenant',
            'name' => 'Test Tenant'
        ]);
    }

    /** @test */
    public function it_includes_review_summary_in_product_list()
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
            'name' => 'Test Product'
        ]);
        
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 5,
            'is_approved' => true
        ]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 4,
            'is_approved' => true
        ]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 5,
            'is_approved' => true
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id',
                             'name',
                             'reviewSummary',
                         ],
                     ],
                 ]);

        $data = $response->json('data.0.reviewSummary');
        $this->assertEquals(4.7, round($data['averageRating'], 1));
        $this->assertEquals(3, $data['totalReviews'] ?? $data['reviewCount']);
    }

    /** @test */
    public function it_returns_zero_rating_for_products_without_reviews()
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published'
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products");

        $response->assertStatus(200);
        
        $data = $response->json('data.0.reviewSummary');
        $this->assertEquals(0, $data['averageRating']);
        $this->assertEquals(0, $data['totalReviews'] ?? $data['reviewCount']);
    }

    /** @test */
    public function it_only_counts_approved_reviews()
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published'
        ]);
        
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 5,
            'is_approved' => true
        ]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 1,
            'is_approved' => false
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products");

        $data = $response->json('data.0.reviewSummary');
        $this->assertEquals(5.0, $data['averageRating']);
        $this->assertEquals(1, $data['totalReviews'] ?? $data['reviewCount']);
    }

    /** @test */
    public function it_filters_by_minimum_rating_using_aggregated_data()
    {
        $productA = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
            'name' => 'Product A'
        ]);
        
        $productB = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
            'name' => 'Product B'
        ]);
        
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $productA->id,
            'customer_id' => $customer->id,
            'rating' => 5,
            'is_approved' => true
        ]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $productA->id,
            'customer_id' => $customer->id,
            'rating' => 4,
            'is_approved' => true
        ]);

        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $productB->id,
            'customer_id' => $customer->id,
            'rating' => 3,
            'is_approved' => true
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products?min_rating=4.0");

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.name', 'Product A');
    }

    /** @test */
    public function it_includes_review_summary_in_featured_products()
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
            'featured' => true
        ]);
        
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 4,
            'is_approved' => true
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products/featured");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'reviewSummary',
                         ],
                     ],
                 ]);
    }

    /** @test */
    public function it_includes_review_summary_in_search_results()
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
            'name' => 'Searchable Product'
        ]);
        
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        
        CustomerReview::factory()->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'rating' => 5,
            'is_approved' => true
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products/search?q=Searchable");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'reviewSummary',
                         ],
                     ],
                 ]);
    }
}
