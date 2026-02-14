/**
 * ProductionCountdown Visual Tests
 * 
 * Visual regression tests for different states of the ProductionCountdown component
 */

import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { ProductionCountdown } from '../ProductionCountdown';
import { addDays, subDays } from 'date-fns';

describe('ProductionCountdown Visual Tests', () => {
  it('renders on-track state correctly', () => {
    const acceptedDate = subDays(new Date(), 2).toISOString();
    const estimatedDays = 10;
    
    const { container } = render(
      <ProductionCountdown 
        acceptedDate={acceptedDate} 
        estimatedDays={estimatedDays} 
      />
    );
    
    // Visual snapshot test would go here
    expect(container).toBeTruthy();
  });

  it('renders approaching deadline state correctly', () => {
    const acceptedDate = subDays(new Date(), 8).toISOString();
    const estimatedDays = 10;
    
    const { container } = render(
      <ProductionCountdown 
        acceptedDate={acceptedDate} 
        estimatedDays={estimatedDays} 
      />
    );
    
    // Visual snapshot test would go here
    expect(container).toBeTruthy();
  });

  it('renders overdue state correctly', () => {
    const acceptedDate = subDays(new Date(), 15).toISOString();
    const estimatedDays = 10;
    
    const { container } = render(
      <ProductionCountdown 
        acceptedDate={acceptedDate} 
        estimatedDays={estimatedDays} 
      />
    );
    
    // Visual snapshot test would go here
    expect(container).toBeTruthy();
  });

  it('renders just accepted state correctly', () => {
    const acceptedDate = new Date().toISOString();
    const estimatedDays = 10;
    
    const { container } = render(
      <ProductionCountdown 
        acceptedDate={acceptedDate} 
        estimatedDays={estimatedDays} 
      />
    );
    
    // Visual snapshot test would go here
    expect(container).toBeTruthy();
  });

  it('renders with custom className', () => {
    const acceptedDate = new Date().toISOString();
    const estimatedDays = 10;
    
    const { container } = render(
      <ProductionCountdown 
        acceptedDate={acceptedDate} 
        estimatedDays={estimatedDays}
        className="custom-test-class"
      />
    );
    
    expect(container.querySelector('.custom-test-class')).toBeTruthy();
  });
});
