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
            
            $table->index('product_type');
            $table->index('bahan');
            $table->index('kualitas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['product_type']);
            $table->dropIndex(['bahan']);
            $table->dropIndex(['kualitas']);
            
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
    }
};
