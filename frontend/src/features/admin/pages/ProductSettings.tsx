import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

interface ProductSettings {
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

import { productSettingsService } from "@/services/api/productSettings";

export default function ProductSettings() {
  const { toast } = useToast();
  const form = useForm<ProductSettings>();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ProductSettings>({
    display: {
      productsPerPage: 12,
      defaultViewMode: "grid",
      showRatings: true,
      showPrices: true,
      enableQuickView: true,
      defaultSorting: "name-asc",
    },
    catalog: {
      enableBackOrder: false,
      minimumOrderQuantity: 1,
      maximumOrderQuantity: 999,
      lowStockThreshold: 5,
      outOfStockBehavior: "show-disabled",
      priceDisplay: "with-tax",
    },
    inquiry: {
      requireLogin: true,
      requiredFields: ["name", "email", "phone"],
      additionalFields: [],
      notificationEmails: [],
      autoReplyTemplate: "",
    },
    seo: {
      defaultTitle: "",
      defaultDescription: "",
      defaultKeywords: [],
      enableCanonicalUrls: true,
      productUrlPattern: "/products/[slug]",
      generateSitemap: true,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await productSettingsService.getSettings();
        setSettings(data);
        // Initialize the react-hook-form values in one go to avoid
        // uncontrolled -> controlled warnings and ensure nested values are set.
        form.reset(data as any);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load product settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [form, toast]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Read latest values from the form and merge additionalFields from local state
      const formValues = form.getValues() as ProductSettings;
      const merged: ProductSettings = {
        ...formValues,
        inquiry: {
          ...(formValues.inquiry || {}),
          additionalFields: settings.inquiry.additionalFields,
        },
      };
      await productSettingsService.updateSettings(merged);
      // keep local state in sync
      setSettings(merged);
      toast({
        title: "Success",
        description: "Product settings have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save product settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Settings</h1>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Form {...form}>
        <Tabs defaultValue="display">
          <TabsList className="mb-4">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="inquiry">Inquiry Form</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
            <div className="space-y-6">
              <FormField
                name="display.productsPerPage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Products Per Page</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of products to display per page
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                name="display.defaultViewMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default View Mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select view mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                name="display.showRatings"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Show Product Ratings</FormLabel>
                      <FormDescription>
                        Display rating stars for products
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Add more display settings */}
            </div>
          </Card>
        </TabsContent>

        {/* Catalog Settings */}
        <TabsContent value="catalog">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Catalog Settings</h2>
            <div className="space-y-6">
              <FormField
                name="catalog.enableBackOrder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Back Orders</FormLabel>
                      <FormDescription>
                        Allow customers to order out-of-stock products
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="catalog.lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Show low stock warning when stock reaches this level
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* Add more catalog settings */}
            </div>
          </Card>
        </TabsContent>

        {/* Inquiry Form Settings */}
        <TabsContent value="inquiry">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Inquiry Form Settings</h2>
            <div className="space-y-6">
              <FormField
                name="inquiry.requireLogin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Require Login</FormLabel>
                      <FormDescription>
                        Require users to log in before submitting inquiries
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Additional Fields Management */}
              <div>
                <h3 className="text-lg font-medium mb-2">Additional Fields</h3>
                {settings.inquiry.additionalFields.map((field, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...settings.inquiry.additionalFields];
                        newFields[index].label = e.target.value;
                        setSettings({
                          ...settings,
                          inquiry: {
                            ...settings.inquiry,
                            additionalFields: newFields,
                          },
                        });
                      }}
                      placeholder="Field Label"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value: any) => {
                        const newFields = [...settings.inquiry.additionalFields];
                        newFields[index].type = value;
                        setSettings({
                          ...settings,
                          inquiry: {
                            ...settings.inquiry,
                            additionalFields: newFields,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Field Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const newFields = settings.inquiry.additionalFields.filter(
                          (_, i) => i !== index
                        );
                        setSettings({
                          ...settings,
                          inquiry: {
                            ...settings.inquiry,
                            additionalFields: newFields,
                          },
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      inquiry: {
                        ...settings.inquiry,
                        additionalFields: [
                          ...settings.inquiry.additionalFields,
                          {
                            name: "",
                            label: "",
                            type: "text",
                            required: false,
                          },
                        ],
                      },
                    });
                  }}
                >
                  Add Field
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
            <div className="space-y-6">
              <FormField
                name="seo.defaultTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Product Title Template</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., [Product Name] | Your Store" />
                    </FormControl>
                    <FormDescription>
                      Template for product page titles. Use [Product Name] as a placeholder
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                name="seo.productUrlPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL Pattern</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., /products/[slug]" />
                    </FormControl>
                    <FormDescription>
                      URL pattern for product pages. Use [slug] as a placeholder
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                name="seo.enableCanonicalUrls"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Canonical URLs</FormLabel>
                      <FormDescription>
                        Add canonical URL tags to product pages
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </Form>
    </div>
  );
}