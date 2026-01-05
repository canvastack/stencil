<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\ProductFormTemplate;

class ProductFormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📋 Seeding Product Form Templates...');

        $templates = $this->getTemplates();

        $createdCount = 0;
        foreach ($templates as $templateData) {
            ProductFormTemplate::updateOrCreate(
                [
                    'name' => $templateData['name'],
                    'category' => $templateData['category'],
                    'tenant_id' => null,
                ],
                [
                    'uuid' => Str::uuid()->toString(),
                    'description' => $templateData['description'],
                    'form_schema' => $templateData['form_schema'],
                    'validation_rules' => $templateData['validation_rules'] ?? null,
                    'conditional_logic' => $templateData['conditional_logic'] ?? null,
                    'is_public' => true,
                    'is_system' => true,
                    'preview_image_url' => $templateData['preview_image_url'] ?? null,
                    'tags' => $templateData['tags'] ?? null,
                    'usage_count' => 0,
                    'created_by' => null,
                    'updated_by' => null,
                ]
            );
            $createdCount++;
        }

        $this->command->info("   ✅ Created {$createdCount} form templates");
    }

    private function getTemplates(): array
    {
        return [
            $this->defaultProductOrderForm(),
            $this->metalPlakatForm(),
            $this->glassTrophyForm(),
            $this->corporateAwardForm(),
            $this->acrylicSignageForm(),
            $this->customDesignForm(),
            $this->quoteRequestForm(),
            $this->personalizedGiftForm(),
        ];
    }

    private function defaultProductOrderForm(): array
    {
        return [
            'name' => 'Default Product Order Form',
            'description' => 'Standard product order form matching ProductDetail.tsx - 13 comprehensive fields including customer info, product specs, and customization options',
            'category' => 'general',
            'tags' => ['default', 'standard', 'comprehensive', 'etching'],
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Form Pemesanan',
                'description' => 'Lengkapi form berikut untuk melakukan pemesanan produk',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'text',
                        'name' => 'name',
                        'label' => 'Nama Lengkap',
                        'placeholder' => 'Masukkan nama lengkap',
                        'required' => true,
                        'validation' => [
                            'minLength' => 3,
                            'maxLength' => 100,
                        ],
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'email',
                        'name' => 'email',
                        'label' => 'Email',
                        'placeholder' => 'contoh@email.com',
                        'required' => true,
                        'validation' => [
                            'email' => true,
                        ],
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'tel',
                        'name' => 'phone',
                        'label' => 'No. Telepon',
                        'placeholder' => '08xxxxxxxxxx',
                        'required' => true,
                        'validation' => [
                            'pattern' => '^(\\+62|62|0)[0-9]{9,12}$',
                        ],
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'number',
                        'name' => 'quantity',
                        'label' => 'Jumlah Pesanan',
                        'required' => true,
                        'min' => 1,
                        'max' => 10000,
                        'defaultValue' => 1,
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'text',
                        'name' => 'productType',
                        'label' => 'Tipe Produk',
                        'required' => true,
                        'disabled' => true,
                        'helpText' => 'Otomatis terisi dari produk yang dipilih',
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'select',
                        'name' => 'size',
                        'label' => 'Ukuran',
                        'placeholder' => 'Pilih ukuran',
                        'required' => true,
                        'options' => [
                            ['value' => 'alu-standar', 'label' => 'Alu Standar'],
                            ['value' => '10x15', 'label' => '10 x 15 cm'],
                            ['value' => '15x20', 'label' => '15 x 20 cm'],
                            ['value' => '20x30', 'label' => '20 x 30 cm'],
                            ['value' => '25x35', 'label' => '25 x 35 cm'],
                            ['value' => '30x40', 'label' => '30 x 40 cm'],
                            ['value' => 'custom', 'label' => 'Custom Size'],
                        ],
                        'order' => 6,
                    ],
                    [
                        'id' => 'field_007',
                        'type' => 'select',
                        'name' => 'bahan',
                        'label' => 'Bahan',
                        'placeholder' => 'Pilih bahan',
                        'required' => true,
                        'options' => [
                            ['value' => 'alu-standar', 'label' => 'Alu Standar'],
                            ['value' => 'stainless-steel', 'label' => 'Stainless Steel'],
                            ['value' => 'kuningan', 'label' => 'Kuningan'],
                            ['value' => 'aluminium', 'label' => 'Aluminium'],
                            ['value' => 'tembaga', 'label' => 'Tembaga'],
                            ['value' => 'akrilik', 'label' => 'Akrilik'],
                        ],
                        'order' => 7,
                    ],
                    [
                        'id' => 'field_008',
                        'type' => 'select',
                        'name' => 'kualitas',
                        'label' => 'Kualitas',
                        'placeholder' => 'Pilih kualitas',
                        'required' => true,
                        'options' => [
                            ['value' => 'alu-standar', 'label' => 'Alu Standar'],
                            ['value' => 'standard', 'label' => 'Standard'],
                            ['value' => 'premium', 'label' => 'Premium'],
                            ['value' => 'professional', 'label' => 'Professional'],
                            ['value' => 'luxury', 'label' => 'Luxury'],
                        ],
                        'defaultValue' => 'standard',
                        'order' => 8,
                    ],
                    [
                        'id' => 'field_009',
                        'type' => 'text',
                        'name' => 'ketebalan',
                        'label' => 'Ketebalan',
                        'placeholder' => 'Contoh: 2mm, 3mm, dll',
                        'required' => false,
                        'order' => 9,
                    ],
                    [
                        'id' => 'field_010',
                        'type' => 'color',
                        'name' => 'warna',
                        'label' => 'Warna',
                        'defaultValue' => '#FFFFFF',
                        'required' => true,
                        'presetColors' => [
                            '#FFFFFF', '#000000', '#FF0000', '#00FF00', 
                            '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                            '#C0C0C0', '#808080', '#800000', '#808000',
                            '#008000', '#800080', '#008080', '#000080'
                        ],
                        'order' => 10,
                    ],
                    [
                        'id' => 'field_011',
                        'type' => 'file',
                        'name' => 'designFile',
                        'label' => 'File Upload Design (Opsional)',
                        'required' => false,
                        'accept' => 'image/*',
                        'maxSize' => 10485760,
                        'helpText' => 'Upload file design dalam format gambar',
                        'order' => 11,
                    ],
                    [
                        'id' => 'field_012',
                        'type' => 'repeater',
                        'name' => 'customTexts',
                        'label' => 'Teks Custom (Opsional)',
                        'addButtonText' => '+ Tambah Teks',
                        'minItems' => 0,
                        'maxItems' => 10,
                        'required' => false,
                        'helpText' => 'Tambahkan teks custom dengan letak dan posisi yang diinginkan pada produk etching',
                        'fields' => [
                            [
                                'id' => 'field_012_text',
                                'type' => 'text',
                                'name' => 'text',
                                'label' => 'Teks',
                                'placeholder' => 'Masukkan teks custom',
                                'required' => true,
                            ],
                            [
                                'id' => 'field_012_placement',
                                'type' => 'select',
                                'name' => 'placement',
                                'label' => 'Letak Teks',
                                'required' => true,
                                'options' => [
                                    ['value' => 'depan', 'label' => 'Depan'],
                                    ['value' => 'belakang', 'label' => 'Belakang'],
                                ],
                                'defaultValue' => 'depan',
                            ],
                            [
                                'id' => 'field_012_position',
                                'type' => 'select',
                                'name' => 'position',
                                'label' => 'Posisi Teks',
                                'required' => true,
                                'options' => [
                                    ['value' => 'atas', 'label' => 'Atas'],
                                    ['value' => 'bawah', 'label' => 'Bawah'],
                                    ['value' => 'kiri', 'label' => 'Kiri'],
                                    ['value' => 'kanan', 'label' => 'Kanan'],
                                    ['value' => 'tengah', 'label' => 'Tengah'],
                                ],
                                'defaultValue' => 'atas',
                            ],
                            [
                                'id' => 'field_012_color',
                                'type' => 'color',
                                'name' => 'color',
                                'label' => 'Warna Teks',
                                'required' => true,
                                'defaultValue' => '#000000',
                                'presetColors' => [
                                    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
                                    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
                                ],
                            ],
                        ],
                        'order' => 12,
                    ],
                    [
                        'id' => 'field_013',
                        'type' => 'wysiwyg',
                        'name' => 'notes',
                        'label' => 'Catatan Tambahan',
                        'placeholder' => 'Catatan khusus untuk pesanan Anda...',
                        'required' => true,
                        'maxLength' => 5000,
                        'toolbar' => [
                            'bold', 'italic', 'underline', 'strikethrough',
                            'heading', 'bulletList', 'orderedList',
                            'link', 'blockquote', 'codeBlock',
                            'undo', 'redo'
                        ],
                        'order' => 13,
                    ],
                ],
                'submitButton' => [
                    'text' => 'Pesan Sekarang',
                    'position' => 'center',
                    'style' => 'primary',
                ],
            ],
        ];
    }

    private function metalPlakatForm(): array
    {
        return [
            'name' => 'Metal Plakat Order Form',
            'description' => 'Specialized form for metal plaque/plakat orders with etching specifications',
            'category' => 'metal_etching',
            'tags' => 'plakat,metal,etching,engraving',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Pemesanan Plakat Logam',
                'description' => 'Form khusus untuk pemesanan plakat dengan laser etching',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'select',
                        'name' => 'plakat_type',
                        'label' => 'Jenis Plakat',
                        'required' => true,
                        'options' => [
                            ['value' => 'wall_mount', 'label' => 'Plakat Dinding'],
                            ['value' => 'standing', 'label' => 'Plakat Standing'],
                            ['value' => 'desktop', 'label' => 'Plakat Desktop'],
                        ],
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'radio',
                        'name' => 'metal_type',
                        'label' => 'Jenis Logam',
                        'required' => true,
                        'options' => [
                            ['value' => 'stainless-steel-304', 'label' => 'Stainless Steel 304 (Anti Karat)'],
                            ['value' => 'stainless-steel-316', 'label' => 'Stainless Steel 316 (Marine Grade)'],
                            ['value' => 'brass-gold', 'label' => 'Kuningan Emas (Brass Gold)'],
                            ['value' => 'brass-antique', 'label' => 'Kuningan Antik (Brass Antique)'],
                        ],
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'select',
                        'name' => 'thickness',
                        'label' => 'Ketebalan Plat',
                        'required' => true,
                        'options' => [
                            ['value' => '1mm', 'label' => '1mm (Standard)'],
                            ['value' => '2mm', 'label' => '2mm (Premium)'],
                            ['value' => '3mm', 'label' => '3mm (Professional)'],
                        ],
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'select',
                        'name' => 'size',
                        'label' => 'Ukuran Plakat',
                        'required' => true,
                        'options' => [
                            ['value' => '15x20', 'label' => '15 x 20 cm'],
                            ['value' => '20x25', 'label' => '20 x 25 cm'],
                            ['value' => '20x30', 'label' => '20 x 30 cm'],
                            ['value' => '25x30', 'label' => '25 x 30 cm'],
                            ['value' => '30x40', 'label' => '30 x 40 cm'],
                            ['value' => 'custom', 'label' => 'Custom (specify in notes)'],
                        ],
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'select',
                        'name' => 'finishing',
                        'label' => 'Finishing Surface',
                        'required' => true,
                        'options' => [
                            ['value' => 'mirror', 'label' => 'Mirror (Cermin/Glossy)'],
                            ['value' => 'brushed', 'label' => 'Brushed (Hairline/Satin)'],
                            ['value' => 'matte', 'label' => 'Matte (Doff)'],
                        ],
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'file',
                        'name' => 'design_artwork',
                        'label' => 'Upload Design / Artwork',
                        'required' => true,
                        'accept' => '.pdf,.ai,.cdr,.svg',
                        'maxSize' => 20971520,
                        'order' => 6,
                    ],
                    [
                        'id' => 'field_007',
                        'type' => 'textarea',
                        'name' => 'text_content',
                        'label' => 'Teks yang Akan Di-Etching',
                        'placeholder' => 'Masukkan teks lengkap yang akan di-etching pada plakat',
                        'required' => false,
                        'maxLength' => 1000,
                        'order' => 7,
                    ],
                    [
                        'id' => 'field_008',
                        'type' => 'checkbox',
                        'name' => 'additional_services',
                        'label' => 'Layanan Tambahan',
                        'required' => false,
                        'options' => [
                            ['value' => 'gold_filling', 'label' => 'Gold Filling (Isi Emas pada Etching)'],
                            ['value' => 'color_filling', 'label' => 'Color Filling (Isi Warna)'],
                            ['value' => 'frame_wood', 'label' => 'Frame Kayu'],
                            ['value' => 'stand_acrylic', 'label' => 'Stand Acrylic'],
                        ],
                        'order' => 8,
                    ],
                    [
                        'id' => 'field_009',
                        'type' => 'number',
                        'name' => 'quantity',
                        'label' => 'Jumlah Plakat',
                        'required' => true,
                        'min' => 1,
                        'max' => 500,
                        'defaultValue' => 1,
                        'order' => 9,
                    ],
                    [
                        'id' => 'field_010',
                        'type' => 'wysiwyg',
                        'name' => 'special_instructions',
                        'label' => 'Instruksi Khusus',
                        'placeholder' => 'Tambahkan detail khusus untuk order ini...',
                        'required' => false,
                        'order' => 10,
                    ],
                ],
            ],
        ];
    }

    private function glassTrophyForm(): array
    {
        return [
            'name' => 'Glass Trophy & Award Form',
            'description' => 'Order form for glass trophies and crystal awards with etching',
            'category' => 'glass_etching',
            'tags' => 'trophy,glass,crystal,award',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Pemesanan Trophy Kaca & Award',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'select',
                        'name' => 'trophy_type',
                        'label' => 'Jenis Trophy',
                        'required' => true,
                        'options' => [
                            ['value' => 'crystal_award', 'label' => 'Crystal Award (Premium)'],
                            ['value' => 'glass_trophy', 'label' => 'Glass Trophy (Standard)'],
                            ['value' => 'acrylic_award', 'label' => 'Acrylic Award (Budget)'],
                        ],
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'select',
                        'name' => 'shape',
                        'label' => 'Bentuk Trophy',
                        'required' => true,
                        'options' => [
                            ['value' => 'rectangle', 'label' => 'Persegi Panjang'],
                            ['value' => 'square', 'label' => 'Persegi'],
                            ['value' => 'oval', 'label' => 'Oval'],
                            ['value' => 'star', 'label' => 'Bintang'],
                            ['value' => 'custom', 'label' => 'Custom Shape'],
                        ],
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'select',
                        'name' => 'size',
                        'label' => 'Ukuran Trophy',
                        'required' => true,
                        'options' => [
                            ['value' => 'small', 'label' => 'Small (15 x 10 x 5 cm)'],
                            ['value' => 'medium', 'label' => 'Medium (20 x 15 x 8 cm)'],
                            ['value' => 'large', 'label' => 'Large (25 x 20 x 10 cm)'],
                            ['value' => 'xlarge', 'label' => 'Extra Large (30 x 25 x 12 cm)'],
                        ],
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'select',
                        'name' => 'etching_method',
                        'label' => 'Metode Etching',
                        'required' => true,
                        'options' => [
                            ['value' => 'laser', 'label' => 'Laser Etching (Detail Tinggi)'],
                            ['value' => 'sandblast', 'label' => 'Sandblast (Classic Look)'],
                        ],
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'file',
                        'name' => 'logo_design',
                        'label' => 'Upload Logo/Design',
                        'required' => false,
                        'accept' => '.png,.jpg,.svg,.ai,.pdf',
                        'maxSize' => 10485760,
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'textarea',
                        'name' => 'award_text',
                        'label' => 'Teks Award/Trophy',
                        'placeholder' => 'Contoh:\nAward of Excellence\nPresented to: John Doe\nDate: January 2026',
                        'required' => true,
                        'rows' => 5,
                        'order' => 6,
                    ],
                    [
                        'id' => 'field_007',
                        'type' => 'checkbox',
                        'name' => 'base_options',
                        'label' => 'Base Trophy',
                        'required' => false,
                        'options' => [
                            ['value' => 'wooden_base', 'label' => 'Wooden Base (Kayu Mahogany)'],
                            ['value' => 'metal_base', 'label' => 'Metal Base (Stainless)'],
                            ['value' => 'acrylic_base', 'label' => 'Acrylic Base (Clear)'],
                        ],
                        'order' => 7,
                    ],
                    [
                        'id' => 'field_008',
                        'type' => 'number',
                        'name' => 'quantity',
                        'label' => 'Jumlah Trophy',
                        'required' => true,
                        'min' => 1,
                        'max' => 100,
                        'defaultValue' => 1,
                        'order' => 8,
                    ],
                ],
            ],
        ];
    }

    private function corporateAwardForm(): array
    {
        return [
            'name' => 'Corporate Award & Recognition Form',
            'description' => 'Form for corporate awards, employee recognition, and achievement plaques',
            'category' => 'corporate',
            'tags' => 'corporate,award,recognition,employee',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Corporate Award & Recognition',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'text',
                        'name' => 'company_name',
                        'label' => 'Nama Perusahaan',
                        'required' => true,
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'select',
                        'name' => 'award_category',
                        'label' => 'Kategori Award',
                        'required' => true,
                        'options' => [
                            ['value' => 'employee_month', 'label' => 'Employee of the Month'],
                            ['value' => 'best_performance', 'label' => 'Best Performance'],
                            ['value' => 'years_service', 'label' => 'Years of Service'],
                            ['value' => 'achievement', 'label' => 'Special Achievement'],
                            ['value' => 'retirement', 'label' => 'Retirement Award'],
                        ],
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'repeater',
                        'name' => 'recipients',
                        'label' => 'Daftar Penerima Award',
                        'required' => true,
                        'minItems' => 1,
                        'maxItems' => 50,
                        'fields' => [
                            [
                                'type' => 'text',
                                'name' => 'recipient_name',
                                'label' => 'Nama Penerima',
                            ],
                            [
                                'type' => 'text',
                                'name' => 'position',
                                'label' => 'Jabatan',
                            ],
                            [
                                'type' => 'text',
                                'name' => 'department',
                                'label' => 'Departemen',
                            ],
                        ],
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'select',
                        'name' => 'material',
                        'label' => 'Material Award',
                        'required' => true,
                        'options' => [
                            ['value' => 'brass_gold', 'label' => 'Kuningan Emas (Premium)'],
                            ['value' => 'stainless', 'label' => 'Stainless Steel (Classic)'],
                            ['value' => 'crystal', 'label' => 'Crystal Glass (Luxury)'],
                        ],
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'file',
                        'name' => 'company_logo',
                        'label' => 'Logo Perusahaan',
                        'required' => true,
                        'accept' => '.png,.svg,.ai,.pdf',
                        'maxSize' => 5242880,
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'date',
                        'name' => 'presentation_date',
                        'label' => 'Tanggal Penyerahan Award',
                        'required' => false,
                        'minDate' => 'today',
                        'order' => 6,
                    ],
                    [
                        'id' => 'field_007',
                        'type' => 'wysiwyg',
                        'name' => 'notes',
                        'label' => 'Catatan Tambahan',
                        'required' => false,
                        'order' => 7,
                    ],
                ],
            ],
        ];
    }

    private function acrylicSignageForm(): array
    {
        return [
            'name' => 'Acrylic Signage Order Form',
            'description' => 'Form for acrylic signs, office nameplates, and directional signage',
            'category' => 'signage',
            'tags' => 'acrylic,signage,nameplate,office',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Pemesanan Signage Acrylic',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'select',
                        'name' => 'signage_type',
                        'label' => 'Jenis Signage',
                        'required' => true,
                        'options' => [
                            ['value' => 'door_sign', 'label' => 'Door Sign / Name Plate'],
                            ['value' => 'wall_sign', 'label' => 'Wall Mounted Sign'],
                            ['value' => 'directional', 'label' => 'Directional Sign'],
                            ['value' => 'display', 'label' => 'Display Stand'],
                        ],
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'select',
                        'name' => 'acrylic_thickness',
                        'label' => 'Ketebalan Acrylic',
                        'required' => true,
                        'options' => [
                            ['value' => '3mm', 'label' => '3mm'],
                            ['value' => '5mm', 'label' => '5mm'],
                            ['value' => '8mm', 'label' => '8mm'],
                            ['value' => '10mm', 'label' => '10mm'],
                        ],
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'select',
                        'name' => 'acrylic_color',
                        'label' => 'Warna Acrylic',
                        'required' => true,
                        'options' => [
                            ['value' => 'clear', 'label' => 'Clear (Transparan)'],
                            ['value' => 'white', 'label' => 'White (Putih)'],
                            ['value' => 'black', 'label' => 'Black (Hitam)'],
                            ['value' => 'frosted', 'label' => 'Frosted (Buram)'],
                        ],
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'text',
                        'name' => 'dimensions',
                        'label' => 'Ukuran (P x L dalam cm)',
                        'placeholder' => 'Contoh: 30 x 10',
                        'required' => true,
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'textarea',
                        'name' => 'text_content',
                        'label' => 'Teks pada Signage',
                        'placeholder' => 'Masukkan teks yang akan di-etching atau print',
                        'required' => true,
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'file',
                        'name' => 'logo_file',
                        'label' => 'Upload Logo (Opsional)',
                        'required' => false,
                        'accept' => '.png,.svg,.ai',
                        'maxSize' => 5242880,
                        'order' => 6,
                    ],
                    [
                        'id' => 'field_007',
                        'type' => 'number',
                        'name' => 'quantity',
                        'label' => 'Jumlah',
                        'required' => true,
                        'min' => 1,
                        'max' => 200,
                        'defaultValue' => 1,
                        'order' => 7,
                    ],
                ],
            ],
        ];
    }

    private function customDesignForm(): array
    {
        return [
            'name' => 'Custom Design Upload Form',
            'description' => 'Simplified form for custom design projects with file upload focus',
            'category' => 'custom',
            'tags' => 'custom,design,upload,flexible',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Custom Design Project',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'text',
                        'name' => 'project_name',
                        'label' => 'Nama Project',
                        'required' => true,
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'file',
                        'name' => 'design_files',
                        'label' => 'Upload Design Files',
                        'required' => true,
                        'accept' => '.pdf,.ai,.cdr,.svg,.png,.jpg',
                        'maxSize' => 52428800,
                        'multiple' => true,
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'wysiwyg',
                        'name' => 'project_description',
                        'label' => 'Deskripsi Project',
                        'placeholder' => 'Jelaskan detail project Anda...',
                        'required' => true,
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'number',
                        'name' => 'budget_estimate',
                        'label' => 'Estimasi Budget (IDR)',
                        'placeholder' => 'Masukkan estimasi budget',
                        'required' => false,
                        'min' => 100000,
                        'order' => 4,
                    ],
                ],
            ],
        ];
    }

    private function quoteRequestForm(): array
    {
        return [
            'name' => 'Quote Request Form',
            'description' => 'Simple form for requesting price quotations',
            'category' => 'inquiry',
            'tags' => 'quote,inquiry,price,simple',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Request for Quotation',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'text',
                        'name' => 'full_name',
                        'label' => 'Nama Lengkap',
                        'required' => true,
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'email',
                        'name' => 'email',
                        'label' => 'Email',
                        'required' => true,
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'tel',
                        'name' => 'phone',
                        'label' => 'Nomor Telepon',
                        'required' => true,
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'select',
                        'name' => 'product_interest',
                        'label' => 'Produk yang Diminati',
                        'required' => true,
                        'options' => [
                            ['value' => 'plakat', 'label' => 'Plakat Logam'],
                            ['value' => 'trophy', 'label' => 'Trophy/Award'],
                            ['value' => 'signage', 'label' => 'Signage'],
                            ['value' => 'custom', 'label' => 'Custom Product'],
                        ],
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'textarea',
                        'name' => 'requirements',
                        'label' => 'Kebutuhan/Spesifikasi',
                        'placeholder' => 'Jelaskan kebutuhan Anda secara detail',
                        'required' => true,
                        'order' => 5,
                    ],
                ],
            ],
        ];
    }

    private function personalizedGiftForm(): array
    {
        return [
            'name' => 'Personalized Gift Order Form',
            'description' => 'Form for custom personalized gifts with engraving',
            'category' => 'gift',
            'tags' => 'gift,personalized,custom,engraving',
            'form_schema' => [
                'version' => '1.0',
                'title' => 'Personalized Gift Order',
                'fields' => [
                    [
                        'id' => 'field_001',
                        'type' => 'select',
                        'name' => 'gift_occasion',
                        'label' => 'Occasion',
                        'required' => true,
                        'options' => [
                            ['value' => 'wedding', 'label' => 'Wedding / Pernikahan'],
                            ['value' => 'birthday', 'label' => 'Birthday / Ulang Tahun'],
                            ['value' => 'anniversary', 'label' => 'Anniversary'],
                            ['value' => 'graduation', 'label' => 'Graduation / Wisuda'],
                            ['value' => 'corporate', 'label' => 'Corporate Gift'],
                        ],
                        'order' => 1,
                    ],
                    [
                        'id' => 'field_002',
                        'type' => 'text',
                        'name' => 'recipient_name',
                        'label' => 'Nama Penerima Gift',
                        'required' => true,
                        'order' => 2,
                    ],
                    [
                        'id' => 'field_003',
                        'type' => 'textarea',
                        'name' => 'personalized_message',
                        'label' => 'Pesan Personal',
                        'placeholder' => 'Pesan yang akan di-engraving',
                        'required' => false,
                        'maxLength' => 500,
                        'order' => 3,
                    ],
                    [
                        'id' => 'field_004',
                        'type' => 'select',
                        'name' => 'gift_material',
                        'label' => 'Material',
                        'required' => true,
                        'options' => [
                            ['value' => 'metal', 'label' => 'Metal / Logam'],
                            ['value' => 'glass', 'label' => 'Kaca / Glass'],
                            ['value' => 'wood', 'label' => 'Kayu / Wood'],
                            ['value' => 'acrylic', 'label' => 'Acrylic'],
                        ],
                        'order' => 4,
                    ],
                    [
                        'id' => 'field_005',
                        'type' => 'number',
                        'name' => 'quantity',
                        'label' => 'Jumlah',
                        'required' => true,
                        'min' => 1,
                        'max' => 100,
                        'defaultValue' => 1,
                        'order' => 5,
                    ],
                    [
                        'id' => 'field_006',
                        'type' => 'date',
                        'name' => 'event_date',
                        'label' => 'Tanggal Acara',
                        'required' => false,
                        'minDate' => 'today',
                        'order' => 6,
                    ],
                ],
            ],
        ];
    }
}
