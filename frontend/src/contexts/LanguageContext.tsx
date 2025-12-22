import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface Translation {
  id: string;
  key: string;
  id_text: string;
  en_text: string;
  category?: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translation[];
  updateTranslation: (translation: Translation) => void;
  addTranslation: (translation: Translation) => void;
  deleteTranslation: (id: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultTranslations: Translation[] = [
  // Navigation
  { id: '1', key: 'nav.home', id_text: 'Beranda', en_text: 'Home', category: 'navigation' },
  { id: '2', key: 'nav.products', id_text: 'Produk', en_text: 'Products', category: 'navigation' },
  { id: '3', key: 'nav.about', id_text: 'Tentang', en_text: 'About', category: 'navigation' },
  { id: '4', key: 'nav.contact', id_text: 'Kontak', en_text: 'Contact', category: 'navigation' },
  { id: '5', key: 'nav.faq', id_text: 'FAQ', en_text: 'FAQ', category: 'navigation' },
  
  // Common
  { id: '6', key: 'common.search', id_text: 'Cari', en_text: 'Search', category: 'common' },
  { id: '7', key: 'common.save', id_text: 'Simpan', en_text: 'Save', category: 'common' },
  { id: '8', key: 'common.cancel', id_text: 'Batal', en_text: 'Cancel', category: 'common' },
  { id: '9', key: 'common.delete', id_text: 'Hapus', en_text: 'Delete', category: 'common' },
  { id: '10', key: 'common.edit', id_text: 'Edit', en_text: 'Edit', category: 'common' },
  { id: '11', key: 'common.add', id_text: 'Tambah', en_text: 'Add', category: 'common' },
  { id: '12', key: 'common.loading', id_text: 'Memuat...', en_text: 'Loading...', category: 'common' },
  
  // Cart
  { id: '13', key: 'cart.title', id_text: 'Keranjang Belanja', en_text: 'Shopping Cart', category: 'cart' },
  { id: '14', key: 'cart.empty', id_text: 'Keranjang kosong', en_text: 'Cart is empty', category: 'cart' },
  { id: '15', key: 'cart.add', id_text: 'Tambah ke Keranjang', en_text: 'Add to Cart', category: 'cart' },
  { id: '16', key: 'cart.checkout', id_text: 'Checkout', en_text: 'Checkout', category: 'cart' },
  
  // Product
  { id: '17', key: 'product.details', id_text: 'Detail Produk', en_text: 'Product Details', category: 'product' },
  { id: '18', key: 'product.order', id_text: 'Pesan Sekarang', en_text: 'Order Now', category: 'product' },
];

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'id';
  });
  
  const [translations, setTranslations] = useState<Translation[]>(() => {
    const saved = localStorage.getItem('app-translations');
    return saved ? JSON.parse(saved) : defaultTranslations;
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-translations', JSON.stringify(translations));
  }, [translations]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations.find(t => t.key === key);
    if (!translation) return key;
    return language === 'id' ? translation.id_text : translation.en_text;
  };

  const updateTranslation = (translation: Translation) => {
    setTranslations(prev => 
      prev.map(t => t.id === translation.id ? translation : t)
    );
  };

  const addTranslation = (translation: Translation) => {
    setTranslations(prev => [...prev, translation]);
  };

  const deleteTranslation = (id: string) => {
    setTranslations(prev => prev.filter(t => t.id !== id));
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations,
        updateTranslation,
        addTranslation,
        deleteTranslation,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
