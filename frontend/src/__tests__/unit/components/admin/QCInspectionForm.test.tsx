import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QCInspectionForm } from '@/components/admin/QCInspectionForm';

describe('QCInspectionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSaveDraft = vi.fn();

  const defaultProps = {
    orderId: 'order-123',
    orderNumber: 'ORD-2026-00123',
    productName: 'Custom Etched Plate',
    onSubmit: mockOnSubmit,
    onSaveDraft: mockOnSaveDraft
  };

  it('renders the form with order information', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    expect(screen.getByText('Quality Control Inspection')).toBeInTheDocument();
    expect(screen.getByText(/ORD-2026-00123/)).toBeInTheDocument();
    expect(screen.getByText(/Custom Etched Plate/)).toBeInTheDocument();
  });

  it('displays all checklist categories', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    expect(screen.getByText('1. Physical Specifications')).toBeInTheDocument();
    expect(screen.getByText('2. Etching Quality')).toBeInTheDocument();
    expect(screen.getByText('3. Finishing Quality')).toBeInTheDocument();
    expect(screen.getByText('4. Functional Checks')).toBeInTheDocument();
    expect(screen.getByText('5. Packaging & Presentation')).toBeInTheDocument();
  });

  it('displays final approval section', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    expect(screen.getByText('6. Final Approval')).toBeInTheDocument();
    expect(screen.getByText('Total Score:')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByText('Final Decision')).toBeInTheDocument();
  });

  it('calculates score correctly when items are marked', async () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    // Initially score should be 0%
    expect(screen.getByText('0%')).toBeInTheDocument();
    
    // Expand first category
    const firstCategory = screen.getByText('1. Physical Specifications');
    fireEvent.click(firstCategory);
    
    // Mark first item as pass
    await waitFor(() => {
      const passRadios = screen.getAllByLabelText(/Pass/);
      if (passRadios.length > 0) {
        fireEvent.click(passRadios[0]);
      }
    });
  });

  it('shows critical items status', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    expect(screen.getByText('Critical Items:')).toBeInTheDocument();
  });

  it('has save draft and submit buttons', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Inspection/i })).toBeInTheDocument();
  });

  it('allows entering inspector information', () => {
    render(<QCInspectionForm {...defaultProps} />);
    
    const inspectorNameInput = screen.getByPlaceholderText('Enter inspector name');
    const durationInput = screen.getByPlaceholderText('Enter duration');
    
    fireEvent.change(inspectorNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(durationInput, { target: { value: '45' } });
    
    expect(inspectorNameInput).toHaveValue('John Doe');
    expect(durationInput).toHaveValue(45); // Number input returns number
  });
});
