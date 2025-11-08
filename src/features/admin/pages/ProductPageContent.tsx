import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { productPageContentService } from "@/services/mock/productPageContent";
import { PageContent } from "@/types/page-content";

// Zod schema for form validation
const pageContentSchema = z.object({
  hero: z.object({
    title: z.object({
      prefix: z.string().min(1, "Prefix is required"),
      highlight: z.string().min(1, "Highlight text is required"),
      suffix: z.string().optional(),
    }),
    subtitle: z.string().min(1, "Subtitle is required"),
    typingTexts: z.array(z.string()),
  }),
  informationSection: z.object({
    title: z.object({
      prefix: z.string().min(1, "Prefix is required"),
      highlight: z.string().min(1, "Highlight text is required"),
      suffix: z.string().optional(),
    }),
    subtitle: z.string().min(1, "Subtitle is required"),
    cards: z.array(z.object({
      title: z.string().min(1, "Card title is required"),
      description: z.string().min(1, "Description is required"),
      features: z.array(z.string()),
      icon: z.string(),
      buttonText: z.string().optional(),
    })),
  }),
  ctaSections: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string().min(1, "Section subtitle is required"),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })).optional(),
    buttons: z.array(z.object({
      text: z.string().min(1, "Button text is required"),
      variant: z.enum(["primary", "outline"]),
      icon: z.string().optional(),
    })),
  })),
});

