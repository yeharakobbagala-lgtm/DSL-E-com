import { apiClient } from '@/lib/api/apiClient';
import { BackInStockAlert, BackInStockStatusResponse } from '@/types/backInStock';

export const backInStockService = {
  /**
   * Subscribe an authenticated customer to back-in-stock notifications for an out-of-stock product.
   */
  async subscribe(productId: string): Promise<BackInStockAlert> {
    const res = await apiClient.post<any>('/back-in-stock/subscribe', { productId });
    return res && res.data !== undefined ? res.data : res;
  },

  /**
   * Get all back-in-stock alert subscriptions for the authenticated customer.
   */
  async getMyAlerts(): Promise<BackInStockAlert[]> {
    const res = await apiClient.get<any>('/back-in-stock/my-alerts');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  /**
   * Cancel an active alert subscription.
   */
  async cancelAlert(alertId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<any>(`/back-in-stock/${alertId}`);
    return res && res.data !== undefined ? res.data : res;
  },

  /**
   * Check whether the authenticated customer is subscribed to a product.
   */
  async getStatus(productId: string): Promise<BackInStockStatusResponse> {
    const res = await apiClient.get<any>(`/back-in-stock/status/${productId}`);
    return res && res.data !== undefined ? res.data : res;
  },
};
