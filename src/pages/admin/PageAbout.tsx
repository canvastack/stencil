import { useState } from "react";
import { usePageContent } from "@/contexts/ContentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, RotateCcw, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export default function PageAbout() {
  const { content, loading } = usePageContent("about");
  const [formData, setFormData] = useState(content?.content || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    toast.success("About page content saved successfully!");
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
          <h1 className="text-3xl font-bold">About Page Content</h1>
          <p className="text-muted-foreground">Manage company information and team</p>
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
          <TabsTrigger value="mission">Mission & Vision</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Page banner and introduction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  placeholder="About Us"
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
                  placeholder="Hero subtitle..."
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

        <TabsContent value="values" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Values</CardTitle>
              <CardDescription>Define your core values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.values?.map((value: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Value title"
                            defaultValue={value.title}
                            onChange={(e) => {
                              const newValues = [...(formData.values || [])];
                              newValues[index].title = e.target.value;
                              setFormData({ ...formData, values: newValues });
                              setHasChanges(true);
                            }}
                          />
                          <Textarea
                            placeholder="Value description"
                            defaultValue={value.description}
                            onChange={(e) => {
                              const newValues = [...(formData.values || [])];
                              newValues[index].description = e.target.value;
                              setFormData({ ...formData, values: newValues });
                              setHasChanges(true);
                            }}
                            rows={2}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newValues = formData.values.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, values: newValues });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
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
                      values: [...(formData.values || []), { title: '', description: '' }]
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Value
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>About the company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Founded Year</Label>
                  <Input
                    type="number"
                    defaultValue={formData.company?.founded}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, founded: parseInt(e.target.value) }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    defaultValue={formData.company?.location}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        company: { ...formData.company, location: e.target.value }
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
              <CardTitle>Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mission Title</Label>
                <Input
                  defaultValue={formData.mission?.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mission: { ...formData.mission, title: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Mission Statement</Label>
                <Textarea
                  rows={4}
                  defaultValue={formData.mission?.statement}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mission: { ...formData.mission, statement: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Timeline</CardTitle>
              <CardDescription>Chronicle your company's journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.timeline?.map((event: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Year"
                            type="number"
                            defaultValue={event.year}
                            onChange={(e) => {
                              const newTimeline = [...(formData.timeline || [])];
                              newTimeline[index].year = parseInt(e.target.value);
                              setFormData({ ...formData, timeline: newTimeline });
                              setHasChanges(true);
                            }}
                          />
                          <Input
                            placeholder="Event title"
                            defaultValue={event.title}
                            onChange={(e) => {
                              const newTimeline = [...(formData.timeline || [])];
                              newTimeline[index].title = e.target.value;
                              setFormData({ ...formData, timeline: newTimeline });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newTimeline = formData.timeline.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, timeline: newTimeline });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Event description"
                        defaultValue={event.description}
                        onChange={(e) => {
                          const newTimeline = [...(formData.timeline || [])];
                          newTimeline[index].description = e.target.value;
                          setFormData({ ...formData, timeline: newTimeline });
                          setHasChanges(true);
                        }}
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      timeline: [...(formData.timeline || []), { year: new Date().getFullYear(), title: '', description: '' }]
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Timeline Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certifications & Awards</CardTitle>
              <CardDescription>Showcase your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.certifications?.map((cert: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Certification name"
                            defaultValue={cert.name}
                            onChange={(e) => {
                              const newCerts = [...(formData.certifications || [])];
                              newCerts[index].name = e.target.value;
                              setFormData({ ...formData, certifications: newCerts });
                              setHasChanges(true);
                            }}
                          />
                          <Input
                            placeholder="Issuing organization"
                            defaultValue={cert.issuer}
                            onChange={(e) => {
                              const newCerts = [...(formData.certifications || [])];
                              newCerts[index].issuer = e.target.value;
                              setFormData({ ...formData, certifications: newCerts });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newCerts = formData.certifications.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, certifications: newCerts });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Year obtained"
                          type="number"
                          defaultValue={cert.year}
                          onChange={(e) => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts[index].year = parseInt(e.target.value);
                            setFormData({ ...formData, certifications: newCerts });
                            setHasChanges(true);
                          }}
                        />
                        <Input
                          placeholder="Image URL"
                          defaultValue={cert.image}
                          onChange={(e) => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts[index].image = e.target.value;
                            setFormData({ ...formData, certifications: newCerts });
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <Textarea
                        placeholder="Description"
                        defaultValue={cert.description}
                        onChange={(e) => {
                          const newCerts = [...(formData.certifications || [])];
                          newCerts[index].description = e.target.value;
                          setFormData({ ...formData, certifications: newCerts });
                          setHasChanges(true);
                        }}
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      certifications: [...(formData.certifications || []), { name: '', issuer: '', year: new Date().getFullYear(), image: '', description: '' }]
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team showcase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.team?.map((member: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Name"
                            defaultValue={member.name}
                            onChange={(e) => {
                              const newTeam = [...formData.team];
                              newTeam[index].name = e.target.value;
                              setFormData({ ...formData, team: newTeam });
                              setHasChanges(true);
                            }}
                          />
                          <Input
                            placeholder="Role"
                            defaultValue={member.role}
                            onChange={(e) => {
                              const newTeam = [...formData.team];
                              newTeam[index].role = e.target.value;
                              setFormData({ ...formData, team: newTeam });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newTeam = formData.team.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, team: newTeam });
                            setHasChanges(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Bio"
                        defaultValue={member.bio}
                        onChange={(e) => {
                          const newTeam = [...formData.team];
                          newTeam[index].bio = e.target.value;
                          setFormData({ ...formData, team: newTeam });
                          setHasChanges(true);
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      team: [...(formData.team || []), { name: '', role: '', bio: '', image: '' }]
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
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
                  placeholder="SEO Title"
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
