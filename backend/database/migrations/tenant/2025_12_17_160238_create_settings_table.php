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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Settings identification
            $table->string('key', 100)->comment('Unique setting key (e.g., vendor.company_size.large_threshold)');
            $table->string('category', 50)->default('general')->comment('Setting category for grouping');
            
            // Value storage
            $table->text('value')->nullable()->comment('Setting value (stored as string, cast based on type)');
            $table->string('type', 20)->default('string')->comment('Data type: string, integer, float, boolean, json');
            $table->text('default_value')->nullable()->comment('Default value if setting is not set');
            
            // Metadata
            $table->string('label', 100)->nullable()->comment('Human-readable label');
            $table->text('description')->nullable()->comment('Setting description for admin UI');
            $table->boolean('is_public')->default(false)->comment('Whether setting is accessible to public API');
            $table->boolean('is_editable')->default(true)->comment('Whether setting can be modified via UI');
            
            // Validation
            $table->json('validation_rules')->nullable()->comment('JSON validation rules (min, max, options, etc.)');
            
            $table->timestamps();
            
            // Indexes
            $table->unique('key', 'unique_settings_key');
            $table->index('category', 'idx_settings_category');
            $table->index(['is_public', 'is_editable'], 'idx_settings_flags');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
