import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordForm } from '../ChangePasswordForm';
import { useUserStore } from '@/services/userStore';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ChangePasswordForm Component', () => {
  const mockChangePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({
      changePassword: mockChangePassword,
    } as any);
  });

  it('renders all three password input fields with visibility toggles', () => {
    render(<ChangePasswordForm variant="customer" />);

    expect(screen.getByPlaceholderText('Enter your current password')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter new strong password')).toBeDefined();
    expect(screen.getByPlaceholderText('Re-enter your new password')).toBeDefined();
    expect(screen.getByText('Save New Password')).toBeDefined();

    // Password fields default to type="password"
    const currentInput = screen.getByPlaceholderText('Enter your current password') as HTMLInputElement;
    expect(currentInput.type).toBe('password');

    // Toggle visibility
    const showButtons = screen.getAllByRole('button', { name: /show|hide/i });
    expect(showButtons.length).toBe(3);
    fireEvent.click(showButtons[0]);
    expect(currentInput.type).toBe('text');
    fireEvent.click(showButtons[0]);
    expect(currentInput.type).toBe('password');
  });

  it('disables submit button when passwords do not satisfy policy or match', () => {
    render(<ChangePasswordForm variant="customer" />);

    const submitBtn = screen.getByRole('button', { name: /save new password/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newInput = screen.getByPlaceholderText('Enter new strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');

    // Enter weak password
    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    expect(submitBtn.disabled).toBe(true);

    // Enter strong password but confirmation mismatch
    fireEvent.change(newInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchPass123!' } });
    expect(submitBtn.disabled).toBe(true);
    expect(screen.getByText('Passwords do not match')).toBeDefined();

    // Enter matching strong password identical to current password
    fireEvent.change(currentInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
    expect(submitBtn.disabled).toBe(true);

    // Enter valid distinct strong password
    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    expect(submitBtn.disabled).toBe(false);
    expect(screen.getByText('Passwords match')).toBeDefined();
  });

  it('submits successfully, clears inputs, and renders success message', async () => {
    mockChangePassword.mockResolvedValueOnce({
      success: true,
      message: 'Password changed successfully! All active sessions have been revoked.',
      requireReauth: true,
    });

    render(<ChangePasswordForm variant="customer" onSuccessRedirect="/login" />);

    const currentInput = screen.getByPlaceholderText('Enter your current password') as HTMLInputElement;
    const newInput = screen.getByPlaceholderText('Enter new strong password') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /save new password/i });

    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'NewStrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewStrongPass123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass123!',
        newPassword: 'NewStrongPass123!',
        confirmNewPassword: 'NewStrongPass123!',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Password Changed Successfully!')).toBeDefined();
    });

    // Inputs should be cleared
    expect(currentInput.value).toBe('');
    expect(newInput.value).toBe('');
    expect(confirmInput.value).toBe('');
  });

  it('displays error alert when backend rejects current password', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Current password is incorrect'));

    render(<ChangePasswordForm variant="customer" />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newInput = screen.getByPlaceholderText('Enter new strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const submitBtn = screen.getByRole('button', { name: /save new password/i });

    fireEvent.change(currentInput, { target: { value: 'WrongPass123!' } });
    fireEvent.change(newInput, { target: { value: 'NewStrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewStrongPass123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeDefined();
    });
  });

  it('handles 401 session expiration error and triggers redirect', async () => {
    const error401: any = new Error('Unauthorized');
    error401.status = 401;
    mockChangePassword.mockRejectedValueOnce(error401);

    render(<ChangePasswordForm variant="admin" onSuccessRedirect="/admin/login" />);

    const currentInput = screen.getByPlaceholderText('Enter your current password');
    const newInput = screen.getByPlaceholderText('Enter new strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter your new password');
    const submitBtn = screen.getByRole('button', { name: /save new password/i });

    fireEvent.change(currentInput, { target: { value: 'OldPass123!' } });
    fireEvent.change(newInput, { target: { value: 'NewStrongPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewStrongPass123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your session has expired/i)).toBeDefined();
    });
  });
});
