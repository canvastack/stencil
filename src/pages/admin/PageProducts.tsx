import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePageContent } from "@/hooks/usePageContent";

const PageProducts: React.FC = () => {
  const { content, loading, updatePageContent } = usePageContent("products");
  const [formData, setFormData] = useState<any>(content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      console.log('Saving formData:', JSON.stringify(formData, null, 2));
      const success = await updatePageContent("products", formData);
      if (success) {
        toast.success("Products page content saved successfully!");
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
    setFormData(content || {});
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
          <h1 className="text-3xl font-bold">Products Page Content</h1>
          <p className="text-muted-foreground mt-2">Manage your products page content and layout</p>
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

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="information">Information Section</TabsTrigger>
          <TabsTrigger value="cta">CTA Sections</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner at the top of the products page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Components */}
              <div className="space-y-4">
                <Label className="font-medium">Hero Title</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Title Prefix</Label>
                    <Input
                      value={formData.hero?.title?.prefix || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            title: { ...formData.hero?.title, prefix: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Semua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Title Highlight</Label>
                    <Input
                      value={formData.hero?.title?.highlight || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            title: { ...formData.hero?.title, highlight: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Produk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Title Suffix (Optional)</Label>
                    <Input
                      value={formData.hero?.title?.suffix || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            title: { ...formData.hero?.title, suffix: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Berkualitas"
                    />
                  </div>
                </div>
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
                  placeholder="Temukan produk etching berkualitas tinggi..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Section */}
        <TabsContent value="information" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Information Section</CardTitle>
              <CardDescription>Service cards and information below the hero</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Information Title */}
              <div className="space-y-4">
                <Label className="font-medium">Section Title</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Title Prefix</Label>
                    <Input
                      value={formData.informationSection?.title?.prefix || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          informationSection: {
                            ...formData.informationSection,
                            title: { ...formData.informationSection?.title, prefix: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Layanan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Title Highlight</Label>
                    <Input
                      value={formData.informationSection?.title?.highlight || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          informationSection: {
                            ...formData.informationSection,
                            title: { ...formData.informationSection?.title, highlight: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Etching"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Title Suffix</Label>
                    <Input
                      value={formData.informationSection?.title?.suffix || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          informationSection: {
                            ...formData.informationSection,
                            title: { ...formData.informationSection?.title, suffix: e.target.value }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Kami"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.informationSection?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      informationSection: { ...formData.informationSection, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Tiga kategori utama produk etching..."
                />
              </div>

              {/* Service Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Service Cards</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentCards = formData.informationSection?.cards || [];
                      setFormData({
                        ...formData,
                        informationSection: {
                          ...formData.informationSection,
                          cards: [...currentCards, { 
                            title: "", 
                            description: "", 
                            features: [], 
                            icon: "⚙️", 
                            buttonText: "Pelajari Lebih Lanjut" 
                          }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>
                {(formData.informationSection?.cards || []).map((card: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Service Card #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newCards = (formData.informationSection?.cards || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              informationSection: { ...formData.informationSection, cards: newCards }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon (Emoji)</Label>
                          <Input
                            value={card.icon}
                            onChange={(e) => {
                              const newCards = [...(formData.informationSection?.cards || [])];
                              newCards[index] = { ...card, icon: e.target.value };
                              setFormData({
                                ...formData,
                                informationSection: { ...formData.informationSection, cards: newCards }
                              });
                              setHasChanges(true);
                            }}
                            placeholder="⚙️"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            value={card.title}
                            onChange={(e) => {
                              const newCards = [...(formData.informationSection?.cards || [])];
                              newCards[index] = { ...card, title: e.target.value };
                              setFormData({
                                ...formData,
                                informationSection: { ...formData.informationSection, cards: newCards }
                              });
                              setHasChanges(true);
                            }}
                            placeholder="Service title"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Description</Label>
                        <Textarea
                          rows={3}
                          value={card.description}
                          onChange={(e) => {
                            const newCards = [...(formData.informationSection?.cards || [])];
                            newCards[index] = { ...card, description: e.target.value };
                            setFormData({
                              ...formData,
                              informationSection: { ...formData.informationSection, cards: newCards }
                            });
                            setHasChanges(true);
                          }}
                          placeholder="Service description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Button Text</Label>
                        <Input
                          value={card.buttonText}
                          onChange={(e) => {
                            const newCards = [...(formData.informationSection?.cards || [])];
                            newCards[index] = { ...card, buttonText: e.target.value };
                            setFormData({
                              ...formData,
                              informationSection: { ...formData.informationSection, cards: newCards }
                            });
                            setHasChanges(true);
                          }}
                          placeholder="Pelajari Lebih Lanjut"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Features</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newCards = [...(formData.informationSection?.cards || [])];
                              const currentFeatures = newCards[index]?.features || [];
                              newCards[index] = { ...card, features: [...currentFeatures, ""] };
                              setFormData({
                                ...formData,
                                informationSection: { ...formData.informationSection, cards: newCards }
                              });
                              setHasChanges(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {(card.features || []).map((feature: string, featureIndex: number) => (
                          <div key={featureIndex} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => {
                                const newCards = [...(formData.informationSection?.cards || [])];
                                const newFeatures = [...(newCards[index]?.features || [])];
                                newFeatures[featureIndex] = e.target.value;
                                newCards[index] = { ...card, features: newFeatures };
                                setFormData({
                                  ...formData,
                                  informationSection: { ...formData.informationSection, cards: newCards }
                                });
                                setHasChanges(true);
                              }}
                              placeholder="Feature description"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newCards = [...(formData.informationSection?.cards || [])];
                                const newFeatures = (newCards[index]?.features || []).filter((_: string, i: number) => i !== featureIndex);
                                newCards[index] = { ...card, features: newFeatures };
                                setFormData({
                                  ...formData,
                                  informationSection: { ...formData.informationSection, cards: newCards }
                                });
                                setHasChanges(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Sections */}
        <TabsContent value="cta" className="space-y-4">
          {/* Primary CTA Section */}
          <Card>
            <CardHeader>
              <CardTitle>CTA Section 1</CardTitle>
              <CardDescription>Main call-to-action section with stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable/Disable CTA1 */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Enable CTA Section 1</Label>
                  <p className="text-xs text-muted-foreground">Toggle to show or hide this section</p>
                </div>
                <Switch
                  checked={formData.ctaSections?.[0]?.enabled !== false}
                  onCheckedChange={(checked) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[0]) {
                      ctaArray[0] = { id: 'cta-1' };
                    }
                    ctaArray[0] = { ...ctaArray[0], enabled: checked };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.ctaSections?.[0]?.title || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[0]) ctaArray[0] = { id: 'cta-1' };
                    ctaArray[0] = { ...ctaArray[0], title: e.target.value };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                  placeholder="CTA title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.ctaSections?.[0]?.subtitle || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[0]) ctaArray[0] = { id: 'cta-1' };
                    ctaArray[0] = { ...ctaArray[0], subtitle: e.target.value };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                  placeholder="CTA subtitle"
                />
              </div>
              
              {/* Stats Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Statistics</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                      if (!ctaArray[0]) ctaArray[0] = { id: 'cta-1' };
                      const currentStats = ctaArray[0]?.stats || [];
                      ctaArray[0] = { ...ctaArray[0], stats: [...currentStats, { value: "", label: "" }] };
                      setFormData({
                        ...formData,
                        ctaSections: ctaArray
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary CTA Section */}
          <Card>
            <CardHeader>
              <CardTitle>CTA Section 2</CardTitle>
              <CardDescription>Secondary call-to-action section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable/Disable CTA2 */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Enable CTA Section 2</Label>
                  <p className="text-xs text-muted-foreground">Toggle to show or hide this section</p>
                </div>
                <Switch
                  checked={formData.ctaSections?.[1]?.enabled !== false}
                  onCheckedChange={(checked) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[1]) {
                      ctaArray[1] = { id: 'cta-2' };
                    }
                    ctaArray[1] = { ...ctaArray[1], enabled: checked };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.ctaSections?.[1]?.title || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[1]) ctaArray[1] = { id: 'cta-2' };
                    ctaArray[1] = { ...ctaArray[1], title: e.target.value };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                  placeholder="CTA title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.ctaSections?.[1]?.subtitle || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.ctaSections) ? [...formData.ctaSections] : [];
                    if (!ctaArray[1]) ctaArray[1] = { id: 'cta-2' };
                    ctaArray[1] = { ...ctaArray[1], subtitle: e.target.value };
                    setFormData({
                      ...formData,
                      ctaSections: ctaArray
                    });
                    setHasChanges(true);
                  }}
                  placeholder="CTA subtitle"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageProducts;