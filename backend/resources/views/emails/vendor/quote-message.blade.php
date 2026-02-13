<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message - {{ $quoteNumber }}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">CanvaStencil</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Vendor Portal - Message Notification</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Greeting -->
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
                Dear <strong>{{ $recipientName }}</strong>,
            </p>

            <!-- Introduction -->
            <p style="font-size: 15px; color: #4b5563; margin: 0 0 28px 0; line-height: 1.7;">
                @if($recipientType === 'admin')
                    A vendor has sent a new message regarding a quote. Please review the message below and respond if necessary.
                @else
                    An admin has sent you a new message regarding your quote. Please review the message below.
                @endif
            </p>

            <!-- Message Badge -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                    💬 NEW MESSAGE
                </div>
            </div>

            <!-- Quote Details Box -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 0 0 28px 0; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);">
                <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">📋 Quote Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; width: 40%;">Quote Number:</td>
                        <td style="padding: 10px 0; color: #2563eb; font-size: 15px; font-weight: 700;">{{ $quoteNumber }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Order Number:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; border-top: 1px solid #bfdbfe;">{{ $orderNumber }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">From:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; font-weight: 600; border-top: 1px solid #bfdbfe;">
                            {{ $senderName }}
                            @if($senderType === 'admin')
                                <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 8px;">ADMIN</span>
                            @elseif($senderType === 'vendor')
                                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 8px;">VENDOR</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Sent At:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; border-top: 1px solid #bfdbfe;">{{ \Carbon\Carbon::parse($sentAt)->format('F j, Y \a\t g:i A') }}</td>
                    </tr>
                </table>
            </div>

            <!-- Message Content Box -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 0 0 28px 0;">
                <h2 style="color: #374151; font-size: 18px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid #d1d5db; padding-bottom: 12px;">📝 Message Content</h2>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 16px;">
                    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">{{ $messageContent }}</p>
                </div>

                @if($hasAttachments)
                <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                        📎 This message includes {{ $attachmentCount }} attachment{{ $attachmentCount > 1 ? 's' : '' }}
                    </p>
                    <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px;">
                        View the quote detail page to download the attachment{{ $attachmentCount > 1 ? 's' : '' }}.
                    </p>
                </div>
                @endif
            </div>

            <!-- Action Required Box -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 0 0 32px 0;">
                <p style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 700;">💡 Next Steps</p>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                    @if($recipientType === 'admin')
                        Review the vendor's message and respond through the admin panel if needed. You can also view the complete message thread and quote details.
                    @else
                        Review the admin's message and respond if you have any questions or need clarification. You can reply through the vendor portal.
                    @endif
                </p>
            </div>

            <!-- View Quote Button -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="{{ $quoteUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                    🔍 View Quote & Reply
                </a>
            </div>

            <!-- Communication Tips -->
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 0 0 28px 0;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; font-weight: 700;">💬 Communication Tips</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>All messages are tracked with timestamps for transparency</li>
                    <li>You can attach files (PDF, images, documents) to your replies</li>
                    <li>Use the message thread to keep all communication organized</li>
                    @if($recipientType === 'vendor')
                        <li>Prompt responses help maintain your vendor performance rating</li>
                    @else
                        <li>Quick responses help vendors complete quotes efficiently</li>
                    @endif
                    <li>Both parties receive email notifications for new messages</li>
                </ul>
            </div>

            <!-- Closing -->
            <p style="font-size: 15px; color: #4b5563; margin: 0 0 8px 0;">Best regards,</p>
            <p style="font-size: 15px; color: #1f2937; font-weight: 600; margin: 0;">CanvaStencil Vendor Portal System</p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                This is an automated notification from the Vendor Portal system.
            </p>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                Please do not reply directly to this email. Use the portal to send your response.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © {{ date('Y') }} PT Custom Etching Xenial. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
