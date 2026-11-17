import { apiClient, BackendApiResponse, BackendPaginatedResponse } from '@/lib/api/apiClient';

export type BankDepositStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PaymentMethod = 'CARD_PAYHERE' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type RejectionCategory =
  | 'UNREADABLE_RECEIPT'
  | 'AMOUNT_MISMATCH'
  | 'REFERENCE_NOT_FOUND'
  | 'SUSPECTED_FRAUD'
  | 'INCORRECT_ACCOUNT'
  | 'PAYMENT_EXPIRED'
  | 'OTHER';

export const REJECTION_CATEGORY_LABELS: Record<RejectionCategory, string> = {
  UNREADABLE_RECEIPT: 'Receipt Unreadable / Blurry',
  AMOUNT_MISMATCH: 'Deposit Amount Mismatch',
  REFERENCE_NOT_FOUND: 'Transaction Reference Not Found on Bank Statement',
  SUSPECTED_FRAUD: 'Suspected Tampered or Duplicate Slip',
  INCORRECT_ACCOUNT: 'Transferred to Incorrect Bank Account',
  PAYMENT_EXPIRED: 'Payment Expired / Window Closed',
  OTHER: 'Other Discrepancy',
};

export interface BankTransferQueueItem {
  id: string;
  orderId: string;
  referenceNumber: string | null;
  depositDate: string | null;
  amountCents: number;
  status: BankDepositStatus;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmountCents: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    } | null;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface BankTransferDetailItem extends BankTransferQueueItem {
  receiptStorageKey: string;
  order: BankTransferQueueItem['order'] & {
    deliveryAddress: any;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      priceCents: number;
      totalCents: number;
    }>;
    paymentAttempts: Array<{
      id: string;
      status: string;
      paymentMethod: string;
      amountCents: number;
      gatewayPaymentId: string | null;
      createdAt: string;
    }>;
  };
}

export interface PaymentsSummary {
  totalPaidVolumeCents: number;
  totalTransactions: number;
  bankTransfers: {
    pending: number;
    verified: number;
    rejected: number;
    totalVolumeCents: number;
  };
  payhereCards: {
    succeeded: number;
    pending: number;
    failed: number;
    totalVolumeCents: number;
  };
  cashOnDelivery: {
    pendingCollection: number;
    deliveredPaid: number;
    totalVolumeCents: number;
  };
}

export interface PaymentTransactionItem {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmountCents: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  createdAt: string;
  paidAt: string | null;
  bankTransferDetails: {
    submissionId: string;
    status: BankDepositStatus;
    referenceNumber: string | null;
    depositDate: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
  } | null;
  latestPaymentAttempt: {
    id: string;
    status: string;
    gatewayRef: string | null;
    createdAt: string;
  } | null;
}

export interface PaymentsReconciliationReport {
  summary: {
    totalCheckedOrders: number;
    totalAnomalies: number;
    healthy: boolean;
  };
  anomalies: Array<{
    type: string;
    orderId: string;
    orderNumber: string;
    paymentStatus: string;
    orderStatus: string;
    details: string;
  }>;
  checkedAt: string;
}

export interface BankTransferQueryParams {
  page?: number;
  limit?: number;
  status?: BankDepositStatus | 'ALL';
  search?: string;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'amountCents' | 'depositDate';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentsDashboardQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  paymentMethod?: PaymentMethod | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  orderStatus?: OrderStatus | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'totalAmountCents' | 'paidAt';
  sortOrder?: 'asc' | 'desc';
}

