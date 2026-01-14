<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_metadata', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->uuid('content_id');
            
            $table->string('meta_key', 255);
            $table->text('meta_value')->nullable();
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_metadata', function (Blueprint $table) {
            $table->index('uuid');
            $table->index('content_id');
            $table->index('meta_key');
            $table->index(['content_id', 'meta_key']);
        });
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_metadata_set_uuid()
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
            CREATE TRIGGER canplug_pagen_metadata_uuid_trigger
            BEFORE INSERT ON canplug_pagen_metadata
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_metadata_set_uuid();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_metadata_uuid_trigger ON canplug_pagen_metadata');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_metadata_set_uuid()');
        Schema::dropIfExists('canplug_pagen_metadata');
    }
};
