# User Guide: URL & Domain Management

## Introduction

Panduan ini akan membantu Anda mengkonfigurasi bagaimana users mengakses tenant Anda, menambahkan custom domains, dan memonitor URL analytics.

## Getting Started

1. Login ke CanvaStencil dashboard
2. Navigate ke **URL & Domain Management** section di sidebar
3. Pilih salah satu dari 3 menu:
   - **URL Configuration**: Atur pola URL utama
   - **Custom Domains**: Kelola custom domain names
   - **URL Analytics**: Lihat statistik akses URL

---

## URL Configuration

### Memilih Primary URL Pattern Anda

1. Buka **URL Configuration** dari sidebar
2. Pilih metode akses yang Anda inginkan:

#### Option 1: Subdomain-Based (Recommended)
- **Contoh**: `yourname.stencil.canvastack.com`
- **Kelebihan**: 
  - Mudah di-setup, tidak perlu domain sendiri
  - Professional dan mudah diingat
  - Automatic HTTPS support
- **Ideal untuk**: Sebagian besar users, testing, quick deployment

**Cara Setup:**
1. Toggle "Enable Subdomain Access" ON
2. Masukkan subdomain pattern Anda (contoh: `mytenant`)
3. Preview URL akan muncul: `https://mytenant.stencil.canvastack.com`
4. Klik "Save Configuration"

**Validation Rules:**
- Minimal 3 karakter, maksimal 63 karakter
- Hanya lowercase letters, numbers, dan hyphens (-)
- Harus dimulai dengan letter atau number
- Harus diakhiri dengan letter atau number

#### Option 2: Path-Based
- **Contoh**: `stencil.canvastack.com/yourname`
- **Kelebihan**:
  - Bagus untuk multi-tenant di bawah satu domain
  - Shared SEO benefits
- **Ideal untuk**: Enterprise deployments dengan subdirectories

**Cara Setup:**
1. Toggle "Enable Path-Based Access" ON
2. Masukkan path prefix Anda (contoh: `mytenant`)
3. Preview URL akan muncul: `https://stencil.canvastack.com/mytenant`
4. Klik "Save Configuration"

**Validation Rules:**
- Minimal 2 karakter, maksimal 50 karakter
- Hanya lowercase letters, numbers, dan hyphens (-)
- Harus dimulai dengan letter

#### Option 3: Custom Domain
- **Contoh**: `yourdomain.com`
- **Kelebihan**:
  - Full branding control
  - Professional appearance
  - Best untuk businesses dengan domain sendiri
- **Ideal untuk**: Businesses, production deployments

**Cara Setup:**
1. Pilih "Custom Domain" option
2. Anda akan diarahkan untuk menambahkan custom domain di **Custom Domains** page
3. Follow domain verification process (lihat section Custom Domains)

### Advanced Settings

#### Force HTTPS
- **What it does**: Automatically redirect semua HTTP requests ke HTTPS
- **Recommendation**: **ALWAYS ENABLE** untuk security
- **How to enable**: Toggle "Force HTTPS" ON

#### WWW Redirect
- **What it does**: Redirect `www.yourdomain.com` ke `yourdomain.com`
- **When to use**: Jika Anda prefer non-www URLs
- **How to enable**: Toggle "Enable WWW Redirect" ON

#### URL Analytics Tracking
- **What it does**: Track akses statistics untuk URLs Anda
- **Recommendation**: **ENABLE** untuk monitoring
- **How to enable**: Toggle "Enable URL Analytics" ON
- **Privacy**: Data tracked anonymously (IP addresses hashed)

### Saving Changes

Setelah configure settings:
1. Review semua changes
2. Klik **"Save Configuration"** button
3. Tunggu success toast notification
4. Changes applied immediately (no restart required)

---

## Custom Domains

### Adding Your First Custom Domain

1. Buka **Custom Domains** dari sidebar
2. Klik **"Add Domain"** button (atau "Add Your First Domain" jika belum ada domains)
3. Domain Verification Wizard akan terbuka

### Domain Verification Wizard (5 Steps)

#### Step 1: Add Domain
1. Masukkan domain name Anda (contoh: `example.com`)
2. Jangan include `http://` atau `https://`
3. Bisa masukkan:
   - Root domain: `example.com`
   - Subdomain: `shop.example.com`
4. Klik **"Next"**

**Validation:**
- Must be valid domain format
- Cannot be domain yang sudah digunakan tenant lain
- Cannot be subdomain dari `stencil.canvastack.com`

#### Step 2: Choose Verification Method

Pilih salah satu dari 3 metodes:

