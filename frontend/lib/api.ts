import { envConfig } from './config';

const API_BASE_URL = envConfig.apiUrl;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  fetchApi: (endpoint: string, options: RequestInit = {}) => fetchApi(endpoint, options),
  getSettings: () => fetchApi('/restaurant/settings'),
  updateSettings: (data: any) =>
    fetchApi('/restaurant/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getMenu: (fastingOnly = false, lang = 'en') =>
    fetchApi(`/menu?fasting_only=${fastingOnly}&lang=${lang}`),
  getAdminMenu: () => fetchApi('/menu/admin'),

  validateQrToken: (tableId: string, token: string) =>
    fetchApi(`/tables/validate?table_id=${tableId}&token=${token}`),
  getTables: () => fetchApi('/tables'),
  rotateQrToken: (id: string) => fetchApi(`/tables/${id}/rotate-token`, { method: 'POST' }),

  login: (credentials: any) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  waiterPinLogin: (dto: { tableId?: string; pin: string }) =>
    fetchApi('/auth/waiter-pin', { method: 'POST', body: JSON.stringify(dto) }),

  createOrder: (orderDto: any) =>
    fetchApi('/orders', { method: 'POST', body: JSON.stringify(orderDto) }),
  createWaiterOrder: (orderDto: any) =>
    fetchApi('/orders/waiter', { method: 'POST', body: JSON.stringify(orderDto) }),
  getOrder: (id: string) => fetchApi(`/orders/${id}`),
  getTableOrders: (tableId: string) => fetchApi(`/orders/table/${tableId}`),
  updateOrderStatus: (id: string, status: string) =>
    fetchApi(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  processPayment: (dto: any) =>
    fetchApi('/payments/process', { method: 'POST', body: JSON.stringify(dto) }),
  confirmCashierPayment: (orderId: string) =>
    fetchApi(`/payments/confirm-cashier/${orderId}`, { method: 'POST' }),
  settleTableBill: (tableId: string) =>
    fetchApi(`/orders/settle-table/${tableId}`, { method: 'POST' }),

  getStationTickets: (station: string) => fetchApi(`/kot/station?station=${station}`),
  updateKotTicketStatus: (id: string, status: string) =>
    fetchApi(`/kot/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getCashierQueue: () => fetchApi('/orders/cashier-queue'),
};
