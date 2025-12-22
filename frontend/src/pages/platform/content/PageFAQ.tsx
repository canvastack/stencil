import { useState, useEffect } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  HelpCircle,
  Lightbulb,
  Package,
  ShoppingCart,
  Truck,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformPageFAQ() {
  const { content, loading, updatePageContent } = usePageContent("faq");
  const [formData, setFormData] = useState<any>(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content?.content) {
      setFormData(content.content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      const success = await updatePageContent("faq", formData);
      if (success) {
        toast.success("Platform FAQ page content saved successfully!");
        setHasChanges(false);
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error("An error occurred while saving");
    }
  };

  const handleReset = () => {
    if (content?.content) {
      setFormData(content.content);
      setHasChanges(false);
      toast.success("Changes reset successfully");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Page Content</h1>
          <p className="text-muted-foreground">Manage your FAQ categories and questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="categories">FAQ Categories</TabsTrigger>
          <TabsTrigger value="cta">CTA Section</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main header for FAQ page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.hero?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={3}
                  value={formData.hero?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>FAQ Categories</CardTitle>
                  <CardDescription>Manage categories and their questions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentCategories = formData.categories || [];
                    setFormData({
                      ...formData,
                      categories: [...currentCategories, {
                        id: `category-${Date.now()}`,
                        category: "",
                        icon: "HelpCircle",
                        questions: []
                      }]
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="categories-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="categories-enabled"
                  checked={formData.categories?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      categories: { ...formData.categories, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

          {(formData.categories || []).map((category: any, categoryIndex: number) => (
            <Card key={category.id || categoryIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Category #{categoryIndex + 1}</CardTitle>
                    <CardDescription>Configure category details and questions</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newCategories = [...(formData.categories || [])];
                      newCategories.splice(categoryIndex, 1);
                      setFormData({
                        ...formData,
                        categories: newCategories
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category ID</Label>
                    <Input
                      value={category.id || ""}
                      onChange={(e) => {
                        const newCategories = [...(formData.categories || [])];
                        newCategories[categoryIndex] = { ...category, id: e.target.value };
                        setFormData({
                          ...formData,
                          categories: newCategories
                        });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      value={category.category || ""}
                      onChange={(e) => {
                        const newCategories = [...(formData.categories || [])];
                        newCategories[categoryIndex] = { ...category, category: e.target.value };
                        setFormData({
                          ...formData,
                          categories: newCategories
                        });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Input
                      value={category.icon || ""}
                      onChange={(e) => {
                        const newCategories = [...(formData.categories || [])];
                        newCategories[categoryIndex] = { ...category, icon: e.target.value };
                        setFormData({
                          ...formData,
                          categories: newCategories
                        });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Questions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCategories = [...(formData.categories || [])];
                        const currentQuestions = newCategories[categoryIndex].questions || [];
                        newCategories[categoryIndex] = {
                          ...newCategories[categoryIndex],
                          questions: [...currentQuestions, { q: "", a: "" }]
                        };
                        setFormData({
                          ...formData,
                          categories: newCategories
                        });
                        setHasChanges(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {(category.questions || []).map((question: any, questionIndex: number) => (
                    <Card key={questionIndex} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Question #{questionIndex + 1}</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newCategories = [...(formData.categories || [])];
                              const newQuestions = [...(newCategories[categoryIndex].questions || [])];
                              newQuestions.splice(questionIndex, 1);
                              newCategories[categoryIndex] = {
                                ...newCategories[categoryIndex],
                                questions: newQuestions
                              };
                              setFormData({
                                ...formData,
                                categories: newCategories
                              });
                              setHasChanges(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Input
                            value={question.q || ""}
                            onChange={(e) => {
                              const newCategories = [...(formData.categories || [])];
                              const newQuestions = [...(newCategories[categoryIndex].questions || [])];
                              newQuestions[questionIndex] = { ...question, q: e.target.value };
                              newCategories[categoryIndex] = {
                                ...newCategories[categoryIndex],
                                questions: newQuestions
                              };
                              setFormData({
                                ...formData,
                                categories: newCategories
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer</Label>
                          <Textarea
                            rows={4}
                            value={question.a || ""}
                            onChange={(e) => {
                              const newCategories = [...(formData.categories || [])];
                              const newQuestions = [...(newCategories[categoryIndex].questions || [])];
                              newQuestions[questionIndex] = { ...question, a: e.target.value };
                              newCategories[categoryIndex] = {
                                ...newCategories[categoryIndex],
                                questions: newQuestions
                              };
                              setFormData({
                                ...formData,
                                categories: newCategories
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTA Section</CardTitle>
              <CardDescription>Call-to-action at bottom of FAQ page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="cta-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="cta-enabled"
                  checked={formData.cta?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      cta: { ...formData.cta, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.cta?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: { ...formData.cta, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.cta?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: { ...formData.cta, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>CTA Buttons</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentButtons = formData.cta?.buttons || [];
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          buttons: [...currentButtons, { text: "", link: "", variant: "default" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </div>

                {(formData.cta?.buttons || []).map((button: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Button #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newButtons = [...(formData.cta?.buttons || [])];
                            newButtons.splice(index, 1);
                            setFormData({
                              ...formData,
                              cta: { ...formData.cta, buttons: newButtons }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Text</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => {
                              const newButtons = [...(formData.cta?.buttons || [])];
                              newButtons[index] = { ...button, text: e.target.value };
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, buttons: newButtons }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Link</Label>
                          <Input
                            value={button.link}
                            onChange={(e) => {
                              const newButtons = [...(formData.cta?.buttons || [])];
                              newButtons[index] = { ...button, link: e.target.value };
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, buttons: newButtons }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Variant</Label>
                          <Input
                            value={button.variant}
                            onChange={(e) => {
                              const newButtons = [...(formData.cta?.buttons || [])];
                              newButtons[index] = { ...button, variant: e.target.value };
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, buttons: newButtons }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="seo-enabled">Enable SEO</Label>
                  <p className="text-sm text-muted-foreground">Enable/disable SEO meta tags for this page</p>
                </div>
                <Switch
                  id="seo-enabled"
                  checked={formData.seo?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={formData.seo?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  rows={3}
                  value={formData.seo?.description || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, description: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  value={Array.isArray(formData.seo?.keywords) ? formData.seo.keywords.join(', ') : ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, keywords: e.target.value.split(', ') }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={formData.seo?.ogImage || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, ogImage: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}