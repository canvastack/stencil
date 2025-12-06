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
  Save,
  Building,
  Calendar,
  MapPin,
  Lightbulb,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformPageAbout() {
  const { content, loading, updatePageContent } = usePageContent("about");
  const [formData, setFormData] = useState<any>(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content?.content) {
      setFormData(content.content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      const success = await updatePageContent("about", formData);
      if (success) {
        toast.success("Platform about page content saved successfully!");
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
          <h1 className="text-3xl font-bold">About Page Content</h1>
          <p className="text-muted-foreground">Manage your about page content and sections</p>
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
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="mission">Mission</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main hero banner for about page</CardDescription>
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
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.hero?.image || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, image: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                  <Button size="sm" variant="outline">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Basic company information and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="company-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="company-enabled"
                  checked={formData.company?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      company: { ...formData.company, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.company?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      company: { ...formData.company, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Description</Label>
                <Textarea
                  rows={4}
                  value={formData.company?.description || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      company: { ...formData.company, description: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Founded Year</Label>
                  <Input
                    value={formData.company?.founded || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, founded: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.company?.location || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, location: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employees</Label>
                  <Input
                    value={formData.company?.employees || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, employees: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clients</Label>
                  <Input
                    value={formData.company?.clients || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, clients: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission & Vision</CardTitle>
              <CardDescription>Company mission and vision statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="mission-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="mission-enabled"
                  checked={formData.mission?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      mission: { ...formData.mission, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.mission?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mission: { ...formData.mission, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Mission & Vision Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.mission?.items || [];
                      setFormData({
                        ...formData,
                        mission: {
                          ...formData.mission,
                          items: [...currentItems, { icon: "Target", title: "", description: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {(formData.mission?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Item #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = [...(formData.mission?.items || [])];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              mission: { ...formData.mission, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Input
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...(formData.mission?.items || [])];
                              newItems[index] = { ...item, icon: e.target.value };
                              setFormData({
                                ...formData,
                                mission: { ...formData.mission, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.mission?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                mission: { ...formData.mission, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                          <Label>Description</Label>
                          <Textarea
                            rows={3}
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.mission?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                mission: { ...formData.mission, items: newItems }
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

        <TabsContent value="values" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Values</CardTitle>
              <CardDescription>Core values and principles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="values-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="values-enabled"
                  checked={formData.values?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      values: { ...formData.values, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.values?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      values: { ...formData.values, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Value Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.values?.items || [];
                      setFormData({
                        ...formData,
                        values: {
                          ...formData.values,
                          items: [...currentItems, ""]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Value
                  </Button>
                </div>
                {(formData.values?.items || []).map((item: string, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Value #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = [...(formData.values?.items || [])];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              values: { ...formData.values, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Value Description</Label>
                        <Textarea
                          rows={3}
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(formData.values?.items || [])];
                            newItems[index] = e.target.value;
                            setFormData({
                              ...formData,
                              values: { ...formData.values, items: newItems }
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

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Professional team members and leadership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="team-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="team-enabled"
                  checked={formData.team?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      team: { ...formData.team, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.team?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      team: { ...formData.team, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Section Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.team?.subtitle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      team: { ...formData.team, subtitle: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Team Members</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentMembers = formData.team?.members || [];
                      setFormData({
                        ...formData,
                        team: {
                          ...formData.team,
                          members: [...currentMembers, { name: "", role: "", image: "", bio: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
                {(formData.team?.members || []).map((member: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Member #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newMembers = [...(formData.team?.members || [])];
                            newMembers.splice(index, 1);
                            setFormData({
                              ...formData,
                              team: { ...formData.team, members: newMembers }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const newMembers = [...(formData.team?.members || [])];
                              newMembers[index] = { ...member, name: e.target.value };
                              setFormData({
                                ...formData,
                                team: { ...formData.team, members: newMembers }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input
                            value={member.role}
                            onChange={(e) => {
                              const newMembers = [...(formData.team?.members || [])];
                              newMembers[index] = { ...member, role: e.target.value };
                              setFormData({
                                ...formData,
                                team: { ...formData.team, members: newMembers }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Profile Image</Label>
                          <div className="flex gap-2">
                            <Input
                              value={member.image}
                              onChange={(e) => {
                                const newMembers = [...(formData.team?.members || [])];
                                newMembers[index] = { ...member, image: e.target.value };
                                setFormData({
                                  ...formData,
                                  team: { ...formData.team, members: newMembers }
                                });
                                setHasChanges(true);
                              }}
                            />
                            <Button size="sm" variant="outline">
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Bio</Label>
                          <Textarea
                            rows={2}
                            placeholder="Short bio..."
                            value={member.bio}
                            onChange={(e) => {
                              const newMembers = [...(formData.team?.members || [])];
                              newMembers[index] = { ...member, bio: e.target.value };
                              setFormData({
                                ...formData,
                                team: { ...formData.team, members: newMembers }
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

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Timeline</CardTitle>
              <CardDescription>Key milestones and company history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="timeline-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="timeline-enabled"
                  checked={formData.timeline?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      timeline: { ...formData.timeline, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.timeline?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      timeline: { ...formData.timeline, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Timeline Events</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentEvents = formData.timeline?.events || [];
                      setFormData({
                        ...formData,
                        timeline: {
                          ...formData.timeline,
                          events: [...currentEvents, { year: "", title: "", description: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
                {(formData.timeline?.events || []).map((event: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Event #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newEvents = [...(formData.timeline?.events || [])];
                            newEvents.splice(index, 1);
                            setFormData({
                              ...formData,
                              timeline: { ...formData.timeline, events: newEvents }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input
                            value={event.year}
                            onChange={(e) => {
                              const newEvents = [...(formData.timeline?.events || [])];
                              newEvents[index] = { ...event, year: e.target.value };
                              setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, events: newEvents }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Title</Label>
                          <Input
                            value={event.title}
                            onChange={(e) => {
                              const newEvents = [...(formData.timeline?.events || [])];
                              newEvents[index] = { ...event, title: e.target.value };
                              setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, events: newEvents }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            rows={3}
                            value={event.description}
                            onChange={(e) => {
                              const newEvents = [...(formData.timeline?.events || [])];
                              newEvents[index] = { ...event, description: e.target.value };
                              setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, events: newEvents }
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

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certifications & Awards</CardTitle>
              <CardDescription>Professional certifications and company awards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="certifications-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="certifications-enabled"
                  checked={formData.certifications?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      certifications: { ...formData.certifications, enabled: checked }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.certifications?.title || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      certifications: { ...formData.certifications, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Certification Items</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentItems = formData.certifications?.items || [];
                      setFormData({
                        ...formData,
                        certifications: {
                          ...formData.certifications,
                          items: [...currentItems, { title: "", issuer: "", year: "", image: "", link: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certificate
                  </Button>
                </div>
                {(formData.certifications?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Certificate #{index + 1}</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newItems = [...(formData.certifications?.items || [])];
                            newItems.splice(index, 1);
                            setFormData({
                              ...formData,
                              certifications: { ...formData.certifications, items: newItems }
                            });
                            setHasChanges(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Certificate Title</Label>
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, title: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Issuing Organization</Label>
                          <Input
                            value={item.issuer}
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, issuer: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input
                            value={item.year}
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, year: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Certificate Image</Label>
                          <div className="flex gap-2">
                            <Input
                              value={item.image}
                              onChange={(e) => {
                                const newItems = [...(formData.certifications?.items || [])];
                                newItems[index] = { ...item, image: e.target.value };
                                setFormData({
                                  ...formData,
                                  certifications: { ...formData.certifications, items: newItems }
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
                          <Label>Verification Link</Label>
                          <Input
                            value={item.link}
                            placeholder="https://..."
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, link: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
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
              <CardTitle>Call to Action Section</CardTitle>
              <CardDescription>Encourage visitors to take action</CardDescription>
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
                <Label>CTA Title</Label>
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
                <Label>CTA Description</Label>
                <Textarea
                  rows={3}
                  value={formData.cta?.description || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      cta: { ...formData.cta, description: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Button Text</Label>
                  <Input
                    value={formData.cta?.primaryButton?.text || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primaryButton: { ...formData.cta?.primaryButton, text: e.target.value }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Button Link</Label>
                  <Input
                    value={formData.cta?.primaryButton?.link || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          primaryButton: { ...formData.cta?.primaryButton, link: e.target.value }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Text</Label>
                  <Input
                    value={formData.cta?.secondaryButton?.text || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          secondaryButton: { ...formData.cta?.secondaryButton, text: e.target.value }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button Link</Label>
                  <Input
                    value={formData.cta?.secondaryButton?.link || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        cta: {
                          ...formData.cta,
                          secondaryButton: { ...formData.cta?.secondaryButton, link: e.target.value }
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
      </Tabs>
    </div>
  );
}