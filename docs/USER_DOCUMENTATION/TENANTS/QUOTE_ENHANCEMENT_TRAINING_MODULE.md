# Quote Enhancement Training Module

## Module Overview

**Module Name**: Quote Management Enhancement - Specifications & Calculations  
**Duration**: 45 minutes (30 min instruction + 15 min hands-on)  
**Level**: Intermediate  
**Prerequisites**: Basic Quote Management knowledge  
**Target Audience**: Tenant Administrators, Sales Managers, Operations Staff

---

## Learning Objectives

By the end of this training module, participants will be able to:

1. ✅ Locate and interpret product specifications in quotes
2. ✅ Understand and use the pricing calculations breakdown
3. ✅ Make informed pricing decisions using real-time calculations
4. ✅ Compare vendor quotes effectively
5. ✅ Negotiate with vendors using data-driven insights
6. ✅ Handle quantity-based pricing scenarios
7. ✅ Troubleshoot common issues with new features

---

## Module Structure

### Part 1: Introduction (5 minutes)

#### What's New in Quote Management?

**Two Major Enhancements**:

1. **Product Specifications Display**
   - Shows all custom fields from customer orders
   - Collapsible section for easy access
   - Human-readable labels and values
   - Responsive design for mobile

2. **Pricing Calculations Breakdown**
   - Per-piece cost analysis
   - Total cost calculations (for quantity > 1)
   - Real-time profit margin calculations
   - Visual indicators for profitability

#### Why These Features Matter

**Before Enhancement**:
- ❌ Had to switch between screens to see specifications
- ❌ Manual calculation of profit margins
- ❌ Unclear total costs for quantity orders
- ❌ Time-consuming vendor comparisons

**After Enhancement**:
- ✅ All information in one place
- ✅ Automatic profit calculations
- ✅ Clear per-piece and total breakdowns
- ✅ Quick vendor comparisons

---

### Part 2: Product Specifications Display (10 minutes)

#### 2.1 Understanding Specifications

**What Are Specifications?**

Specifications are custom fields that customers fill out when ordering products:

**Example - Custom Plaque Order**:
- Jenis Plakat: Plakat Logam
- Jenis Logam: Stainless Steel 304 (Anti Karat)
- Ketebalan Plat: 2mm
- Ukuran Plakat: 30x40cm
- Text untuk Engraving: 30 Years Beyond Partnership
- Finishing: Polished

**Why They're Important**:
- Define exact product requirements
- Affect pricing and production time
- Must be communicated to vendors
- Impact quality and customer satisfaction

#### 2.2 Locating Specifications

**Step-by-Step**:

1. Open Quote Form (from Order Detail page)
2. Scroll to quote item section
3. Look for card with 📋 icon
4. Header shows "Product Specifications (X fields)"
5. Click header to expand/collapse

**Visual Indicators**:
- Badge shows field count
- Chevron icon (▼/▲) indicates expand/collapse state
- Blue border indicates collapsible section

#### 2.3 Reading Specifications

**Field Display Format**:
```
Field Label:
Field Value
```

**Example**:
```
Jenis Logam:
Stainless Steel 304 (Anti Karat)
```

**Special Cases**:
- Empty fields: "Not specified"
- Boolean fields: "Yes" or "No"
- Long text: Wrapped for readability

#### 2.4 Using Specifications in Workflow

**When Creating Quotes**:
1. ✅ Expand specifications first
2. ✅ Read all custom requirements
3. ✅ Note complexity factors
4. ✅ Consider in pricing
5. ✅ Share with vendor

**When Negotiating**:
1. ✅ Reference specifications to justify pricing
2. ✅ Ensure vendor understands requirements
3. ✅ Verify vendor can meet specifications
4. ✅ Document any specification-related notes

#### 2.5 Hands-On Exercise 1 (3 minutes)

**Task**: Review specifications for a sample order

1. Open provided sample quote
2. Locate specifications section
3. Expand to view all fields
4. Identify 3 key specifications
5. Note any complex requirements

**Discussion Points**:
- What specifications affect pricing?
- Which specifications are most critical?
- How would you communicate these to a vendor?

---

### Part 3: Pricing Calculations Breakdown (15 minutes)

#### 3.1 Understanding the Calculations

**Two Calculation Sections**:

1. **Per Piece** (always visible)
   - Vendor Cost per unit
   - Unit Price per unit
   - Profit Margin per unit

2. **Total** (only when quantity > 1)
   - Total Vendor Cost
   - Total Unit Price
   - Total Profit

#### 3.2 Per-Piece Calculations

**Formula**:
```
Profit Per Piece = Unit Price - Vendor Cost
Profit Percentage = (Profit / Vendor Cost) × 100
```

**Example**:
```
Vendor Cost:   Rp 250,000
Unit Price:    Rp 3,114,510
Profit:        Rp 2,864,510 (1145.8%)
```

**What This Tells You**:
- Cost of goods sold (COGS)
- Revenue per unit
- Profit margin per unit
- Profitability percentage

#### 3.3 Total Calculations

**Formula**:
```
Total Vendor Cost = Vendor Cost × Quantity
Total Unit Price = Unit Price × Quantity
Total Profit = Total Unit Price - Total Vendor Cost
Total Profit % = (Total Profit / Total Vendor Cost) × 100
```

**Example** (Quantity: 2):
```
Total Vendor Cost:  Rp 500,000
Total Unit Price:   Rp 6,229,020
Total Profit:       Rp 5,729,020 (1145.8%)
```

**What This Tells You**:
- Total investment required
- Total revenue expected
- Total profit potential
- Overall deal profitability

#### 3.4 Real-Time Updates

**Interactive Calculations**:

When you change:
- **Quantity** → Total section updates
- **Vendor Cost** → All profit margins update
- **Unit Price** → All profit margins update

**No Save Required**:
- Updates happen instantly
- See impact immediately
- Experiment with different values
- Find optimal pricing

#### 3.5 Visual Indicators

**Color Coding**:
- 🟢 Green: Positive profit (good)
- 📈 Trending Up Icon: Indicates profit

**Future Enhancements**:
- 🔴 Red: Negative profit (loss)
- ⚠️ Yellow: Low profit margin (<10%)

#### 3.6 Hands-On Exercise 2 (5 minutes)

**Task**: Experiment with pricing calculations

1. Open sample quote
2. Note current profit margin
3. Change vendor cost to Rp 300,000
4. Observe profit margin change
5. Change quantity to 5
6. Observe total calculations appear
7. Find vendor cost that gives 800% margin

**Discussion Points**:
- How does quantity affect total profit?
- What's an acceptable profit margin?
- How would you use this in negotiations?

---

### Part 4: Practical Applications (10 minutes)

#### 4.1 Scenario: Comparing Vendor Quotes

**Situation**: You have 3 vendor quotes for the same order.

**Process**:

1. **Create Quote for Each Vendor**:
   ```
   Vendor A: Rp 250,000 → Profit: 1145.8%
   Vendor B: Rp 400,000 → Profit: 678.6%
   Vendor C: Rp 600,000 → Profit: 419.1%
   ```

2. **Review Specifications**:
   - Can all vendors meet requirements?
   - Any vendor better suited for specifications?
   - Quality considerations?

3. **Analyze Profitability**:
   - Vendor A: Excellent margin
   - Vendor B: Good margin
   - Vendor C: Acceptable margin

4. **Make Decision**:
   - Choose Vendor A (best margin)
   - Verify they can meet specifications
   - Accept quote

#### 4.2 Scenario: Negotiating Lower Cost

**Situation**: Vendor quote is too high.

**Process**:

1. **Review Initial Quote**:
   ```
   Vendor Cost: Rp 600,000
   Unit Price:  Rp 3,114,510
   Profit:      419.1% (acceptable but not ideal)
   ```

2. **Calculate Target**:
   ```
   Desired Margin: 800%
   Target Cost:    Rp 346,000
   Savings Needed: Rp 254,000
   ```

3. **Negotiate**:
   - Show specifications complexity
   - Explain volume potential
   - Request discount
   - Propose: Rp 350,000

4. **Update Quote**:
   ```
   New Vendor Cost: Rp 350,000
   New Profit:      790.1% ✅
   ```

#### 4.3 Scenario: Quantity-Based Pricing

**Situation**: Customer wants 10 units instead of 1.

**Process**:

1. **Review Per-Piece**:
   ```
   Vendor Cost: Rp 250,000
   Unit Price:  Rp 3,114,510
   Profit:      Rp 2,864,510
   ```

2. **Check Total Impact**:
   ```
   Quantity:           10
   Total Vendor Cost:  Rp 2,500,000
   Total Unit Price:   Rp 31,145,100
   Total Profit:       Rp 28,645,100 💰
   ```

3. **Negotiate Volume Discount**:
   ```
   New Vendor Cost: Rp 225,000 (10% discount)
   New Total Cost:  Rp 2,250,000
   New Total Profit: Rp 28,895,100 (better!)
   ```

4. **Offer Customer Discount** (optional):
   ```
   New Unit Price:  Rp 3,000,000
   Customer Saves:  Rp 1,145,100
   Still Excellent Margin: 1233.3%
   Win-Win! 🎉
   ```

#### 4.4 Hands-On Exercise 3 (5 minutes)

**Task**: Complete a realistic scenario

