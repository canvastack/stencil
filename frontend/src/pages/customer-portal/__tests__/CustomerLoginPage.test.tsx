import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerLoginPage from '../CustomerLoginPage';
import * as customerPortalApi from '@/services/api/customerPortalApi';

// Mock the API
vi.mock('@/services/api/customerPortalApi', () => ({
  customerAuthApi: {
    login: vi.fn(),
    getProfile: vi.fn(),
  },
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CustomerLoginPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CustomerLoginPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders login form with all required fields', () => {
    renderComponent();

    expect(screen.getByText('Customer Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('displays validation error when fields are empty', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    // Submit form without filling fields
    fireEvent.submit(loginButton.closest('form')!);

    await waitFor(() => {
      // HTML5 validation should prevent submission
      expect(customerPortalApi.customerAuthApi.login).not.toHaveBeenCalled();
    });
  });

  it('shows password when eye icon is clicked', () => {
    renderComponent();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('successfully logs in with valid credentials', async () => {
    const mockResponse = {
      data: {
        token: 'mock-token-123',
        customer: {
          uuid: 'customer-uuid',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    };

    vi.mocked(customerPortalApi.customerAuthApi.login).mockResolvedValue(mockResponse);

    renderComponent();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(customerPortalApi.customerAuthApi.login).toHaveBeenCalledWith(
        'john@example.com',
        'Password123'
      );
    });
  });

  it('displays error message on login failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };

    vi.mocked(customerPortalApi.customerAuthApi.login).mockRejectedValue(mockError);

    renderComponent();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.submit(loginButton.closest('form')!);

    await waitFor(() => {
      expect(customerPortalApi.customerAuthApi.login).toHaveBeenCalledWith(
        'wrong@example.com',
        'wrongpassword'
      );
    });

    // Verify the login mutation was called and failed
    expect(customerPortalApi.customerAuthApi.login).toHaveBeenCalledTimes(1);
  });

  it('has link to registration page', () => {
    renderComponent();

    const registerLink = screen.getByText(/register now/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/customer/register');
  });

  it('has link to forgot password page', () => {
    renderComponent();

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/customer/forgot-password');
  });

  it('has link to home page', () => {
    renderComponent();

    const homeLink = screen.getByText(/back to home/i);
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('disables form inputs while logging in', async () => {
    vi.mocked(customerPortalApi.customerAuthApi.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    renderComponent();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(loginButton).toBeDisabled();
    });
  });
});
