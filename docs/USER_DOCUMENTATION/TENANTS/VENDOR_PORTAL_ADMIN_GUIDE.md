# Vendor Portal Admin Guide
## Complete Guide for Managing Vendor Portal Access and Operations

**Version:** 1.0  
**Last Updated:** February 12, 2026  
**For:** PT CEX Admin Users (Admin, Manager, Operations)

---

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Vendor Onboarding Process](#vendor-onboarding-process)
4. [Quote Sending Workflow](#quote-sending-workflow)
5. [Managing Vendor Responses](#managing-vendor-responses)
6. [Notification Management](#notification-management)
7. [Vendor Performance Monitoring](#vendor-performance-monitoring)
8. [Audit Trail & Logging](#audit-trail--logging)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## 📚 Introduction

The Vendor Portal Admin Guide provides comprehensive instructions for PT CEX administrators to manage vendor portal access, onboard new vendors, send quotes, and monitor vendor activities.

### What is the Vendor Portal?

The Vendor Portal is a secure web application that enables vendors to:
- Access and view quote requests assigned to them
- Respond to quotes (accept, reject, or counter offer)
- Communicate with PT CEX admins about specific quotes
- Manage their company profile and view performance metrics

### Admin Responsibilities

As a PT CEX admin, you are responsible for:
- ✅ **Onboarding vendors** - Enable portal access and send welcome emails
- ✅ **Sending quotes** - Assign quotes to vendors and set expiration dates
- ✅ **Managing responses** - Review and act on vendor responses
- ✅ **Monitoring performance** - Track vendor metrics and response times
- ✅ **Communication** - Respond to vendor messages and inquiries
- ✅ **Access control** - Enable/disable vendor portal access as needed


### Required Permissions

To manage the vendor portal, you need the following permissions:
- `vendors.manage` - Full vendor management access
- `quotes.manage` - Quote management and sending
- `notifications.manage` - Notification configuration
- `audit-logs.view` - View vendor activity logs

---

## 🚀 Getting Started

### Accessing Vendor Management

1. **Login** to your PT CEX admin dashboard
2. Navigate to **Operations > Vendors**
3. You will see the **Vendor Management** interface with:
   - Vendor list with portal access status
   - Quick actions for onboarding and management
   - Performance metrics dashboard

### Understanding Vendor Portal Status

Each vendor has a portal access status indicator:

- 🟢 **Portal Enabled** - Vendor has active portal access
- 🔴 **Portal Disabled** - Vendor cannot access the portal
- 🟡 **Onboarding In Progress** - Vendor is completing onboarding
- ⚫ **Onboarding Pending** - Portal access not yet enabled

### Vendor Portal Access Requirements

Before enabling portal access, ensure the vendor has:
- ✅ Valid email address (unique, not used by another vendor)
- ✅ Complete company information (name, phone, address)
- ✅ Active vendor status (not inactive, suspended, or blacklisted)
- ✅ Approved by PT CEX management

---

## 👤 Vendor Onboarding Process

### Step 1: Enable Portal Access

To onboard a new vendor to the portal:

1. **Navigate to Vendor Detail Page**
   - Go to **Operations > Vendors**
   - Click on the vendor you want to onboard
   - You will see the vendor detail page

2. **Click "Enable Portal Access" Button**
   - Located in the vendor actions section
   - A confirmation dialog will appear

3. **Review Vendor Information**
   - Verify email address is correct
   - Confirm company name and contact details
   - Check that vendor status is "Active"

4. **Confirm Onboarding**
   - Click "Confirm" in the dialog
   - The system will:
     - Generate a secure temporary password (12 characters)
     - Create a vendor user account
     - Set onboarding status to "in_progress"
     - Enable portal access
     - Send welcome email automatically

5. **Success Confirmation**
   - You will see a success message
   - Vendor status updates to "Portal Enabled"
   - Welcome email is sent to vendor's email address


### Step 2: Welcome Email Content

The welcome email sent to vendors includes:

**Email Subject:** "Welcome to PT CEX Vendor Portal - Your Access is Ready"

**Email Content:**
- Greeting with vendor company name
- Portal URL link
- Login credentials (email and temporary password)
- Password expiration notice (7 days)
- Getting started instructions
- Link to vendor user guide
- PT CEX support contact information

**Important Notes:**
- Temporary password expires in 7 days
- Vendor must change password on first login
- Email is sent from your configured SMTP settings
- Email delivery is queued for reliability

### Step 3: Monitor Onboarding Progress

Track vendor onboarding status:

1. **Onboarding Status Indicators**
   - **Pending** - Portal access not yet enabled
   - **In Progress** - Welcome email sent, awaiting first login
   - **Completed** - Vendor has logged in and completed setup

2. **Check Last Portal Access**
   - View "Last Portal Access" timestamp
   - Indicates when vendor last logged in
   - Helps identify inactive vendors

3. **Verify Email Delivery**
   - Check "Welcome Email Sent At" timestamp
   - Confirms email was sent successfully
   - If null, email may have failed (check logs)

### Step 4: Resend Welcome Email (If Needed)

If vendor didn't receive the welcome email:

1. **Navigate to Vendor Detail Page**
   - Go to vendor detail page
   - Locate "Resend Welcome Email" button

2. **Click "Resend Welcome Email"**
   - Confirmation dialog appears
   - System will generate a new temporary password
   - Previous temporary password will be invalidated

3. **Confirm Resend**
   - Click "Confirm"
   - New welcome email is sent
   - "Welcome Email Sent At" timestamp updates

**When to Resend:**
- Vendor didn't receive original email (check spam folder first)
- Temporary password expired (after 7 days)
- Vendor lost their credentials
- Email address was incorrect (update first, then resend)

### Step 5: Disable Portal Access (If Needed)

To revoke vendor portal access:

1. **Navigate to Vendor Detail Page**
   - Go to vendor detail page
   - Locate "Disable Portal Access" button

2. **Click "Disable Portal Access"**
   - Confirmation dialog appears
   - Warning: Vendor will immediately lose access

3. **Confirm Disable**
   - Click "Confirm"
   - Portal access is disabled
   - Vendor cannot log in
   - Existing sessions are invalidated

**When to Disable:**
- Vendor relationship terminated
- Security concerns or suspicious activity
- Vendor requested access removal
- Vendor status changed to inactive/suspended/blacklisted


---

## 📋 Quote Sending Workflow

### Step 1: Create a Quote

Before sending to vendor, create the quote:

1. **Navigate to Quote Management**
   - Go to **Operations > Quotes**
   - Click "Create New Quote"

2. **Fill Quote Information**
   - **Order ID** - Link to customer order
   - **Vendor** - Select vendor from dropdown
   - **Product Details** - Specifications and requirements
   - **Requested Price** - Target price (optional)
   - **Quantity** - Number of units needed
   - **Expiration Date** - Deadline for vendor response (default: 7 days)
   - **Admin Notes** - Internal notes or special instructions

3. **Save as Draft**
   - Click "Save as Draft"
   - Quote status is "Draft"
   - Not yet visible to vendor

### Step 2: Review Quote Before Sending

Before sending to vendor, verify:

- ✅ **Vendor has portal access enabled**
- ✅ **Vendor status is "Active"**
- ✅ **Product specifications are complete and clear**
- ✅ **Expiration date is reasonable (typically 7-14 days)**
- ✅ **All required fields are filled**
- ✅ **Admin notes are appropriate for vendor to see**

### Step 3: Send Quote to Vendor

To send the quote:

1. **Open Quote Detail Page**
   - Navigate to the quote you want to send
   - Ensure status is "Draft"

2. **Click "Send to Vendor" Button**
   - Located at the top of the quote detail page
   - Confirmation dialog appears

3. **Review Send Confirmation**
   - Verify vendor name and email
   - Check expiration date
   - Confirm quote details are correct

4. **Confirm Send**
   - Click "Send" button
   - The system will:
     - Update quote status to "Sent"
     - Set sent_at timestamp
     - Send email notification to vendor
     - Create audit log entry

5. **Success Confirmation**
   - You will see a success message
   - Quote status updates to "Sent"
   - Vendor receives email notification

### Step 4: Quote Email Notification

The email sent to vendors includes:

**Email Subject:** "New Quote Request from PT CEX - [Quote Number]"

**Email Content:**
- Quote number and order reference
- Customer name (if appropriate)
- Product name and quantity
- Requested specifications
- Expiration date (prominently displayed)
- Direct link to quote detail page in vendor portal
- Instructions for responding
- PT CEX contact information

**Email Delivery:**
- Sent via configured SMTP settings
- Queued for asynchronous processing
- Retry logic (up to 3 attempts)
- Delivery status logged


### Step 5: Monitor Quote Status

After sending, track quote progress:

**Quote Status Flow:**
1. **Draft** → Quote created but not sent
2. **Sent** → Quote sent to vendor, awaiting response
3. **Accepted** → Vendor accepted the quote
4. **Rejected** → Vendor declined the quote
5. **Countered** → Vendor submitted counter offer
6. **Expired** → Quote deadline passed without response

**Status Indicators:**
- 🟢 **Sent** - Awaiting vendor response
- 🔵 **Accepted** - Vendor accepted, proceed with order
- 🔴 **Rejected** - Vendor declined, find alternative
- 🟡 **Countered** - Vendor proposed different terms
- ⚫ **Expired** - Deadline passed, no response

### Step 6: Extend Quote Expiration (If Needed)

If vendor needs more time:

1. **Open Quote Detail Page**
   - Navigate to the quote
   - Locate "Extend Expiration" button

2. **Click "Extend Expiration"**
   - Dialog appears with current expiration date
   - Enter new expiration date

3. **Set New Expiration Date**
   - Choose a reasonable extension (typically 3-7 days)
   - Add reason for extension (optional)

4. **Confirm Extension**
   - Click "Confirm"
   - System updates expiration date
   - Sends notification email to vendor
   - Creates audit log entry

**When to Extend:**
- Vendor requests more time (via message or phone)
- Complex specifications require additional review
- Vendor is waiting for material availability
- Holiday or weekend falls within deadline

### Step 7: Cancel Quote (If Needed)

To cancel a quote before vendor responds:

1. **Open Quote Detail Page**
   - Navigate to the quote
   - Locate "Cancel Quote" button

2. **Click "Cancel Quote"**
   - Confirmation dialog appears
   - Warning: This action cannot be undone

3. **Enter Cancellation Reason**
   - Provide reason for cancellation
   - This will be visible to vendor

4. **Confirm Cancellation**
   - Click "Confirm"
   - Quote status changes to "Cancelled"
   - Vendor receives notification
   - Vendor can no longer respond

**When to Cancel:**
- Customer cancelled the order
- Found alternative vendor
- Specifications changed significantly
- Quote sent to wrong vendor by mistake

---

## 💬 Managing Vendor Responses

### Understanding Response Types

Vendors can respond in three ways:

**1. Accept Quote**
- Vendor agrees to fulfill the quote
- Provides estimated delivery days
- May include notes or conditions
- Quote status changes to "Accepted"

**2. Reject Quote**
- Vendor declines the quote
- Must provide rejection reason
- Quote status changes to "Rejected"
- You need to find alternative vendor

**3. Counter Offer**
- Vendor proposes different terms
- Includes counter offer amount
- May include notes explaining the counter
- Quote status changes to "Countered"
- You can accept, reject, or negotiate further


### Receiving Response Notifications

When a vendor responds, you receive:

**1. Email Notification**
- Subject: "Vendor Response: [Quote Number] - [Response Type]"
- Includes vendor name and company
- Shows response type (Accepted/Rejected/Countered)
- Contains response details
- Direct link to quote detail page

**2. In-App Notification**
- Notification bell icon in header
- Red badge shows unread count
- Click to view notification dropdown
- Click notification to go to quote detail

**3. Dashboard Alert**
- Quote appears in "Pending Review" section
- Highlighted with response indicator
- Shows response timestamp

### Reviewing Accepted Quotes

When vendor accepts a quote:

1. **Open Quote Detail Page**
   - Click notification or navigate to quote
   - View acceptance details

2. **Review Acceptance Information**
   - **Estimated Delivery Days** - Vendor's production timeline
   - **Acceptance Notes** - Any conditions or comments
   - **Responded At** - When vendor accepted
   - **Response Time** - How long vendor took to respond

3. **Take Action**
   - **Proceed with Order** - Move forward with production
   - **Confirm with Vendor** - Send message for clarification
   - **Update Order Status** - Mark order as "In Production"
   - **Schedule Delivery** - Plan logistics based on delivery estimate

4. **Document Next Steps**
   - Add internal notes to quote
   - Update order timeline
   - Notify customer of acceptance
   - Track production progress

### Reviewing Rejected Quotes

When vendor rejects a quote:

1. **Open Quote Detail Page**
   - Click notification or navigate to quote
   - View rejection details

2. **Review Rejection Information**
   - **Rejection Reason** - Why vendor declined
   - **Responded At** - When vendor rejected
   - **Response Time** - How long vendor took to respond

3. **Analyze Rejection Reason**
   - **Material Unavailable** - Try different vendor or wait
   - **Capacity Issues** - Vendor too busy, find alternative
   - **Specifications Outside Capabilities** - Need specialized vendor
   - **Price Too Low** - Consider counter offer or adjust budget

4. **Take Action**
   - **Find Alternative Vendor** - Send quote to another vendor
   - **Adjust Specifications** - Modify requirements if possible
   - **Increase Budget** - If price was the issue
   - **Contact Vendor** - Discuss via message thread
   - **Cancel Order** - If no alternatives available

### Reviewing Counter Offers

When vendor submits a counter offer:

1. **Open Quote Detail Page**
   - Click notification or navigate to quote
   - View counter offer details

2. **Review Counter Offer Information**
   - **Counter Offer Amount** - Vendor's proposed price
   - **Original Amount** - Your requested price
   - **Price Difference** - Percentage increase/decrease
   - **Counter Offer Notes** - Vendor's explanation
   - **Responded At** - When vendor countered

3. **Evaluate Counter Offer**
   - Compare with budget and customer pricing
   - Review vendor's justification
   - Consider vendor's past performance
   - Check if alternative vendors available

4. **Decision Options**

   **Option A: Accept Counter Offer**
   - Click "Accept Counter Offer" button
   - Quote status changes to "Accepted"
   - Proceed with order at counter offer price
   - Vendor receives acceptance notification

   **Option B: Reject Counter Offer**
   - Click "Reject Counter Offer" button
   - Provide rejection reason
   - Quote status changes to "Rejected"
   - Find alternative vendor

   **Option C: Negotiate Further**
   - Use message thread to discuss
   - Propose alternative terms
   - May require creating new quote
   - Continue negotiation via messages

   **Option D: Request Clarification**
   - Send message to vendor
   - Ask for breakdown of costs
   - Request alternative options
   - Discuss timeline flexibility


### Using Message Thread for Communication

Each quote has a dedicated message thread:

1. **Access Message Thread**
   - Open quote detail page
   - Scroll to "Messages" section
   - View all messages chronologically

2. **Send Message to Vendor**
   - Type message in text box (max 5,000 characters)
   - Attach files if needed (max 5 files, 10MB each)
   - Click "Send" button
   - Vendor receives email notification

3. **Supported File Types**
   - PDF documents (.pdf)
   - Images (.jpg, .jpeg, .png)
   - Word documents (.doc, .docx)
   - Excel spreadsheets (.xls, .xlsx)

4. **Message Best Practices**
   - Be clear and professional
   - Reference specific quote details
   - Provide complete information
   - Respond promptly to vendor questions
   - Keep messages focused on the quote

5. **View Message History**
   - All messages are preserved
   - Shows sender name and timestamp
   - Displays read status
   - Includes attachment downloads

---

## 🔔 Notification Management

### Configuring Notification Preferences

Customize how you receive notifications:

1. **Navigate to Settings**
   - Go to **Admin > Settings > Notifications**
   - Or click your profile → "Notification Preferences"

2. **Notification Types**

   **Vendor Response Notifications:**
   - ✅ Email notification when vendor accepts quote
   - ✅ Email notification when vendor rejects quote
   - ✅ Email notification when vendor submits counter offer
   - ✅ In-app notification for all vendor responses

   **Quote Expiration Notifications:**
   - ✅ Email reminder 3 days before quote expires
   - ✅ Email notification when quote expires
   - ✅ In-app notification for expiring quotes

   **Vendor Message Notifications:**
   - ✅ Email notification when vendor sends message
   - ✅ In-app notification for new messages
   - ✅ Daily digest of unread messages

   **Vendor Onboarding Notifications:**
   - ✅ Email confirmation when vendor completes onboarding
   - ✅ Email alert when vendor first logs in
   - ✅ In-app notification for onboarding milestones

3. **Configure Each Notification Type**
   - Toggle email on/off
   - Toggle in-app on/off
   - Set notification frequency (immediate, hourly, daily)
   - Choose notification priority (high, normal, low)

4. **Save Preferences**
   - Click "Save Preferences"
   - Changes take effect immediately
   - You can update anytime

### Managing In-App Notifications

**Viewing Notifications:**
1. Click notification bell icon in header
2. Red badge shows unread count
3. Dropdown displays recent notifications
4. Click notification to view details

**Notification Actions:**
- **Mark as Read** - Click notification or "Mark as Read" button
- **Mark All as Read** - Click "Mark All as Read" at bottom
- **Delete Notification** - Click "X" icon (optional)
- **View All** - Click "View All Notifications" for full list

**Notification Filters:**
- Filter by type (responses, messages, expirations)
- Filter by date range
- Filter by vendor
- Filter by read/unread status


### Email Notification Settings

**SMTP Configuration:**
- Configured in **Admin > Settings > Email**
- Uses your existing email settings
- Supports SMTP, SendGrid, Mailgun
- Test email delivery before going live

**Email Templates:**
- Professional PT CEX branding
- Customizable sender name and address
- Includes company logo and colors
- Mobile-responsive design

**Email Delivery:**
- Queued for reliability
- Retry logic (up to 3 attempts)
- Delivery status tracking
- Failed email logging

### Notification Troubleshooting

**Problem: Not receiving email notifications**

Solutions:
1. Check spam/junk folder
2. Verify email address in your profile
3. Check notification preferences are enabled
4. Test SMTP configuration in settings
5. Check email delivery logs

**Problem: Too many notifications**

Solutions:
1. Adjust notification frequency (daily digest instead of immediate)
2. Disable less important notification types
3. Use filters to focus on priority notifications
4. Set up notification rules

**Problem: In-app notifications not appearing**

Solutions:
1. Refresh the page
2. Clear browser cache
3. Check notification permissions in browser
4. Verify you're logged in
5. Check notification preferences are enabled

---

## 📊 Vendor Performance Monitoring

### Viewing Vendor Performance Metrics

Track vendor performance in the portal:

1. **Navigate to Vendor Detail Page**
   - Go to **Operations > Vendors**
   - Click on vendor name
   - Scroll to "Performance Metrics" section

2. **Key Performance Indicators (KPIs)**

   **Quote Response Metrics:**
   - **Total Quotes Received** - All quotes sent to vendor
   - **Accepted Quotes** - Number of acceptances
   - **Rejected Quotes** - Number of rejections
   - **Pending Quotes** - Awaiting response
   - **Expired Quotes** - Deadline passed without response

   **Performance Rates:**
   - **Acceptance Rate** - (Accepted / Total) × 100%
   - **Rejection Rate** - (Rejected / Total) × 100%
   - **Response Rate** - (Responded / Total) × 100%
   - **Expiration Rate** - (Expired / Total) × 100%

   **Response Time Metrics:**
   - **Average Response Time** - Mean time to respond
   - **Fastest Response** - Quickest response time
   - **Slowest Response** - Longest response time
   - **Median Response Time** - Middle value

   **Portal Activity:**
   - **Last Portal Access** - Most recent login
   - **Total Logins** - Number of portal sessions
   - **Active Days** - Days with portal activity
   - **Onboarding Completed** - Date completed setup

3. **Performance Trends**
   - View charts showing performance over time
   - Compare current vs previous periods
   - Identify improvement or decline
   - Spot patterns and anomalies

### Vendor Performance Dashboard

Access comprehensive performance overview:

1. **Navigate to Performance Dashboard**
   - Go to **Operations > Vendors > Performance**
   - View aggregated metrics for all vendors

2. **Dashboard Sections**

   **Top Performers:**
   - Vendors with highest acceptance rates
   - Fastest average response times
   - Most reliable vendors
   - Ranked by overall performance score

   **Underperformers:**
   - Vendors with low acceptance rates
   - Slow response times
   - High expiration rates
   - Require attention or follow-up

   **Response Time Distribution:**
   - Chart showing response time ranges
   - Percentage of vendors in each range
   - Industry benchmarks comparison

   **Acceptance Rate Distribution:**
   - Chart showing acceptance rate ranges
   - Identify vendors needing improvement
   - Compare against targets

3. **Performance Filters**
   - Filter by date range
   - Filter by vendor status
   - Filter by specialization
   - Filter by performance tier


### Performance-Based Actions

Based on vendor performance, take appropriate actions:

**For High Performers (Acceptance Rate > 80%, Fast Response):**
- ✅ Prioritize for future quotes
- ✅ Offer preferred vendor status
- ✅ Increase quote volume
- ✅ Negotiate better terms
- ✅ Build long-term partnership

**For Average Performers (Acceptance Rate 50-80%):**
- ⚠️ Monitor performance trends
- ⚠️ Provide feedback and guidance
- ⚠️ Discuss improvement opportunities
- ⚠️ Maintain current relationship
- ⚠️ Consider for standard quotes

**For Low Performers (Acceptance Rate < 50%, Slow Response):**
- ❌ Reduce quote volume
- ❌ Investigate performance issues
- ❌ Provide performance improvement plan
- ❌ Consider alternative vendors
- ❌ May suspend or terminate relationship

**For Inactive Vendors (No Portal Activity):**
- 📧 Send reminder email
- 📧 Contact via phone
- 📧 Verify contact information
- 📧 Resend welcome email if needed
- 📧 Disable portal access if unresponsive

---

## 📝 Audit Trail & Logging

### Understanding Audit Logs

The system logs all vendor portal activities:

**Logged Actions:**
- Vendor login and logout events
- Quote responses (accept, reject, counter)
- Profile updates
- Message sends
- Password reset requests
- Portal access changes
- Onboarding events

**Audit Log Information:**
- **User** - Who performed the action
- **Action Type** - What was done
- **Resource** - What was affected (quote, vendor, profile)
- **Timestamp** - When it occurred
- **IP Address** - Where it came from
- **User Agent** - Browser/device used
- **Old Values** - Previous state (for updates)
- **New Values** - New state (for updates)

### Viewing Vendor Audit Logs

To view audit logs for a specific vendor:

1. **Navigate to Vendor Detail Page**
   - Go to **Operations > Vendors**
   - Click on vendor name
   - Scroll to "Audit Trail" section

2. **View Audit Log Entries**
   - Chronological list of all actions
   - Most recent actions at the top
   - Expandable entries for details

3. **Filter Audit Logs**
   - **By Date Range** - Select start and end dates
   - **By Action Type** - Login, quote response, profile update, etc.
   - **By User** - Filter by specific vendor user
   - **By Resource** - Filter by quote, profile, etc.

4. **Export Audit Logs**
   - Click "Export to CSV" button
   - Select date range and filters
   - Download CSV file
   - Use for reporting or compliance

### Audit Log Use Cases

**Security Monitoring:**
- Track failed login attempts
- Identify suspicious activity
- Monitor access patterns
- Detect unauthorized access attempts

**Performance Analysis:**
- Analyze response time patterns
- Track vendor engagement
- Identify bottlenecks
- Measure portal adoption

**Compliance & Reporting:**
- Provide audit trail for compliance
- Generate activity reports
- Document vendor interactions
- Support dispute resolution

**Troubleshooting:**
- Investigate vendor issues
- Track down errors
- Verify actions taken
- Understand user behavior


### Audit Log Retention

**Retention Policy:**
- Audit logs are retained for 2 years
- Logs older than 2 years are automatically deleted
- Export important logs before deletion
- Comply with data retention regulations

**Data Privacy:**
- Audit logs contain sensitive information
- Access restricted to authorized admins
- Logs are tenant-scoped (isolated)
- Comply with GDPR and privacy laws

---

## 🔧 Troubleshooting

### Vendor Cannot Log In

**Problem: Vendor reports "Invalid email or password"**

Troubleshooting steps:
1. Verify vendor email address is correct
2. Check if portal access is enabled
3. Verify vendor status is "Active"
4. Check if onboarding is completed
5. Resend welcome email with new password
6. Check audit logs for failed login attempts

**Problem: Vendor reports "Account is locked"**

Cause: Too many failed login attempts (5 in 15 minutes)

Solutions:
1. Wait 15 minutes for automatic unlock
2. Manually unlock account (if feature available)
3. Resend welcome email with new password
4. Verify vendor is using correct credentials

**Problem: Vendor reports "Portal access is disabled"**

Cause: Portal access was disabled by admin

Solutions:
1. Check vendor detail page for portal status
2. Re-enable portal access if appropriate
3. Verify vendor status is "Active"
4. Resend welcome email after enabling

### Quote Sending Issues

**Problem: Quote not appearing in vendor portal**

Troubleshooting steps:
1. Verify quote status is "Sent" (not "Draft")
2. Check if vendor has portal access enabled
3. Verify vendor email is correct
4. Check if quote was assigned to correct vendor
5. Ask vendor to refresh their browser
6. Check audit logs for send action

**Problem: Vendor didn't receive quote email**

Troubleshooting steps:
1. Check vendor's spam/junk folder
2. Verify email address is correct
3. Check email delivery logs
4. Test SMTP configuration
5. Resend quote notification manually
6. Verify email queue is processing

**Problem: Cannot send quote to vendor**

Possible causes and solutions:
1. **Vendor has no portal access** - Enable portal access first
2. **Vendor status is not Active** - Change status to Active
3. **Quote is already sent** - Cannot send twice
4. **Missing required fields** - Complete all required fields
5. **System error** - Check error logs, contact support

### Vendor Response Issues

**Problem: Vendor cannot respond to quote**

Troubleshooting steps:
1. Check if quote has expired
2. Verify vendor hasn't already responded
3. Check if quote status allows responses
4. Verify vendor owns the quote
5. Check audit logs for error messages
6. Extend expiration date if needed

**Problem: Vendor response not showing in admin panel**

Troubleshooting steps:
1. Refresh the page
2. Check quote detail page directly
3. Verify notification was received
4. Check audit logs for response action
5. Clear browser cache
6. Check database for response data


### Notification Issues

**Problem: Not receiving vendor response notifications**

Troubleshooting steps:
1. Check notification preferences are enabled
2. Verify email address in your profile
3. Check spam/junk folder
4. Test email delivery
5. Check notification queue status
6. Verify SMTP configuration

**Problem: In-app notifications not appearing**

Troubleshooting steps:
1. Refresh the page
2. Clear browser cache
3. Check browser notification permissions
4. Verify you're logged in
5. Check notification preferences
6. Try different browser

### Performance Issues

**Problem: Vendor portal is slow**

Troubleshooting steps:
1. Check internet connection speed
2. Clear browser cache and cookies
3. Try different browser
4. Check server status
5. Verify database performance
6. Contact technical support

**Problem: Email delivery is slow**

Troubleshooting steps:
1. Check email queue status
2. Verify queue workers are running
3. Check SMTP server response time
4. Review email delivery logs
5. Increase queue worker count
6. Contact email provider

---

## ✅ Best Practices

### Vendor Onboarding Best Practices

**Before Onboarding:**
- ✅ Verify vendor information is complete and accurate
- ✅ Confirm vendor has valid email address
- ✅ Ensure vendor understands portal purpose and benefits
- ✅ Prepare vendor for welcome email
- ✅ Set expectations for response times

**During Onboarding:**
- ✅ Send welcome email during business hours
- ✅ Follow up with phone call to confirm receipt
- ✅ Provide vendor user guide link
- ✅ Offer training or walkthrough if needed
- ✅ Monitor first login and onboarding completion

**After Onboarding:**
- ✅ Check vendor logs in within 48 hours
- ✅ Send reminder if no activity after 3 days
- ✅ Verify vendor can access and navigate portal
- ✅ Collect feedback on onboarding experience
- ✅ Document any issues for improvement

### Quote Sending Best Practices

**Quote Preparation:**
- ✅ Provide clear and complete specifications
- ✅ Include all necessary attachments
- ✅ Set realistic expiration dates (7-14 days typical)
- ✅ Add helpful admin notes
- ✅ Double-check vendor assignment

**Timing:**
- ✅ Send quotes during business hours
- ✅ Avoid sending on weekends or holidays
- ✅ Consider vendor's time zone
- ✅ Allow adequate response time
- ✅ Send reminders 3 days before expiration

**Communication:**
- ✅ Be clear and professional in all communications
- ✅ Respond promptly to vendor questions
- ✅ Provide additional information when requested
- ✅ Keep message thread focused on the quote
- ✅ Document all agreements and decisions

### Response Management Best Practices

**Reviewing Responses:**
- ✅ Review responses within 24 hours
- ✅ Acknowledge receipt to vendor
- ✅ Evaluate objectively based on criteria
- ✅ Document decision rationale
- ✅ Communicate decision promptly

**Handling Acceptances:**
- ✅ Confirm acceptance with vendor
- ✅ Verify delivery timeline is acceptable
- ✅ Update order status immediately
- ✅ Notify customer of acceptance
- ✅ Schedule production and delivery

**Handling Rejections:**
- ✅ Understand rejection reason
- ✅ Thank vendor for their time
- ✅ Identify alternative vendors quickly
- ✅ Document rejection for future reference
- ✅ Maintain positive relationship

**Handling Counter Offers:**
- ✅ Evaluate counter offer fairly
- ✅ Compare with budget and alternatives
- ✅ Negotiate professionally
- ✅ Make timely decision
- ✅ Communicate decision clearly


### Performance Monitoring Best Practices

**Regular Monitoring:**
- ✅ Review vendor performance weekly
- ✅ Track trends over time
- ✅ Identify top and bottom performers
- ✅ Set performance benchmarks
- ✅ Document performance issues

**Performance Feedback:**
- ✅ Provide constructive feedback regularly
- ✅ Recognize and reward high performers
- ✅ Address performance issues promptly
- ✅ Set clear improvement expectations
- ✅ Follow up on improvement plans

**Vendor Relationships:**
- ✅ Build long-term partnerships with top performers
- ✅ Communicate openly and honestly
- ✅ Be fair and consistent in evaluations
- ✅ Provide opportunities for improvement
- ✅ Maintain professional relationships

### Security Best Practices

**Access Control:**
- ✅ Enable portal access only for verified vendors
- ✅ Disable access immediately when relationship ends
- ✅ Monitor for suspicious activity
- ✅ Review audit logs regularly
- ✅ Enforce strong password requirements

**Data Protection:**
- ✅ Protect sensitive vendor information
- ✅ Use secure communication channels
- ✅ Comply with data privacy regulations
- ✅ Limit access to authorized personnel
- ✅ Backup data regularly

**Email Security:**
- ✅ Use secure SMTP configuration
- ✅ Verify email addresses before sending
- ✅ Monitor email delivery failures
- ✅ Protect against phishing attempts
- ✅ Educate vendors on security practices

---

## ❓ FAQ

### General Questions

**Q: How many vendors can I onboard to the portal?**

A: There is no limit. You can onboard as many vendors as needed. Each vendor gets their own secure account with isolated data.

**Q: Can a vendor access quotes from other vendors?**

A: No. The system enforces strict tenant and vendor isolation. Vendors can only see their own quotes and data.

**Q: Can I have multiple admin users managing the vendor portal?**

A: Yes. Any admin user with the appropriate permissions can manage vendors, send quotes, and view responses.

**Q: What happens if a vendor's email address changes?**

A: Update the email address in the vendor profile, then resend the welcome email. The vendor will receive new login credentials at the updated email address.

**Q: Can vendors respond to quotes via email?**

A: No. Vendors must log in to the portal to respond to quotes. This ensures security and proper tracking of all responses.

### Onboarding Questions

**Q: How long does the onboarding process take?**

A: Typically 5-10 minutes. The system generates credentials instantly, and vendors can log in immediately after receiving the welcome email.

**Q: What if the welcome email doesn't arrive?**

A: Check the vendor's spam folder first. If still not found, use the "Resend Welcome Email" button to send a new email with fresh credentials.

**Q: Can I customize the welcome email template?**

A: Currently, the welcome email uses a standard template with PT CEX branding. Contact technical support for custom template requests.

**Q: What if a vendor forgets their password?**

A: Vendors can use the "Forgot Password" link on the login page. They will receive a password reset email with instructions.

**Q: Can I disable portal access temporarily?**

A: Yes. Use the "Disable Portal Access" button. You can re-enable it later using "Enable Portal Access" button.

### Quote Management Questions

**Q: Can I send the same quote to multiple vendors?**

A: Yes. Create separate quotes for each vendor. This allows you to compare responses and choose the best option.

**Q: What is a reasonable expiration date for quotes?**

A: Typically 7-14 days. Consider the complexity of the quote and vendor's typical response time. You can extend if needed.

**Q: Can I edit a quote after sending it to a vendor?**

A: No. Once sent, quotes cannot be edited. If changes are needed, cancel the quote and create a new one with updated information.

**Q: What happens when a quote expires?**

A: The quote status changes to "Expired" and vendors can no longer respond. You can extend the expiration date if needed.

**Q: Can I cancel a quote after a vendor has responded?**

A: Yes, but it's not recommended. If you must cancel, provide a clear reason and maintain good vendor relations.


### Response Management Questions

**Q: How quickly should I respond to vendor responses?**

A: Aim to review and respond within 24 hours. Prompt responses maintain good vendor relationships and keep projects moving.

**Q: Can I negotiate after accepting a counter offer?**

A: Once you accept a counter offer, it's considered final. If further negotiation is needed, use the message thread to discuss.

**Q: What if a vendor accepts but later cannot fulfill?**

A: Use the message thread to discuss the situation. You may need to cancel the order and find an alternative vendor.

**Q: Can I see the history of all vendor responses?**

A: Yes. Each quote detail page shows the complete response history, including all status changes and timestamps.

**Q: What if multiple vendors accept the same quote?**

A: This shouldn't happen if you send separate quotes. If it does, choose the best option and politely decline the others.

### Performance & Reporting Questions

**Q: How is vendor acceptance rate calculated?**

A: Acceptance Rate = (Number of Accepted Quotes / Total Quotes Sent) × 100%

**Q: How is average response time calculated?**

A: Average Response Time = Sum of (Response Time for Each Quote) / Number of Responses

**Q: Can I export vendor performance data?**

A: Yes. Use the "Export" button on the performance dashboard to download data in CSV format.

**Q: How often are performance metrics updated?**

A: Metrics are updated in real-time as vendors respond to quotes and take actions in the portal.

**Q: Can I set performance targets for vendors?**

A: Currently, you can track performance but cannot set automated targets. Use the data to have performance discussions with vendors.

### Technical Questions

**Q: What browsers are supported?**

A: Chrome, Firefox, Safari, and Edge (latest 2 versions). Mobile browsers are also supported.

**Q: Is the vendor portal mobile-friendly?**

A: Yes. The portal is fully responsive and works on mobile devices, tablets, and desktops.

**Q: How secure is the vendor portal?**

A: Very secure. Uses HTTPS encryption, secure authentication, session management, rate limiting, and audit logging.

**Q: Can vendors access the portal from multiple devices?**

A: Yes. Vendors can log in from any device with a web browser. Sessions are managed securely.

**Q: What happens if there's a system outage?**

A: The system has high availability and backup systems. In case of outage, contact technical support immediately.

---

## 📞 Support & Resources

### PT CEX Support Team

**Email:** support@ptcex.com  
**Phone:** +62 21 1234 5678  
**Business Hours:** Monday - Friday, 9:00 AM - 5:00 PM WIB

### Emergency Contact

**Emergency Hotline:** +62 812 3456 7890  
**Available:** 24/7 for critical issues

### Additional Resources

**Documentation:**
- Vendor User Guide: For vendor-facing documentation
- API Documentation: For technical integration
- Developer Guide: For customization and development

**Training:**
- Admin training sessions available
- Video tutorials (coming soon)
- Webinars and workshops

**Feedback:**
- Feature requests: feedback@ptcex.com
- Bug reports: support@ptcex.com
- Suggestions: improvement@ptcex.com

---

## 📋 Appendix

### Glossary of Terms

- **Vendor Portal** - Web application for vendor access
- **Onboarding** - Process of enabling vendor portal access
- **Quote** - Request for pricing sent to vendor
- **Response** - Vendor's action on a quote (accept/reject/counter)
- **Expiration Date** - Deadline for vendor to respond
- **Counter Offer** - Vendor's alternative pricing proposal
- **Message Thread** - Communication channel for specific quote
- **Audit Log** - Record of all vendor portal activities
- **Performance Metrics** - Statistics about vendor responses
- **Acceptance Rate** - Percentage of quotes accepted by vendor
- **Response Time** - Time taken by vendor to respond

### Status Reference

**Vendor Portal Status:**
- Portal Enabled - Vendor has active access
- Portal Disabled - Vendor cannot access portal
- Onboarding In Progress - Completing setup
- Onboarding Pending - Not yet enabled

**Quote Status:**
- Draft - Not yet sent to vendor
- Sent - Awaiting vendor response
- Accepted - Vendor accepted quote
- Rejected - Vendor declined quote
- Countered - Vendor proposed alternative
- Expired - Deadline passed without response
- Cancelled - Quote cancelled by admin

**Onboarding Status:**
- Pending - Portal access not enabled
- In Progress - Welcome email sent
- Completed - Vendor logged in and setup complete

### Quick Reference Commands

**Enable Portal Access:**
1. Vendor Detail → Enable Portal Access → Confirm

**Send Quote:**
1. Quote Detail → Send to Vendor → Confirm

**Extend Expiration:**
1. Quote Detail → Extend Expiration → Set Date → Confirm

**Resend Welcome Email:**
1. Vendor Detail → Resend Welcome Email → Confirm

**View Audit Logs:**
1. Vendor Detail → Audit Trail → Filter → Export

**Configure Notifications:**
1. Settings → Notifications → Toggle Options → Save

---

## 📝 Change Log

**Version 1.0 (February 12, 2026)**
- Initial release of Vendor Portal Admin Guide
- Complete onboarding process documentation
- Quote sending workflow instructions
- Response management guidelines
- Notification configuration guide
- Performance monitoring documentation
- Audit trail and logging information
- Troubleshooting and best practices
- FAQ and support resources

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Next Review:** May 12, 2026

---

© 2026 PT Custom Etching Xenial. All rights reserved.

