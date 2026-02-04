import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';

describe('Focus Indicators - Accessibility', () => {
  const specifications = {
    field1: 'value1',
    field2: 'value2',
  };

  const formSchema = {
    fields: [
      { name: 'field1', label: 'Field 1', type: 'text' as const },
      { name: 'field2', label: 'Field 2', type: 'text' as const },
    ],
  };

  it('should have visible focus ring classes', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check for focus ring classes
    const focusElement = container.querySelector('.focus\\:ring-2');
    expect(focusElement).toBeTruthy();
    
    const focusRingColor = container.querySelector('.focus\\:ring-blue-500');
    expect(focusRingColor).toBeTruthy();
    
    const focusRingOffset = container.querySelector('.focus\\:ring-offset-2');
    expect(focusRingOffset).toBeTruthy();
  });

  it('should remove default outline and use custom focus ring', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check that outline is removed in favor of ring
    const focusElement = container.querySelector('.focus\\:outline-none');
    expect(focusElement).toBeTruthy();
  });

  it('should be focusable via keyboard', async () => {
    render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    const button = screen.getByRole('button');
    
    // Tab to the button
    await userEvent.tab();
    
    // Button should be focused
    expect(document.activeElement).toBe(button);
  });

  it('should maintain focus after interaction', async () => {
    render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    expect(document.activeElement).toBe(button);
    
    // Click to expand
    await userEvent.click(button);
    
    // Focus should remain on button
    expect(document.activeElement).toBe(button);
    
    // Click to collapse
    await userEvent.click(button);
    
    // Focus should still be on button
    expect(document.activeElement).toBe(button);
  });

  it('should have proper tabIndex for keyboard navigation', () => {
    render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('should have rounded corners for focus ring visibility', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check for rounded corners
    const roundedElement = container.querySelector('.rounded-t-lg');
    expect(roundedElement).toBeTruthy();
  });

  it('should have sufficient minimum touch target size', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check for minimum height (44px is WCAG recommended minimum)
    const minHeightElement = container.querySelector('.min-h-\\[44px\\]');
    expect(minHeightElement).toBeTruthy();
  });

  it('should have hover state for better interactivity feedback', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check for hover state
    const hoverElement = container.querySelector('.hover\\:bg-muted\\/50');
    expect(hoverElement).toBeTruthy();
  });

  it('should have transition for smooth focus state changes', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay
        specifications={specifications}
        formSchema={formSchema}
      />
    );

    // Check for transition
    const transitionElement = container.querySelector('.transition-colors');
    expect(transitionElement).toBeTruthy();
  });

  describe('Focus Ring Color Contrast', () => {
    it('should use blue-500 for sufficient contrast', () => {
      const { container } = render(
        <QuoteItemSpecificationsDisplay
          specifications={specifications}
          formSchema={formSchema}
        />
      );

      // Blue-500 (#3b82f6) provides good contrast on both light and dark backgrounds
      const focusRingColor = container.querySelector('.focus\\:ring-blue-500');
      expect(focusRingColor).toBeTruthy();
    });

    it('should have ring offset for better visibility', () => {
      const { container } = render(
        <QuoteItemSpecificationsDisplay
          specifications={specifications}
          formSchema={formSchema}
        />
      );

      // Ring offset creates space between element and focus ring
      const focusRingOffset = container.querySelector('.focus\\:ring-offset-2');
      expect(focusRingOffset).toBeTruthy();
    });
  });

  describe('Keyboard Navigation Flow', () => {
    it('should allow sequential keyboard navigation', async () => {
      const { container } = render(
        <div>
          <button>Before</button>
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <button>After</button>
        </div>
      );

      const beforeButton = screen.getByText('Before');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const afterButton = screen.getByText('After');

      // Start from before button
      beforeButton.focus();
      expect(document.activeElement).toBe(beforeButton);

      // Tab to specifications button
      await userEvent.tab();
      expect(document.activeElement).toBe(specButton);

      // Tab to after button
      await userEvent.tab();
      expect(document.activeElement).toBe(afterButton);
    });

    it('should allow reverse keyboard navigation', async () => {
      const { container } = render(
        <div>
          <button>Before</button>
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <button>After</button>
        </div>
      );

      const beforeButton = screen.getByText('Before');
      const specButton = screen.getByRole('button', { name: /product specifications/i });
      const afterButton = screen.getByText('After');

      // Start from after button
      afterButton.focus();
      expect(document.activeElement).toBe(afterButton);

      // Shift+Tab to specifications button
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(specButton);

      // Shift+Tab to before button
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(beforeButton);
    });
  });

  describe('Focus Management Best Practices', () => {
    it('should not trap focus', async () => {
      render(
        <div>
          <button>Before</button>
          <QuoteItemSpecificationsDisplay
            specifications={specifications}
            formSchema={formSchema}
          />
          <button>After</button>
        </div>
      );

      const specButton = screen.getByRole('button', { name: /product specifications/i });
      
      // Focus and expand
      specButton.focus();
      await userEvent.keyboard('{Enter}');
      
      // Should still be able to tab away
      await userEvent.tab();
      expect(document.activeElement).not.toBe(specButton);
    });

    it('should maintain logical focus order when expanded', async () => {
      render(
        <QuoteItemSpecificationsDisplay
          specifications={specifications}
          formSchema={formSchema}
        />
      );

      const button = screen.getByRole('button');
      
      // Expand the specifications
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      // Button should still be in tab order
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });
});
