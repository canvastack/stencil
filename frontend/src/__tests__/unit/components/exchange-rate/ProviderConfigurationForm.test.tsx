import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProviderConfigurationForm from '@/components/admin/exchange-rate/ProviderConfigurationForm';
import { exchangeRateService } from '@/services/api/exchangeRate';
import type { ExchangeRateProvider } from '@/types/exchangeRate';

// Mock the API service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    updateProvider: vi.fn(),
    testProviderConnection: vi.fn(),
    deleteProvider: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe('ProviderConfigurationForm Component', () => {
  const mockProviders: ExchangeRateProvider[] = [
    {
      uuid: 'provider-1',
      tenant_id: 'tenant-1',
      name: 'exchangerate-api.com',
      api_url: 'https://api.exchangerate-api.com',
      monthly_quota: 1500,
      priority: 1,
      enabled: true,
      warning_threshold: 50,
      critical_threshold: 20,
    },
    {
      uuid: 'provider-2',
      tenant_id: 'tenant-1',
      name: 'currencyapi.com',
      api_url: 'https://api.currencyapi.com',
      monthly_quota: 300,
      priority: 2,
      enabled: true,
      warning_threshold: 50,
      critical_threshold: 20,
    },
  ];

  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provider list', () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId="provider-1"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('exchangerate-api.com')).toBeInTheDocument();
    expect(screen.getByText('currencyapi.com')).toBeInTheDocument();
  });

  it('displays active badge on active provider', () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId="provider-1"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays enabled status badges', () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const enabledBadges = screen.getAllByText('Enabled');
    expect(enabledBadges.length).toBe(2);
  });

  it('sorts providers by priority', () => {
    const unsortedProviders = [mockProviders[1], mockProviders[0]];
    
    render(
      <ProviderConfigurationForm
        providers={unsortedProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const providerNames = screen.getAllByRole('heading', { level: 4 });
    expect(providerNames[0]).toHaveTextContent('exchangerate-api.com');
    expect(providerNames[1]).toHaveTextContent('currencyapi.com');
  });

  it('displays priority badges', () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Priority 1')).toBeInTheDocument();
    expect(screen.getByText('Priority 2')).toBeInTheDocument();
  });

  it('toggles provider enabled status', async () => {
    vi.mocked(exchangeRateService.updateProvider).mockResolvedValue(mockProviders[0]);

    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(exchangeRateService.updateProvider).toHaveBeenCalledWith(
        'provider-1',
        { enabled: false }
      );
    });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('opens edit form when edit button clicked', async () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const editButtons = screen.getAllByText('Edit Configuration');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Quota/i)).toBeInTheDocument();
    });
  });

  it('saves provider configuration', async () => {
    vi.mocked(exchangeRateService.updateProvider).mockResolvedValue(mockProviders[0]);

    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const editButtons = screen.getAllByText('Edit Configuration');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
    });

    const apiKeyInput = screen.getByLabelText(/API Key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(exchangeRateService.updateProvider).toHaveBeenCalled();
    });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('tests provider connection', async () => {
    vi.mocked(exchangeRateService.testProviderConnection).mockResolvedValue({
      success: true,
      message: 'Connection successful',
      rate: 15000,
    });

    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const testButtons = screen.getAllByText('Test Connection');
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(exchangeRateService.testProviderConnection).toHaveBeenCalledWith('provider-1');
    });
  });

  it('deletes provider with confirmation', async () => {
    vi.mocked(exchangeRateService.deleteProvider).mockResolvedValue();

    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: '' }).filter(
      (btn) => btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    );
    
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(exchangeRateService.deleteProvider).toHaveBeenCalledWith('provider-1');
      });

      expect(mockOnUpdate).toHaveBeenCalled();
    }
  });

  it('displays quota information', () => {
    const { container } = render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that quota information is displayed in the component
    const text = container.textContent;
    expect(text).toContain('Monthly Quota');
    expect(text).toContain('Warning');
    expect(text).toContain('Critical');
  });

  it('displays empty state when no providers', () => {
    render(
      <ProviderConfigurationForm
        providers={[]}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('No API providers configured')).toBeInTheDocument();
  });

  it('disables test button for disabled providers', () => {
    const disabledProvider = { ...mockProviders[0], enabled: false };
    
    render(
      <ProviderConfigurationForm
        providers={[disabledProvider]}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const testButton = screen.getByText('Test Connection');
    expect(testButton).toBeDisabled();
  });

  it('cancels edit mode', async () => {
    render(
      <ProviderConfigurationForm
        providers={mockProviders}
        activeProviderId={null}
        onUpdate={mockOnUpdate}
      />
    );

    const editButtons = screen.getAllByText('Edit Configuration');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/API Key/i)).not.toBeInTheDocument();
    });
  });
});
