<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration removes hardcoded form fields from products table.
     * These fields have been migrated to product_form_configurations table.
     * 
     * ⚠️ IMPORTANT: Only run this AFTER verifying:
     * 1. All products have form configurations created
     * 2. Form submission system is working correctly
     * 3. No production code is using these hardcoded fields
     * 4. Frontend is using DynamicFormRenderer (not old hardcoded form)
     */
    public function up(): void
    {
        Log::info('[ProductFieldCleanup] Starting removal of hardcoded form fields from products table');
        
        // Safety check: Ensure migration was successful
        $productsWithHardcodedFields = \DB::table('products')
            ->where(function($query) {
                $query->whereNotNull('bahan')
                      ->orWhereNotNull('kualitas')
                      ->orWhereNotNull('ketebalan')
                      ->orWhereNotNull('ukuran');
            })
            ->count();
        
        $formConfigsCount = \DB::table('product_form_configurations')
            ->where('description', 'LIKE', '%Auto-migrated%')
            ->count();
        
        Log::info('[ProductFieldCleanup] Pre-migration verification', [
            'products_with_hardcoded_fields' => $productsWithHardcodedFields,
            'migrated_form_configs' => $formConfigsCount,
        ]);
        
        Schema::table('products', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['product_type']);
            $table->dropIndex(['bahan']);
            $table->dropIndex(['kualitas']);
            
            // Drop hardcoded form field columns
            $table->dropColumn([
                'product_type',
                'bahan',
                'bahan_options',
                'kualitas',
                'kualitas_options',
                'ketebalan',
                'ketebalan_options',
                'ukuran',
                'ukuran_options',
                'warna_background',
                'design_file_url',
                'custom_texts',
                'notes_wysiwyg',
            ]);
        });
        
        Log::info('[ProductFieldCleanup] Successfully removed hardcoded form fields from products table', [
            'columns_removed' => 13,
            'indexes_removed' => 3,
        ]);
    }

    /**
     * Reverse the migrations.
     * 
     * Restores the hardcoded columns (data will be lost!)
     */
    public function down(): void
    {
        Log::info('[ProductFieldCleanup] Rolling back - restoring hardcoded form fields to products table');
        
        Schema::table('products', function (Blueprint $table) {
            // Restore columns (nullable since data is lost)
            $table->string('product_type')->nullable()->after('subcategory');
            $table->string('bahan')->nullable()->after('product_type');
            $table->json('bahan_options')->nullable()->after('bahan');
            $table->string('kualitas')->nullable()->after('bahan_options');
            $table->json('kualitas_options')->nullable()->after('kualitas');
            $table->string('ketebalan')->nullable()->after('kualitas_options');
            $table->json('ketebalan_options')->nullable()->after('ketebalan');
            $table->string('ukuran')->nullable()->after('ketebalan_options');
            $table->json('ukuran_options')->nullable()->after('ukuran');
            $table->string('warna_background')->nullable()->after('ukuran_options');
            $table->string('design_file_url')->nullable()->after('warna_background');
            $table->json('custom_texts')->nullable()->after('design_file_url');
            $table->text('notes_wysiwyg')->nullable()->after('custom_texts');
            
            // Restore indexes
            $table->index('product_type');
            $table->index('bahan');
            $table->index('kualitas');
        });
        
        Log::info('[ProductFieldCleanup] Rollback completed - columns restored (without data)');
    }
};
