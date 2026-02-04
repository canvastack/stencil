/**
 * Visual Test Component for QuoteItemSpecifications
 * 
 * This file demonstrates the QuoteItemSpecifications component with sample data.
 * You can use this for manual visual testing in Storybook or a test page.
 */

import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';
import type { QuoteItemSpecifications, QuoteItemFormSchema } from '@/services/tenant/quoteService';

// Sample data from PT CEX business context
const sampleSpecifications: QuoteItemSpecifications = {
  jenis_plakat: 'Plakat Logam',
  jenis_logam: 'Stainless Steel 304 (Anti Karat)',
  ketebalan_plat: '2mm',
  ukuran_plakat: '30x40cm',
  text_engraving: '30 Years Beyond Partnership',
  finishing: 'Polished',
  warna_background: 'Silver',
  jenis_mounting: 'Wall Mount',
};

const sampleFormSchema: QuoteItemFormSchema = {
  fields: [
    {
      name: 'jenis_plakat',
      label: 'Jenis Plakat',
      type: 'select',
      options: ['Plakat Logam', 'Plakat Akrilik', 'Plakat Kayu'],
    },
    {
      name: 'jenis_logam',
      label: 'Jenis Logam',
      type: 'radio',
      options: [
        'Stainless Steel 304 (Anti Karat)',
        'Stainless Steel 316 (Marine Grade)',
        'Kuningan Emas (Brass Gold)',
        'Kuningan Antik (Brass Antique)',
      ],
    },
    {
      name: 'ketebalan_plat',
      label: 'Ketebalan Plat',
      type: 'select',
      options: ['1mm', '2mm', '3mm', '5mm'],
    },
    {
      name: 'ukuran_plakat',
      label: 'Ukuran Plakat',
      type: 'text',
    },
    {
      name: 'text_engraving',
      label: 'Text untuk Engraving',
      type: 'textarea',
    },
    {
      name: 'finishing',
      label: 'Finishing',
      type: 'select',
      options: ['Polished', 'Brushed', 'Matte'],
    },
    {
      name: 'warna_background',
      label: 'Warna Background',
      type: 'select',
      options: ['Silver', 'Gold', 'Black', 'White'],
    },
    {
      name: 'jenis_mounting',
      label: 'Jenis Mounting',
      type: 'select',
      options: ['Wall Mount', 'Stand Mount', 'Hanging'],
    },
  ],
};

export const QuoteItemSpecificationsVisualTest = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">QuoteItemSpecifications Component</h2>
        <p className="text-muted-foreground mb-6">
          This component displays dynamic product specifications from customer orders.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Form Schema (Labeled Fields)</h3>
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Without Form Schema (Raw Field Names)</h3>
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Few Fields</h3>
        <QuoteItemSpecificationsDisplay
          specifications={{
            material: 'Stainless Steel',
            size: '30x40cm',
          }}
          formSchema={{
            fields: [
              { name: 'material', label: 'Material Type', type: 'select' },
              { name: 'size', label: 'Dimensions', type: 'text' },
            ],
          }}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Boolean and Null Values</h3>
        <QuoteItemSpecificationsDisplay
          specifications={{
            is_urgent: true,
            requires_approval: false,
            optional_note: null as any,
            custom_text: 'Custom engraving text here',
          }}
          formSchema={{
            fields: [
              { name: 'is_urgent', label: 'Urgent Order', type: 'checkbox' },
              { name: 'requires_approval', label: 'Requires Approval', type: 'checkbox' },
              { name: 'optional_note', label: 'Optional Note', type: 'textarea' },
              { name: 'custom_text', label: 'Custom Text', type: 'text' },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default QuoteItemSpecificationsVisualTest;
