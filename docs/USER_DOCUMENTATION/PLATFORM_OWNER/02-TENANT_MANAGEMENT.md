# Tenant Management Guide

## **Overview**

As a Platform Owner, you have complete control over tenant lifecycle management, from onboarding to suspension. This guide covers all tenant management operations and best practices.

---

## **Tenant Lifecycle Management**

### **🆕 Creating New Tenants**

#### **Automated Tenant Provisioning**
```json
POST /api/platform/tenants
{
  "name": "ABC Electronics Store",
  "slug": "abc-electronics",
  "business_type": "electronics",
  "industry": "retail",
  "owner_email": "owner@abc-electronics.com",
  "subscription_plan": "starter",
  "custom_domain": "abc-electronics.com" // optional
}
```

#### **Pre-configured Business Types**
- **Electronics**: Consumer electronics and gadgets
- **Fashion**: Clothing, accessories, and apparel
- **Food & Beverage**: Restaurants, cafes, food delivery
- **Automotive**: Car parts, services, and accessories
- **Home & Decor**: Furniture, home improvement, decor
- **Manufacturing**: Custom products, etching, printing
- **Services**: Professional services and consultations

### **📊 Tenant Status Management**

#### **Status Types**
- **`active`**: Full platform access and functionality
- **`trial`**: Limited trial period with basic features
- **`suspended`**: Temporarily disabled due to payment/policy issues
- **`inactive`**: Permanently disabled or deleted
- **`pending`**: Awaiting setup completion or verification

#### **Status Operations**
```bash
# Suspend tenant for non-payment
PUT /api/platform/tenants/{id}/suspend
{
  "reason": "payment_overdue",
  "notification": true,
  "grace_period_days": 7
}

# Activate suspended tenant
PUT /api/platform/tenants/{id}/activate
{
  "reason": "payment_received",
  "notification": true
}
```

---

## **Current Tenant Portfolio**

### **🏢 Seeded Business Tenants**

Based on current database seeding, the platform includes:

#### **1. PT. Custom Etching Xenial** 
- **Slug**: `etchinx`
- **URL**: `canvastencil.com/etchinx/`
- **Admin**: `admin@etchinx.com`
- **Industry**: Manufacturing/Custom Products
- **Status**: Active (Demo Account)

#### **2. TechWorld Electronics** 
- **Slug**: `techworld-electronics`
- **Business Type**: Electronics retail
- **Products**: 45+ tech products and gadgets
- **Status**: Active

#### **3. Fashion Forward** 
- **Slug**: `fashion-forward`
- **Business Type**: Fashion and apparel
- **Products**: 40+ clothing and accessories
- **Status**: Active

#### **4. Gourmet Delights** 
- **Slug**: `gourmet-delights`
- **Business Type**: Food & beverage
- **Products**: 50+ gourmet food items
- **Status**: Active

#### **5. Auto Parts Central** 
- **Slug**: `auto-parts-central`
- **Business Type**: Automotive parts
- **Products**: 48+ automotive components
- **Status**: Active

#### **6. Home Design Hub** 
- **Slug**: `home-design-hub`
- **Business Type**: Home decor and furniture
- **Products**: 50+ home improvement items
- **Status**: Active

---

## **Tenant Analytics & Monitoring**

### **📈 Key Performance Indicators (KPIs)**

#### **Business Metrics (Per Tenant)**
- **Total Customers**: 30-50 customers per tenant
- **Product Catalog**: 40-50+ products per tenant  
- **Monthly Orders**: 60-80+ orders per tenant
- **Revenue Growth**: Month-over-month tracking
- **Customer Acquisition**: New vs returning customers

#### **Platform-Wide Statistics**
- **Total Tenants**: 6+ active business tenants
- **Total Customers**: 248+ customers across all tenants
- **Total Products**: 281+ products in marketplace
- **Total Orders**: 435+ processed orders
- **Total Vendors**: 137+ registered vendors
- **Total Users**: 50+ tenant users

### **🔍 Monitoring Dashboard**

#### **Real-time Metrics**
- **System Health**: Server status, database performance, API response times
- **Resource Usage**: Storage, bandwidth, CPU utilization per tenant
- **Transaction Volume**: Order processing, payment success rates
- **Security Events**: Login attempts, failed authentications, suspicious activity

