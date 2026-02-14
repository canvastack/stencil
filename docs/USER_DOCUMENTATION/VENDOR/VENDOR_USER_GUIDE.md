# Vendor Portal User Guide

**Version:** 1.0  
**Last Updated:** February 12, 2026  
**Platform:** Custom Etching Xenial (PT CEX) Vendor Portal

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Login Process](#login-process)
4. [Dashboard Overview](#dashboard-overview)
5. [Quote Management](#quote-management)
6. [Quote Response Workflow](#quote-response-workflow)
7. [Message Thread Usage](#message-thread-usage)
8. [Profile Management](#profile-management)
9. [Troubleshooting](#troubleshooting)
10. [Frequently Asked Questions](#frequently-asked-questions)
11. [Support & Contact](#support--contact)

---

## Introduction

Welcome to the Custom Etching Xenial (PT CEX) Vendor Portal! This guide will help you navigate the portal, manage quote requests, and communicate effectively with the PT CEX team.

### What is the Vendor Portal?

The Vendor Portal is a secure web application that allows you to:
- View quote requests assigned to your company
- Respond to quotes (accept, reject, or counter offer)
- Communicate with PT CEX admins about specific quotes
- Track your performance metrics
- Manage your company profile

### System Requirements

**Supported Browsers:**
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

**Supported Devices:**
- Desktop computers (Windows, macOS, Linux)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

**Internet Connection:**
- Stable internet connection required
- Minimum 1 Mbps download speed recommended

---

## Getting Started

### Receiving Your Welcome Email

When PT CEX enables portal access for your company, you will receive a welcome email containing:

1. **Portal URL:** The web address to access the vendor portal
2. **Your Email Address:** Your login username
3. **Temporary Password:** A secure password for your first login
4. **Password Expiration:** Your temporary password expires in 7 days

**Important:** For security reasons, you must change your temporary password on first login.

### First-Time Login

1. Click the portal link in your welcome email
2. Enter your email address and temporary password
3. Click "Login"
4. You will be prompted to create a new password
5. Follow the password requirements:
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - At least 1 special character (!@#$%^&*)

---

## Login Process

### Standard Login

1. **Navigate to the Portal**
   - Open your web browser
   - Go to the vendor portal URL provided by PT CEX
   - Example: `https://vendor.ptcex.com/login`

2. **Enter Your Credentials**
   - Email Address: Your registered email
   - Password: Your secure password
   - Click "Login" button

3. **Two-Factor Authentication (if enabled)**
   - Enter the 6-digit code from your authenticator app
   - Click "Verify"

4. **Access Granted**
   - You will be redirected to your dashboard
   - Your session will remain active for 24 hours

### Security Features

**Account Lockout Protection:**
- After 5 failed login attempts, your account will be locked for 15 minutes
- This protects your account from unauthorized access attempts
- Contact PT CEX support if you need immediate assistance

**Session Management:**
- Your session expires after 24 hours of inactivity
- You will be automatically logged out for security
- You can manually log out at any time using the "Logout" button

**Rate Limiting:**
- Login attempts are limited to 5 per 15 minutes per IP address
- This prevents brute force attacks
- Wait 15 minutes if you exceed the limit

### Forgot Password

If you forget your password:

1. Click "Forgot Password?" on the login page
2. Enter your registered email address
3. Click "Send Reset Link"
4. Check your email for the password reset link
5. Click the link (valid for 60 minutes)
6. Enter your new password twice
7. Click "Reset Password"
8. You will be redirected to the login page
9. Log in with your new password

**Note:** Password reset requests are limited to 1 per 60 seconds per email address.

---

## Dashboard Overview

After logging in, you will see your vendor dashboard with the following sections:

### Summary Statistics

At the top of the dashboard, you'll see key metrics:

- **Total Quotes:** All quotes assigned to your company
- **Pending Quotes:** Quotes awaiting your response
- **Accepted Quotes:** Quotes you have accepted
- **Rejected Quotes:** Quotes you have declined

### Quote List

The main section displays all your quotes with:

- **Quote Number:** Unique identifier (e.g., Q-2026-001)
- **Order Number:** Related order reference
- **Customer Name:** End customer information
- **Status:** Current quote status
- **Created Date:** When the quote was sent to you
- **Expiration Date:** Deadline for your response

### Status Indicators

Quotes are color-coded by status:

- 🟢 **Sent/Pending Response:** Green - Awaiting your action
- 🔵 **Accepted:** Blue - You have accepted this quote
- 🔴 **Rejected:** Red - You have declined this quote
- 🟡 **Countered:** Yellow - You have submitted a counter offer
- ⚫ **Expired:** Gray - Quote deadline has passed

### Filtering and Search

Use the filter options to find specific quotes:

1. **Status Filter:** Select "All", "Pending", "Accepted", "Rejected", "Countered", or "Expired"
2. **Search Box:** Enter quote number, order number, or customer name
3. **Sort Options:** Sort by date (newest/oldest first)

---

## Quote Management

### Viewing Quote Details

To view complete quote information:

1. Click on any quote in the list
2. The quote detail page will display:
   - **Customer Information:** Name, email, company
   - **Order Information:** Order number, order date
   - **Product Details:** Name, quantity, specifications
   - **Pricing Information:** Requested pricing
   - **Timeline:** Created date, sent date, expiration date
   - **Admin Notes:** Special instructions or requirements
   - **Status History:** All status changes with timestamps

### Understanding Quote Status

**Draft:**
- Quote is being prepared by PT CEX admin
- Not yet visible to you

**Sent/Pending Response:**
- Quote has been sent to you
- Awaiting your response (accept, reject, or counter offer)
- You can respond until the expiration date

**Accepted:**
- You have accepted the quote
- PT CEX will proceed with the order
- No further action required from you

**Rejected:**
- You have declined the quote
- Includes your rejection reason
- Quote is closed

**Countered:**
- You have submitted a counter offer
- PT CEX admin will review your proposal
- They may accept, reject, or negotiate further

**Expired:**
- Quote deadline has passed without response
- You can no longer respond to this quote
- Contact PT CEX if you need an extension

### Quote Expiration

**Expiration Reminders:**
- You will receive an email reminder 3 days before expiration
- The dashboard highlights quotes expiring soon
- Plan to respond before the deadline

**After Expiration:**
- Expired quotes cannot be responded to
- Contact PT CEX admin if you need the quote reopened
- Admin can extend the expiration date if needed

---

## Quote Response Workflow

### Accepting a Quote

When you can fulfill the quote request:

1. **Open the Quote Detail Page**
   - Click on the quote from your dashboard

2. **Click "Accept Quote" Button**
   - Located at the top of the quote detail page

3. **Fill in the Acceptance Form**
   - **Estimated Delivery Days:** (Required)
     - Enter the number of days needed for production and delivery
     - Must be a positive number (e.g., 7, 14, 30)
   - **Notes:** (Optional)
     - Add any additional information
     - Maximum 1,000 characters

4. **Review Your Response**
   - Double-check the delivery estimate
   - Ensure notes are clear and accurate

5. **Submit Your Acceptance**
   - Click "Submit" button
   - You will see a success confirmation
   - PT CEX admins will be notified immediately

**What Happens Next:**
- Quote status changes to "Accepted"
- PT CEX receives an email notification
- PT CEX will proceed with order processing
- You may receive follow-up communication about production

### Rejecting a Quote

When you cannot fulfill the quote request:

1. **Open the Quote Detail Page**
   - Click on the quote from your dashboard

2. **Click "Reject Quote" Button**
   - Located at the top of the quote detail page

3. **Fill in the Rejection Form**
   - **Rejection Reason:** (Required)
     - Explain why you cannot fulfill this quote
     - Be specific and professional
     - Maximum 500 characters
     - Examples:
       - "Material not available in our inventory"
       - "Production capacity fully booked for this period"
       - "Specifications outside our capabilities"

4. **Review Your Response**
   - Ensure your reason is clear and professional

5. **Submit Your Rejection**
   - Click "Submit" button
   - You will see a success confirmation
   - PT CEX admins will be notified immediately

**What Happens Next:**
- Quote status changes to "Rejected"
- PT CEX receives an email notification with your reason
- PT CEX may contact you for clarification
- PT CEX will seek alternative vendors

### Submitting a Counter Offer

When you can fulfill the quote but with different terms:

1. **Open the Quote Detail Page**
   - Click on the quote from your dashboard

2. **Click "Counter Offer" Button**
   - Located at the top of the quote detail page

3. **Fill in the Counter Offer Form**
   - **Counter Offer Amount:** (Required)
     - Enter your proposed price
     - Must be a positive number
     - Use the same currency as the original quote
     - Example: 1500000 (for Rp 1,500,000)
   - **Notes:** (Optional)
     - Explain your counter offer
     - Include any conditions or requirements
     - Maximum 1,000 characters
     - Examples:
       - "Price includes premium material upgrade"
       - "Delivery time extended to 21 days due to custom specifications"

4. **Review Your Counter Offer**
   - Double-check the amount
   - Ensure notes explain your reasoning

5. **Submit Your Counter Offer**
   - Click "Submit" button
   - You will see a success confirmation
   - PT CEX admins will be notified immediately

**What Happens Next:**
- Quote status changes to "Countered"
- PT CEX receives an email notification with your proposal
- PT CEX admin will review your counter offer
- They may:
  - Accept your counter offer
  - Reject your counter offer
  - Submit a new counter offer (negotiation continues)
  - Contact you for discussion

### Response Validation

The system validates your responses to ensure data quality:

**Acceptance Validation:**
- ✅ Estimated delivery days must be a positive number
- ✅ Estimated delivery days cannot be zero or negative
- ✅ Notes are optional but limited to 1,000 characters

**Rejection Validation:**
- ✅ Rejection reason is required
- ✅ Rejection reason must be at least 10 characters
- ✅ Rejection reason limited to 500 characters

**Counter Offer Validation:**
- ✅ Counter offer amount is required
- ✅ Counter offer amount must be a positive number
- ✅ Counter offer amount cannot be zero or negative
- ✅ Notes are optional but limited to 1,000 characters

### Response Restrictions

You cannot respond to a quote if:

- ❌ Quote status is "Expired"
- ❌ You have already responded to the quote
- ❌ Quote has been closed by PT CEX admin
- ❌ Your portal access has been disabled

If you need to change your response, contact PT CEX support.

---

## Message Thread Usage

### Viewing Messages

Each quote has a dedicated message thread for communication:

1. **Open the Quote Detail Page**
   - Click on the quote from your dashboard

2. **Scroll to the Message Thread Section**
   - Located below the quote details
   - Shows all messages in chronological order

3. **Message Display**
   - **Sender Name:** Who sent the message (you or PT CEX admin)
   - **Timestamp:** When the message was sent
   - **Message Content:** The message text
   - **Attachments:** Any files attached to the message
   - **Read Status:** Whether the message has been read

### Sending Messages

To communicate with PT CEX about a specific quote:

1. **Navigate to the Message Thread**
   - Open the quote detail page
   - Scroll to the message section

2. **Type Your Message**
   - Click in the message text box
   - Type your message (maximum 5,000 characters)
   - Be clear and professional

3. **Attach Files (Optional)**
   - Click "Attach Files" button
   - Select files from your computer
   - Maximum 5 files per message
   - Maximum 10MB per file
   - Allowed file types:
     - PDF (.pdf)
     - Images (.jpg, .jpeg, .png)
     - Documents (.doc, .docx)
     - Spreadsheets (.xls, .xlsx)

4. **Review Your Message**
   - Check for typos and clarity
   - Verify attachments are correct

5. **Send Your Message**
   - Click "Send" button
   - You will see a success confirmation
   - PT CEX admins will be notified via email

### File Attachments

**Supported File Types:**
- PDF documents (.pdf)
- JPEG images (.jpg, .jpeg)
- PNG images (.png)
- Word documents (.doc, .docx)
- Excel spreadsheets (.xls, .xlsx)

**File Size Limits:**
- Maximum 10MB per file
- Maximum 5 files per message
- Total size per message: 50MB

**File Upload Tips:**
- Compress large images before uploading
- Use PDF format for multi-page documents
- Name files descriptively (e.g., "quote-Q2026-001-specifications.pdf")
- Scan documents at 300 DPI for clarity

### Message Notifications

**Email Notifications:**
- You receive an email when PT CEX sends you a message
- Email includes message preview and link to quote
- Configure notification preferences in your profile

**In-App Notifications:**
- Unread message count displayed on dashboard
- Quotes with unread messages are highlighted
- Messages are marked as read when you view them

### Message Best Practices

**Do:**
- ✅ Be professional and courteous
- ✅ Provide specific information
- ✅ Respond promptly to admin questions
- ✅ Use attachments for technical specifications
- ✅ Keep messages focused on the specific quote

**Don't:**
- ❌ Share sensitive personal information
- ❌ Use offensive or inappropriate language
- ❌ Send spam or irrelevant messages
- ❌ Upload executable files (.exe, .bat, .sh)
- ❌ Discuss multiple quotes in one message thread

---

## Profile Management

### Viewing Your Profile

To view your company profile:

1. Click your company name in the header
2. Select "Profile" from the dropdown menu
3. Your profile page displays:
   - **Company Information:** Name, email, phone, address
   - **Contact Person:** Primary contact name
   - **Performance Metrics:** Statistics and ratings
   - **Specializations:** Your product categories
   - **Portal Access Status:** Account status

### Performance Metrics

Your profile displays key performance indicators:

**Quote Statistics:**
- Total Quotes Received
- Accepted Quotes
- Rejected Quotes
- Pending Quotes

**Performance Ratings:**
- Acceptance Rate: Percentage of quotes you accept
- Average Response Time: How quickly you respond to quotes
- Completion Rate: Percentage of accepted orders completed
- Overall Rating: PT CEX's rating of your performance

**Response Time Calculation:**
- Measured from quote sent date to your response date
- Displayed in hours or days
- Faster response times improve your rating

### Updating Your Profile

To update your company information:

1. **Navigate to Profile Page**
   - Click your company name → "Profile"

2. **Click "Edit Profile" Button**
   - Located at the top of the profile page

3. **Update Fields**
   - **Email Address:** Your contact email
     - Must be unique (not used by another vendor)
     - Email verification required if changed
   - **Phone Number:** Your contact phone
   - **Contact Person:** Primary contact name
   - **Address:** Your company address
   - **Location:** City, province, country

4. **Save Changes**
   - Click "Save" button
   - You will see a success confirmation
   - Changes are logged in the audit trail

**Note:** You cannot change your company name or vendor code. Contact PT CEX support if these need to be updated.

### Email Verification

If you change your email address:

1. Enter your new email in the profile form
2. Click "Save"
3. Check your new email inbox
4. Click the verification link in the email
5. Your email will be updated after verification
6. You will receive a confirmation message

**Important:** Your old email remains active until you verify the new one.

---

## Troubleshooting

### Login Issues

#### Problem: "Invalid email or password"

**Possible Causes:**
- Incorrect email address
- Incorrect password
- Caps Lock is on
- Copy-paste added extra spaces

**Solutions:**
1. Double-check your email address
2. Verify your password (check Caps Lock)
3. Try typing credentials manually (don't copy-paste)
4. Use "Forgot Password" if you can't remember your password

#### Problem: "Account is locked"

**Cause:** Too many failed login attempts (5 in 15 minutes)

**Solutions:**
1. Wait 15 minutes for automatic unlock
2. Contact PT CEX support for immediate assistance
3. Use "Forgot Password" to reset your password

#### Problem: "Portal access is disabled"

**Cause:** PT CEX admin has disabled your portal access

**Solutions:**
1. Contact PT CEX support to inquire about your account status
2. Verify your company's vendor status with PT CEX
3. Check if there are outstanding issues with your account

#### Problem: "Onboarding not completed"

**Cause:** You haven't completed the onboarding process

**Solutions:**
1. Complete your profile information
2. Change your temporary password
3. Accept the terms and conditions
4. Contact PT CEX support if you need assistance

### Quote Response Issues

#### Problem: "Cannot respond to this quote"

**Possible Causes:**
- Quote has expired
- You have already responded
- Quote has been closed by admin

**Solutions:**
1. Check the quote expiration date
2. Verify you haven't already responded
3. Contact PT CEX admin to request quote reopening
4. Ask admin to extend the expiration date

#### Problem: "Estimated delivery days must be positive"

**Cause:** You entered zero or a negative number

**Solution:**
1. Enter a positive number (e.g., 7, 14, 30)
2. Estimate realistic production and delivery time
3. Include buffer time for unexpected delays

#### Problem: "Rejection reason is required"

**Cause:** You didn't provide a rejection reason

**Solution:**
1. Enter a clear, professional reason for rejection
2. Be specific about why you cannot fulfill the quote
3. Minimum 10 characters, maximum 500 characters

#### Problem: "Counter offer amount must be positive"

**Cause:** You entered zero or a negative amount

**Solution:**
1. Enter a positive number for your counter offer
2. Use the same currency as the original quote
3. Ensure the amount is realistic and justified

### Message Thread Issues

#### Problem: "File upload failed"

**Possible Causes:**
- File size exceeds 10MB
- File type not supported
- Network connection issue
- Too many files (maximum 5)

**Solutions:**
1. Check file size (must be under 10MB)
2. Verify file type is supported (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)
3. Compress large files before uploading
4. Upload fewer files per message
5. Check your internet connection

#### Problem: "Message is too long"

**Cause:** Message exceeds 5,000 characters

**Solution:**
1. Shorten your message
2. Break into multiple messages if needed
3. Use attachments for detailed information

#### Problem: "Cannot send message"

**Possible Causes:**
- Quote is closed
- Network connection issue
- Session expired

**Solutions:**
1. Verify quote is still active
2. Check your internet connection
3. Refresh the page and try again
4. Log out and log back in

### Profile Update Issues

#### Problem: "Email already in use"

**Cause:** Another vendor is using this email address

**Solution:**
1. Use a different email address
2. Contact PT CEX support if you believe this is an error
3. Verify you don't have multiple vendor accounts

#### Problem: "Email verification required"

**Cause:** You changed your email and need to verify it

**Solution:**
1. Check your new email inbox
2. Click the verification link
3. Check spam folder if you don't see the email
4. Request a new verification email if needed

### Performance Issues

#### Problem: Page loads slowly

**Possible Causes:**
- Slow internet connection
- Server is busy
- Browser cache issues

**Solutions:**
1. Check your internet connection speed
2. Clear your browser cache and cookies
3. Try a different browser
4. Refresh the page
5. Try again during off-peak hours

#### Problem: Dashboard not updating

**Cause:** Browser cache or session issue

**Solutions:**
1. Refresh the page (F5 or Ctrl+R)
2. Clear browser cache
3. Log out and log back in
4. Try a different browser

### Browser Compatibility Issues

#### Problem: Features not working properly

**Cause:** Outdated browser or unsupported browser

**Solutions:**
1. Update your browser to the latest version
2. Use a supported browser:
   - Google Chrome (latest 2 versions)
   - Mozilla Firefox (latest 2 versions)
   - Safari (latest 2 versions)
   - Microsoft Edge (latest 2 versions)
3. Enable JavaScript in your browser
4. Disable browser extensions that might interfere

### Mobile Device Issues

#### Problem: Layout looks broken on mobile

**Cause:** Unsupported mobile browser or old device

**Solutions:**
1. Update your mobile browser
2. Use Chrome or Safari on mobile
3. Rotate device to landscape orientation
4. Use desktop version if mobile version has issues

---

## Frequently Asked Questions

### Account & Access

**Q: How do I get access to the vendor portal?**

A: PT CEX admin must enable portal access for your company. Once enabled, you will receive a welcome email with login credentials.

**Q: Can I have multiple users from my company access the portal?**

A: Currently, each vendor company has one portal account. Contact PT CEX support if you need additional user accounts.

**Q: How long does my session last?**

A: Your session remains active for 24 hours of inactivity. After that, you will need to log in again.

**Q: Can I access the portal from multiple devices?**

A: Yes, you can log in from any device with a web browser. However, logging in from a new device will not log you out from other devices.

### Quotes & Responses

**Q: How long do I have to respond to a quote?**

A: Each quote has an expiration date set by PT CEX admin. You will receive a reminder email 3 days before expiration. Typical response windows are 7-14 days.

**Q: Can I change my response after submitting?**

A: No, responses are final once submitted. Contact PT CEX admin if you need to modify your response.

**Q: What happens if I don't respond before the expiration date?**

A: The quote will automatically expire and you will no longer be able to respond. Contact PT CEX admin if you need an extension.

**Q: Can I respond to an expired quote?**

A: No, expired quotes cannot be responded to. Contact PT CEX admin to request the quote be reopened with a new expiration date.

**Q: How many times can I submit a counter offer?**

A: You can submit one counter offer per quote. If PT CEX admin rejects your counter offer, they may send you a new quote or negotiate further via messages.

**Q: What currency should I use for counter offers?**

A: Use the same currency as the original quote (typically Indonesian Rupiah - IDR).

### Messages & Communication

**Q: How do I know if PT CEX has read my message?**

A: Currently, read receipts are only available for messages you receive. You will be notified via email when PT CEX responds to your message.

**Q: Can I delete a message after sending it?**

A: No, messages cannot be deleted once sent. Be sure to review your message before clicking "Send".

**Q: How long are messages stored?**

A: Messages are stored indefinitely as part of the quote history. They are available for reference at any time.

**Q: Can I send messages about multiple quotes in one thread?**

A: No, each quote has its own message thread. Keep messages focused on the specific quote.

### Profile & Performance

**Q: How is my acceptance rate calculated?**

A: Acceptance Rate = (Accepted Quotes / Total Quotes) × 100%

**Q: How is my average response time calculated?**

A: Average Response Time = Total time from quote sent to response / Number of responses

**Q: Can I improve my performance metrics?**

A: Yes, by:
- Responding to quotes promptly
- Accepting quotes when possible
- Providing accurate delivery estimates
- Completing orders on time
- Maintaining good communication

**Q: Who can see my performance metrics?**

A: Only you and PT CEX admins can see your performance metrics. They are not visible to other vendors or customers.

### Technical Issues

**Q: What should I do if I encounter an error?**

A: 1. Note the error message
2. Try refreshing the page
3. Clear your browser cache
4. Try a different browser
5. Contact PT CEX support with error details

**Q: Is my data secure?**

A: Yes, the vendor portal uses industry-standard security measures:
- HTTPS encryption for all data transmission
- Secure password hashing
- Session management and timeout
- Regular security audits
- Data isolation between vendors

**Q: Can I use the portal on my mobile phone?**

A: Yes, the portal is fully responsive and works on mobile devices. However, some features may be easier to use on a desktop or tablet.

---

## Support & Contact

### PT CEX Support Team

**Email:** support@ptcex.com  
**Phone:** +62 21 1234 5678  
**Business Hours:** Monday - Friday, 9:00 AM - 5:00 PM WIB

### Support Response Times

- **Critical Issues:** Within 2 hours during business hours
- **General Inquiries:** Within 24 hours
- **Feature Requests:** Within 3-5 business days

### What to Include in Support Requests

When contacting support, please provide:

1. **Your Company Name:** So we can locate your account
2. **Your Email Address:** Registered email for your account
3. **Quote Number:** If issue is related to a specific quote
4. **Error Message:** Exact text of any error messages
5. **Screenshots:** Visual evidence of the issue (if applicable)
6. **Browser & Device:** What you're using to access the portal
7. **Steps to Reproduce:** What you were doing when the issue occurred

### Emergency Contact

For urgent issues outside business hours:

**Emergency Hotline:** +62 812 3456 7890  
**Available:** 24/7 for critical production issues

### Feedback & Suggestions

We value your feedback! Help us improve the vendor portal:

**Feedback Email:** feedback@ptcex.com  
**Feature Requests:** Submit via support email with "Feature Request" in subject

### Training & Onboarding

Need additional training or onboarding assistance?

**Training Requests:** training@ptcex.com  
**Available:** Virtual training sessions via Zoom or Google Meet

---

## Appendix

### Glossary of Terms

- **Quote:** A request for pricing from PT CEX to a vendor
- **Order:** A confirmed purchase order from a customer
- **Vendor:** A supplier or manufacturer who provides products to PT CEX
- **Admin:** PT CEX staff member who manages orders and vendors
- **Portal:** The web application for vendor access
- **Session:** Your active login period (24 hours)
- **Expiration Date:** Deadline for responding to a quote
- **Counter Offer:** Your alternative pricing proposal
- **Message Thread:** Communication channel for a specific quote
- **Attachment:** File uploaded with a message
- **Performance Metrics:** Statistics about your quote responses

### Keyboard Shortcuts

- **Ctrl + S:** Save profile changes (when editing)
- **Esc:** Close modal dialogs
- **F5 or Ctrl + R:** Refresh page
- **Ctrl + F:** Search within page

### Status Code Reference

- **200 OK:** Request successful
- **400 Bad Request:** Invalid data submitted
- **401 Unauthorized:** Not logged in or session expired
- **403 Forbidden:** Access denied (portal access disabled)
- **404 Not Found:** Quote or resource not found
- **422 Unprocessable Entity:** Validation error
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server issue (contact support)

### Change Log

**Version 1.0 (February 12, 2026)**
- Initial release of vendor portal
- Login and authentication
- Quote management (view, accept, reject, counter offer)
- Message threads with file attachments
- Profile management
- Performance metrics

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Next Review:** May 12, 2026

---

© 2026 Custom Etching Xenial. All rights reserved.
