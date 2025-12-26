<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Phase 1.3: Add size and available_sizes columns to products table
     * This fixes the data loss issue where user size selections were being lost
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Add size column (default or recommended size)
            $table->string('size')->nullable()->after('material');
            
            // Add available_sizes as JSON array for product options
            $table->json('available_sizes')->nullable()->after('size');
            
            // Add index for size filtering performance
            $table->index('size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['size']);
            $table->dropColumn(['size', 'available_sizes']);
        });
    }
};
