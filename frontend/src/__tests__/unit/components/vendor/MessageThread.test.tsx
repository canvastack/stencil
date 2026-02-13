/**
 * MessageThread Component Tests
 * 
 * Tests for the message thread component.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.6, 13.7, 13.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageThread from '@/components/vendor/MessageThread';
import type { QuoteMessage } from '@/types/vendor/portal';

describe('MessageThread', () => {
  const mockOnSendMessage = vi.fn();

  const mockMessages: QuoteMessage[] = [
    {
      id: '1',
      uuid: 'msg-1',
      tenant_id: 'tenant-1',
      quote_id: 'quote-1',
      sender_id: 'admin-1',
      message: 'Hello, can you provide a quote for this?',
      attachments: [],
      sender_type: 'admin',
      is_read: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      sender: {
        id: 'admin-1',
        name: 'Admin User',
      },
    },
    {
      id: '2',
      uuid: 'msg-2',
      tenant_id: 'tenant-1',
      quote_id: 'quote-1',
      sender_id: 'vendor-1',
      message: 'Yes, I can provide a quote.',
      attachments: [
        {
          filename: 'quote.pdf',
          url: 'https://example.com/quote.pdf',
          size: 1024000,
          type: 'application/pdf',
        },
      ],
      sender_type: 'vendor',
      is_read: true,
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z',
      sender: {
        id: 'vendor-1',
        name: 'Vendor User',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Message Display', () => {
    it('should render message thread title', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Message Thread')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });

    it('should render all messages', () => {
      render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Hello, can you provide a quote for this?')).toBeInTheDocument();
      expect(screen.getByText('Yes, I can provide a quote.')).toBeInTheDocument();
    });

    it('should display sender names', () => {
      render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Vendor User')).toBeInTheDocument();
    });

    it('should display message timestamps', () => {
      render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Should show relative time like "X days ago"
      const timestamps = screen.getAllByText(/ago/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('should show new badge for unread admin messages', () => {
      const unreadMessages: QuoteMessage[] = [
        {
          ...mockMessages[0],
          is_read: false,
        },
      ];

      render(
        <MessageThread
          messages={unreadMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should display attachments with download links', () => {
      render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      const downloadLink = screen.getByText('quote.pdf');
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink.closest('a')).toHaveAttribute('href', 'https://example.com/quote.pdf');
    });

    it('should display file sizes', () => {
      render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/1000.0 KB/)).toBeInTheDocument();
    });
  });

  describe('Send Message Form', () => {
    it('should render message textarea', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('should render attach files button', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Attach Files')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });

    it('should call onSendMessage when form is submitted', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByText('Send Message');

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', []);
      });
    });

    it('should clear textarea after sending', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      const sendButton = screen.getByText('Send Message');

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should disable send button when message is empty', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const sendButton = screen.getByText('Send Message');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when message has text', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByText('Send Message');

      fireEvent.change(textarea, { target: { value: 'Test' } });
      expect(sendButton).not.toBeDisabled();
    });

    it('should show sending text when isSending is true', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isSending={true}
        />
      );

      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('should disable form when isSending is true', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isSending={true}
        />
      );

      const textarea = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByText('Sending...');

      expect(textarea).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('File Attachments', () => {
    it('should show file requirements text', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/Allowed file types/i)).toBeInTheDocument();
      expect(screen.getByText(/Max size: 10MB/i)).toBeInTheDocument();
    });

    it('should handle file selection', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('should show error for files exceeding size limit', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/exceeds 10MB limit/i)).toBeInTheDocument();
      });
    });

    it('should allow removing attachments', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // Find and click remove button
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(btn => btn.querySelector('.lucide-x'));
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });

    it('should send message with attachments', async () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByText('Send Message');

      fireEvent.change(textarea, { target: { value: 'Message with attachment' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Message with attachment', [file]);
      });
    });
  });

  describe('Expired Quote', () => {
    it('should show expired warning when isExpired is true', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isExpired={true}
        />
      );

      expect(screen.getByText(/This quote has expired/i)).toBeInTheDocument();
      expect(screen.getByText(/You can no longer send messages/i)).toBeInTheDocument();
    });

    it('should not show send form when expired', () => {
      render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isExpired={true}
        />
      );

      expect(screen.queryByPlaceholderText('Type your message...')).not.toBeInTheDocument();
      expect(screen.queryByText('Send Message')).not.toBeInTheDocument();
    });
  });

  describe('Message Styling', () => {
    it('should apply different styles for admin and vendor messages', () => {
      const { container } = render(
        <MessageThread
          messages={mockMessages}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Admin messages should have muted background
      const adminMessage = container.querySelector('.bg-muted');
      expect(adminMessage).toBeInTheDocument();

      // Vendor messages should have primary background
      const vendorMessage = container.querySelector('.bg-primary');
      expect(vendorMessage).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MessageThread
          messages={[]}
          onSendMessage={mockOnSendMessage}
          className="custom-class"
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });
});
