import React from 'react';

/**
 * Debug component for testing authentication - only shown in development
 */
export const DebugAuth: React.FC = () => {
  // Disabled - now integrated into DevDebugger
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Component disabled, return early
  return null;
};

export default DebugAuth;