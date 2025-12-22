import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, {
      icon: '✅',
      duration: 3000,
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return sonnerToast.error(message, {
      icon: '❌',
      duration: 5000,
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return sonnerToast.info(message, {
      icon: 'ℹ️',
      duration: 3000,
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, {
      icon: '⚠️',
      duration: 4000,
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return sonnerToast.loading(message, options);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) => {
    return sonnerToast.promise(promise, messages, options);
  },
};
