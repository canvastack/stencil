<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'next_day' to the shipping_methods type enum
        DB::statement("ALTER TABLE shipping_methods DROP CONSTRAINT shipping_methods_type_check");
        DB::statement("ALTER TABLE shipping_methods ADD CONSTRAINT shipping_methods_type_check CHECK (type IN ('standard', 'express', 'same_day', 'pickup', 'next_day'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'next_day' from the shipping_methods type enum
        DB::statement("ALTER TABLE shipping_methods DROP CONSTRAINT shipping_methods_type_check");
        DB::statement("ALTER TABLE shipping_methods ADD CONSTRAINT shipping_methods_type_check CHECK (type IN ('standard', 'express', 'same_day', 'pickup'))");
    }
};