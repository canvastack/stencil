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
        Schema::create('product_categories', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Category Information
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            
            // Hierarchy Support
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->integer('sort_order')->default(0);
            $table->integer('level')->default(0);
            $table->string('path')->nullable(); // /parent/child format for easy queries
            
            // Media & SEO
            $table->string('image')->nullable();
            $table->string('icon')->nullable();
            $table->string('color_scheme')->nullable();
            
            // Status & Visibility
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('show_in_menu')->default(true);
            
            // Etching-specific configuration
            $table->json('allowed_materials')->nullable(); // ['Akrilik', 'Kuningan', etc.]
            $table->json('quality_levels')->nullable(); // ['Standard', 'Tinggi']
            $table->json('customization_options')->nullable(); // Available custom fields
            
            // SEO fields
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->json('seo_keywords')->nullable();
            
            // Pricing settings
            $table->decimal('base_markup_percentage', 5, 2)->nullable();
            $table->boolean('requires_quote')->default(false);
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('slug');
            $table->index('parent_id');
            $table->index('is_active');
            $table->index('is_featured');
            $table->index('sort_order');
            $table->index('level');
            $table->index(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'parent_id']);
            
            // Foreign key constraint
            $table->foreign('parent_id')->references('id')->on('product_categories')->onDelete('cascade');
            
            // Unique constraints
            $table->unique(['tenant_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};