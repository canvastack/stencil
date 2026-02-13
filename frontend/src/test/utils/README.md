# Vendor Portal Test Utilities

Comprehensive test utilities for vendor portal testing including mock API responses, test data factories, common assertions, and helper functions.

## Table of Contents

- [Installation](#installation)
- [Test Data Factories](#test-data-factories)
- [Mock API Responses](#mock-api-responses)
- [Common Assertions](#common-assertions)
- [Helper Functions](#helper-functions)
- [Usage Examples](#usage-examples)

## Installation

Import the utilities in your test files:

```typescript
import {
  VendorTestDataFactory,
  VendorMockAPI,
  VendorTestAssertions,
  setupMockFetch,
  setupVendorLocalStorage,
} from '@/test/utils';
```

## Test Data Factories

The `VendorTestDataFactory` class provides methods to generate realistic test data for vendor portal entities.

### Available Factory Methods

#### `createVendorUser(overrides?)`

Creates a mock vendor user with all required fields.

```typescript
const vendorUser = VendorTestDataFactory.createVendorUser({
  email: 'custom@test.com',
  status: 'active',
});
```

**Default Fields:**
- `id`: UUID
- `uuid`: UUID
- `email`: Generated email
- `name`: "Test Vendor User"
- `vendor_id`: UUID
- `account_type`: "vendor"
- `status`: "active"
- `portal_access_enabled`: true
- `onboarding_status`: "completed"
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp

#### `createVendor(overrides?)`

Creates a mock vendor company.

```typescript
const vendor = VendorTestDataFactory.createVendor({
  company_name: 'Custom Vendor Inc',
  status: 'active',
});
```

**Default Fields:**
- `id`: UUID
- `uuid`: UUID
- `tenant_id`: UUID
- `company_name`: Generated name
- `email`: Generated email
- `phone`: "+6281234567890"
- `address`: "Jl. Test No. 123, Jakarta"
- `status`: "active"
- `portal_access_enabled`: true
- `onboarding_status`: "completed"
- `onboarding_completed_at`: ISO timestamp
- `portal_last_access_at`: ISO timestamp
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp

#### `createQuote(overrides?)`

Creates a mock quote with order and product details.

```typescript
const quote = VendorTestDataFactory.createQuote({
  status: 'sent',
  vendor_price: 200000,
});
```

**Default Fields:**
- `id`: UUID
- `uuid`: UUID
- `tenant_id`: UUID
- `vendor_id`: UUID
- `order_id`: UUID
- `quote_number`: Generated (e.g., "Q-2024-0001")
- `status`: "sent"
- `vendor_price`: 150000
- `counter_offer_amount`: null
- `estimated_delivery_days`: null
- `rejection_reason`: null
- `notes`: null
- `sent_at`: ISO timestamp
- `responded_at`: null
- `expires_at`: ISO timestamp (7 days from now)
- `response_type`: null
- `created_at`: ISO timestamp
- `updated_at`: ISO timestamp
- `order`: Object with order details
- `product`: Object with product details

#### `createQuoteMessage(overrides?)`

Creates a mock quote message.

```typescript
const message = VendorTestDataFactory.createQuoteMessage({
  sender_type: 'vendor',
  message: 'Custom message content',
});
```

**Default Fields:**
- `id`: UUID
- `uuid`: UUID
- `tenant_id`: UUID
- `quote_id`: UUID
- `sender_id`: UUID
- `sender_type`: "vendor"
- `message`: "Test message content"
- `attachments`: []
- `is_read`: false
- `read_at`: null
- `created_at`: ISO timestamp
- `sender`: Object with sender details

#### `createVendorProfile(overrides?)`

Creates a mock vendor profile with performance metrics.

```typescript
const profile = VendorTestDataFactory.createVendorProfile({
  performance_metrics: {
    total_quotes: 100,
    acceptance_rate: 85,
  },
});
```

**Default Fields:**
- `vendor`: Vendor object
- `performance_metrics`: Object with metrics
  - `total_quotes`: 50
  - `accepted_quotes`: 35
  - `rejected_quotes`: 10
  - `pending_quotes`: 5
  - `acceptance_rate`: 70
  - `average_response_time`: 24

#### Bulk Creation Methods

```typescript
// Create multiple quotes
const quotes = VendorTestDataFactory.createQuotes(10, { status: 'sent' });

// Create multiple messages
const messages = VendorTestDataFactory.createMessages(5, { sender_type: 'admin' });
```

### Utility Methods

```typescript
// Generate UUID
const uuid = VendorTestDataFactory.generateUUID();

// Generate timestamp (with optional day offset)
const timestamp = VendorTestDataFactory.generateTimestamp(-7); // 7 days ago

// Generate quote number
const quoteNumber = VendorTestDataFactory.generateQuoteNumber(); // "Q-2024-0001"

// Generate order number
const orderNumber = VendorTestDataFactory.generateOrderNumber(); // "ORD-2024-0001"
```

## Mock API Responses

The `VendorMockAPI` class provides pre-configured mock API responses for all vendor portal endpoints.

### Authentication Endpoints

```typescript
// Successful login
const loginResponse = VendorMockAPI.mockLoginSuccess({
  email: 'vendor@test.com',
});

// Failed login
const loginError = VendorMockAPI.mockLoginFailure('Invalid credentials');

// Logout
const logoutResponse = VendorMockAPI.mockLogoutSuccess();

// Password reset request
const resetRequest = VendorMockAPI.mockPasswordResetRequestSuccess();

// Password reset
const resetResponse = VendorMockAPI.mockPasswordResetSuccess();
```

### Quote Endpoints

```typescript
// Get quotes list
const quotesResponse = VendorMockAPI.mockGetQuotesSuccess(
  VendorTestDataFactory.createQuotes(5),
  { current_page: 1, per_page: 20, total: 5 }
);

// Get quote detail
const quoteDetail = VendorMockAPI.mockGetQuoteDetailSuccess({
  status: 'sent',
});

// Accept quote
const acceptResponse = VendorMockAPI.mockAcceptQuoteSuccess({
  estimated_delivery_days: 7,
});

// Reject quote
const rejectResponse = VendorMockAPI.mockRejectQuoteSuccess({
  rejection_reason: 'Cannot meet requirements',
});

// Counter offer
const counterResponse = VendorMockAPI.mockCounterOfferSuccess({
  counter_offer_amount: 175000,
});
```

### Message Endpoints

```typescript
// Get messages
const messagesResponse = VendorMockAPI.mockGetMessagesSuccess(
  VendorTestDataFactory.createMessages(3)
);

// Send message
const sendResponse = VendorMockAPI.mockSendMessageSuccess({
  message: 'Test message',
});
```

### Profile Endpoints

```typescript
// Get profile
const profileResponse = VendorMockAPI.mockGetProfileSuccess();

// Update profile
const updateResponse = VendorMockAPI.mockUpdateProfileSuccess({
  email: 'newemail@test.com',
});
```

### Error Responses

```typescript
// Validation error
const validationError = VendorMockAPI.mockValidationError({
  email: ['The email field is required.'],
  password: ['The password must be at least 8 characters.'],
});

// Unauthorized
const unauthorized = VendorMockAPI.mockUnauthorized();

// Forbidden
const forbidden = VendorMockAPI.mockForbidden('Portal access disabled');

// Not found
const notFound = VendorMockAPI.mockNotFound('Quote');

// Server error
const serverError = VendorMockAPI.mockServerError('Database connection failed');
```

## Common Assertions

The `VendorTestAssertions` class provides validation methods for testing data integrity.

### Format Validations

```typescript
// UUID format
expect(VendorTestAssertions.isValidUUID(quote.id)).toBe(true);

// ISO timestamp format
expect(VendorTestAssertions.isValidISOTimestamp(quote.created_at)).toBe(true);

// Email format
expect(VendorTestAssertions.isValidEmail('vendor@test.com')).toBe(true);

// Phone format (Indonesian)
expect(VendorTestAssertions.isValidPhone('+6281234567890')).toBe(true);

// Quote number format
expect(VendorTestAssertions.isValidQuoteNumber('Q-2024-0001')).toBe(true);

// Order number format
expect(VendorTestAssertions.isValidOrderNumber('ORD-2024-0001')).toBe(true);
```

### Status Validations

```typescript
// Quote status
expect(VendorTestAssertions.isValidQuoteStatus('sent')).toBe(true);

// Vendor status
expect(VendorTestAssertions.isValidVendorStatus('active')).toBe(true);

// Onboarding status
expect(VendorTestAssertions.isValidOnboardingStatus('completed')).toBe(true);

// Response type
expect(VendorTestAssertions.isValidResponseType('accept')).toBe(true);

// Sender type
expect(VendorTestAssertions.isValidSenderType('vendor')).toBe(true);
```

### Business Logic Validations

```typescript
// Can respond to quote
expect(VendorTestAssertions.canRespondToQuote(quote)).toBe(true);

// Quote is expired
expect(VendorTestAssertions.isQuoteExpired(quote)).toBe(false);

// Valid attachment
expect(VendorTestAssertions.isValidAttachment(attachment)).toBe(true);
```

### API Response Validations

```typescript
// Valid API response structure
expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);

// Valid paginated response structure
expect(VendorTestAssertions.isValidPaginatedResponse(response)).toBe(true);

// Vendor user has required fields
expect(VendorTestAssertions.hasRequiredVendorUserFields(user)).toBe(true);

// Quote has required fields
expect(VendorTestAssertions.hasRequiredQuoteFields(quote)).toBe(true);
```

## Helper Functions

### Mock Fetch Setup

```typescript
import { setupMockFetch, clearMockFetch } from '@/test/utils';

// Setup mock responses
setupMockFetch({
  'POST /api/v1/vendor/auth/login': VendorMockAPI.mockLoginSuccess(),
  'GET /api/v1/vendor/quotes': VendorMockAPI.mockGetQuotesSuccess(),
});

// Clear mocks after test
afterEach(() => {
  clearMockFetch();
});
```

### LocalStorage Management

```typescript
import {
  setupVendorLocalStorage,
  clearVendorLocalStorage,
  getStoredVendorToken,
  getStoredVendorUser,
} from '@/test/utils';

// Setup vendor authentication in localStorage
const { token, user } = setupVendorLocalStorage();

// Get stored values
const storedToken = getStoredVendorToken();
const storedUser = getStoredVendorUser();

// Clear localStorage
clearVendorLocalStorage();
```

### Async Utilities

```typescript
import { waitForAsync, simulateAPIDelay } from '@/test/utils';

// Wait for async operations
await waitForAsync(100);

// Simulate API delay
await simulateAPIDelay(200);
```

### File Upload Testing

```typescript
import { createMockFile, createMockFileList } from '@/test/utils';

// Create single file
const file = createMockFile('document.pdf', 2048, 'application/pdf');

// Create file list
const files = [
  createMockFile('doc1.pdf'),
  createMockFile('doc2.pdf'),
];
const fileList = createMockFileList(files);
```

## Usage Examples

### Example 1: Testing Login Component

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  VendorMockAPI,
  setupMockFetch,
  clearMockFetch,
} from '@/test/utils';
import VendorLogin from '@/pages/vendor/VendorLogin';

describe('VendorLogin', () => {
  beforeEach(() => {
    setupMockFetch({
      'POST /api/v1/vendor/auth/login': VendorMockAPI.mockLoginSuccess(),
    });
  });

  afterEach(() => {
    clearMockFetch();
  });

  it('should login successfully with valid credentials', async () => {
    render(<VendorLogin />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'vendor@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

### Example 2: Testing Quote List Component

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  VendorTestDataFactory,
  VendorMockAPI,
  VendorTestAssertions,
  setupMockFetch,
} from '@/test/utils';
import VendorQuoteList from '@/pages/vendor/VendorQuoteList';

describe('VendorQuoteList', () => {
  beforeEach(() => {
    const quotes = VendorTestDataFactory.createQuotes(5, { status: 'sent' });
    
    setupMockFetch({
      'GET /api/v1/vendor/quotes': VendorMockAPI.mockGetQuotesSuccess(quotes),
    });
  });

  it('should display list of quotes', async () => {
    render(<VendorQuoteList />);

    await waitFor(() => {
      const quoteElements = screen.getAllByTestId('quote-card');
      expect(quoteElements).toHaveLength(5);
    });
  });

  it('should validate quote data format', async () => {
    const quotes = VendorTestDataFactory.createQuotes(1);
    const quote = quotes[0];

    expect(VendorTestAssertions.isValidUUID(quote.id)).toBe(true);
    expect(VendorTestAssertions.isValidQuoteNumber(quote.quote_number)).toBe(true);
    expect(VendorTestAssertions.isValidQuoteStatus(quote.status)).toBe(true);
    expect(VendorTestAssertions.hasRequiredQuoteFields(quote)).toBe(true);
  });
});
```

### Example 3: Testing Quote Response Actions

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  VendorTestDataFactory,
  VendorMockAPI,
  VendorTestAssertions,
  setupMockFetch,
} from '@/test/utils';
import QuoteResponseForm from '@/components/vendor/QuoteResponseForm';

describe('QuoteResponseForm', () => {
  it('should accept quote with valid data', async () => {
    const quote = VendorTestDataFactory.createQuote({ status: 'sent' });
    
    setupMockFetch({
      [`POST /api/v1/vendor/quotes/${quote.uuid}/accept`]: 
        VendorMockAPI.mockAcceptQuoteSuccess({ estimated_delivery_days: 7 }),
    });

    render(<QuoteResponseForm quote={quote} />);

    fireEvent.click(screen.getByText(/accept/i));
    
    fireEvent.change(screen.getByLabelText(/delivery days/i), {
      target: { value: '7' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/accepted successfully/i)).toBeInTheDocument();
    });
  });

  it('should not allow response to expired quote', () => {
    const expiredQuote = VendorTestDataFactory.createQuote({
      status: 'sent',
      expires_at: VendorTestDataFactory.generateTimestamp(-1), // Yesterday
    });

    expect(VendorTestAssertions.canRespondToQuote(expiredQuote)).toBe(false);
    expect(VendorTestAssertions.isQuoteExpired(expiredQuote)).toBe(true);
  });
});
```

### Example 4: Testing File Upload

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockFile,
  createMockFileList,
  VendorTestAssertions,
} from '@/test/utils';
import MessageThread from '@/components/vendor/MessageThread';

describe('MessageThread - File Upload', () => {
  it('should validate file attachments', () => {
    const validFile = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
    const attachment = {
      filename: 'document.pdf',
      url: '/uploads/document.pdf',
      size: 1024 * 1024,
      mime_type: 'application/pdf',
    };

    expect(VendorTestAssertions.isValidAttachment(attachment)).toBe(true);
  });

  it('should reject files larger than 10MB', () => {
    const largeFile = {
      filename: 'large.pdf',
      url: '/uploads/large.pdf',
      size: 11 * 1024 * 1024, // 11MB
      mime_type: 'application/pdf',
    };

    expect(VendorTestAssertions.isValidAttachment(largeFile)).toBe(false);
  });
});
```

## Best Practices

1. **Use Factories for Test Data**: Always use `VendorTestDataFactory` to create test data instead of manually constructing objects.

2. **Mock API Responses**: Use `VendorMockAPI` for consistent API response structures.

3. **Validate Data Integrity**: Use `VendorTestAssertions` to validate data formats and business logic.

4. **Clean Up After Tests**: Always clear mocks and localStorage in `afterEach` hooks.

5. **Test Realistic Scenarios**: Use the factory methods with overrides to test edge cases and specific scenarios.

6. **Combine Utilities**: Combine factories, mocks, and assertions for comprehensive test coverage.

## Contributing

When adding new test utilities:

1. Add factory methods to `VendorTestDataFactory`
2. Add mock responses to `VendorMockAPI`
3. Add validation methods to `VendorTestAssertions`
4. Update this README with usage examples
5. Ensure all utilities have TypeScript type definitions

## Related Documentation

- [Testing Strategy](../../__tests__/TESTING_GUIDE.md)
- [E2E Testing Guide](../../__tests__/e2e/README.md)
- [Component Testing Guide](../../__tests__/unit/README.md)
