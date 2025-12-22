import React, { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Progress,
} from '@/components/ui/lazy-components';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  Download,
  Calendar,
  User,
  Phone,
  Mail,
  Eye,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { RefundStatus as RefundStatusEnum, RefundReason, RefundType } from '@/types/refund';

// Mock data - replace with real API calls
const mockRefundRequests = [
  {
    id: '1',
    requestNumber: 'RFD-20241208-001',
    orderNumber: 'ORD-20241201-001',
    orderTotal: 1250000,
    refundReason: RefundReason.QualityIssue,
    refundType: RefundType.FullRefund,
    requestedAmount: 1250000,
    approvedAmount: 1250000,
    status: RefundStatusEnum.Approved,
    submittedAt: '2024-12-08T10:30:00Z',
    lastUpdated: '2024-12-08T14:30:00Z',
    estimatedCompletion: '2024-12-12T17:00:00Z',
    customerNotes: 'Produk yang diterima tidak sesuai dengan spesifikasi yang diminta. Material terlihat tidak berkualitas.',
    timeline: [
      {
        date: '2024-12-08T10:30:00Z',
        status: 'submitted',
        title: 'Permintaan Diajukan',
        description: 'Permintaan refund berhasil diajukan oleh customer',
        actor: 'Customer'
      },
      {
        date: '2024-12-08T11:15:00Z',
        status: 'under_review',
        title: 'Sedang Ditinjau',
        description: 'Tim customer service mulai meninjau permintaan',
        actor: 'CS Team'
      },
      {
        date: '2024-12-08T14:30:00Z',
        status: 'approved',
        title: 'Disetujui',
        description: 'Permintaan refund disetujui oleh manager',
        actor: 'Finance Manager'
      }
    ],
    communications: [
      {
        id: '1',
        date: '2024-12-08T11:30:00Z',
        sender: 'CS Team',
        message: 'Terima kasih telah mengajukan permintaan refund. Kami sedang meninjau bukti yang Anda berikan.',
        type: 'system'
      },
      {
        id: '2', 
        date: '2024-12-08T14:45:00Z',
        sender: 'Finance Manager',
        message: 'Setelah melihat bukti foto, kami menyetujui refund penuh. Proses pencairan akan dimulai.',
        type: 'approval'
      }
    ],
    evidenceFiles: [
      { name: 'produk_rusak_1.jpg', type: 'image', url: '#' },
      { name: 'produk_rusak_2.jpg', type: 'image', url: '#' }
    ]
  },
  {
    id: '2',
    requestNumber: 'RFD-20241205-002',
    orderNumber: 'ORD-20241130-005',
    orderTotal: 850000,
    refundReason: RefundReason.CustomerRequest,
    refundType: RefundType.PartialRefund,
    requestedAmount: 850000,
    approvedAmount: 0,
    status: RefundStatusEnum.Processing,
    submittedAt: '2024-12-05T14:20:00Z',
    lastUpdated: '2024-12-07T16:00:00Z',
    estimatedCompletion: '2024-12-10T17:00:00Z',
    customerNotes: 'Berubah pikiran, ingin membatalkan pesanan karena tidak lagi membutuhkan.',
    timeline: [
      {
        date: '2024-12-05T14:20:00Z',
        status: 'submitted',
        title: 'Permintaan Diajukan',
        description: 'Permintaan refund berhasil diajukan',
        actor: 'Customer'
      },
      {
        date: '2024-12-06T10:00:00Z',
        status: 'approved',
        title: 'Disetujui Sebagian',
        description: 'Refund disetujui dikurangi biaya produksi yang sudah dibayar ke vendor',
        actor: 'Finance Team'
      },
      {
        date: '2024-12-07T16:00:00Z',
        status: 'processing',
        title: 'Dalam Proses',
        description: 'Sedang diproses pencairan dana ke rekening customer',
        actor: 'Payment Team'
      }
    ],
    communications: [
      {
        id: '1',
        date: '2024-12-06T10:30:00Z',
        sender: 'CS Team',
        message: 'Karena produksi sudah dimulai dan biaya vendor sudah dibayar Rp 595.000, refund yang bisa diberikan adalah Rp 255.000.',
        type: 'info'
      }
    ],
    evidenceFiles: []
  }
];

const statusConfig = {
  [RefundStatusEnum.PendingReview]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Menunggu Review'
  },
  [RefundStatusEnum.UnderInvestigation]: {
    color: 'bg-blue-100 text-blue-800',
    icon: Search,
    label: 'Sedang Diselidiki'
  },
  [RefundStatusEnum.Approved]: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
    label: 'Disetujui'
  },
  [RefundStatusEnum.Processing]: {
    color: 'bg-purple-100 text-purple-800',
    icon: RefreshCw,
    label: 'Sedang Diproses'
  },
  [RefundStatusEnum.Completed]: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
    label: 'Selesai'
  },
  [RefundStatusEnum.Rejected]: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Ditolak'
  },
  [RefundStatusEnum.Disputed]: {
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle,
    label: 'Disengketakan'
  }
};

