<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Category relationship
            $table->foreignId('category_id')->nullable()->after('vendor_id');
            
            // Enhanced product information
            $table->text('long_description')->nullable()->after('description');
            $table->json('features')->nullable()->after('long_description'); // Key features list
            $table->string('material')->nullable()->after('features'); // Default/primary material
            $table->string('subcategory')->nullable()->after('categories');
            
            // Business model fields
            $table->boolean('customizable')->default(true)->after('track_inventory'); // Most etching products are customizable
            $table->json('custom_options')->nullable()->after('customizable'); // Quick custom options reference
            $table->enum('production_type', ['internal', 'vendor'])->default('vendor')->after('custom_options');
            $table->boolean('requires_quote')->default(false)->after('production_type');
            
            // Etching-specific fields
            $table->string('lead_time')->default('7-14 days')->after('requires_quote'); // Human-readable lead time
            $table->integer('min_order_quantity')->default(1)->after('lead_time');
            $table->integer('max_order_quantity')->nullable()->after('min_order_quantity');
            
            // Enhanced pricing
            $table->string('price_unit')->default('piece')->after('currency'); // piece, sqm, linear_meter, etc.
            $table->bigInteger('min_price')->nullable()->after('vendor_price'); // Minimum price for quotes
            $table->bigInteger('max_price')->nullable()->after('min_price'); // Maximum price for quotes
            
            // Quality and specifications
            $table->json('quality_levels')->nullable()->after('max_price'); // Available quality options
            $table->json('specifications')->nullable()->after('quality_levels'); // Technical specifications
            $table->json('available_materials')->nullable()->after('specifications');
            
            // Vendor and pricing
            $table->decimal('base_markup_percentage', 5, 2)->default(25.00)->after('available_materials');
            $table->json('vendor_pricing')->nullable()->after('base_markup_percentage'); // Multiple vendor pricing
            
            // Display and marketing
            $table->boolean('featured')->default(false)->after('track_inventory');
            $table->integer('view_count')->default(0)->after('featured');
            $table->decimal('average_rating', 3, 2)->default(0.00)->after('view_count');
            $table->integer('review_count')->default(0)->after('average_rating');
            
            // SEO enhancement
            $table->json('seo_keywords')->nullable()->after('seo_description');
            
            // Status timestamps
            $table->timestamp('published_at')->nullable()->after('seo_keywords');
            $table->timestamp('last_viewed_at')->nullable()->after('published_at');
            
            // Add foreign key constraint
            $table->foreign('category_id')->references('id')->on('product_categories')->onDelete('set null');
            
            // Add new indexes
            $table->index('category_id');
            $table->index('material');
            $table->index('customizable');
            $table->index('production_type');
            $table->index('requires_quote');
            $table->index('featured');
            $table->index('published_at');
            $table->index(['tenant_id', 'category_id']);
            $table->index(['tenant_id', 'featured']);
            $table->index(['tenant_id', 'customizable']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['category_id']);
            
            // Drop indexes
            $table->dropIndex(['tenant_id', 'customizable']);
            $table->dropIndex(['tenant_id', 'featured']);
            $table->dropIndex(['tenant_id', 'category_id']);
            $table->dropIndex(['published_at']);
            $table->dropIndex(['featured']);
            $table->dropIndex(['requires_quote']);
            $table->dropIndex(['production_type']);
            $table->dropIndex(['customizable']);
            $table->dropIndex(['material']);
            $table->dropIndex(['category_id']);
            
            // Drop columns
            $table->dropColumn([
                'category_id', 'long_description', 'features', 'material', 'subcategory',
                'customizable', 'custom_options', 'production_type', 'requires_quote',
                'lead_time', 'min_order_quantity', 'max_order_quantity', 'price_unit',
                'min_price', 'max_price', 'quality_levels', 'specifications',
                'available_materials', 'base_markup_percentage', 'vendor_pricing',
                'featured', 'view_count', 'average_rating', 'review_count',
                'seo_keywords', 'published_at', 'last_viewed_at'
            ]);
        });
    }
};