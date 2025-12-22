import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus,
  Search,
  Filter,
  Send,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Reply,
  Forward,
  Archive,
  Star,
  Paperclip,
  Users,
  Bell,
  Settings,
  MoreVertical
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface Communication {
  id: string;
  vendor_id: string;
  vendor_name: string;
  type: 'email' | 'phone' | 'meeting' | 'message' | 'notification';
  subject: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'pending' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  created_by: string;
  attachments?: string[];
  tags?: string[];
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'order_update' | 'payment_reminder' | 'contract_expiry' | 'quality_alert' | 'general';
  subject: string;
  content: string;
  active: boolean;
}

// Mock data
const mockCommunications: Communication[] = [
  {
    id: '1',
    vendor_id: '101',
    vendor_name: 'PT Teknologi Maju',
    type: 'email',
    subject: 'Order PO-2024-001 Status Update Required',
    content: 'Mohon informasi status terkini untuk order PO-2024-001. Pelanggan menanyakan estimasi pengiriman.',
    direction: 'outbound',
    status: 'read',
    priority: 'medium',
    created_at: '2024-01-15T14:30:00Z',
    created_by: 'Admin User',
    tags: ['order-inquiry', 'urgent']
  },
  {
    id: '2',
    vendor_id: '102',
    vendor_name: 'CV Bahan Bangunan Jaya',
    type: 'phone',
    subject: 'Payment Terms Discussion',
    content: 'Diskusi mengenai terms pembayaran untuk kontrak Q2 2024. Vendor request NET 45 days.',
    direction: 'inbound',
    status: 'pending',
    priority: 'high',
    created_at: '2024-01-14T10:15:00Z',
    created_by: 'Vendor Rep',
    tags: ['payment', 'contract']
  },
  {
    id: '3',
    vendor_id: '103',
    vendor_name: 'PT Logistik Express',
    type: 'email',
    subject: 'Monthly Performance Report - December 2023',
    content: 'Laporan performa pengiriman bulan Desember. Overall delivery rate 96.2% dengan 2 keterlambatan.',
    direction: 'inbound',
    status: 'delivered',
    priority: 'low',
    created_at: '2024-01-02T08:45:00Z',
    created_by: 'Logistics Manager',
    tags: ['report', 'performance'],
    attachments: ['performance-report-dec-2023.pdf']
  },
];

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Order Status Request',
    type: 'order_update',
    subject: 'Status Update Required for Order {{order_number}}',
    content: 'Dear {{vendor_name}},\n\nMohon informasi status terkini untuk order {{order_number}} yang ditempatkan pada {{order_date}}.\n\nTerima kasih.',
    active: true
  },
  {
    id: '2',
    name: 'Payment Reminder',
    type: 'payment_reminder',
    subject: 'Payment Reminder - Invoice {{invoice_number}}',
    content: 'Dear {{vendor_name}},\n\nIni adalah pengingat bahwa invoice {{invoice_number}} dengan nilai {{amount}} sudah jatuh tempo pada {{due_date}}.\n\nMohon segera dilakukan pembayaran.',
    active: true
  },
  {
    id: '3',
    name: 'Contract Expiry Notice',
    type: 'contract_expiry',
    subject: 'Contract Expiry Notice - {{contract_number}}',
    content: 'Dear {{vendor_name}},\n\nKontrak {{contract_number}} akan berakhir pada {{expiry_date}}.\n\nSilakan hubungi kami untuk proses renewal jika diperlukan.',
    active: true
  }
];

