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

        {/* Process Section */}
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

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.process?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      process: { ...formData.process, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Simple steps to get started with our platform"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Process Steps</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentSteps = formData.process?.steps || [];
                      setFormData({
                        ...formData,
                        process: {
                          ...formData.process,
                          steps: [...currentSteps, { number: currentSteps.length + 1, icon: "User", title: "", description: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>
                {(formData.process?.steps || []).map((step: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Step #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newSteps = (formData.process?.steps || []).filter((_: any, i: number) => i !== index);
                            // Re-number remaining steps
                            const renumberedSteps = newSteps.map((s: any, i: number) => ({ ...s, number: i + 1 }));
                            setFormData({
                              ...formData,
                              process: { ...formData.process, steps: renumberedSteps }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Step Number</Label>
                          <Input
                            type="number"
                            placeholder={`${index + 1}`}
                            value={step.number || index + 1}
                            onChange={(e) => {
                              const newSteps = [...(formData.process?.steps || [])];
                              newSteps[index] = { ...step, number: parseInt(e.target.value) || index + 1 };
                              setFormData({
                                ...formData,
                                process: { ...formData.process, steps: newSteps }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="User, Settings, Check, etc"
                            value={step.icon}
                            onChange={(e) => {
                              const newSteps = [...(formData.process?.steps || [])];
                              newSteps[index] = { ...step, icon: e.target.value };
                              setFormData({
                                ...formData,
                                process: { ...formData.process, steps: newSteps }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="Step title"
                            value={step.title}
                            onChange={(e) => {
                              const newSteps = [...(formData.process?.steps || [])];
                              newSteps[index] = { ...step, title: e.target.value };
                              setFormData({
                                ...formData,
                                process: { ...formData.process, steps: newSteps }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            rows={2}
                            placeholder="Describe this step"
                            value={step.description}
                            onChange={(e) => {
                              const newSteps = [...(formData.process?.steps || [])];
                              newSteps[index] = { ...step, description: e.target.value };
                              setFormData({
                                ...formData,
                                process: { ...formData.process, steps: newSteps }
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

        {/* Why Choose Us Section */}
        <TabsContent value="whyChooseUs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose Us Section</CardTitle>
              <CardDescription>Highlight your platform's competitive advantages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="whyChooseUs-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="whyChooseUs-enabled"
                  checked={formData.whyChooseUs?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      whyChooseUs: { ...formData.whyChooseUs, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.whyChooseUs?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      whyChooseUs: { ...formData.whyChooseUs, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Why Choose Our Platform"
                />
              </div>

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.whyChooseUs?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      whyChooseUs: { ...formData.whyChooseUs, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="What makes our multi-tenant platform different"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Advantage Points</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.whyChooseUs?.items || [];
                      setFormData({
                        ...formData,
                        whyChooseUs: {
                          ...formData.whyChooseUs,
                          items: [...currentItems, { icon: "Shield", title: "", description: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Advantage
                  </Button>
                </div>
                {(formData.whyChooseUs?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Advantage #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.whyChooseUs?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="Shield, Award, Zap, Users, etc"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.whyChooseUs?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="Advantage title"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.whyChooseUs?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            rows={2}
                            placeholder="Describe this advantage"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.whyChooseUs?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                whyChooseUs: { ...formData.whyChooseUs, items: newItems }
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

        {/* Achievements Section */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements Section</CardTitle>
              <CardDescription>Showcase platform milestones and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="achievements-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="achievements-enabled"
                  checked={formData.achievements?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      achievements: { ...formData.achievements, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.achievements?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      achievements: { ...formData.achievements, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Platform Achievements"
                />
              </div>

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.achievements?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      achievements: { ...formData.achievements, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Numbers that speak for our success"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Achievement Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.achievements?.items || [];
                      setFormData({
                        ...formData,
                        achievements: {
                          ...formData.achievements,
                          items: [...currentItems, { icon: "Award", value: "", label: "", color: "text-yellow-500" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Achievement
                  </Button>
                </div>
                {(formData.achievements?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Achievement #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.achievements?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Icon name (Award, Trophy, Target)"
                          value={item.icon}
                          onChange={(e) => {
                            const newItems = [...(formData.achievements?.items || [])];
                            newItems[index] = { ...item, icon: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Color class (text-yellow-500)"
                          value={item.color}
                          onChange={(e) => {
                            const newItems = [...(formData.achievements?.items || [])];
                            newItems[index] = { ...item, color: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Value (5+ Years)"
                          value={item.value}
                          onChange={(e) => {
                            const newItems = [...(formData.achievements?.items || [])];
                            newItems[index] = { ...item, value: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Label (Experience)"
                          value={item.label}
                          onChange={(e) => {
                            const newItems = [...(formData.achievements?.items || [])];
                            newItems[index] = { ...item, label: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
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

        {/* Services Section */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Services Section</CardTitle>
              <CardDescription>Showcase platform features and services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="services-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="services-enabled"
                  checked={formData.services?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      services: { ...formData.services, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.services?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      services: { ...formData.services, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Platform Services"
                />
              </div>

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.services?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      services: { ...formData.services, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Comprehensive solutions for your business needs"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Service Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.services?.items || [];
                      setFormData({
                        ...formData,
                        services: {
                          ...formData.services,
                          items: [...currentItems, { icon: "Package", title: "", description: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
                {(formData.services?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Service #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.services?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              services: { ...formData.services, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="Package, Globe, Shield, Users, etc"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.services?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                services: { ...formData.services, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="Service title"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.services?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                services: { ...formData.services, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            rows={2}
                            placeholder="Service description"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.services?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                services: { ...formData.services, items: newItems }
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

        {/* Testimonials Section */}
        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials Section</CardTitle>
              <CardDescription>Customer testimonials and reviews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="testimonials-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="testimonials-enabled"
                  checked={formData.testimonials?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      testimonials: { ...formData.testimonials, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.testimonials?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      testimonials: { ...formData.testimonials, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="What Our Customers Say"
                />
              </div>

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.testimonials?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      testimonials: { ...formData.testimonials, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Real feedback from real customers"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Testimonial Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.testimonials?.items || [];
                      setFormData({
                        ...formData,
                        testimonials: {
                          ...formData.testimonials,
                          items: [...currentItems, { name: "", position: "", company: "", content: "", rating: 5, avatar: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Testimonial
                  </Button>
                </div>
                {(formData.testimonials?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Testimonial #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.testimonials?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              testimonials: { ...formData.testimonials, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Name</Label>
                          <Input
                            placeholder="Customer name"
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...(formData.testimonials?.items || [])];
                              newItems[index] = { ...item, name: e.target.value };
                              setFormData({
                                ...formData,
                                testimonials: { ...formData.testimonials, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Position</Label>
                          <Input
                            placeholder="Job title"
                            value={item.position}
                            onChange={(e) => {
                              const newItems = [...(formData.testimonials?.items || [])];
                              newItems[index] = { ...item, position: e.target.value };
                              setFormData({
                                ...formData,
                                testimonials: { ...formData.testimonials, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Company</Label>
                          <Input
                            placeholder="Company name"
                            value={item.company}
                            onChange={(e) => {
                              const newItems = [...(formData.testimonials?.items || [])];
                              newItems[index] = { ...item, company: e.target.value };
                              setFormData({
                                ...formData,
                                testimonials: { ...formData.testimonials, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Rating</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            placeholder="5"
                            value={item.rating}
                            onChange={(e) => {
                              const newItems = [...(formData.testimonials?.items || [])];
                              newItems[index] = { ...item, rating: parseInt(e.target.value) || 5 };
                              setFormData({
                                ...formData,
                                testimonials: { ...formData.testimonials, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Avatar URL</Label>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          value={item.avatar}
                          onChange={(e) => {
                            const newItems = [...(formData.testimonials?.items || [])];
                            newItems[index] = { ...item, avatar: e.target.value };
                            setFormData({
                              ...formData,
                              testimonials: { ...formData.testimonials, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Testimonial Content</Label>
                        <Textarea
                          rows={3}
                          placeholder="Customer feedback..."
                          value={item.content}
                          onChange={(e) => {
                            const newItems = [...(formData.testimonials?.items || [])];
                            newItems[index] = { ...item, content: e.target.value };
                            setFormData({
                              ...formData,
                              testimonials: { ...formData.testimonials, items: newItems }
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

        {/* CTA Section */}
        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTA Sections</CardTitle>
              <CardDescription>Call-to-action sections throughout the page</CardDescription>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>CTA Blocks</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentBlocks = formData.cta?.blocks || [];
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          blocks: [...currentBlocks, { 
                            title: "", 
                            subtitle: "", 
                            buttonText: "", 
                            buttonLink: "", 
                            backgroundColor: "bg-blue-600",
                            position: "middle" 
                          }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add CTA Block
                  </Button>
                </div>
                {(formData.cta?.blocks || []).map((block: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">CTA Block #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newBlocks = (formData.cta?.blocks || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              cta: { ...formData.cta, blocks: newBlocks }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="CTA title"
                            value={block.title}
                            onChange={(e) => {
                              const newBlocks = [...(formData.cta?.blocks || [])];
                              newBlocks[index] = { ...block, title: e.target.value };
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, blocks: newBlocks }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Subtitle</Label>
                          <Textarea
                            rows={2}
                            placeholder="CTA description"
                            value={block.subtitle}
                            onChange={(e) => {
                              const newBlocks = [...(formData.cta?.blocks || [])];
                              newBlocks[index] = { ...block, subtitle: e.target.value };
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, blocks: newBlocks }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Button Text</Label>
                            <Input
                              placeholder="Get Started"
                              value={block.buttonText}
                              onChange={(e) => {
                                const newBlocks = [...(formData.cta?.blocks || [])];
                                newBlocks[index] = { ...block, buttonText: e.target.value };
                                setFormData({
                                  ...formData,
                                  cta: { ...formData.cta, blocks: newBlocks }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Button Link</Label>
                            <Input
                              placeholder="/contact"
                              value={block.buttonLink}
                              onChange={(e) => {
                                const newBlocks = [...(formData.cta?.blocks || [])];
                                newBlocks[index] = { ...block, buttonLink: e.target.value };
                                setFormData({
                                  ...formData,
                                  cta: { ...formData.cta, blocks: newBlocks }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Background Color</Label>
                            <Input
                              placeholder="bg-blue-600"
                              value={block.backgroundColor}
                              onChange={(e) => {
                                const newBlocks = [...(formData.cta?.blocks || [])];
                                newBlocks[index] = { ...block, backgroundColor: e.target.value };
                                setFormData({
                                  ...formData,
                                  cta: { ...formData.cta, blocks: newBlocks }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Position</Label>
                            <Input
                              placeholder="middle, end"
                              value={block.position}
                              onChange={(e) => {
                                const newBlocks = [...(formData.cta?.blocks || [])];
                                newBlocks[index] = { ...block, position: e.target.value };
                                setFormData({
                                  ...formData,
                                  cta: { ...formData.cta, blocks: newBlocks }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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