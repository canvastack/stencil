import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/lazy-components';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Camera,
  Paperclip,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { RefundReason, RefundType } from '@/types/refund';

// Mock order data - replace with real API call
const mockOrder = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  orderNumber: 'ORD-20241208-001',
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  customerPhone: '+62812345678',
  createdAt: '2024-12-01T10:30:00Z',
  totalAmount: 1250000,
  status: 'completed',
  items: [
    {
      id: '1',
      productName: 'Custom Metal Etching - Logo Perusahaan',
      quantity: 1,
      price: 1250000,
      specifications: 'Material: Stainless Steel 304, Size: 30x20cm, Thickness: 2mm'
    }
  ],
  vendorInfo: {
    name: 'PT Etching Specialist',
    status: 'paid',
    paidAmount: 875000
  }
};

const refundReasons = [
  { value: RefundReason.CustomerRequest, label: 'Berubah pikiran / tidak jadi pesan' },
  { value: RefundReason.QualityIssue, label: 'Kualitas produk tidak sesuai' },
  { value: RefundReason.TimelineDelay, label: 'Keterlambatan pengiriman' },
  { value: RefundReason.ProductionError, label: 'Kesalahan produksi' },
  { value: RefundReason.ShippingDamage, label: 'Kerusakan saat pengiriman' },
  { value: RefundReason.Other, label: 'Lainnya' },
];

const refundTypes = [
  { value: RefundType.FullRefund, label: 'Refund penuh' },
  { value: RefundType.PartialRefund, label: 'Refund sebagian' },
  { value: RefundType.ReplacementOrder, label: 'Ganti dengan pesanan baru' },
  { value: RefundType.CreditNote, label: 'Credit untuk pesanan berikutnya' },
];

