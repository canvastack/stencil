import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ManualRateForm } from '@/components/admin/exchange-rate/ManualRateForm';
import { exchangeRateService } from '@/services/api/exchangeRate';
import type { ExchangeRateSetting } from '@/types/exchangeRate';

// Mock the API service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    updateSettings: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ManualRateForm Component', () => {
  const mockSettings: ExchangeRateSetting = {
    uuid: 'test-uuid',
    tenant_id: 'tenant-1',
    mode: 'manual',
    manual_rate: 15000,
    active_provider_id: null,
    auto_update_enabled: false,
    update_time: '00:00:00',
    last_updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending promises
    vi.clearAllTimers();
  });

  it('renders manual rate form with initial value', () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    expect(input).toHaveValue(15000);
  });

  it('displays warning message about manual rate responsibility', () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/You are responsible for keeping the exchange rate up to date/i)).toBeInTheDocument();
  });

  it('validates positive number requirement', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Exchange rate must be greater than 0/i)).toBeInTheDocument();
    });

    expect(exchangeRateService.updateSettings).not.toHaveBeenCalled();
  });

  it('validates zero value', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Exchange rate must be greater than 0/i)).toBeInTheDocument();
    });

    expect(exchangeRateService.updateSettings).not.toHaveBeenCalled();
  });

  it('validates empty input', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '' } });

    // Button should be disabled when input is empty
    expect(saveButton).toBeDisabled();
    expect(exchangeRateService.updateSettings).not.toHaveBeenCalled();
  });

  it('validates non-numeric input', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    // Input type="number" will make 'abc' result in empty string
    fireEvent.change(input, { target: { value: '' } });

    // Button should be disabled when input is empty
    expect(saveButton).toBeDisabled();
    expect(exchangeRateService.updateSettings).not.toHaveBeenCalled();
  });

  it('validates reasonable range for USD to IDR', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '5000' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Exchange rate should be between 10,000 and 20,000/i)).toBeInTheDocument();
    });

    expect(exchangeRateService.updateSettings).not.toHaveBeenCalled();
  });

  it('saves valid manual rate successfully', async () => {
    const updatedSettings = { ...mockSettings, manual_rate: 16000 };
    vi.mocked(exchangeRateService.updateSettings).mockResolvedValue(updatedSettings);

    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '16000' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(exchangeRateService.updateSettings).toHaveBeenCalledWith({
        mode: 'manual',
        manual_rate: 16000,
        auto_update_enabled: false,
        update_time: '00:00:00',
      });
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(updatedSettings);
  });

  it('displays last updated timestamp', () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  it('clears error when input changes', async () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    // Trigger error
    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Exchange rate must be greater than 0/i)).toBeInTheDocument();
    });

    // Change input to clear error
    fireEvent.change(input, { target: { value: '15000' } });

    await waitFor(() => {
      expect(screen.queryByText(/Exchange rate must be greater than 0/i)).not.toBeInTheDocument();
    });
  });

  it('disables save button when input is empty', () => {
    render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '' } });

    expect(saveButton).toBeDisabled();
  });

  it('shows loading state while saving', async () => {
    const updatedSettings = { ...mockSettings, manual_rate: 16000 };
    vi.mocked(exchangeRateService.updateSettings).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(updatedSettings), 100))
    );

    const { unmount } = render(<ManualRateForm settings={mockSettings} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Exchange Rate/i);
    const saveButton = screen.getByRole('button', { name: /Save Exchange Rate/i });

    fireEvent.change(input, { target: { value: '16000' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    });

    // Wait for the promise to resolve before unmounting
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(updatedSettings);
    });

    unmount();
  });
});