export default function ProductPageContent() {
  const { toast } = useToast();
  const form = useForm<PageContent>({
    resolver: zodResolver(pageContentSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pageContent, setPageContent] = useState<PageContent>({
    hero: {
      title: {
        prefix: "",
        highlight: "",
        suffix: "",
      },
      subtitle: "",
      typingTexts: [],
    },
    informationSection: {
      title: {
        prefix: "",
        highlight: "",
        suffix: "",
      },
      subtitle: "",
      cards: [],
    },
    ctaSections: [],
  });

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const content = await productPageContentService.getContent();
        // Initialize form values in one go to avoid uncontrolled -> controlled warnings
        form.reset(content as any);
        setPageContent(content);
      } catch (error) {
        console.error('Error loading content:', error);
        toast({
          title: "Error",
          description: "Failed to load page content. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [toast, form]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Validate content before saving
      const validatedContent = pageContentSchema.parse(pageContent);
      await productPageContentService.updateContent(validatedContent);
      toast({
        title: "Success",
        description: "Page content has been saved successfully",
      });
      setShowSaveDialog(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please check all required fields and try again.",
          variant: "destructive",
        });
        console.error('Validation errors:', error.errors);
      } else {
        toast({
          title: "Error",
          description: "Failed to save page content. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Page Content Management</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.open('/products', '_blank')}
          >
            Preview Page
          </Button>
          <Button 
            onClick={() => setShowSaveDialog(true)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This will update the product page content immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      <Form {...form}>
        <Tabs defaultValue="hero">
          <TabsList className="mb-4">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="information">Information Section</TabsTrigger>
            <TabsTrigger value="cta">CTA Sections</TabsTrigger>
          </TabsList>

        {/* Hero Section Tab */}
        <TabsContent value="hero">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Hero Section</h2>
            <div className="space-y-6">
              {/* Title Fields */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  name="hero.title.prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Prefix</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Semua" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="hero.title.highlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Highlight</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Produk" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="hero.title.suffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Suffix (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Kami" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Subtitle */}
              <FormField
                name="hero.subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter hero section subtitle"
                        className="h-20"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Typing Texts */}
              <div>
                <FormLabel>Typing Texts</FormLabel>
                <div className="space-y-2">
                  {pageContent.hero.typingTexts?.map((text, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={text}
                        onChange={(e) => {
                          const newTexts = [...(pageContent.hero.typingTexts || [])];
                          newTexts[index] = e.target.value;
                          setPageContent({
                            ...pageContent,
                            hero: {
                              ...pageContent.hero,
                              typingTexts: newTexts,
                            },
                          });
                        }}
                        placeholder={`Typing text ${index + 1}`}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const newTexts = pageContent.hero.typingTexts?.filter(
                            (_, i) => i !== index
                          );
                          setPageContent({
                            ...pageContent,
                            hero: {
                              ...pageContent.hero,
                              typingTexts: newTexts,
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
                      setPageContent({
                        ...pageContent,
                        hero: {
                          ...pageContent.hero,
                          typingTexts: [...(pageContent.hero.typingTexts || []), ""],
                        },
                      });
                    }}
                  >
                    Add Typing Text
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Information Section Tab */}
        <TabsContent value="information">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Information Section</h2>
            {/* Similar structure to Hero section for title and subtitle */}
            {/* Cards Management */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Service Cards</h3>
              <div className="space-y-4">
                {pageContent.informationSection.cards.map((card, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <FormField
                        name={`informationSection.cards.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter card title" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`informationSection.cards.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter card description"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {/* Features */}
                      <div>
                        <FormLabel>Features</FormLabel>
                        <div className="space-y-2">
                          {card.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => {
                                  const newCards = [...pageContent.informationSection.cards];
                                  newCards[index].features[featureIndex] = e.target.value;
                                  setPageContent({
                                    ...pageContent,
                                    informationSection: {
                                      ...pageContent.informationSection,
                                      cards: newCards,
                                    },
                                  });
                                }}
                                placeholder={`Feature ${featureIndex + 1}`}
                              />
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const newCards = [...pageContent.informationSection.cards];
                                  newCards[index].features = card.features.filter(
                                    (_, i) => i !== featureIndex
                                  );
                                  setPageContent({
                                    ...pageContent,
                                    informationSection: {
                                      ...pageContent.informationSection,
                                      cards: newCards,
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
                              const newCards = [...pageContent.informationSection.cards];
                              newCards[index].features.push("");
                              setPageContent({
                                ...pageContent,
                                informationSection: {
                                  ...pageContent.informationSection,
                                  cards: newCards,
                                },
                              });
                            }}
                          >
                            Add Feature
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  onClick={() => {
                    setPageContent({
                      ...pageContent,
                      informationSection: {
                        ...pageContent.informationSection,
                        cards: [
                          ...pageContent.informationSection.cards,
                          {
                            title: "",
                            description: "",
                            features: [],
                            icon: "",
                            buttonText: "",
                          },
                        ],
                      },
                    });
                  }}
                >
                  Add Service Card
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* CTA Sections Tab */}
        <TabsContent value="cta">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">CTA Sections</h2>
            <div className="space-y-6">
              {pageContent.ctaSections.map((section, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <FormField
                      name={`ctaSections.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter section title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`ctaSections.${index}.subtitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Subtitle</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter section subtitle"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Stats */}
                    {section.stats && (
                      <div>
                        <h4 className="text-lg font-medium mb-2">Statistics</h4>
                        <div className="space-y-2">
                          {section.stats.map((stat, statIndex) => (
                            <div key={statIndex} className="flex gap-2">
                              <Input
                                value={stat.value}
                                onChange={(e) => {
                                  const newSections = [...pageContent.ctaSections];
                                  if (newSections[index].stats) {
                                    newSections[index].stats![statIndex].value =
                                      e.target.value;
                                    setPageContent({
                                      ...pageContent,
                                      ctaSections: newSections,
                                    });
                                  }
                                }}
                                placeholder="Stat value"
                                className="flex-1"
                              />
                              <Input
                                value={stat.label}
                                onChange={(e) => {
                                  const newSections = [...pageContent.ctaSections];
                                  if (newSections[index].stats) {
                                    newSections[index].stats![statIndex].label =
                                      e.target.value;
                                    setPageContent({
                                      ...pageContent,
                                      ctaSections: newSections,
                                    });
                                  }
                                }}
                                placeholder="Stat label"
                                className="flex-1"
                              />
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const newSections = [...pageContent.ctaSections];
                                  if (newSections[index].stats) {
                                    newSections[index].stats = section.stats?.filter(
                                      (_, i) => i !== statIndex
                                    );
                                    setPageContent({
                                      ...pageContent,
                                      ctaSections: newSections,
                                    });
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => {
                              const newSections = [...pageContent.ctaSections];
                              if (!newSections[index].stats) {
                                newSections[index].stats = [];
                              }
                              newSections[index].stats?.push({
                                value: "",
                                label: "",
                              });
                              setPageContent({
                                ...pageContent,
                                ctaSections: newSections,
                              });
                            }}
                          >
                            Add Statistic
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div>
                      <h4 className="text-lg font-medium mb-2">Buttons</h4>
                      <div className="space-y-2">
                        {section.buttons.map((button, buttonIndex) => (
                          <div key={buttonIndex} className="flex gap-2 items-center">
                            <Input
                              value={button.text}
                              onChange={(e) => {
                                const newSections = [...pageContent.ctaSections];
                                newSections[index].buttons[buttonIndex].text =
                                  e.target.value;
                                setPageContent({
                                  ...pageContent,
                                  ctaSections: newSections,
                                });
                              }}
                              placeholder="Button text"
                              className="flex-1 min-w-0"
                            />
                            <select
                              value={button.variant}
                              onChange={(e) => {
                                const newSections = [...pageContent.ctaSections];
                                newSections[index].buttons[buttonIndex].variant =
                                  e.target.value as "primary" | "outline";
                                setPageContent({
                                  ...pageContent,
                                  ctaSections: newSections,
                                });
                              }}
                              className="border rounded px-2 w-36"
                            >
                              <option value="primary">Primary</option>
                              <option value="outline">Outline</option>
                            </select>
                            <Input
                              value={button.icon || ""}
                              onChange={(e) => {
                                const newSections = [...pageContent.ctaSections];
                                newSections[index].buttons[buttonIndex].icon =
                                  e.target.value;
                                setPageContent({
                                  ...pageContent,
                                  ctaSections: newSections,
                                });
                              }}
                              placeholder="Icon (optional)"
                              className="w-40"
                            />
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const newSections = [...pageContent.ctaSections];
                                newSections[index].buttons = section.buttons.filter(
                                  (_, i) => i !== buttonIndex
                                );
                                setPageContent({
                                  ...pageContent,
                                  ctaSections: newSections,
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
                            const newSections = [...pageContent.ctaSections];
                            newSections[index].buttons.push({
                              text: "",
                              variant: "primary",
                            });
                            setPageContent({
                              ...pageContent,
                              ctaSections: newSections,
                            });
                          }}
                        >
                          Add Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                onClick={() => {
                  setPageContent({
                    ...pageContent,
                    ctaSections: [
                      ...pageContent.ctaSections,
                      {
                        id: `cta-${pageContent.ctaSections.length + 1}`,
                        title: "",
                        subtitle: "",
                        buttons: [],
                      },
                    ],
                  });
                }}
              >
                Add CTA Section
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </Form>
    </div>
  );
}