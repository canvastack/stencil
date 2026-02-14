# QC Inspection UI Implementation Guide

## Overview

This document describes the Quality Control (QC) Inspection UI implementation for PT Custom Etching Xenial (PT CEX). The QC inspection system provides a comprehensive checklist-based interface for quality inspectors to evaluate products before shipping.

## Components

### 1. QCInspectionForm

**Location**: `frontend/src/components/admin/QCInspectionForm.tsx`

**Purpose**: Interactive form for conducting QC inspections with checklist items, photo uploads, and final approval.

**Features**:
- Accordion-based checklist categories
- Pass/Fail/Needs Rework status selection for each item
- Photo upload with preview for documentation
- Measurement input fields for dimensional checks
- Notes field for each checklist item
- Real-time score calculation
- Critical items validation
- Overall rating and final decision selection
- Inspector information capture
- Draft saving capability

**Props**:
```typescript
interface QCInspectionFormProps {
  orderId: string;
  orderNumber: string;
  productName: string;
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft: (data: any) => Promise<void>;
}
```

**Checklist Categories**:
1. Physical Specifications
   - Dimensions Accuracy
   - Material Verification
   - Weight Check

2. Etching Quality
   - Etching Depth
   - Design Accuracy
   - Line Quality

3. Finishing Quality
   - Surface Finish
   - Edge Quality
   - Color Consistency

4. Functional Checks
   - Mounting/Installation
   - Readability
   - Durability Test

5. Packaging & Presentation
   - Protective Packaging
   - Labeling
   - Documentation

6. Final Approval
   - Overall Rating (Excellent/Good/Acceptable/Poor)
   - Final Decision (Approved/Approved with Notes/Rejected/Needs Rework)
   - Decision Notes
   - Inspector Information

**Critical Items**:
The following items are marked as critical and must pass for approval:
- Dimensions Accuracy
- Material Verification
- Design Accuracy
- Surface Finish

**Score Calculation**:
```
Total Score = (Passed Items / Total Checked Items) × 100
```

**Decision Matrix**:
- 100% Critical Pass + 90%+ Overall = APPROVED
- 100% Critical Pass + 80-89% Overall = APPROVED WITH NOTES
- 100% Critical Pass + 70-79% Overall = NEEDS REWORK
- Any Critical Fail = REJECTED

### 2. QCInspectionView

**Location**: `frontend/src/components/admin/QCInspectionView.tsx`

**Purpose**: Read-only view for displaying completed QC inspection reports.

**Features**:
- Overall result summary with score and rating
- Tabbed interface (Checklist/Photos/History)
- Detailed checklist results with status badges
- Photo gallery with full-size preview
- Inspection history timeline
- PDF download and print functionality

**Props**:
```typescript
interface QCInspectionViewProps {
  inspection: QCInspectionData;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
}
```

**Tabs**:
1. **Checklist Results**: Shows all categories and items with their status, notes, measurements, and photos
2. **Photos**: Gallery view of all inspection photos
3. **History**: Timeline of inspection events

### 3. QCInspectionPage

**Location**: `frontend/src/pages/admin/QCInspectionPage.tsx`

**Purpose**: Main page that integrates the form and view components.

**Routes**:
- `/admin/orders/:orderId/qc-inspection` - Create new inspection
- `/admin/orders/:orderId/qc-inspection/:inspectionId` - View existing inspection

**Features**:
- Automatic mode switching (new/view) based on route
- Order information display
- Integration with backend API (TODO)
- Navigation back to order detail

## Data Structure

### Inspection Data Format

```typescript
interface QCInspectionData {
  uuid: string;
  order_number: string;
  inspection_number: string;
  product_name: string;
  inspection_date: string;
  inspector_name: string;
  inspection_duration_minutes: number;
  overall_rating: 'excellent' | 'good' | 'acceptable' | 'poor';
  total_score: number;
  critical_items_passed: boolean;
  decision: 'approved' | 'approved_with_notes' | 'rejected' | 'needs_rework';
  decision_notes: string;
  checklist_results: {
    [categoryId: string]: {
      [itemId: string]: {
        status: 'pass' | 'fail' | 'needs_rework';
        notes: string;
        photos: string[];
        measurements?: Record<string, string>;
      }
    }
  };
  photos: string[];
  created_at: string;
}
```

## Usage

### Creating a New Inspection

1. Navigate to order detail page
2. Click "Start QC Inspection" button
3. Fill out checklist items:
   - Expand each category accordion
   - Select status (Pass/Fail/Needs Rework) for each item
   - Add notes and measurements as needed
   - Upload photos for documentation
4. Complete final approval section:
   - Select overall rating
   - Choose final decision
   - Add decision notes
   - Enter inspector information
5. Save draft or submit inspection

### Viewing an Inspection

1. Navigate to order detail page
2. Click on existing inspection from list
3. View inspection report with tabs:
   - Review checklist results
   - Browse photos
   - Check inspection history
4. Download PDF or print report

## Photo Management

