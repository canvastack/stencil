import React, { useState, useEffect } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Award,
  Target,
  Plus,
  X,
  Upload,
  Trash2,
  Star,
  ExternalLink,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformPageHome() {
  const { content, loading, updatePageContent } = usePageContent("home");
  const [formData, setFormData] = useState<any>(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content?.content) {
      setFormData(content.content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      const success = await updatePageContent("home", formData);
      if (success) {
        toast.success("Platform home page content saved successfully!");
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
          <h1 className="text-3xl font-bold">Platform Home Page Content</h1>
          <p className="text-muted-foreground">Manage platform marketing homepage content and layout</p>
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
          <TabsTrigger value="socialProof">Social Proof</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="whyChooseUs">Why Choose Us</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="cta">CTA Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner with typing effect and carousel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Typing Texts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Typing Texts</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentTexts = formData.hero?.title?.typing || [];
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          title: {
                            ...formData.hero?.title,
                            typing: [...currentTexts, ""]
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                </div>
                <div className="space-y-2">
                  {(formData.hero?.title?.typing || [""]).map((text: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Platform feature ${index + 1}`}
                        value={text}
                        onChange={(e) => {
                          const newTyping = [...(formData.hero?.title?.typing || [])];
                          newTyping[index] = e.target.value;
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              title: {
                                ...formData.hero?.title,
                                typing: newTyping
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newTyping = (formData.hero?.title?.typing || []).filter((_: string, i: number) => i !== index);
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              title: {
                                ...formData.hero?.title,
                                typing: newTyping
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  placeholder="Platform description that will appear below the typing text..."
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

              {/* Carousel Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Carousel Background Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Recommended size: 1920x1080px. Images will be cropped to 16:9 ratio.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentImages = formData.hero?.carousel?.images || [];
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          carousel: {
                            ...formData.hero?.carousel,
                            images: ["", ...currentImages]
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.hero?.carousel?.images || [""]).map((image: string, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        {image ? (
                          <img
                            src={image.startsWith('blob:') ? image : import.meta.env.BASE_URL + image.replace(/^\//, '')}
                            alt={`Carousel Image ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' font-size='24' text-anchor='middle' alignment-baseline='middle' font-family='system-ui, sans-serif' fill='%23666666'%3EImage not found%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex gap-2 items-start">
                          <Input
                            placeholder="Enter image URL"
                            value={image}
                            onChange={(e) => {
                              const newImages = [...(formData.hero?.carousel?.images || [])];
                              newImages[index] = e.target.value;
                              setFormData({
                                ...formData,
                                hero: {
                                  ...formData.hero,
                                  carousel: {
                                    ...formData.hero?.carousel,
                                    images: newImages
                                  }
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`image-upload-${index}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fileName = `platform-hero-${Date.now()}-${file.name}`;
                                const imagePath = `/images/platform/hero/${fileName}`;
                                
                                const newImages = [...(formData.hero?.carousel?.images || [])];
                                newImages[index] = imagePath;
                                setFormData({
                                  ...formData,
                                  hero: {
                                    ...formData.hero,
                                    carousel: {
                                      ...formData.hero?.carousel,
                                      images: newImages
                                    }
                                  }
                                });
                                setHasChanges(true);
                                toast.success('Image added successfully');
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const newImages = (formData.hero?.carousel?.images || []).filter((_: string, i: number) => i !== index);
                              setFormData({
                                ...formData,
                                hero: {
                                  ...formData.hero,
                                  carousel: {
                                    ...formData.hero?.carousel,
                                    images: newImages
                                  }
                                }
                              });
                              setHasChanges(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Carousel Settings */}
              <div className="space-y-4">
                <Label>Carousel Settings</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="show-pause">Show Pause Button</Label>
                    <p className="text-sm text-muted-foreground">Display play/pause button on carousel</p>
                  </div>
                  <Switch
                    id="show-pause"
                    checked={formData.hero?.carousel?.showPauseButton !== false}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          carousel: {
                            ...formData.hero?.carousel,
                            showPauseButton: checked
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auto-play Interval (ms)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.hero?.carousel?.autoPlayInterval || 5000}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          carousel: {
                            ...formData.hero?.carousel,
                            autoPlayInterval: parseInt(e.target.value) || 5000
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <Label>Call-to-Action Buttons</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Primary Button Text</Label>
                    <Input
                      value={formData.hero?.buttons?.primary?.text || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            buttons: {
                              ...formData.hero?.buttons,
                              primary: { ...formData.hero?.buttons?.primary, text: e.target.value }
                            }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Get Started Free"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Primary Button Link</Label>
                    <Input
                      value={formData.hero?.buttons?.primary?.link || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            buttons: {
                              ...formData.hero?.buttons,
                              primary: { ...formData.hero?.buttons?.primary, link: e.target.value }
                            }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="/register"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Secondary Button Text</Label>
                    <Input
                      value={formData.hero?.buttons?.secondary?.text || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            buttons: {
                              ...formData.hero?.buttons,
                              secondary: { ...formData.hero?.buttons?.secondary, text: e.target.value }
                            }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="Watch Demo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Secondary Button Link</Label>
                    <Input
                      value={formData.hero?.buttons?.secondary?.link || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            buttons: {
                              ...formData.hero?.buttons,
                              secondary: { ...formData.hero?.buttons?.secondary, link: e.target.value }
                            }
                          }
                        });
                        setHasChanges(true);
                      }}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Proof Section */}
        <TabsContent value="socialProof" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Proof Section</CardTitle>
              <CardDescription>Display key performance indicators and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="socialProof-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="socialProof-enabled"
                  checked={formData.socialProof?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      socialProof: { ...formData.socialProof, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.socialProof?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      socialProof: { ...formData.socialProof, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Trusted by Thousands of Businesses"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.socialProof?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      socialProof: { ...formData.socialProof, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Join the growing community of businesses succeeding with our platform"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Stat Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentStats = formData.socialProof?.stats || [];
                      setFormData({
                        ...formData,
                        socialProof: {
                          ...formData.socialProof,
                          stats: [...currentStats, { icon: "Users", value: "", label: "", color: "text-blue-500" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stat
                  </Button>
                </div>
                {(formData.socialProof?.stats || []).map((stat: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Stat #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newStats = (formData.socialProof?.stats || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              socialProof: { ...formData.socialProof, stats: newStats }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Icon name (Users, Target, Award)"
                          value={stat.icon}
                          onChange={(e) => {
                            const newStats = [...(formData.socialProof?.stats || [])];
                            newStats[index] = { ...stat, icon: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { ...formData.socialProof, stats: newStats }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Color class (text-blue-500)"
                          value={stat.color}
                          onChange={(e) => {
                            const newStats = [...(formData.socialProof?.stats || [])];
                            newStats[index] = { ...stat, color: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { ...formData.socialProof, stats: newStats }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Value (10,000+)"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...(formData.socialProof?.stats || [])];
                            newStats[index] = { ...stat, value: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { ...formData.socialProof, stats: newStats }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Label (Active Users)"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...(formData.socialProof?.stats || [])];
                            newStats[index] = { ...stat, label: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { ...formData.socialProof, stats: newStats }
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
        </TabsContent>

        {/* All other sections would follow the same pattern with Enable/Disable toggles */}
        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Section</CardTitle>
              <CardDescription>How the platform works - step by step process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="process-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="process-enabled"
                  checked={formData.process?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      process: { ...formData.process, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              
              {/* Process content would continue here following the same pattern */}
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.process?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      process: { ...formData.process, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="How It Works"
                />
              </div>
              {/* More process fields would be added here */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder sections for other tabs */}
        {["whyChooseUs", "achievements", "services", "testimonials", "cta"].map((section) => (
          <TabsContent key={section} value={section} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{section.charAt(0).toUpperCase() + section.slice(1)} Section</CardTitle>
                <CardDescription>Configure {section} content and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor={`${section}-enabled`}>Enable Section</Label>
                    <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                  </div>
                  <Switch
                    id={`${section}-enabled`}
                    checked={formData[section]?.enabled !== false}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        [section]: { ...formData[section], enabled: checked }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={formData[section]?.title || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        [section]: { ...formData[section], title: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                    placeholder={`${section} section title`}
                  />
                </div>
                
                {/* Additional fields would be implemented based on section requirements */}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* SEO Section */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization for homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={formData.seo?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Multi-Tenant Platform | CanvaStencil"
                />
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.seo?.description || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, description: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Build powerful multi-tenant websites with our comprehensive platform."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  value={formData.seo?.keywords || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, keywords: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="multi-tenant, website builder, platform"
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
                  placeholder="/images/og-home.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}