**Scenario**: 
- Product: Custom Plaque with complex engraving
- Quantity: 3 units
- Vendor A Quote: Rp 400,000
- Vendor B Quote: Rp 350,000
- Target Unit Price: Rp 3,000,000

**Questions**:
1. Which vendor offers better margin?
2. What's the total profit for each vendor?
3. If you negotiate Vendor A down to Rp 375,000, is it better than Vendor B?
4. What specifications would you review before deciding?

**Group Discussion**:
- Share your decisions
- Explain your reasoning
- Discuss alternative approaches

---

### Part 5: Best Practices & Tips (5 minutes)

#### 5.1 Workflow Best Practices

**Recommended Process**:

1. **Review Specifications**
   - Expand and read all fields
   - Note complexity factors
   - Identify special requirements

2. **Enter Vendor Cost**
   - Based on vendor quote
   - Account for specifications
   - Consider quality factors

3. **Set Unit Price**
   - Check profit margin
   - Ensure meets targets
   - Adjust as needed

4. **Verify Calculations**
   - Per-piece profit acceptable?
   - Total profit (if qty > 1) good?
   - Margin meets business goals?

5. **Document Decision**
   - Use Internal Notes
   - Record pricing rationale
   - Note special considerations

#### 5.2 Pricing Guidelines

**Profit Margin Targets**:
- 🟢 **Excellent**: > 1000%
- 🟢 **Good**: 500-1000%
- 🟡 **Acceptable**: 200-500%
- 🔴 **Low**: < 200%
- ⛔ **Loss**: Negative

**Cost Considerations**:
```
Profit Margin Should Cover:
- Operational costs (5-10%)
- Marketing costs (5-10%)
- Overhead costs (5-10%)
- Desired net profit (10-20%)
- Contingency buffer (5%)
```

#### 5.3 Common Mistakes to Avoid

❌ **DON'T**:
- Skip reading specifications
- Ignore calculation warnings
- Accept quotes without checking margins
- Forget to account for operational costs
- Rush pricing decisions

✅ **DO**:
- Always review specifications first
- Check both per-piece and total calculations
- Compare margins across vendors
- Document pricing decisions
- Use real-time calculations to experiment

#### 5.4 Troubleshooting Tips

**Issue**: Specifications not showing
- Check product has form configuration
- Verify customer filled specifications
- Contact customer if missing

**Issue**: Calculations not updating
- Refresh page (Ctrl+R)
- Clear browser cache
- Try incognito mode

**Issue**: Negative profit margin
- Increase unit price
- Negotiate lower vendor cost
- Review pricing strategy

---

## Assessment & Certification

### Knowledge Check (10 questions)

1. **Where do you find product specifications in a quote?**
   - [ ] A) Order detail page
   - [ ] B) Quote form, below product item
   - [ ] C) Vendor management page
   - [ ] D) Customer profile

2. **What does the badge number indicate in specifications section?**
   - [ ] A) Number of products
   - [ ] B) Number of custom fields
   - [ ] C) Number of vendors
   - [ ] D) Number of quotes

3. **How is profit margin percentage calculated?**
   - [ ] A) (Unit Price / Vendor Cost) × 100
   - [ ] B) (Vendor Cost / Unit Price) × 100
   - [ ] C) (Profit / Vendor Cost) × 100
   - [ ] D) (Profit / Unit Price) × 100

4. **When does the Total section appear in calculations?**
   - [ ] A) Always
   - [ ] B) Only when quantity > 1
   - [ ] C) Only when profit is positive
   - [ ] D) Only for complex products

5. **What happens when you change the quantity field?**
   - [ ] A) Nothing
   - [ ] B) Only total cost updates
   - [ ] C) All calculations update in real-time
   - [ ] D) You must save first

6. **Can you edit specifications in the quote?**
   - [ ] A) Yes, always
   - [ ] B) Yes, but only as admin
   - [ ] C) No, they are immutable
   - [ ] D) Yes, if order is not completed

7. **What color indicates positive profit margin?**
   - [ ] A) Red
   - [ ] B) Green
   - [ ] C) Yellow
   - [ ] D) Blue

8. **What's an excellent profit margin percentage?**
   - [ ] A) > 100%
   - [ ] B) > 500%
   - [ ] C) > 1000%
   - [ ] D) > 50%

9. **Where should you document pricing decisions?**
   - [ ] A) Email
   - [ ] B) Internal Notes field
   - [ ] C) Separate document
   - [ ] D) Not necessary

10. **What should you do if specifications are missing?**
    - [ ] A) Proceed anyway
    - [ ] B) Contact customer for details
    - [ ] C) Guess the specifications
    - [ ] D) Cancel the order

**Answer Key**: 1-B, 2-B, 3-C, 4-B, 5-C, 6-C, 7-B, 8-C, 9-B, 10-B

**Passing Score**: 8/10 (80%)

