<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PagesEngineSeeder extends Seeder
{
    public function run(): void
    {
        if ($this->command) {
            $this->command->info('===================================');
            $this->command->info('Pages Engine Plugin Seeder Started');
            $this->command->info('===================================');
        }

        $this->call([
            ContentTypeSeeder::class,
            CategorySeeder::class,
            TagSeeder::class,
            ContentSeeder::class,
            CommentSeeder::class,
        ]);

        if ($this->command) {
            $this->command->info('');
            $this->command->info('===================================');
            $this->command->info('Pages Engine Plugin Seeder Completed');
            $this->command->info('===================================');
            $this->command->info('');
            $this->command->info('Summary:');
            $this->command->info('- Content Types: 6 (4 platform + 2 tenant)');
            $this->command->info('- Categories: ~28 hierarchical categories');
            $this->command->info('- Tags: 20 tags');
            $this->command->info('- Contents: 50 (30 blog + 20 portfolio)');
            $this->command->info('- Comments: 50+ threaded comments');
            $this->command->info('');
        }
    }
}
