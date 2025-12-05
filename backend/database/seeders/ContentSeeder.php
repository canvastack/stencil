<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Domain\Content\Entities\TenantPage;

class ContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if we're in a tenant context (this seeder is only for tenant data)
        if (!tenancy()->initialized) {
            $this->command->info('Skipping content seeding - not in tenant context');
            return;
        }

        // Clear existing pages to avoid duplicates
        TenantPage::truncate();

        // Create default tenant pages
        TenantPage::create([
            'title' => 'Home',
            'slug' => 'home',
            'description' => 'Business homepage with company overview',
            'content' => [
                'hero' => [
                    'title' => 'Welcome to Our Business',
                    'subtitle' => 'Professional services and quality products',
                    'cta_text' => 'Get Started',
                    'background_image' => '/images/hero-bg.jpg'
                ],
                'features' => [
                    [
                        'title' => 'Quality Service',
                        'description' => 'We provide top-notch services to our clients',
                        'icon' => 'star'
                    ],
                    [
                        'title' => 'Expert Team',
                        'description' => 'Our experienced team delivers excellent results',
                        'icon' => 'users'
                    ],
                    [
                        'title' => '24/7 Support',
                        'description' => 'Round-the-clock customer support',
                        'icon' => 'support'
                    ]
                ]
            ],
            'status' => 'published',
            'page_type' => 'home',
            'is_homepage' => true,
            'sort_order' => 1,
            'published_at' => now()
        ]);

        TenantPage::create([
            'title' => 'About Us',
            'slug' => 'about',
            'description' => 'Learn more about our company and values',
            'content' => [
                'intro' => [
                    'title' => 'About Our Company',
                    'description' => 'We are dedicated to providing exceptional services and building lasting relationships with our clients.'
                ],
                'mission' => [
                    'title' => 'Our Mission',
                    'content' => 'To deliver innovative solutions that exceed customer expectations while maintaining the highest standards of quality and integrity.'
                ]
            ],
            'status' => 'published',
            'page_type' => 'about',
            'sort_order' => 2,
            'published_at' => now()
        ]);

        TenantPage::create([
            'title' => 'Contact Us',
            'slug' => 'contact',
            'description' => 'Get in touch with our team',
            'content' => [
                'contact_info' => [
                    'title' => 'Contact Information',
                    'phone' => '+1 (555) 123-4567',
                    'email' => 'info@business.com'
                ]
            ],
            'status' => 'published',
            'page_type' => 'contact',
            'sort_order' => 3,
            'published_at' => now()
        ]);

        TenantPage::create([
            'title' => 'FAQ',
            'slug' => 'faq',
            'description' => 'Frequently asked questions',
            'content' => [
                'intro' => [
                    'title' => 'Frequently Asked Questions',
                    'description' => 'Find answers to common questions.'
                ]
            ],
            'status' => 'published',
            'page_type' => 'faq',
            'sort_order' => 4,
            'published_at' => now()
        ]);

        $this->command->info('✅ Tenant content pages created successfully');
    }
}