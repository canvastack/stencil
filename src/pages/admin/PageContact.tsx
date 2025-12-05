import { useState, useEffect } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, RotateCcw, Plus, Trash2 as Trash, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MapPicker from "@/components/admin/MapPicker";

export default function PageContact() {
  const { content, loading, updatePageContent } = usePageContent("contact");
  const [formData, setFormData] = useState<any>(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content?.content) {
      setFormData(content.content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      const success = await updatePageContent("contact", formData);
      if (success) {
        toast.success("Contact page content saved successfully!");
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
          <h1 className="text-3xl font-bold">Contact Page Content</h1>
          <p className="text-muted-foreground">Manage contact information and form settings</p>
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
          <TabsTrigger value="info">Contact Info</TabsTrigger>
          <TabsTrigger value="form">Form Settings</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="quick">Quick Contact</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="whyChooseUs">Why Choose Us</TabsTrigger>
          <TabsTrigger value="cta">CTA Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Page banner</CardDescription>
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

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="contactInfo-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide contact info on public page</p>
                </div>
                <Switch
                  id="contactInfo-enabled"
                  checked={formData.contactInfo?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Contact Info Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.contactInfo?.items || [];
                      setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          items: [...currentItems, { icon: "MapPin", title: "", content: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Info Item
                  </Button>
                </div>
                {(formData.contactInfo?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Info #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = (formData.contactInfo?.items || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              contactInfo: { ...formData.contactInfo, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Icon Name</Label>
                          <Input
                            placeholder="MapPin, Phone, Mail, Clock"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.contactInfo?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                contactInfo: { ...formData.contactInfo, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Title</Label>
                          <Input
                            placeholder="e.g., Alamat, Telepon, Email"
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.contactInfo?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                contactInfo: { ...formData.contactInfo, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Content</Label>
                          <Textarea
                            rows={2}
                            placeholder="Contact information content"
                            value={item.content}
                            onChange={(e) => {
                              const newItems = [...(formData.contactInfo?.items || [])];
                              newItems[index] = { ...item, content: e.target.value };
                              setFormData({
                                ...formData,
                                contactInfo: { ...formData.contactInfo, items: newItems }
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

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Form Settings</CardTitle>
              <CardDescription>Configure form fields and validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="form-enabled">Enable Contact Form</Label>
                  <p className="text-sm text-muted-foreground">Show/hide contact form on public page</p>
                </div>
                <Switch
                  id="form-enabled"
                  checked={formData.form?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      form: { ...formData.form, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input
                  placeholder="Contact form title"
                  value={formData.form?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      form: { ...formData.form, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Form Subtitle</Label>
                <Textarea
                  rows={2}
                  placeholder="Form subtitle or description"
                  value={formData.form?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      form: { ...formData.form, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Form Fields</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        form: {
                          ...formData.form,
                          fields: [...(formData.form?.fields || []), { name: '', type: 'text', label: '', placeholder: '', required: true }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {(formData.form?.fields || []).map((field: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Field #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newFields = (formData.form?.fields || []).filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              form: { ...formData.form, fields: newFields }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Field Name</Label>
                          <Input
                            placeholder="e.g., name, email, phone"
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...(formData.form?.fields || [])];
                              newFields[index] = { ...field, name: e.target.value };
                              setFormData({
                                ...formData,
                                form: { ...formData.form, fields: newFields }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Field Type</Label>
                          <Input
                            placeholder="text, email, tel, select, textarea"
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...(formData.form?.fields || [])];
                              newFields[index] = { ...field, type: e.target.value };
                              setFormData({
                                ...formData,
                                form: { ...formData.form, fields: newFields }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Label</Label>
                          <Input
                            placeholder="Field label"
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...(formData.form?.fields || [])];
                              newFields[index] = { ...field, label: e.target.value };
                              setFormData({
                                ...formData,
                                form: { ...formData.form, fields: newFields }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Placeholder</Label>
                          <Input
                            placeholder="Placeholder text"
                            value={field.placeholder}
                            onChange={(e) => {
                              const newFields = [...(formData.form?.fields || [])];
                              newFields[index] = { ...field, placeholder: e.target.value };
                              setFormData({
                                ...formData,
                                form: { ...formData.form, fields: newFields }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id={`required-${index}`}
                            checked={field.required !== false}
                            onCheckedChange={(checked) => {
                              const newFields = [...(formData.form?.fields || [])];
                              newFields[index] = { ...field, required: checked };
                              setFormData({
                                ...formData,
                                form: { ...formData.form, fields: newFields }
                              });
                              setHasChanges(true);
                            }}
                          />
                          <Label htmlFor={`required-${index}`} className="text-sm">Required</Label>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <MapPicker
            onLocationSelect={(location) => {
              setFormData({
                ...formData,
                map: {
                  ...formData.map,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  city: location.city,
                  district: location.district,
                  subdistrict: location.subdistrict,
                  village: location.village,
                  municipality: location.municipality,
                  province: location.province,
                  country: location.country,
                  address: location.address,
                }
              });
              setHasChanges(true);
            }}
            initialLocation={formData.map?.latitude && formData.map?.longitude ? {
              lat: formData.map.latitude,
              lng: formData.map.longitude
            } : undefined}
          />
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact Options</CardTitle>
              <CardDescription>Configure quick contact methods for customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Quick Contact Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="quickcontact-enabled"
                  checked={formData.quickContact?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      quickContact: { ...formData.quickContact, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  placeholder="+62 812-3456-7890"
                  value={formData.quickContact?.whatsapp || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      quickContact: { ...formData.quickContact, whatsapp: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Message Template</Label>
                <Textarea
                  placeholder="Hello! I'm interested in your services..."
                  value={formData.quickContact?.whatsappMessage || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      quickContact: { ...formData.quickContact, whatsappMessage: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+62 21-1234-5678"
                  value={formData.quickContact?.phone || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      quickContact: { ...formData.quickContact, phone: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.quickContact?.email || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      quickContact: { ...formData.quickContact, email: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements Section</CardTitle>
              <CardDescription>Display company achievements and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Achievements Section</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Input
                  value={formData.achievements?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      achievements: { ...formData.achievements, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <Label>Achievement Items</Label>
                {(formData.achievements?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Achievement {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newItems = [...(formData.achievements?.items || [])];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              achievements: { ...formData.achievements, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Icon</Label>
                          <Input
                            value={item.icon || ""}
                            placeholder="Users"
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...newItems[index], icon: e.target.value };
                              setFormData({
                                ...formData,
                                achievements: { ...formData.achievements, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Value</Label>
                          <Input
                            value={item.value || ""}
                            placeholder="2000+"
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...newItems[index], value: e.target.value };
                              setFormData({
                                ...formData,
                                achievements: { ...formData.achievements, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={item.label || ""}
                            placeholder="Proyek Selesai"
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...newItems[index], label: e.target.value };
                              setFormData({
                                ...formData,
                                achievements: { ...formData.achievements, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Color Class</Label>
                          <Input
                            value={item.color || ""}
                            placeholder="text-blue-500"
                            onChange={(e) => {
                              const newItems = [...(formData.achievements?.items || [])];
                              newItems[index] = { ...newItems[index], color: e.target.value };
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newItem = {
                      icon: "Users",
                      value: "",
                      label: "",
                      color: "text-primary"
                    };
                    const newItems = [...(formData.achievements?.items || []), newItem];
                    setFormData({
                      ...formData,
                      achievements: { ...formData.achievements, items: newItems }
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Achievement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whyChooseUs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose Us Section</CardTitle>
              <CardDescription>Highlight key benefits and advantages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Why Choose Us Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="whychooseus-enabled"
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
                />
              </div>

              <div className="space-y-4">
                <Label>Benefits</Label>
                {(formData.whyChooseUs?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Benefit {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newItems = [...(formData.whyChooseUs?.items || [])];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={item.title || ""}
                          placeholder="Kualitas Terjamin"
                          onChange={(e) => {
                            const newItems = [...(formData.whyChooseUs?.items || [])];
                            newItems[index] = { ...newItems[index], title: e.target.value };
                            setFormData({
                              ...formData,
                              whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={item.description || ""}
                          placeholder="Semua produk telah melalui quality control ketat..."
                          rows={3}
                          onChange={(e) => {
                            const newItems = [...(formData.whyChooseUs?.items || [])];
                            newItems[index] = { ...newItems[index], description: e.target.value };
                            setFormData({
                              ...formData,
                              whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newItem = {
                      title: "",
                      description: ""
                    };
                    const newItems = [...(formData.whyChooseUs?.items || []), newItem];
                    setFormData({
                      ...formData,
                      whyChooseUs: { ...formData.whyChooseUs, items: newItems }
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CTA Sections</CardTitle>
              <CardDescription>Call-to-action sections with buttons and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable CTA Sections</Label>
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
                <Label>CTA Sections</Label>
                {(Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || []).map((ctaSection: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">CTA Section {index + 1} ({ctaSection.type || 'primary'})</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                            const newItems = [...currentItems];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Type</Label>
                          <Input
                            value={ctaSection.type || ""}
                            placeholder="primary"
                            onChange={(e) => {
                              const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...newItems[index], type: e.target.value };
                              setFormData({
                                ...formData,
                                cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={ctaSection.title || ""}
                            placeholder="Siap Mewujudkan Proyek Anda?"
                            onChange={(e) => {
                              const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                              const newItems = [...currentItems];
                              newItems[index] = { ...newItems[index], title: e.target.value };
                              setFormData({
                                ...formData,
                                cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Subtitle</Label>
                        <Textarea
                          value={ctaSection.subtitle || ""}
                          placeholder="Diskusikan kebutuhan Anda dengan tim kami..."
                          rows={2}
                          onChange={(e) => {
                            const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                            const newItems = [...currentItems];
                            newItems[index] = { ...newItems[index], subtitle: e.target.value };
                            setFormData({
                              ...formData,
                              cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Buttons</Label>
                        {(ctaSection.buttons || []).map((button: any, buttonIndex: number) => (
                          <div key={buttonIndex} className="flex gap-2">
                            <Input
                              placeholder="Button text"
                              value={button.text || ""}
                              onChange={(e) => {
                                const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                                const newItems = [...currentItems];
                                const newButtons = [...(newItems[index].buttons || [])];
                                newButtons[buttonIndex] = { ...newButtons[buttonIndex], text: e.target.value };
                                newItems[index] = { ...newItems[index], buttons: newButtons };
                                setFormData({ 
                                  ...formData, 
                                  cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                                });
                                setHasChanges(true);
                              }}
                            />
                            <Input
                              placeholder="Link"
                              value={button.link || ""}
                              onChange={(e) => {
                                const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                                const newItems = [...currentItems];
                                const newButtons = [...(newItems[index].buttons || [])];
                                newButtons[buttonIndex] = { ...newButtons[buttonIndex], link: e.target.value };
                                newItems[index] = { ...newItems[index], buttons: newButtons };
                                setFormData({ 
                                  ...formData, 
                                  cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                                });
                                setHasChanges(true);
                              }}
                            />
                            <Input
                              placeholder="Variant"
                              value={button.variant || ""}
                              onChange={(e) => {
                                const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                                const newItems = [...currentItems];
                                const newButtons = [...(newItems[index].buttons || [])];
                                newButtons[buttonIndex] = { ...newButtons[buttonIndex], variant: e.target.value };
                                newItems[index] = { ...newItems[index], buttons: newButtons };
                                setFormData({ 
                                  ...formData, 
                                  cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newCTASection = {
                      type: "primary",
                      title: "",
                      subtitle: "",
                      buttons: [
                        { text: "", link: "", variant: "default" }
                      ]
                    };
                    const currentItems = Array.isArray(formData.cta) ? formData.cta : formData.cta?.items || [];
                    const newItems = [...currentItems, newCTASection];
                    setFormData({
                      ...formData,
                      cta: Array.isArray(formData.cta) ? newItems : { ...formData.cta, items: newItems }
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add CTA Section
                </Button>
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
                  maxLength={160}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
