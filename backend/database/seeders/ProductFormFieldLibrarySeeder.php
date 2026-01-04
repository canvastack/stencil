<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\ProductFormFieldLibrary;

class ProductFormFieldLibrarySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔧 Seeding Product Form Field Library (System Fields)...');

        $fields = [
            [
                'name' => 'Single Line Text',
                'description' => 'Basic text input for short text entries',
                'field_type' => 'text',
                'category' => 'basic',
                'icon' => 'Type',
                'field_config' => [
                    'type' => 'text',
                    'label' => 'Text Field',
                    'placeholder' => 'Enter text',
                    'defaultValue' => '',
                    'maxLength' => 255,
                    'validation' => [
                        'required' => false,
                        'minLength' => null,
                        'maxLength' => 255,
                        'pattern' => null,
                    ],
                ],
            ],
            [
                'name' => 'Multi-line Text Area',
                'description' => 'Text area for longer text entries with multiple lines',
                'field_type' => 'textarea',
                'category' => 'basic',
                'icon' => 'AlignLeft',
                'field_config' => [
                    'type' => 'textarea',
                    'label' => 'Text Area',
                    'placeholder' => 'Enter detailed text',
                    'defaultValue' => '',
                    'rows' => 4,
                    'maxLength' => 2000,
                    'validation' => [
                        'required' => false,
                        'minLength' => null,
                        'maxLength' => 2000,
                    ],
                ],
            ],
            [
                'name' => 'Number Input',
                'description' => 'Numeric input field with validation for numbers only',
                'field_type' => 'number',
                'category' => 'basic',
                'icon' => 'Hash',
                'field_config' => [
                    'type' => 'number',
                    'label' => 'Number',
                    'placeholder' => 'Enter number',
                    'defaultValue' => null,
                    'min' => null,
                    'max' => null,
                    'step' => 1,
                    'validation' => [
                        'required' => false,
                        'min' => null,
                        'max' => null,
                    ],
                ],
            ],
            [
                'name' => 'Dropdown Select (Single)',
                'description' => 'Single selection dropdown menu',
                'field_type' => 'select',
                'category' => 'selection',
                'icon' => 'ChevronDown',
                'field_config' => [
                    'type' => 'select',
                    'label' => 'Select Option',
                    'placeholder' => 'Choose an option',
                    'options' => [
                        ['value' => 'option1', 'label' => 'Option 1'],
                        ['value' => 'option2', 'label' => 'Option 2'],
                        ['value' => 'option3', 'label' => 'Option 3'],
                    ],
                    'defaultValue' => null,
                    'validation' => [
                        'required' => false,
                    ],
                ],
            ],
            [
                'name' => 'Multi-Select Dropdown',
                'description' => 'Multiple selection dropdown (select multiple options)',
                'field_type' => 'multiselect',
                'category' => 'selection',
                'icon' => 'CheckSquare',
                'field_config' => [
                    'type' => 'multiselect',
                    'label' => 'Select Multiple',
                    'placeholder' => 'Choose one or more options',
                    'options' => [
                        ['value' => 'option1', 'label' => 'Option 1'],
                        ['value' => 'option2', 'label' => 'Option 2'],
                        ['value' => 'option3', 'label' => 'Option 3'],
                    ],
                    'defaultValue' => [],
                    'validation' => [
                        'required' => false,
                        'min' => null,
                        'max' => null,
                    ],
                ],
            ],
            [
                'name' => 'Radio Buttons',
                'description' => 'Single selection from visible radio button list',
                'field_type' => 'radio',
                'category' => 'selection',
                'icon' => 'Circle',
                'field_config' => [
                    'type' => 'radio',
                    'label' => 'Choose One',
                    'options' => [
                        ['value' => 'option1', 'label' => 'Option 1'],
                        ['value' => 'option2', 'label' => 'Option 2'],
                        ['value' => 'option3', 'label' => 'Option 3'],
                    ],
                    'defaultValue' => null,
                    'layout' => 'vertical',
                    'validation' => [
                        'required' => false,
                    ],
                ],
            ],
            [
                'name' => 'Checkbox Group',
                'description' => 'Multiple selection from visible checkbox list',
                'field_type' => 'checkbox',
                'category' => 'selection',
                'icon' => 'CheckSquare',
                'field_config' => [
                    'type' => 'checkbox',
                    'label' => 'Select Multiple',
                    'options' => [
                        ['value' => 'option1', 'label' => 'Option 1'],
                        ['value' => 'option2', 'label' => 'Option 2'],
                        ['value' => 'option3', 'label' => 'Option 3'],
                    ],
                    'defaultValue' => [],
                    'layout' => 'vertical',
                    'validation' => [
                        'required' => false,
                        'min' => null,
                        'max' => null,
                    ],
                ],
            ],
            [
                'name' => 'Color Picker',
                'description' => 'Color selection tool with hex color picker',
                'field_type' => 'color',
                'category' => 'advanced',
                'icon' => 'Palette',
                'field_config' => [
                    'type' => 'color',
                    'label' => 'Choose Color',
                    'defaultValue' => '#FFFFFF',
                    'allowCustom' => true,
                    'presetColors' => [
                        '#FFFFFF', '#000000', '#FF0000', '#00FF00', 
                        '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
                    ],
                    'validation' => [
                        'required' => false,
                    ],
                ],
            ],
            [
                'name' => 'File Upload',
                'description' => 'File upload field with type and size validation',
                'field_type' => 'file',
                'category' => 'advanced',
                'icon' => 'Upload',
                'field_config' => [
                    'type' => 'file',
                    'label' => 'Upload File',
                    'accept' => '.pdf,.jpg,.jpeg,.png,.svg,.ai',
                    'maxSize' => 10485760,
                    'multiple' => false,
                    'validation' => [
                        'required' => false,
                        'fileTypes' => ['pdf', 'jpg', 'jpeg', 'png', 'svg', 'ai'],
                        'maxSize' => 10485760,
                    ],
                ],
            ],
            [
                'name' => 'Date Picker',
                'description' => 'Date selection field with calendar picker',
                'field_type' => 'date',
                'category' => 'basic',
                'icon' => 'Calendar',
                'field_config' => [
                    'type' => 'date',
                    'label' => 'Select Date',
                    'defaultValue' => null,
                    'minDate' => null,
                    'maxDate' => null,
                    'format' => 'YYYY-MM-DD',
                    'validation' => [
                        'required' => false,
                        'minDate' => null,
                        'maxDate' => null,
                    ],
                ],
            ],
            [
                'name' => 'WYSIWYG Rich Text Editor',
                'description' => 'Rich text editor with formatting options',
                'field_type' => 'wysiwyg',
                'category' => 'advanced',
                'icon' => 'Edit3',
                'field_config' => [
                    'type' => 'wysiwyg',
                    'label' => 'Rich Text Content',
                    'placeholder' => 'Enter formatted text',
                    'defaultValue' => '',
                    'toolbar' => ['bold', 'italic', 'underline', 'link', 'bulletList', 'numberedList'],
                    'maxLength' => 5000,
                    'validation' => [
                        'required' => false,
                        'maxLength' => 5000,
                    ],
                ],
            ],
            [
                'name' => 'Repeater Field Group',
                'description' => 'Repeatable group of fields for dynamic content',
                'field_type' => 'repeater',
                'category' => 'advanced',
                'icon' => 'Copy',
                'field_config' => [
                    'type' => 'repeater',
                    'label' => 'Add Items',
                    'addButtonText' => 'Add Item',
                    'minItems' => 0,
                    'maxItems' => 10,
                    'fields' => [
                        [
                            'type' => 'text',
                            'name' => 'item_name',
                            'label' => 'Item Name',
                        ],
                    ],
                    'validation' => [
                        'required' => false,
                        'minItems' => 0,
                        'maxItems' => 10,
                    ],
                ],
            ],
            [
                'name' => 'Email Input',
                'description' => 'Email input with validation',
                'field_type' => 'email',
                'category' => 'basic',
                'icon' => 'Mail',
                'field_config' => [
                    'type' => 'email',
                    'label' => 'Email Address',
                    'placeholder' => 'example@domain.com',
                    'defaultValue' => '',
                    'validation' => [
                        'required' => false,
                        'pattern' => '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                        'errorMessage' => 'Please enter a valid email address',
                    ],
                ],
            ],
            [
                'name' => 'Phone Number',
                'description' => 'Phone number input with formatting',
                'field_type' => 'tel',
                'category' => 'basic',
                'icon' => 'Phone',
                'field_config' => [
                    'type' => 'tel',
                    'label' => 'Phone Number',
                    'placeholder' => '+62 812-3456-7890',
                    'defaultValue' => '',
                    'mask' => '+62 ###-####-####',
                    'validation' => [
                        'required' => false,
                        'pattern' => '^\+?[0-9\s\-\(\)]+$',
                        'errorMessage' => 'Please enter a valid phone number',
                    ],
                ],
            ],
            [
                'name' => 'URL/Website',
                'description' => 'URL input with validation',
                'field_type' => 'url',
                'category' => 'basic',
                'icon' => 'Link',
                'field_config' => [
                    'type' => 'url',
                    'label' => 'Website URL',
                    'placeholder' => 'https://example.com',
                    'defaultValue' => '',
                    'validation' => [
                        'required' => false,
                        'pattern' => '^https?:\/\/.+',
                        'errorMessage' => 'Please enter a valid URL starting with http:// or https://',
                    ],
                ],
            ],
        ];

        $createdCount = 0;
        foreach ($fields as $fieldData) {
            ProductFormFieldLibrary::updateOrCreate(
                [
                    'field_type' => $fieldData['field_type'],
                    'category' => $fieldData['category'],
                    'tenant_id' => null,
                ],
                [
                    'uuid' => Str::uuid()->toString(),
                    'name' => $fieldData['name'],
                    'description' => $fieldData['description'],
                    'field_config' => $fieldData['field_config'],
                    'icon' => $fieldData['icon'],
                    'is_system' => true,
                    'usage_count' => 0,
                    'tags' => null,
                    'preview_url' => null,
                    'created_by' => null,
                    'updated_by' => null,
                ]
            );
            $createdCount++;
        }

        $this->command->info("   ✅ Created {$createdCount} system field types in library");
    }
}