#### **Alerts & Notifications**
- **Payment Overdue**: Automatic notifications for subscription renewals
- **Resource Limits**: Warnings when tenants approach usage limits
- **Security Incidents**: Immediate alerts for potential security breaches
- **System Downtime**: Infrastructure issues requiring immediate attention

---

## **Subscription & Billing Management**

### **💳 Subscription Tiers**

#### **Starter Plan** ($29/month)
- **Products**: Up to 100 products
- **Orders**: Up to 500 orders/month
- **Storage**: 5GB file storage
- **Bandwidth**: 50GB/month
- **Support**: Email support

#### **Professional Plan** ($99/month)
- **Products**: Up to 1,000 products
- **Orders**: Up to 2,500 orders/month
- **Storage**: 25GB file storage
- **Bandwidth**: 250GB/month
- **Support**: Priority email + chat support
- **Features**: Custom domain, advanced analytics

#### **Enterprise Plan** ($299/month)
- **Products**: Unlimited products
- **Orders**: Unlimited orders
- **Storage**: 100GB file storage
- **Bandwidth**: 1TB/month
- **Support**: 24/7 phone + dedicated account manager
- **Features**: White-label, API access, custom integrations

### **📊 Billing Operations**

#### **Payment Processing**
```json
// Process subscription payment
POST /api/platform/billing/charge
{
  "tenant_id": "abc-electronics",
  "amount": 9900, // $99.00 in cents
  "currency": "USD",
  "subscription_id": "sub_123abc",
  "billing_cycle": "monthly"
}
```

#### **Usage Tracking**
- **API Calls**: Per-tenant API rate limiting and usage tracking
- **Storage Usage**: File uploads, image storage, database size
- **Bandwidth**: Data transfer, CDN usage, media delivery
- **Transaction Fees**: Per-order processing fees (if applicable)

---

## **Domain & URL Management**

### **🌐 Custom Domain Setup**

#### **Domain Configuration Process**
1. **Tenant Request**: Tenant submits custom domain request
2. **DNS Verification**: Verify domain ownership via TXT records
3. **SSL Provisioning**: Automatic Let's Encrypt certificate installation
4. **Routing Setup**: Configure subdomain or custom domain routing
5. **Testing & Activation**: Verify functionality and activate

#### **Supported Domain Types**
- **Subdomains**: `tenant-name.canvastencil.com`
- **Custom Domains**: `tenant-business.com`
- **Multiple Domains**: Primary + additional domains per tenant
- **Wildcard SSL**: Support for multiple subdomains

---

## **Support & Troubleshooting**

### **🛠️ Common Issues**

#### **Tenant Onboarding Issues**
- **Email Verification**: Resend verification emails for new tenant owners
- **Permission Setup**: Ensure proper role assignments for tenant users
- **Domain Conflicts**: Resolve subdomain or custom domain conflicts
- **Payment Setup**: Assist with subscription and billing configuration

#### **Technical Support**
- **Data Migration**: Help tenants import existing business data
- **API Integration**: Support for third-party integrations
- **Performance Issues**: Optimize tenant-specific performance problems
- **Security Concerns**: Address security configurations and best practices

### **📞 Escalation Procedures**
1. **Level 1**: Automated system notifications and self-service
2. **Level 2**: Platform Manager handles standard operational issues
3. **Level 3**: Super Administrator for critical system issues
4. **Level 4**: Development team for platform bugs or enhancements

---

## **Best Practices**

### **✅ Tenant Management Best Practices**
- **Regular Monitoring**: Daily review of tenant health and performance
- **Proactive Communication**: Notify tenants of upcoming changes or maintenance
- **Data Backup**: Regular backups of tenant business data
- **Security Audits**: Periodic security reviews and vulnerability assessments
- **Performance Optimization**: Monitor and optimize resource usage across tenants

### **🔒 Security Considerations**
- **Access Control**: Strict RBAC implementation for platform and tenant access
- **Data Isolation**: Ensure complete data separation between tenants
- **Audit Logging**: Comprehensive logging of all platform admin activities
- **Compliance**: Maintain GDPR, CCPA, and other regulatory compliance
- **Incident Response**: Established procedures for security incidents

---

*This guide covers current tenant management capabilities through Phase 2 implementation. Additional features and automation will be added in future development phases.*