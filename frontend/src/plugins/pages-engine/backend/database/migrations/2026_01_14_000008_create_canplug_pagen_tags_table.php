<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_tags', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            
            $table->integer('content_count')->default(0);
            
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_tags', function (Blueprint $table) {
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('slug');
            $table->unique(['tenant_id', 'slug'], 'canplug_pagen_tags_unique_slug');
        });
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_tags_set_uuid()
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
            CREATE TRIGGER canplug_pagen_tags_uuid_trigger
            BEFORE INSERT ON canplug_pagen_tags
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_tags_set_uuid();
        ');
        
        Schema::create('canplug_pagen_tag_pivot', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('content_id');
            $table->uuid('tag_id');
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_tag_pivot', function (Blueprint $table) {
            $table->index('content_id');
            $table->index('tag_id');
            $table->unique(['content_id', 'tag_id'], 'canplug_pagen_tag_pivot_unique');
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('canplug_pagen_tag_pivot');
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_tags_uuid_trigger ON canplug_pagen_tags');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_tags_set_uuid()');
        Schema::dropIfExists('canplug_pagen_tags');
    }
};
