import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BulkOrders() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
        }
      }, 200);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Orders</h1>
        <p className="text-muted-foreground">Import and manage multiple orders efficiently</p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Orders</TabsTrigger>
          <TabsTrigger value="export">Export Orders</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Orders from File
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing order data. Maximum 1000 orders per import.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Choose a file or drag & drop</h3>
                  <p className="text-sm text-muted-foreground">CSV, XLSX files up to 10MB</p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Browse Files
                    </Button>
                  </label>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    file: 'orders_batch_001.csv',
                    date: '2024-12-07 10:30',
                    status: 'completed',
                    records: 150,
                    success: 145,
                    failed: 5
                  },
                  {
                    file: 'monthly_orders.xlsx', 
                    date: '2024-12-06 14:15',
                    status: 'completed',
                    records: 89,
                    success: 89,
                    failed: 0
                  },
                  {
                    file: 'customer_orders.csv',
                    date: '2024-12-05 09:22',
                    status: 'failed',
                    records: 200,
                    success: 0,
                    failed: 200
                  }
                ].map((import_item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{import_item.file}</span>
                        <Badge variant={
                          import_item.status === 'completed' ? 'default' : 
                          import_item.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {import_item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{import_item.date}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{import_item.success} successful</span>
                      </div>
                      {import_item.failed > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>{import_item.failed} failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Orders
              </CardTitle>
              <CardDescription>
                Export order data in various formats for external processing or backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Input type="date" placeholder="From" />
                    <Input type="date" placeholder="To" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Status</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Filters</label>
                <Textarea placeholder="Enter customer IDs, order numbers, or other criteria (optional)" />
              </div>

              <div className="flex gap-2">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Templates</CardTitle>
              <CardDescription>
                Download pre-formatted templates to ensure proper data structure for bulk imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Basic Order Template</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard template with customer info, items, and pricing
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Advanced Order Template</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Includes vendor info, payment terms, and delivery preferences
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}