<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Tenant Pages - Tenant-specific content pages
     * Stored in schema-per-tenant, isolated per tenant
     * Can reference platform templates via platform_template_id
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->string('title');
            $table->string('slug')->index();
            $table->text('description')->nullable();
            $table->json('content'); // Structured JSON content blocks
            $table->string('template', 100)->default('default');
            $table->json('meta_data')->nullable(); // SEO and custom metadata
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_homepage')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('language', 5)->default('id'); // Default to Indonesian
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('platform_template_id')->nullable(); // Reference to platform template
            $table->datetime('published_at')->nullable();
            $table->timestamps();
            
            // Foreign keys (within tenant schema)
            $table->foreign('parent_id')->references('id')->on('pages')->onDelete('cascade');
            // Note: platform_template_id references cross-schema, handled in application layer
            
            // Indexes
            $table->unique(['slug', 'language']);
            $table->index(['status']);
            $table->index(['is_homepage']);
            $table->index(['platform_template_id']);
            $table->index(['published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};