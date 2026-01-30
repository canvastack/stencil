/**
 * Order Status Animations Tests
 * 
 * Tests for the animation utilities and components
 * Ensures animations work correctly and respect user preferences
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OrderStatusAnimations, buildAnimationClasses, useOrderStatusAnimations } from '@/utils/OrderStatusAnimations';
import React from 'react';

// Mock window.matchMedia for reduced motion testing
const mockMatchMedia = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('OrderStatusAnimations', () => {
  describe('prefersReducedMotion', () => {
    it('should return false when user does not prefer reduced motion', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
      });

      expect(OrderStatusAnimations.prefersReducedMotion()).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
      });

      expect(OrderStatusAnimations.prefersReducedMotion()).toBe(true);
    });
  });

  describe('getAnimationClasses', () => {
    it('should return animation classes when motion is not reduced', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
      });

      const classes = OrderStatusAnimations.getAnimationClasses('stageCompleting');
      expect(classes).toContain('animate-pulse');
      expect(classes).toContain('scale-105');
    });

    it('should return minimal classes when motion is reduced', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
      });

      const classes = OrderStatusAnimations.getAnimationClasses('stageCompleting');
      expect(classes).toBe('transition-colors duration-200');
    });
  });

  describe('buildAnimationClasses', () => {
    it('should combine base classes with animation classes', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
      });

      const classes = buildAnimationClasses('p-4 bg-white', 'stageCompleting');
      expect(classes).toContain('p-4');
      expect(classes).toContain('bg-white');
      expect(classes).toContain('animate-pulse');
    });

    it('should return only base classes when no animation type provided', () => {
      const classes = buildAnimationClasses('p-4 bg-white');
      expect(classes).toBe('p-4 bg-white');
    });
  });

  describe('animation state management', () => {
    it('should set and get animation state', () => {
      const state = {
        isAnimating: true,
        animationType: 'completion' as const,
        targetStage: 'test-stage'
      };

      OrderStatusAnimations.setAnimationState('test-component', state);
      const retrievedState = OrderStatusAnimations.getAnimationState('test-component');

      expect(retrievedState).toEqual(state);
    });

    it('should clear animation state', () => {
      const state = {
        isAnimating: true,
        animationType: 'completion' as const
      };

      OrderStatusAnimations.setAnimationState('test-component', state);
      OrderStatusAnimations.clearAnimationState('test-component');
      
      const retrievedState = OrderStatusAnimations.getAnimationState('test-component');
      expect(retrievedState).toBeUndefined();
    });
  });

  describe('animation methods', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
      
      // Mock reduced motion as false for these tests
      mockMatchMedia.mockReturnValue({
        matches: false,
      });
    });

    afterEach(() => {
      document.body.removeChild(mockElement);
    });

    it('should create stage completion animation', () => {
      const onComplete = vi.fn();
      
      OrderStatusAnimations.createStageCompletionAnimation(mockElement, onComplete);
      
      expect(mockElement.classList.contains('animate-pulse')).toBe(true);
      expect(mockElement.classList.contains('scale-105')).toBe(true);
    });

    it('should create status change animation for success', () => {
      const onComplete = vi.fn();
      
      OrderStatusAnimations.createStatusChangeAnimation(mockElement, true, onComplete);
      
      expect(mockElement.classList.contains('animate-glow')).toBe(true);
      expect(mockElement.classList.contains('bg-green-50')).toBe(true);
    });

    it('should create status change animation for error', () => {
      const onComplete = vi.fn();
      
      OrderStatusAnimations.createStatusChangeAnimation(mockElement, false, onComplete);
      
      expect(mockElement.classList.contains('animate-shake')).toBe(true);
      expect(mockElement.classList.contains('bg-red-50')).toBe(true);
    });

    it('should skip animations when reduced motion is preferred', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
      });

      const onComplete = vi.fn();
      
      OrderStatusAnimations.createStageCompletionAnimation(mockElement, onComplete);
      
      expect(onComplete).toHaveBeenCalled();
      expect(mockElement.classList.contains('animate-pulse')).toBe(false);
    });
  });
});

// Test component for useOrderStatusAnimations hook
function TestComponent({ componentId }: { componentId: string }) {
  const { animationState, startAnimation, stopAnimation, getAnimationClasses } = useOrderStatusAnimations(componentId);

  return (
    <div data-testid="test-component">
      <div data-testid="animation-state">
        {animationState.isAnimating ? 'animating' : 'idle'}
      </div>
      <div data-testid="animation-type">
        {animationState.animationType}
      </div>
      <button 
        data-testid="start-animation"
        onClick={() => startAnimation('completion', 'test-stage')}
      >
        Start Animation
      </button>
      <button 
        data-testid="stop-animation"
        onClick={() => stopAnimation()}
      >
        Stop Animation
      </button>
    </div>
  );
}

describe('useOrderStatusAnimations hook', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
    });
  });

  it('should initialize with idle state', () => {
    render(<TestComponent componentId="test" />);
    
    expect(screen.getByTestId('animation-state')).toHaveTextContent('idle');
    expect(screen.getByTestId('animation-type')).toHaveTextContent('idle');
  });

  it('should start and stop animations', () => {
    render(<TestComponent componentId="test" />);
    
    const startButton = screen.getByTestId('start-animation');
    const stopButton = screen.getByTestId('stop-animation');
    
    // Start animation
    act(() => {
      startButton.click();
    });
    expect(screen.getByTestId('animation-state')).toHaveTextContent('animating');
    expect(screen.getByTestId('animation-type')).toHaveTextContent('completion');
    
    // Stop animation
    act(() => {
      stopButton.click();
    });
    expect(screen.getByTestId('animation-state')).toHaveTextContent('idle');
    expect(screen.getByTestId('animation-type')).toHaveTextContent('idle');
  });
});