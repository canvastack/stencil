/**
 * Stage Help Tooltip Component
 * 
 * Provides contextual help tooltips for complex business stages
 * Shows stage-specific guidance, requirements, and tips
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All content based on real business stages
 * - ✅ BUSINESS ALIGNMENT: Follows PT CEX business workflow
 * - ✅ CONTEXTUAL HELP: Stage-specific tooltips for complex stages
 * - ✅ ACCESSIBILITY: Proper ARIA labels and keyboard navigation
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
  FileText,
  Cog,
  Shield,
  Truck,
  Target,
  Info,
  ExternalLink,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { cn } from '@/lib/utils';

interface StageHelpContent {
  title: string;
  description: string;
  keyPoints: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: string;
  commonIssues?: string[];
  tips?: string[];
  documentationLinks?: DocumentationLink[];
  businessRules?: BusinessRule[];
}

interface DocumentationLink {
  label: string;
  url: string;
  description: string;
  type: 'internal' | 'external';
}

interface BusinessRule {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'helpful';
  tooltip?: string;
}

interface StageHelpTooltipProps {
  stage: BusinessStage;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function StageHelpTooltip({
  stage,
  children,
  side = 'top',
  align = 'center',
  className
}: StageHelpTooltipProps) {
  
  // Get help content for each stage
  const getStageHelpContent = (stage: BusinessStage): StageHelpContent => {
    switch (stage) {
      case BusinessStage.DRAFT:
        return {
          title: 'Pesanan Baru',
          description: 'Tahap awal dimana pesanan baru diterima dan perlu direview.',
          keyPoints: [
            'Periksa kelengkapan spesifikasi produk',
            'Validasi informasi kontak customer',
            'Pastikan semua detail pesanan jelas'
          ],
          complexity: 'simple',
          estimatedTime: '1-2 hari',
          tips: [
            'Hubungi customer jika ada spesifikasi yang tidak jelas',
            'Dokumentasikan semua permintaan khusus',
            'Gunakan enhanced status display untuk validasi',
            'Manfaatkan quick action buttons untuk efisiensi'
          ]
        };

      case BusinessStage.PENDING:
        return {
          title: 'Review Admin',
          description: 'Admin telah mereview pesanan dan siap untuk diproses lebih lanjut.',
          keyPoints: [
            'Pesanan sudah divalidasi admin',
            'Siap untuk pencarian vendor',
            'Semua informasi sudah lengkap'
          ],
          complexity: 'simple',
          estimatedTime: '2-3 hari'
        };

      case BusinessStage.VENDOR_SOURCING:
        return {
          title: 'Pencarian Vendor',
          description: 'Tahap kompleks untuk mencari dan mengevaluasi vendor yang sesuai.',
          keyPoints: [
            'Cari minimal 3 vendor untuk perbandingan',
            'Evaluasi kapasitas dan kualitas vendor',
            'Pertimbangkan lokasi untuk efisiensi pengiriman'
          ],
          complexity: 'complex',
          estimatedTime: '3-5 hari',
          commonIssues: [
            'Vendor tidak merespon RFQ',
            'Harga terlalu tinggi dari semua vendor',
            'Kapasitas vendor tidak mencukupi'
          ],
          tips: [
            'Siapkan RFQ yang detail dan jelas',
            'Berikan deadline yang realistis untuk respon',
            'Periksa track record vendor sebelumnya',
            'Gunakan interactive timeline untuk tracking progress',
            'Manfaatkan actionable modal untuk vendor communication'
          ],
          documentationLinks: [
            {
              label: 'Enhanced Vendor Management Guide',
              url: '/docs/USER_DOCUMENTATION/TENANTS/VENDOR_MANAGEMENT_USER_GUIDE.md',
              description: 'Panduan lengkap pengelolaan vendor dengan fitur terbaru',
              type: 'internal'
            },
            {
              label: 'Order Status Workflow Components',
              url: '/docs/DEVELOPMENT/ORDER_STATUS_WORKFLOW_COMPONENTS.md',
              description: 'Dokumentasi teknis komponen workflow terbaru',
              type: 'internal'
            },
            {
              label: 'RFQ Best Practices',
              url: '/admin/documentation#rfq-guidelines',
              description: 'Panduan membuat RFQ yang efektif dengan sistem terbaru',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'min-vendor-rule',
              title: 'Minimum 3 Vendor',
              description: 'Wajib menghubungi minimal 3 vendor',
              importance: 'critical',
              tooltip: 'Memastikan kompetisi harga dan kualitas terbaik. Enhanced timeline akan tracking progress vendor sourcing.'
            }
          ]
        };

      case BusinessStage.VENDOR_NEGOTIATION:
        return {
          title: 'Negosiasi Vendor',
          description: 'Negosiasi harga, timeline, dan syarat dengan vendor terpilih.',
          keyPoints: [
            'Negosiasi harga yang kompetitif',
            'Tentukan timeline produksi yang realistis',
            'Sepakati syarat pembayaran dan kualitas'
          ],
          complexity: 'complex',
          estimatedTime: '2-4 hari',
          commonIssues: [
            'Vendor tidak mau turun harga',
            'Timeline terlalu lama',
            'Syarat pembayaran tidak sesuai'
          ],
          tips: [
            'Dokumentasikan semua kesepakatan',
            'Minta garansi kualitas dari vendor',
            'Diskusikan penalty untuk keterlambatan',
            'Gunakan enhanced timeline untuk tracking agreements',
            'Manfaatkan contextual help untuk guidance'
          ],
          documentationLinks: [
            {
              label: 'Enhanced Negotiation Guidelines',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_MANAGEMENT_GUIDE.md#vendor-negotiation',
              description: 'Panduan negosiasi dengan vendor menggunakan sistem terbaru',
              type: 'internal'
            },
            {
              label: 'Contract Templates',
              url: '/admin/vendors/contract-templates',
              description: 'Template kontrak standar',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'written-agreement',
              title: 'Kesepakatan Tertulis',
              description: 'Semua kesepakatan harus didokumentasikan',
              importance: 'critical',
              tooltip: 'Mencegah miskomunikasi dan sengketa. Gunakan fitur note-taking di enhanced timeline untuk dokumentasi real-time.'
            }
          ]
        };

      case BusinessStage.CUSTOMER_QUOTE:
        return {
          title: 'Quote Customer',
          description: 'Menyiapkan dan mengirim quotation kepada customer.',
          keyPoints: [
            'Hitung margin keuntungan yang sesuai',
            'Sertakan breakdown harga yang jelas',
            'Cantumkan timeline dan syarat pembayaran'
          ],
          complexity: 'moderate',
          estimatedTime: '1-2 hari',
          tips: [
            'Berikan opsi pembayaran yang fleksibel',
            'Sertakan terms and conditions',
            'Pastikan quote sudah diapprove manajemen',
            'Gunakan status action panel untuk tracking approval',
            'Manfaatkan enhanced quote templates'
          ]
        };

      case BusinessStage.AWAITING_PAYMENT:
        return {
          title: 'Menunggu Pembayaran',
          description: 'Quote telah dikirim, menunggu konfirmasi dan pembayaran customer.',
          keyPoints: [
            'Follow up customer secara berkala',
            'Siapkan invoice dan kontrak',
            'Monitor status pembayaran'
          ],
          complexity: 'simple',
          estimatedTime: '3-7 hari',
          commonIssues: [
            'Customer tidak merespon quote',
            'Customer minta revisi harga',
            'Proses approval customer lama'
          ],
          tips: [
            'Follow up dalam 2-3 hari setelah quote dikirim',
            'Berikan opsi pembayaran yang mudah',
            'Siapkan kontrak untuk ditandatangani',
            'Gunakan interactive timeline untuk tracking follow-up',
            'Manfaatkan automated reminders'
          ]
        };

      case BusinessStage.PARTIAL_PAYMENT:
        return {
          title: 'DP Diterima',
          description: 'Down payment (DP) 50% telah diterima dari customer.',
          keyPoints: [
            'Konfirmasi penerimaan DP',
            'Koordinasi dengan vendor untuk memulai produksi',
            'Setup tracking untuk sisa pembayaran'
          ],
          complexity: 'simple',
          estimatedTime: '1 hari'
        };

      case BusinessStage.FULL_PAYMENT:
        return {
          title: 'Pembayaran Lunas',
          description: 'Pembayaran telah diterima lengkap, siap memulai produksi.',
          keyPoints: [
            'Verifikasi pembayaran sudah masuk',
            'Notifikasi vendor untuk mulai produksi',
            'Buat Purchase Order resmi'
          ],
          complexity: 'simple',
          estimatedTime: '1 hari',
          tips: [
            'Konfirmasi pembayaran dalam 24 jam',
            'Kirim terima kasih ke customer',
            'Setup tracking produksi',
            'Gunakan status action panel untuk koordinasi',
            'Manfaatkan enhanced timeline untuk monitoring'
          ]
        };

      case BusinessStage.IN_PRODUCTION:
        return {
          title: 'Dalam Produksi',
          description: 'Produk sedang diproduksi oleh vendor, perlu monitoring berkala.',
          keyPoints: [
            'Monitor progress produksi secara berkala',
            'Lakukan quality check berkala',
            'Berikan update ke customer'
          ],
          complexity: 'moderate',
          estimatedTime: '5-10 hari',
          commonIssues: [
            'Keterlambatan produksi',
            'Masalah kualitas produk',
            'Komunikasi vendor kurang responsif'
          ],
          tips: [
            'Lakukan komunikasi rutin dengan vendor',
            'Minta foto progress produksi',
            'Siapkan backup plan jika ada masalah',
            'Gunakan actionable modal untuk tracking milestone',
            'Manfaatkan contextual guidance untuk best practices'
          ]
        };

      case BusinessStage.QUALITY_CONTROL:
        return {
          title: 'Quality Control',
          description: 'Pemeriksaan kualitas produk sebelum pengiriman ke customer.',
          keyPoints: [
            'Inspeksi menyeluruh sesuai spesifikasi',
            'Dokumentasi hasil QC dengan foto',
            'Approve atau reject untuk pengiriman'
          ],
          complexity: 'moderate',
          estimatedTime: '1-2 hari',
          commonIssues: [
            'Produk tidak sesuai spesifikasi',
            'Kualitas finishing kurang baik',
            'Ukuran tidak presisi'
          ],
          tips: [
            'Gunakan checklist QC yang komprehensif',
            'Foto semua aspek produk',
            'Jika reject, komunikasikan segera dengan vendor',
            'Manfaatkan enhanced documentation features',
            'Gunakan actionable modal untuk upload foto QC'
          ]
        };

      case BusinessStage.SHIPPING:
        return {
          title: 'Pengiriman',
          description: 'Produk sedang dalam proses pengiriman ke customer.',
          keyPoints: [
            'Koordinasi dengan kurir terpercaya',
            'Pastikan packaging aman',
            'Berikan tracking number ke customer'
          ],
          complexity: 'simple',
          estimatedTime: '1-3 hari',
          tips: [
            'Pilih kurir yang reliable dan trackable',
            'Asuransikan produk untuk nilai tinggi',
            'Siapkan customer service untuk pertanyaan',
            'Gunakan enhanced timeline untuk real-time tracking',
            'Manfaatkan automated notifications untuk updates'
          ]
        };

      case BusinessStage.COMPLETED:
        return {
          title: 'Selesai',
          description: 'Pesanan telah selesai dan diterima customer dengan baik.',
          keyPoints: [
            'Konfirmasi penerimaan dari customer',
            'Kumpulkan feedback dan review',
            'Tutup pesanan dan update database'
          ],
          complexity: 'simple',
          estimatedTime: 'Selesai',
          tips: [
            'Follow up untuk memastikan kepuasan customer',
            'Minta testimoni untuk marketing',
            'Dokumentasikan lessons learned',
            'Gunakan enhanced feedback collection system',
            'Manfaatkan completion analytics untuk improvement'
          ]
        };

      default:
        return {
          title: 'Tahap Tidak Dikenal',
          description: 'Informasi tahap tidak tersedia.',
          keyPoints: [],
          complexity: 'simple',
          estimatedTime: 'Tidak diketahui'
        };
    }
  };

  const helpContent = getStageHelpContent(stage);
  const stageInfo = OrderProgressCalculator.getStageInfo(stage);

  // Get complexity color
  const getComplexityColor = (complexity: 'simple' | 'moderate' | 'complex') => {
    switch (complexity) {
      case 'simple':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'complex':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get complexity icon
  const getComplexityIcon = (complexity: 'simple' | 'moderate' | 'complex') => {
    switch (complexity) {
      case 'simple':
        return CheckCircle2;
      case 'moderate':
        return Clock;
      case 'complex':
        return AlertCircle;
      default:
        return Info;
    }
  };

  // Get business rule importance color
  const getImportanceColor = (importance: 'critical' | 'important' | 'helpful') => {
    switch (importance) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'important':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'helpful':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const ComplexityIcon = getComplexityIcon(helpContent.complexity);

  // Only show tooltip for moderate and complex stages, or if explicitly requested
  const shouldShowTooltip = helpContent.complexity !== 'simple';

  if (!shouldShowTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-sm p-4 space-y-3"
          sideOffset={8}
        >
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{helpContent.title}</h4>
              <Badge variant="outline" className={cn("text-xs", getComplexityColor(helpContent.complexity))}>
                <ComplexityIcon className="w-3 h-3 mr-1" />
                {helpContent.complexity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{helpContent.description}</p>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Estimasi: {helpContent.estimatedTime}</span>
          </div>

          {/* Key Points */}
          {helpContent.keyPoints.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Key Points:</p>
              <ul className="space-y-1">
                {helpContent.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Issues */}
          {helpContent.commonIssues && helpContent.commonIssues.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Common Issues:
              </p>
              <ul className="space-y-1">
                {helpContent.commonIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs text-red-700">
                    <div className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {helpContent.tips && helpContent.tips.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Tips:
              </p>
              <ul className="space-y-1">
                {helpContent.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs text-blue-700">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documentation Links */}
          {helpContent.documentationLinks && helpContent.documentationLinks.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Documentation:
              </p>
              <ul className="space-y-1">
                {helpContent.documentationLinks.map((link, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs">
                    <div className="flex-shrink-0 mt-1">
                      {link.type === 'external' ? (
                        <ExternalLink className="w-2 h-2 text-green-500" />
                      ) : (
                        <FileText className="w-2 h-2 text-green-500" />
                      )}
                    </div>
                    <a 
                      href={link.url}
                      target={link.type === 'external' ? '_blank' : '_self'}
                      rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                      className="text-green-700 hover:text-green-900 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Business Rules */}
          {helpContent.businessRules && helpContent.businessRules.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Business Rules:
              </p>
              <ul className="space-y-1">
                {helpContent.businessRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-1 text-xs">
                    <div className="flex-shrink-0 mt-1">
                      {rule.importance === 'critical' ? (
                        <AlertTriangle className="w-2 h-2 text-red-500" />
                      ) : rule.importance === 'important' ? (
                        <AlertCircle className="w-2 h-2 text-orange-500" />
                      ) : (
                        <Info className="w-2 h-2 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-orange-700 font-medium">{rule.title}</span>
                      {rule.tooltip && (
                        <div className="text-orange-600 mt-0.5">{rule.tooltip}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Help Indicator */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <HelpCircle className="w-3 h-3" />
              <span>Click stage for detailed actions</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default StageHelpTooltip;