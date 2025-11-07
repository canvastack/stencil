import { useState } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, RotateCcw, Plus, Trash, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function PageFAQ() {
  const { content, loading } = usePageContent("faq");
  const [formData, setFormData] = useState(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    toast.success("FAQ page content saved successfully!");
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(content?.content || {});
    setHasChanges(false);
    toast.info("Changes reset");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Page Content</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
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
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="categories">Categories & Questions</TabsTrigger>
          <TabsTrigger value="cta">Call to Action</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  defaultValue={formData.hero?.title}
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
                  defaultValue={formData.hero?.subtitle}
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
          {formData.categories?.map((category: any, catIndex: number) => (
            <Card key={catIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.items?.length || 0} questions</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newCategories = formData.categories.filter((_: any, i: number) => i !== catIndex);
                      setFormData({ ...formData, categories: newCategories });
                      setHasChanges(true);
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    defaultValue={category.name}
                    onChange={(e) => {
                      const newCategories = [...formData.categories];
                      newCategories[catIndex].name = e.target.value;
                      setFormData({ ...formData, categories: newCategories });
                      setHasChanges(true);
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Questions & Answers</Label>
                  {category.items?.map((item: any, qIndex: number) => (
                    <Card key={qIndex} className="bg-muted/30">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newCategories = [...formData.categories];
                              newCategories[catIndex].items = category.items.filter((_: any, i: number) => i !== qIndex);
                              setFormData({ ...formData, categories: newCategories });
                              setHasChanges(true);
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Question</Label>
                          <Input
                            placeholder="Enter question..."
                            defaultValue={item.question}
                            onChange={(e) => {
                              const newCategories = [...formData.categories];
                              newCategories[catIndex].items[qIndex].question = e.target.value;
                              setFormData({ ...formData, categories: newCategories });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer</Label>
                          <Textarea
                            rows={3}
                            placeholder="Enter answer..."
                            defaultValue={item.answer}
                            onChange={(e) => {
                              const newCategories = [...formData.categories];
                              newCategories[catIndex].items[qIndex].answer = e.target.value;
                              setFormData({ ...formData, categories: newCategories });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const newCategories = [...formData.categories];
                      newCategories[catIndex].items = [
                        ...(category.items || []),
                        { question: '', answer: '' }
                      ];
                      setFormData({ ...formData, categories: newCategories });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setFormData({
                ...formData,
                categories: [
                  ...(formData.categories || []),
                  { id: `cat-${Date.now()}`, name: 'New Category', icon: 'HelpCircle', items: [] }
                ]
              });
              setHasChanges(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call to Action Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CTA Title</Label>
                <Input
                  defaultValue={formData.cta?.title}
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
                <Label>CTA Subtitle</Label>
                <Textarea
                  defaultValue={formData.cta?.subtitle}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: { ...formData.cta, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  maxLength={60}
                  defaultValue={formData.seo?.title}
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
                  maxLength={160}
                  defaultValue={formData.seo?.description}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, description: e.target.value }
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
