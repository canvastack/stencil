<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Domain\Content\Entities\TenantPage;

class TenantPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
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
                ],
                'team' => [
                    'title' => 'Meet Our Team',
                    'members' => [
                        [
                            'name' => 'John Smith',
                            'position' => 'CEO & Founder',
                            'bio' => 'With over 15 years of industry experience, John leads our company with vision and expertise.',
                            'image' => '/images/team/john.jpg'
                        ],
                        [
                            'name' => 'Sarah Johnson',
                            'position' => 'Operations Manager',
                            'bio' => 'Sarah ensures smooth operations and maintains our high standards of service delivery.',
                            'image' => '/images/team/sarah.jpg'
                        ]
                    ]
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
                    'email' => 'info@business.com',
                    'address' => [
                        'street' => '123 Business Street',
                        'city' => 'Business City',
                        'state' => 'BC',
                        'zip' => '12345',
                        'country' => 'USA'
                    ]
                ],
                'business_hours' => [
                    'title' => 'Business Hours',
                    'hours' => [
                        'Monday - Friday' => '9:00 AM - 6:00 PM',
                        'Saturday' => '10:00 AM - 4:00 PM',
                        'Sunday' => 'Closed'
                    ]
                ],
                'contact_form' => [
                    'title' => 'Send us a Message',
                    'fields' => ['name', 'email', 'subject', 'message']
                ]
            ],
            'status' => 'published',
            'page_type' => 'contact',
            'sort_order' => 3,
            'published_at' => now()
        ]);

        TenantPage::create([
            'title' => 'Frequently Asked Questions',
            'slug' => 'faq',
            'description' => 'Common questions and answers',
            'content' => [
                'intro' => [
                    'title' => 'Frequently Asked Questions',
                    'description' => 'Find answers to the most common questions about our services.'
                ],
                'categories' => [
                    [
                        'title' => 'General Questions',
                        'questions' => [
                            [
                                'question' => 'What services do you offer?',
                                'answer' => 'We offer a comprehensive range of professional services tailored to meet your business needs.'
                            ],
                            [
                                'question' => 'How can I get a quote?',
                                'answer' => 'You can request a quote by contacting us through our contact form or calling us directly.'
                            ]
                        ]
                    ],
                    [
                        'title' => 'Billing & Payment',
                        'questions' => [
                            [
                                'question' => 'What payment methods do you accept?',
                                'answer' => 'We accept various payment methods including credit cards, bank transfers, and online payments.'
                            ],
                            [
                                'question' => 'When is payment due?',
                                'answer' => 'Payment terms are typically net 30 days from the invoice date.'
                            ]
                        ]
                    ]
                ]
            ],
            'status' => 'published',
            'page_type' => 'faq',
            'sort_order' => 4,
            'published_at' => now()
        ]);
    }
}