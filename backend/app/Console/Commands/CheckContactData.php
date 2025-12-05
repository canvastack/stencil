<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckContactData extends Command
{
    protected $signature = 'pages:check-contact';
    protected $description = 'Check Contact page CTA data structure';

    public function handle()
    {
        $page = DB::table('tenant_pages')->where('slug', 'contact')->first();
        
        if (!$page) {
            $this->error('Contact page not found');
            return;
        }
        
        $content = json_decode($page->content, true);
        
        $this->info('Contact Page CTA Structure:');
        $this->line(json_encode($content['cta'], JSON_PRETTY_PRINT));
        
        return 0;
    }
}