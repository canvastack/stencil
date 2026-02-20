# Company Branding - Quick Start Guide

## 🎨 What Was Implemented

Company logo and branding support has been added to all PDF documents in the Customer Quote & Approval Workflow system.

## ✅ Features

- **Logo Display**: Company logo appears in all PDF document headers
- **Configurable Branding**: Easy customization via environment variables
- **Professional Styling**: Consistent branding across all document types
- **Multi-Format Support**: SVG, PNG, and JPG logo formats supported
- **Fallback Handling**: Graceful fallback to company name if logo unavailable

## 📄 Documents Updated

All PDF templates now include logo and branding:
- ✅ Quotation
- ✅ Proforma Invoice
- ✅ Tax Invoice
- ✅ Purchase Order
- ✅ Delivery Note
- ✅ Receipt

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Your Logo

Place your company logo in:
```
backend/public/images/branding/company-logo.png
```

**Recommended specs:**
- Format: SVG or PNG
- Max size: 200x80 pixels
- Transparent background

### Step 2: Configure Branding

Add to your `.env` file:
```env
BRANDING_COMPANY_NAME="Your Company Name"
BRANDING_TAGLINE="Your Company Tagline"
BRANDING_LOGO_PATH="images/branding/company-logo.png"
BRANDING_ADDRESS="Your Company Address"
BRANDING_PHONE="+62 xxx xxx xxxx"
BRANDING_EMAIL="info@yourcompany.com"
BRANDING_WEBSITE="https://www.yourcompany.com"
BRANDING_TAX_ID="xx.xxx.xxx.x-xxx.xxx"
```

### Step 3: Clear Cache & Test

```bash
# Clear configuration cache
php artisan config:clear

# Generate a test PDF to verify
# Go to admin panel → Create customer quote → Generate PDF
```

## 📋 Complete Configuration Example

Copy from `backend/.env.branding.example` to your `.env`:

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

# Colors
BRANDING_PRIMARY_COLOR="#4F46E5"
BRANDING_SECONDARY_COLOR="#059669"
BRANDING_ACCENT_COLOR="#DC2626"

# Footer
BRANDING_FOOTER_TEXT="Quality Etching Services Since 2020"

# Bank Details
BRANDING_BANK_NAME="Bank Central Asia (BCA)"
BRANDING_BANK_ACCOUNT_NAME="PT Custom Etching Xenial"
BRANDING_BANK_ACCOUNT_NUMBER="1234567890"
```

## 🔍 Verification Checklist

After setup, verify:
- [ ] Logo appears in PDF header
- [ ] Company name displays correctly
- [ ] Contact information is accurate
- [ ] Footer text shows properly
- [ ] All document types consistent
- [ ] Logo quality is good
- [ ] Colors match brand guidelines

## 📚 Additional Resources

- **Full Documentation**: `backend/docs/BRANDING_IMPLEMENTATION.md`
- **Logo Guidelines**: `backend/public/images/branding/README.md`
- **Configuration File**: `backend/config/branding.php`
- **Example Config**: `backend/.env.branding.example`

## 🆘 Troubleshooting

### Logo Not Showing?
```bash
# Check file exists
ls -la backend/public/images/branding/

# Check permissions
chmod 644 backend/public/images/branding/company-logo.*

# Clear cache
php artisan config:clear
```

### Configuration Not Updating?
```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Need Help?
- Review `backend/docs/BRANDING_IMPLEMENTATION.md`
- Check `backend/config/branding.php` for all options
- Contact development team

## 🎯 Next Steps

1. **Customize Your Branding**: Update all configuration values
2. **Add Your Logo**: Replace the placeholder logo
3. **Test All Documents**: Generate each document type
4. **Review Quality**: Check PDFs for professional appearance
5. **Deploy**: Push changes to production

---

**Status**: ✅ Complete and Ready to Use
**Version**: 1.0.0
**Last Updated**: February 19, 2026
