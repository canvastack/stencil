/**
 * Order Status Animation Utilities
 * 
 * Provides smooth transitions and animations for order status workflow components
 * Includes stage completion animations, modal transitions, and status change feedback
 * 
 * COMPLIANCE:
 * - ✅ ACCESSIBILITY: Respects user motion preferences
 * - ✅ PERFORMANCE: Optimized animations with proper cleanup
 * - ✅ CONSISTENCY: Unified animation system across components
 */

import { cn } from '@/lib/utils';

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface StageAnimationState {
  isAnimating: boolean;
  animationType: 'completion' | 'advancement' | 'idle';
  targetStage?: string;
}

/**
 * Animation configurations for different types of transitions
 */
export const ANIMATION_CONFIGS = {
  // Stage completion animations
  stageCompletion: {
    duration: 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0
  },
  
  // Modal enter/exit animations
  modalEnter: {
    duration: 300,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    delay: 0
  },
  
  modalExit: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    delay: 0
  },
  
  // Status change feedback
  statusChange: {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 100
  },
  
  // Progress bar animations
  progressBar: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 200
  },
  
  // Badge animations
  badgeUpdate: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0
  }
} as const;

/**
 * CSS classes for different animation states
 */
export const ANIMATION_CLASSES = {
  // Stage completion animations
  stageCompleting: 'animate-pulse scale-105 transition-all duration-600',
  stageCompleted: 'animate-scale-in bg-green-50 border-green-200 transition-all duration-600',
  stageAdvancing: 'animate-fade-in-up transition-all duration-400',
  
  // Modal animations
  modalEntering: 'animate-scale-in transition-all duration-300',
  modalExiting: 'animate-fade-out transition-all duration-200',
  
  // Status change feedback
  statusUpdating: 'animate-pulse transition-all duration-400',
  statusUpdated: 'animate-glow transition-all duration-400',
  statusError: 'animate-shake bg-red-50 border-red-200 transition-all duration-400',
  
  // Progress animations
  progressUpdating: 'transition-all duration-800 ease-out',
  progressCompleted: 'animate-glow transition-all duration-600',
  
  // Badge animations
  badgeUpdating: 'animate-bounce transition-all duration-300',
  badgeSuccess: 'animate-scale-in bg-green-100 text-green-800 transition-all duration-300',
  badgeError: 'animate-shake bg-red-100 text-red-800 transition-all duration-300',
  
  // Timeline animations
  timelineEventEntering: 'animate-fade-in-up transition-all duration-500',
  timelineEventHighlight: 'animate-glow transition-all duration-400',
  
  // Button animations
  buttonLoading: 'animate-pulse transition-all duration-300',
  buttonSuccess: 'animate-scale-in bg-green-600 hover:bg-green-700 transition-all duration-300',
  buttonError: 'animate-shake bg-red-600 hover:bg-red-700 transition-all duration-300',
  
  // General animations
  fadeIn: 'animate-fade-in transition-all duration-600',
  fadeInUp: 'animate-fade-in-up transition-all duration-500',
  scaleIn: 'animate-scale-in transition-all duration-400'
} as const;

/**
 * Utility class for managing order status animations
 */
export class OrderStatusAnimations {
  private static animationStates = new Map<string, StageAnimationState>();
  
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Get animation classes with reduced motion support
   */
  static getAnimationClasses(
    animationType: keyof typeof ANIMATION_CLASSES,
    respectMotionPreference = true
  ): string {
    if (respectMotionPreference && this.prefersReducedMotion()) {
      // Return minimal transition classes for reduced motion
      return 'transition-colors duration-200';
    }
    
    return ANIMATION_CLASSES[animationType];
  }
  
  /**
   * Set animation state for a specific component
   */
  static setAnimationState(componentId: string, state: StageAnimationState): void {
    this.animationStates.set(componentId, state);
  }
  
  /**
   * Get animation state for a specific component
   */
  static getAnimationState(componentId: string): StageAnimationState | undefined {
    return this.animationStates.get(componentId);
  }
  
  /**
   * Clear animation state for a specific component
   */
  static clearAnimationState(componentId: string): void {
    this.animationStates.delete(componentId);
  }
  
  /**
   * Create stage completion animation sequence
   */
  static createStageCompletionAnimation(
    element: HTMLElement,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const config = ANIMATION_CONFIGS.stageCompletion;
    
    // Add completion animation class
    element.classList.add('animate-pulse', 'scale-105');
    
    setTimeout(() => {
      element.classList.remove('animate-pulse', 'scale-105');
      element.classList.add('animate-scale-in', 'bg-green-50', 'border-green-200');
      
      setTimeout(() => {
        element.classList.remove('animate-scale-in');
        onComplete?.();
      }, config.duration);
    }, config.duration / 2);
  }
  
