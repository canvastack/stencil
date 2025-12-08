<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Pengajuan Refund - {{ $refundRequest->request_number }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #374151;
        }
        .refund-details {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            flex: 1;
        }
        .detail-value {
            flex: 2;
            text-align: right;
            color: #111827;
            font-weight: 500;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #fef3c7;
            color: #92400e;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .timeline {
            margin: 25px 0;
        }
        .timeline-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #374151;
        }
        .timeline-item {
            padding: 12px 0;
            border-left: 2px solid #e5e7eb;
            padding-left: 20px;
            margin-left: 10px;
            position: relative;
        }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 18px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #6366f1;
        }
        .timeline-step {
            font-weight: 600;
            color: #374151;
        }
        .timeline-description {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background-color: #f8fafc;
            border-radius: 8px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .contact-info {
            background-color: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .contact-title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            color: #1e40af;
        }
        .footer {
            background-color: #1f2937;
            color: #9ca3af;
            padding: 25px 20px;
            text-align: center;
        }
        .footer a {
            color: #60a5fa;
            text-decoration: none;
        }
        .important-note {
            background-color: #fef7cd;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .important-note-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .important-note-content {
            color: #78350f;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .header {
                padding: 25px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .detail-row {
                flex-direction: column;
                text-align: left;
            }
            .detail-value {
                text-align: left;
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>✅ Refund Request Submitted</h1>
            <p>Permintaan refund Anda telah berhasil diajukan</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Halo <strong>{{ $customerName }}</strong>,
            </div>

            <p>Terima kasih telah mengajukan permintaan refund. Kami telah menerima permintaan Anda dan tim kami akan segera meninjaunya.</p>

            <!-- Refund Details -->
            <div class="refund-details">
                <h3 style="margin-top: 0; color: #374151;">📋 Detail Permintaan Refund</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Nomor Refund:</span>
                    <span class="detail-value" style="font-family: monospace;">{{ $refundRequest->request_number }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Nomor Pesanan:</span>
                    <span class="detail-value" style="font-family: monospace;">{{ $refundRequest->order->order_number }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        <span class="status-badge">Pending Review</span>
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Alasan:</span>
                    <span class="detail-value">{{ ucfirst(str_replace('_', ' ', $refundRequest->refund_reason)) }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Jumlah Diminta:</span>
                    <span class="detail-value" style="font-weight: 700; color: #059669;">
                        Rp {{ number_format($refundRequest->customer_request_amount ?? $refundRequest->order->total_amount, 0, ',', '.') }}
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Tanggal Pengajuan:</span>
                    <span class="detail-value">{{ $refundRequest->requested_at->format('d F Y, H:i') }} WIB</span>
                </div>
            </div>

            <!-- Timeline -->
            <div class="timeline">
                <div class="timeline-title">🔄 Proses Selanjutnya</div>
                
                <div class="timeline-item">
                    <div class="timeline-step">1. Review Initial (1-2 hari kerja)</div>
                    <div class="timeline-description">Tim customer service akan meninjau permintaan dan dokumen pendukung Anda</div>
                </div>
                
                <div class="timeline-item">
                    <div class="timeline-step">2. Investigasi (2-3 hari kerja)</div>
                    <div class="timeline-description">Tim teknis akan melakukan investigasi jika diperlukan</div>
                </div>
                
                <div class="timeline-item">
                    <div class="timeline-step">3. Approval (1 hari kerja)</div>
                    <div class="timeline-description">Manager akan memberikan keputusan akhir</div>
                </div>
                
                <div class="timeline-item">
                    <div class="timeline-step">4. Processing (1-3 hari kerja)</div>
                    <div class="timeline-description">Jika disetujui, proses pencairan dana akan dimulai</div>
                </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
                <h3 style="margin-top: 0; color: #374151;">📱 Pantau Status Refund Anda</h3>
                <p style="color: #6b7280; margin-bottom: 20px;">Akses portal customer untuk melihat status real-time dan berkomunikasi dengan tim kami</p>
                
                <a href="{{ $trackingUrl }}" class="cta-button">
                    Lihat Status Refund
                </a>
                
                <a href="{{ $communicationUrl }}" class="cta-button">
                    Chat dengan CS
                </a>
            </div>

            <!-- Important Note -->
            <div class="important-note">
                <div class="important-note-title">⚠️ Informasi Penting</div>
                <div class="important-note-content">
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Estimasi waktu proses total: <strong>5-7 hari kerja</strong></li>
                        <li>Anda akan menerima email update untuk setiap perubahan status</li>
                        <li>Jika membutuhkan informasi tambahan, tim kami akan menghubungi Anda</li>
                        <li>Dana refund akan ditransfer ke rekening yang terdaftar dalam sistem</li>
                    </ul>
                </div>
            </div>

            <!-- Contact Information -->
            <div class="contact-info">
                <div class="contact-title">📞 Butuh Bantuan?</div>
                <p style="margin-bottom: 15px; color: #1e40af;">Tim customer service kami siap membantu Anda 24/7:</p>
                
                <div class="contact-item">
                    <span style="margin-right: 10px;">📱</span>
                    <span>WhatsApp: <strong>+62-812-3456-7890</strong></span>
                </div>
                
                <div class="contact-item">
                    <span style="margin-right: 10px;">📞</span>
                    <span>Telepon: <strong>+62-21-1234-5678</strong></span>
                </div>
                
                <div class="contact-item">
                    <span style="margin-right: 10px;">✉️</span>
                    <span>Email: <strong>support@customething.com</strong></span>
                </div>
                
                <div class="contact-item">
                    <span style="margin-right: 10px;">💬</span>
                    <span>Live Chat: <strong>Tersedia 09:00-17:00 WIB</strong></span>
                </div>
            </div>

            <p style="color: #6b7280; margin-bottom: 0;">
                Terima kasih atas kepercayaan Anda kepada layanan kami. Kami berkomitmen untuk memberikan layanan terbaik dan menyelesaikan permintaan refund Anda dengan cepat dan adil.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>PT Custom Etching Xenial</strong><br>
                Jl. Industri Raya No. 123, Jakarta 12345<br>
                Indonesia
            </p>
            <p style="margin: 0;">
                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.<br>
                Untuk bantuan, hubungi <a href="mailto:support@customething.com">support@customething.com</a>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
                © {{ date('Y') }} PT Custom Etching Xenial. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>