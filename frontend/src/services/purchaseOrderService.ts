import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface PurchaseOrder {
  uuid: string;
  po_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled';
  total_amount: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  expected_delivery_date?: string;
  pdf_url?: string;
  sent_at?: string;
  accepted_at?: string;
  created_at: string;
  vendor: {
    uuid: string;
    name: string;
    email: string;
  };
  order: {
    uuid: string;
    order_number: string;
  };
}

export interface GeneratePORequest {
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  send_to_vendor?: boolean;
}

export interface GeneratePOResponse {
  message: string;
  data: {
    po_uuid: string;
    po_number: string;
    status: string;
    pdf_url: string;
    sent_to_vendor: boolean;
  };
}

/**
 * Generate purchase order from accepted quote
 */
export async function generatePurchaseOrder(
  quoteUuid: string,
  data: GeneratePORequest = {}
): Promise<GeneratePOResponse> {
  const token = localStorage.getItem('auth_token');
  
  console.log('[PO Service] Generating PO for quote:', quoteUuid);
  console.log('[PO Service] API URL:', `${API_BASE_URL}/tenant/purchase-orders/generate-from-quote/${quoteUuid}`);
  console.log('[PO Service] Token present:', !!token);
  
  const response = await axios.post<GeneratePOResponse>(
    `${API_BASE_URL}/tenant/purchase-orders/generate-from-quote/${quoteUuid}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Get purchase order details
 */
export async function getPurchaseOrder(poUuid: string): Promise<PurchaseOrder> {
  const token = localStorage.getItem('auth_token');
  
  const response = await axios.get<{ data: PurchaseOrder }>(
    `${API_BASE_URL}/tenant/purchase-orders/${poUuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
}

/**
 * Get purchase order PDF URL for viewing
 */
export function getPurchaseOrderPDFUrl(poUuid: string): string {
  const token = localStorage.getItem('auth_token');
  return `${API_BASE_URL}/tenant/purchase-orders/${poUuid}/download?token=${token}`;
}

/**
 * Download purchase order PDF
 */
export async function downloadPurchaseOrderPDF(poUuid: string, filename: string = 'purchase-order.pdf'): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  const response = await axios.get(
    `${API_BASE_URL}/tenant/purchase-orders/${poUuid}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    }
  );

  // Create blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Send purchase order to vendor
 */
export async function sendPurchaseOrderToVendor(poUuid: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  await axios.post(
    `${API_BASE_URL}/tenant/purchase-orders/${poUuid}/send`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

