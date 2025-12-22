/**
 * Test Fixtures
 * Reusable test data untuk integration dan E2E testing
 */

/**
 * Product Fixtures
 */
export const ProductFixtures = {
  validProduct: {
    name: 'Premium Pine Stand',
    slug: 'premium-pine-stand',
    sku: 'PINE-001',
    description: 'High-quality pine wood stand for custom etching',
    price: 150000,
    currency: 'IDR',
    stock_quantity: 50,
    status: 'published' as const,
    featured: true,
    images: ['/images/products/pine-stand.jpg'],
    category_id: null,
  },

  minimalProduct: {
    name: 'Basic Product',
    price: 10000,
    currency: 'IDR',
  },

  productWithVariants: {
    name: 'Brass Plate with Sizes',
    sku: 'BRASS-VAR-001',
    description: 'Brass plate available in multiple sizes',
    price: 200000,
    currency: 'IDR',
    stock_quantity: 100,
    status: 'published' as const,
    has_variants: true,
    variants: [
      {
        name: 'Small (10x10cm)',
        sku: 'BRASS-VAR-001-S',
        price: 150000,
        stock_quantity: 30,
      },
      {
        name: 'Medium (20x20cm)',
        sku: 'BRASS-VAR-001-M',
        price: 200000,
        stock_quantity: 40,
      },
      {
        name: 'Large (30x30cm)',
        sku: 'BRASS-VAR-001-L',
        price: 300000,
        stock_quantity: 30,
      },
    ],
  },

  invalidProduct: {
    name: '', // Invalid: empty name
    price: -1000, // Invalid: negative price
    currency: 'INVALID', // Invalid: invalid currency
  },
};

/**
 * Customer Fixtures
 */
export const CustomerFixtures = {
  validCustomer: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+6281234567890',
    company_name: 'PT Example Corporation',
    address: 'Jl. Sudirman No. 123',
    city: 'Jakarta',
    state: 'DKI Jakarta',
    postal_code: '12190',
    country: 'Indonesia',
    customer_type: 'business' as const,
    status: 'active' as const,
  },

  individualCustomer: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+6287654321098',
    address: 'Jl. Gatot Subroto No. 456',
    city: 'Bandung',
    state: 'Jawa Barat',
    postal_code: '40123',
    country: 'Indonesia',
    customer_type: 'individual' as const,
    status: 'active' as const,
  },

  vipCustomer: {
    name: 'Robert Johnson',
    email: 'robert.johnson@vip.com',
    phone: '+6281111111111',
    company_name: 'VIP Corporation',
    address: 'Jl. Thamrin No. 789',
    city: 'Jakarta',
    state: 'DKI Jakarta',
    postal_code: '10350',
    country: 'Indonesia',
    customer_type: 'business' as const,
    status: 'active' as const,
    is_vip: true,
    discount_percentage: 10,
  },
};

/**
 * Order Fixtures
 */
export const OrderFixtures = {
  validOrder: {
    customer_name: 'John Doe',
    customer_email: 'john.doe@example.com',
    customer_phone: '+6281234567890',
    customer_address: 'Jl. Sudirman No. 123, Jakarta',
    order_type: 'custom_etching' as const,
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
    notes: 'Customer requests express delivery',
    items: [
      {
        product_id: null,
        product_name: 'Custom Brass Plate 20x20cm',
        quantity: 5,
        unit_price: 200000,
        subtotal: 1000000,
        custom_specs: {
          material: 'brass',
          size: '20x20cm',
          engraving_text: 'Company Logo',
        },
      },
      {
        product_id: null,
        product_name: 'Pine Wood Stand',
        quantity: 5,
        unit_price: 150000,
        subtotal: 750000,
      },
    ],
    subtotal: 1750000,
    tax_amount: 175000,
    discount_amount: 0,
    total_amount: 1925000,
    currency: 'IDR',
  },

  simpleOrder: {
    customer_name: 'Jane Smith',
    customer_email: 'jane.smith@example.com',
    customer_phone: '+6287654321098',
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
    items: [
      {
        product_name: 'Standard Product',
        quantity: 1,
        unit_price: 100000,
        subtotal: 100000,
      },
    ],
    subtotal: 100000,
    tax_amount: 10000,
    total_amount: 110000,
    currency: 'IDR',
  },
};

/**
 * Payment Fixtures
 */
export const PaymentFixtures = {
  cashPayment: {
    payment_method: 'cash' as const,
    amount: 1925000,
    currency: 'IDR',
    payment_date: new Date().toISOString(),
    status: 'completed' as const,
    notes: 'Cash payment received at office',
  },

  bankTransferPayment: {
    payment_method: 'bank_transfer' as const,
    amount: 1925000,
    currency: 'IDR',
    payment_date: new Date().toISOString(),
    status: 'pending_verification' as const,
    bank_name: 'BCA',
    account_number: '1234567890',
    account_holder: 'John Doe',
    transfer_proof_url: '/uploads/transfer-proof.jpg',
    notes: 'Transfer from BCA account',
  },

  gatewayPayment: {
    payment_method: 'payment_gateway' as const,
    gateway_provider: 'midtrans',
    amount: 1925000,
    currency: 'IDR',
    status: 'pending' as const,
    transaction_id: 'MIDTRANS-' + Date.now(),
  },

  downPayment: {
    payment_method: 'bank_transfer' as const,
    amount: 962500, // 50% of 1925000
    currency: 'IDR',
    payment_date: new Date().toISOString(),
    status: 'completed' as const,
    is_down_payment: true,
    down_payment_percentage: 50,
    notes: '50% down payment',
  },
};

