# Company Branding Implementation Guide

## Overview

This document describes the company branding system implemented for PDF documents in the Customer Quote & Approval Workflow. The branding system allows easy customization of company logos, colors, and information across all generated documents.

## Features Implemented

### 1. Logo Integration
- ✅ Logo display in all PDF document headers
- ✅ Configurable logo path, width, and height
- ✅ Support for SVG, PNG, and JPG formats
- ✅ Automatic logo scaling and positioning
- ✅ Fallback to company name if logo not available

### 2. Company Information
- ✅ Configurable company name
- ✅ Company tagline/slogan
- ✅ Complete address information
- ✅ Contact details (phone, email, website)
- ✅ Tax ID (NPWP) for Indonesian compliance
- ✅ Bank details for payment instructions

### 3. Brand Colors
- ✅ Primary brand color configuration
- ✅ Secondary and accent colors
- ✅ Consistent color scheme across documents

### 4. Document Customization
- ✅ Custom footer text
- ✅ Social media links (optional)
- ✅ Configurable display options
- ✅ Professional document styling

## Files Modified

### PDF Templates Updated
All PDF templates now include logo and branding support:

1. **backend/resources/views/pdf/quotation.blade.php**
   - Added logo container and display logic
   - Integrated company tagline
   - Updated header with branding configuration
   - Enhanced footer with configurable text

2. **backend/resources/views/pdf/proforma-invoice.blade.php**
   - Logo integration in header
   - Branding configuration support
   - Enhanced company information display

3. **backend/resources/views/pdf/tax-invoice.blade.php**
   - Logo and branding in header
   - Tax ID display from configuration
   - Professional styling with brand colors

4. **backend/resources/views/pdf/purchase-order.blade.php**
   - Logo support for vendor-facing documents
   - Company branding in header
   - Consistent styling

5. **backend/resources/views/pdf/delivery-note.blade.php**
   - Logo integration
   - Branding configuration
   - Professional delivery document styling

6. **backend/resources/views/pdf/receipt.blade.php**
   - Logo in header
   - Complete branding support
   - Tax ID and company information

### New Files Created

1. **backend/config/branding.php**
   - Central branding configuration file
   - All customizable branding settings
   - Environment variable support
   - Comprehensive documentation

2. **backend/public/images/branding/company-logo.svg**
   - Default placeholder logo
   - Professional SVG design
   - Ready for replacement

3. **backend/public/images/branding/README.md**
   - Logo replacement instructions
   - Branding configuration guide
   - Troubleshooting tips
   - Multi-tenant support notes

4. **backend/.env.branding.example**
   - Example environment configuration
   - All branding variables documented
   - Usage instructions
   - Copy-paste ready format

5. **backend/docs/BRANDING_IMPLEMENTATION.md** (this file)
   - Complete implementation documentation
   - Configuration guide
   - Usage examples
   - Best practices

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Company Information
BRANDING_COMPANY_NAME="PT Custom Etching Xenial"
BRANDING_TAGLINE="Excellence in Custom Etching Solutions"
BRANDING_ADDRESS="Jl. Industri No. 123, Jakarta 12345, Indonesia"
BRANDING_PHONE="+62 21 1234 5678"
BRANDING_EMAIL="info@custometchingxenial.com"
BRANDING_WEBSITE="https://www.custometchingxenial.com"
BRANDING_TAX_ID="01.234.567.8-901.000"

# Logo Configuration
BRANDING_LOGO_PATH="images/branding/company-logo.svg"
BRANDING_LOGO_WIDTH=200
BRANDING_LOGO_HEIGHT=80

# Brand Colors
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

### Configuration File

The `backend/config/branding.php` file provides:
- Default values for all branding settings
- Environment variable integration
- Comprehensive documentation
- Structured configuration arrays

## Usage

### Accessing Branding Configuration in Blade Templates

```blade
{{-- Company Name --}}
{{ config('branding.company_name') }}

{{-- Logo Display --}}
@if(config('branding.logo_path') && file_exists(public_path(config('branding.logo_path'))))
<img src="{{ public_path(config('branding.logo_path')) }}" alt="Company Logo">
@endif

{{-- Company Tagline --}}
@if(config('branding.tagline'))
<div>{{ config('branding.tagline') }}</div>
@endif

{{-- Contact Information --}}
{{ config('branding.phone') }}
{{ config('branding.email') }}
{{ config('branding.website') }}

{{-- Tax ID --}}
{{ config('branding.tax_id') }}

{{-- Bank Details --}}
{{ config('branding.bank_details.bank_name') }}
{{ config('branding.bank_details.account_number') }}
```

### Accessing in PHP Code

```php
// Get company name
$companyName = config('branding.company_name');

// Get logo path
$logoPath = config('branding.logo_path');

// Get bank details
$bankDetails = config('branding.bank_details');

// Get all branding config
$branding = config('branding');
```

## Logo Guidelines

### Recommended Specifications

**File Formats:**
- Primary: SVG (best for scalability)
- Alternative: PNG with transparent background
- Fallback: JPG (not recommended)

