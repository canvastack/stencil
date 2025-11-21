import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import MediaLibrary from '@/pages/admin/MediaLibrary';

// Mock file services
const mockUploadFile = vi.fn();
const mockDeleteFile = vi.fn();
const mockGetFiles = vi.fn();

vi.mock('@/services/api/files', () => ({
  fileService: {
    uploadFile: mockUploadFile,
    deleteFile: mockDeleteFile,
    getFiles: mockGetFiles,
    getFileUrl: (filename: string) => `/uploads/${filename}`,
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('File Upload Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Media Library', () => {
    it('should display uploaded files', async () => {
      const mockFiles = [
        {
          id: '1',
          filename: 'product-image.jpg',
          originalName: 'Product Image.jpg',
          mimetype: 'image/jpeg',
          size: 245760,
          path: '/uploads/product-image.jpg',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: '2',
          filename: 'document.pdf',
          originalName: 'Product Catalog.pdf',
          mimetype: 'application/pdf',
          size: 1048576,
          path: '/uploads/document.pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      mockGetFiles.mockResolvedValue({
        files: mockFiles,
        total: 2,
        page: 1,
        limit: 20,
      });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for files to load
      await waitFor(() => {
        expect(screen.getByText('Product Image.jpg')).toBeInTheDocument();
        expect(screen.getByText('Product Catalog.pdf')).toBeInTheDocument();
      });

      // Check file details
      expect(screen.getByText('240 KB')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
    });

    it('should handle single file upload', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFile = createMockFile('test-image.jpg', 100000, 'image/jpeg');

      mockUploadFile.mockResolvedValue({
        id: '1',
        filename: 'test-image-123.jpg',
        originalName: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 100000,
        path: '/uploads/test-image-123.jpg',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user-1',
      });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);
      expect(fileInput).toBeInTheDocument();

      // Upload file
      await user.upload(fileInput, mockFile);

      // Verify upload was called
      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(mockFile, expect.any(Object));
      });
    });

    it('should handle multiple file upload', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFiles = [
        createMockFile('image1.jpg', 100000, 'image/jpeg'),
        createMockFile('image2.png', 150000, 'image/png'),
        createMockFile('document.pdf', 500000, 'application/pdf'),
      ];

      mockUploadFile
        .mockResolvedValueOnce({
          id: '1',
          filename: 'image1-123.jpg',
          originalName: 'image1.jpg',
          mimetype: 'image/jpeg',
          size: 100000,
          path: '/uploads/image1-123.jpg',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        })
        .mockResolvedValueOnce({
          id: '2',
          filename: 'image2-456.png',
          originalName: 'image2.png',
          mimetype: 'image/png',
          size: 150000,
          path: '/uploads/image2-456.png',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        })
        .mockResolvedValueOnce({
          id: '3',
          filename: 'document-789.pdf',
          originalName: 'document.pdf',
          mimetype: 'application/pdf',
          size: 500000,
          path: '/uploads/document-789.pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Upload multiple files
      await user.upload(fileInput, mockFiles);

      // Verify all uploads were called
      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledTimes(3);
      });
    });

    it('should validate file types', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const invalidFile = createMockFile('virus.exe', 100000, 'application/x-executable');

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Try to upload invalid file
      await user.upload(fileInput, invalidFile);

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
      });

      // Verify upload was not called
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('should validate file size limits', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      // Create file larger than typical limit (10MB)
      const oversizedFile = createMockFile('large-file.jpg', 11 * 1024 * 1024, 'image/jpeg');

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Try to upload oversized file
      await user.upload(fileInput, oversizedFile);

      // Check for size validation error
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds limit/i)).toBeInTheDocument();
      });

      // Verify upload was not called
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('should show upload progress', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFile = createMockFile('progress-test.jpg', 1000000, 'image/jpeg');

      // Mock upload with progress
      mockUploadFile.mockImplementation((file, options) => {
        const { onUploadProgress } = options || {};
        
        // Simulate progress updates
        setTimeout(() => onUploadProgress?.({ loaded: 250000, total: 1000000 }), 100);
        setTimeout(() => onUploadProgress?.({ loaded: 500000, total: 1000000 }), 200);
        setTimeout(() => onUploadProgress?.({ loaded: 750000, total: 1000000 }), 300);
        setTimeout(() => onUploadProgress?.({ loaded: 1000000, total: 1000000 }), 400);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: '1',
              filename: 'progress-test-123.jpg',
              originalName: 'progress-test.jpg',
              mimetype: 'image/jpeg',
              size: 1000000,
              path: '/uploads/progress-test-123.jpg',
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'user-1',
            });
          }, 500);
        });
      });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Upload file
      await user.upload(fileInput, mockFile);

      // Check for progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should delete files', async () => {
      const mockFiles = [
        {
          id: '1',
          filename: 'delete-me.jpg',
          originalName: 'Delete Me.jpg',
          mimetype: 'image/jpeg',
          size: 100000,
          path: '/uploads/delete-me.jpg',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      mockGetFiles.mockResolvedValue({
        files: mockFiles,
        total: 1,
        page: 1,
        limit: 20,
      });

      mockDeleteFile.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for file to load
      await waitFor(() => {
        expect(screen.getByText('Delete Me.jpg')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Verify delete was called
      await waitFor(() => {
        expect(mockDeleteFile).toHaveBeenCalledWith('1');
      });
    });

    it('should filter files by type', async () => {
      const allFiles = [
        {
          id: '1',
          filename: 'image.jpg',
          originalName: 'Image.jpg',
          mimetype: 'image/jpeg',
          size: 100000,
          path: '/uploads/image.jpg',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
        {
          id: '2',
          filename: 'document.pdf',
          originalName: 'Document.pdf',
          mimetype: 'application/pdf',
          size: 200000,
          path: '/uploads/document.pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'user-1',
        },
      ];

      const imageFiles = [allFiles[0]];

      mockGetFiles
        .mockResolvedValueOnce({
          files: allFiles,
          total: 2,
          page: 1,
          limit: 20,
        })
        .mockResolvedValueOnce({
          files: imageFiles,
          total: 1,
          page: 1,
          limit: 20,
        });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for all files to load
      await waitFor(() => {
        expect(screen.getByText('Image.jpg')).toBeInTheDocument();
        expect(screen.getByText('Document.pdf')).toBeInTheDocument();
      });

      // Filter by images
      const filterSelect = screen.getByRole('combobox', { name: /filter by type/i });
      await user.click(filterSelect);
      await user.click(screen.getByText('Images'));

      // Verify filter was applied
      await waitFor(() => {
        expect(mockGetFiles).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'image' })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload errors', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFile = createMockFile('error-test.jpg', 100000, 'image/jpeg');

      mockUploadFile.mockRejectedValue(new Error('Upload failed'));

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Try to upload file
      await user.upload(fileInput, mockFile);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during upload', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFile = createMockFile('network-error.jpg', 100000, 'image/jpeg');

      mockUploadFile.mockRejectedValue(new Error('Network Error'));

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find file input
      const fileInput = screen.getByLabelText(/upload files/i);

      // Try to upload file
      await user.upload(fileInput, mockFile);

      // Check for network error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle file loading errors', async () => {
      mockGetFiles.mockRejectedValue(new Error('Failed to load files'));

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Check for loading error
      await waitFor(() => {
        expect(screen.getByText(/failed to load files/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag and drop upload', async () => {
      mockGetFiles.mockResolvedValue({
        files: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const mockFile = createMockFile('drag-drop.jpg', 100000, 'image/jpeg');

      mockUploadFile.mockResolvedValue({
        id: '1',
        filename: 'drag-drop-123.jpg',
        originalName: 'drag-drop.jpg',
        mimetype: 'image/jpeg',
        size: 100000,
        path: '/uploads/drag-drop-123.jpg',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user-1',
      });

      render(
        <TestWrapper>
          <MediaLibrary />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Media Library')).toBeInTheDocument();
      });

      // Find drop zone
      const dropZone = screen.getByText(/drop files here/i).closest('div');
      expect(dropZone).toBeInTheDocument();

      // Simulate drag and drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.assign(dropEvent, {
        dataTransfer: {
          files: [mockFile],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Verify upload was called
      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith(mockFile, expect.any(Object));
      });
    });
  });
});