<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Company Branding Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all branding-related configuration for PDF documents,
    | emails, and other customer-facing materials. Update these values to
    | customize the appearance of your documents.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    */

    'company_name' => env('BRANDING_COMPANY_NAME', config('app.name')),
    
    'tagline' => env('BRANDING_TAGLINE', 'Excellence in Custom Etching Solutions'),
    
    'address' => env('BRANDING_ADDRESS', 'Jl. Industri No. 123, Jakarta 12345, Indonesia'),
    
    'phone' => env('BRANDING_PHONE', '+62 21 1234 5678'),
    
    'email' => env('BRANDING_EMAIL', 'info@custometchingxenial.com'),
    
    'website' => env('BRANDING_WEBSITE', 'https://www.custometchingxenial.com'),
    
    'tax_id' => env('BRANDING_TAX_ID', '01.234.567.8-901.000'),

    /*
    |--------------------------------------------------------------------------
    | Logo Configuration
    |--------------------------------------------------------------------------
    |
    | Path to company logo relative to public directory.
    | Recommended size: 200x80 pixels (max)
    | Supported formats: PNG, JPG, SVG
    |
    */

    'logo_path' => env('BRANDING_LOGO_PATH', 'images/branding/company-logo.png'),
    
    'logo_width' => env('BRANDING_LOGO_WIDTH', 200),
    
    'logo_height' => env('BRANDING_LOGO_HEIGHT', 80),

    /*
    |--------------------------------------------------------------------------
    | Brand Colors
    |--------------------------------------------------------------------------
    |
    | Primary and secondary brand colors for use in documents and emails.
    | Use hex color codes.
    |
    */

    'primary_color' => env('BRANDING_PRIMARY_COLOR', '#4F46E5'), // Indigo
    
    'secondary_color' => env('BRANDING_SECONDARY_COLOR', '#059669'), // Green
    
    'accent_color' => env('BRANDING_ACCENT_COLOR', '#DC2626'), // Red

    /*
    |--------------------------------------------------------------------------
    | Document Footer
    |--------------------------------------------------------------------------
    |
    | Additional text to display in document footers.
    |
    */

    'footer_text' => env('BRANDING_FOOTER_TEXT', 'Quality Etching Services Since 2020'),

    /*
    |--------------------------------------------------------------------------
    | Social Media & Contact
    |--------------------------------------------------------------------------
    */

    'facebook' => env('BRANDING_FACEBOOK', null),
    
    'instagram' => env('BRANDING_INSTAGRAM', null),
    
    'linkedin' => env('BRANDING_LINKEDIN', null),
    
    'twitter' => env('BRANDING_TWITTER', null),

    /*
    |--------------------------------------------------------------------------
    | Bank Details (for payment instructions)
    |--------------------------------------------------------------------------
    */

    'bank_details' => [
        'bank_name' => env('BRANDING_BANK_NAME', 'Bank Central Asia (BCA)'),
        'account_name' => env('BRANDING_BANK_ACCOUNT_NAME', 'PT Custom Etching Xenial'),
        'account_number' => env('BRANDING_BANK_ACCOUNT_NUMBER', '1234567890'),
        'swift_code' => env('BRANDING_BANK_SWIFT_CODE', 'CENAIDJA'),
        'branch' => env('BRANDING_BANK_BRANCH', 'Jakarta Pusat'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Settings
    |--------------------------------------------------------------------------
    */

    'document_settings' => [
        'show_logo' => env('BRANDING_SHOW_LOGO', true),
        'show_tagline' => env('BRANDING_SHOW_TAGLINE', true),
        'show_website' => env('BRANDING_SHOW_WEBSITE', true),
        'show_social_media' => env('BRANDING_SHOW_SOCIAL_MEDIA', false),
    ],

];
