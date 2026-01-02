export interface HeaderConfig {
  uuid: string;
  brand_name: string;
  brand_initials: string | null;
  brand_tagline: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  logo_width: number | null;
  logo_height: number | null;
  logo_alt_text: string | null;
  use_logo: boolean;
  header_style: 'default' | 'minimal' | 'centered';
  show_cart: boolean;
  show_search: boolean;
  show_login: boolean;
  sticky_header: boolean;
  transparent_on_scroll: boolean;
  styling_options: StylingOptions | null;
  login_button_text: string | null;
  cart_button_text: string | null;
  search_placeholder: string | null;
  is_active: boolean;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface StylingOptions {
  backgroundColor?: string;
  textColor?: string;
  activeColor?: string;
  hoverColor?: string;
}

export interface Menu {
  uuid: string;
  parent_uuid: string | null;
  label: string;
  path: string | null;
  icon: string | null;
  description: string | null;
  target: '_self' | '_blank' | '_parent' | '_top';
  is_external: boolean;
  requires_auth: boolean;
  is_active: boolean;
  is_visible: boolean;
  show_in_header: boolean;
  show_in_footer: boolean;
  show_in_mobile: boolean;
  sort_order: number;
  custom_class: string | null;
  badge_text: string | null;
  badge_color: string | null;
  allowed_roles: string[] | null;
  click_count: number;
  created_at: string;
  updated_at: string;
  children?: Menu[];
  parent?: {
    uuid: string;
    label: string;
    path: string | null;
  } | null;
}

export interface FooterConfig {
  uuid: string;
  footer_sections: FooterSection[] | null;
  contact_address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_working_hours: string | null;
  social_links: SocialLink[] | null;
  show_newsletter: boolean;
  newsletter_title: string | null;
  newsletter_subtitle: string | null;
  newsletter_button_text: string | null;
  newsletter_api_endpoint: string | null;
  about_text: string | null;
  copyright_text: string | null;
  bottom_text: string | null;
  show_social_links: boolean;
  show_contact_info: boolean;
  show_sections: boolean;
  footer_style: 'default' | 'minimal' | 'modern' | 'compact';
  background_color: string | null;
  text_color: string | null;
  legal_links: LegalLink[] | null;
  is_active: boolean;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
  sort_order: number;
}

export interface FooterLink {
  label: string;
  path: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface LegalLink {
  label: string;
  path: string;
}

export interface HeaderConfigInput {
  brand_name: string;
  brand_initials?: string;
  brand_tagline?: string;
  logo_url?: string;
  logo_dark_url?: string;
  logo_width?: number;
  logo_height?: number;
  logo_alt_text?: string;
  use_logo?: boolean;
  header_style?: 'default' | 'minimal' | 'centered';
  show_cart?: boolean;
  show_search?: boolean;
  show_login?: boolean;
  sticky_header?: boolean;
  transparent_on_scroll?: boolean;
  styling_options?: StylingOptions;
  login_button_text?: string;
  cart_button_text?: string;
  search_placeholder?: string;
  is_active?: boolean;
  notes?: string;
}

export interface MenuInput {
  parent_uuid?: string | null;
  label: string;
  path?: string;
  icon?: string;
  description?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  is_external?: boolean;
  requires_auth?: boolean;
  is_active?: boolean;
  is_visible?: boolean;
  show_in_header?: boolean;
  show_in_footer?: boolean;
  show_in_mobile?: boolean;
  sort_order?: number;
  custom_class?: string;
  badge_text?: string;
  badge_color?: string;
  allowed_roles?: string[];
  notes?: string;
}

export interface FooterConfigInput {
  footer_sections?: FooterSection[];
  contact_address?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_working_hours?: string;
  social_links?: SocialLink[];
  show_newsletter?: boolean;
  newsletter_title?: string;
  newsletter_subtitle?: string;
  newsletter_button_text?: string;
  newsletter_api_endpoint?: string;
  about_text?: string;
  copyright_text?: string;
  bottom_text?: string;
  show_social_links?: boolean;
  show_contact_info?: boolean;
  show_sections?: boolean;
  footer_style?: 'default' | 'minimal' | 'modern' | 'compact';
  background_color?: string;
  text_color?: string;
  legal_links?: LegalLink[];
  is_active?: boolean;
  notes?: string;
}

export interface MenuReorderInput {
  uuid: string;
  sort_order: number;
}

export interface MenusQueryParams {
  location?: 'header' | 'footer' | 'mobile' | 'all';
  status?: 'active' | 'inactive' | 'all';
  parent_uuid?: string | null;
  sort?: 'order' | 'name' | 'created_at';
  include_children?: 'true' | 'false';
}

export interface MenusResponse {
  success: boolean;
  data: Menu[];
  meta: {
    total: number;
    active_count: number;
    inactive_count: number;
  };
  message: string;
}

export interface SingleMenuResponse {
  success: boolean;
  data: Menu;
  message: string;
}

export interface HeaderConfigResponse {
  success: boolean;
  data: HeaderConfig;
  message: string;
}

export interface FooterConfigResponse {
  success: boolean;
  data: FooterConfig;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}
