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
            if (!Schema::hasColumn('vendors', 'completion_rate')) {
                $table->decimal('completion_rate', 5, 2)->default(0)->after('rating');
            }
            if (!Schema::hasColumn('vendors', 'average_lead_time_days')) {
                $table->integer('average_lead_time_days')->nullable()->after('lead_time');
            }
            if (!Schema::hasColumn('vendors', 'performance_score')) {
                $table->decimal('performance_score', 5, 2)->default(0)->after('rating');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['completion_rate', 'average_lead_time_days', 'performance_score']);
        });
    }
};
