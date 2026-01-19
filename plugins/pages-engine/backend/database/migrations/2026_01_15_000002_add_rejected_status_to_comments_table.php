<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE canplug_pagen_comments DROP CONSTRAINT IF EXISTS canplug_pagen_comments_status_check");
        DB::statement("ALTER TABLE canplug_pagen_comments ADD CONSTRAINT canplug_pagen_comments_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'spam', 'trash'))");
    }
    
    public function down(): void
    {
        DB::statement("UPDATE canplug_pagen_comments SET status = 'trash' WHERE status = 'rejected'");
        DB::statement("ALTER TABLE canplug_pagen_comments DROP CONSTRAINT IF EXISTS canplug_pagen_comments_status_check");
        DB::statement("ALTER TABLE canplug_pagen_comments ADD CONSTRAINT canplug_pagen_comments_status_check CHECK (status IN ('pending', 'approved', 'spam', 'trash'))");
    }
};
