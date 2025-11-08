        <TabsContent value="socialProof" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Proof Section</CardTitle>
              <CardDescription>Display achievements and trust indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="enable-social-proof">Enable Section</Label>
                  <p className="text-sm text-muted-foreground">Show or hide the social proof section</p>
                </div>
                <Switch
                  id="enable-social-proof"
                  checked={formData.socialProof?.enabled !== false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      socialProof: { 
                        ...formData.socialProof, 
                        enabled: checked 
                      }
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
                      socialProof: { 
                        ...formData.socialProof, 
                        title: e.target.value 
                      }
                    });
                    setHasChanges(true);
                  }}
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
                      socialProof: { 
                        ...formData.socialProof, 
                        subtitle: e.target.value 
                      }
                    });
                    setHasChanges(true);
                  }}
                />
              </div>

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
                                ...formData.socialProof, 
                                stats: updatedStats 
                              }
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

                <div className="flex items-center justify-between mt-6">
                  <Label>Customer Reviews</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentReviews = formData.socialProof?.reviews || [];
                      setFormData({
                        ...formData,
                        socialProof: {
                          ...formData.socialProof,
                          reviews: [...currentReviews, {
                            avatar: "", 
                            name: "",
                            role: "",
                            company: "",
                            content: "",
                            rating: 5
                          }]
                        }
                      });
                      setHasChanges(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Review
                  </Button>
                </div>

                {(formData.socialProof?.reviews || []).map((review: any, index: number) => (
                  <Card key={index} className="relative mt-4">
                    <CardHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Customer Avatar URL</Label>
                          <Input
                            value={review.avatar}
                            onChange={(e) => {
                              const updatedReviews = [...(formData.socialProof?.reviews || [])];
                              updatedReviews[index] = { ...review, avatar: e.target.value };
                              setFormData({
                                ...formData,
                                socialProof: {
                                  ...formData.socialProof,
                                  reviews: updatedReviews
                                }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Customer Name</Label>
                          <Input
                            value={review.name}
                            onChange={(e) => {
                              const updatedReviews = [...(formData.socialProof?.reviews || [])];
                              updatedReviews[index] = { ...review, name: e.target.value };
                              setFormData({
                                ...formData,
                                socialProof: {
                                  ...formData.socialProof,
                                  reviews: updatedReviews
                                }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Role & Company</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Role"
                              value={review.role}
                              onChange={(e) => {
                                const updatedReviews = [...(formData.socialProof?.reviews || [])];
                                updatedReviews[index] = { ...review, role: e.target.value };
                                setFormData({
                                  ...formData,
                                  socialProof: {
                                    ...formData.socialProof,
                                    reviews: updatedReviews
                                  }
                                });
                                setHasChanges(true);
                              }}
                            />
                            <Input
                              placeholder="Company"
                              value={review.company}
                              onChange={(e) => {
                                const updatedReviews = [...(formData.socialProof?.reviews || [])];
                                updatedReviews[index] = { ...review, company: e.target.value };
                                setFormData({
                                  ...formData,
                                  socialProof: {
                                    ...formData.socialProof,
                                    reviews: updatedReviews
                                  }
                                });
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Review Content</Label>
                          <Textarea
                            rows={3}
                            value={review.content}
                            onChange={(e) => {
                              const updatedReviews = [...(formData.socialProof?.reviews || [])];
                              updatedReviews[index] = { ...review, content: e.target.value };
                              setFormData({
                                ...formData,
                                socialProof: {
                                  ...formData.socialProof,
                                  reviews: updatedReviews
                                }
                              });
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Rating</Label>
                          <Select
                            value={review.rating.toString()}
                            onValueChange={(value) => {
                              const updatedReviews = [...(formData.socialProof?.reviews || [])];
                              updatedReviews[index] = { ...review, rating: parseInt(value) };
                              setFormData({
                                ...formData,
                                socialProof: {
                                  ...formData.socialProof,
                                  reviews: updatedReviews
                                }
                              });
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Star</SelectItem>
                              <SelectItem value="2">2 Stars</SelectItem>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="4">4 Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const updatedReviews = [...(formData.socialProof?.reviews || [])];
                          updatedReviews.splice(index, 1);
                          setFormData({
                            ...formData,
                            socialProof: {
                              ...formData.socialProof,
                              reviews: updatedReviews
                            }
                          });
                          setHasChanges(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Review
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>