# Company Branding Assets

This directory contains company branding assets used in PDF documents, emails, and other customer-facing materials.

## Logo Files

### Current Logo
- **File**: `company-logo.svg`
- **Format**: SVG (Scalable Vector Graphics)
- **Dimensions**: 200x80 pixels
- **Usage**: All PDF documents (quotations, invoices, receipts, etc.)

### Recommended Logo Specifications

For best results, company logos should meet the following specifications:

#### File Formats
- **Primary**: SVG (recommended for scalability)
- **Alternative**: PNG with transparent background
- **Fallback**: JPG (not recommended due to lack of transparency)

#### Dimensions
- **Maximum Width**: 200 pixels
- **Maximum Height**: 80 pixels
- **Aspect Ratio**: Maintain original aspect ratio
- **Resolution**: 300 DPI for PNG/JPG files

#### Design Guidelines
- Use high contrast colors for visibility
- Ensure logo is readable at small sizes
- Include company name or initials
- Keep design simple and professional
- Test logo on both white and colored backgrounds

## Replacing the Logo

To replace the default logo with your company logo:

### Option 1: Using Environment Variables (Recommended)

1. Add your logo file to this directory
2. Update your `.env` file:
   ```env
   BRANDING_LOGO_PATH=images/branding/your-logo.png
   BRANDING_COMPANY_NAME="Your Company Name"
   BRANDING_TAGLINE="Your Company Tagline"
   ```

### Option 2: Direct File Replacement

1. Replace `company-logo.svg` with your logo file
2. Keep the same filename, or update `config/branding.php`

### Option 3: Configuration File

Edit `backend/config/branding.php`:

```php
'logo_path' => 'images/branding/your-logo.png',
'logo_width' => 200,
'logo_height' => 80,
```

## Branding Configuration

All branding settings can be configured in:
- **Config File**: `backend/config/branding.php`
- **Environment**: `.env` file

### Available Settings

```env
# Company Information
BRANDING_COMPANY_NAME="PT Custom Etching Xenial"
BRANDING_TAGLINE="Excellence in Custom Etching Solutions"
BRANDING_ADDRESS="Jl. Industri No. 123, Jakarta 12345, Indonesia"
BRANDING_PHONE="+62 21 1234 5678"
BRANDING_EMAIL="info@custometchingxenial.com"
BRANDING_WEBSITE="https://www.custometchingxenial.com"
BRANDING_TAX_ID="01.234.567.8-901.000"

# Logo
BRANDING_LOGO_PATH="images/branding/company-logo.svg"
BRANDING_LOGO_WIDTH=200
BRANDING_LOGO_HEIGHT=80

# Colors (Hex codes)
BRANDING_PRIMARY_COLOR="#4F46E5"
BRANDING_SECONDARY_COLOR="#059669"
BRANDING_ACCENT_COLOR="#DC2626"

# Footer
BRANDING_FOOTER_TEXT="Quality Etching Services Since 2020"

# Bank Details
BRANDING_BANK_NAME="Bank Central Asia (BCA)"
BRANDING_BANK_ACCOUNT_NAME="PT Custom Etching Xenial"
BRANDING_BANK_ACCOUNT_NUMBER="1234567890"
BRANDING_BANK_SWIFT_CODE="CENAIDJA"
BRANDING_BANK_BRANCH="Jakarta Pusat"
```

## Testing Your Logo

After updating the logo, test it by generating a PDF document:

1. Create a test quotation in the admin panel
2. Generate and download the PDF
3. Verify logo appears correctly
4. Check logo quality and positioning
5. Test on different document types (invoice, receipt, etc.)

## Troubleshooting

### Logo Not Appearing

1. **Check file path**: Ensure the logo file exists at the specified path
2. **Check file permissions**: Logo file should be readable by the web server
3. **Check file format**: Use SVG or PNG for best results
4. **Clear cache**: Run `php artisan config:clear` after changes

### Logo Too Large/Small

1. Adjust `BRANDING_LOGO_WIDTH` and `BRANDING_LOGO_HEIGHT` in `.env`
2. Or edit the CSS in PDF templates (`.logo` class)
3. Maintain aspect ratio to avoid distortion

### Logo Quality Issues

1. Use SVG format for perfect scaling
2. For PNG, use at least 300 DPI resolution
3. Ensure logo has transparent background
4. Test logo on different colored backgrounds

## Multi-Tenant Support

For multi-tenant setups, each tenant can have their own branding:

1. Store tenant-specific logos in: `storage/app/tenants/{tenant_id}/branding/`
2. Update branding configuration per tenant
3. Use tenant-scoped configuration in PDF generation

## Support

For questions or issues with branding configuration:
- Check documentation: `backend/config/branding.php`
- Review PDF templates: `backend/resources/views/pdf/`
- Contact development team

---

**Last Updated**: February 2026
**Version**: 1.0.0
