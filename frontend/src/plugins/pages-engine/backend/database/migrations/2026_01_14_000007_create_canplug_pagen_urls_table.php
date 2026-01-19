<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_urls', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->uuid('content_id');
            
            $table->string('old_url', 500);
            $table->string('new_url', 500);
            
            $table->integer('redirect_type')->default(301);
            
            $table->boolean('is_active')->default(true);
            
            $table->integer('hit_count')->default(0);
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_urls', function (Blueprint $table) {
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('content_id');
            $table->index('old_url');
            $table->index('is_active');
            $table->index(['tenant_id', 'old_url']);
        });
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_urls_unique_old_url 
            ON canplug_pagen_urls(tenant_id, old_url) 
            WHERE is_active = true
        ');
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_urls_set_uuid()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.uuid IS NULL THEN
                    NEW.uuid = gen_random_uuid();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_urls_uuid_trigger
            BEFORE INSERT ON canplug_pagen_urls
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_urls_set_uuid();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_urls_uuid_trigger ON canplug_pagen_urls');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_urls_set_uuid()');
        Schema::dropIfExists('canplug_pagen_urls');
    }
};
