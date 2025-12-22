// PageHomeFixed.tsx - Fixed version with proper item/stat variable usage
// We'll rename this to PageHome.tsx after verifying it works

import { useState, useEffect } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PageHome() {
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
        toast.success("Home page content saved successfully!");
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
          <TabsTrigger value="socialProof">Social Proof</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="whyChooseUs">Why Choose Us</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="cta">CTA Sections</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ... other tab content ... */}

        <TabsContent value="socialProof" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Proof Section</CardTitle>
              <CardDescription>Display achievements and trust indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... other content ... */}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Statistics</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentStats = formData.socialProof?.stats || [];
                      setFormData({
                        ...formData,
                        socialProof: {
                          ...formData.socialProof,
                          stats: [...currentStats, { 
                            icon: "Users", 
                            value: "", 
                            label: "", 
                            color: "text-blue-500" 
                          }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Statistic
                  </Button>
                </div>
                {(formData.socialProof?.stats || []).map((item: any, index: number) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Label>Icon</Label>
                        <Input
                          className="flex-1"
                          value={item.icon}
                          placeholder="Users, Target, Award"
                          onChange={(e) => {
                            const updatedStats = [...(formData.socialProof?.stats || [])];
                            updatedStats[index] = { ...item, icon: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: {
                                ...(formData.socialProof || {}),
                                stats: updatedStats,
                              },
                            });
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label>Value</Label>
                        <Input
                          className="flex-1"
                          placeholder="2000+, 99%"
                          value={item.value}
                          onChange={(e) => {
                            const updatedStats = [...(formData.socialProof?.stats || [])];
                            updatedStats[index] = { ...item, value: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { 
                                ...formData.socialProof, 
                                stats: updatedStats 
                              }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label>Label</Label>
                        <Input
                          className="flex-1"
                          placeholder="Happy Customers"
                          value={item.label}
                          onChange={(e) => {
                            const updatedStats = [...(formData.socialProof?.stats || [])];
                            updatedStats[index] = { ...item, label: e.target.value };
                            setFormData({
                              ...formData,
                              socialProof: { 
                                ...formData.socialProof, 
                                stats: updatedStats 
                              }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label>Color</Label>
                        <Select
                          value={item.color}
                          onValueChange={(value) => {
                            const updatedStats = [...(formData.socialProof?.stats || [])];
                            updatedStats[index] = { ...item, color: value };
                            setFormData({
                              ...formData,
                              socialProof: { 
                                ...formData.socialProof, 
                                stats: updatedStats 
                              }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-blue-500">Blue</SelectItem>
                            <SelectItem value="text-green-500">Green</SelectItem>
                            <SelectItem value="text-red-500">Red</SelectItem>
                            <SelectItem value="text-purple-500">Purple</SelectItem>
                            <SelectItem value="text-yellow-500">Yellow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const updatedStats = [...(formData.socialProof?.stats || [])];
                          updatedStats.splice(index, 1);
                          setFormData({
                            ...formData,
                            socialProof: { 
                              ...formData.socialProof, 
                              stats: updatedStats 
                            }
                          });
                          setHasChanges(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </CardFooter>
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
                  <Card key={index} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Label>Icon</Label>
                        <Input
                          className="flex-1"
                          value={item.icon}
                          placeholder="Users, Target, Award"
                          onChange={(e) => {
                            const updatedItems = [...(formData.achievements?.items || [])];
                            updatedItems[index] = { ...item, icon: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: {
                                ...(formData.achievements || {}),
                                items: updatedItems,
                              },
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label>Value</Label>
                        <Input
                          className="flex-1"
                          placeholder="2000+, 99%"
                          value={item.value}
                          onChange={(e) => {
                            const updatedItems = [...(formData.achievements?.items || [])];
                            updatedItems[index] = { ...item, value: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { 
                                ...formData.achievements, 
                                items: updatedItems 
                              }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label>Label</Label>
                        <Input
                          className="flex-1"
                          placeholder="Happy Customers"
                          value={item.label}
                          onChange={(e) => {
                            const updatedItems = [...(formData.achievements?.items || [])];
                            updatedItems[index] = { ...item, label: e.target.value };
                            setFormData({
                              ...formData,
                              achievements: { 
                                ...formData.achievements, 
                                items: updatedItems 
                              }
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label>Color</Label>
                        <Select
                          value={item.color}
                          onValueChange={(value) => {
                            const updatedItems = [...(formData.achievements?.items || [])];
                            updatedItems[index] = { ...item, color: value };
                            setFormData({
                              ...formData,
                              achievements: { 
                                ...formData.achievements, 
                                items: updatedItems 
                              }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-blue-500">Blue</SelectItem>
                            <SelectItem value="text-green-500">Green</SelectItem>
                            <SelectItem value="text-red-500">Red</SelectItem>
                            <SelectItem value="text-purple-500">Purple</SelectItem>
                            <SelectItem value="text-yellow-500">Yellow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const updatedItems = [...(formData.achievements?.items || [])];
                          updatedItems.splice(index, 1);
                          setFormData({
                            ...formData,
                            achievements: { 
                              ...formData.achievements, 
                              items: updatedItems 
                            }
                          });
                          setHasChanges(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... other tab content ... */}

      </Tabs>
    </div>
  );
}