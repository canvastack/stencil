import { useState } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, RotateCcw, Plus, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MapPicker from "@/components/admin/MapPicker";

export default function PageContact() {
  const { content, loading } = usePageContent("contact");
  const [formData, setFormData] = useState(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    toast.success("Contact page content saved successfully!");
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
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  placeholder="+62 812-3456-7890"
                  defaultValue={formData.quickContact?.whatsapp}
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
                  defaultValue={formData.quickContact?.whatsappMessage}
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
                  defaultValue={formData.quickContact?.phone}
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
                  defaultValue={formData.quickContact?.email}
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
