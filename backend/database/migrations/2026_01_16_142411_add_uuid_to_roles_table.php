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
        Schema::table('roles', function (Blueprint $table) {
            // Add UUID column (nullable first, will be made NOT NULL after population)
            $table->uuid('uuid')->nullable()->after('id');
        });
        
        // Populate UUID for existing roles using PostgreSQL gen_random_uuid()
        DB::statement("UPDATE roles SET uuid = gen_random_uuid() WHERE uuid IS NULL");
        
        // Make UUID NOT NULL and add unique constraint + index
        Schema::table('roles', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