/**
 * Invoice Fixtures
 */
export const InvoiceFixtures = {
  standardInvoice: {
    invoice_number: 'INV-' + Date.now(),
    invoice_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    customer_name: 'John Doe',
    customer_email: 'john.doe@example.com',
    customer_address: 'Jl. Sudirman No. 123, Jakarta',
    items: [
      {
        description: 'Custom Brass Plate 20x20cm',
        quantity: 5,
        unit_price: 200000,
        subtotal: 1000000,
      },
      {
        description: 'Pine Wood Stand',
        quantity: 5,
        unit_price: 150000,
        subtotal: 750000,
      },
    ],
    subtotal: 1750000,
    tax_amount: 175000,
    discount_amount: 0,
    total_amount: 1925000,
    currency: 'IDR',
    status: 'unpaid' as const,
    notes: 'Payment due within 14 days',
  },
};

/**
 * Vendor Fixtures
 */
export const VendorFixtures = {
  etchingVendor: {
    name: 'PT Etching Master',
    email: 'contact@etchingmaster.com',
    phone: '+6281122334455',
    address: 'Jl. Industri No. 45, Tangerang',
    city: 'Tangerang',
    state: 'Banten',
    postal_code: '15111',
    country: 'Indonesia',
    vendor_type: 'manufacturer' as const,
    specializations: ['metal_etching', 'brass_engraving', 'stainless_steel'],
    payment_terms: 'Net 30',
    status: 'active' as const,
    rating: 4.5,
  },

  woodworkVendor: {
    name: 'CV Kayu Jati',
    email: 'info@kayujati.com',
    phone: '+6281199887766',
    address: 'Jl. Mebel No. 88, Jepara',
    city: 'Jepara',
    state: 'Jawa Tengah',
    postal_code: '59419',
    country: 'Indonesia',
    vendor_type: 'manufacturer' as const,
    specializations: ['wood_working', 'pine_products', 'custom_furniture'],
    payment_terms: 'Net 45',
    status: 'active' as const,
    rating: 4.8,
  },
};

/**
 * User Fixtures
 */
export const UserFixtures = {
  admin: {
    name: 'Admin User',
    email: 'admin@etchinx.com',
    password: 'DemoAdmin2024!',
    role: 'admin' as const,
    status: 'active' as const,
  },

  manager: {
    name: 'Manager User',
    email: 'manager@etchinx.com',
    password: 'DemoManager2024!',
    role: 'manager' as const,
    status: 'active' as const,
  },

  sales: {
    name: 'Sales User',
    email: 'sales@etchinx.com',
    password: 'DemoSales2024!',
    role: 'sales' as const,
    status: 'active' as const,
  },
};

/**
 * Pagination Fixtures
 */
export const PaginationFixtures = {
  defaultPagination: {
    page: 1,
    per_page: 20,
  },

  firstPage: {
    page: 1,
    per_page: 10,
  },

  largePage: {
    page: 1,
    per_page: 100,
  },
};

/**
 * Filter Fixtures
 */
export const FilterFixtures = {
  productFilters: {
    status: 'published' as const,
    featured: true,
    min_price: 100000,
    max_price: 500000,
  },

  orderFilters: {
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
    date_from: '2025-01-01',
    date_to: '2025-12-31',
  },

  customerFilters: {
    status: 'active' as const,
    customer_type: 'business' as const,
    is_vip: true,
  },
};

/**
 * Response Fixtures (untuk schema validation)
 */
export const ResponseFixtures = {
  successResponse: {
    success: true,
    message: 'Operation successful',
    data: {},
  },

  errorResponse: {
    success: false,
    message: 'Operation failed',
    errors: {
      field: ['Validation error message'],
    },
  },

  paginatedResponse: {
    data: [],
    current_page: 1,
    per_page: 20,
    total: 100,
    last_page: 5,
    from: 1,
    to: 20,
  },

  unauthorizedResponse: {
    success: false,
    message: 'Unauthorized',
    errors: {},
  },

  forbiddenResponse: {
    success: false,
    message: 'Forbidden',
    errors: {},
  },

  notFoundResponse: {
    success: false,
    message: 'Resource not found',
    errors: {},
  },

  validationErrorResponse: {
    success: false,
    message: 'Validation failed',
    errors: {
      name: ['The name field is required.'],
      email: ['The email must be a valid email address.'],
      price: ['The price must be greater than 0.'],
    },
  },
};
