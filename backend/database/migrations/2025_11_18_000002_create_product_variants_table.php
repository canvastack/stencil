<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Product reference
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            
            // Variant Information
            $table->string('name'); // e.g., "Akrilik Standard 5mm Hitam"
            $table->string('sku')->nullable(); // Specific SKU for this variant
            
            // Etching-specific attributes
            $table->enum('material', ['Akrilik', 'Kuningan', 'Tembaga', 'Stainless Steel', 'Aluminum'])->nullable();
            $table->enum('quality', ['Standard', 'Tinggi', 'Premium'])->nullable();
            $table->decimal('thickness', 8, 2)->nullable();
            $table->string('color')->nullable(); // Color name or hex code
            $table->string('color_hex')->nullable(); // Hex code for exact color
            $table->json('dimensions')->nullable(); // width, height, depth
            $table->json('etching_specifications')->nullable();
            
            // Pricing per variant
            $table->bigInteger('price_adjustment')->default(0); // Price difference from base product
            $table->decimal('markup_percentage', 5, 2)->nullable(); // Override product markup
            $table->bigInteger('vendor_price')->nullable(); // Vendor cost for this specific variant
            $table->decimal('base_price', 12, 2)->nullable();
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->decimal('retail_price', 12, 2)->nullable();
            $table->decimal('cost_price', 12, 2)->nullable();
            
            // Inventory per variant
            $table->integer('stock_quantity')->default(0);
            $table->integer('low_stock_threshold')->nullable();
            $table->boolean('track_inventory')->default(true);
            $table->boolean('allow_backorder')->default(false);
            
            // Availability
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false); // Default variant for product
            $table->integer('sort_order')->default(0);
            
            // Lead time for this variant
            $table->integer('lead_time_days')->nullable();
            $table->string('lead_time_note')->nullable();
            
            // Media
            $table->json('images')->nullable(); // Variant-specific images
            
            // Custom fields for etching requirements
            $table->json('custom_fields')->nullable();
            $table->text('special_notes')->nullable();
            
            // Weight and shipping
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->json('shipping_dimensions')->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('product_id');
            $table->index('category_id');
            $table->index('sku');
            $table->index('material');
            $table->index('quality');
            $table->index('is_active');
            $table->index('is_default');
            $table->index('sort_order');
            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['product_id', 'is_default']);
            
            // Unique constraints
            $table->unique(['tenant_id', 'sku']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};