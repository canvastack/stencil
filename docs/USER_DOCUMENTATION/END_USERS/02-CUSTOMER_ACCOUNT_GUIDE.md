# Panduan Akun Customer - Customer Account Guide

**Target:** End Users / Customers  
**Version:** 2.0  
**Last Updated:** February 19, 2026

---

## 📋 Daftar Isi

1. [Selamat Datang](#selamat-datang)
2. [Jenis Akun Customer](#jenis-akun-customer)
3. [Registrasi Akun](#registrasi-akun)
4. [Login & Autentikasi](#login--autentikasi)
5. [Dashboard Customer](#dashboard-customer)
6. [Mengelola Profil](#mengelola-profil)
7. [Riwayat Pesanan](#riwayat-pesanan)
8. [Mengelola Alamat](#mengelola-alamat)
9. [Keamanan Akun](#keamanan-akun)
10. [Multi-Tenant Shopping](#multi-tenant-shopping)
11. [FAQ Customer](#faq-customer)

---

## Selamat Datang

### Tentang Sistem Customer

Selamat datang di **CanvaStencil Customer Portal** - sistem manajemen akun yang memungkinkan Anda untuk:

✨ **Belanja dengan Mudah**
- Simpan informasi profil Anda
- Checkout lebih cepat
- Track pesanan real-time
- Riwayat pembelian lengkap

🔐 **Keamanan Terjamin**
- Data pribadi terenkripsi
- Autentikasi aman
- Privacy terlindungi
- Isolasi data per tenant

📊 **Manajemen Lengkap**
- Dashboard personal
- Kelola multiple alamat
- Notifikasi pesanan
- Review & rating produk

### Apa yang Baru? (v2.0)

🎉 **Customer Authentication System**
- Login dengan email & password
- Email verification
- Password reset
- Account security features

🏪 **Multi-Tenant Support**
- Belanja dari multiple stores
- Data terpisah per tenant
- Single account, multiple stores
- Unified customer experience

---

## Jenis Akun Customer

### 1. Guest Customer (Tamu)

**Karakteristik:**
- ❌ Tidak perlu registrasi
- ❌ Tidak perlu login
- ✅ Bisa langsung checkout
- ❌ Tidak bisa track pesanan
- ❌ Tidak ada riwayat pembelian

**Kapan Menggunakan:**
- Pembelian satu kali
- Tidak ingin create account
- Checkout cepat

**Keterbatasan:**
- Harus input data setiap kali order
- Tidak bisa lihat riwayat
- Tidak bisa save alamat
- Tidak bisa review produk


### 2. Registered Customer (Terdaftar)

**Karakteristik:**
- ✅ Sudah registrasi dengan email & password
- ⏳ Email belum diverifikasi
- ✅ Bisa login ke portal
- ✅ Bisa track pesanan
- ⚠️ Beberapa fitur terbatas

**Kapan Menggunakan:**
- Ingin save data untuk pembelian berikutnya
- Perlu track pesanan
- Belum verifikasi email

**Fitur Tersedia:**
- Dashboard customer
- Riwayat pesanan
- Manage alamat
- Update profil

**Keterbatasan:**
- Mungkin perlu approval manual untuk order pertama
- Trust score lebih rendah
- Limit order value mungkin berlaku

### 3. Verified Customer (Terverifikasi)

**Karakteristik:**
- ✅ Email sudah diverifikasi
- ✅ Full access ke semua fitur
- ✅ Trust score lebih tinggi
- ✅ Instant order approval (most cases)
- ✅ Priority customer support

**Kapan Menggunakan:**
- Regular customer
- Frequent purchases
- High-value orders
- Business accounts

**Keuntungan:**
- ⚡ Faster order processing
- 💰 Possible discounts
- 🎁 Loyalty rewards
- 📞 Priority support
- 🔓 Higher order limits

### Perbandingan Jenis Akun

| Fitur | Guest | Registered | Verified |
|-------|-------|------------|----------|
| **Checkout** | ✅ | ✅ | ✅ |
| **Login Required** | ❌ | ✅ | ✅ |
| **Track Orders** | ❌ | ✅ | ✅ |
| **Order History** | ❌ | ✅ | ✅ |
| **Save Addresses** | ❌ | ✅ | ✅ |
| **Write Reviews** | ❌ | ✅ | ✅ |
| **Email Verified** | ❌ | ❌ | ✅ |
| **Instant Approval** | ❌ | ⚠️ | ✅ |
| **Trust Score** | 0 | 20-60 | 60-100 |
| **Priority Support** | ❌ | ❌ | ✅ |

---

## Registrasi Akun

### Cara Registrasi

#### Option 1: Dari Homepage

1. Kunjungi website tenant (contoh: `canvastencil.com/etchinx`)
2. Klik **"Register"** atau **"Sign Up"** di header
3. Isi form registrasi
4. Submit dan verifikasi email

#### Option 2: Saat Checkout

1. Tambahkan produk ke cart
2. Proceed to checkout
3. Pilih **"Create Account"** instead of guest checkout
4. Isi form registrasi
5. Complete checkout dan verifikasi email

#### Option 3: Dari Quote Email

1. Terima quote email
2. Klik **"Create Account"** di quote portal
3. Email Anda sudah pre-filled
4. Set password dan submit
5. Verifikasi email

### Form Registrasi

```
┌─ Create Your Account ─────────────────────────────┐
│                                                   │
│ Personal Information                              │
│ ─────────────────────────────────────────────    │
│ First Name *:                                     │
│ [John_________________________]                   │
│                                                   │
│ Last Name *:                                      │
│ [Doe__________________________]                   │
│                                                   │
│ Email Address *:                                  │
│ [john.doe@example.com_________]                   │
│                                                   │
│ Phone Number *:                                   │
│ [+62 812-3456-7890____________]                   │
│                                                   │
│ Company (Optional):                               │
│ [PT Example Company___________]                   │
│                                                   │
│ Account Security                                  │
│ ─────────────────────────────────────────────    │
│ Password *:                                       │
│ [••••••••••••••••••••••••••••]                   │
│ Must be at least 8 characters                     │
│                                                   │
│ Confirm Password *:                               │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ Password Strength: ████████░░ Strong              │
│                                                   │
│ Terms & Conditions                                │
│ ─────────────────────────────────────────────    │
│ [✓] I agree to Terms of Service                   │
│ [✓] I agree to Privacy Policy                     │
│ [ ] Subscribe to newsletter (optional)            │
│                                                   │
│ [Create Account]                                  │
│                                                   │
│ Already have an account? [Login]                  │
└───────────────────────────────────────────────────┘
```

### Password Requirements

Untuk keamanan akun Anda, password harus:

✅ **Minimum 8 karakter**
✅ **Kombinasi huruf besar & kecil**
✅ **Minimal 1 angka**
✅ **Minimal 1 karakter spesial** (@, #, $, !, dll)

**Password Strength Indicator:**
```
Weak:     ████░░░░░░ (Too short or simple)
Fair:     ████████░░ (Meets basic requirements)
Strong:   ██████████ (Recommended - complex & long)
```

**Good Password Examples:**
- `MyP@ssw0rd2024!`
- `Secure#Pass123`
- `Tr0phy$Winner!`

**Bad Password Examples:**
- `password` (too common)
- `12345678` (only numbers)
- `qwerty` (too simple)

### Email Verification

Setelah registrasi, Anda akan menerima email verifikasi:

```
┌─ Email Verification Required ─────────────────────┐
│                                                   │
│ ✉️  Check Your Email                              │
│                                                   │
│ We've sent a verification link to:                │
│ john.doe@example.com                              │
│                                                   │
│ Please click the link in the email to verify      │
│ your account and unlock all features.             │
│                                                   │
│ Didn't receive the email?                         │
│ • Check your spam/junk folder                     │
│ • Wait a few minutes                              │
│ • [Resend Verification Email]                     │
│                                                   │
│ [Continue to Dashboard]                           │
└───────────────────────────────────────────────────┘
```

### Verification Email Content

```
Subject: Verify Your Email - CanvaStencil

Hi John Doe,

Welcome to CanvaStencil! Please verify your email address 
to activate your account.

[Verify Email Address]

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
CanvaStencil Team
```

### Setelah Verifikasi

Klik link di email, dan Anda akan diarahkan ke:

```
┌─ Email Verified Successfully! ────────────────────┐
│                                                   │
│ ✅ Your email has been verified!                  │
│                                                   │
│ Your account is now fully activated.              │
│ You can now enjoy all features:                   │
│                                                   │
│ ✓ Full access to customer portal                 │
│ ✓ Instant order approval                          │
│ ✓ Priority customer support                       │
│ ✓ Loyalty rewards program                         │
│                                                   │
│ [Go to Dashboard]                                 │
└───────────────────────────────────────────────────┘
```

---

## Login & Autentikasi

### Cara Login

#### Step 1: Akses Login Page

**Option A: Dari Homepage**
```
Header: [Login] ← Click here
```

**Option B: Direct URL**
```
https://canvastencil.com/etchinx/customer/login
```

**Option C: Saat Checkout**
```
Checkout page: "Already have an account? [Login]"
```

#### Step 2: Isi Credentials

```
┌─ Customer Login ──────────────────────────────────┐
│                                                   │
│ Welcome Back!                                     │
│ Login to your customer account                    │
│                                                   │
│ Email Address:                                    │
│ [john.doe@example.com_________]                   │
│                                                   │
│ Password:                                         │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ [✓] Remember me                                   │
│                                                   │
│ [Login]                                           │
│                                                   │
│ [Forgot Password?]                                │
│                                                   │
│ Don't have an account? [Register]                 │
└───────────────────────────────────────────────────┘
```

#### Step 3: Login Success

Setelah login berhasil:
- ✅ Redirect ke dashboard atau halaman sebelumnya
- 🔐 Session token disimpan (secure)
- 📧 Email notifikasi login (optional)
- ⏰ Last login time updated

### Remember Me Feature

Jika Anda check **"Remember me"**:
- ✅ Stay logged in for 30 days
- ✅ No need to login again
- ⚠️ Only use on personal devices
- 🔒 Can logout anytime

### Forgot Password

Lupa password? Ikuti langkah ini:

#### Step 1: Request Reset

```
┌─ Forgot Password ─────────────────────────────────┐
│                                                   │
│ Reset Your Password                               │
│                                                   │
│ Enter your email address and we'll send you      │
│ a link to reset your password.                    │
│                                                   │
│ Email Address:                                    │
│ [john.doe@example.com_________]                   │
│                                                   │
│ [Send Reset Link]                                 │
│                                                   │
│ [Back to Login]                                   │
└───────────────────────────────────────────────────┘
```

#### Step 2: Check Email

```
┌─ Reset Link Sent ─────────────────────────────────┐
│                                                   │
│ ✉️  Check Your Email                              │
│                                                   │
│ We've sent a password reset link to:              │
│ john.doe@example.com                              │
│                                                   │
│ The link will expire in 1 hour.                   │
│                                                   │
│ Didn't receive the email?                         │
│ [Resend Reset Link]                               │
│                                                   │
│ [Back to Login]                                   │
└───────────────────────────────────────────────────┘
```

#### Step 3: Reset Password

Klik link di email, masukkan password baru:

```
┌─ Create New Password ─────────────────────────────┐
│                                                   │
│ New Password:                                     │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ Confirm New Password:                             │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ Password Strength: ████████░░ Strong              │
│                                                   │
│ [Reset Password]                                  │
└───────────────────────────────────────────────────┘
```

#### Step 4: Success

```
┌─ Password Reset Successful ───────────────────────┐
│                                                   │
│ ✅ Your password has been reset!                  │
│                                                   │
│ You can now login with your new password.         │
│                                                   │
│ [Login Now]                                       │
└───────────────────────────────────────────────────┘
```

### Account Security Features

#### Failed Login Protection

Sistem melindungi akun Anda dari brute force attacks:

```
After 5 failed login attempts:
┌─ Account Temporarily Locked ──────────────────────┐
│                                                   │
│ ⚠️  Too Many Failed Attempts                      │
│                                                   │
│ Your account has been temporarily locked for      │
│ security reasons.                                 │
│                                                   │
│ Locked until: 2:30 PM (30 minutes)                │
│                                                   │
│ You can:                                          │
│ • Wait for the lock to expire                     │
│ • [Reset Your Password]                           │
│ • [Contact Support]                               │
└───────────────────────────────────────────────────┘
```

**Security Measures:**
- 🔒 Account locked after 5 failed attempts
- ⏰ Lock duration: 30 minutes
- 📧 Email notification sent
- 🔓 Auto-unlock after timeout
- 🆘 Can contact support for immediate unlock

#### Login Notifications

Receive email when someone logs into your account:

```
Subject: New Login to Your Account

Hi John Doe,

We detected a new login to your account:

Date: February 19, 2026 at 2:15 PM
Device: Chrome on Windows
Location: Jakarta, Indonesia
IP: 103.xxx.xxx.xxx

If this was you, no action needed.

If this wasn't you, please:
1. Change your password immediately
2. Contact our support team

[Secure My Account]

Best regards,
CanvaStencil Team
```

---

## Dashboard Customer

### Dashboard Overview

Setelah login, Anda akan melihat dashboard personal:

```
┌─ Customer Dashboard ──────────────────────────────┐
│                                                   │
│ Welcome back, John Doe! 👋                        │
│                                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 📦 Orders   │ │ 💰 Spent    │ │ ⭐ Reviews  │ │
│ │     12      │ │ Rp 5.2M     │ │      8      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                   │
│ Recent Orders                                     │
│ ─────────────────────────────────────────────    │
│ ┌─────────────────────────────────────────────┐  │
│ │ #ORD-001234 • Processing 🔄                 │  │
│ │ 3 items • Rp 726,950                        │  │
│ │ Expected: Dec 30 - Jan 2                    │  │
│ │ [Track] [Details]                           │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ #ORD-001200 • Delivered ✅                  │  │
│ │ 2 items • Rp 450,000                        │  │
│ │ [Write Review] [Reorder]                    │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ Quick Actions                                     │
│ ─────────────────────────────────────────────    │
│ [🛒 Continue Shopping] [📦 View All Orders]      │
│ [⭐ Write Reviews] [📍 Manage Addresses]         │
└───────────────────────────────────────────────────┘
```

### Dashboard Sections

#### 1. Account Summary

```
┌─ Account Summary ─────────────────────────────────┐
│ Name: John Doe                                    │
│ Email: john.doe@example.com ✅ Verified           │
│ Member Since: January 2026                        │
│ Trust Score: 85/100 (Excellent) 🌟               │
│                                                   │
│ [Edit Profile]                                    │
└───────────────────────────────────────────────────┘
```

#### 2. Order Statistics

```
┌─ Your Statistics ─────────────────────────────────┐
│ Total Orders:        12 orders                    │
│ Completed Orders:    10 orders (83%)              │
│ Total Spent:         Rp 5,200,000                 │
│ Average Order:       Rp 433,333                   │
│ Last Order:          5 days ago                   │
│                                                   │
│ [View Detailed Stats]                             │
└───────────────────────────────────────────────────┘
```

#### 3. Trust Score

```
┌─ Trust Score ─────────────────────────────────────┐
│                                                   │
│ Your Trust Score: 85/100 🌟                       │
│ ████████████████████████████████████░░░░░         │
│                                                   │
│ Score Breakdown:                                  │
│ ✅ Email Verified:        +20 points              │
│ ✅ Successful Orders:     +40 points (10 orders)  │
│ ✅ Payment Success Rate:  +25 points (100%)       │
│                                                   │
│ Benefits:                                         │
│ • Instant order approval                          │
│ • Priority customer support                       │
│ • Eligible for loyalty rewards                    │
│                                                   │
│ [Learn More About Trust Score]                    │
└───────────────────────────────────────────────────┘
```

### Navigation Menu

```
┌─ Customer Portal ─────────────────────────────────┐
│                                                   │
│ 🏠 Dashboard                                      │
│ 📦 My Orders                                      │
│ 💬 My Reviews                                     │
│ 📍 Addresses                                      │
│ 👤 Profile Settings                               │
│ 🔐 Security                                       │
│ 🔔 Notifications                                  │
│ 🎁 Rewards & Loyalty                              │
│ 📞 Support                                        │
│ 🚪 Logout                                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Mengelola Profil

### Edit Profile

Akses: **Dashboard → Profile Settings**

```
┌─ Profile Settings ────────────────────────────────┐
│                                                   │
│ Personal Information                              │
│ ─────────────────────────────────────────────    │
│ First Name:                                       │
│ [John_________________________]                   │
│                                                   │
│ Last Name:                                        │
│ [Doe__________________________]                   │
│                                                   │
│ Email Address:                                    │
│ [john.doe@example.com_________] ✅ Verified       │
│ [Change Email]                                    │
│                                                   │
│ Phone Number:                                     │
│ [+62 812-3456-7890____________]                   │
│                                                   │
│ Company Information (Optional)                    │
│ ─────────────────────────────────────────────    │
│ Company Name:                                     │
│ [PT Example Company___________]                   │
│                                                   │
│ Tax ID / NPWP:                                    │
│ [12.345.678.9-012.000_________]                   │
│                                                   │
│ Business License:                                 │
│ [Upload Document] [Current: license.pdf]          │
│                                                   │
│ Notification Preferences                          │
│ ─────────────────────────────────────────────    │
│ [✓] Order updates via email                       │
│ [✓] Promotional emails                            │
│ [✓] SMS notifications                             │
│ [ ] Newsletter subscription                       │
│                                                   │
│ [Save Changes] [Cancel]                           │
└───────────────────────────────────────────────────┘
```

### Change Email

Untuk mengubah email:

```
┌─ Change Email Address ────────────────────────────┐
│                                                   │
│ Current Email:                                    │
│ john.doe@example.com                              │
│                                                   │
│ New Email Address:                                │
│ [john.new@example.com_________]                   │
│                                                   │
│ Confirm Password:                                 │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ ⚠️  You'll need to verify your new email address  │
│                                                   │
│ [Change Email] [Cancel]                           │
└───────────────────────────────────────────────────┘
```

### Profile Completion

```
┌─ Profile Completion ──────────────────────────────┐
│                                                   │
│ Your Profile: 75% Complete                        │
│ ████████████████████████░░░░░░░░░░                │
│                                                   │
│ Complete your profile to unlock benefits:         │
│ ✅ Basic info (name, email, phone)                │
│ ✅ Email verified                                 │
│ ⬜ Add profile photo                              │
│ ⬜ Add company information                        │
│ ⬜ Add default shipping address                   │
│                                                   │
│ [Complete Profile]                                │
└───────────────────────────────────────────────────┘
```


---

## Riwayat Pesanan

### My Orders Page

Akses: **Dashboard → My Orders**

```
┌─ My Orders ───────────────────────────────────────┐
│                                                   │
│ Filter: [All] [Pending] [Processing] [Completed] │
│ Sort: [Newest First ▼]                            │
│ Search: [Search orders...___________] [🔍]       │
│                                                   │
│ Showing 12 orders                                 │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ Order #ORD-2026-001234                      │  │
│ │ Date: Feb 19, 2026 • Status: Processing 🔄 │  │
│ │                                             │  │
│ │ 3 items • Total: Rp 726,950                 │  │
│ │ Expected delivery: Feb 26 - Feb 28          │  │
│ │                                             │  │
│ │ Items:                                      │  │
│ │ • Premium Metal Trophy (Medium, Brass) x1   │  │
│ │ • Glass Plaque Award (Large) x2             │  │
│ │                                             │  │
│ │ [Track Shipment] [View Details] [Contact]  │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ Order #ORD-2026-001200                      │  │
│ │ Date: Feb 10, 2026 • Status: Delivered ✅   │  │
│ │                                             │  │
│ │ 2 items • Total: Rp 450,000                 │  │
│ │ Delivered on: Feb 15, 2026                  │  │
│ │                                             │  │
│ │ [Write Review] [Reorder] [View Details]    │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ [Load More Orders]                                │
└───────────────────────────────────────────────────┘
```

### Order Detail View

Klik **"View Details"** untuk melihat detail lengkap:

```
┌─ Order Details ───────────────────────────────────┐
│                                                   │
│ Order #ORD-2026-001234                            │
│ Order Date: February 19, 2026 at 10:30 AM        │
│ Status: Processing 🔄                             │
│                                                   │
│ ═══ Order Timeline ═══════════════════════════   │
│ ● Feb 19, 11:15 AM - Payment Verified ✅          │
│ │ Payment confirmed via Bank Transfer            │
│ │                                                 │
│ ● Feb 19, 10:45 AM - Quote Accepted              │
│ │ Order approved and sent to production          │
│ │                                                 │
│ ○ Feb 19, 10:30 AM - Order Created               │
│   Waiting for payment                             │
│                                                   │
│ ═══ Items ════════════════════════════════════   │
│ 1. Premium Metal Trophy                           │
│    Size: Medium, Material: Brass                  │
│    Engraving: "JOHN DOE - CHAMPION 2025"          │
│    Quantity: 1 × Rp 300,000 = Rp 300,000          │
│                                                   │
│ 2. Glass Plaque Award                             │
│    Size: Large                                    │
│    Quantity: 2 × Rp 200,000 = Rp 400,000          │
│                                                   │
│ ═══ Shipping Address ═════════════════════════   │
│ John Doe                                          │
│ PT Example Company                                │
│ Jl. Sudirman No. 123                              │
│ Jakarta Selatan, DKI Jakarta 12345                │
│ Phone: +62 812-3456-7890                          │
│                                                   │
│ ═══ Payment Information ══════════════════════   │
│ Method: Bank Transfer (BCA)                       │
│ Status: Paid ✅                                   │
│ Payment Date: Feb 19, 2026 at 11:15 AM           │
│ Transaction ID: TRX-2026-789012                   │
│                                                   │
│ ═══ Price Summary ════════════════════════════   │
│ Subtotal:              Rp 700,000                 │
│ Discount (WELCOME10): -Rp  70,000                 │
│ Shipping (Express):    Rp  25,000                 │
│ Tax (11%):             Rp  71,950                 │
│ ──────────────────────────────────                │
│ TOTAL PAID:            Rp 726,950                 │
│                                                   │
│ [Download Invoice] [Track Shipment] [Contact]    │
│ [Cancel Order]                                    │
└───────────────────────────────────────────────────┘
```

### Order Status Tracking

```
┌─ Track Shipment ──────────────────────────────────┐
│ Order: #ORD-2026-001234                           │
│ Tracking Number: JNE123456789                     │
│ Carrier: JNE Express                              │
│                                                   │
│ Current Status: In Transit 🚚                     │
│ Estimated Delivery: Feb 26, 2026                  │
│                                                   │
│ ═══ Tracking History ═════════════════════════   │
│ ● Feb 21, 14:30 - In Transit                      │
│ │ Package is on the way to Jakarta                │
│ │ Current location: Bandung Hub                   │
│ │                                                 │
│ ● Feb 21, 08:00 - Shipped                         │
│ │ Package picked up by courier                    │
│ │ Origin: Vendor Facility, Bandung                │
│ │                                                 │
│ ● Feb 20, 16:00 - Ready for Pickup               │
│ │ Package ready at vendor facility                │
│ │                                                 │
│ ● Feb 19, 11:15 AM - Order Confirmed             │
│   Payment verified, processing started            │
│                                                   │
│ [Refresh Tracking] [Contact Courier]             │
└───────────────────────────────────────────────────┘
```

### Cancel Order

Untuk membatalkan pesanan:

```
┌─ Cancel Order ────────────────────────────────────┐
│                                                   │
│ ⚠️  Are you sure you want to cancel this order?   │
│                                                   │
│ Order: #ORD-2026-001234                           │
│ Total: Rp 726,950                                 │
│                                                   │
│ Cancellation Policy:                              │
│ • Before production: Full refund                  │
│ • During production: 50% refund                   │
│ • After shipment: Cannot cancel                   │
│                                                   │
│ Current Status: Processing                        │
│ Refund Amount: Rp 363,475 (50%)                   │
│                                                   │
│ Reason for cancellation:                          │
│ ○ Changed my mind                                 │
│ ○ Found better price elsewhere                    │
│ ○ Delivery too long                               │
│ ● Other (please specify)                          │
│                                                   │
│ Additional comments:                              │
│ [Need the items sooner than estimated_____]       │
│ [_________________________________________]       │
│                                                   │
│ Refund will be processed within 7-14 days.        │
│                                                   │
│ [Confirm Cancellation] [Keep Order]               │
└───────────────────────────────────────────────────┘
```

---

## Mengelola Alamat

### Address Book

Akses: **Dashboard → Addresses**

```
┌─ My Addresses ────────────────────────────────────┐
│                                                   │
│ [+ Add New Address]                               │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ 🏠 Home (Default)                           │  │
│ │                                             │  │
│ │ John Doe                                    │  │
│ │ Jl. Sudirman No. 123                        │  │
│ │ Jakarta Selatan, DKI Jakarta 12345          │  │
│ │ Phone: +62 812-3456-7890                    │  │
│ │                                             │  │
│ │ [Edit] [Delete] [Set as Default]           │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ 🏢 Office                                   │  │
│ │                                             │  │
│ │ John Doe                                    │  │
│ │ PT Example Company                          │  │
│ │ Jl. Thamrin No. 456                         │  │
│ │ Jakarta Pusat, DKI Jakarta 10110            │  │
│ │ Phone: +62 21-1234-5678                     │  │
│ │                                             │  │
│ │ [Edit] [Delete] [Set as Default]           │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### Add New Address

```
┌─ Add New Address ─────────────────────────────────┐
│                                                   │
│ Address Label:                                    │
│ ○ Home  ○ Office  ● Other: [Warehouse_____]      │
│                                                   │
│ Recipient Information                             │
│ ─────────────────────────────────────────────    │
│ Full Name *:                                      │
│ [John Doe_____________________]                   │
│                                                   │
│ Phone Number *:                                   │
│ [+62 812-3456-7890____________]                   │
│                                                   │
│ Company (Optional):                               │
│ [PT Example Company___________]                   │
│                                                   │
│ Address Details                                   │
│ ─────────────────────────────────────────────    │
│ Street Address *:                                 │
│ [Jl. Gatot Subroto No. 789____]                   │
│ [Building/Unit (optional)_____]                   │
│                                                   │
│ Province *:                                       │
│ [DKI Jakarta ▼]                                   │
│                                                   │
│ City *:                                           │
│ [Jakarta Selatan ▼]                               │
│                                                   │
│ District:                                         │
│ [Setiabudi ▼]                                     │
│                                                   │
│ Postal Code *:                                    │
│ [12920_________________________]                  │
│                                                   │
│ Additional Notes:                                 │
│ [Beside the main gate, blue building_____]        │
│ [_________________________________________]       │
│                                                   │
│ [✓] Set as default shipping address               │
│                                                   │
│ [Save Address] [Cancel]                           │
└───────────────────────────────────────────────────┘
```

### Edit Address

Sama seperti form add, tapi dengan data yang sudah terisi.

### Delete Address

```
┌─ Delete Address ──────────────────────────────────┐
│                                                   │
│ ⚠️  Are you sure you want to delete this address? │
│                                                   │
│ 🏢 Office                                         │
│ PT Example Company                                │
│ Jl. Thamrin No. 456                               │
│ Jakarta Pusat, DKI Jakarta 10110                  │
│                                                   │
│ This action cannot be undone.                     │
│                                                   │
│ [Delete] [Cancel]                                 │
└───────────────────────────────────────────────────┘
```

---

## Keamanan Akun

### Security Settings

Akses: **Dashboard → Security**

```
┌─ Security Settings ───────────────────────────────┐
│                                                   │
│ Password                                          │
│ ─────────────────────────────────────────────    │
│ Last changed: 30 days ago                         │
│ [Change Password]                                 │
│                                                   │
│ Login Activity                                    │
│ ─────────────────────────────────────────────    │
│ Last login: Today at 2:15 PM                      │
│ Device: Chrome on Windows                         │
│ Location: Jakarta, Indonesia                      │
│ [View All Activity]                               │
│                                                   │
│ Two-Factor Authentication (Coming Soon)           │
│ ─────────────────────────────────────────────    │
│ Status: Not Enabled                               │
│ Add extra security to your account                │
│ [Enable 2FA]                                      │
│                                                   │
│ Active Sessions                                   │
│ ─────────────────────────────────────────────    │
│ ● Current Session                                 │
│   Chrome on Windows • Jakarta                     │
│   Active now                                      │
│                                                   │
│ ○ Mobile Session                                  │
│   Safari on iPhone • Jakarta                      │
│   Last active: 2 hours ago                        │
│   [Revoke]                                        │
│                                                   │
│ [Logout All Other Sessions]                       │
│                                                   │
│ Account Deletion                                  │
│ ─────────────────────────────────────────────    │
│ Permanently delete your account and all data      │
│ [Delete Account]                                  │
└───────────────────────────────────────────────────┘
```

### Change Password

```
┌─ Change Password ─────────────────────────────────┐
│                                                   │
│ Current Password:                                 │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ New Password:                                     │
│ [••••••••••••••••••••••••••••]                   │
│ Password Strength: ████████░░ Strong              │
│                                                   │
│ Confirm New Password:                             │
│ [••••••••••••••••••••••••••••]                   │
│                                                   │
│ Password Requirements:                            │
│ ✅ At least 8 characters                          │
│ ✅ Contains uppercase & lowercase                 │
│ ✅ Contains numbers                               │
│ ✅ Contains special characters                    │
│                                                   │
│ [Change Password] [Cancel]                        │
└───────────────────────────────────────────────────┘
```

### Login Activity

```
┌─ Login Activity ──────────────────────────────────┐
│                                                   │
│ Recent login attempts and sessions                │
│                                                   │
│ ✅ Feb 19, 2026 at 2:15 PM                        │
│    Chrome on Windows                              │
│    Jakarta, Indonesia (103.xxx.xxx.xxx)           │
│    Status: Successful                             │
│                                                   │
│ ✅ Feb 18, 2026 at 9:30 AM                        │
│    Safari on iPhone                               │
│    Jakarta, Indonesia (103.xxx.xxx.xxx)           │
│    Status: Successful                             │
│                                                   │
│ ❌ Feb 17, 2026 at 11:45 PM                       │
│    Chrome on Windows                              │
│    Unknown Location (45.xxx.xxx.xxx)              │
│    Status: Failed (Wrong password)                │
│                                                   │
│ ⚠️  Suspicious activity detected?                 │
│     [Report & Secure Account]                     │
│                                                   │
│ [Load More Activity]                              │
└───────────────────────────────────────────────────┘
```

### Delete Account

```
┌─ Delete Account ──────────────────────────────────┐
│                                                   │
│ ⚠️  Warning: This action is permanent!            │
│                                                   │
│ Deleting your account will:                       │
│ • Remove all your personal information            │
│ • Delete your order history                       │
│ • Cancel any pending orders                       │
│ • Remove all saved addresses                      │
│ • Delete your reviews and ratings                 │
│                                                   │
│ This action CANNOT be undone.                     │
│                                                   │
│ To confirm, please type: DELETE                   │
│ [_____________________________]                   │
│                                                   │
│ Reason for leaving (optional):                    │
│ ○ No longer need the service                      │
│ ○ Privacy concerns                                │
│ ○ Found alternative                               │
│ ○ Other                                           │
│                                                   │
│ [Delete My Account] [Cancel]                      │
└───────────────────────────────────────────────────┘
```

---

## Multi-Tenant Shopping

### Konsep Multi-Tenant

CanvaStencil adalah platform multi-tenant, artinya:

🏪 **Multiple Stores, One Account**
- Satu akun customer bisa belanja di multiple tenant stores
- Data Anda terpisah per tenant (privacy terjamin)
- Login sekali, akses semua stores

### Bagaimana Cara Kerjanya?

#### Scenario: John Doe Belanja di 2 Tenant

**Tenant A: PT CEX (Custom Etching)**
```
URL: canvastencil.com/etchinx
John's Data:
- Customer ID: 101 (tenant A)
- Email: john@example.com
- Orders: 5 orders
- Total Spent: Rp 2,500,000
```

**Tenant B: PT ABC (Trophy Shop)**
```
URL: canvastencil.com/abc-trophy
John's Data:
- Customer ID: 202 (tenant B)
- Email: john@example.com (same email!)
- Orders: 3 orders
- Total Spent: Rp 1,200,000
```

### Data Isolation

```
┌─ Data Isolation Explained ────────────────────────┐
│                                                   │
│ Your email: john@example.com                      │
│                                                   │
│ ┌─ Tenant A (PT CEX) ─────────────────────────┐  │
│ │ Customer Record: #101                       │  │
│ │ Orders: 5                                   │  │
│ │ Data: Completely separate                   │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ Tenant B (PT ABC) ─────────────────────────┐  │
│ │ Customer Record: #202                       │  │
│ │ Orders: 3                                   │  │
│ │ Data: Completely separate                   │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ✅ Same email, different customer records         │
│ ✅ Data never mixed between tenants               │
│ ✅ Privacy guaranteed                             │
└───────────────────────────────────────────────────┘
```

### Belanja di Multiple Tenants

#### Step 1: Registrasi di Tenant Pertama

```
1. Visit: canvastencil.com/etchinx
2. Register: john@example.com
3. Verify email
4. Shop at PT CEX
```

#### Step 2: Belanja di Tenant Kedua

```
1. Visit: canvastencil.com/abc-trophy
2. Login dengan email yang sama: john@example.com
3. System automatically creates new customer record for Tenant B
4. Shop at PT ABC
```

### Unified Dashboard (Coming Soon)

Di masa depan, Anda akan punya unified dashboard:

```
┌─ My Stores ───────────────────────────────────────┐
│                                                   │
│ You're shopping at 2 stores:                      │
│                                                   │
│ ┌─ PT CEX (Custom Etching) ───────────────────┐  │
│ │ Orders: 5 • Spent: Rp 2,500,000             │  │
│ │ [View Orders] [Visit Store]                 │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─ PT ABC (Trophy Shop) ──────────────────────┐  │
│ │ Orders: 3 • Spent: Rp 1,200,000             │  │
│ │ [View Orders] [Visit Store]                 │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ Total Across All Stores:                          │
│ • 8 orders                                        │
│ • Rp 3,700,000 spent                              │
└───────────────────────────────────────────────────┘
```

### FAQ Multi-Tenant

**Q: Apakah saya perlu registrasi ulang di setiap tenant?**
A: Tidak! Login dengan email yang sama, system otomatis create customer record baru per tenant.

**Q: Apakah data saya aman?**
A: Ya! Data Anda di Tenant A tidak bisa diakses oleh Tenant B. Complete isolation.

**Q: Apakah saya bisa pakai email berbeda di tenant berbeda?**
A: Ya, bisa! Tapi lebih praktis pakai email yang sama untuk unified experience.

**Q: Bagaimana dengan password?**
A: Password Anda sama untuk semua tenant (karena satu akun email).

**Q: Apakah trust score saya sama di semua tenant?**
A: Tidak. Trust score dihitung per tenant berdasarkan aktivitas Anda di tenant tersebut.

---

## FAQ Customer

### Account & Registration

**Q: Apakah saya harus registrasi untuk belanja?**
A: Tidak wajib. Anda bisa checkout sebagai guest, tapi registrasi memberikan banyak keuntungan (track orders, save addresses, dll).

**Q: Berapa lama proses verifikasi email?**
A: Email verifikasi dikirim instantly. Jika tidak terima dalam 5 menit, check spam folder atau request resend.

**Q: Apakah saya bisa mengubah email setelah registrasi?**
A: Ya, bisa. Tapi Anda perlu verifikasi email baru.

**Q: Lupa password, bagaimana?**
A: Klik "Forgot Password" di login page, masukkan email, dan ikuti instruksi reset.

### Orders & Shopping

**Q: Bagaimana cara track pesanan saya?**
A: Login ke dashboard, pilih "My Orders", klik order yang ingin di-track, lalu klik "Track Shipment".

**Q: Berapa lama pesanan diproses?**
A: Tergantung produk. Biasanya 5-14 hari kerja. Timeline spesifik ada di quote/order details.

**Q: Bisakah saya cancel order?**
A: Ya, sebelum production dimulai (full refund). Setelah production (50% refund). Setelah shipped (tidak bisa cancel).

**Q: Bagaimana cara reorder produk yang sama?**
A: Di order history, klik "Reorder" pada order yang ingin diulang.

### Payment & Refunds

**Q: Metode pembayaran apa yang diterima?**
A: Bank transfer (primary), credit card, e-wallet (jika tersedia). Details di checkout.

**Q: Berapa lama refund diproses?**
A: 7-14 hari kerja setelah cancellation approved.

**Q: Apakah saya bisa bayar cicilan?**
A: Untuk order tertentu, tersedia payment plan (DP 50%, balance 50%). Check di quote details.

### Security & Privacy

**Q: Apakah data saya aman?**
A: Ya! Kami menggunakan enkripsi SSL, data isolation per tenant, dan security best practices.

**Q: Siapa yang bisa lihat data saya?**
A: Hanya Anda dan admin tenant tempat Anda belanja. Data tidak di-share ke tenant lain.

**Q: Bagaimana cara delete akun saya?**
A: Dashboard → Security → Delete Account. Tapi ingat, ini permanent!

### Multi-Tenant

**Q: Apakah saya perlu akun berbeda untuk setiap store?**
A: Tidak! Satu email bisa digunakan di multiple stores. System otomatis manage data per tenant.

**Q: Apakah order saya di Store A bisa dilihat oleh Store B?**
A: Tidak! Complete data isolation. Store A tidak bisa akses data Anda di Store B.

### Technical Issues

**Q: Website tidak loading, apa yang harus saya lakukan?**
A: Coba refresh page, clear browser cache, atau gunakan browser berbeda. Jika masih bermasalah, contact support.

**Q: Tidak bisa upload payment proof, kenapa?**
A: Pastikan file format JPG/PNG/PDF dan ukuran < 5MB. Coba browser lain jika masih error.

**Q: Email notifikasi tidak masuk, bagaimana?**
A: Check spam folder. Jika tidak ada, check notification preferences di profile settings.

### Support

**Q: Bagaimana cara contact customer support?**
A: Email: support@example.com | Phone: +62 xxx xxxx xxxx | Live Chat di website (9 AM - 5 PM WIB)

**Q: Berapa lama response time support?**
A: Email: < 24 jam | Phone: Immediate | Live Chat: < 5 menit (business hours)

---

## Tips & Best Practices

### Untuk Keamanan Akun

✅ **DO:**
- Gunakan password yang kuat dan unik
- Enable email notifications untuk login activity
- Logout dari shared devices
- Update password secara berkala
- Verify email address Anda

❌ **DON'T:**
- Share password dengan orang lain
- Use "Remember me" di public computers
- Ignore suspicious login notifications
- Use same password untuk multiple accounts

### Untuk Shopping Experience

✅ **DO:**
- Complete profile untuk faster checkout
- Save multiple addresses untuk convenience
- Verify order details sebelum payment
- Upload clear payment proof
- Track orders regularly

❌ **DON'T:**
- Miss payment deadlines
- Ignore order notifications
- Forget to verify email
- Skip reading terms & conditions

### Untuk Trust Score

✅ **DO:**
- Verify email address (+20 points)
- Complete orders successfully (+5 per order)
- Pay on time (improves payment success rate)
- Provide accurate information
- Communicate professionally

❌ **DON'T:**
- Cancel orders frequently
- Miss payment deadlines
- Provide fake information
- Ignore admin communications

---

## Need Help?

### Contact Information

**Customer Support**
- 📧 Email: support@canvastencil.com
- 📞 Phone: +62 21-1234-5678
- 💬 Live Chat: Available on website
- ⏰ Hours: Mon-Fri 9 AM - 5 PM WIB

**Technical Support**
- 📧 Email: tech@canvastencil.com
- 💬 Live Chat: For urgent technical issues

### Useful Resources

- 🌐 Help Center: https://help.canvastencil.com
- 📚 User Guides: https://docs.canvastencil.com
- 📹 Video Tutorials: https://canvastencil.com/tutorials
- 💬 Community Forum: https://community.canvastencil.com

### Social Media

Stay connected:
- Facebook: @canvastencil
- Instagram: @canvastencil
- Twitter: @canvastencil
- LinkedIn: CanvaStencil

---

## Thank You!

Terima kasih telah menjadi bagian dari CanvaStencil community! Kami berkomitmen untuk memberikan:

- ✨ Pengalaman belanja yang mudah dan aman
- 🔐 Keamanan data dan privacy terjamin
- 🚀 Layanan customer support yang responsif
- 💎 Produk berkualitas tinggi
- 😊 Kepuasan customer adalah prioritas kami

Happy Shopping! 🛒

---

**Document Version**: 2.0  
**Last Updated**: February 19, 2026  
**Language**: Bahasa Indonesia (Primary), English (Technical Terms)  
**Target Audience**: End Users / Customers

*For English version, visit: [Link to English guide]*
*For admin documentation, see: TENANTS/CUSTOMER_MANAGEMENT_GUIDE.md*