##### Option A: TXT Record (Recommended)
- **Difficulty**: Easy
- **Best for**: Most DNS providers
- **Time to verify**: 15 minutes - 24 hours (DNS propagation)

##### Option B: CNAME Record
- **Difficulty**: Easy
- **Best for**: Alternative jika TXT tidak tersedia
- **Time to verify**: 15 minutes - 24 hours

##### Option C: File Upload
- **Difficulty**: Advanced
- **Best for**: Users dengan server access
- **Time to verify**: Immediate (setelah file uploaded)

Klik **"Next"** setelah memilih method.

#### Step 3: Configure DNS

Anda akan melihat DNS configuration instructions:

**Information Displayed:**
- **Record Type**: TXT, CNAME, atau FILE
- **Host/Name**: Where to add the record
- **Value**: Verification token
- **TTL**: Recommended time-to-live (biasanya 3600)

**How to Add DNS Record:**

1. **Login ke DNS Provider Anda**
   - GoDaddy: https://dcc.godaddy.com/manage/dns
   - Cloudflare: https://dash.cloudflare.com
   - Namecheap: https://ap.www.namecheap.com/domains/list/
   - Other providers: Check their documentation

2. **Find DNS Management Section**
   - Look for "DNS", "DNS Records", "Manage DNS", atau "Zone File"

3. **Add New Record**
   - Click "Add Record" atau "+ Add"
   - Select record type (TXT atau CNAME)
   - Copy Host/Name dari wizard (use Copy button)
   - Copy Value dari wizard (use Copy button)
   - Set TTL (use recommended value)
   - Save record

4. **Wait for Propagation**
   - DNS changes bisa take 15 minutes - 48 hours
   - Usually propagate dalam 1-2 hours
   - Check propagation: https://www.whatsmydns.net/

5. **Click "Next"** dalam wizard

**Common DNS Provider Guides:**