  /**
   * Create status change feedback animation
   */
  static createStatusChangeAnimation(
    element: HTMLElement,
    success: boolean,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const config = ANIMATION_CONFIGS.statusChange;
    const animationClass = success ? 'animate-glow' : 'animate-shake';
    const bgClass = success ? 'bg-green-50' : 'bg-red-50';
    const borderClass = success ? 'border-green-200' : 'border-red-200';
    
    element.classList.add(animationClass, bgClass, borderClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass, bgClass, borderClass);
      onComplete?.();
    }, config.duration);
  }
  
  /**
   * Create modal enter animation
   */
  static createModalEnterAnimation(
    element: HTMLElement,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const config = ANIMATION_CONFIGS.modalEnter;
    
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.transition = `opacity ${config.duration}ms ${config.easing}, transform ${config.duration}ms ${config.easing}`;
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
      
      setTimeout(() => {
        element.style.transition = '';
        onComplete?.();
      }, config.duration);
    });
  }
  
  /**
   * Create modal exit animation
   */
  static createModalExitAnimation(
    element: HTMLElement,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const config = ANIMATION_CONFIGS.modalExit;
    
    element.style.transition = `opacity ${config.duration}ms ${config.easing}, transform ${config.duration}ms ${config.easing}`;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      onComplete?.();
    }, config.duration);
  }
  
  /**
   * Create progress bar animation
   */
  static createProgressAnimation(
    element: HTMLElement,
    fromPercent: number,
    toPercent: number,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      element.style.width = `${toPercent}%`;
      onComplete?.();
      return;
    }
    
    const config = ANIMATION_CONFIGS.progressBar;
    
    element.style.width = `${fromPercent}%`;
    element.style.transition = `width ${config.duration}ms ${config.easing}`;
    
    setTimeout(() => {
      element.style.width = `${toPercent}%`;
      
      setTimeout(() => {
        element.style.transition = '';
        onComplete?.();
      }, config.duration);
    }, config.delay);
  }
  
  /**
   * Create timeline event entrance animation
   */
  static createTimelineEventAnimation(
    element: HTMLElement,
    delay = 0,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        element.style.transition = '';
        onComplete?.();
      }, 500);
    }, delay);
  }
  
  /**
   * Create button loading animation
   */
  static createButtonLoadingAnimation(
    button: HTMLButtonElement,
    isLoading: boolean
  ): void {
    if (isLoading) {
      button.classList.add('animate-pulse');
      button.disabled = true;
    } else {
      button.classList.remove('animate-pulse');
      button.disabled = false;
    }
  }
  
  /**
   * Create success feedback animation for buttons
   */
  static createButtonSuccessAnimation(
    button: HTMLButtonElement,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const originalClasses = button.className;
    
    button.classList.add('animate-scale-in', 'bg-green-600', 'hover:bg-green-700');
    
    setTimeout(() => {
      button.className = originalClasses;
      onComplete?.();
    }, 300);
  }
  
  /**
   * Create error feedback animation for buttons
   */
  static createButtonErrorAnimation(
    button: HTMLButtonElement,
    onComplete?: () => void
  ): void {
    if (this.prefersReducedMotion()) {
      onComplete?.();
      return;
    }
    
    const originalClasses = button.className;
    
    button.classList.add('animate-shake', 'bg-red-600', 'hover:bg-red-700');
    
    setTimeout(() => {
      button.className = originalClasses;
      onComplete?.();
    }, 400);
  }
}

/**
 * React hook for managing animation states
 */
export function useOrderStatusAnimations(componentId: string) {
  const [animationState, setAnimationState] = React.useState<StageAnimationState>({
    isAnimating: false,
    animationType: 'idle'
  });
  
  const startAnimation = (type: StageAnimationState['animationType'], targetStage?: string) => {
    const newState: StageAnimationState = {
      isAnimating: true,
      animationType: type,
      targetStage
    };
    
    setAnimationState(newState);
    OrderStatusAnimations.setAnimationState(componentId, newState);
  };
  
  const stopAnimation = () => {
    const newState: StageAnimationState = {
      isAnimating: false,
      animationType: 'idle'
    };
    
    setAnimationState(newState);
    OrderStatusAnimations.clearAnimationState(componentId);
  };
  
  return {
    animationState,
    startAnimation,
    stopAnimation,
    getAnimationClasses: OrderStatusAnimations.getAnimationClasses,
    prefersReducedMotion: OrderStatusAnimations.prefersReducedMotion()
  };
}

// Add missing React import for the hook
import React from 'react';

/**
 * Animation class name builder utility
 */
export function buildAnimationClasses(
  baseClasses: string,
  animationType?: keyof typeof ANIMATION_CLASSES,
  respectMotionPreference = true
): string {
  if (!animationType) return baseClasses;
  
  const animationClasses = OrderStatusAnimations.getAnimationClasses(
    animationType,
    respectMotionPreference
  );
  
  return cn(baseClasses, animationClasses);
}

/**
 * Custom keyframes for additional animations
 */
export const CUSTOM_KEYFRAMES = {
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
  },
  'fade-out': {
    '0%': { opacity: '1', transform: 'scale(1)' },
    '100%': { opacity: '0', transform: 'scale(0.95)' }
  },
  'stage-complete': {
    '0%': { transform: 'scale(1)', backgroundColor: 'transparent' },
    '50%': { transform: 'scale(1.05)', backgroundColor: 'rgb(240 253 244)' },
    '100%': { transform: 'scale(1)', backgroundColor: 'rgb(240 253 244)' }
  }
} as const;