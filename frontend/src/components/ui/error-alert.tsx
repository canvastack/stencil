/**
 * ErrorAlert Component
 * 
 * Displays error messages with appropriate styling and icons.
 * Supports different error types (validation, network, server).
 */

import { AlertCircle, WifiOff, ServerCrash, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/errorHandling';

interface ErrorAlertProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ error, onRetry, onDismiss, className }: ErrorAlertProps) {
  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'timeout':
        return <Clock className="h-4 w-4" />;
      case 'server':
        return <ServerCrash className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case 'validation':
        return 'Validation Error';
      case 'network':
        return 'Connection Error';
      case 'timeout':
        return 'Request Timeout';
      case 'server':
        return 'Server Error';
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Permission Denied';
      case 'not_found':
        return 'Not Found';
      default:
        return 'Error';
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      {getIcon()}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{error.message}</p>
          
          {error.errors && Object.keys(error.errors).length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(error.errors).map(([field, messages]) => (
                <li key={field}>
                  <strong>{field.replace(/_/g, ' ')}:</strong>{' '}
                  {Array.isArray(messages) ? messages[0] : messages}
                </li>
              ))}
            </ul>
          )}
          
          <div className="flex gap-2 mt-3">
            {error.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="bg-background hover:bg-background/80"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-destructive-foreground hover:text-destructive-foreground/80"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * ValidationErrorSummary Component
 * 
 * Displays a summary of validation errors at the top of the form
 */
interface ValidationErrorSummaryProps {
  errors: Record<string, string[]>;
  className?: string;
}

export function ValidationErrorSummary({ errors, className }: ValidationErrorSummaryProps) {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {errorCount} {errorCount === 1 ? 'Error' : 'Errors'} Found
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">Please correct the following errors:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {Object.entries(errors).map(([field, messages]) => (
            <li key={field}>
              <strong>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>{' '}
              {Array.isArray(messages) ? messages[0] : messages}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