### Practical Assessment

**Task**: Complete a full quote creation with specifications and calculations

**Scenario**:
- Order: Custom Metal Plaque
- Specifications: 6 custom fields provided
- Quantity: 5 units
- Vendor Quote: Rp 300,000 per unit
- Target Profit Margin: 800%

**Requirements**:
1. Review and document all specifications
2. Calculate required unit price for target margin
3. Enter vendor cost and unit price
4. Verify per-piece calculations
5. Verify total calculations
6. Document pricing decision in notes
7. Compare with alternative vendor (Rp 350,000)
8. Make final vendor selection with justification

**Evaluation Criteria**:
- ✅ All specifications reviewed
- ✅ Calculations correct
- ✅ Target margin achieved
- ✅ Vendor comparison completed
- ✅ Decision documented
- ✅ Justification provided

### Certification

**Certificate Awarded**: Quote Management Enhancement Specialist

**Requirements**:
- ✅ Complete training module (45 minutes)
- ✅ Pass knowledge check (80%+)
- ✅ Complete practical assessment
- ✅ Demonstrate proficiency in real scenario

**Certificate Includes**:
- Participant name
- Completion date
- Module name
- Certification number
- Valid for: 1 year

---

## Training Resources

### Instructor Materials

**Presentation Slides**: Available in training portal
**Demo Account**: Use provided test credentials
**Sample Data**: Pre-loaded orders with specifications
**Answer Keys**: Included in instructor guide

### Participant Materials

**Handouts**:
- Quick Reference Card (print-friendly)
- Calculation Formulas Sheet
- Troubleshooting Guide
- Best Practices Checklist

**Digital Resources**:
- Full documentation (PDF)
- Video tutorials (coming soon)
- Interactive exercises
- Practice environment

### Follow-Up Support

**Post-Training**:
- 30-day email support
- Weekly Q&A sessions
- Peer discussion forum
- Refresher webinars

**Continuous Learning**:
- Advanced techniques workshop
- Case study analysis
- Best practices sharing
- Feature updates training

---

## Training Schedule

### Recommended Delivery

**Format**: Live instructor-led or self-paced online

**Live Session Schedule**:
- 0:00-0:05 - Introduction & Objectives
- 0:05-0:15 - Product Specifications Display
- 0:15-0:30 - Pricing Calculations Breakdown
- 0:30-0:40 - Practical Applications
- 0:40-0:45 - Best Practices & Q&A
- 0:45-1:00 - Hands-On Practice (optional)

**Self-Paced**:
- Complete at your own pace
- Estimated time: 45-60 minutes
- Interactive exercises included
- Assessment at end

### Group Training

**Ideal Group Size**: 5-15 participants
**Instructor**: Certified trainer or senior admin
**Equipment**: Computer lab or BYOD
**Materials**: Printed handouts + digital access

---

## Feedback & Improvement

### Training Evaluation

**Participant Feedback Form**:
1. Content clarity (1-5)
2. Instructor effectiveness (1-5)
3. Hands-on exercises (1-5)
4. Materials quality (1-5)
5. Overall satisfaction (1-5)
6. Suggestions for improvement

**Success Metrics**:
- Completion rate: Target 95%
- Pass rate: Target 90%
- Satisfaction score: Target 4.5/5
- Feature adoption: Target 80% within 30 days

### Continuous Improvement

**Review Cycle**: Quarterly
**Updates**: As features evolve
**Feedback Integration**: Monthly review
**Version Control**: Track all changes

---

## Document Information

- **Version**: 1.0
- **Created**: February 3, 2026
- **Last Updated**: February 3, 2026
- **Module Code**: QM-ENH-001
- **Duration**: 45 minutes
- **Level**: Intermediate
- **Prerequisites**: Basic Quote Management
- **Related Modules**:
  - Quote Management Fundamentals
  - Order Status Workflow
  - Vendor Management
  - Product Management

---

**© 2026 CanvaStencil. All rights reserved.**

---

## Appendix: Training Checklist

### Pre-Training
- [ ] Schedule training session
- [ ] Invite participants
- [ ] Prepare demo environment
- [ ] Load sample data
- [ ] Test all features
- [ ] Print handouts
- [ ] Set up equipment
- [ ] Prepare assessment materials

### During Training
- [ ] Welcome participants
- [ ] Review objectives
- [ ] Deliver content
- [ ] Facilitate exercises
- [ ] Answer questions
- [ ] Conduct assessment
- [ ] Collect feedback

### Post-Training
- [ ] Grade assessments
- [ ] Issue certificates
- [ ] Send follow-up materials
- [ ] Schedule Q&A session
- [ ] Monitor feature adoption
- [ ] Provide ongoing support
- [ ] Review feedback
- [ ] Update materials as needed
