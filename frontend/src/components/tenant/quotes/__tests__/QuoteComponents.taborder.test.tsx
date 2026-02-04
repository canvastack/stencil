import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QuoteItemCalculations } from '../QuoteItemCalculations';
import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';

describe('Tab Order - Accessibility', () => {
  describe('QuoteItemSpecifications - Tab Order', () => {
    const specifications = {
      field1: 'value1',
      field2: 'value2',
      field3: 'value3',
    };

    const formSchema = {
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text' as const },
        { name: 'field2', label: 'Field 2', type: 'text' as const },
        { name: 'field3', label: 'Field 3', type: 'text' as const },
      ],
    };

    it('should have correct tabIndex on button', () => {
      render(
        <QuoteItemSpecificationsDisplay
          specifications={specifications}
          formSchema={formSchema}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should be included in natural tab order', async () => {
      render(
        <div>
          <input type="text" placeholder="Input 1" />
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <input type="text" placeholder="Input 2" />
        </div>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      const button = screen.getByRole('button', { name: /product specifications/i });
      const input2 = screen.getByPlaceholderText('Input 2');

      // Start from input1
      input1.focus();
      expect(document.activeElement).toBe(input1);

      // Tab to button
      await userEvent.tab();
      expect(document.activeElement).toBe(button);

      // Tab to input2
      await userEvent.tab();
      expect(document.activeElement).toBe(input2);
    });

    it('should support reverse tab order', async () => {
      render(
        <div>
          <input type="text" placeholder="Input 1" />
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <input type="text" placeholder="Input 2" />
        </div>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      const button = screen.getByRole('button', { name: /product specifications/i });
      const input2 = screen.getByPlaceholderText('Input 2');

      // Start from input2
      input2.focus();
      expect(document.activeElement).toBe(input2);

      // Shift+Tab to button
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(button);

      // Shift+Tab to input1
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(input1);
    });

    it('should not have nested focusable elements in expanded state', async () => {
      const { container } = render(
        <QuoteItemSpecificationsDisplay
          specifications={specifications}
          formSchema={formSchema}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      // Check that expanded content doesn't have focusable elements
      const content = container.querySelector('#specifications-content');
      expect(content).toBeTruthy();

      // Content should not have buttons, links, or inputs
      const focusableElements = content?.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      expect(focusableElements?.length).toBe(0);
    });

    it('should maintain button in tab order when expanded', async () => {
      render(
        <div>
          <input type="text" placeholder="Before" />
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <input type="text" placeholder="After" />
        </div>
      );

      const button = screen.getByRole('button', { name: /product specifications/i });
      const afterInput = screen.getByPlaceholderText('After');

      // Expand the specifications
      button.focus();
      await userEvent.keyboard('{Enter}');

      // Tab should still move to next element
      await userEvent.tab();
      expect(document.activeElement).toBe(afterInput);
    });
  });

  describe('QuoteItemCalculations - Tab Order', () => {
    const defaultProps = {
      quantity: 2,
      unitPrice: 100000,
      vendorCost: 50000,
      totalUnitPrice: 200000,
      totalVendorCost: 100000,
      profitPerPiece: 50000,
      profitPerPiecePercent: 100,
      profitTotal: 100000,
      profitTotalPercent: 100,
    };

    it('should not have any focusable elements', () => {
      const { container } = render(<QuoteItemCalculations {...defaultProps} />);

      // Calculations component is read-only, should not have focusable elements
      const focusableElements = container.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBe(0);
    });

    it('should not interrupt tab flow', async () => {
      render(
        <div>
          <input type="text" placeholder="Before" />
          <QuoteItemCalculations {...defaultProps} />
          <input type="text" placeholder="After" />
        </div>
      );

      const beforeInput = screen.getByPlaceholderText('Before');
      const afterInput = screen.getByPlaceholderText('After');

      // Start from before input
      beforeInput.focus();
      expect(document.activeElement).toBe(beforeInput);

      // Tab should skip calculations and go to after input
      await userEvent.tab();
      expect(document.activeElement).toBe(afterInput);
    });

    it('should be accessible via screen reader but not keyboard', () => {
      const { container } = render(<QuoteItemCalculations {...defaultProps} />);

      // Should have region role for screen readers
      const region = container.querySelector('[role="region"]');
      expect(region).toBeTruthy();

      // But should not be in tab order
      expect(region).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Combined Components - Tab Order', () => {
    const specifications = {
      field1: 'value1',
    };

    const formSchema = {
      fields: [
        { name: 'field1', label: 'Field 1', type: 'text' as const },
      ],
    };

    const calculationsProps = {
      quantity: 1,
      unitPrice: 100000,
      vendorCost: 50000,
      totalUnitPrice: 100000,
      totalVendorCost: 50000,
      profitPerPiece: 50000,
      profitPerPiecePercent: 100,
      profitTotal: 50000,
      profitTotalPercent: 100,
    };

    it('should have logical tab order when both components are present', async () => {
      render(
        <div>
          <input type="text" placeholder="Input 1" />
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <QuoteItemCalculations {...calculationsProps} />
          <input type="text" placeholder="Input 2" />
        </div>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const input2 = screen.getByPlaceholderText('Input 2');

      // Start from input1
      input1.focus();
      expect(document.activeElement).toBe(input1);

      // Tab to specifications button
      await userEvent.tab();
      expect(document.activeElement).toBe(specButton);

      // Tab should skip calculations (no focusable elements) and go to input2
      await userEvent.tab();
      expect(document.activeElement).toBe(input2);
    });

    it('should maintain logical order in reverse', async () => {
      render(
        <div>
          <input type="text" placeholder="Input 1" />
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <QuoteItemCalculations {...calculationsProps} />
          <input type="text" placeholder="Input 2" />
        </div>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const input2 = screen.getByPlaceholderText('Input 2');

      // Start from input2
      input2.focus();
      expect(document.activeElement).toBe(input2);

      // Shift+Tab should skip calculations and go to specifications button
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(specButton);

      // Shift+Tab to input1
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(input1);
    });
  });

  describe('Tab Order Best Practices', () => {
    it('should use tabIndex="0" for natural tab order', () => {
      render(
        <QuoteItemSpecificationsDisplay
          specifications={{ field1: 'value1' }}
          formSchema={{ fields: [{ name: 'field1', label: 'Field 1', type: 'text' }] }}
        />
      );

      const button = screen.getByRole('button');
      // tabIndex="0" means element is in natural tab order
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should not use positive tabIndex values', () => {
      const { container } = render(
        <div>
          <QuoteItemSpecificationsDisplay
            specifications={{ field1: 'value1' }}
            formSchema={{ fields: [{ name: 'field1', label: 'Field 1', type: 'text' }] }}
          />
          <QuoteItemCalculations
            quantity={1}
            unitPrice={100000}
            vendorCost={50000}
            totalUnitPrice={100000}
            totalVendorCost={50000}
            profitPerPiece={50000}
            profitPerPiecePercent={100}
            profitTotal={50000}
            profitTotalPercent={100}
          />
        </div>
      );

      // Positive tabIndex values (1, 2, 3, etc.) are anti-pattern
      const positiveTabIndex = container.querySelectorAll('[tabindex="1"], [tabindex="2"], [tabindex="3"]');
      expect(positiveTabIndex.length).toBe(0);
    });

    it('should follow visual order', async () => {
      render(
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button>Top Button</button>
          <QuoteItemSpecificationsDisplay
            specifications={{ field1: 'value1' }}
            formSchema={{ fields: [{ name: 'field1', label: 'Field 1', type: 'text' }] }}
          />
          <button>Bottom Button</button>
        </div>
      );

      const topButton = screen.getByText('Top Button');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const bottomButton = screen.getByText('Bottom Button');

      // Tab order should match visual order
      topButton.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(specButton);
      await userEvent.tab();
      expect(document.activeElement).toBe(bottomButton);
    });
  });

  describe('Tab Order with Form Context', () => {
    it('should integrate properly in form tab order', async () => {
      render(
        <form>
          <input type="text" name="field1" placeholder="Field 1" />
          <input type="text" name="field2" placeholder="Field 2" />
          <QuoteItemSpecificationsDisplay
            specifications={{ spec1: 'value1' }}
            formSchema={{ fields: [{ name: 'spec1', label: 'Spec 1', type: 'text' }] }}
          />
          <input type="text" name="field3" placeholder="Field 3" />
          <button type="submit">Submit</button>
        </form>
      );

      const field1 = screen.getByPlaceholderText('Field 1');
      const field2 = screen.getByPlaceholderText('Field 2');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const field3 = screen.getByPlaceholderText('Field 3');
      const submitButton = screen.getByText('Submit');

      // Tab through form in order
      field1.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(field2);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(specButton);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(field3);
      
      await userEvent.tab();
      expect(document.activeElement).toBe(submitButton);
    });
  });
});
