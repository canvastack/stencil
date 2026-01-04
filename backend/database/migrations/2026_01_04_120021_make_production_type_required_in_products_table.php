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
        DB::statement("UPDATE products SET production_type = 'vendor' WHERE production_type IS NULL OR production_type = ''");
        
        DB::statement("ALTER TABLE products ALTER COLUMN production_type SET NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE products ALTER COLUMN production_type DROP NOT NULL");
    }
};
