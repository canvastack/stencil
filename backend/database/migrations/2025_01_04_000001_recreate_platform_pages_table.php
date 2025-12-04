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
        // Drop existing table if it exists
        Schema::dropIfExists('platform_pages');
        
        // Create new table with correct structure
        Schema::create('platform_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_slug')->unique();
            $table->json('content');
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->timestamp('published_at')->nullable();
            $table->integer('version')->default(1);
            $table->integer('previous_version')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
            
            $table->index(['page_slug', 'status']);
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