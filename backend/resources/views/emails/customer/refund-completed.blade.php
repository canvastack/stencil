<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Selesai - {{ $refundRequest->request_number }}</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }
        .header p {
            margin: 15px 0 0 0;
            opacity: 0.9;
            font-size: 18px;
        }
        .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
            display: block;
        }
        .content {
            padding: 30px 20px;
        }
        .completion-alert {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        .completion-title {
            font-size: 24px;
            font-weight: 700;
            color: #065f46;
            margin-bottom: 10px;
        }
        .completion-description {
            font-size: 16px;
            color: #047857;
            margin-bottom: 0;
        }
        .transfer-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
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
            color: #4b5563;
        }
        .detail-value {
            color: #111827;
            font-weight: 500;
            text-align: right;
        }
        .amount-highlight {
            font-size: 20px;
            font-weight: 700;
            color: #059669;
            background-color: #ecfdf5;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #10b981;
        }
        .reference-number {
            background-color: #1f2937;
            color: #ffffff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-family: monospace;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .timeline-summary {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .timeline-title {
            color: #0c4a6e;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            color: #0c4a6e;
        }
        .timeline-item .icon {
            margin-right: 10px;
            font-size: 16px;
        }
        .feedback-section {
            background: linear-gradient(135deg, #fef7cd 0%, #fed7aa 100%);
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .feedback-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 18px;
        }
        .rating-stars {
            font-size: 24px;
            margin: 15px 0;
        }
        .star {
            color: #fbbf24;
            margin: 0 2px;
            cursor: pointer;
            transition: color 0.2s;
        }
        .star:hover {
            color: #f59e0b;
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
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
            font-size: 16px;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .cta-button.secondary {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        .important-info {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .important-info-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .important-info-content {
            color: #78350f;
            font-size: 14px;
        }
        .contact-card {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .contact-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            color: #4b5563;
        }
        .contact-item .icon {
            margin-right: 10px;
        }
        .footer {
            background-color: #1f2937;
            color: #9ca3af;
            padding: 30px 20px;
            text-align: center;
        }
        .footer a {
            color: #60a5fa;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .header {
                padding: 30px 15px;
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
            .success-icon {
                font-size: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Refund Berhasil!</h1>
            <p>Dana refund telah berhasil ditransfer ke rekening Anda</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div style="font-size: 18px; margin-bottom: 20px; color: #374151;">
                Halo <strong>{{ $customerName }}</strong>,
            </div>

            <p style="font-size: 16px; margin-bottom: 25px;">
                Kabar baik! Proses refund untuk permintaan <strong>{{ $refundRequest->request_number }}</strong> 
                telah selesai dan dana sudah berhasil ditransfer ke rekening Anda.
            </p>

            <!-- Completion Alert -->
            <div class="completion-alert">
                <div class="completion-title">✅ Refund Completed</div>
                <div class="completion-description">
                    Transfer berhasil dilakukan pada {{ $transferDate->format('d F Y') }} pukul {{ $transferDate->format('H:i') }} WIB
                </div>
            </div>

            <!-- Reference Number -->
            <div class="reference-number">
                REFERENSI TRANSFER: {{ $transferReference }}
            </div>

            <!-- Transfer Details -->
            <div class="transfer-details">
                <h3 style="margin-top: 0; color: #374151;">💰 Detail Transfer</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Nomor Refund:</span>
                    <span class="detail-value" style="font-family: monospace;">{{ $refundRequest->request_number }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Nomor Pesanan:</span>
                    <span class="detail-value" style="font-family: monospace;">{{ $refundRequest->order->order_number }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Jumlah Transfer:</span>
                    <span class="detail-value amount-highlight">
                        Rp {{ number_format($transferAmount, 0, ',', '.') }}
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Rekening Tujuan:</span>
                    <span class="detail-value">{{ $bankName }} - {{ $maskedAccountNumber }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Tanggal Transfer:</span>
                    <span class="detail-value">{{ $transferDate->format('d F Y, H:i') }} WIB</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Metode Transfer:</span>
                    <span class="detail-value">{{ $transferMethod ?? 'Bank Transfer' }}</span>
                </div>
            </div>

            <!-- Timeline Summary -->
            <div class="timeline-summary">
                <div class="timeline-title">
                    <span style="margin-right: 8px;">📋</span>
                    Ringkasan Proses Refund
                </div>
                
                <div class="timeline-item">
                    <span class="icon">✅</span>
                    <span><strong>{{ $refundRequest->requested_at->format('d M Y') }}</strong> - Permintaan refund diajukan</span>
                </div>
                
                @if($refundRequest->approved_at)
                <div class="timeline-item">
                    <span class="icon">✅</span>
                    <span><strong>{{ $refundRequest->approved_at->format('d M Y') }}</strong> - Disetujui oleh manager</span>
                </div>
                @endif
                
                <div class="timeline-item">
                    <span class="icon">✅</span>
                    <span><strong>{{ $transferDate->format('d M Y') }}</strong> - Transfer berhasil dilakukan</span>
                </div>
                
                <div class="timeline-item">
                    <span class="icon">⏱️</span>
                    <span><strong>Total waktu proses:</strong> {{ $totalProcessDays }} hari kerja</span>
                </div>
            </div>

            <!-- Important Information -->
            <div class="important-info">
                <div class="important-info-title">📝 Informasi Penting</div>
                <div class="important-info-content">
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Dana akan terlihat di rekening Anda dalam <strong>1-2 jam</strong> (hari kerja)</li>
                        <li>Jika menggunakan bank berbeda, transfer bisa memakan waktu hingga <strong>1 hari kerja</strong></li>
                        <li>Simpan email ini sebagai bukti transfer untuk keperluan Anda</li>
                        <li>Jika ada pertanyaan, hubungi customer service dengan menyertakan referensi transfer</li>
                    </ul>
                </div>
            </div>

            <!-- Feedback Section -->
            <div class="feedback-section">
                <div class="feedback-title">⭐ Bagaimana pengalaman refund Anda?</div>
                <p style="color: #78350f; margin-bottom: 15px;">
                    Bantu kami meningkatkan layanan dengan memberikan rating
                </p>
                
                <div class="rating-stars">
                    <span class="star">⭐</span>
                    <span class="star">⭐</span>
                    <span class="star">⭐</span>
                    <span class="star">⭐</span>
                    <span class="star">⭐</span>
                </div>
                
                <p style="color: #92400e; font-size: 14px; margin: 10px 0 0 0;">
                    Klik bintang untuk memberikan rating atau gunakan tombol di bawah untuk memberikan feedback detail
                </p>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
                <h3 style="margin-top: 0; color: #374151;">🛍️ Terima kasih atas kepercayaan Anda!</h3>
                <p style="color: #6b7280; margin-bottom: 25px;">
                    Kami berharap dapat melayani Anda kembali di masa depan
                </p>
                
                <a href="{{ $feedbackUrl }}" class="cta-button">
                    💬 Berikan Feedback
                </a>
                
                <a href="{{ $catalogUrl }}" class="cta-button secondary">
                    🛒 Lihat Katalog Produk
                </a>
            </div>

            <!-- Contact Information -->
            <div class="contact-card">
                <div class="contact-title">
                    <span style="margin-right: 8px;">📞</span>
                    Butuh Bantuan?
                </div>
                <p style="margin-bottom: 15px; color: #4b5563;">
                    Tim customer service kami siap membantu Anda 24/7:
                </p>
                
                <div class="contact-item">
                    <span class="icon">📱</span>
                    <span>WhatsApp: <strong>+62-812-3456-7890</strong></span>
                </div>
                
                <div class="contact-item">
                    <span class="icon">📞</span>
                    <span>Telepon: <strong>+62-21-1234-5678</strong></span>
                </div>
                
                <div class="contact-item">
                    <span class="icon">✉️</span>
                    <span>Email: <strong>support@customething.com</strong></span>
                </div>
                
                <div class="contact-item">
                    <span class="icon">🕐</span>
                    <span>Jam Operasional: <strong>09:00 - 17:00 WIB (Senin-Jumat)</strong></span>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0 0 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                <p style="color: #6b7280; margin-bottom: 0; font-size: 16px;">
                    Sekali lagi terima kasih atas kepercayaan Anda kepada <strong>PT Custom Etching Xenial</strong>. 
                    Kami berkomitmen untuk terus memberikan layanan dan produk berkualitas tinggi.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 15px 0;">
                <strong>PT Custom Etching Xenial</strong><br>
                Jl. Industri Raya No. 123, Jakarta 12345<br>
                Indonesia
            </p>
            
            <p style="margin: 0 0 15px 0;">
                Follow us: 
                <a href="#" style="margin: 0 10px;">Facebook</a>
                <a href="#" style="margin: 0 10px;">Instagram</a>
                <a href="#" style="margin: 0 10px;">LinkedIn</a>
            </p>
            
            <p style="margin: 0;">
                Email ini dikirim otomatis oleh sistem. Untuk bantuan, hubungi customer service kami.<br>
                <a href="{{ $unsubscribeUrl ?? '#' }}">Unsubscribe</a> dari notifikasi email ini.
            </p>
            
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
                © {{ date('Y') }} PT Custom Etching Xenial. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>