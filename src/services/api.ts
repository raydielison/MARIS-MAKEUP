import {
  AuthSession,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  AccountPayable,
  AccountReceivable,
  CashMovement,
  StockMovement,
  AuditLog,
  StoreSettings,
  User,
  Brand,
  ProductCategory,
} from '../types.ts';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('marismakeup_token') || localStorage.getItem('belamakeup_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Sessão expirada ou não autenticada. Por favor, faça login novamente.');
      }
      throw new Error(`Erro no servidor (${res.status}): ${text.substring(0, 120)}`);
    }
    // If somehow a 200 response returned HTML instead of JSON
    throw new Error('Resposta do servidor em formato inesperado. Tente novamente em alguns instantes.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Erro na requisição');
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password?: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthSession>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
    return handleResponse<User[]>(res);
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse<User>(res);
  },

  async toggleUser(id: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}/toggle`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // Products & Catalog
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`, { headers: getAuthHeaders() });
    return handleResponse<Product[]>(res);
  },

  async createProduct(product: Partial<Product> & { initialStock?: number; batchNumber?: string; expiryDate?: string }): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(res);
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(res);
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async getBrands(): Promise<Brand[]> {
    const res = await fetch(`${API_BASE}/brands`, { headers: getAuthHeaders() });
    return handleResponse<Brand[]>(res);
  },

  async getCategories(): Promise<ProductCategory[]> {
    const res = await fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() });
    return handleResponse<ProductCategory[]>(res);
  },

  // Stock
  async getStockMovements(): Promise<StockMovement[]> {
    const res = await fetch(`${API_BASE}/stock/movements`, { headers: getAuthHeaders() });
    return handleResponse<StockMovement[]>(res);
  },

  async createStockMovement(data: {
    productId: string;
    batchId?: string;
    quantity: number;
    type: string;
    reason: string;
  }): Promise<{ success: boolean; movement: StockMovement; product: Product }> {
    const res = await fetch(`${API_BASE}/stock/movement`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; movement: StockMovement; product: Product }>(res);
  },

  // Validity
  async getValidity(): Promise<{
    summary: {
      expired: number;
      expiring7Days: number;
      expiring30Days: number;
      expiring60Days: number;
      expiring90Days: number;
      totalBatches: number;
    };
    items: Array<{
      batchId: string;
      productId: string;
      productName: string;
      sku: string;
      shade: string;
      brandName: string;
      batchNumber: string;
      expiryDate: string;
      manufacturingDate?: string;
      currentQuantity: number;
      daysRemaining: number;
      statusGroup: 'EXPIRED' | '7_DAYS' | '30_DAYS' | '60_DAYS' | '90_DAYS' | 'SAFE';
      isExpired: boolean;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/validity`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Sales & PDV
  async createSale(saleData: {
    customerId?: string;
    customerName?: string;
    discount?: number;
    paymentMethod: string;
    installments?: number;
    amountPaid?: number;
    notes?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>;
  }): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData),
    });
    return handleResponse<Sale>(res);
  },

  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`, { headers: getAuthHeaders() });
    return handleResponse<Sale[]>(res);
  },

  async cancelSale(id: string, reason: string): Promise<{ success: boolean; message: string; sale: Sale }> {
    const res = await fetch(`${API_BASE}/sales/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ success: boolean; message: string; sale: Sale }>(res);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customers`, { headers: getAuthHeaders() });
    return handleResponse<Customer[]>(res);
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(res);
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(res);
  },

  async deleteCustomer(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; id: string }>(res);
  },

  // Suppliers & Purchases
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE}/suppliers`, { headers: getAuthHeaders() });
    return handleResponse<Supplier[]>(res);
  },

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(res);
  },

  async getPurchases(): Promise<Purchase[]> {
    const res = await fetch(`${API_BASE}/purchases`, { headers: getAuthHeaders() });
    return handleResponse<Purchase[]>(res);
  },

  async createPurchase(purchase: {
    supplierId?: string;
    supplierName?: string;
    invoiceNumber?: string;
    paymentCondition?: 'PAGO' | 'A_PAGAR';
    paymentMethod?: string;
    dueDate?: string;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitCost: number;
      batchNumber?: string;
      manufacturingDate?: string;
      expiryDate?: string;
      shade?: string;
    }>;
  }): Promise<Purchase> {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(purchase),
    });
    return handleResponse<Purchase>(res);
  },

  // Financial
  async getPayables(): Promise<AccountPayable[]> {
    const res = await fetch(`${API_BASE}/financial/payables`, { headers: getAuthHeaders() });
    return handleResponse<AccountPayable[]>(res);
  },

  async createPayable(payable: Partial<AccountPayable>): Promise<AccountPayable> {
    const res = await fetch(`${API_BASE}/financial/payables`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payable),
    });
    return handleResponse<AccountPayable>(res);
  },

  async payPayable(id: string): Promise<{ success: boolean; payable: AccountPayable }> {
    const res = await fetch(`${API_BASE}/financial/payables/${id}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; payable: AccountPayable }>(res);
  },

  async getReceivables(): Promise<AccountReceivable[]> {
    const res = await fetch(`${API_BASE}/financial/receivables`, { headers: getAuthHeaders() });
    return handleResponse<AccountReceivable[]>(res);
  },

  async receiveReceivable(id: string): Promise<{ success: boolean; receivable: AccountReceivable }> {
    const res = await fetch(`${API_BASE}/financial/receivables/${id}/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; receivable: AccountReceivable }>(res);
  },

  async getCashFlow(): Promise<{
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
    movements: CashMovement[];
  }> {
    const res = await fetch(`${API_BASE}/financial/cashflow`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Dashboards
  async getAdminDashboard(period: string = 'month'): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/admin?period=${period}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getSellerDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/seller`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Audit & Settings
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit`, { headers: getAuthHeaders() });
    return handleResponse<AuditLog[]>(res);
  },

  async getSettings(): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
    return handleResponse<StoreSettings>(res);
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse<StoreSettings>(res);
  },

  async getDatabaseStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/database/status`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  async getSupabaseStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/database/supabase-status`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  async testSupabaseConnection(): Promise<any> {
    const res = await fetch(`${API_BASE}/database/supabase-test`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },

  async clearFictitiousData(): Promise<{ success: boolean; message: string; snapshot?: any }> {
    const res = await fetch(`${API_BASE}/database/clear-fictitious-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ success: boolean; message: string; snapshot?: any }>(res);
  },

  async getAlerts(): Promise<{
    lowStock: Array<{ id: string; name: string; boxSku: string; individualCode: string; stock: number; min: number }>;
    expiredBatches: any[];
    expiringSoonBatches: any[];
    overduePayables: any[];
  }> {
    const res = await fetch(`${API_BASE}/alerts`, { headers: getAuthHeaders() });
    return handleResponse<any>(res);
  },
};

