<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Memberikan Counter Offer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .quote-info {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
        }
        .counter-comparison {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .offer-card {
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .vendor-offer {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
        }
        .admin-offer {
            background-color: #dbeafe;
            border: 1px solid #3b82f6;
        }
        .item {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .item:last-child {
            border-bottom: none;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
        }
        .admin-notes {
            background-color: #e0f2fe;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #7dd3fc;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .label {
            font-weight: bold;
            color: #4b5563;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">Admin Memberikan Counter Offer</h1>
    </div>
    
    <div class="content">
        <p>Kepada Yth. {{ $vendor_name }},</p>
        
        <p>Kami telah meninjau counter offer Anda untuk <strong>Quote {{ $quote_number }}</strong> dan ingin mengajukan counter offer dari pihak kami.</p>
        
        <div class="quote-info">
            <p style="margin: 5px 0;"><span class="label">Nomor Quote:</span> {{ $quote_number }}</p>
            <p style="margin: 5px 0;"><span class="label">Ronde Negosiasi:</span> <span class="highlight">{{ $round }}</span></p>
            <p style="margin: 5px 0;"><span class="label">Tanggal:</span> {{ \Carbon\Carbon::now()->format('d F Y H:i') }}</p>
        </div>
        
        @if(isset($admin_notes) && $admin_notes)
        <div class="admin-notes">
            <h3 style="margin-top: 0; color: #0369a1;">Catatan dari Admin:</h3>
            <p style="margin-bottom: 0;">{{ $admin_notes }}</p>
        </div>
        @endif
        
        <div class="counter-comparison">
            <h3 style="margin-top: 0;">Perbandingan Penawaran:</h3>
            
            <!-- Vendor's Counter Offer -->
            <div class="offer-card vendor-offer">
                <h4 style="margin: 0 0 10px 0; color: #d97706;">Counter Offer Anda:</h4>
                @if(isset($vendor_counter_offer['items']))
                    @foreach($vendor_counter_offer['items'] as $item)
                    <div class="item">
                        <p style="margin: 5px 0; font-weight: bold;">{{ $item['product_name'] }}</p>
                        <p style="margin: 5px 0; font-size: 14px;">
                            Qty: {{ $item['quantity'] }} × 
                            {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_unit_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_unit_price'] / 100, 2) }}
                            = {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_total_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_total_price'] / 100, 2) }}
                        </p>
                    </div>
                    @endforeach
                    <div class="total" style="color: #d97706;">
                        Total: {{ $currency === 'IDR' ? 'Rp ' . number_format($vendor_counter_offer['total_counter'], 0, ',', '.') : $currency . ' ' . number_format($vendor_counter_offer['total_counter'] / 100, 2) }}
                    </div>
                @endif
            </div>
            
            <!-- Admin's Counter Offer -->
            <div class="offer-card admin-offer">
                <h4 style="margin: 0 0 10px 0; color: #1d4ed8;">Counter Offer dari Admin:</h4>
                @if(isset($admin_counter_offer['items']))
                    @foreach($admin_counter_offer['items'] as $item)
                    <div class="item">
                        <p style="margin: 5px 0; font-weight: bold;">{{ $item['product_name'] }}</p>
                        <p style="margin: 5px 0; font-size: 14px;">
                            Qty: {{ $item['quantity'] }} × 
                            {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_unit_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_unit_price'] / 100, 2) }}
                            = {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_total_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_total_price'] / 100, 2) }}
                        </p>
                        @if(isset($item['notes']) && $item['notes'])
                        <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">Catatan: {{ $item['notes'] }}</p>
                        @endif
                    </div>
                    @endforeach
                    <div class="total" style="color: #1d4ed8;">
                        Total: {{ $currency === 'IDR' ? 'Rp ' . number_format($admin_counter_offer['total_counter'], 0, ',', '.') : $currency . ' ' . number_format($admin_counter_offer['total_counter'] / 100, 2) }}
                    </div>
                @endif
            </div>
        </div>
        
        <h3>Langkah Selanjutnya:</h3>
        <p>Anda dapat merespons counter offer ini dengan salah satu opsi berikut:</p>
        <ul>
            <li><strong>Terima</strong> counter offer dari admin</li>
            <li><strong>Tolak</strong> counter offer dengan alasan yang jelas</li>
            <li><strong>Ajukan counter offer baru</strong> (jika masih dalam batas maksimal negosiasi)</li>
        </ul>
        
        <p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0;">
            <strong>Penting:</strong> Silakan tinjau counter offer ini dengan seksama dan berikan respons Anda melalui portal vendor.
        </p>
        
        <center>
            <a href="{{ $portal_url }}/vendor/quotes/{{ $quote_uuid }}" class="button">Lihat Detail & Respons</a>
        </center>
        
        <p>Jika Anda memiliki pertanyaan atau ingin mendiskusikan lebih lanjut, jangan ragu untuk menghubungi kami.</p>
        
        <p>Terima kasih atas kerja sama Anda.</p>
        
        <p>Hormat kami,<br>
        <strong>{{ $admin_contact_name }}</strong><br>
        {{ $admin_contact_email }}</p>
    </div>
    
    <div class="footer">
        <p>Ini adalah email otomatis. Mohon jangan membalas langsung ke email ini.</p>
        <p>Jika Anda memerlukan bantuan, silakan hubungi kami di {{ $admin_contact_email }}</p>
    </div>
</body>
</html>