**Dimensions:**
- Maximum Width: 200 pixels
- Maximum Height: 80 pixels
- Maintain aspect ratio
- Resolution: 300 DPI for raster images

**Design Guidelines:**
- High contrast colors for visibility
- Readable at small sizes
- Simple and professional design
- Test on various backgrounds

### Replacing the Logo

**Method 1: Environment Variable (Recommended)**
```env
BRANDING_LOGO_PATH="images/branding/your-company-logo.png"
```

**Method 2: Direct File Replacement**
1. Replace `backend/public/images/branding/company-logo.svg`
2. Keep the same filename

**Method 3: Configuration File**
Edit `backend/config/branding.php`:
```php
'logo_path' => 'images/branding/your-logo.png',
```

## Testing

### Test Branding Implementation

1. **Update Configuration**
   ```bash
   # Edit .env file with your branding
   nano .env
   
   # Clear configuration cache
   php artisan config:clear
   ```

2. **Generate Test Documents**
   - Create a test customer quote
   - Generate quotation PDF
   - Generate proforma invoice
   - Generate tax invoice
   - Generate receipt

3. **Verify Branding**
   - Logo appears correctly
   - Company information is accurate
   - Colors match brand guidelines
   - Footer text displays properly
   - All documents consistent

4. **Test Different Scenarios**
   - With logo present
   - Without logo (fallback to company name)
   - Different logo formats (SVG, PNG, JPG)
   - Various logo sizes

## Multi-Tenant Support

For multi-tenant deployments:

### Tenant-Specific Branding

```php
// Store tenant-specific logos
storage/app/tenants/{tenant_id}/branding/logo.png

// Load tenant-specific configuration
$tenantBranding = Tenant::current()->branding_config;

// Override default branding
config(['branding' => array_merge(
    config('branding'),
    $tenantBranding
)]);
```

### Database-Driven Branding

Create a `tenant_branding` table:
```sql
CREATE TABLE tenant_branding (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    company_name VARCHAR(255),
    tagline VARCHAR(255),
    logo_path VARCHAR(255),
    primary_color VARCHAR(7),
    -- ... other branding fields
);
```

## Troubleshooting

### Logo Not Displaying

**Problem**: Logo doesn't appear in PDF documents

**Solutions**:
1. Check file exists: `ls -la backend/public/images/branding/`
2. Verify file permissions: `chmod 644 company-logo.svg`
3. Check configuration: `php artisan config:show branding`
4. Clear cache: `php artisan config:clear`
5. Test file path in browser: `http://localhost:8000/images/branding/company-logo.svg`

### Logo Quality Issues

**Problem**: Logo appears blurry or pixelated

**Solutions**:
1. Use SVG format for perfect scaling
2. Increase PNG resolution to 300 DPI
3. Check logo dimensions match configuration
4. Ensure logo maintains aspect ratio

### Configuration Not Updating

**Problem**: Changes to .env not reflected

**Solutions**:
```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Restart queue workers if using queues
php artisan queue:restart
```

### PDF Generation Errors

**Problem**: PDF fails to generate with logo

**Solutions**:
1. Check dompdf supports image format
2. Verify file path is accessible
3. Check file size (keep under 1MB)
4. Test with different image formats
5. Check error logs: `storage/logs/laravel.log`

## Best Practices

### 1. Logo Management
- Store logos in version control
- Keep original high-resolution files
- Maintain multiple formats (SVG, PNG)
- Document logo usage guidelines
- Test logos on different backgrounds

### 2. Configuration Management
- Use environment variables for deployment-specific settings
- Keep sensitive information in .env (not in config files)
- Document all configuration options
- Version control configuration files
- Test configuration changes in staging first

### 3. Document Consistency
- Use same branding across all document types
- Maintain consistent color schemes
- Keep typography uniform
- Test all document types after branding changes
- Review generated PDFs regularly

### 4. Performance
- Optimize logo file size
- Use SVG for best performance
- Cache configuration values
- Minimize file system checks
- Consider CDN for logo hosting

### 5. Multi-Tenant Considerations
- Isolate tenant branding data
- Validate tenant-specific configurations
- Provide default fallbacks
- Test tenant switching
- Document tenant customization process

## Future Enhancements

### Planned Features
- [ ] Admin UI for branding management
- [ ] Logo upload interface
- [ ] Color picker for brand colors
- [ ] Preview system for documents
- [ ] Template customization UI
- [ ] Multi-language support
- [ ] Dynamic watermarks
- [ ] QR code integration
- [ ] Digital signatures
- [ ] Custom fonts support

### Integration Opportunities
- Email template branding
- Website header/footer
- Customer portal branding
- Vendor portal branding
- Mobile app branding
- Marketing materials

## Support

For questions or issues:
- Review this documentation
- Check `backend/config/branding.php`
- See `backend/public/images/branding/README.md`
- Review PDF templates in `backend/resources/views/pdf/`
- Contact development team

## Version History

- **v1.0.0** (February 2026)
  - Initial branding system implementation
  - Logo integration in all PDF templates
  - Configuration file created
  - Documentation completed
  - Example files provided

---

**Last Updated**: February 19, 2026
**Author**: Development Team
**Status**: ✅ Complete and Production Ready
