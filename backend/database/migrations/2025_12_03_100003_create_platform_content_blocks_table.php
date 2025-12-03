<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Platform Content Blocks - Reusable content templates
     * Available to tenants as starting templates they can customize
     */
    public function up(): void
    {
        Schema::create('platform_content_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Display name
            $table->string('identifier')->unique()->index(); // Unique identifier for templates
            $table->text('description')->nullable(); // Template description
            $table->json('schema'); // JSON schema defining block structure
            $table->json('default_content')->nullable(); // Default content values
            $table->string('category', 50)->default('general'); // Template category
            $table->boolean('is_reusable')->default(true); // Can be reused multiple times
            $table->boolean('is_active')->default(true); // Available for use
            $table->boolean('is_template')->default(false); // Available to tenants as template
            $table->timestamps();
            
            // Indexes
            $table->index(['category']);
            $table->index(['is_template']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_content_blocks');
    }
};