| Provider | DNS Management URL | Help Link |
|----------|-------------------|-----------|
| GoDaddy | dcc.godaddy.com/manage/dns | [Help](https://www.godaddy.com/help/add-a-txt-record-19232) |
| Cloudflare | dash.cloudflare.com | [Help](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/) |
| Namecheap | ap.www.namecheap.com | [Help](https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/) |

#### Step 4: Verify Domain

1. Setelah DNS configured dan propagated, click **"Verify Now"**
2. System akan check DNS records
3. Jika verification **successful**:
   - Domain status berubah ke "Verified" ✅
   - Wizard proceeds ke Step 5
   - SSL certificate provisioning dimulai
4. Jika verification **failed**:
   - Error message akan ditampilkan
   - Check error details (usually DNS not found)
   - Wait longer untuk DNS propagation
   - Click "Verify Now" again setelah waiting

**Common Verification Errors:**

| Error Message | Solution |
|--------------|----------|
| "DNS records not found" | Wait longer (up to 48 hours), verify record added correctly |
| "Invalid DNS value" | Double-check value matches exactly (case-sensitive) |
| "Domain already verified by another tenant" | Domain sudah digunakan, contact support |
| "Too many verification attempts" | Wait 1 hour before trying again (rate limit) |

#### Step 5: SSL Setup

Setelah domain verified:
1. SSL certificate automatic provisioning dimulai
2. Usually takes 5-15 minutes
3. Status badge akan show:
   - **SSL Pending**: Certificate being issued
   - **SSL Active**: Certificate installed ✅
   - **SSL Failed**: Provisioning failed ❌ (contact support)

Klik **"Finish"** untuk close wizard.

### Managing Existing Domains

#### View Domain Status

Setiap domain card menampilkan:
- **Domain Name**: `example.com`
- **Primary Badge**: Jika ini primary domain
- **Verification Status**: Verified ✅, Pending ⏳, Failed ❌
- **SSL Status**: Active ✅, Pending ⏳, Expired ⚠️, Failed ❌
- **DNS Status**: Configured ✅, Pending ⏳

#### Set Primary Domain

Primary domain adalah default domain untuk tenant Anda.

**How to Set:**
1. Find domain yang ingin dijadikan primary
2. Klik **"Set as Primary"** button
3. Confirm action
4. Domain card akan update dengan "Primary" badge

**Rules:**
- Hanya 1 domain bisa jadi primary
- Domain must be **verified** before dapat set as primary
- Primary domain cannot be deleted (set another as primary first)

#### View DNS Instructions

Jika perlu review DNS configuration:
1. Klik **"View DNS"** button pada domain card
2. Dialog akan show DNS instructions
3. Copy values jika needed
4. Klik link "Check DNS Propagation" untuk verify

#### Delete Domain

**Warning**: Action ini permanent dan cannot be undone!

**How to Delete:**
1. Klik **"Delete"** button pada domain card (trash icon)
2. Confirmation dialog akan muncul
3. Read warning carefully
4. Klik **"Delete Domain"** untuk confirm
5. Domain akan removed immediately

**Restrictions:**
- Cannot delete primary domain
  - Solution: Set another domain as primary first
- Cannot delete jika domain sedang digunakan untuk critical operations

### Troubleshooting Domain Verification

#### Verification Fails After 24 Hours

**Checklist:**
- [ ] DNS record added correctly (no typos)
- [ ] Record type matches (TXT vs CNAME)
- [ ] Host/Name matches exactly
- [ ] Value matches exactly (case-sensitive)
- [ ] TTL set correctly (not too high)
- [ ] DNS propagated globally (check whatsmydns.net)

**Actions:**
1. Use https://www.whatsmydns.net/ untuk check propagation
2. Masukkan your Host/Name
3. Select TXT atau CNAME record type
4. Check jika value appears di multiple locations worldwide
5. Jika not propagated, wait longer atau contact DNS provider

#### SSL Certificate Pending Too Long

**Normal Wait Time**: 5-15 minutes

**If pending > 30 minutes:**
1. Check domain DNS points correctly
2. Ensure tidak ada CAA records blocking Let's Encrypt
3. Verify domain actually verified (not just pending)
4. Contact support dengan domain UUID

#### DNS Provider Specific Issues

**GoDaddy:**
- Kadang requires trailing dot (.) di host name
- TTL default biasanya 600

**Cloudflare:**
- Ensure "Proxy" toggled OFF (gray cloud) untuk verification records
- Cloudflare bisa delay DNS propagation

**Namecheap:**
- Jika using Namecheap nameservers, use "@" untuk root domain
- Jika using external nameservers, configure di nameserver dashboard

---

## URL Analytics

### Viewing Analytics Dashboard

1. Buka **URL Analytics** dari sidebar
2. Dashboard akan load dengan analytics data
3. Default period: **30 days**

### Understanding Metrics

#### Overview Cards (Top Section)

1. **Total Accesses**
   - Total jumlah URL visits
   - Includes all URL patterns (subdomain, path, custom domain)
   - Updates real-time (refresh setiap 5 minutes)

2. **Unique Visitors**
   - Number of distinct IP addresses
   - Deduplicated within selected period
   - Useful untuk understand actual user count

3. **Average Response Time**
   - Mean response time dalam milliseconds
   - Lower is better (< 500ms excellent)
   - Indicates performance health

4. **Custom Domain Usage**
   - Percentage of traffic dari custom domains
   - vs subdomain/path traffic
   - Useful untuk track adoption

#### Access Trends Chart (Line Chart)

**What it shows:**
- Trend akses dari waktu ke waktu
- 2 metrics:
  - **Total Accesses** (blue line): All visits
  - **Unique Visitors** (green line): Distinct IPs

**Period Options:**
- **Today**: Hourly breakdown
- **7 days**: Daily breakdown
- **30 days**: Daily breakdown
- **90 days**: Weekly breakdown
- **1 year**: Monthly breakdown

**How to Use:**
- Identify peak traffic times
- Spot trends (growing/declining)
- Detect anomalies (sudden spikes)

#### URL Pattern Breakdown (Pie Chart)

**What it shows:**
- Distribution traffic across pattern types:
  - Subdomain (e.g., `mytenant.stencil.canvastack.com`)
  - Path-Based (e.g., `stencil.canvastack.com/mytenant`)
  - Custom Domain (e.g., `yourdomain.com`)

**How to Use:**
- Understand which pattern users prefer
- Validate custom domain adoption
- Plan infrastructure based on usage

#### Geographic Distribution (Table)

**What it shows:**
- Countries where traffic originates
- Flag emoji untuk easy identification
- Access count dan percentage per country
- Sorted by access count (descending)

**How to Use:**
- Understand global reach
- Plan localization strategies
- Identify expansion opportunities

#### Performance Distribution (Bar Chart)

**What it shows:**
- Response time buckets:
  - **< 100ms**: Excellent ⚡
  - **100-500ms**: Good ✅
  - **500ms-1s**: Fair ⚠️
  - **1-2s**: Slow 🐢
  - **> 2s**: Very Slow 🚨

**How to Use:**
- Monitor performance health
- Identify performance degradation
- Plan optimization efforts

#### Top Referrers (List)

**What it shows:**
- Traffic sources (where visitors come from)
- "Direct Traffic" means no referrer (typed URL directly)
- Shows count dan percentage

**How to Use:**
- Understand marketing effectiveness
- Identify valuable traffic sources
- Optimize marketing spend

#### Device Breakdown (Donut Chart)

**What it shows:**
- Traffic distribution by device type:
  - **Desktop**: Traditional computers
  - **Mobile**: Smartphones
  - **Tablet**: iPads, Android tablets
  - **Bot**: Automated crawlers/bots

**How to Use:**
- Optimize UI untuk dominant device type
- Plan responsive design priorities
- Identify bot traffic

### Filtering by Period

**How to Change Period:**
1. Use period selector dropdown (top right)
2. Select period:
   - Today
   - 7 days
   - 30 days
   - 90 days
   - 1 year
3. All charts dan metrics update automatically

**Data Refresh:**
- Auto-refresh setiap 5 minutes
- Manual refresh: Reload page

### Enabling Analytics Tracking

Jika analytics tidak showing data:

**Check Settings:**
1. Go to **URL Configuration**
2. Scroll ke **Advanced Settings**
3. Ensure **"Enable URL Analytics"** toggled ON
4. Klik "Save Configuration"
5. Analytics akan mulai track setelah next visit

**Privacy Notice:**
- IP addresses di-hash untuk anonymity
- No personally identifiable information stored
- Compliant dengan GDPR/privacy regulations

---

## FAQs

### General

**Q: Berapa banyak custom domains yang bisa saya tambahkan?**  
A: Tidak ada hard limit untuk standard accounts. Enterprise accounts bisa request higher limits.

**Q: Apakah saya bisa menggunakan multiple URL patterns simultaneously?**  
A: Ya! Anda bisa enable subdomain, path-based, dan custom domains sekaligus. Users bisa access tenant melalui any enabled pattern.

**Q: Apakah URL changes require downtime?**  
A: Tidak. Semua changes applied immediately tanpa downtime.

### Domain Verification

**Q: Berapa lama domain verification takes?**  
A: Verification instant setelah DNS propagated. DNS propagation usually 15 minutes - 24 hours, occasionally up to 48 hours.

**Q: Apa yang terjadi jika verification fails multiple times?**  
A: Setelah 10 failed attempts dalam 1 hour, domain akan rate-limited. Wait 1 hour before trying again. Atau contact support untuk assistance.

**Q: Bisakah saya verify multiple domains sekaligus?**  
A: Ya! Anda bisa add multiple domains dan verify each independently.

**Q: Apakah saya bisa menggunakan wildcard subdomains (*.example.com)?**  
A: Tidak currently supported. Anda must add each subdomain individually.

### SSL Certificates

**Q: Berapa SSL certificates cost?**  
A: **FREE!** SSL certificates provided gratis via Let's Encrypt untuk all verified domains.

**Q: Berapa lama SSL certificates valid?**  
A: 90 days. Certificates **automatically renewed** 30 days before expiry.

**Q: Apa yang terjadi jika SSL expires?**  
A: System automatically attempts renewal. Jika renewal fails, Anda akan receive notification email 7 days before expiry.

**Q: Bisakah saya upload my own SSL certificate?**  
A: Currently tidak supported untuk standard accounts. Contact sales untuk enterprise SSL certificate options.

### Analytics

**Q: Seberapa accurate analytics data?**  
A: Analytics data real-time dengan <5 minute delay. Accuracy > 99% untuk most metrics.

**Q: Bisakah saya export analytics data?**  
A: Fitur export sedang development. Contact support untuk manual export requests.

**Q: Berapa lama analytics data retained?**  
A: Data retained 12 months. Older data archived dan available on request.

**Q: Apakah bots counted dalam analytics?**  
A: Yes, dalam "Device Breakdown" ada separate category untuk bot traffic. Other metrics include bot traffic kecuali specified otherwise.

---

## Support & Help

### Getting Help

Jika Anda need assistance:

1. **Check Documentation**
   - Review this user guide
   - Check troubleshooting sections
   - Read FAQs

2. **Contact Support**
   - Email: support@stencil.canvastack.com
   - Response time: 24 hours (business days)
   - Include domain UUID untuk faster resolution

3. **Community Forum**
   - Visit: https://community.canvastack.com
   - Search existing questions
   - Post new questions dengan "URL Management" tag

### Providing Feedback

We welcome feedback untuk improve features:

- Feature requests: features@canvastack.com
- Bug reports: bugs@canvastack.com
- Documentation improvements: docs@canvastack.com

---

**Version**: 1.0  
**Last Updated**: January 22, 2026  
**Maintained by**: CanvaStack Support Team
