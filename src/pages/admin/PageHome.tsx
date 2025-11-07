import { useState, useEffect } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Eye, RotateCcw, Plus, X, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PageHome() {
  const { content, loading } = usePageContent("home");
  const [formData, setFormData] = useState(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content?.content) {
      setFormData(content.content);
    }
  }, [content]);

  const handleSave = () => {
    // Here you would save to Supabase
    toast.success("Home page content saved successfully!");
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
          <h1 className="text-3xl font-bold">Home Page Content</h1>
          <p className="text-muted-foreground">Manage your home page content and layout</p>
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
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="cta">CTA Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

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
                        placeholder={`Text ${index + 1}`}
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
                  placeholder="Hero subtitle..."
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Carousel Background Images</Label>
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
                            images: [...currentImages, ""]
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
                <div className="space-y-2">
                  {(formData.hero?.carousel?.images || [""]).map((image: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Image URL"
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
                      />
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics Section</CardTitle>
              <CardDescription>Display key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.stats?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.stats?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Stat Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.stats?.items || [];
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          items: [...currentItems, { icon: "Users", value: "", label: "", color: "blue" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stat
                  </Button>
                </div>
                {(formData.stats?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Stat #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.stats?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              stats: { ...formData.stats, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="Users, Target, Award"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.stats?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                stats: { ...formData.stats, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Value</Label>
                          <Input
                            placeholder="2000+, 99%"
                            value={item.value}
                            onChange={(e) => {
                              const newItems = [...(formData.stats?.items || [])];
                              newItems[index] = { ...item, value: e.target.value };
                              setFormData({
                                ...formData,
                                stats: { ...formData.stats, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Label</Label>
                          <Input
                            placeholder="Proyek Selesai"
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...(formData.stats?.items || [])];
                              newItems[index] = { ...item, label: e.target.value };
                              setFormData({
                                ...formData,
                                stats: { ...formData.stats, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Color</Label>
                          <Input
                            placeholder="blue, green, purple"
                            value={item.color}
                            onChange={(e) => {
                              const newItems = [...(formData.stats?.items || [])];
                              newItems[index] = { ...item, color: e.target.value };
                              setFormData({
                                ...formData,
                                stats: { ...formData.stats, items: newItems }
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

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements Section</CardTitle>
              <CardDescription>Certifications and awards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          items: [...currentItems, { icon: "Shield", title: "", description: "", color: "blue" }]
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
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="Shield, Award, Medal"
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
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="Achievement title"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                achievements: { ...formData.achievements, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            rows={2}
                            placeholder="Achievement description"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                achievements: { ...formData.achievements, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Color Theme</Label>
                          <Input
                            placeholder="blue, purple, green"
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
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benefits Section</CardTitle>
              <CardDescription>Why customers should choose your service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.benefits?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      benefits: { ...formData.benefits, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.benefits?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      benefits: { ...formData.benefits, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Benefit Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.benefits?.items || [];
                      setFormData({
                        ...formData,
                        benefits: {
                          ...formData.benefits,
                          items: [...currentItems, { icon: "Zap", title: "", description: "", color: "orange" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
                {(formData.benefits?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Benefit #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.benefits?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              benefits: { ...formData.benefits, items: newItems }
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
                            placeholder="Zap, Layers, Palette"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.benefits?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                benefits: { ...formData.benefits, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="Benefit title"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.benefits?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                benefits: { ...formData.benefits, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Textarea
                            rows={3}
                            placeholder="Benefit description"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.benefits?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                benefits: { ...formData.benefits, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Color Theme</Label>
                          <Input
                            placeholder="orange, blue, purple"
                            value={item.color}
                            onChange={(e) => {
                              const newItems = [...(formData.benefits?.items || [])];
                              newItems[index] = { ...item, color: e.target.value };
                              setFormData({
                                ...formData,
                                benefits: { ...formData.benefits, items: newItems }
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

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Section</CardTitle>
              <CardDescription>How your service works - step by step</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          steps: [...currentSteps, { icon: "MessageSquare", title: "", description: "" }]
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
                            setFormData({
                              ...formData,
                              process: { ...formData.process, steps: newSteps }
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
                            placeholder="MessageSquare, Zap, ClipboardCheck"
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
                            placeholder="Step description"
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

        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials Section</CardTitle>
              <CardDescription>Customer reviews and feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          items: [...currentItems, { name: "", role: "", company: "", content: "", rating: 5, avatar: "" }]
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
                          <Label className="text-sm">Role/Position</Label>
                          <Input
                            placeholder="e.g., CEO"
                            value={item.role}
                            onChange={(e) => {
                              const newItems = [...(formData.testimonials?.items || [])];
                              newItems[index] = { ...item, role: e.target.value };
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
                          <Label className="text-sm">Rating (1-5)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="5"
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
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Avatar URL</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Avatar image URL"
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
                            <Button size="sm" variant="outline">
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Testimonial Content</Label>
                          <Textarea
                            rows={3}
                            placeholder="Customer testimonial..."
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
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Primary CTA Section</CardTitle>
              <CardDescription>Main call-to-action banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.cta?.primary?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: {
                        ...formData.cta,
                        primary: { ...formData.cta?.primary, title: e.target.value }
                      }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.cta?.primary?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: {
                        ...formData.cta,
                        primary: { ...formData.cta?.primary, subtitle: e.target.value }
                      }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button 1 Text</Label>
                  <Input
                    value={formData.cta?.primary?.buttons?.[0]?.text || ""}
                    onChange={(e) => {
                      const buttons = formData.cta?.primary?.buttons || [{}, {}];
                      buttons[0] = { ...buttons[0], text: e.target.value };
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primary: { ...formData.cta?.primary, buttons }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button 1 Link</Label>
                  <Input
                    value={formData.cta?.primary?.buttons?.[0]?.link || ""}
                    onChange={(e) => {
                      const buttons = formData.cta?.primary?.buttons || [{}, {}];
                      buttons[0] = { ...buttons[0], link: e.target.value };
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primary: { ...formData.cta?.primary, buttons }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button 2 Text</Label>
                  <Input
                    value={formData.cta?.primary?.buttons?.[1]?.text || ""}
                    onChange={(e) => {
                      const buttons = formData.cta?.primary?.buttons || [{}, {}];
                      buttons[1] = { ...buttons[1], text: e.target.value };
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primary: { ...formData.cta?.primary, buttons }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button 2 Link</Label>
                  <Input
                    value={formData.cta?.primary?.buttons?.[1]?.link || ""}
                    onChange={(e) => {
                      const buttons = formData.cta?.primary?.buttons || [{}, {}];
                      buttons[1] = { ...buttons[1], link: e.target.value };
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primary: { ...formData.cta?.primary, buttons }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary CTA Section</CardTitle>
              <CardDescription>Additional call-to-action section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.cta?.secondary?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: {
                        ...formData.cta,
                        secondary: { ...formData.cta?.secondary, title: e.target.value }
                      }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.cta?.secondary?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: {
                        ...formData.cta,
                        secondary: { ...formData.cta?.secondary, subtitle: e.target.value }
                      }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input
                    value={formData.cta?.secondary?.button?.text || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          secondary: {
                            ...formData.cta?.secondary,
                            button: { ...formData.cta?.secondary?.button, text: e.target.value }
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input
                    value={formData.cta?.secondary?.button?.link || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          secondary: {
                            ...formData.cta?.secondary,
                            button: { ...formData.cta?.secondary?.button, link: e.target.value }
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your page for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  placeholder="SEO Title (max 60 characters)"
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
                  placeholder="SEO Description (max 160 characters)"
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
