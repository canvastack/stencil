/**
 * Animation Demo Component
 * 
 * Demonstrates the smooth transitions implemented for order status workflow
 * Shows stage completion animations, modal transitions, and status change feedback
 */

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Clock, ArrowRight, Package, TrendingUp } from 'lucide-react';
import { OrderStatusAnimations, buildAnimationClasses, useOrderStatusAnimations } from '@/utils/OrderStatusAnimations';
import { cn } from '@/lib/utils';

export function AnimationDemo() {
  const [showModal, setShowModal] = useState(false);
  const [stageCompleted, setStageCompleted] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const [progressPercent, setProgressPercent] = useState(25);
  
  const stageRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const { animationState, startAnimation, stopAnimation } = useOrderStatusAnimations('demo');

  const handleStageCompletion = () => {
    if (stageRef.current) {
      startAnimation('completion');
      OrderStatusAnimations.createStageCompletionAnimation(stageRef.current, () => {
        setStageCompleted(true);
        stopAnimation();
      });
    }
  };

  const handleStatusChange = (success: boolean) => {
    if (statusRef.current) {
      startAnimation('advancement');
      OrderStatusAnimations.createStatusChangeAnimation(statusRef.current, success, () => {
        setStatusChanged(true);
        stopAnimation();
        setTimeout(() => setStatusChanged(false), 2000);
      });
    }
  };

  const handleProgressUpdate = () => {
    const newPercent = progressPercent >= 100 ? 25 : progressPercent + 25;
    
    if (progressRef.current) {
      const progressBar = progressRef.current.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        OrderStatusAnimations.createProgressAnimation(progressBar, progressPercent, newPercent, () => {
          setProgressPercent(newPercent);
        });
      }
    }
  };

  const resetDemo = () => {
    setStageCompleted(false);
    setStatusChanged(false);
    setProgressPercent(25);
    stopAnimation();
    
    // Reset visual states
    if (stageRef.current) {
      stageRef.current.className = stageRef.current.className
        .replace(/animate-\w+/g, '')
        .replace(/bg-green-50/g, '')
        .replace(/border-green-200/g, '');
    }
    if (statusRef.current) {
      statusRef.current.className = statusRef.current.className
        .replace(/animate-\w+/g, '')
        .replace(/bg-\w+-50/g, '')
        .replace(/border-\w+-200/g, '');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Order Status Workflow Animations</h2>
        <p className="text-muted-foreground">
          Demonstrating smooth transitions for stage completion, status changes, and modal interactions
        </p>
      </div>

      {/* Stage Completion Animation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stage Completion Animation</h3>
        <div 
          ref={stageRef}
          className={buildAnimationClasses(
            "p-4 border rounded-lg transition-all duration-300",
            stageCompleted ? "stageCompleted" : undefined
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-all duration-300",
              stageCompleted ? "bg-green-100" : "bg-blue-100"
            )}>
              {stageCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {stageCompleted ? "Stage Completed!" : "Current Stage: In Progress"}
              </p>
              <p className="text-sm text-muted-foreground">
                {stageCompleted ? "Successfully completed with animation" : "Click to complete this stage"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleStageCompletion} disabled={stageCompleted || animationState.isAnimating}>
            Complete Stage
          </Button>
          <Button variant="outline" onClick={resetDemo}>
            Reset Demo
          </Button>
        </div>
      </Card>

      {/* Status Change Animation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Status Change Feedback</h3>
        <div 
          ref={statusRef}
          className={buildAnimationClasses(
            "p-4 border rounded-lg transition-all duration-300",
            statusChanged ? "statusUpdated" : undefined
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Order Status</p>
                <Badge variant="outline" className="mt-1">
                  {statusChanged ? "Updated!" : "In Production"}
                </Badge>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => handleStatusChange(true)} disabled={animationState.isAnimating}>
            Success Update
          </Button>
          <Button variant="destructive" onClick={() => handleStatusChange(false)} disabled={animationState.isAnimating}>
            Error Update
          </Button>
        </div>
      </Card>

      {/* Progress Animation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Bar Animation</h3>
        <div ref={progressRef} className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Order Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="progress-bar h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-800 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleProgressUpdate}>
            Update Progress (+25%)
          </Button>
        </div>
      </Card>

      {/* Modal Animation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modal Enter/Exit Animation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Modal uses smooth scale and fade transitions for enter/exit animations
        </p>
        <Button onClick={() => setShowModal(true)}>
          Open Animated Modal
        </Button>
      </Card>

      {/* Animated Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className={buildAnimationClasses("", showModal ? "modalEntering" : "modalExiting")}>
          <DialogHeader>
            <DialogTitle className={buildAnimationClasses("", "fadeInUp")}>
              Animated Modal
            </DialogTitle>
            <DialogDescription className={buildAnimationClasses("", "fadeInUp")} style={{ animationDelay: '100ms' }}>
              This modal demonstrates smooth enter and exit animations with scale and fade effects.
            </DialogDescription>
          </DialogHeader>
          
          <div className={buildAnimationClasses("space-y-4", "fadeInUp")} style={{ animationDelay: '200ms' }}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                The modal content animates in with a staggered effect, creating a smooth and professional user experience.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Animation State Info */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">Animation State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Is Animating:</span>
            <Badge variant={animationState.isAnimating ? "default" : "outline"} className="ml-2">
              {animationState.isAnimating ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Animation Type:</span>
            <Badge variant="outline" className="ml-2">
              {animationState.animationType}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Reduced Motion:</span>
            <Badge variant={OrderStatusAnimations.prefersReducedMotion() ? "destructive" : "default"} className="ml-2">
              {OrderStatusAnimations.prefersReducedMotion() ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Target Stage:</span>
            <Badge variant="outline" className="ml-2">
              {animationState.targetStage || "None"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AnimationDemo;