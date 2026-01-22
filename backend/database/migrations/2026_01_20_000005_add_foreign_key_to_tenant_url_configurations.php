<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_url_configurations', function (Blueprint $table) {
            $table->foreign('custom_domain_id', 'fk_tenant_url_config_domain')
                ->references('id')
                ->on('custom_domains')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenant_url_configurations', function (Blueprint $table) {
            $table->dropForeign('fk_tenant_url_config_domain');
        });
    }
};
