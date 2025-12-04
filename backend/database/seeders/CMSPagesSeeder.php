<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CMSPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🎨 Seeding CMS Pages for all tenants...');

        // Get all tenants
        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            $this->command->info("   📄 Creating CMS pages for: {$tenant->name}");
            
            // Use tenant slug or name as subdomain if subdomain column doesn't exist
            $subdomain = $tenant->slug ?? strtolower(str_replace(' ', '-', $tenant->name));
            
            $this->createTenantPages($tenant->id, $tenant->name, $subdomain);
        }

        // Create Platform Pages
        $this->createPlatformPages();

        $this->command->info('✅ CMS Pages seeded successfully for all tenants!');
    }

    private function createTenantPages($tenantId, $tenantName, $subdomain): void
    {
        $pages = [
            [
                'uuid' => Str::uuid(),
                'title' => 'Home Page',
                'slug' => 'home',
                'description' => "Welcome to {$tenantName} - Your trusted partner for business solutions",
                'content' => json_encode([
                    'hero' => [
                        'title' => [
                            'typing' => [
                                "Welcome to {$tenantName}",
                                "Premium Business Solutions",
                                "Innovation at Its Best", 
                                "Your Success Partner",
                                "Excellence in Service"
                            ]
                        ],
                        'subtitle' => "Discover our comprehensive range of products and services designed to help your business thrive in today's competitive market.",
                        'cta_text' => 'Get Started',
                        'cta_link' => '/products',
                        'background_image' => "/images/hero/{$subdomain}-hero.jpg"
                    ],
                    'features' => [
                        [
                            'icon' => 'shield',
                            'title' => 'Trusted Quality',
                            'description' => 'We deliver premium quality products backed by industry-leading warranties and support.'
                        ],
                        [
                            'icon' => 'zap',
                            'title' => 'Fast Delivery',
                            'description' => 'Quick turnaround times with reliable shipping options to meet your deadlines.'
                        ],
                        [
                            'icon' => 'users',
                            'title' => 'Expert Support',
                            'description' => 'Our experienced team provides personalized support throughout your journey.'
                        ]
                    ],
                    'stats' => [
                        ['label' => 'Happy Customers', 'value' => '10,000+'],
                        ['label' => 'Projects Completed', 'value' => '25,000+'],
                        ['label' => 'Years Experience', 'value' => '15+'],
                        ['label' => 'Customer Satisfaction', 'value' => '99%']
                    ]
                ]),
                'template' => 'homepage',
                'meta_data' => json_encode([
                    'seo_title' => "{$tenantName} - Premium Business Solutions",
                    'seo_description' => "Discover {$tenantName}'s comprehensive range of business solutions. Quality products, expert service, and reliable delivery.",
                    'seo_keywords' => ['business solutions', $subdomain, 'premium quality', 'expert service'],
                    'og_image' => "/images/og/{$subdomain}-home.jpg"
                ]),
                'status' => 'published',
                'is_homepage' => true,
                'sort_order' => 1,
                'language' => 'en',
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
                'published_at' => now(),
            ],
            [
                'uuid' => Str::uuid(),
                'title' => 'About Us',
                'slug' => 'about',
                'description' => "Learn more about {$tenantName} and our commitment to excellence",
                'content' => json_encode([
                    'hero' => [
                        'title' => "About {$tenantName}",
                        'subtitle' => 'Our story of innovation, quality, and customer satisfaction',
                        'background_image' => "/images/about/{$subdomain}-about.jpg"
                    ],
                    'sections' => [
                        [
                            'type' => 'text',
                            'title' => 'Our Mission',
                            'content' => "At {$tenantName}, we are dedicated to providing exceptional products and services that exceed our customers' expectations. Our mission is to drive innovation while maintaining the highest standards of quality and reliability."
                        ],
                        [
                            'type' => 'text', 
                            'title' => 'Our Values',
                            'content' => 'We believe in integrity, innovation, and customer-centricity. These core values guide everything we do and help us build lasting relationships with our clients.'
                        ],
                        [
                            'type' => 'team',
                            'title' => 'Our Team',
                            'members' => [
                                [
                                    'name' => 'John Smith',
                                    'position' => 'CEO & Founder',
                                    'bio' => 'With over 15 years of industry experience, John leads our vision for innovation and growth.',
                                    'image' => "/images/team/{$subdomain}-john.jpg"
                                ],
                                [
                                    'name' => 'Sarah Johnson',
                                    'position' => 'Operations Manager', 
                                    'bio' => 'Sarah ensures our operations run smoothly and our customers receive exceptional service.',
                                    'image' => "/images/team/{$subdomain}-sarah.jpg"
                                ]
                            ]
                        ]
                    ]
                ]),
                'template' => 'page',
                'meta_data' => json_encode([
                    'seo_title' => "About {$tenantName} - Our Story & Values",
                    'seo_description' => "Learn about {$tenantName}'s mission, values, and the team behind our success. Discover why we're the right partner for your business.",
                    'seo_keywords' => ['about us', $subdomain, 'company story', 'team', 'values']
                ]),
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 2,
                'language' => 'en',
                'tenant_id' => $tenantId,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(1),
                'published_at' => now()->subDays(5),
            ],
            [
                'uuid' => Str::uuid(),
                'title' => 'Frequently Asked Questions',
                'slug' => 'faq',
                'description' => 'Find answers to common questions about our products and services',
                'content' => json_encode([
                    'hero' => [
                        'title' => 'Frequently Asked Questions',
                        'subtitle' => 'Find answers to the most common questions about our services'
                    ],
                    'categories' => [
                        [
                            'name' => 'General Questions',
                            'faqs' => [
                                [
                                    'question' => 'How do I place an order?',
                                    'answer' => 'You can place an order through our online catalog, by calling our sales team, or by visiting our showroom. Our team will guide you through the entire process.'
                                ],
                                [
                                    'question' => 'What payment methods do you accept?',
                                    'answer' => 'We accept major credit cards, bank transfers, PayPal, and for established customers, we offer net payment terms.'
                                ],
                                [
                                    'question' => 'Do you offer international shipping?',
                                    'answer' => 'Yes, we ship internationally to most countries. Shipping costs and delivery times vary by destination.'
                                ]
                            ]
                        ],
                        [
                            'name' => 'Product & Service Questions', 
                            'faqs' => [
                                [
                                    'question' => 'What is your return policy?',
                                    'answer' => 'We offer a 30-day return policy for most products. Items must be in original condition. Custom or personalized items may have different return policies.'
                                ],
                                [
                                    'question' => 'Do you provide warranties?',
                                    'answer' => 'Yes, all our products come with manufacturer warranties. Extended warranty options are available for select items.'
                                ],
                                [
                                    'question' => 'Can you handle custom orders?',
                                    'answer' => 'Absolutely! We specialize in custom solutions. Contact our design team to discuss your specific requirements.'
                                ]
                            ]
                        ]
                    ]
                ]),
                'template' => 'faq',
                'meta_data' => json_encode([
                    'seo_title' => "FAQ - {$tenantName}",
                    'seo_description' => 'Get answers to frequently asked questions about our products, services, shipping, and policies.',
                    'seo_keywords' => ['faq', 'questions', 'help', 'support', $subdomain]
                ]),
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 3,
                'language' => 'en',
                'tenant_id' => $tenantId,
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(2),
                'published_at' => now()->subDays(10),
            ],
            [
                'uuid' => Str::uuid(),
                'title' => 'Contact Us',
                'slug' => 'contact',
                'description' => 'Get in touch with our team for support, quotes, or partnerships',
                'content' => json_encode([
                    'hero' => [
                        'title' => 'Contact Us',
                        'subtitle' => 'Ready to get started? Get in touch with our team today'
                    ],
                    'contact_methods' => [
                        [
                            'type' => 'phone',
                            'label' => 'Phone',
                            'value' => '+1 (555) 123-4567',
                            'description' => 'Call us during business hours for immediate assistance'
                        ],
                        [
                            'type' => 'email',
                            'label' => 'Email',
                            'value' => "contact@{$subdomain}.com",
                            'description' => 'Send us an email and we\'ll respond within 24 hours'
                        ],
                        [
                            'type' => 'address',
                            'label' => 'Address',
                            'value' => "123 Business Street, Suite 100\nCity, State 12345",
                            'description' => 'Visit our showroom to see our products in person'
                        ]
                    ],
                    'contact_form' => [
                        'title' => 'Send us a Message',
                        'fields' => [
                            ['name' => 'name', 'type' => 'text', 'label' => 'Full Name', 'required' => true],
                            ['name' => 'email', 'type' => 'email', 'label' => 'Email Address', 'required' => true],
                            ['name' => 'company', 'type' => 'text', 'label' => 'Company Name', 'required' => false],
                            ['name' => 'subject', 'type' => 'select', 'label' => 'Subject', 'required' => true, 'options' => [
                                'general' => 'General Inquiry',
                                'quote' => 'Request Quote',
                                'support' => 'Technical Support',
                                'partnership' => 'Partnership Opportunity'
                            ]],
                            ['name' => 'message', 'type' => 'textarea', 'label' => 'Message', 'required' => true]
                        ]
                    ],
                    'business_hours' => [
                        'monday' => '9:00 AM - 6:00 PM',
                        'tuesday' => '9:00 AM - 6:00 PM',
                        'wednesday' => '9:00 AM - 6:00 PM',
                        'thursday' => '9:00 AM - 6:00 PM',
                        'friday' => '9:00 AM - 6:00 PM',
                        'saturday' => '10:00 AM - 4:00 PM',
                        'sunday' => 'Closed'
                    ]
                ]),
                'template' => 'contact',
                'meta_data' => json_encode([
                    'seo_title' => "Contact {$tenantName} - Get in Touch",
                    'seo_description' => "Contact {$tenantName} for quotes, support, or partnerships. Multiple ways to reach our team including phone, email, and online form.",
                    'seo_keywords' => ['contact', 'support', 'quote', $subdomain, 'get in touch']
                ]),
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 4,
                'language' => 'en',
                'tenant_id' => $tenantId,
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(1),
                'published_at' => now()->subDays(8),
            ]
        ];

        foreach ($pages as $page) {
            DB::table('pages')->insert($page);
        }
    }

    private function createPlatformPages(): void
    {
        $this->command->info('   📄 Creating Platform CMS pages...');

        // Check if platform page already exists
        $existingPage = DB::table('platform_pages')->where('slug', 'home')->where('language', 'en')->first();
        if ($existingPage) {
            $this->command->info('   ⚠️  Platform page already exists, skipping...');
            return;
        }

        $pages = [
            [
                'uuid' => Str::uuid(),
                'title' => 'Platform Management Dashboard',
                'slug' => 'home',
                'description' => 'Central management hub for the multi-tenant platform',
                'content' => json_encode([
                    'hero' => [
                        'title' => [
                            'typing' => [
                                'Platform Management',
                                'Multi-Tenant Control',
                                'Admin Dashboard',
                                'System Overview',
                                'Central Command'
                            ]
                        ],
                        'subtitle' => 'Comprehensive platform management tools for administrators and managers',
                        'cta_text' => 'Access Dashboard',
                        'cta_link' => '/platform/dashboard'
                    ],
                    'features' => [
                        [
                            'icon' => 'users',
                            'title' => 'Tenant Management',
                            'description' => 'Create, manage, and monitor tenant accounts across the platform'
                        ],
                        [
                            'icon' => 'shield',
                            'title' => 'Security & Permissions',
                            'description' => 'Advanced role-based access control and security monitoring'
                        ],
                        [
                            'icon' => 'trending-up',
                            'title' => 'Analytics & Reporting',
                            'description' => 'Comprehensive insights and reporting across all tenants'
                        ]
                    ]
                ]),
                'template' => 'platform-homepage',
                'meta_data' => json_encode([
                    'seo_title' => 'Platform Management - Multi-Tenant Control Center',
                    'seo_description' => 'Advanced platform management tools for administrators to manage tenants, security, and system analytics.',
                    'seo_keywords' => ['platform management', 'multi-tenant', 'admin dashboard', 'system control']
                ]),
                'status' => 'published',
                'is_homepage' => true,
                'sort_order' => 1,
                'language' => 'en',
                'created_by' => 1, // Platform admin user
                'created_at' => now(),
                'updated_at' => now(),
                'published_at' => now(),
            ]
        ];

        foreach ($pages as $page) {
            DB::table('platform_pages')->insert($page);
        }
    }
}