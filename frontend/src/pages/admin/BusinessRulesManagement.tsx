import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Settings, Shield, DollarSign, Users, Package, Truck, Star, Edit, Save, X, Plus } from 'lucide-react';
import { businessRulesService } from '../../services/api/businessRules';
import { BusinessRule, RuleConfiguration, RuleCategory, RuleResult } from '../../types/businessRules';
import { toast } from 'sonner';

console.log('📦 businessRulesService imported:', businessRulesService);

const BusinessRulesManagement = memo(function BusinessRulesManagement() {
  console.log('🚀 BusinessRulesManagement component mounted');
  
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [configurations, setConfigurations] = useState<RuleConfiguration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, RuleResult>>({});
  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false);

  console.log('📊 Component state:', { 
    rulesCount: rules.length, 
    configurationsCount: configurations.length, 
    loading, 
    selectedCategory 
  });

  const ruleCategories: { value: RuleCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all', label: 'All Rules', icon: Settings },
    { value: 'order', label: 'Order Management', icon: Package },
    { value: 'customer', label: 'Customer Management', icon: Users },
    { value: 'vendor', label: 'Vendor Management', icon: Truck },
    { value: 'payment', label: 'Payment & Financial', icon: DollarSign },
    { value: 'quality', label: 'Quality Assurance', icon: Star },
    { value: 'security', label: 'Security & Compliance', icon: Shield },
  ];

  useEffect(() => {
    fetchBusinessRules();
  }, []);

  const fetchBusinessRules = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching business rules...');
      
      const [rulesData, configurationsData] = await Promise.all([
        businessRulesService.getAllRules(),
        businessRulesService.getAllConfigurations()
      ]);
      
      console.log('✅ Rules data received:', rulesData);
      console.log('✅ Configurations data received:', configurationsData);
      
      setRules(rulesData);
      setConfigurations(configurationsData);
      
      console.log('✅ State updated - Rules:', rulesData.length, 'Configurations:', configurationsData.length);
    } catch (error) {
      console.error('❌ Error fetching business rules:', error);
      toast.error('Failed to load business rules');
    } finally {
      setLoading(false);
      console.log('✅ Loading completed');
    }
  };

  const handleRuleToggle = async (ruleCode: string, enabled: boolean) => {
    try {
      setSaving(true);
      await businessRulesService.updateRuleConfiguration(ruleCode, { enabled });
      
      setConfigurations(prev => 
        prev.map((config: RuleConfiguration) => 
          config.ruleCode === ruleCode 
            ? { ...config, enabled }
            : config
        )
      );
      
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update rule configuration');
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityChange = async (ruleCode: string, priority: number) => {
    try {
      setSaving(true);
      await businessRulesService.updateRuleConfiguration(ruleCode, { priority });
      
      setConfigurations(prev => 
        prev.map((config: RuleConfiguration) => 
          config.ruleCode === ruleCode 
            ? { ...config, priority }
            : config
        )
      );
      
      toast.success('Rule priority updated successfully');
    } catch (error) {
      toast.error('Failed to update rule priority');
      console.error('Error updating priority:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleParameterUpdate = async (ruleCode: string, parameters: Record<string, any>) => {
    try {
      setSaving(true);
      await businessRulesService.updateRuleConfiguration(ruleCode, { parameters });
      
      setConfigurations(prev => 
        prev.map((config: RuleConfiguration) => 
          config.ruleCode === ruleCode 
            ? { ...config, parameters: { ...config.parameters, ...parameters } }
            : config
        )
      );
      
      toast.success('Rule parameters updated successfully');
      setEditingRule(null);
    } catch (error) {
      toast.error('Failed to update rule parameters');
      console.error('Error updating parameters:', error);
    } finally {
      setSaving(false);
    }
  };

  const testRule = async (ruleCode: string) => {
    try {
      const result = await businessRulesService.testRule(ruleCode);
      setTestResults(prev => ({ ...prev, [ruleCode]: result }));
      
      if (result.isValid) {
        toast.success('Rule test passed successfully');
      } else {
        toast.warning('Rule test failed - check configuration');
      }
    } catch (error) {
      toast.error('Failed to test rule');
      console.error('Error testing rule:', error);
    }
  };

  const filteredRules = (rules || []).filter(rule => 
    selectedCategory === 'all' || rule.category === selectedCategory
  );

  const getRuleConfiguration = (ruleCode: string) => {
    return (configurations || []).find(config => config.ruleCode === ruleCode);
  };

  const getRuleStatusBadge = (ruleCode: string) => {
    const config = getRuleConfiguration(ruleCode);
    const testResult = testResults[ruleCode];
    
    if (!config?.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (testResult) {
      return testResult.isValid 
        ? <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
        : <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Rules Management</h1>
          <p className="text-muted-foreground">
            Configure and manage PT CEX business rules and validation logic
          </p>
        </div>
        <Button onClick={() => setShowAddRuleDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Rule
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Categories</CardTitle>
          <CardDescription>
            Filter rules by category to manage specific business areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ruleCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                  <Badge variant="secondary" className="ml-1">
                    {category.value === 'all' 
                      ? (rules || []).length 
                      : (rules || []).filter(r => r.category === category.value).length
                    }
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid gap-4">
        {filteredRules.map((rule) => {
          const config = getRuleConfiguration(rule.code);
          const isEditing = editingRule === rule.code;
          
          return (
            <Card key={rule.code} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {rule.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRuleStatusBadge(rule.code)}
                    <Badge variant="outline">
                      Priority: {config?.priority || rule.defaultPriority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="configuration" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="configuration" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`enabled-${rule.code}`}>Rule Enabled</Label>
                        <Switch
                          id={`enabled-${rule.code}`}
                          checked={config?.enabled ?? true}
                          onCheckedChange={(enabled) => handleRuleToggle(rule.code, enabled)}
                          disabled={saving}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`priority-${rule.code}`}>Priority (1-100)</Label>
                        <Input
                          id={`priority-${rule.code}`}
                          type="number"
                          min="1"
                          max="100"
                          value={config?.priority || rule.defaultPriority}
                          onChange={(e) => handlePriorityChange(rule.code, parseInt(e.target.value))}
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Applicable Contexts</Label>
                      <div className="flex flex-wrap gap-2">
                        {(rule.applicableContexts || []).map((context: string) => (
                          <Badge key={context} variant="outline">
                            {context}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="parameters" className="space-y-4">
                    {isEditing ? (
                      <RuleParametersEditor
                        rule={rule}
                        config={config}
                        onSave={(parameters) => handleParameterUpdate(rule.code, parameters)}
                        onCancel={() => setEditingRule(null)}
                        saving={saving}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Current Parameters</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRule(rule.code)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Parameters
                          </Button>
                        </div>
                        
                        <div className="grid gap-2">
                          {Object.entries(config?.parameters || rule.defaultParameters || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="font-medium">{key}</span>
                              <span className="text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="testing" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Rule Testing</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testRule(rule.code)}
                      >
                        Test Rule
                      </Button>
                    </div>
                    
                    {testResults[rule.code] && (
                      <div className="space-y-2">
                        <div className={`p-3 rounded border ${
                          testResults[rule.code]?.isValid 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {testResults[rule.code]?.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {testResults[rule.code]?.isValid ? 'Test Passed' : 'Test Failed'}
                            </span>
                          </div>
                          
                          {(testResults[rule.code]?.errors?.length || 0) > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Errors:</p>
                              {(testResults[rule.code]?.errors || []).map((error: string, index: number) => (
                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                  • {error}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {(testResults[rule.code]?.warnings?.length || 0) > 0 && (
                            <div className="space-y-1 mt-2">
                              <p className="text-sm font-medium">Warnings:</p>
                              {(testResults[rule.code]?.warnings || []).map((warning: string, index: number) => (
                                <p key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                                  • {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No business rules found for the selected category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Rule Dialog */}
      <Dialog open={showAddRuleDialog} onOpenChange={setShowAddRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Business Rule</DialogTitle>
            <DialogDescription>
              Create a custom business rule for your specific requirements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Rules Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                The ability to create custom business rules will be available in a future update. 
                Currently, you can configure the 6 built-in business rules.
              </p>
              <div className="text-sm text-muted-foreground">
                <p><strong>Available Rules:</strong></p>
                <ul className="mt-2 space-y-1">
                  <li>• Order Value Validation</li>
                  <li>• Customer Credit Limit</li>
                  <li>• Vendor Capability Validation</li>
                  <li>• Vendor Performance Validation</li>
                  <li>• Payment Terms Validation</li>
                  <li>• Quality Standards Validation</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRuleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Rule Parameters Editor Component
interface RuleParametersEditorProps {
  rule: BusinessRule;
  config?: RuleConfiguration;
  onSave: (parameters: Record<string, any>) => void;
  onCancel: () => void;
  saving: boolean;
}

function RuleParametersEditor({ rule, config, onSave, onCancel, saving }: RuleParametersEditorProps) {
  const [parameters, setParameters] = useState(config?.parameters || rule.defaultParameters || {});

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev: Record<string, any>) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(parameters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Edit Parameters</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`param-${key}`}>{key}</Label>
            {typeof value === 'boolean' ? (
              <Switch
                id={`param-${key}`}
                checked={value}
                onCheckedChange={(checked) => handleParameterChange(key, checked)}
                disabled={saving}
              />
            ) : typeof value === 'number' ? (
              <Input
                id={`param-${key}`}
                type="number"
                value={value}
                onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
                disabled={saving}
              />
            ) : typeof value === 'object' ? (
              <Textarea
                id={`param-${key}`}
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleParameterChange(key, parsed);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                disabled={saving}
                rows={4}
              />
            ) : (
              <Input
                id={`param-${key}`}
                value={String(value)}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                disabled={saving}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BusinessRulesManagement;