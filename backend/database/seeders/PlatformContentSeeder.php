<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PlatformContentSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create Platform-level content pages (20-30 pages)
        $this->createPlatformPages();
        
        $this->command->info('Platform content pages seeded successfully!');
    }

    private function createPlatformPages(): void
    {
        // Platform Homepage
        $this->createPlatformHomepage();
        
        // Platform About
        $this->createPlatformAbout();
        
        // Platform Contact  
        $this->createPlatformContact();
        
        // Platform FAQ
        $this->createPlatformFAQ();
        
        // Platform Features/Services (10-15 pages)
        $this->createPlatformFeaturePages();
        
        // Platform Blog/News (10-15 pages)
        $this->createPlatformBlogPages();
    }

    private function createPlatformHomepage(): void
    {
        $content = [
            "hero" => [
                "title" => [
                    "static" => "CanvaStack Stencil Platform",
                    "typing" => [
                        "Multi-Tenant Business Platform",
                        "Scalable SaaS Architecture", 
                        "Enterprise-Grade Solutions"
                    ]
                ],
                "subtitle" => "Powerful multi-tenant platform for businesses to manage their operations efficiently with enterprise-grade features.",
                "carousel" => [
                    "images" => [
                        "/images/platform/hero-1.jpg",
                        "/images/platform/hero-2.jpg",
                        "/images/platform/hero-3.jpg"
                    ],
                    "autoPlayInterval" => 5000,
                    "showPauseButton" => true
                ],
                "buttons" => [
                    "primary" => [
                        "text" => "Start Free Trial",
                        "link" => "/platform/register",
                        "icon" => "ArrowRight"
                    ],
                    "secondary" => [
                        "text" => "Schedule Demo",
                        "link" => "/platform/contact",
                        "icon" => "Calendar"
                    ]
                ]
            ],
            "features" => [
                "enabled" => true,
                "title" => "Enterprise Platform Features",
                "subtitle" => "Comprehensive business management tools designed for scalability and performance",
                "items" => [
                    [
                        "icon" => "Users",
                        "title" => "Multi-Tenant Architecture",
                        "description" => "Secure tenant isolation with enterprise-grade data protection and compliance"
                    ],
                    [
                        "icon" => "Shield",
                        "title" => "Advanced Security",
                        "description" => "Role-based access control, audit trails, and comprehensive security features"
                    ],
                    [
                        "icon" => "BarChart3",
                        "title" => "Business Analytics",
                        "description" => "Real-time dashboards, reporting, and business intelligence capabilities"
                    ],
                    [
                        "icon" => "Cloud", 
                        "title" => "Cloud Infrastructure",
                        "description" => "Scalable cloud deployment with high availability and disaster recovery"
                    ]
                ]
            ],
            "pricing" => [
                "enabled" => true,
                "title" => "Flexible Pricing Plans",
                "subtitle" => "Choose the plan that fits your business needs",
                "plans" => [
                    [
                        "name" => "Starter",
                        "price" => "$49",
                        "period" => "per month",
                        "features" => [
                            "Up to 5 users",
                            "Basic features",
                            "Email support",
                            "10GB storage"
                        ]
                    ],
                    [
                        "name" => "Professional", 
                        "price" => "$99",
                        "period" => "per month",
                        "featured" => true,
                        "features" => [
                            "Up to 50 users",
                            "Advanced features",
                            "Priority support",
                            "100GB storage",
                            "Custom integrations"
                        ]
                    ],
                    [
                        "name" => "Enterprise",
                        "price" => "Custom",
                        "period" => "contact us",
                        "features" => [
                            "Unlimited users",
                            "All features",
                            "24/7 dedicated support",
                            "Unlimited storage",
                            "Custom development"
                        ]
                    ]
                ]
            ],
            "testimonials" => [
                "enabled" => true,
                "title" => "What Our Customers Say",
                "items" => [
                    [
                        "name" => "John Smith",
                        "role" => "CTO",
                        "company" => "Tech Innovations Inc",
                        "content" => "CanvaStack has transformed our business operations. The multi-tenant architecture is exactly what we needed for our SaaS product.",
                        "rating" => 5,
                        "image" => "/images/testimonials/platform-client-1.jpg"
                    ]
                ]
            ],
            "seo" => [
                "title" => "CanvaStack Stencil - Enterprise Multi-Tenant Platform",
                "description" => "Powerful multi-tenant business platform with enterprise-grade features. Scalable SaaS architecture for modern businesses.",
                "keywords" => ["multi-tenant platform", "SaaS platform", "enterprise software"],
                "ogImage" => "/images/platform/og-image-home.jpg"
            ]
        ];

        DB::table('platform_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'title' => 'Platform Homepage',
            'slug' => 'home',
            'description' => 'CanvaStack Stencil Platform Homepage',
            'content' => json_encode($content),
            'template' => 'platform-home',
            'meta_data' => json_encode(['featured' => true, 'priority' => 1]),
            'status' => 'published',
            'page_type' => 'home',
            'is_homepage' => true,
            'sort_order' => 1,
            'language' => 'en',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createPlatformAbout(): void
    {
        $content = [
            "hero" => [
                "title" => "About CanvaStack",
                "subtitle" => "Pioneering the future of multi-tenant business platforms",
                "image" => "/images/platform/about-hero.jpg"
            ],
            "company" => [
                "enabled" => true,
                "title" => "Our Mission",
                "description" => "We're building the next generation of business platforms that empower organizations to scale efficiently while maintaining security and performance at enterprise level.",
                "founded" => "2020",
                "location" => "Global",
                "employees" => "50+",
                "customers" => "1000+"
            ],
            "values" => [
                "enabled" => true,
                "title" => "Our Core Values",
                "items" => [
                    "Innovation: Continuously pushing the boundaries of what's possible in multi-tenant architecture",
                    "Security: Enterprise-grade security and compliance built into every aspect of our platform",
                    "Scalability: Designed to grow with your business from startup to enterprise"
                ]
            ],
            "seo" => [
                "title" => "About CanvaStack - Multi-Tenant Platform Company",
                "description" => "Learn about CanvaStack's mission to revolutionize business platforms with scalable multi-tenant architecture.",
                "keywords" => ["about canvastack", "multi-tenant company", "platform company"]
            ]
        ];

        DB::table('platform_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'title' => 'About CanvaStack',
            'slug' => 'about',
            'description' => 'About CanvaStack Platform',
            'content' => json_encode($content),
            'template' => 'platform-about',
            'meta_data' => json_encode(['featured' => true, 'priority' => 2]),
            'status' => 'published', 
            'page_type' => 'about',
            'is_homepage' => false,
            'sort_order' => 2,
            'language' => 'en',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createPlatformContact(): void
    {
        $content = [
            "hero" => [
                "title" => "Contact Us",
                "subtitle" => "Get in touch with our platform experts"
            ],
            "contactInfo" => [
                "enabled" => true,
                "items" => [
                    [
                        "icon" => "MapPin",
                        "title" => "Address", 
                        "content" => "123 Tech Street, Innovation District, San Francisco, CA 94105"
                    ],
                    [
                        "icon" => "Phone",
                        "title" => "Phone",
                        "content" => "+1 (555) 123-4567"
                    ],
                    [
                        "icon" => "Mail",
                        "title" => "Email",
                        "content" => "contact@canvastack.com"
                    ]
                ]
            ],
            "seo" => [
                "title" => "Contact CanvaStack - Platform Support & Sales",
                "description" => "Get in touch with our platform experts for demos, support, and enterprise solutions.",
                "keywords" => ["contact canvastack", "platform support", "enterprise sales"]
            ]
        ];

        DB::table('platform_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'title' => 'Contact Us',
            'slug' => 'contact',
            'description' => 'Contact CanvaStack Platform',
            'content' => json_encode($content),
            'template' => 'platform-contact',
            'meta_data' => json_encode(['featured' => true, 'priority' => 3]),
            'status' => 'published',
            'page_type' => 'contact',
            'is_homepage' => false,
            'sort_order' => 3,
            'language' => 'en',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createPlatformFAQ(): void
    {
        $content = [
            "hero" => [
                "title" => "Platform FAQ",
                "subtitle" => "Frequently asked questions about CanvaStack platform"
            ],
            "categories" => [
                [
                    "id" => "platform",
                    "category" => "Platform Features",
                    "questions" => [
                        [
                            "q" => "What is multi-tenant architecture?",
                            "a" => "Multi-tenant architecture allows multiple customers (tenants) to share the same application instance while keeping their data completely isolated and secure."
                        ]
                    ]
                ]
            ],
            "seo" => [
                "title" => "Platform FAQ - CanvaStack Support",
                "description" => "Find answers to common questions about CanvaStack multi-tenant platform features and capabilities.",
                "keywords" => ["platform faq", "canvastack questions", "multi-tenant faq"]
            ]
        ];

        DB::table('platform_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'title' => 'Platform FAQ',
            'slug' => 'faq',
            'description' => 'CanvaStack Platform FAQ',
            'content' => json_encode($content),
            'template' => 'platform-faq',
            'meta_data' => json_encode(['featured' => true, 'priority' => 4]),
            'status' => 'published',
            'page_type' => 'faq',
            'is_homepage' => false,
            'sort_order' => 4,
            'language' => 'en',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createPlatformFeaturePages(): void
    {
        $featurePages = [
            ['title' => 'Multi-Tenant Architecture', 'slug' => 'features/multi-tenant'],
            ['title' => 'Security & Compliance', 'slug' => 'features/security'],
            ['title' => 'Business Analytics', 'slug' => 'features/analytics'],
            ['title' => 'API Integration', 'slug' => 'features/api'],
            ['title' => 'Custom Development', 'slug' => 'features/custom'],
            ['title' => 'Cloud Infrastructure', 'slug' => 'features/cloud'],
            ['title' => 'Mobile Applications', 'slug' => 'features/mobile'],
            ['title' => 'Third-party Integrations', 'slug' => 'features/integrations'],
            ['title' => 'Backup & Recovery', 'slug' => 'features/backup'],
            ['title' => 'Performance Monitoring', 'slug' => 'features/monitoring']
        ];

        foreach ($featurePages as $index => $page) {
            $content = [
                "hero" => [
                    "title" => $page['title'],
                    "subtitle" => "Enterprise-grade " . strtolower($page['title']) . " for modern businesses"
                ],
                "description" => "Comprehensive overview of " . strtolower($page['title']) . " features and capabilities.",
                "benefits" => [
                    "Enterprise Security",
                    "Scalable Architecture",
                    "24/7 Support",
                    "API Access"
                ],
                "seo" => [
                    "title" => $page['title'] . " - CanvaStack Platform",
                    "description" => "Learn about " . strtolower($page['title']) . " features in CanvaStack platform.",
                    "keywords" => [str_replace(' ', '-', strtolower($page['title'])), "platform features"]
                ]
            ];

            DB::table('platform_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'title' => $page['title'],
                'slug' => $page['slug'],
                'description' => 'Platform feature: ' . $page['title'],
                'content' => json_encode($content),
                'template' => 'platform-feature',
                'meta_data' => json_encode(['category' => 'features', 'featured' => $index < 5]),
                'status' => 'published',
                'page_type' => 'services',
                'is_homepage' => false,
                'sort_order' => 10 + $index,
                'language' => 'en',
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);
        }
    }

    private function createPlatformBlogPages(): void
    {
        $blogPosts = [
            'The Future of Multi-Tenant SaaS Architecture',
            'Best Practices for Enterprise Security',
            'Scaling Your Business with Cloud Platforms',
            'API Design Principles for Modern Applications',
            'Database Performance Optimization Tips',
            'Microservices vs Monolithic Architecture',
            'DevOps Best Practices for SaaS',
            'Building Resilient Distributed Systems',
            'Data Privacy and GDPR Compliance',
            'Container Orchestration with Kubernetes',
            'Monitoring and Observability Strategies',
            'Automated Testing for Enterprise Applications'
        ];

        foreach ($blogPosts as $index => $title) {
            $slug = 'blog/' . \Illuminate\Support\Str::slug($title);
            
            $content = [
                "hero" => [
                    "title" => $title,
                    "subtitle" => "Insights and best practices from CanvaStack engineering team",
                    "author" => "CanvaStack Team",
                    "published_date" => Carbon::now()->subDays(rand(1, 180))->toDateString(),
                    "reading_time" => rand(5, 12) . " minutes"
                ],
                "content" => [
                    "intro" => "Deep dive into " . strtolower($title) . " with practical examples and implementation strategies.",
                    "sections" => [
                        ["heading" => "Introduction", "content" => "Overview of the topic and its importance in modern software development."],
                        ["heading" => "Technical Implementation", "content" => "Detailed technical approach with code examples and best practices."],
                        ["heading" => "Case Studies", "content" => "Real-world examples from successful implementations."],
                        ["heading" => "Conclusion", "content" => "Key takeaways and recommendations for implementation."]
                    ]
                ],
                "tags" => ["platform", "architecture", "best-practices", "engineering"],
                "seo" => [
                    "title" => $title . " | CanvaStack Engineering Blog",
                    "description" => "Technical insights about " . strtolower($title) . " from CanvaStack engineering team.",
                    "keywords" => ["platform blog", str_replace(' ', '-', strtolower($title)), "technical articles"]
                ]
            ];

            DB::table('platform_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'title' => $title,
                'slug' => $slug,
                'description' => 'Platform blog post: ' . $title,
                'content' => json_encode($content),
                'template' => 'platform-blog',
                'meta_data' => json_encode([
                    'category' => 'blog',
                    'featured' => $index < 4,
                    'author' => 'CanvaStack Team',
                    'reading_time' => rand(5, 12)
                ]),
                'status' => rand(0, 10) > 1 ? 'published' : 'draft', // 90% published
                'page_type' => 'services',
                'is_homepage' => false,
                'sort_order' => 100 + $index,
                'language' => 'en',
                'published_at' => rand(0, 10) > 1 ? Carbon::now()->subDays(rand(1, 180)) : null,
                'created_at' => Carbon::now()->subDays(rand(1, 200)),
                'updated_at' => Carbon::now()->subDays(rand(1, 30))
            ]);
        }
    }
}