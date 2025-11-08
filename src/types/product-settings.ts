export interface ProductSettings {
  display: {
    productsPerPage: number;
    defaultViewMode: "grid" | "list";
    showRatings: boolean;
    showPrices: boolean;
    enableQuickView: boolean;
    defaultSorting: string;
  };
  catalog: {
    enableBackOrder: boolean;
    minimumOrderQuantity: number;
    maximumOrderQuantity: number;
    lowStockThreshold: number;
    outOfStockBehavior: "hide" | "show-disabled" | "show-backorder";
    priceDisplay: "with-tax" | "without-tax" | "both";
  };
  inquiry: {
    requireLogin: boolean;
    requiredFields: string[];
    additionalFields: Array<{
      name: string;
      label: string;
      type: "text" | "number" | "email" | "tel" | "textarea";
      required: boolean;
    }>;
    notificationEmails: string[];
    autoReplyTemplate: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
    enableCanonicalUrls: boolean;
    productUrlPattern: string;
    generateSitemap: boolean;
  };
}