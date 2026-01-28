import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enOrders from './locales/en/orders.json';
import enProducts from './locales/en/products.json';
import enCustomers from './locales/en/customers.json';
import enVendors from './locales/en/vendors.json';

import idCommon from './locales/id/common.json';
import idNavigation from './locales/id/navigation.json';
import idOrders from './locales/id/orders.json';
import idProducts from './locales/id/products.json';
import idCustomers from './locales/id/customers.json';
import idVendors from './locales/id/vendors.json';

import zhCommon from './locales/zh/common.json';
import zhNavigation from './locales/zh/navigation.json';
import zhOrders from './locales/zh/orders.json';
import zhProducts from './locales/zh/products.json';
import zhCustomers from './locales/zh/customers.json';
import zhVendors from './locales/zh/vendors.json';

import jaCommon from './locales/ja/common.json';
import jaNavigation from './locales/ja/navigation.json';
import jaOrders from './locales/ja/orders.json';
import jaProducts from './locales/ja/products.json';
import jaCustomers from './locales/ja/customers.json';
import jaVendors from './locales/ja/vendors.json';

// Define resources
const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    orders: enOrders,
    products: enProducts,
    customers: enCustomers,
    vendors: enVendors,
  },
  id: {
    common: idCommon,
    navigation: idNavigation,
    orders: idOrders,
    products: idProducts,
    customers: idCustomers,
    vendors: idVendors,
  },
  zh: {
    common: zhCommon,
    navigation: zhNavigation,
    orders: zhOrders,
    products: zhProducts,
    customers: zhCustomers,
    vendors: zhVendors,
  },
  ja: {
    common: jaCommon,
    navigation: jaNavigation,
    orders: jaOrders,
    products: jaProducts,
    customers: jaCustomers,
    vendors: jaVendors,
  },
};

// Language configuration
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'id', 'zh', 'ja'],
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'navigation', 'orders', 'products', 'customers', 'vendors'],
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'canvastencil-language',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },
    
    // Backend configuration for dynamic loading
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
    
    // React configuration
    react: {
      useSuspense: false, // Disable suspense for better error handling
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },
    
    // Development configuration
    debug: process.env.NODE_ENV === 'development',
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${lng}.${ns}.${key}`);
      }
    },
  });

// Export language utilities
export const getCurrentLanguage = () => i18n.language;
export const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
export const getSupportedLanguages = () => supportedLanguages;

// Format currency based on locale
export const formatCurrencyByLocale = (amount: number, currency = 'USD') => {
  const locale = getCurrentLanguage();
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    id: 'id-ID',
    zh: 'zh-CN',
    ja: 'ja-JP',
  };
  
  const currencyMap: Record<string, string> = {
    en: 'USD',
    id: 'IDR',
    zh: 'CNY',
    ja: 'JPY',
  };
  
  return new Intl.NumberFormat(localeMap[locale] || 'en-US', {
    style: 'currency',
    currency: currencyMap[locale] || currency,
  }).format(amount);
};

// Format date based on locale
export const formatDateByLocale = (date: Date | string) => {
  const locale = getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    id: 'id-ID',
    zh: 'zh-CN',
    ja: 'ja-JP',
  };
  
  return new Intl.DateTimeFormat(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

// Format number based on locale
export const formatNumberByLocale = (number: number) => {
  const locale = getCurrentLanguage();
  
  const localeMap: Record<string, string> = {
    en: 'en-US',
    id: 'id-ID',
    zh: 'zh-CN',
    ja: 'ja-JP',
  };
  
  return new Intl.NumberFormat(localeMap[locale] || 'en-US').format(number);
};

export default i18n;