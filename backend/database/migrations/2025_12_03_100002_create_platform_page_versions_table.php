<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Platform Page Versions - Version history for platform pages
     * Enables rollback and change tracking for global content
     */
    public function up(): void
    {
        Schema::create('platform_page_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('page_id');
            $table->integer('version_number');
            $table->json('content'); // Versioned content snapshot
            $table->json('meta_data')->nullable(); // Versioned metadata snapshot
            $table->string('change_description', 500)->nullable(); // Description of changes
            $table->unsignedBigInteger('created_by'); // Admin who made the change
            $table->boolean('is_current')->default(false); // Current active version
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('page_id')->references('id')->on('platform_pages')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->unique(['page_id', 'version_number']);
            $table->index(['page_id', 'is_current']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_page_versions');
    }
};