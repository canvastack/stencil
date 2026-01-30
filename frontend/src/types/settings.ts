export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  maintenanceMode: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  notificationPreferences: {
    newOrders: boolean;
    newReviews: boolean;
    contactSubmissions: boolean;
    lowStockAlerts: boolean;
    systemUpdates: boolean;
  };
}

export interface SecuritySettings {
  sslEnabled: boolean;
  twoFactorAuth: boolean;
  forcePasswordChange: boolean;
  sessionTimeout: boolean;
  allowedIPs: string[];
}

export interface AnalyticsSettings {
  googleAnalyticsId: string;
  facebookPixelId: string;
}

export interface SMTPSettings {
  host: string;
  port: string;
  encryption: 'tls' | 'ssl';
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface SendGridSettings {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface MailgunSettings {
  domain: string;
  apiKey: string;
  fromEmail: string;
}

export interface EmailServiceSettings {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  smtp?: SMTPSettings;
  sendgrid?: SendGridSettings;
  mailgun?: MailgunSettings;
}

export interface MidtransSettings {
  serverKey: string;
  clientKey: string;
  production: boolean;
}

export interface XenditSettings {
  secretKey: string;
  publicKey: string;
  production: boolean;
}

export interface StripeSettings {
  secretKey: string;
  publicKey: string;
}

export interface PaymentGatewaySettings {
  provider: 'midtrans' | 'xendit' | 'stripe';
  currency: 'IDR' | 'USD' | 'EUR' | 'SGD';
  acceptedMethods: {
    cash: boolean;
    creditCard: boolean;
    eWallet: boolean;
    bankTransfer: boolean;
    qris: boolean;
  };
  midtrans?: MidtransSettings;
  xendit?: XenditSettings;
  stripe?: StripeSettings;
}

export interface WhatsAppSettings {
  businessNumber: string;
  defaultMessage: string;
}

export interface BackupSettings {
  enabled: boolean;
  schedule: string;
  retention: {
    daily: number;
    weekly: number;
  };
  storage: string;
  lastBackup: string;
}

export interface Settings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  analytics: AnalyticsSettings;
  emailService: EmailServiceSettings;
  paymentGateway: PaymentGatewaySettings;
  whatsapp: WhatsAppSettings;
  backup: BackupSettings;
}
