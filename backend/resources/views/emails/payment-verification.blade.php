<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Verification</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
        }
        .status-approved {
            background: #10b981;
            color: white;
        }
        .status-rejected {
            background: #ef4444;
            color: white;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #6b7280;
        }
        .value {
            color: #111827;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .alert {
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .alert-success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .alert-danger {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Payment Verification Update</h1>
        <p>Reference: {{ $payment->reference }}</p>
    </div>

    <div class="content">
        @if($status === 'approved')
            <div class="alert alert-success">
                <strong>✓ Payment Verified Successfully</strong>
                <p>Your payment has been verified and approved. Your order will proceed to the next stage.</p>
            </div>
        @else
            <div class="alert alert-danger">
                <strong>✗ Payment Verification Failed</strong>
                <p>Unfortunately, your payment could not be verified. Please review the reason below and resubmit if necessary.</p>
            </div>
        @endif

        <div class="info-box">
            <h3>Payment Details</h3>
            <div class="info-row">
                <span class="label">Reference Number:</span>
                <span class="value">{{ $payment->reference }}</span>
            </div>
            <div class="info-row">
                <span class="label">Amount:</span>
                <span class="value">Rp {{ number_format($payment->amount / 100, 0, ',', '.') }}</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="status-badge {{ $status === 'approved' ? 'status-approved' : 'status-rejected' }}">
                    {{ strtoupper($status) }}
                </span>
            </div>
            <div class="info-row">
                <span class="label">Verified At:</span>
                <span class="value">{{ now()->format('d M Y, H:i') }}</span>
            </div>
        </div>

        @if($status === 'approved' && $notes)
            <div class="info-box">
                <h3>Verification Notes</h3>
                <p>{{ $notes }}</p>
            </div>
        @endif

        @if($status === 'rejected' && $rejectionReason)
            <div class="info-box">
                <h3>Rejection Reason</h3>
                <p style="color: #991b1b;">{{ $rejectionReason }}</p>
            </div>
        @endif

        @if($status === 'approved')
            <p>Your order is now being processed. You will receive further updates as your order progresses.</p>
        @else
            <p>If you believe this is an error or need assistance, please contact our support team with your reference number.</p>
        @endif
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>
</body>
</html>
