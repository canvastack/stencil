import React from 'react';

interface SafeRendererProps {
  children: React.ReactNode;
  fallback?: string;
}

export const SafeRenderer: React.FC<SafeRendererProps> = ({ children, fallback = '' }) => {
  try {
    // Check if children is an object or array
    if (typeof children === 'object' && children !== null && !React.isValidElement(children)) {
      console.warn('SafeRenderer: Attempted to render object as children:', children);
      return <span>{JSON.stringify(children)}</span>;
    }
    
    // Check if children is an array of non-React elements
    if (Array.isArray(children)) {
      const hasInvalidItems = children.some(child => 
        typeof child === 'object' && child !== null && !React.isValidElement(child)
      );
      
      if (hasInvalidItems) {
        console.warn('SafeRenderer: Array contains invalid React children:', children);
        return <span>{children.filter(child => 
          typeof child === 'string' || typeof child === 'number' || React.isValidElement(child)
        )}</span>;
      }
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('SafeRenderer error:', error);
    return <span>{fallback}</span>;
  }
};

export const safeRender = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  
  if (React.isValidElement(value)) {
    return value;
  }
  
  if (typeof value === 'object') {
    console.warn('safeRender: Converting object to string:', value);
    return JSON.stringify(value);
  }
  
  return String(value);
};