const VendorCommunications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'read':
        return <Eye className="h-4 w-4 text-green-700" />;
      case 'replied':
        return <Reply className="h-4 w-4 text-purple-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredCommunications = mockCommunications.filter(comm => {
    const matchesSearch = comm.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const communicationColumns: ColumnDef<Communication>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.getValue('type'))}
          <span className="capitalize">{row.getValue('type')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'vendor_name',
      header: 'Vendor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('vendor_name')}</div>
          <div className="text-sm text-gray-600">{row.original.subject}</div>
        </div>
      ),
    },
    {
      accessorKey: 'direction',
      header: 'Direction',
      cell: ({ row }) => (
        <Badge variant="outline" className={
          row.getValue('direction') === 'inbound' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }>
          {row.getValue('direction') === 'inbound' ? 'Incoming' : 'Outgoing'}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant="outline" className={getPriorityColor(row.getValue('priority'))}>
          {(row.getValue('priority') as string).charAt(0).toUpperCase() + (row.getValue('priority') as string).slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.getValue('status'))}
          <span className="capitalize">{row.getValue('status')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('created_at')).toLocaleDateString('id-ID')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('View message button clicked!', row.original.vendor_name);
                  toast.info(`👁️ Melihat pesan dari ${row.original.vendor_name}`, {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Message</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('Reply message button clicked!', row.original.vendor_name);
                  toast.info(`💬 Membalas pesan ke ${row.original.vendor_name}`, {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <Reply className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reply Message</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('More options button clicked!');
                  toast.info('⚙️ Opsi tambahan tersedia', {
                    duration: 3000,
                    position: 'top-right'
                  });
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>More Options</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  // Statistics
  const stats = {
    total: mockCommunications.length,
    pending: mockCommunications.filter(c => c.status === 'pending').length,
    thisWeek: mockCommunications.filter(c => {
      const commDate = new Date(c.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return commDate >= weekAgo;
    }).length,
    unread: mockCommunications.filter(c => c.direction === 'inbound' && c.status !== 'read').length,
  };

  const handleTemplates = () => {
    console.log('Templates button clicked!');
    toast.info('📋 Template management akan segera tersedia', {
      duration: 4000,
      position: 'top-right'
    });
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendor Communications</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola komunikasi dan notifikasi dengan vendor</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTemplates}>
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Message to Vendor</DialogTitle>
                <DialogDescription>
                  Kirim pesan atau notifikasi ke vendor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor</label>
                    <Input placeholder="Select vendor..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <Input placeholder="Email, Phone, etc." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input placeholder="Message subject..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Textarea placeholder="Type your message here..." rows={6} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsNewMessageOpen(false)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeek}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Bell className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unread}</p>
              </div>
            </div>
          </Card>
        </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Communications</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={communicationColumns} 
                data={filteredCommunications}
                searchKey="vendor_name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inbox - Incoming Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCommunications
                  .filter(c => c.direction === 'inbound')
                  .map((comm) => (
                    <div key={comm.id} className={`border rounded-lg p-4 ${comm.status === 'read' ? 'dark:bg-gray-800/50' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(comm.type)}
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{comm.vendor_name}</span>
                          <Badge variant="outline" className={getPriorityColor(comm.priority)}>
                            {comm.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {getStatusIcon(comm.status)}
                          {new Date(comm.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{comm.subject}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{comm.content}</p>
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{comm.attachments.length} attachment(s)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          onClick={() => toast.success(`Replying to ${comm.vendor_name}`)}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toast.info(`Forwarding message from ${comm.vendor_name}`)}
                        >
                          <Forward className="h-4 w-4 mr-1" />
                          Forward
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toast.success(`Archived message from ${comm.vendor_name}`)}
                        >
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Sent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={communicationColumns} 
                data={mockCommunications.filter(c => c.direction === 'outbound')}
                searchKey="vendor_name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Templates</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</h4>
                      <Badge variant={template.active ? 'default' : 'secondary'}>
                        {template.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Type: <span className="capitalize">{template.type.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Subject:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.subject}</div>
                    <div className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Content Preview:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {template.content.substring(0, 150)}...
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          console.log('Preview template button clicked!', template.name);
                          toast.info(`👁️ Melihat template: ${template.name}`, {
                            duration: 3000,
                            position: 'top-right'
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          console.log('Use template button clicked!', template.name);
                          toast.success(`📧 Menggunakan template: ${template.name}`, {
                            duration: 3000,
                            position: 'top-right'
                          });
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Communication Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Notification Preferences</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Email notifications for new vendor messages', checked: true },
                    { label: 'SMS alerts for urgent communications', checked: false },
                    { label: 'Daily summary of vendor communications', checked: true },
                    { label: 'Auto-reply for vendor inquiries', checked: false },
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{setting.label}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info(`Toggling: ${setting.label}`)}
                      >
                        {setting.checked ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Auto-Response Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Default Response Time</label>
                    <Input defaultValue="24 hours" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Auto-Reply Message</label>
                    <Textarea 
                      defaultValue="Terima kasih atas pesan Anda. Kami akan merespons dalam 24 jam ke depan."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Archive Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Auto-archive after</label>
                    <Input defaultValue="90 days" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Delete archived messages after 1 year</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info('Toggling archive deletion setting')}
                    >
                      Enabled
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default VendorCommunications;