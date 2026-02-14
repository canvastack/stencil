<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PDF Library
    |--------------------------------------------------------------------------
    |
    | The PDF library to use for generating purchase order PDFs.
    | Options: 'dompdf', 'snappy'
    |
    */
    'pdf_library' => env('PO_PDF_LIBRARY', 'dompdf'),

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Configure where purchase order PDFs are stored.
    |
    */
    'storage_disk' => env('PO_STORAGE_DISK', 'local'),
    'storage_path' => 'purchase-orders',

    /*
    |--------------------------------------------------------------------------
    | PO Validity
    |--------------------------------------------------------------------------
    |
    | Number of days a purchase order remains valid after issue date.
    |
    */
    'validity_days' => 30,

    /*
    |--------------------------------------------------------------------------
    | Tax Rate
    |--------------------------------------------------------------------------
    |
    | Default tax rate (PPN - Pajak Pertambahan Nilai) in Indonesia.
    | 0.11 = 11%
    |
    */
    'tax_rate' => 0.11,

    /*
    |--------------------------------------------------------------------------
    | Default Payment Terms
    |--------------------------------------------------------------------------
    |
    | Default payment terms for purchase orders.
    |
    */
    'default_payment_terms' => [
        'down_payment_percentage' => 50,
        'balance_on_delivery' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Watermark Configuration
    |--------------------------------------------------------------------------
    |
    | Configure PDF watermark settings.
    |
    */
    'watermark' => [
        'enabled' => env('PO_WATERMARK_ENABLED', false),
        'text' => 'CONFIDENTIAL',
        'opacity' => 0.1,
    ],

    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    |
    | Default company information for purchase orders.
    | This can be overridden per tenant.
    |
    */
    'company' => [
        'name' => 'PT Custom Etching Xenial',
        'address' => 'Jl. Industri No. 123, Jakarta',
        'phone' => '+62 21 1234 5678',
        'email' => 'orders@etchinx.com',
        'tax_id' => '01.234.567.8-901.000', // NPWP
        'logo_path' => 'images/company-logo.png',
    ],

    /*
    |--------------------------------------------------------------------------
    | Bank Account Information
    |--------------------------------------------------------------------------
    |
    | Bank account details for payment instructions.
    |
    */
    'bank_account' => [
        'bank_name' => 'Bank Mandiri',
        'account_number' => '1234567890',
        'account_holder' => 'PT Custom Etching Xenial',
        'swift_code' => 'BMRIIDJA',
    ],

    /*
    |--------------------------------------------------------------------------
    | Terms and Conditions
    |--------------------------------------------------------------------------
    |
    | Default terms and conditions for purchase orders.
    |
    */
    'terms' => [
        'warranty_days' => 30,
        'late_delivery_penalty' => false,
        'quality_inspection' => true,
        'defect_replacement' => true,
    ],
];
