<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canplug_pagen_comments', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('uuid');
            $table->index('tenant_id');
        });
        
        // Populate tenant_id from related content
        DB::statement("
            UPDATE canplug_pagen_comments AS comments
            SET tenant_id = contents.tenant_id
            FROM canplug_pagen_contents AS contents
            WHERE comments.content_id = contents.uuid
            AND comments.tenant_id IS NULL
        ");
        
        // Make tenant_id NOT NULL and add foreign key after populating
        Schema::table('canplug_pagen_comments', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }
    
    public function down(): void
    {
        Schema::table('canplug_pagen_comments', function (Blueprint $table) {
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
