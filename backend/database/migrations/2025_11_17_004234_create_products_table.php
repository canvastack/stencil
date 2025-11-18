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
        Schema::create('products', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Product Information
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->bigInteger('price'); // In smallest currency unit (cents)
            $table->string('currency', 3)->default('IDR');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->enum('type', ['physical', 'digital', 'service'])->default('physical');
            
            // Inventory Management
            $table->integer('stock_quantity')->default(0);
            $table->integer('low_stock_threshold')->nullable();
            $table->boolean('track_inventory')->default(true);
            
            // Categorization
            $table->json('categories')->nullable();
            $table->json('tags')->nullable();
            
            // Pricing & Vendor
            $table->bigInteger('vendor_price')->nullable(); // Cost from vendor
            $table->integer('markup_percentage')->nullable();
            $table->unsignedBigInteger('vendor_id')->nullable();
            
            // Media & SEO
            $table->json('images')->nullable();
            $table->string('slug')->unique();
            $table->text('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->json('dimensions')->nullable(); // weight, size, etc.
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('sku');
            $table->index('status');
            $table->index('type');
            $table->index('vendor_id');
            $table->index('created_at');
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
