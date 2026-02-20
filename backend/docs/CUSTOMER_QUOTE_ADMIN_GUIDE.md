# Customer Quote & Approval Workflow - Admin User Guide

## Overview

This guide provides step-by-step instructions for administrators to manage customer quotes, handle approvals, negotiate with customers, and generate documents using the Customer Quote & Approval Workflow system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Customer Quotes](#creating-customer-quotes)
3. [Sending Quotes to Customers](#sending-quotes-to-customers)
4. [Managing Pending Approvals](#managing-pending-approvals)
5. [Handling Counter Offers](#handling-counter-offers)
6. [Generating Documents](#generating-documents)
7. [Configuring Approval Settings](#configuring-approval-settings)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Common Workflows](#common-workflows)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the System

1. Log in to the admin panel at `/admin/login`
2. Navigate to **Orders** > **Customer Quotes** in the sidebar
3. You'll see the customer quotes dashboard

### Dashboard Overview

The dashboard displays:
- **Total Quotes**: All quotes created
- **Pending Approvals**: Quotes awaiting your review
- **Active Quotes**: Sent quotes awaiting customer response
- **Accepted Quotes**: Successfully accepted quotes
- **Quick Actions**: Create new quote, view pending approvals

## Creating Customer Quotes

### Prerequisites

Before creating a customer quote:
- Order must exist with status `customer_quote`
- Vendor quote must be accepted
- Customer information must be complete

### Step-by-Step Process

#### 1. Navigate to Order Detail

1. Go to **Orders** > **All Orders**
2. Find the order (status should be "Customer Quote")
3. Click on the order to view details

#### 2. Create Quote

1. Click **Create Customer Quote** button
2. The system auto-loads:
   - Vendor costs
   - Profit margins
   - Order items

#### 3. Add Additional Costs (Optional)

Configure additional costs:

**Handling Fee**
- Purpose: Administrative and processing costs
- Example: Rp 50,000

**Shipping Cost**
- Purpose: Estimated delivery charges
- Example: Rp 150,000

**Insurance**
- Purpose: Shipment insurance
- Example: Rp 25,000

**Other Costs**
- Purpose: Any additional charges
- Requires description
- Example: "Rush processing fee"

#### 4. Set Quote Terms

**Valid Until**
- Default: 7 days from creation
- Recommended: 7-14 days
- Maximum: 30 days

**Payment Terms**
- Default: "DP 50% + Balance 50%"
- Options:
  - Full payment upfront
  - 30% DP + 70% balance
  - Custom terms

**Delivery Timeline**
- Example: "10-14 working days"
- Be realistic based on vendor timeline

**Terms & Conditions**
- Use rich text editor
- Include:
  - Payment deadlines
  - Cancellation policy
  - Warranty information
  - Return policy

#### 5. Review Pricing

The system automatically calculates:

```
Vendor Cost:        Rp 1,000,000
Base Profit:        Rp   200,000 (20%)
Handling Fee:       Rp    50,000
Shipping:           Rp   150,000
Insurance:          Rp    25,000
─────────────────────────────────
Subtotal:           Rp 1,425,000
Tax (11%):          Rp   156,750
─────────────────────────────────
Grand Total:        Rp 1,581,750
─────────────────────────────────
Total Profit:       Rp   425,000 (29.8%)
```

#### 6. Save as Draft

1. Click **Save as Draft**
2. Review all information
3. Make any necessary adjustments
4. Quote is now ready to send

### Best Practices

✅ **DO:**
- Double-check all calculations
- Verify customer contact information
- Set realistic delivery timelines
- Include clear payment terms
- Review profit margins

❌ **DON'T:**
- Set unrealistic delivery dates
- Forget to add shipping costs
- Use vague terms and conditions
- Set expiry dates too short

## Sending Quotes to Customers

### Before Sending

Verify:
- [ ] All pricing is correct
- [ ] Customer email is valid
- [ ] Terms are clear and complete
- [ ] Valid until date is appropriate
- [ ] All additional costs are included

### Sending Process

#### 1. Review Quote

1. Open the draft quote
2. Click **Preview** to see customer view
3. Verify all information is correct

#### 2. Send to Customer

1. Click **Send to Customer** button
2. Confirmation dialog appears showing:
   - Customer email
   - Quote summary
   - Expiry date
3. Click **Confirm Send**

#### 3. What Happens Next

The system automatically:
- Changes quote status to "Sent"
- Generates unique response token
- Creates customer portal link
- Generates PDF quotation
- Sends email to customer with:
  - Quote summary
  - PDF attachment
  - Portal link for response
  - Expiry date warning

#### 4. Track Quote Status

Monitor quote status:
- **Sent**: Email delivered, awaiting customer view
- **Viewed**: Customer opened the quote
- **Countered**: Customer submitted counter offer
- **Pending Approval**: Customer accepted, awaiting your approval
- **Accepted**: Quote approved, proceeding to payment
- **Rejected**: Customer declined the quote
- **Expired**: Quote passed valid until date

### Resending Quotes

If customer didn't receive the email:

1. Open the quote
2. Click **Resend Email**
3. System generates new token and sends fresh email

## Managing Pending Approvals

### Understanding Approval Workflow

When a customer accepts a quote, the system evaluates:
- **Auto-Approval**: Low-risk orders proceed automatically
- **Manual Approval**: High-risk orders require your review

### Viewing Pending Approvals

#### 1. Access Pending Approvals

Navigate to:
- **Dashboard** > **Pending Approvals** widget, OR
- **Orders** > **Pending Approvals** menu

#### 2. Approval List

Each pending approval shows:
- Order number and customer name
- Quote amount
- Time since acceptance
- Reason for manual review
- Customer trust indicators
- Quick action buttons

### Reviewing an Approval

#### 1. View Details

Click **View Details** to see:

**Order Information**
- Order items and specifications
- Total amount
- Delivery requirements

**Customer Information**
- Contact details
- Order history
- Payment success rate
- Email verification status

**Quote Details**
- Original quote amount
- Profit margins
- Additional costs
- Terms and conditions

**Approval Reason**
- Why manual approval is required
- Risk factors identified

#### 2. Make Decision

You have three options:

**Option A: Approve**

1. Click **Approve** button
2. Add approval notes (optional)
3. Set payment due date
4. Click **Confirm Approval**

Result:
- Quote status → Accepted
- Order status → Awaiting Payment
- Customer receives payment instructions
- Payment record created

**Option B: Reject**

1. Click **Reject** button
2. Enter rejection reason (required, min 20 characters)
3. Click **Confirm Rejection**

Result:
- Quote status → Rejected
- Order status → Customer Quote
- Customer notified with reason
- You can create revised quote

**Option C: Request More Information**

1. Click **Contact Customer**
2. Send message requesting clarification
3. Keep approval pending until resolved

### Approval Best Practices

✅ **Approve When:**
- Customer information is verified
- Order details are clear
- Payment terms are acceptable
- Risk factors are minimal

❌ **Reject When:**
- Customer information is suspicious
- Order requirements are unclear
- Payment terms cannot be met
- High fraud risk indicators

⏸️ **Request Info When:**
- Need clarification on specifications
- Delivery address is incomplete
- Payment method needs confirmation
- Custom requirements need discussion

## Handling Counter Offers

### Understanding Counter Offers

Customers can submit counter offers with:
- Different price
- Reason for counter offer
- Additional requests (faster delivery, etc.)

### Viewing Counter Offers

#### 1. Notification

You receive notification when customer submits counter offer:
- Email notification
- In-app notification
- Dashboard alert

#### 2. Counter Offer Details

Navigate to the quote to see:

**Original Quote**
- Your quoted amount: Rp 1,581,750

**Customer Counter Offer**
- Counter amount: Rp 1,400,000
- Difference: -Rp 181,750 (-11.5%)
- Reason: "Budget constraints, can we reduce shipping cost?"
- Additional requests: "Need delivery within 7 days"

**Negotiation History**
- Round: 1 of 3
- Previous offers (if any)

### Responding to Counter Offers

You have three options:

#### Option 1: Accept Counter Offer

**When to Accept:**
- Counter offer is reasonable
- Still maintains acceptable profit
- Customer is valuable
- Want to close the deal quickly

**Process:**
1. Click **Accept Counter Offer**
2. Review new pricing
3. Confirm acceptance
4. Quote proceeds to payment

**Result:**
- Quote amount updated to counter offer
- Quote status → Accepted
- Order status → Awaiting Payment
- Customer receives payment instructions

#### Option 2: Reject Counter Offer

**When to Reject:**
- Counter offer is too low
- Cannot meet additional requests
- Profit margin unacceptable
- Customer expectations unrealistic

**Process:**
1. Click **Reject Counter Offer**
2. Provide clear rejection reason
3. Explain why counter cannot be accepted
4. Suggest alternatives if possible

**Result:**
- Quote status → Rejected
- Customer notified with reason
- Can create new quote if needed

#### Option 3: Send New Counter Offer

**When to Counter:**
- Can meet customer halfway
- Can adjust some costs
- Want to continue negotiation
- Have alternative solution

**Process:**
1. Click **Send Counter Offer**
2. Enter new amount
3. Explain the adjustment:
   - "We can reduce shipping to Rp 100,000"
   - "We can offer 5% discount for faster payment"
   - "We can meet 7-day delivery for additional Rp 50,000"
4. Click **Send Counter**

**Result:**
- Quote updated with new amount
- Negotiation round incremented
- Customer receives new offer
- Customer can accept, reject, or counter again

### Negotiation Strategies

#### Strategy 1: Meet Halfway

```
Original:        Rp 1,581,750
Customer:        Rp 1,400,000
Your Counter:    Rp 1,490,000 (split difference)
```

#### Strategy 2: Adjust Components

```
Original Shipping:    Rp 150,000
Reduced Shipping:     Rp 100,000
New Total:            Rp 1,531,750
```

#### Strategy 3: Add Value

```
Same Price:           Rp 1,581,750
Added Value:          Free rush processing
                      Extended warranty
                      Priority support
```

#### Strategy 4: Payment Terms

```
Original:             50% DP + 50% Balance
Counter Offer:        30% DP + 70% Balance
                      (Easier for customer)
```

### Negotiation Limits

- **Maximum Rounds**: 3 (configurable)
- **After Max Rounds**: Customer can only accept or reject
- **Time Limit**: Quote expiry date still applies

### Best Practices

✅ **DO:**
- Respond promptly (within 24 hours)
- Be professional and courteous
- Explain your reasoning clearly
- Look for win-win solutions
- Consider customer lifetime value

❌ **DON'T:**
- Accept offers below cost
- Make unrealistic promises
- Ignore customer requests
- Take too long to respond
- Be inflexible without reason

## Generating Documents

### Available Document Types

1. **Quotation** - Customer price quote
2. **Proforma Invoice** - Pre-payment invoice
3. **Tax Invoice** - Official tax invoice
4. **Purchase Order** - Vendor PO
5. **Delivery Note** - Shipment documentation
6. **Receipt** - Payment receipt

### Generating Documents

#### 1. Access Document Generation

From quote detail page:
1. Click **Documents** tab
2. Click **Generate Document** button

#### 2. Select Document Type

Choose document type based on order stage:

**Quotation**
- When: Quote is sent to customer
- Purpose: Formal price quote
- Auto-generated when sending quote

**Proforma Invoice**
- When: Quote is accepted
- Purpose: Request for payment
- Generate after approval

**Tax Invoice**
- When: Payment is verified
- Purpose: Official tax document
- Required for tax compliance

**Purchase Order**
- When: Customer payment received
- Purpose: Order to vendor
- Send to vendor for production

**Delivery Note**
- When: Order ships
- Purpose: Shipment documentation
- Accompanies delivery

**Receipt**
- When: Payment completed
- Purpose: Payment confirmation
- Customer record

#### 3. Generate and Download

1. Select document type
2. Click **Generate**
3. System creates PDF
4. Document appears in list
5. Click **Download** to save
6. Click **Send** to email to recipient

### Document Management

#### Viewing Documents

All generated documents are listed in the Documents tab:
- Document type
- Document number
- Generated date
- Status
- Actions (Download, Send, View)

#### Document Versioning

- Each regeneration creates new version
- Previous versions are archived
- Latest version is marked
- All versions accessible

#### Sending Documents

1. Click **Send** button
2. Confirm recipient email
3. Add message (optional)
4. Click **Send Email**

Document is emailed with:
- PDF attachment
- Professional email template
- Company branding

## Configuring Approval Settings

### Accessing Settings

Navigate to: **Settings** > **Quote Approval**

### Configuration Options

#### 1. Auto-Approval Master Switch

```
Enable Auto-Approval: [✓]
```

Turn on/off the entire auto-approval system.

#### 2. Auto-Approval Threshold

```
Maximum Order Value: Rp [50,000]
```

Orders above this value require manual approval.

**Recommendations:**
- Small business: Rp 20,000 - 50,000
- Medium business: Rp 50,000 - 100,000
- Large business: Rp 100,000+

#### 3. Customer Trust Requirements

**Email Verification**
```
Require Email Verification: [✓]
```

**Minimum Successful Orders**
```
Minimum Orders: [1]
```

**Payment Success Rate**
```
Minimum Success Rate: [90]%
```

#### 4. Product Type Rules

```
Auto-Approve Standard Products: [✓]
Require Approval for Custom Products: [✓]
```

#### 5. Negotiation Settings

```
Maximum Negotiation Rounds: [3]
Allow Customer Counter Offers: [✓]
```

#### 6. Notifications

```
Notify on Auto-Approve: [✓]
Notify on Pending Approval: [✓]
```

### Saving Settings

1. Adjust settings as needed
2. Click **Save Settings**
3. Confirmation message appears
4. Settings apply immediately to new quotes

### Testing Settings

After changing settings:
1. Create test quote
2. Have test customer accept
3. Verify approval behavior
4. Adjust if needed

## Monitoring & Analytics

### Quote Analytics Dashboard

Access: **Reports** > **Quote Analytics**

#### Key Metrics

**Quote Performance**
- Total quotes sent
- Acceptance rate
- Rejection rate
- Average time to acceptance

**Approval Metrics**
- Auto-approval rate
- Manual approval rate
- Average approval time
- Rejection reasons breakdown

**Financial Metrics**
- Total quote value
- Average quote value
- Profit margins
- Revenue by customer segment

**Negotiation Metrics**
- Counter offer rate
- Average negotiation rounds
- Counter offer acceptance rate
- Average discount given

### Viewing Reports

#### 1. Date Range Selection

Choose period:
- Today
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

#### 2. Filter Options

Filter by:
- Quote status
- Customer segment
- Product category
- Approval method
- Negotiation rounds

#### 3. Export Reports

Export data as:
- PDF report
- Excel spreadsheet
- CSV file

### Setting Up Alerts

Configure alerts for:
- Pending approvals overdue (>24 hours)
- High-value quotes
- Multiple rejections
- Low acceptance rate
- System errors

## Common Workflows

### Workflow 1: Standard Quote (Auto-Approved)

```
1. Create quote from accepted vendor quote
2. Add shipping and handling costs
3. Set terms (7 days validity, 50/50 payment)
4. Save and send to customer
5. Customer accepts quote
6. System auto-approves (low risk)
7. Customer receives payment instructions
8. Generate proforma invoice
9. Customer pays
10. Generate tax invoice
11. Send PO to vendor
```

**Timeline**: 1-3 days

### Workflow 2: High-Value Quote (Manual Approval)

```
1. Create quote for high-value order
2. Add all costs and terms
3. Send to customer
4. Customer accepts quote
5. System flags for manual approval (high value)
6. You review customer history
7. You approve the quote
8. Customer receives payment instructions
9. Generate proforma invoice
10. Customer pays
11. Generate tax invoice
12. Send PO to vendor
```

**Timeline**: 1-2 days (with approval)

### Workflow 3: Quote with Negotiation

```
1. Create and send quote
2. Customer submits counter offer
3. You review counter offer
4. You send new counter offer
5. Customer accepts your counter
6. System auto-approves
7. Customer receives payment instructions
8. Generate proforma invoice
9. Customer pays
10. Generate tax invoice
11. Send PO to vendor
```

**Timeline**: 2-5 days (with negotiation)

### Workflow 4: Quote Rejection and Revision

```
1. Create and send quote
2. Customer rejects (price too high)
3. You review rejection reason
4. You negotiate with vendor for better price
5. You create revised quote with lower price
6. You send revised quote
7. Customer accepts
8. System auto-approves
9. Proceed to payment
```

**Timeline**: 3-7 days (with revision)

## Troubleshooting

### Issue: Cannot Create Quote

**Symptoms**: "Create Customer Quote" button disabled

**Possible Causes:**
- Order status is not "customer_quote"
- No accepted vendor quote
- Missing customer information

**Solution:**
1. Verify order status
2. Check vendor quote is accepted
3. Complete customer information
4. Refresh page

### Issue: Quote Not Sending

**Symptoms**: Error when clicking "Send to Customer"

**Possible Causes:**
- Invalid customer email
- Quote expired
- Missing required fields

**Solution:**
1. Verify customer email format
2. Check valid until date
3. Complete all required fields
4. Try again

### Issue: Customer Can't Access Quote

**Symptoms**: Customer reports link not working

**Possible Causes:**
- Token expired
- Quote expired
- Wrong link

**Solution:**
1. Check quote expiry date
2. Resend quote (generates new token)
3. Verify email was delivered
4. Check spam folder

### Issue: Auto-Approval Not Working

**Symptoms**: All quotes require manual approval

**Possible Causes:**
- Auto-approval disabled
- Threshold too low
- Trust requirements too strict

**Solution:**
1. Check approval settings
2. Verify auto-approval is enabled
3. Review threshold and requirements
4. Adjust settings if needed

### Issue: Documents Not Generating

**Symptoms**: Error when generating PDF

**Possible Causes:**
- Missing template
- Invalid data
- Server error

**Solution:**
1. Check error message
2. Verify quote data is complete
3. Try different document type
4. Contact support if persists

### Issue: Notifications Not Received

**Symptoms**: Not receiving email notifications

**Possible Causes:**
- Notification settings disabled
- Email configuration issue
- Spam filter

**Solution:**
1. Check notification settings
2. Verify email configuration
3. Check spam/junk folder
4. Add sender to whitelist

## Getting Help

### Support Resources

**Documentation**
- [API Documentation](./API_DOCUMENTATION.md)
- [Approval Settings Guide](./CUSTOMER_QUOTE_APPROVAL_SETTINGS.md)
- [Document Templates Guide](./CUSTOMER_QUOTE_DOCUMENT_TEMPLATES.md)

**Contact Support**
- Email: support@example.com
- Phone: +62 xxx xxxx xxxx
- Live Chat: Available 9 AM - 5 PM WIB

**Training**
- Video tutorials available
- Webinar sessions monthly
- One-on-one training available

### Feedback

We value your feedback! Please share:
- Feature requests
- Bug reports
- Usability suggestions
- Documentation improvements

Email: feedback@example.com

---

**Version**: 1.0  
**Last Updated**: February 2024  
**Next Review**: May 2024
