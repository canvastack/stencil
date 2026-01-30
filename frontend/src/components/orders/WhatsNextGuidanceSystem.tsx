/**
 * What's Next Guidance System Component
 * 
 * Provides contextual guidance for order status workflow
 * Shows suggested next actions, requirements, and help tooltips
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All guidance based on real business stages
 * - ✅ BUSINESS ALIGNMENT: Follows PT CEX business workflow
 * - ✅ CONTEXTUAL HELP: Stage-specific guidance and tooltips
 * - ✅ ACTION-ORIENTED: Clear next steps for each stage
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Info,
  ChevronRight,
  Lightbulb,
  Target,
  HelpCircle,
  Zap,
  Timer,
  Users,
  DollarSign,
  Truck,
  Shield,
  Cog,
  ExternalLink,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: React.ComponentType<any>;
  actionType: 'primary' | 'secondary' | 'info';
  onClick?: () => void;
}

interface StageRequirement {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  helpText?: string;
}

interface GuidanceContent {
  title: string;
  description: string;
  suggestedActions: SuggestedAction[];
  requirements: StageRequirement[];
  tips: string[];
  estimatedDuration: string;
  complexity: 'simple' | 'moderate' | 'complex';
  stakeholders: string[];
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

interface WhatsNextGuidanceSystemProps {
  currentStatus: OrderStatus;
  currentStage: BusinessStage;
  nextStage: BusinessStage | null;
  completedStages: BusinessStage[];
  timeline?: any[];
  userPermissions: string[];
  onActionClick?: (actionId: string, stage: BusinessStage) => void;
  compact?: boolean;
}

export function WhatsNextGuidanceSystem({
  currentStatus,
  currentStage,
  nextStage,
  completedStages,
  timeline = [],
  userPermissions,
  onActionClick,
  compact = false
}: WhatsNextGuidanceSystemProps) {
  
  // Get comprehensive guidance content for current stage
  const getGuidanceContent = (stage: BusinessStage): GuidanceContent => {
    const stageInfo = OrderProgressCalculator.getStageInfo(stage);
    
    switch (stage) {
      case BusinessStage.DRAFT:
        return {
          title: 'Pesanan Baru Diterima',
          description: 'Pesanan baru telah diterima dan menunggu review admin untuk memulai proses.',
          suggestedActions: [
            {
              id: 'review-order',
              label: 'Review Pesanan',
              description: 'Periksa detail pesanan dan spesifikasi produk',
              priority: 'high',
              estimatedTime: '15 menit',
              icon: FileText,
              actionType: 'primary',
              onClick: () => onActionClick?.('review-order', stage)
            },
            {
              id: 'validate-specs',
              label: 'Validasi Spesifikasi',
              description: 'Pastikan spesifikasi produk lengkap dan jelas',
              priority: 'high',
              estimatedTime: '10 menit',
              icon: CheckCircle2,
              actionType: 'primary'
            },
            {
              id: 'submit-for-processing',
              label: 'Submit untuk Diproses',
              description: 'Lanjutkan ke tahap pencarian vendor',
              priority: 'medium',
              estimatedTime: '5 menit',
              icon: ArrowRight,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'complete-specs',
              label: 'Spesifikasi Lengkap',
              description: 'Semua detail produk harus lengkap',
              completed: true,
              required: true,
              helpText: 'Pastikan material, ukuran, dan desain sudah jelas'
            },
            {
              id: 'customer-contact',
              label: 'Kontak Customer Valid',
              description: 'Informasi kontak customer harus valid',
              completed: true,
              required: true
            }
          ],
          tips: [
            'Periksa kelengkapan spesifikasi sebelum melanjutkan',
            'Pastikan kontak customer dapat dihubungi',
            'Dokumentasikan catatan khusus dari customer',
            'Gunakan enhanced status display untuk validasi kelengkapan',
            'Manfaatkan quick action buttons di header untuk efisiensi'
          ],
          estimatedDuration: '1-2 hari',
          complexity: 'simple',
          stakeholders: ['Admin', 'Customer Service'],
          documentationLinks: [
            {
              label: 'Enhanced Order Status Management Guide',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_MANAGEMENT_GUIDE.md',
              description: 'Panduan lengkap sistem manajemen status order yang telah diperbaharui',
              type: 'internal'
            },
            {
              label: 'Admin Training Materials',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ADMIN_TRAINING_ORDER_STATUS_WORKFLOW.md',
              description: 'Materi pelatihan lengkap untuk admin dengan sertifikasi',
              type: 'internal'
            },
            {
              label: 'Quick Reference Guide',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_QUICK_REFERENCE.md',
              description: 'Panduan referensi cepat untuk workflow harian',
              type: 'internal'
            },
            {
              label: 'Business Management Documentation',
              url: '/docs/USER_DOCUMENTATION/TENANTS/02-BUSINESS_MANAGEMENT.md',
              description: 'Dokumentasi workflow bisnis lengkap',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'spec-validation',
              title: 'Validasi Spesifikasi Wajib',
              description: 'Semua pesanan harus memiliki spesifikasi lengkap sebelum dapat diproses',
              importance: 'critical',
              tooltip: 'Pesanan tanpa spesifikasi lengkap akan ditolak sistem. Gunakan enhanced status display untuk memvalidasi kelengkapan.'
            },
            {
              id: 'customer-verification',
              title: 'Verifikasi Kontak Customer',
              description: 'Kontak customer harus diverifikasi untuk komunikasi selanjutnya',
              importance: 'important',
              tooltip: 'Gunakan email atau telepon untuk verifikasi. Status card akan menampilkan informasi kontak yang terverifikasi.'
            },
            {
              id: 'interactive-timeline',
              title: 'Gunakan Interactive Timeline',
              description: 'Manfaatkan timeline interaktif untuk navigasi yang lebih efisien',
              importance: 'helpful',
              tooltip: 'Click pada stage untuk melihat aksi yang tersedia. Timeline baru mendukung hover effects dan contextual actions.'
            }
          ]
        };

      case BusinessStage.PENDING:
        return {
          title: 'Siap untuk Diproses',
          description: 'Review admin selesai, pesanan siap untuk memulai proses pencarian vendor.',
          suggestedActions: [
            {
              id: 'start-vendor-sourcing',
              label: 'Mulai Pencarian Vendor',
              description: 'Cari vendor yang sesuai dengan spesifikasi produk',
              priority: 'high',
              estimatedTime: '30 menit',
              icon: Users,
              actionType: 'primary'
            },
            {
              id: 'prepare-rfq',
              label: 'Siapkan RFQ',
              description: 'Buat Request for Quotation untuk vendor',
              priority: 'medium',
              estimatedTime: '20 menit',
              icon: FileText,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'vendor-database',
              label: 'Database Vendor',
              description: 'Akses ke database vendor yang sesuai',
              completed: true,
              required: true
            },
            {
              id: 'product-category',
              label: 'Kategori Produk',
              description: 'Kategori produk sudah ditentukan',
              completed: true,
              required: true
            }
          ],
          tips: [
            'Pilih minimal 3 vendor untuk perbandingan',
            'Pertimbangkan lokasi vendor untuk efisiensi pengiriman',
            'Periksa track record vendor sebelumnya',
            'Gunakan interactive timeline untuk tracking progress',
            'Manfaatkan status action panel untuk monitoring real-time'
          ],
          estimatedDuration: '2-3 hari',
          complexity: 'moderate',
          stakeholders: ['Procurement', 'Vendor Relations']
        };

      case BusinessStage.VENDOR_SOURCING:
        return {
          title: 'Pencarian Vendor',
          description: 'Sedang mencari dan mengevaluasi vendor yang sesuai dengan kebutuhan produksi.',
          suggestedActions: [
            {
              id: 'contact-vendors',
              label: 'Hubungi Vendor',
              description: 'Kirim RFQ ke vendor-vendor potensial',
              priority: 'high',
              estimatedTime: '1 jam',
              icon: Users,
              actionType: 'primary'
            },
            {
              id: 'evaluate-responses',
              label: 'Evaluasi Respon',
              description: 'Bandingkan penawaran dari berbagai vendor',
              priority: 'high',
              estimatedTime: '45 menit',
              icon: Target,
              actionType: 'primary'
            },
            {
              id: 'shortlist-vendors',
              label: 'Buat Shortlist',
              description: 'Pilih 2-3 vendor terbaik untuk negosiasi',
              priority: 'medium',
              estimatedTime: '30 menit',
              icon: CheckCircle2,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'min-vendors',
              label: 'Minimal 3 Vendor',
              description: 'Harus menghubungi minimal 3 vendor',
              completed: false,
              required: true,
              helpText: 'Untuk memastikan harga kompetitif dan kualitas terbaik'
            },
            {
              id: 'vendor-qualification',
              label: 'Kualifikasi Vendor',
              description: 'Vendor harus memenuhi standar kualitas',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Berikan spesifikasi yang detail kepada vendor',
            'Tanyakan tentang kapasitas produksi dan timeline',
            'Minta sample jika memungkinkan',
            'Periksa sertifikasi dan pengalaman vendor',
            'Gunakan actionable stage modal untuk tracking vendor responses',
            'Manfaatkan enhanced timeline untuk dokumentasi komunikasi'
          ],
          estimatedDuration: '3-5 hari',
          complexity: 'complex',
          stakeholders: ['Procurement', 'Quality Assurance', 'Vendor Relations'],
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
              label: 'Vendor Developer Guide',
              url: '/docs/USER_DOCUMENTATION/DEVELOPER/VENDOR_MANAGEMENT_DEVELOPER_GUIDE.md',
              description: 'Panduan teknis integrasi vendor',
              type: 'internal'
            },
            {
              label: 'RFQ Template',
              url: '/admin/vendors/rfq-template',
              description: 'Template Request for Quotation standar',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'min-vendor-rule',
              title: 'Minimum 3 Vendor Requirement',
              description: 'Setiap pencarian vendor harus melibatkan minimal 3 vendor untuk memastikan kompetisi harga',
              importance: 'critical',
              tooltip: 'Aturan ini memastikan harga terbaik dan kualitas optimal untuk customer. Gunakan status action panel untuk tracking progress.'
            },
            {
              id: 'vendor-qualification',
              title: 'Standar Kualifikasi Vendor',
              description: 'Vendor harus memiliki sertifikasi dan track record yang baik',
              importance: 'critical',
              tooltip: 'Periksa portfolio, sertifikat, dan review dari customer sebelumnya. Interactive timeline akan menampilkan vendor yang telah dikualifikasi.'
            },
            {
              id: 'response-timeline',
              title: 'Timeline Respon Vendor',
              description: 'Vendor harus merespon RFQ dalam maksimal 48 jam',
              importance: 'important',
              tooltip: 'Vendor yang tidak responsif dapat mempengaruhi timeline keseluruhan. Sistem akan memberikan notifikasi otomatis untuk follow-up.'
            },
            {
              id: 'enhanced-tracking',
              title: 'Enhanced Progress Tracking',
              description: 'Gunakan fitur tracking terbaru untuk monitoring vendor sourcing',
              importance: 'helpful',
              tooltip: 'Timeline interaktif dan status action panel memberikan visibility real-time untuk progress vendor sourcing.'
            }
          ]
        };

      case BusinessStage.VENDOR_NEGOTIATION:
        return {
          title: 'Negosiasi dengan Vendor',
          description: 'Melakukan negosiasi harga, timeline, dan syarat-syarat dengan vendor terpilih.',
          suggestedActions: [
            {
              id: 'negotiate-price',
              label: 'Negosiasi Harga',
              description: 'Negosiasi harga terbaik dengan vendor',
              priority: 'high',
              estimatedTime: '1 jam',
              icon: DollarSign,
              actionType: 'primary'
            },
            {
              id: 'discuss-timeline',
              label: 'Bahas Timeline',
              description: 'Tentukan jadwal produksi dan pengiriman',
              priority: 'high',
              estimatedTime: '30 menit',
              icon: Timer,
              actionType: 'primary'
            },
            {
              id: 'finalize-terms',
              label: 'Finalisasi Syarat',
              description: 'Sepakati semua syarat dan kondisi',
              priority: 'medium',
              estimatedTime: '45 menit',
              icon: CheckCircle2,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'price-comparison',
              label: 'Perbandingan Harga',
              description: 'Bandingkan harga dari minimal 2 vendor',
              completed: false,
              required: true
            },
            {
              id: 'quality-standards',
              label: 'Standar Kualitas',
              description: 'Vendor setuju dengan standar kualitas',
              completed: false,
              required: true
            },
            {
              id: 'delivery-terms',
              label: 'Syarat Pengiriman',
              description: 'Timeline pengiriman sudah disepakati',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Dokumentasikan semua kesepakatan secara tertulis',
            'Pastikan vendor memahami spesifikasi dengan jelas',
            'Diskusikan penalty untuk keterlambatan',
            'Minta garansi kualitas dari vendor',
            'Gunakan enhanced timeline untuk tracking semua commitment',
            'Manfaatkan contextual help untuk guidance negosiasi'
          ],
          estimatedDuration: '2-4 hari',
          complexity: 'complex',
          stakeholders: ['Procurement', 'Legal', 'Finance'],
          documentationLinks: [
            {
              label: 'Enhanced Negotiation Best Practices',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_MANAGEMENT_GUIDE.md#vendor-negotiation',
              description: 'Panduan negosiasi dengan vendor menggunakan sistem terbaru',
              type: 'internal'
            },
            {
              label: 'Contract Templates',
              url: '/admin/vendors/contract-templates',
              description: 'Template kontrak standar dengan vendor',
              type: 'internal'
            },
            {
              label: 'Order Status API Integration',
              url: '/docs/DEVELOPMENT/ORDER_STATUS_API_INTEGRATION.md',
              description: 'Dokumentasi API untuk integrasi status order',
              type: 'internal'
            },
            {
              label: 'Legal Guidelines',
              url: '/docs/USER_DOCUMENTATION/TENANTS/03-TECHNICAL_INTEGRATION.md#legal-compliance',
              description: 'Panduan aspek legal dalam kontrak vendor',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'price-comparison-rule',
              title: 'Wajib Bandingkan Harga',
              description: 'Harus membandingkan harga dari minimal 2 vendor sebelum memutuskan',
              importance: 'critical',
              tooltip: 'Memastikan harga terbaik untuk customer dan margin optimal. Status action panel akan menampilkan perbandingan harga secara visual.'
            },
            {
              id: 'written-agreement',
              title: 'Kesepakatan Tertulis',
              description: 'Semua kesepakatan harus didokumentasikan secara tertulis',
              importance: 'critical',
              tooltip: 'Mencegah miskomunikasi dan sengketa di kemudian hari. Gunakan fitur note-taking di timeline untuk dokumentasi real-time.'
            },
            {
              id: 'quality-guarantee',
              title: 'Garansi Kualitas',
              description: 'Vendor harus memberikan garansi kualitas produk',
              importance: 'important',
              tooltip: 'Melindungi kepentingan customer dan reputasi perusahaan. Enhanced timeline akan tracking semua commitment vendor.'
            },
            {
              id: 'actionable-modal-usage',
              title: 'Gunakan Actionable Stage Modal',
              description: 'Manfaatkan modal interaktif untuk negosiasi yang lebih efisien',
              importance: 'helpful',
              tooltip: 'Modal baru menyediakan context-aware actions dan real-time guidance untuk setiap tahap negosiasi.'
            }
          ]
        };

      case BusinessStage.CUSTOMER_QUOTE:
        return {
          title: 'Quote ke Customer',
          description: 'Menyiapkan dan mengirim quotation kepada customer berdasarkan negosiasi dengan vendor.',
          suggestedActions: [
            {
              id: 'prepare-quote',
              label: 'Siapkan Quote',
              description: 'Buat quotation detail untuk customer',
              priority: 'high',
              estimatedTime: '45 menit',
              icon: FileText,
              actionType: 'primary'
            },
            {
              id: 'add-markup',
              label: 'Hitung Margin',
              description: 'Tambahkan margin keuntungan yang sesuai',
              priority: 'high',
              estimatedTime: '15 menit',
              icon: DollarSign,
              actionType: 'primary'
            },
            {
              id: 'send-quote',
              label: 'Kirim Quote',
              description: 'Kirim quotation ke customer',
              priority: 'medium',
              estimatedTime: '10 menit',
              icon: ArrowRight,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'vendor-final-price',
              label: 'Harga Final Vendor',
              description: 'Harga final dari vendor sudah dikonfirmasi',
              completed: false,
              required: true
            },
            {
              id: 'margin-calculation',
              label: 'Kalkulasi Margin',
              description: 'Margin keuntungan sudah dihitung',
              completed: false,
              required: true
            },
            {
              id: 'quote-approval',
              label: 'Approval Quote',
              description: 'Quote sudah disetujui manajemen',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Sertakan breakdown harga yang jelas',
            'Cantumkan timeline produksi dan pengiriman',
            'Berikan opsi pembayaran yang fleksibel',
            'Sertakan terms and conditions',
            'Gunakan status action panel untuk tracking approval',
            'Manfaatkan enhanced quote templates untuk konsistensi'
          ],
          estimatedDuration: '1-2 hari',
          complexity: 'moderate',
          stakeholders: ['Sales', 'Finance', 'Management'],
          documentationLinks: [
            {
              label: 'Enhanced Order Workflow Guide',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_WORKFLOW_GUIDE.md#customer-quote',
              description: 'Panduan lengkap tahap customer quote dengan fitur terbaru',
              type: 'internal'
            },
            {
              label: 'Order Status Management Guide',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_MANAGEMENT_GUIDE.md#quote-preparation',
              description: 'Panduan sistem manajemen status untuk tahap quote',
              type: 'internal'
            },
            {
              label: 'Pricing Guidelines',
              url: '/admin/documentation#pricing-strategy',
              description: 'Panduan strategi pricing dan margin',
              type: 'internal'
            },
            {
              label: 'Quote Templates',
              url: '/admin/quotes/templates',
              description: 'Template quotation standar',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'margin-approval',
              title: 'Approval Margin Wajib',
              description: 'Margin keuntungan harus disetujui manajemen sebelum quote dikirim',
              importance: 'critical',
              tooltip: 'Memastikan profitabilitas dan konsistensi pricing. Status action panel akan menampilkan status approval secara real-time.'
            },
            {
              id: 'quote-validity',
              title: 'Periode Validitas Quote',
              description: 'Quote harus memiliki periode validitas yang jelas',
              importance: 'important',
              tooltip: 'Melindungi dari fluktuasi harga vendor dan memaksa customer mengambil keputusan. Enhanced timeline akan tracking expiry dates.'
            },
            {
              id: 'enhanced-quote-tracking',
              title: 'Enhanced Quote Tracking',
              description: 'Gunakan sistem tracking terbaru untuk monitoring quote status',
              importance: 'helpful',
              tooltip: 'Interactive timeline dan actionable modals memberikan visibility penuh untuk status quote dan follow-up actions.'
            }
          ]
        };

      case BusinessStage.AWAITING_PAYMENT:
        return {
          title: 'Menunggu Pembayaran',
          description: 'Quote telah dikirim, menunggu konfirmasi dan pembayaran dari customer.',
          suggestedActions: [
            {
              id: 'follow-up-customer',
              label: 'Follow Up Customer',
              description: 'Hubungi customer untuk konfirmasi quote',
              priority: 'high',
              estimatedTime: '20 menit',
              icon: Users,
              actionType: 'primary'
            },
            {
              id: 'prepare-invoice',
              label: 'Siapkan Invoice',
              description: 'Buat invoice untuk pembayaran',
              priority: 'medium',
              estimatedTime: '15 menit',
              icon: FileText,
              actionType: 'secondary'
            },
            {
              id: 'setup-payment-tracking',
              label: 'Setup Payment Tracking',
              description: 'Siapkan sistem tracking pembayaran',
              priority: 'low',
              estimatedTime: '10 menit',
              icon: Target,
              actionType: 'info'
            }
          ],
          requirements: [
            {
              id: 'quote-sent',
              label: 'Quote Terkirim',
              description: 'Quote sudah dikirim ke customer',
              completed: true,
              required: true
            },
            {
              id: 'payment-terms',
              label: 'Syarat Pembayaran',
              description: 'Syarat pembayaran sudah jelas',
              completed: true,
              required: true
            }
          ],
          tips: [
            'Follow up dalam 2-3 hari setelah quote dikirim',
            'Berikan opsi pembayaran yang mudah',
            'Siapkan kontrak kerja untuk ditandatangani',
            'Dokumentasikan semua komunikasi dengan customer',
            'Gunakan interactive timeline untuk tracking follow-up',
            'Manfaatkan automated reminders untuk efisiensi'
          ],
          estimatedDuration: '3-7 hari',
          complexity: 'simple',
          stakeholders: ['Sales', 'Finance', 'Customer Service']
        };

      case BusinessStage.FULL_PAYMENT:
        return {
          title: 'Pembayaran Lunas',
          description: 'Pembayaran telah diterima lengkap, siap untuk memulai produksi.',
          suggestedActions: [
            {
              id: 'confirm-payment',
              label: 'Konfirmasi Pembayaran',
              description: 'Verifikasi pembayaran sudah masuk',
              priority: 'high',
              estimatedTime: '10 menit',
              icon: CheckCircle2,
              actionType: 'primary'
            },
            {
              id: 'notify-vendor',
              label: 'Notifikasi Vendor',
              description: 'Beritahu vendor untuk memulai produksi',
              priority: 'high',
              estimatedTime: '15 menit',
              icon: Users,
              actionType: 'primary'
            },
            {
              id: 'create-po',
              label: 'Buat Purchase Order',
              description: 'Buat PO resmi untuk vendor',
              priority: 'medium',
              estimatedTime: '30 menit',
              icon: FileText,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'payment-verified',
              label: 'Pembayaran Terverifikasi',
              description: 'Pembayaran sudah dikonfirmasi masuk',
              completed: false,
              required: true
            },
            {
              id: 'vendor-ready',
              label: 'Vendor Siap',
              description: 'Vendor siap memulai produksi',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Konfirmasi pembayaran dalam 24 jam',
            'Kirim konfirmasi terima kasih ke customer',
            'Pastikan vendor sudah siap memulai produksi',
            'Setup tracking produksi',
            'Gunakan status action panel untuk koordinasi vendor',
            'Manfaatkan enhanced timeline untuk monitoring progress'
          ],
          estimatedDuration: '1 hari',
          complexity: 'simple',
          stakeholders: ['Finance', 'Procurement', 'Production']
        };

      case BusinessStage.IN_PRODUCTION:
        return {
          title: 'Dalam Produksi',
          description: 'Produk sedang diproduksi oleh vendor, monitoring progress secara berkala.',
          suggestedActions: [
            {
              id: 'monitor-progress',
              label: 'Monitor Progress',
              description: 'Pantau kemajuan produksi vendor',
              priority: 'high',
              estimatedTime: '30 menit/hari',
              icon: Cog,
              actionType: 'primary'
            },
            {
              id: 'quality-check',
              label: 'Quality Check',
              description: 'Lakukan pengecekan kualitas berkala',
              priority: 'high',
              estimatedTime: '45 menit',
              icon: Shield,
              actionType: 'primary'
            },
            {
              id: 'update-customer',
              label: 'Update Customer',
              description: 'Berikan update progress ke customer',
              priority: 'medium',
              estimatedTime: '15 menit',
              icon: Users,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'production-started',
              label: 'Produksi Dimulai',
              description: 'Vendor sudah memulai produksi',
              completed: true,
              required: true
            },
            {
              id: 'quality-standards',
              label: 'Standar Kualitas',
              description: 'Standar kualitas sudah dikomunikasikan',
              completed: true,
              required: true
            }
          ],
          tips: [
            'Lakukan komunikasi rutin dengan vendor',
            'Minta foto progress produksi',
            'Siapkan quality control checklist',
            'Berikan update berkala ke customer',
            'Gunakan actionable modal untuk tracking milestone',
            'Manfaatkan contextual guidance untuk best practices'
          ],
          estimatedDuration: '5-10 hari',
          complexity: 'moderate',
          stakeholders: ['Production', 'Quality Assurance', 'Vendor Relations']
        };

      case BusinessStage.QUALITY_CONTROL:
        return {
          title: 'Quality Control',
          description: 'Melakukan pemeriksaan kualitas produk sebelum pengiriman ke customer.',
          suggestedActions: [
            {
              id: 'inspect-product',
              label: 'Inspeksi Produk',
              description: 'Lakukan inspeksi menyeluruh produk',
              priority: 'high',
              estimatedTime: '1 jam',
              icon: Shield,
              actionType: 'primary'
            },
            {
              id: 'document-qc',
              label: 'Dokumentasi QC',
              description: 'Dokumentasikan hasil quality control',
              priority: 'high',
              estimatedTime: '30 menit',
              icon: FileText,
              actionType: 'primary'
            },
            {
              id: 'approve-shipment',
              label: 'Approve Pengiriman',
              description: 'Setujui produk untuk dikirim',
              priority: 'medium',
              estimatedTime: '15 menit',
              icon: CheckCircle2,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'qc-checklist',
              label: 'QC Checklist',
              description: 'Checklist quality control sudah disiapkan',
              completed: false,
              required: true
            },
            {
              id: 'product-received',
              label: 'Produk Diterima',
              description: 'Produk sudah diterima dari vendor',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Gunakan checklist QC yang komprehensif',
            'Foto semua aspek produk untuk dokumentasi',
            'Jika ada masalah, komunikasikan segera dengan vendor',
            'Pastikan produk sesuai dengan spesifikasi awal',
            'Manfaatkan enhanced documentation features',
            'Gunakan actionable modal untuk upload foto QC'
          ],
          estimatedDuration: '1-2 hari',
          complexity: 'moderate',
          stakeholders: ['Quality Assurance', 'Production', 'Customer Service'],
          documentationLinks: [
            {
              label: 'Enhanced Quality Control Procedures',
              url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_WORKFLOW_GUIDE.md#quality-control',
              description: 'Panduan lengkap prosedur quality control dengan sistem terbaru',
              type: 'internal'
            },
            {
              label: 'Order Status Testing Guide',
              url: '/docs/DEVELOPMENT/ORDER_STATUS_TESTING_GUIDE.md',
              description: 'Panduan testing untuk quality control workflow',
              type: 'internal'
            },
            {
              label: 'QC Checklist Templates',
              url: '/admin/quality/checklists',
              description: 'Template checklist quality control',
              type: 'internal'
            },
            {
              label: 'Rejection Procedures',
              url: '/admin/documentation#quality-rejection',
              description: 'Prosedur penolakan dan rework produk',
              type: 'internal'
            }
          ],
          businessRules: [
            {
              id: 'mandatory-qc',
              title: 'QC Wajib untuk Semua Produk',
              description: 'Semua produk harus melalui quality control sebelum pengiriman',
              importance: 'critical',
              tooltip: 'Memastikan kualitas produk dan kepuasan customer. Enhanced timeline akan tracking semua QC checkpoints.'
            },
            {
              id: 'photo-documentation',
              title: 'Dokumentasi Foto Wajib',
              description: 'Semua hasil QC harus didokumentasikan dengan foto',
              importance: 'critical',
              tooltip: 'Bukti kualitas dan perlindungan dari klaim customer. Gunakan fitur upload di actionable modal untuk dokumentasi real-time.'
            },
            {
              id: 'immediate-rejection-notice',
              title: 'Notifikasi Penolakan Segera',
              description: 'Penolakan produk harus dikomunikasikan segera ke vendor',
              importance: 'important',
              tooltip: 'Memungkinkan vendor melakukan perbaikan dengan cepat. Status action panel akan mengirim notifikasi otomatis.'
            },
            {
              id: 'enhanced-qc-workflow',
              title: 'Enhanced QC Workflow',
              description: 'Manfaatkan workflow QC yang telah diperbaharui untuk efisiensi maksimal',
              importance: 'helpful',
              tooltip: 'Interactive timeline dan contextual actions memberikan guidance step-by-step untuk proses QC yang optimal.'
            }
          ]
        };

      case BusinessStage.SHIPPING:
        return {
          title: 'Dalam Pengiriman',
          description: 'Produk sedang dalam proses pengiriman ke customer.',
          suggestedActions: [
            {
              id: 'arrange-shipping',
              label: 'Atur Pengiriman',
              description: 'Koordinasi dengan kurir untuk pengiriman',
              priority: 'high',
              estimatedTime: '30 menit',
              icon: Truck,
              actionType: 'primary'
            },
            {
              id: 'track-shipment',
              label: 'Track Pengiriman',
              description: 'Monitor status pengiriman',
              priority: 'high',
              estimatedTime: '15 menit/hari',
              icon: Target,
              actionType: 'primary'
            },
            {
              id: 'notify-customer',
              label: 'Notifikasi Customer',
              description: 'Beritahu customer tentang pengiriman',
              priority: 'medium',
              estimatedTime: '10 menit',
              icon: Users,
              actionType: 'secondary'
            }
          ],
          requirements: [
            {
              id: 'qc-passed',
              label: 'QC Passed',
              description: 'Produk sudah lulus quality control',
              completed: true,
              required: true
            },
            {
              id: 'shipping-arranged',
              label: 'Pengiriman Diatur',
              description: 'Kurir sudah diatur untuk pengiriman',
              completed: false,
              required: true
            }
          ],
          tips: [
            'Pilih kurir yang reliable dan trackable',
            'Pastikan packaging aman untuk produk',
            'Berikan tracking number ke customer',
            'Siapkan customer service untuk pertanyaan pengiriman',
            'Gunakan enhanced timeline untuk real-time tracking',
            'Manfaatkan automated notifications untuk customer updates'
          ],
          estimatedDuration: '1-3 hari',
          complexity: 'simple',
          stakeholders: ['Logistics', 'Customer Service']
        };

      case BusinessStage.COMPLETED:
        return {
          title: 'Pesanan Selesai',
          description: 'Pesanan telah selesai dan diterima oleh customer.',
          suggestedActions: [
            {
              id: 'confirm-delivery',
              label: 'Konfirmasi Penerimaan',
              description: 'Konfirmasi customer sudah menerima produk',
              priority: 'high',
              estimatedTime: '15 menit',
              icon: CheckCircle2,
              actionType: 'primary'
            },
            {
              id: 'collect-feedback',
              label: 'Kumpulkan Feedback',
              description: 'Minta feedback dari customer',
              priority: 'medium',
              estimatedTime: '20 menit',
              icon: Users,
              actionType: 'secondary'
            },
            {
              id: 'close-order',
              label: 'Tutup Pesanan',
              description: 'Finalisasi dan tutup pesanan',
              priority: 'low',
              estimatedTime: '10 menit',
              icon: Target,
              actionType: 'info'
            }
          ],
          requirements: [
            {
              id: 'product-delivered',
              label: 'Produk Terkirim',
              description: 'Produk sudah diterima customer',
              completed: true,
              required: true
            },
            {
              id: 'customer-satisfied',
              label: 'Customer Puas',
              description: 'Customer puas dengan produk',
              completed: false,
              required: false
            }
          ],
          tips: [
            'Follow up dalam 1-2 hari setelah pengiriman',
            'Minta review atau testimoni dari customer',
            'Dokumentasikan lessons learned',
            'Update database vendor dengan performance',
            'Gunakan enhanced feedback collection system',
            'Manfaatkan completion analytics untuk improvement'
          ],
          estimatedDuration: 'Selesai',
          complexity: 'simple',
          stakeholders: ['Customer Service', 'Management']
        };

      default:
        return {
          title: 'Tahap Tidak Dikenal',
          description: 'Informasi tahap tidak tersedia.',
          suggestedActions: [],
          requirements: [],
          tips: [],
          estimatedDuration: 'Tidak diketahui',
          complexity: 'simple',
          stakeholders: []
        };
    }
  };

  const guidanceContent = getGuidanceContent(currentStage);

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

  // Get priority color
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
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

  if (compact) {
    return (
      <TooltipProvider>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm">What's Next?</h4>
              <p className="text-xs text-muted-foreground">{guidanceContent.title}</p>
            </div>
          </div>

          {/* Top Priority Actions */}
          <div className="space-y-2">
            {guidanceContent.suggestedActions
              .filter(action => action.priority === 'high')
              .slice(0, 2)
              .map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <action.icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{action.label}</span>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(action.priority))}>
                      {action.priority}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => onActionClick?.(action.id, currentStage)}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{action.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimasi: {action.estimatedTime}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
          </div>

          {/* Duration and Complexity */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{guidanceContent.estimatedDuration}</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", getComplexityColor(guidanceContent.complexity))}>
              {guidanceContent.complexity}
            </Badge>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">What's Next?</h3>
              <p className="text-sm text-muted-foreground">{guidanceContent.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-sm", getComplexityColor(guidanceContent.complexity))}>
              {guidanceContent.complexity}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>{guidanceContent.estimatedDuration}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimasi waktu untuk menyelesaikan tahap ini</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{guidanceContent.description}</p>
        </div>

        {/* Suggested Actions */}
        {guidanceContent.suggestedActions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Suggested Actions
            </h4>
            <div className="space-y-3">
              {guidanceContent.suggestedActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <action.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{action.label}</span>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(action.priority))}>
                        {action.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">• {action.estimatedTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {action.onClick && (
                    <Button
                      size="sm"
                      variant={action.actionType === 'primary' ? 'default' : 'outline'}
                      onClick={action.onClick}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {guidanceContent.requirements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Requirements
            </h4>
            <div className="space-y-2">
              {guidanceContent.requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {requirement.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{requirement.label}</span>
                      {requirement.required && (
                        <Badge variant="outline" className="text-xs text-red-700 bg-red-50 border-red-200">
                          Required
                        </Badge>
                      )}
                      {requirement.helpText && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{requirement.helpText}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{requirement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {guidanceContent.tips.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Tips & Best Practices
            </h4>
            <div className="space-y-2">
              {guidanceContent.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentation Links */}
        {guidanceContent.documentationLinks && guidanceContent.documentationLinks.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Documentation & Resources
            </h4>
            <div className="space-y-2">
              {guidanceContent.documentationLinks.map((link, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {link.type === 'external' ? (
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <a 
                        href={link.url}
                        target={link.type === 'external' ? '_blank' : '_self'}
                        rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {link.label}
                      </a>
                      {link.type === 'external' && (
                        <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                          External
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Rules */}
        {guidanceContent.businessRules && guidanceContent.businessRules.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Business Rules & Compliance
            </h4>
            <div className="space-y-3">
              {guidanceContent.businessRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {rule.importance === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : rule.importance === 'important' ? (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{rule.title}</span>
                      <Badge variant="outline" className={cn("text-xs", getImportanceColor(rule.importance))}>
                        {rule.importance}
                      </Badge>
                      {rule.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{rule.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        {guidanceContent.stakeholders.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Stakeholders:</span>
              </div>
              <div className="flex gap-1">
                {guidanceContent.stakeholders.map((stakeholder, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {stakeholder}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}

export default WhatsNextGuidanceSystem;