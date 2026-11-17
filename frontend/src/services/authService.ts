import { apiClient } from '@/lib/api/apiClient';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  requireReauth?: boolean;
}

export const authService = {
  /**
   * Phase 3B: Authenticated password change for customers and administrators.
   * Sends current password and new password to POST /api/v1/auth/change-password.
   * On success, the backend revokes all active sessions/refresh tokens and clears cookies.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponse> {
    const res = await apiClient.post<ChangePasswordResponse>('/auth/change-password', payload);
    return res;
  },
};
