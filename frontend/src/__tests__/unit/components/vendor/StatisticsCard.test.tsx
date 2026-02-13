/**
 * StatisticsCard Component Tests
 * 
 * Tests for the reusable statistics card component.
 * 
 * Requirements: 4.2
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatisticsCard from '@/components/vendor/StatisticsCard';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

describe('StatisticsCard', () => {
  it('should render value and label', () => {
    render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Quotes')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(
      <StatisticsCard
        value="4.5h"
        label="Response Time"
      />
    );

    expect(screen.getByText('4.5h')).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <StatisticsCard
        value={15}
        label="Accepted"
        description="60.0% acceptance rate"
      />
    );

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('60.0% acceptance rate')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
      />
    );

    const descriptions = screen.queryByText(/acceptance rate/i);
    expect(descriptions).not.toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const { container } = render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
        icon={FileText}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should not render icon when not provided', () => {
    const { container } = render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
        variant="default"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-md');
    expect(card).toHaveClass('transition-shadow');
  });

  it('should apply warning variant styles', () => {
    const { container } = render(
      <StatisticsCard
        value={5}
        label="Pending Response"
        variant="warning"
        icon={Clock}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('border-orange-200');
    expect(card).toHaveClass('dark:border-orange-900');
  });

  it('should apply success variant styles', () => {
    const { container } = render(
      <StatisticsCard
        value={15}
        label="Accepted"
        variant="success"
        icon={CheckCircle}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('border-green-200');
    expect(card).toHaveClass('dark:border-green-900');
  });

  it('should apply danger variant styles', () => {
    const { container } = render(
      <StatisticsCard
        value={3}
        label="Rejected"
        variant="danger"
        icon={XCircle}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('border-red-200');
    expect(card).toHaveClass('dark:border-red-900');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
        className="custom-class"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('should merge custom className with variant styles', () => {
    const { container } = render(
      <StatisticsCard
        value={5}
        label="Pending"
        variant="warning"
        className="custom-class"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('border-orange-200');
  });

  it('should have proper semantic structure', () => {
    render(
      <StatisticsCard
        value={25}
        label="Total Quotes"
        description="All time quotes"
      />
    );

    const value = screen.getByText('25');
    expect(value.tagName).toBe('DIV');

    const description = screen.getByText('All time quotes');
    expect(description.tagName).toBe('P');
  });

  it('should handle zero value', () => {
    render(
      <StatisticsCard
        value={0}
        label="Pending Quotes"
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    render(
      <StatisticsCard
        value={1234567}
        label="Total Revenue"
      />
    );

    expect(screen.getByText('1234567')).toBeInTheDocument();
  });
});