export const paymentsService = {
  /**
   * Fetch aggregate payments summary metrics.
   */
  async getSummary(params?: { dateFrom?: string; dateTo?: string }): Promise<PaymentsSummary> {
    const response = await apiClient.get<BackendApiResponse<PaymentsSummary>>(
      '/admin/payments/summary',
      { params }
    );
    return response.data;
  },

  /**
   * Fetch paginated payment transactions across all payment methods.
   */
  async getTransactions(params?: PaymentsDashboardQueryParams): Promise<BackendPaginatedResponse<PaymentTransactionItem>> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== 'ALL' && v !== '' && v !== undefined && v !== null) {
          if (k === 'dateFrom') cleanParams.startDate = v;
          else if (k === 'dateTo') cleanParams.endDate = v;
          else cleanParams[k] = v;
        }
      });
    }

    const res = await apiClient.get<any>(
      '/admin/payments/transactions',
      { params: cleanParams }
    );

    // If already wrapped in paginated format with data array (e.g. from tests)
    if (res && Array.isArray(res.data)) {
      return res;
    }

    const rawData = res?.data || res;
    const items = Array.isArray(rawData?.items) ? rawData.items : (Array.isArray(rawData) ? rawData : []);
    const pagination = rawData?.pagination || {};

    const normalizedData: PaymentTransactionItem[] = items.map((it: any) => ({
      id: it.id,
      orderNumber: it.orderNumber,
      orderStatus: it.orderStatus,
      paymentStatus: it.paymentStatus,
      paymentMethod: it.paymentMethod,
      totalAmountCents: it.totalCents ?? it.totalAmountCents ?? 0,
      currency: it.currency || 'LKR',
      customerName: it.customerName || 'Customer',
      customerEmail: it.customerEmail || '',
      customerPhone: it.customerPhone || null,
      createdAt: it.createdAt,
      paidAt: it.paidAt || (it.paymentStatus === 'PAID' ? it.updatedAt : null),
      bankTransferDetails: it.bankSubmissionId ? {
        submissionId: it.bankSubmissionId,
        status: it.bankVerificationStatus || 'PENDING',
        referenceNumber: it.transactionReference || null,
        depositDate: it.depositDate || null,
        rejectionReason: it.rejectionReason || null,
        reviewedAt: it.reviewedAt || null,
      } : it.bankTransferDetails || null,
      latestPaymentAttempt: it.transactionReference ? {
        id: it.id,
        status: it.paymentStatus,
        gatewayRef: it.transactionReference,
        createdAt: it.createdAt,
      } : it.latestPaymentAttempt || null,
    }));

    return {
      success: true,
      data: normalizedData,
      meta: {
        totalItems: pagination.total ?? normalizedData.length,
        totalPages: pagination.totalPages ?? 1,
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        hasNextPage: (pagination.page ?? 1) < (pagination.totalPages ?? 1),
        hasPreviousPage: (pagination.page ?? 1) > 1,
      },
    };
  },

  /**
   * Fetch paginated Bank Transfer review queue.
   */
  async getBankTransfers(params?: BankTransferQueryParams): Promise<BackendPaginatedResponse<BankTransferQueueItem>> {
    return apiClient.get<BackendPaginatedResponse<BankTransferQueueItem>>(
      '/admin/payments/bank-transfers',
      { params: params as Record<string, any> }
    );
  },

  /**
   * Fetch complete Bank Transfer details including order, items, and verification status.
   */
  async getBankTransferDetails(id: string): Promise<BankTransferDetailItem> {
    const response = await apiClient.get<BackendApiResponse<BankTransferDetailItem>>(
      `/admin/payments/bank-transfers/${id}`
    );
    return response.data;
  },

  /**
   * Approve a bank transfer submission (Manager / Admin).
   */
  async approveBankTransfer(
    id: string,
    payload?: { adminNotes?: string },
    confirmationPhrase?: string
  ): Promise<{ success: boolean; message: string }> {
    const options = confirmationPhrase
      ? { headers: { 'x-action-confirmation': confirmationPhrase } }
      : undefined;
    const response = await apiClient.post<BackendApiResponse<{ success: boolean; message: string }>>(
      `/admin/payments/bank-transfers/${id}/approve`,
      payload || {},
      options
    );
    return response.data;
  },

  /**
   * Reject a bank transfer submission with mandatory reason category and note (Manager / Admin).
   */
  async rejectBankTransfer(
    id: string,
    payload: { category: RejectionCategory; explanation: string },
    confirmationPhrase?: string
  ): Promise<{ success: boolean; message: string; stockRestored: boolean }> {
    const options = confirmationPhrase
      ? { headers: { 'x-action-confirmation': confirmationPhrase } }
      : undefined;
    const response = await apiClient.post<BackendApiResponse<{ success: boolean; message: string; stockRestored: boolean }>>(
      `/admin/payments/bank-transfers/${id}/reject`,
      payload,
      options
    );
    return response.data;
  },

  /**
   * Get secure URL for viewing/downloading the receipt file (Manager / Admin).
   */
  getReceiptFileUrl(submissionId: string): string {
    return `${apiClient.getBaseUrl()}/checkout/bank-receipt/${submissionId}`;
  },

  /**
   * Download CSV export of payment transactions with spreadsheet formula protection.
   */
  async downloadCsvExport(params?: PaymentsDashboardQueryParams): Promise<void> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== 'ALL' && v !== '' && v !== undefined && v !== null) {
          if (k === 'dateFrom') cleanParams.startDate = v;
          else if (k === 'dateTo') cleanParams.endDate = v;
          else cleanParams[k] = v;
        }
      });
    }
    const url = apiClient.buildUrl('/admin/payments/export/csv', cleanParams);
    const token = typeof window !== 'undefined' ? localStorage.getItem('dsl_admin_token') : null;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `dsl-payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Fetch read-only financial consistency / reconciliation report.
   */
  async getReconciliationReport(): Promise<PaymentsReconciliationReport> {
    const response = await apiClient.get<BackendApiResponse<PaymentsReconciliationReport>>(
      '/admin/payments/reconciliation-report'
    );
    return response.data;
  },
};