const reasonLabels = {
  [RefundReason.CustomerRequest]: 'Berubah Pikiran',
  [RefundReason.QualityIssue]: 'Masalah Kualitas',
  [RefundReason.TimelineDelay]: 'Keterlambatan',
  [RefundReason.VendorFailure]: 'Kegagalan Vendor',
  [RefundReason.ProductionError]: 'Kesalahan Produksi',
  [RefundReason.ShippingDamage]: 'Kerusakan Pengiriman',
  [RefundReason.Other]: 'Lainnya'
};

export default function CustomerRefundStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refunds, setRefunds] = useState(mockRefundRequests);

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = !searchTerm || 
      refund.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || refund.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getProgressPercentage = (status: RefundStatusEnum) => {
    switch (status) {
      case RefundStatusEnum.PendingReview: return 20;
      case RefundStatusEnum.UnderInvestigation: return 40;
      case RefundStatusEnum.Approved: return 60;
      case RefundStatusEnum.Processing: return 80;
      case RefundStatusEnum.Completed: return 100;
      case RefundStatusEnum.Rejected: return 0;
      case RefundStatusEnum.Disputed: return 50;
      default: return 0;
    }
  };

  const RefundDetailDialog = ({ refund }: { refund: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Lihat Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Permintaan Refund - {refund.requestNumber}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="communication">Komunikasi</TabsTrigger>
            <TabsTrigger value="evidence">Bukti</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nomor Refund:</span>
                    <span className="font-mono">{refund.requestNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nomor Pesanan:</span>
                    <span className="font-mono">{refund.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={statusConfig[refund.status].color}>
                      {statusConfig[refund.status].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Alasan:</span>
                    <span>{reasonLabels[refund.refundReason]}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Finansial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Pesanan:</span>
                    <span>Rp {refund.orderTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jumlah Diminta:</span>
                    <span>Rp {refund.requestedAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jumlah Disetujui:</span>
                    <span className="font-semibold text-green-600">
                      Rp {refund.approvedAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catatan Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{refund.customerNotes}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Timeline Proses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {refund.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.title}</h4>
                          <span className="text-xs text-gray-500">{event.actor}</span>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <span className="text-xs text-gray-500">
                          {format(new Date(event.date), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Komunikasi</CardTitle>
              </CardHeader>
              <CardContent>
                {refund.communications.length > 0 ? (
                  <div className="space-y-4">
                    {refund.communications.map((comm: any) => (
                      <div key={comm.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{comm.sender}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comm.date), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                        <p className="text-sm">{comm.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Belum ada komunikasi</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>Bukti Pendukung</CardTitle>
              </CardHeader>
              <CardContent>
                {refund.evidenceFiles.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {refund.evidenceFiles.map((file: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Tidak ada bukti yang diupload</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  return (
    <LazyWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Status Permintaan Refund
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pantau status permintaan refund Anda secara real-time
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">Cari</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Cari berdasarkan nomor refund atau nomor pesanan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <Label htmlFor="status-filter" className="sr-only">Filter Status</Label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {refunds.length}
                </div>
                <p className="text-sm text-gray-600">Total Permintaan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {refunds.filter(r => r.status === RefundStatusEnum.Completed).length}
                </div>
                <p className="text-sm text-gray-600">Selesai</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {refunds.filter(r => [RefundStatusEnum.Processing, RefundStatusEnum.Approved].includes(r.status)).length}
                </div>
                <p className="text-sm text-gray-600">Dalam Proses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {refunds.filter(r => [RefundStatusEnum.PendingReview, RefundStatusEnum.UnderInvestigation].includes(r.status)).length}
                </div>
                <p className="text-sm text-gray-600">Menunggu</p>
              </CardContent>
            </Card>
          </div>

          {/* Refund Requests List */}
          <div className="space-y-4">
            {filteredRefunds.length > 0 ? (
              filteredRefunds.map((refund) => {
                const statusInfo = statusConfig[refund.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={refund.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{refund.requestNumber}</h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Order: </span>
                              <span className="font-mono">{refund.orderNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Alasan: </span>
                              <span>{reasonLabels[refund.refundReason]}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Jumlah: </span>
                              <span className="font-medium">Rp {refund.requestedAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Diajukan: </span>
                              <span>{format(new Date(refund.submittedAt), 'dd MMM yyyy', { locale: id })}</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{getProgressPercentage(refund.status)}%</span>
                            </div>
                            <Progress value={getProgressPercentage(refund.status)} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-32">
                          <RefundDetailDialog refund={refund} />
                          
                          {refund.status === RefundStatusEnum.UnderInvestigation && (
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Kirim Pesan
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Estimated Completion */}
                      {refund.estimatedCompletion && refund.status !== RefundStatusEnum.Completed && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                            <Calendar className="w-4 h-4" />
                            <span>Estimasi selesai: {format(new Date(refund.estimatedCompletion), 'dd MMMM yyyy', { locale: id })}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Tidak ada permintaan refund
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || selectedStatus !== 'all' 
                      ? 'Tidak ditemukan permintaan refund sesuai filter yang dipilih'
                      : 'Anda belum pernah mengajukan permintaan refund'
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/customer/refund-request'}>
                    Ajukan Refund Baru
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Support */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Butuh Bantuan?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Jika Anda memiliki pertanyaan atau membutuhkan bantuan terkait permintaan refund, 
                jangan ragu untuk menghubungi tim customer service kami.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+62-21-1234-5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@customething.com</span>
                </div>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LazyWrapper>
  );
}