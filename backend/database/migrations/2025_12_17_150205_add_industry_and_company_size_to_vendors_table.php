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
        Schema::table('vendors', function (Blueprint $table) {
            if (!Schema::hasColumn('vendors', 'industry')) {
                $table->string('industry')->nullable()->after('category');
            }
            if (!Schema::hasColumn('vendors', 'total_value')) {
                $table->unsignedBigInteger('total_value')->default(0)->after('total_orders');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            if (Schema::hasColumn('vendors', 'industry')) {
                $table->dropColumn('industry');
            }
            if (Schema::hasColumn('vendors', 'total_value')) {
                $table->dropColumn('total_value');
            }
        });
    }
};
