<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PlatformPage;
use Illuminate\Support\Facades\File;

class PlatformPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Path to mock data files (assuming they're accessible)
        $mockDataPath = base_path('../../src/services/mock/data');
        
        // Define pages to import
        $pages = [
            'home' => 'page-content-home.json',
            'about' => 'page-content-about.json',
            'contact' => 'page-content-contact.json',
            'faq' => 'page-content-faq.json'
        ];

        foreach ($pages as $slug => $filename) {
            $filePath = $mockDataPath . '/' . $filename;
            
            // Check if file exists
            if (File::exists($filePath)) {
                $jsonContent = File::get($filePath);
                $data = json_decode($jsonContent, true);
                
                if ($data) {
                    PlatformPage::updateOrCreate(
                        ['page_slug' => $slug],
                        [
                            'content' => $data['content'],
                            'status' => $data['status'] ?? 'published',
                            'published_at' => $data['publishedAt'] ?? now(),
                            'version' => $data['version'] ?? 1,
                            'previous_version' => $data['previousVersion'],
                            'updated_by' => $data['updatedBy']
                        ]
                    );
                    
                    $this->command->info("Imported {$slug} page content from {$filename}");
                } else {
                    $this->command->error("Failed to parse JSON from {$filename}");
                }
            } else {
                // Fallback: Create minimal content if mock file doesn't exist
                $this->createFallbackContent($slug);
            }
        }
    }

    /**
     * Create fallback content for pages when mock files are not available
     */
    private function createFallbackContent(string $slug): void
    {
        $fallbackContent = $this->getFallbackContentBySlug($slug);
        
        PlatformPage::updateOrCreate(
            ['page_slug' => $slug],
            [
                'content' => $fallbackContent,
                'status' => 'published',
                'published_at' => now(),
                'version' => 1,
                'previous_version' => null,
                'updated_by' => 'system'
            ]
        );
        
        $this->command->info("Created fallback content for {$slug} page");
    }

    /**
     * Get fallback content structure based on slug
     */
    private function getFallbackContentBySlug(string $slug): array
    {
        switch ($slug) {
            case 'home':
                return [
                    'hero' => [
                        'title' => [
                            'static' => 'Welcome to CanvaStencil',
                            'typing' => [
                                'Create stunning websites',
                                'Manage your business online',
                                'Grow your customer base'
                            ]
                        ],
                        'subtitle' => 'Professional templates, powerful features, no coding required.',
                        'buttons' => [
                            'primary' => [
                                'text' => 'Get Started',
                                'link' => '/register',
                                'icon' => 'ArrowRight'
                            ]
                        ]
                    ],
                    'seo' => [
                        'title' => 'CanvaStencil - Build Your Business Website',
                        'description' => 'Create professional websites with our drag-and-drop builder.',
                        'keywords' => ['website builder', 'business website', 'templates']
                    ]
                ];
                
            case 'about':
                return [
                    'hero' => [
                        'title' => 'About CanvaStencil',
                        'subtitle' => 'Empowering businesses worldwide with professional website solutions.'
                    ],
                    'company' => [
                        'enabled' => true,
                        'title' => 'Our Company',
                        'description' => 'We help businesses create stunning websites and grow their online presence.',
                    ],
                    'seo' => [
                        'title' => 'About CanvaStencil',
                        'description' => 'Learn about our mission to help businesses succeed online.',
                        'keywords' => ['about', 'company', 'mission']
                    ]
                ];
                
            case 'contact':
                return [
                    'hero' => [
                        'title' => 'Contact Us',
                        'subtitle' => 'Get in touch with our team for support and inquiries.'
                    ],
                    'contact_info' => [
                        'email' => 'support@canvastencil.com',
                        'phone' => '+1 (555) 123-4567',
                        'address' => '123 Business Ave, Tech City, TC 12345'
                    ],
                    'seo' => [
                        'title' => 'Contact CanvaStencil',
                        'description' => 'Get in touch with our support team.',
                        'keywords' => ['contact', 'support', 'help']
                    ]
                ];
                
            case 'faq':
                return [
                    'hero' => [
                        'title' => 'Frequently Asked Questions',
                        'subtitle' => 'Find answers to common questions about our platform.'
                    ],
                    'faqs' => [
                        [
                            'question' => 'How do I get started?',
                            'answer' => 'Simply sign up for an account and choose a template to begin building your website.'
                        ],
                        [
                            'question' => 'Can I customize my website?',
                            'answer' => 'Yes! Our platform offers extensive customization options.'
                        ]
                    ],
                    'seo' => [
                        'title' => 'FAQ - CanvaStencil',
                        'description' => 'Frequently asked questions about our website builder.',
                        'keywords' => ['faq', 'questions', 'help']
                    ]
                ];
                
            default:
                return [
                    'hero' => [
                        'title' => ucfirst($slug),
                        'subtitle' => "Welcome to the {$slug} page."
                    ],
                    'seo' => [
                        'title' => ucfirst($slug) . ' - CanvaStencil',
                        'description' => "The {$slug} page of CanvaStencil.",
                        'keywords' => [$slug]
                    ]
                ];
        }
    }
}