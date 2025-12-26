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

export default function PageAbout() {
  const { content, loading, updatePageContent } = usePageContent("about");
  const [formData, setFormData] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    console.log('PageAbout: Content loaded:', content);
    if (content && Object.keys(content).length > 0) {
      console.log('PageAbout: Setting formData with content:', content);
      setFormData(content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      const success = await updatePageContent("about", formData);
      if (success) {
        toast.success("About page content saved successfully!");
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
    if (content) {
      setFormData(content);
      setHasChanges(false);
      toast.success("Changes reset successfully");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content || Object.keys(formData).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">No content found</p>
          <p className="text-muted-foreground">Please ensure the about page content is seeded in the database.</p>
        </div>
      </div>
    );
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
                  value={typeof formData.hero?.title === 'string' 
                    ? formData.hero.title 
                    : (formData.hero?.title?.prefix && formData.hero?.title?.highlight 
                      ? `${formData.hero.title.prefix} ${formData.hero.title.highlight}`
                      : "")}
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
                          <Label>Title</Label>
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
                            rows={2}
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
              <CardDescription>Professional certifications and industry awards</CardDescription>
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
                          items: [...currentItems, { name: "", description: "", image: "" }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
                {(formData.certifications?.items || []).map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Certification #{index + 1}</Label>
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
                          <Label>Certification Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, name: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(formData.certifications?.items || [])];
                              newItems[index] = { ...item, description: e.target.value };
                              setFormData({
                                ...formData,
                                certifications: { ...formData.certifications, items: newItems }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
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
              <CardTitle>CTA Section</CardTitle>
              <CardDescription>Call-to-action section for about page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="cta-enabled">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show/hide this section on public page</p>
                </div>
                <Switch
                  id="cta-enabled"
                  checked={formData.cta?.[0]?.enabled !== false}
                  onCheckedChange={(checked) => {
                    const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                    if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                    ctaArray[0] = { ...ctaArray[0], enabled: checked };
                    setFormData({
                      ...formData,
                      cta: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.cta?.[0]?.title || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                    if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                    ctaArray[0] = { ...ctaArray[0], title: e.target.value };
                    setFormData({
                      ...formData,
                      cta: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea
                  rows={2}
                  value={formData.cta?.[0]?.subtitle || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                    if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                    ctaArray[0] = { ...ctaArray[0], subtitle: e.target.value };
                    setFormData({
                      ...formData,
                      cta: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Background Class</Label>
                <Input
                  value={formData.cta?.[0]?.background || ""}
                  onChange={(e) => {
                    const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                    if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                    ctaArray[0] = { ...ctaArray[0], background: e.target.value };
                    setFormData({
                      ...formData,
                      cta: ctaArray
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

              <div className="space-y-4">
                <Label>Buttons</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <Label className="font-semibold mb-2 block">Button 1</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Text</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[0]?.text || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[0] = { ...buttons[0], text: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Link</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[0]?.link || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[0] = { ...buttons[0], link: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Variant</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[0]?.variant || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[0] = { ...buttons[0], variant: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <Label className="font-semibold mb-2 block">Button 2</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm">Text</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[1]?.text || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[1] = { ...buttons[1], text: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Link</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[1]?.link || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[1] = { ...buttons[1], link: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Variant</Label>
                        <Input
                          value={formData.cta?.[0]?.buttons?.[1]?.variant || ""}
                          onChange={(e) => {
                            const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                            if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                            const buttons = ctaArray[0].buttons || [{}, {}];
                            buttons[1] = { ...buttons[1], variant: e.target.value };
                            ctaArray[0] = { ...ctaArray[0], buttons };
                            setFormData({
                              ...formData,
                              cta: ctaArray
                            });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Stats</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {(formData.cta?.[0]?.stats || []).map((stat: any, index: number) => (
                    <Card key={index} className="p-4">
                      <Label className="font-semibold mb-2 block">Stat #{index + 1}</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">Value</Label>
                          <Input
                            value={stat.value}
                            onChange={(e) => {
                              const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                              if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                              const stats = ctaArray[0].stats || [];
                              stats[index] = { ...stats[index], value: e.target.value };
                              ctaArray[0] = { ...ctaArray[0], stats };
                              setFormData({
                                ...formData,
                                cta: ctaArray
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Label</Label>
                          <Input
                            value={stat.label}
                            onChange={(e) => {
                              const ctaArray = Array.isArray(formData.cta) ? [...formData.cta] : [];
                              if (!ctaArray[0]) ctaArray[0] = { type: 'primary' };
                              const stats = ctaArray[0].stats || [];
                              stats[index] = { ...stats[index], label: e.target.value };
                              ctaArray[0] = { ...ctaArray[0], stats };
                              setFormData({
                                ...formData,
                                cta: ctaArray
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}