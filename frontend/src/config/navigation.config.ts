export interface NavigationItem {
  name: string;
  path: string;
}

export interface FooterSection {
  title: string;
  links: {
    name: string;
    path: string;
  }[];
}

export interface HeaderStyles {
  background?: string;
  text?: string;
  hover?: string;
  active?: string;
}

export interface HeaderContent {
  navigation: NavigationItem[];
  loginPath: string;
  cartPath: string;
  brandName: string;
  brandInitials: string;
  loginText: string;
  cartText: string;
  styles: {
    default: HeaderStyles;
    transparent: HeaderStyles;
  };
}

export interface FooterContent {
  sections: FooterSection[];
  bottomText: string;
  socialLinks: {
    platform: string;
    url: string;
    icon: string;
  }[];
  copyrightText: string;
}

const navigationData: NavigationItem[] = [
  { name: "Beranda", path: "/" },
  { name: "Tentang Kami", path: "/about" },
  { name: "Produk", path: "/products" },
  { name: "FAQ", path: "/faq" },
  { name: "Kontak", path: "/contact" },
];

const footerSections: FooterSection[] = [
  {
    title: "Produk",
    links: [
      { name: "Semua Produk", path: "/products" },
      { name: "Kategori", path: "/products/categories" },
      { name: "Custom Order", path: "/custom-order" },
    ]
  },
  {
    title: "Perusahaan",
    links: [
      { name: "Tentang Kami", path: "/about" },
      { name: "Kontak", path: "/contact" },
      { name: "FAQ", path: "/faq" },
    ]
  },

];

const headerContent: HeaderContent = {
  navigation: navigationData,
  loginPath: "/login",
  cartPath: "/cart",
  brandName: "Etching Xenial",
  brandInitials: "CEX",
  loginText: "Login",
  cartText: "Keranjang",
  styles: {
    default: {
      background: "bg-background/80 backdrop-blur-lg border-b border-white/10 shadow-lg",
      text: "text-foreground/80",
      hover: "hover:text-foreground hover:bg-muted",
      active: "bg-primary text-white"
    },
    transparent: {
      background: "bg-transparent",
      text: "text-white/90",
      hover: "hover:text-white hover:bg-white/10",
      active: "bg-primary text-white"
    }
  }
};

const footerContent: FooterContent = {
  sections: footerSections,
  bottomText: "Solusi etching profesional untuk kebutuhan industri dan dekorasi",
  socialLinks: [
    { platform: "Facebook", url: "https://facebook.com", icon: "facebook" },
    { platform: "Instagram", url: "https://instagram.com", icon: "instagram" },
    { platform: "Twitter", url: "https://twitter.com", icon: "twitter" }
  ],
  copyrightText: "© 2025 Etching Xenial. All rights reserved."
};

export { headerContent, footerContent };