<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Platform Pages - Global content managed by Platform Administrators
     * Stored in main database, accessible to all tenants as templates
     */
    public function up(): void
    {
        Schema::create('platform_pages', function (Blueprint $table) {
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
            $table->string('language', 5)->default('en');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->datetime('published_at')->nullable();
            $table->unsignedBigInteger('created_by'); // Platform Admin User
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('parent_id')->references('id')->on('platform_pages')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->unique(['slug', 'language']);
            $table->index(['status']);
            $table->index(['is_homepage']);
            $table->index(['created_by']);
            $table->index(['published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_pages');
    }
};