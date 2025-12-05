<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Entities\TenantPage;

class CheckPages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pages:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check seeded pages count and details';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Platform Pages: " . PlatformPage::count());
        $this->info("Tenant Pages: " . TenantPage::count());

        $this->newLine();
        $this->info("Platform Pages Details:");
        $platformPages = PlatformPage::all();
        foreach ($platformPages as $page) {
            $this->line("- {$page->title} (/{$page->slug}) - {$page->status}");
        }

        $this->newLine();
        $this->info("Tenant Pages Summary:");
        $tenantPages = TenantPage::selectRaw('tenant_id, COUNT(*) as count')
            ->groupBy('tenant_id')
            ->get();
        
        foreach ($tenantPages as $summary) {
            $this->line("- Tenant ID {$summary->tenant_id}: {$summary->count} pages");
        }
        
        // Check homepage content structure
        $this->newLine();
        $this->info("Homepage Content Structure Check:");
        $homepage = TenantPage::where('slug', 'home')->where('tenant_id', 1)->first();
        if ($homepage && $homepage->content) {
            $this->line("Homepage content sections:");
            foreach (array_keys($homepage->content) as $section) {
                $this->line("- {$section}");
            }
            
            $this->newLine();
            $this->line("Section status:");
            $this->line("- Process section: " . (isset($homepage->content['process']['enabled']) ? ($homepage->content['process']['enabled'] ? 'Enabled' : 'Disabled') : 'Not set'));
            $this->line("- WhyChooseUs section: " . (isset($homepage->content['whyChooseUs']['enabled']) ? ($homepage->content['whyChooseUs']['enabled'] ? 'Enabled' : 'Disabled') : 'Not set'));
            $this->line("- Achievements section: " . (isset($homepage->content['achievements']['enabled']) ? ($homepage->content['achievements']['enabled'] ? 'Enabled' : 'Disabled') : 'Not set'));
            $this->line("- Testimonials section: " . (isset($homepage->content['testimonials']['enabled']) ? ($homepage->content['testimonials']['enabled'] ? 'Enabled' : 'Disabled') : 'Not set'));
        } else {
            $this->error("No homepage found for tenant 1");
        }
    }
}
