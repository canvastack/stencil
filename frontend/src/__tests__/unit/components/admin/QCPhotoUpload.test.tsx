import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QCPhotoUpload } from '@/components/admin/QCPhotoUpload';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('QCPhotoUpload', () => {
  const mockOnPhotosChange = vi.fn();
  
  const defaultProps = {
    photos: [],
    onPhotosChange: mockOnPhotosChange,
    minPhotos: 2,
    maxPhotos: 5,
    itemName: 'Test Item',
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area with correct requirements', () => {
    render(<QCPhotoUpload {...defaultProps} />);
    
    expect(screen.getByText(/Minimum 2 required/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Min resolution: 1280x720px/i)).toBeInTheDocument();
  });

  it('shows minimum photo requirement alert when not met', () => {
    render(<QCPhotoUpload {...defaultProps} />);
    
    expect(screen.getByText(/Please upload at least 2 photo\(s\) for Test Item/i)).toBeInTheDocument();
  });

  it('does not show alert when minimum photos met', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
      { id: '2', file: new File([], 'test2.jpg'), url: 'blob:test2', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    expect(screen.queryByText(/Please upload at least/i)).not.toBeInTheDocument();
  });

  it('displays photo count badge correctly', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    expect(screen.getByText('1/5')).toBeInTheDocument();
  });

  it('shows check icon when minimum photos met', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
      { id: '2', file: new File([], 'test2.jpg'), url: 'blob:test2', caption: '' },
    ];
    
    const { container } = render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    const checkIcon = container.querySelector('.text-green-600');
    expect(checkIcon).toBeInTheDocument();
  });

  it('hides upload area when max photos reached', () => {
    const photos = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      file: new File([], `test${i}.jpg`),
      url: `blob:test${i}`,
      caption: '',
    }));
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    expect(screen.queryByText(/Click to upload or drag and drop/i)).not.toBeInTheDocument();
  });

  it('renders photo grid with correct number of photos', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
      { id: '2', file: new File([], 'test2.jpg'), url: 'blob:test2', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('displays photo number badges', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
      { id: '2', file: new File([], 'test2.jpg'), url: 'blob:test2', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders caption inputs for each photo', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    expect(screen.getByPlaceholderText('Add caption (optional)')).toBeInTheDocument();
  });

  it('updates caption when input changes', () => {
    const photos = [
      { id: '1', file: new File([], 'test1.jpg'), url: 'blob:test1', caption: '' },
    ];
    
    render(<QCPhotoUpload {...defaultProps} photos={photos} />);
    
    const captionInput = screen.getByPlaceholderText('Add caption (optional)');
    fireEvent.change(captionInput, { target: { value: 'Test caption' } });
    
    expect(mockOnPhotosChange).toHaveBeenCalledWith([
      expect.objectContaining({ caption: 'Test caption' })
    ]);
  });

  it('disables all interactions when disabled prop is true', () => {
    const { container } = render(<QCPhotoUpload {...defaultProps} disabled={true} />);
    
    const uploadArea = container.querySelector('[class*="border-dashed"]');
    expect(uploadArea).toHaveClass('opacity-50');
    expect(uploadArea).toHaveClass('cursor-not-allowed');
  });

  it('shows correct file requirements in upload area', () => {
    render(<QCPhotoUpload {...defaultProps} />);
    
    expect(screen.getByText(/Min resolution: 1280x720px • Max size: 5MB • JPEG\/PNG/i)).toBeInTheDocument();
  });

  it('handles drag over event', () => {
    const { container } = render(<QCPhotoUpload {...defaultProps} />);
    
    const uploadArea = container.querySelector('[class*="border-dashed"]');
    expect(uploadArea).toBeInTheDocument();
    
    if (uploadArea) {
      fireEvent.dragOver(uploadArea);
      expect(uploadArea).toHaveClass('border-primary');
    }
  });

  it('handles drag leave event', () => {
    const { container } = render(<QCPhotoUpload {...defaultProps} />);
    
    const uploadArea = container.querySelector('[class*="border-dashed"]');
    
    if (uploadArea) {
      fireEvent.dragOver(uploadArea);
      fireEvent.dragLeave(uploadArea);
      expect(uploadArea).not.toHaveClass('border-primary');
    }
  });
});
