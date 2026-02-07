<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Response to Quote</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-wrapper {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .icon {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #2d3748;
        }
        .message {
            color: #4a5568;
            margin-bottom: 32px;
        }
        .quote-info {
            background: #f7fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
        }
        .quote-info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .quote-info-row:last-child {
            border-bottom: none;
        }
        .quote-info-label {
            font-weight: 600;
            color: #4a5568;
        }
        .quote-info-value {
            color: #2d3748;
        }
        .response-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        .response-accepted {
            background: #d1fae5;
            color: #065f46;
        }
        .response-rejected {
            background: #fee2e2;
            color: #991b1b;
        }
        .response-countered {
            background: #fef3c7;
            color: #92400e;
        }
        .response-notes {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .footer {
            background: #f8fafc;
            padding: 32px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <span class="icon">✅</span>
                <h1>Vendor Response Received</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hello {{ $admin->name }}!</div>
                
                <div class="message">
                    <p>Vendor <strong>{{ $vendor->name }}</strong> has {{ $responseLabel }} quote <strong>{{ $quoteNumber }}</strong>.</p>
                </div>
                
                <div class="quote-info">
                    <div class="quote-info-row">
                        <span class="quote-info-label">Quote Number:</span>
                        <span class="quote-info-value">{{ $quoteNumber }}</span>
                    </div>
                    <div class="quote-info-row">
                        <span class="quote-info-label">Vendor:</span>
                        <span class="quote-info-value">{{ $vendor->name }}</span>
                    </div>
                    <div class="quote-info-row">
                        <span class="quote-info-label">Response:</span>
                        <span class="quote-info-value">
                            <span class="response-badge response-{{ $quote->getResponseType() }}">
                                {{ ucfirst($responseLabel) }}
                            </span>
                        </span>
                    </div>
                </div>
                
                @if($responseNotes)
                <div class="response-notes">
                    <strong>Vendor Notes:</strong>
                    <p style="margin: 8px 0 0 0;">{{ $responseNotes }}</p>
                </div>
                @endif
                
                <div class="button-container">
                    <a href="{{ $viewUrl }}" class="action-button">
                        View Quote Details
                    </a>
                </div>
                
                <div class="message">
                    <p><strong>What's Next?</strong></p>
                    <ul style="color: #4a5568; padding-left: 20px;">
                        @if($quote->getResponseType() === 'accept')
                        <li>Review the accepted terms</li>
                        <li>Proceed with order processing</li>
                        <li>Notify the customer of the acceptance</li>
                        @elseif($quote->getResponseType() === 'reject')
                        <li>Review the rejection reason</li>
                        <li>Consider alternative vendors</li>
                        <li>Update the customer on the status</li>
                        @elseif($quote->getResponseType() === 'counter')
                        <li>Review the counter offer details</li>
                        <li>Evaluate the new terms</li>
                        <li>Accept or negotiate further</li>
                        @endif
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The CanvaStencil Team
                </p>
                
                <p class="footer-text" style="margin-top: 16px;">
                    © {{ date('Y') }} CanvaStencil. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