export default function CustomerRefundRequest() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    refundReason: '',
    refundType: '',
    customerRequestAmount: '',
    customerNotes: '',
    qualityIssueDescription: '',
    timelineExpectation: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'video/mp4', 'video/mov'];
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 5MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Format file ${file.name} tidak didukung.`);
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.refundReason) {
      toast.error('Pilih alasan refund');
      return false;
    }
    
    if (!formData.refundType) {
      toast.error('Pilih jenis refund yang diinginkan');
      return false;
    }
    
    if (!formData.customerNotes.trim()) {
      toast.error('Berikan penjelasan detail tentang permintaan refund');
      return false;
    }
    
    if (formData.refundReason === RefundReason.QualityIssue && !formData.qualityIssueDescription.trim()) {
      toast.error('Jelaskan masalah kualitas yang dialami');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Permintaan refund berhasil diajukan! Tim kami akan meninjau dalam 1-2 hari kerja.');
      navigate('/customer/refund-status');
    } catch (error) {
      toast.error('Gagal mengajukan permintaan refund. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstimatedProcessTime = () => {
    const reason = formData.refundReason as RefundReason;
    switch (reason) {
      case RefundReason.CustomerRequest:
        return mockOrder.vendorInfo.status === 'paid' ? '3-5 hari kerja' : '1-2 hari kerja';
      case RefundReason.QualityIssue:
        return '5-7 hari kerja';
      case RefundReason.TimelineDelay:
        return '2-3 hari kerja';
      default:
        return '3-5 hari kerja';
    }
  };

  const getRefundEstimate = () => {
    const reason = formData.refundReason as RefundReason;
    const type = formData.refundType as RefundType;
    
    if (type === RefundType.ReplacementOrder || type === RefundType.CreditNote) {
      return 'Senilai pesanan asli';
    }
    
    switch (reason) {
      case RefundReason.CustomerRequest:
        if (mockOrder.vendorInfo.status === 'paid') {
          const refundable = mockOrder.totalAmount - mockOrder.vendorInfo.paidAmount;
          return `Rp ${refundable.toLocaleString('id-ID')} (dikurangi biaya produksi yang sudah dibayar)`;
        }
        return `Rp ${mockOrder.totalAmount.toLocaleString('id-ID')} (refund penuh)`;
      case RefundReason.QualityIssue:
        return type === RefundType.FullRefund 
          ? `Rp ${mockOrder.totalAmount.toLocaleString('id-ID')} (refund penuh)`
          : 'Akan dihitung berdasarkan tingkat masalah kualitas';
      default:
        return 'Akan dihitung berdasarkan investigasi';
    }
  };

  return (
    <LazyWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ajukan Permintaan Refund
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Isi formulir di bawah untuk mengajukan permintaan refund pesanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informasi Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nomor Pesanan</Label>
                      <p className="text-lg font-mono">{mockOrder.orderNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status Pesanan</Label>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {mockOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Pesanan</Label>
                      <p className="text-lg font-semibold">Rp {mockOrder.totalAmount.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tanggal Pesanan</Label>
                      <p>{format(new Date(mockOrder.createdAt), 'dd MMMM yyyy', { locale: id })}</p>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium mb-2 block">Item Pesanan</Label>
                    {mockOrder.items.map(item => (
                      <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.specifications}</p>
                        <p className="text-sm">Qty: {item.quantity} × Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refund Request Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Detail Permintaan Refund</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Refund Reason */}
                  <div>
                    <Label htmlFor="refundReason">Alasan Refund *</Label>
                    <Select value={formData.refundReason} onValueChange={(value) => handleInputChange('refundReason', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih alasan refund" />
                      </SelectTrigger>
                      <SelectContent>
                        {refundReasons.map(reason => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refund Type */}
                  <div>
                    <Label htmlFor="refundType">Jenis Refund yang Diinginkan *</Label>
                    <Select value={formData.refundType} onValueChange={(value) => handleInputChange('refundType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis refund" />
                      </SelectTrigger>
                      <SelectContent>
                        {refundTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Fields */}
                  {formData.refundType === RefundType.PartialRefund && (
                    <div>
                      <Label htmlFor="customerRequestAmount">Jumlah Refund yang Diminta</Label>
                      <Input
                        id="customerRequestAmount"
                        type="number"
                        placeholder="Masukkan jumlah dalam rupiah"
                        value={formData.customerRequestAmount}
                        onChange={(e) => handleInputChange('customerRequestAmount', e.target.value)}
                      />
                    </div>
                  )}

                  {formData.refundReason === RefundReason.QualityIssue && (
                    <div>
                      <Label htmlFor="qualityIssueDescription">Deskripsi Masalah Kualitas *</Label>
                      <Textarea
                        id="qualityIssueDescription"
                        placeholder="Jelaskan masalah kualitas yang dialami secara detail"
                        value={formData.qualityIssueDescription}
                        onChange={(e) => handleInputChange('qualityIssueDescription', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {formData.refundReason === RefundReason.TimelineDelay && (
                    <div>
                      <Label htmlFor="timelineExpectation">Timeline Pengiriman yang Diharapkan</Label>
                      <Input
                        id="timelineExpectation"
                        type="date"
                        value={formData.timelineExpectation}
                        onChange={(e) => handleInputChange('timelineExpectation', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Customer Notes */}
                  <div>
                    <Label htmlFor="customerNotes">Penjelasan Detail *</Label>
                    <Textarea
                      id="customerNotes"
                      placeholder="Berikan penjelasan detail tentang permintaan refund Anda"
                      value={formData.customerNotes}
                      onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label>Bukti Pendukung</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Upload foto, video, atau dokumen pendukung (Max 5MB per file)
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Klik untuk upload file atau drag & drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, PDF, MP4 (Max 5MB)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              {file.type.startsWith('image/') ? (
                                <Camera className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Paperclip className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Refund Estimate */}
              {formData.refundReason && formData.refundType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Estimasi Refund
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Estimasi Jumlah</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {getRefundEstimate()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estimasi Waktu Proses</Label>
                      <p className="text-sm">{getEstimatedProcessTime()}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        * Estimasi ini bersifat sementara dan dapat berubah setelah review oleh tim kami
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Bantuan & Kontak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>+62-21-1234-5678</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>support@customething.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>Live Chat (09:00-17:00 WIB)</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tim customer service kami siap membantu Anda 24/7
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Informasi Penting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2">
                    <li>• Permintaan refund akan diproses sesuai kebijakan perusahaan</li>
                    <li>• Bukti pendukung akan membantu mempercepat proses review</li>
                    <li>• Anda akan menerima email konfirmasi setelah pengajuan</li>
                    <li>• Tim kami akan menghubungi Anda untuk update status</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="lg" 
                  disabled={isSubmitting || !formData.refundReason || !formData.refundType || !formData.customerNotes}
                >
                  {isSubmitting ? 'Mengirim...' : 'Ajukan Permintaan Refund'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Pengajuan Refund</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin mengajukan permintaan refund untuk pesanan {mockOrder.orderNumber}? 
                    Setelah diajukan, tim kami akan meninjau permintaan Anda dalam 1-2 hari kerja.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim...' : 'Ya, Ajukan Refund'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </LazyWrapper>
  );
}