### Upload Requirements
- Supported formats: JPEG, PNG, JPG
- Maximum file size: 5MB per photo
- Multiple photos per checklist item
- Automatic preview generation

### Photo Display
- Thumbnail grid view in form
- Full-size preview on click
- Gallery view in inspection report
- Organized by checklist item

## Validation Rules

### Form Validation
1. At least one checklist item must be checked
2. All critical items must pass for approval
3. Overall rating is required
4. Final decision is required
5. Inspector name is required
6. Inspection duration is optional but recommended

### Business Rules
1. Cannot approve if critical items failed
2. Score automatically calculated from checked items
3. Photos are optional but recommended (8-12 minimum for standard, 12-18 for premium)
4. Measurements required for dimensional checks

## Integration Points

### Backend API (TODO)

**Endpoints**:
```
POST   /api/admin/orders/{orderId}/qc-inspections
GET    /api/admin/orders/{orderId}/qc-inspections
GET    /api/admin/qc-inspections/{inspectionId}
PUT    /api/admin/qc-inspections/{inspectionId}
DELETE /api/admin/qc-inspections/{inspectionId}
POST   /api/admin/qc-inspections/{inspectionId}/photos
DELETE /api/admin/qc-inspections/{inspectionId}/photos/{photoId}
GET    /api/admin/qc-inspections/{inspectionId}/pdf
```

### Order Status Integration

When QC inspection is completed:
- **Approved**: Order status → `shipping`
- **Approved with Notes**: Order status → `shipping` (with notes)
- **Rejected**: Order status → `in_production` (vendor rework)
- **Needs Rework**: Order status → `in_production` (specific fixes)

### Vendor Notification

When inspection is rejected:
1. Send email to vendor with rejection details
2. Include photos of defects
3. Specify required corrections
4. Set rework deadline
5. Create rework ticket

## Testing

### Unit Tests

**Location**: `frontend/src/__tests__/unit/components/admin/QCInspectionForm.test.tsx`

**Test Coverage**:
- Form rendering with order information
- Checklist categories display
- Final approval section
- Score calculation
- Critical items status
- Button functionality
- Inspector information input

**Run Tests**:
```bash
npm test -- QCInspectionForm.test.tsx --run
```

### Integration Tests (TODO)

Test scenarios:
1. Complete inspection workflow (create → submit → view)
2. Photo upload and display
3. Draft save and restore
4. Validation error handling
5. API integration

### E2E Tests (TODO)

Test scenarios:
1. Inspector creates new inspection
2. Inspector uploads photos
3. Inspector submits inspection
4. Admin views inspection report
5. Admin downloads PDF
6. Vendor receives rejection notification

## Styling

### Design System
- Uses shadcn-ui components
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Dark mode support

### Color Coding
- **Pass**: Green (bg-green-100, text-green-800)
- **Fail**: Red (bg-red-100, text-red-800)
- **Needs Rework**: Orange (bg-orange-100, text-orange-800)
- **Approved**: Green (bg-green-600)
- **Rejected**: Red (bg-red-600)
- **Approved with Notes**: Yellow (bg-yellow-600)

### Icons
- CheckCircle2: Pass status
- XCircle: Fail status
- AlertCircle: Needs Rework status
- Camera: Photo upload
- Save: Save draft
- Send: Submit inspection
- Download: PDF download
- Printer: Print report

## Future Enhancements

### Phase 2 Features
1. **AI-Powered Quality Detection**
   - Automated defect detection from photos
   - Dimension measurement from images
   - Design comparison using computer vision

2. **Mobile App**
   - Native mobile app for inspectors
   - Offline mode with sync
   - Camera integration
   - Voice notes

3. **Advanced Analytics**
   - Quality trends dashboard
   - Defect analysis
   - Inspector performance metrics
   - Product quality ranking

4. **Customer Portal**
   - Share QC photos with customers
   - Customer approval before shipping
   - Quality certificate generation

5. **Blockchain Certification**
   - Immutable quality records
   - Tamper-proof documentation
   - Verifiable certificates

## Troubleshooting

### Common Issues

**Issue**: Photos not uploading
- Check file size (max 5MB)
- Verify file format (JPEG, PNG, JPG only)
- Check browser console for errors

**Issue**: Score not calculating
- Ensure at least one item is checked
- Verify status is selected (not null)
- Check browser console for errors

**Issue**: Cannot submit inspection
- Verify all required fields filled
- Check critical items passed
- Ensure inspector name entered

**Issue**: Component not rendering
- Check route configuration in App.tsx
- Verify component imports
- Check browser console for errors

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check test files for examples
4. Contact development team

## References

- [QC Checklist Design Document](../../.kiro/specs/post-acceptance-workflow/QC_CHECKLIST_DESIGN.md)
- [Post-Acceptance Workflow Requirements](../../.kiro/specs/post-acceptance-workflow/requirements.md)
- [Post-Acceptance Workflow Design](../../.kiro/specs/post-acceptance-workflow/design.md)
- [shadcn-ui Documentation](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-14  
**Author**: Kiro AI Assistant
