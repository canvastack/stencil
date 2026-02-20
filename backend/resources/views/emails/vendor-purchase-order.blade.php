<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Purchase Order</title>
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
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-label {
            font-weight: bold;
            color: #6b7280;
        }
        .info-value {
            color: #111827;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Purchase Order</h1>
        <p>{{ $documentNumber }}</p>
    </div>

    <div class="content">
        <p>Dear {{ $vendorName }},</p>

        <p>We are pleased to send you a new purchase order from <strong>{{ $companyName }}</strong>.</p>

        <div class="info-box">
            <div class="info-row">
                <span class="info-label">PO Number:</span>
                <span class="info-value">{{ $documentNumber }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order Reference:</span>
                <span class="info-value">{{ $orderNumber }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Delivery Deadline:</span>
                <span class="info-value">{{ $deliveryDeadline }}</span>
            </div>
        </div>

        <div class="alert">
            <strong>⚠️ Action Required:</strong> Please review the purchase order and acknowledge receipt in the vendor portal.
        </div>

        <p style="text-align: center;">
            <a href="{{ $portalUrl }}" class="button">View Purchase Order</a>
        </p>

        <p><strong>What's Next?</strong></p>
        <ol>
            <li>Review the purchase order details and specifications</li>
            <li>Acknowledge receipt in the vendor portal</li>
            <li>Begin production according to the specifications</li>
            <li>Provide production updates as needed</li>
            <li>Deliver items by the specified deadline</li>
        </ol>

        <p><strong>Important Notes:</strong></p>
        <ul>
            <li>All items must meet the quality requirements specified in the PO</li>
            <li>Please notify us immediately of any delays or issues</li>
            <li>Payment will be made according to the payment terms after successful delivery</li>
        </ul>

        <p>The complete purchase order is attached to this email as a PDF document.</p>

        <p>If you have any questions or concerns, please contact us immediately.</p>

        <p>Best regards,<br>
        <strong>{{ $companyName }}</strong></p>
    </div>

    <div class="footer">
        <p>This is an automated email. Please do not reply directly to this message.</p>
        <p>For support, please contact us through the vendor portal.</p>
    </div>
</body>
</html>
