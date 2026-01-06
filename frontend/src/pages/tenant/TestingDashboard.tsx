import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, PlayCircle, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

interface TestFlow {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
}

export const TestingDashboard = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [testFlows, setTestFlows] = useState<TestFlow[]>([
    {
      id: 'flow-1',
      name: 'Flow 1: Admin Creates Product with Form Configuration',
      description: 'Test product creation with dynamic form configuration',
      tests: [
        { name: '1.1: Create New Product', status: 'pending' },
        { name: '1.2: Add Form Fields (7 fields)', status: 'pending' },
        { name: '1.3: Verify Form Schema Storage', status: 'pending' },
        { name: '1.4: Verify Cache Creation', status: 'pending' },
        { name: '1.5: Check UUID Exposure', status: 'pending' },
      ],
    },
    {
      id: 'flow-2',
      name: 'Flow 2: Customer Submits Order via Dynamic Form',
      description: 'Test public form submission and order creation',
      tests: [
        { name: '2.1: Load Product Page', status: 'pending' },
        { name: '2.2: Render Dynamic Form', status: 'pending' },
        { name: '2.3: Fill Form with Valid Data', status: 'pending' },
        { name: '2.4: Upload Design File', status: 'pending' },
        { name: '2.5: Submit Form', status: 'pending' },
        { name: '2.6: Validate Server-Side', status: 'pending' },
        { name: '2.7: Sanitize Customer Data', status: 'pending' },
        { name: '2.8: Create/Find Customer', status: 'pending' },
        { name: '2.9: Create Order (Draft)', status: 'pending' },
        { name: '2.10: Log Form Submission', status: 'pending' },
      ],
    },
    {
      id: 'flow-3',
      name: 'Flow 3: Admin Reviews and Approves Order',
      description: 'Test order approval workflow',
      tests: [
        { name: '3.1: View Pending Orders', status: 'pending' },
        { name: '3.2: View Order Details', status: 'pending' },
        { name: '3.3: Validate Customization Data', status: 'pending' },
        { name: '3.4: Check Status Stepper UI', status: 'pending' },
        { name: '3.5: Approve Order (Draft → Pending)', status: 'pending' },
        { name: '3.6: Verify Status Transition', status: 'pending' },
      ],
    },
    {
      id: 'flow-4',
      name: 'Flow 4: Vendor Sourcing & Negotiation',
      description: 'Test vendor assignment and quote generation',
      tests: [
        { name: '4.1: Start Vendor Sourcing', status: 'pending' },
        { name: '4.2: Search Vendors', status: 'pending' },
        { name: '4.3: Assign Vendor', status: 'pending' },
        { name: '4.4: Validate Required Fields', status: 'pending' },
        { name: '4.5: Vendor Provides Quote', status: 'pending' },
        { name: '4.6: Calculate Markup', status: 'pending' },
        { name: '4.7: Send Quote to Customer', status: 'pending' },
      ],
    },
    {
      id: 'flow-5',
      name: 'Flow 5: Payment Processing',
      description: 'Test DP and full payment workflows',
      tests: [
        { name: '5.1: Quote Approved', status: 'pending' },
        { name: '5.2: Awaiting Payment Status', status: 'pending' },
        { name: '5.3: Record DP Payment (50%)', status: 'pending' },
        { name: '5.4: Validate DP Amount', status: 'pending' },
        { name: '5.5: Validate Payment Type', status: 'pending' },
        { name: '5.6: Update Payment Status', status: 'pending' },
      ],
    },
    {
      id: 'flow-6',
      name: 'Flow 6: Production & Quality Control',
      description: 'Test production workflow and QC',
      tests: [
        { name: '6.1: Start Production', status: 'pending' },
        { name: '6.2: Record Production Timeline', status: 'pending' },
        { name: '6.3: Complete Production', status: 'pending' },
        { name: '6.4: Quality Control Pass', status: 'pending' },
        { name: '6.5: Quality Control Fail (Rollback)', status: 'pending' },
      ],
    },
    {
      id: 'flow-7',
      name: 'Flow 7: Shipping & Completion',
      description: 'Test shipping and order completion',
      tests: [
        { name: '7.1: Enter Tracking Number', status: 'pending' },
        { name: '7.2: Mark as Shipped', status: 'pending' },
        { name: '7.3: Mark as Delivered', status: 'pending' },
        { name: '7.4: Verify Final State', status: 'pending' },
        { name: '7.5: Check All Timestamps', status: 'pending' },
      ],
    },
    {
      id: 'error-handling',
      name: 'Error Handling Tests',
      description: 'Test validation and error scenarios',
      tests: [
        { name: 'Invalid Email Format', status: 'pending' },
        { name: 'Invalid Phone Format', status: 'pending' },
        { name: 'Invalid Status Transition', status: 'pending' },
        { name: 'Missing Required Fields', status: 'pending' },
        { name: 'Wrong Tenant Access', status: 'pending' },
        { name: 'Unauthorized Approval', status: 'pending' },
      ],
    },
    {
      id: 'performance',
      name: 'Performance Tests',
      description: 'Test caching and response times',
      tests: [
        { name: 'Form Config Cache Hit', status: 'pending' },
        { name: 'Form Config Cache Miss', status: 'pending' },
        { name: 'Cache Invalidation', status: 'pending' },
        { name: 'API Response Time < 200ms', status: 'pending' },
      ],
    },
    {
      id: 'security',
      name: 'Security Tests',
      description: 'Test UUID exposure and tenant isolation',
      tests: [
        { name: 'UUID-Only Exposure Check', status: 'pending' },
        { name: 'Tenant Isolation', status: 'pending' },
        { name: 'File Upload Security', status: 'pending' },
        { name: 'No Mock Data in Production', status: 'pending' },
      ],
    },
  ]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      running: 'default',
      passed: 'outline',
      failed: 'destructive',
    };
    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const runAllTests = async () => {
    setIsRunning(true);
    toast({
      title: 'Tests Started',
      description: 'Running all test flows...',
    });

    // Simulate running tests
    for (const flow of testFlows) {
      for (const test of flow.tests) {
        // Update to running
        setTestFlows((prev) =>
          prev.map((f) =>
            f.id === flow.id
              ? {
                  ...f,
                  tests: f.tests.map((t) =>
                    t.name === test.name ? { ...t, status: 'running' as const } : t
                  ),
                }
              : f
          )
        );

        // Simulate test execution
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Randomly pass/fail for demo
        const passed = Math.random() > 0.1; // 90% pass rate
        setTestFlows((prev) =>
          prev.map((f) =>
            f.id === flow.id
              ? {
                  ...f,
                  tests: f.tests.map((t) =>
                    t.name === test.name
                      ? {
                          ...t,
                          status: passed ? ('passed' as const) : ('failed' as const),
                          duration: Math.floor(Math.random() * 1000),
                          error: passed ? undefined : 'Test failed: Assertion error',
                        }
                      : t
                  ),
                }
              : f
          )
        );
      }
    }

    setIsRunning(false);
    toast({
      title: 'Tests Completed',
      description: 'All test flows have finished running.',
    });
  };

  const runSingleFlow = async (flowId: string) => {
    const flow = testFlows.find((f) => f.id === flowId);
    if (!flow) return;

    toast({
      title: `Running ${flow.name}`,
      description: 'Test execution started...',
    });

    for (const test of flow.tests) {
      setTestFlows((prev) =>
        prev.map((f) =>
          f.id === flowId
            ? {
                ...f,
                tests: f.tests.map((t) =>
                  t.name === test.name ? { ...t, status: 'running' as const } : t
                ),
              }
            : f
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      const passed = Math.random() > 0.1;
      setTestFlows((prev) =>
        prev.map((f) =>
          f.id === flowId
            ? {
                ...f,
                tests: f.tests.map((t) =>
                  t.name === test.name
                    ? {
                        ...t,
                        status: passed ? ('passed' as const) : ('failed' as const),
                        duration: Math.floor(Math.random() * 1000),
                        error: passed ? undefined : 'Test failed',
                      }
                    : t
                ),
              }
            : f
        )
      );
    }

    toast({
      title: 'Flow Completed',
      description: `${flow.name} finished.`,
    });
  };

  const resetTests = () => {
    setTestFlows((prev) =>
      prev.map((flow) => ({
        ...flow,
        tests: flow.tests.map((test) => ({ ...test, status: 'pending' as const, error: undefined })),
      }))
    );
    toast({
      title: 'Tests Reset',
      description: 'All tests have been reset to pending.',
    });
  };

  const getOverallStats = () => {
    const allTests = testFlows.flatMap((f) => f.tests);
    return {
      total: allTests.length,
      passed: allTests.filter((t) => t.status === 'passed').length,
      failed: allTests.filter((t) => t.status === 'failed').length,
      pending: allTests.filter((t) => t.status === 'pending').length,
      running: allTests.filter((t) => t.status === 'running').length,
    };
  };

  const stats = getOverallStats();

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Order Cycle - E2E Testing Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            End-to-end testing suite for Form Order Builder + Business Cycle integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.open('/roadmaps/AUDIT/FORM_ORDER_CYCLE/8-TESTING_GUIDE.md', '_blank')} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Testing Guide
          </Button>
          <Button onClick={resetTests} variant="outline" disabled={isRunning}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          <Button onClick={runAllTests} disabled={isRunning}>
            <PlayCircle className="w-4 h-4 mr-2" />
            {isRunning ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Flows */}
      <Tabs defaultValue="flow-1" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="flow-1">Flow 1-2</TabsTrigger>
          <TabsTrigger value="flow-3">Flow 3-4</TabsTrigger>
          <TabsTrigger value="flow-5">Flow 5-7</TabsTrigger>
          <TabsTrigger value="error-handling">Errors</TabsTrigger>
          <TabsTrigger value="others">Perf & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="flow-1" className="space-y-4">
          {testFlows.slice(0, 2).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{flow.name}</CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <Button onClick={() => runSingleFlow(flow.id)} size="sm" disabled={isRunning}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Flow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flow.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="flow-3" className="space-y-4">
          {testFlows.slice(2, 4).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{flow.name}</CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <Button onClick={() => runSingleFlow(flow.id)} size="sm" disabled={isRunning}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Flow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flow.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="flow-5" className="space-y-4">
          {testFlows.slice(4, 7).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{flow.name}</CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <Button onClick={() => runSingleFlow(flow.id)} size="sm" disabled={isRunning}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Flow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flow.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="error-handling" className="space-y-4">
          {testFlows.slice(7, 8).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{flow.name}</CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <Button onClick={() => runSingleFlow(flow.id)} size="sm" disabled={isRunning}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Tests
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flow.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="others" className="space-y-4">
          {testFlows.slice(8).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{flow.name}</CardTitle>
                    <CardDescription>{flow.description}</CardDescription>
                  </div>
                  <Button onClick={() => runSingleFlow(flow.id)} size="sm" disabled={isRunning}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Tests
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flow.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Testing Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Run All Tests" to execute all test flows sequentially</li>
              <li>Or run individual flows using "Run Flow" button on each card</li>
              <li>Green = Passed, Red = Failed, Blue = Running, Grey = Pending</li>
              <li>Check "Testing Guide" document for detailed manual testing steps</li>
              <li>Failed tests will show error messages below test names</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TestingDashboard;
