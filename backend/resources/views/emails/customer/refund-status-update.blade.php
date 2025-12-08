<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update Status Refund - {{ $refundRequest->request_number }}</title>
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
            padding: 30px 20px;
            text-align: center;
        }
        .header.processing {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        .header.rejected {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .header.investigating {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
        .status-alert {
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .status-alert.approved {
            background-color: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .status-alert.processing {
            background-color: #ede9fe;
            border: 1px solid #8b5cf6;
            color: #581c87;
        }
        .status-alert.rejected {
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
        .status-alert.investigating {
            background-color: #dbeafe;
            border: 1px solid #3b82f6;
            color: #1e40af;
        }
        .status-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .status-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .status-description {
            font-size: 16px;
            opacity: 0.8;
        }
        .refund-summary {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .summary-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .summary-label {
            font-weight: 600;
            color: #6b7280;
        }
        .summary-value {
            color: #111827;
            font-weight: 500;
        }
        .amount-highlight {
            font-size: 18px;
            font-weight: 700;
            color: #059669;
        }
        .next-steps {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .next-steps-title {
            color: #0c4a6e;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
        }
        .next-steps li {
            margin: 6px 0;
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
        .timeline-progress {
            margin: 25px 0;
        }
        .timeline-title {
            font-weight: 600;
            margin-bottom: 15px;
            color: #374151;
        }
        .progress-steps {
            display: flex;
            justify-content: space-between;
            position: relative;
            margin: 20px 0;
        }
        .progress-line {
            position: absolute;
            top: 15px;
            left: 0;
            right: 0;
            height: 2px;
            background-color: #e5e7eb;
        }
        .progress-line-filled {
            position: absolute;
            top: 15px;
            left: 0;
            height: 2px;
            background-color: #10b981;
            transition: width 0.3s ease;
        }
        .progress-step {
            background-color: white;
            border: 2px solid #e5e7eb;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            position: relative;
            z-index: 1;
        }
        .progress-step.completed {
            background-color: #10b981;
            border-color: #10b981;
            color: white;
        }
        .progress-step.active {
            background-color: #3b82f6;
            border-color: #3b82f6;
            color: white;
        }
        .step-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }
        .step-label {
            font-size: 12px;
            text-align: center;
            color: #6b7280;
            flex: 1;
        }
        .step-label.active {
            color: #3b82f6;
            font-weight: 600;
        }
        .rejection-reason {
            background-color: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
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
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .progress-steps {
                flex-wrap: wrap;
                gap: 10px;
            }
            .progress-line,
            .progress-line-filled {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header {{ strtolower($newStatus) }}">
            <h1>📢 Status Update</h1>
            <p>Ada update terbaru untuk permintaan refund Anda</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div style="font-size: 18px; margin-bottom: 20px; color: #374151;">
                Halo <strong>{{ $customerName }}</strong>,
            </div>

            <!-- Status Alert -->
            <div class="status-alert {{ strtolower($newStatus) }}">
                <div class="status-icon">
                    @if($newStatus === 'approved')
                        ✅
                    @elseif($newStatus === 'processing')
                        🔄
                    @elseif($newStatus === 'rejected')
                        ❌
                    @elseif($newStatus === 'under_investigation')
                        🔍
                    @else
                        📋
                    @endif
                </div>
                <div class="status-title">
                    @if($newStatus === 'approved')
                        Refund Disetujui!
                    @elseif($newStatus === 'processing')
                        Sedang Diproses
                    @elseif($newStatus === 'rejected')
                        Refund Ditolak
                    @elseif($newStatus === 'under_investigation')
                        Sedang Diselidiki
                    @else
                        Status Diperbarui
                    @endif
                </div>
                <div class="status-description">
                    @if($newStatus === 'approved')
                        Selamat! Permintaan refund Anda telah disetujui dan akan diproses lebih lanjut.
                    @elseif($newStatus === 'processing')
                        Tim payment sedang memproses pencairan dana refund Anda.
                    @elseif($newStatus === 'rejected')
                        Mohon maaf, permintaan refund Anda tidak dapat kami setujui.
                    @elseif($newStatus === 'under_investigation')
                        Tim kami sedang melakukan investigasi mendalam terkait permintaan Anda.
                    @else
                        Status permintaan refund Anda telah diperbarui.
                    @endif
                </div>
            </div>

            <!-- Refund Summary -->
            <div class="refund-summary">
                <h3 style="margin-top: 0; color: #374151;">📋 Ringkasan Refund</h3>
                
                <div class="summary-row">
                    <span class="summary-label">Nomor Refund:</span>
                    <span class="summary-value" style="font-family: monospace;">{{ $refundRequest->request_number }}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Status Baru:</span>
                    <span class="summary-value" style="font-weight: 700; text-transform: capitalize;">
                        {{ ucfirst(str_replace('_', ' ', $newStatus)) }}
                    </span>
                </div>
                
                @if(isset($approvedAmount))
                <div class="summary-row">
                    <span class="summary-label">Jumlah Disetujui:</span>
                    <span class="summary-value amount-highlight">
                        Rp {{ number_format($approvedAmount, 0, ',', '.') }}
                    </span>
                </div>
                @endif
                
                <div class="summary-row">
                    <span class="summary-label">Update Terakhir:</span>
                    <span class="summary-value">{{ now()->format('d F Y, H:i') }} WIB</span>
                </div>
            </div>

            @if($newStatus === 'rejected' && isset($rejectionReason))
            <!-- Rejection Reason -->
            <div class="rejection-reason">
                <h4 style="margin-top: 0;">❗ Alasan Penolakan</h4>
                <p style="margin-bottom: 0;">{{ $rejectionReason }}</p>
            </div>
            @endif

            <!-- Progress Timeline -->
            <div class="timeline-progress">
                <div class="timeline-title">🔄 Progress Refund</div>
                
                <div class="progress-steps">
                    <div class="progress-line"></div>
                    <div class="progress-line-filled" style="width: {{ $progressPercentage }}%;"></div>
                    
                    <div class="progress-step {{ in_array('submitted', $completedSteps) ? 'completed' : '' }}">1</div>
                    <div class="progress-step {{ in_array('reviewed', $completedSteps) ? 'completed' : (in_array('reviewing', $activeSteps) ? 'active' : '') }}">2</div>
                    <div class="progress-step {{ in_array('approved', $completedSteps) ? 'completed' : (in_array('approving', $activeSteps) ? 'active' : '') }}">3</div>
                    <div class="progress-step {{ in_array('processing', $completedSteps) ? 'completed' : (in_array('processing', $activeSteps) ? 'active' : '') }}">4</div>
                    <div class="progress-step {{ in_array('completed', $completedSteps) ? 'completed' : '' }}">5</div>
                </div>
                
                <div class="step-labels">
                    <div class="step-label">Submitted</div>
                    <div class="step-label {{ in_array('reviewing', $activeSteps) ? 'active' : '' }}">Review</div>
                    <div class="step-label {{ in_array('approving', $activeSteps) ? 'active' : '' }}">Approval</div>
                    <div class="step-label {{ in_array('processing', $activeSteps) ? 'active' : '' }}">Processing</div>
                    <div class="step-label">Completed</div>
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <div class="next-steps-title">
                    <span style="margin-right: 8px;">📋</span>
                    Langkah Selanjutnya
                </div>
                <ul>
                    @if($newStatus === 'approved')
                        <li><strong>Verifikasi rekening:</strong> Pastikan data rekening Anda sudah benar dalam sistem</li>
                        <li><strong>Tunggu proses:</strong> Dana akan ditransfer dalam 1-3 hari kerja</li>
                        <li><strong>Konfirmasi penerimaan:</strong> Kami akan mengirim konfirmasi setelah transfer berhasil</li>
                    @elseif($newStatus === 'processing')
                        <li><strong>Transfer sedang diproses:</strong> Tim payment sedang memproses transfer ke rekening Anda</li>
                        <li><strong>Cek rekening:</strong> Dana akan masuk dalam 1-2 hari kerja</li>
                        <li><strong>Konfirmasi otomatis:</strong> Anda akan menerima email konfirmasi setelah transfer berhasil</li>
                    @elseif($newStatus === 'under_investigation')
                        <li><strong>Investigasi berlangsung:</strong> Tim teknis sedang mengevaluasi kasus Anda</li>
                        <li><strong>Informasi tambahan:</strong> Jika diperlukan, kami akan menghubungi Anda</li>
                        <li><strong>Estimasi waktu:</strong> Investigasi biasanya selesai dalam 2-3 hari kerja</li>
                    @elseif($newStatus === 'rejected')
                        <li><strong>Banding tersedia:</strong> Anda dapat mengajukan banding jika tidak setuju</li>
                        <li><strong>Konsultasi gratis:</strong> Hubungi customer service untuk penjelasan lebih detail</li>
                        <li><strong>Solusi alternatif:</strong> Tim kami siap membantu mencari solusi terbaik</li>
                    @endif
                </ul>
            </div>

            @if(isset($notes) && $notes)
            <!-- Additional Notes -->
            <div style="background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #92400e;">📝 Catatan Tambahan</h4>
                <p style="margin-bottom: 0; color: #78350f;">{{ $notes }}</p>
            </div>
            @endif

            <!-- Call to Action -->
            <div class="cta-section">
                <h3 style="margin-top: 0; color: #374151;">💬 Butuh Bantuan?</h3>
                <p style="color: #6b7280; margin-bottom: 20px;">
                    Tim customer service kami siap membantu Anda dengan pertanyaan apapun
                </p>
                
                <a href="{{ $trackingUrl }}" class="cta-button">
                    Lihat Detail Status
                </a>
                
                <a href="{{ $communicationUrl }}" class="cta-button">
                    Chat dengan CS
                </a>
            </div>

            <p style="color: #6b7280; margin-bottom: 0;">
                Terima kasih atas kesabaran Anda. Kami berkomitmen untuk memberikan layanan terbaik dan menyelesaikan permintaan refund Anda dengan profesional.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>PT Custom Etching Xenial</strong><br>
                Customer Service: support@customething.com<br>
                Phone: +62-21-1234-5678 | WhatsApp: +62-812-3456-7890
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