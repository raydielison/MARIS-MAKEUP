export type UserRole = 'ADMIN' | 'VENDEDOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
  phone?: string;
  password?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  corporateName: string; // Razão Social
  tradeName: string; // Nome Fantasia
  cnpj: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string; // YYYY-MM-DD
  initialQuantity: number;
  currentQuantity: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string; // SKU geral / compatibilidade
  boxSku?: string; // Número SKU que veio na caixa (embalagem de fábrica/fornecedor)
  storeIdCode?: string; // Número ID da loja para identificação e venda
  individualCode?: string; // Código ID individual para venda unitária (etiqueta/bipador)
  barcode: string;
  name: string;
  brandId: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  subcategory?: string;
  description?: string;
  shade?: string; // Cor/Tonalidade (ex: "Boca Rosa 02", "Pó Translúcido Rosado")
  hexColor?: string; // Ex: "#D19C7C" para swatch visual
  supplierId?: string;
  supplierName?: string;
  purchaseLocation?: string; // Local de compra (loja, fornecedor, distribuidor, cidade)
  expiryDate?: string; // Data de validade do produto/lote
  costPrice: number; // Preço de compra / custo (ocultado do vendedor)
  sellPrice: number; // Preço de venda
  marginValue: number; // sellPrice - costPrice (ocultado do vendedor)
  marginPercent: number; // ((sell - cost) / cost) * 100 (ocultado do vendedor)
  profitMargin?: number;
  currentStock: number;
  minStock: number;
  unit: 'un' | 'kit' | 'par' | 'ml' | 'g' | string;
  photo?: string;
  active: boolean;
  trackBatches: boolean;
  batches?: StockBatch[];
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'IN_PURCHASE'
  | 'IN_ADJUSTMENT'
  | 'IN_RETURN'
  | 'OUT_SALE'
  | 'OUT_ADJUSTMENT'
  | 'OUT_EXPIRED'
  | 'OUT_DAMAGED';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  type: MovementType;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  cpf?: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  email?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchaseDate?: string;
  active: boolean;
  createdAt: string;
}

export type PaymentMethod =
  | 'DINHEIRO'
  | 'PIX'
  | 'DEBITO'
  | 'CREDITO'
  | 'PARCELADO'
  | 'BOLETO'
  | 'LINK_PAGAMENTO'
  | 'CARTAO_A_VISTA'
  | 'CARTAO_PARCELADO'
  | 'OUTROS'
  | string;

export type SaleStatus =
  | 'FINALIZADA'
  | 'CANCELADA'
  | 'DEVOLVIDA'
  | 'PARCIALMENTE_DEVOLVIDA';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  shade?: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number; // Ocultado do vendedor
  discount: number;
  totalPrice: number;
  returnedQuantity?: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  sellerId: string;
  sellerName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  total: number;
  costTotal?: number; // Ocultado do vendedor
  profitTotal?: number; // Ocultado do vendedor
  paymentMethod: PaymentMethod;
  installments?: number;
  amountPaid?: number;
  change?: number;
  status: SaleStatus;
  cancelReason?: string;
  cancelledByUserId?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  invoiceNumber?: string;
  paymentMethod: PaymentMethod;
  paymentCondition?: 'PAGO' | 'A_PAGAR';
  paymentStatus?: 'PAGO' | 'PENDENTE';
  dueDate?: string;
  totalCost: number;
  status: 'RECEBIDA' | 'PENDENTE' | 'CANCELADA';
  notes?: string;
  userId: string;
  userName: string;
  items: PurchaseItem[];
  createdAt: string;
}

export type AccountStatus = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';

export type ExpenseCategory =
  | 'FORNECEDOR'
  | 'ALUGUEL'
  | 'FUNCIONARIOS'
  | 'ENERGIA'
  | 'AGUA'
  | 'INTERNET'
  | 'IMPOSTOS'
  | 'MARKETING'
  | 'TRANSPORTE'
  | 'MANUTENCAO'
  | 'OUTRAS'
  | 'OUTROS'
  | string;

export interface AccountPayable {
  id: string;
  description: string;
  category: ExpenseCategory;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: AccountStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface AccountReceivable {
  id: string;
  saleId: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: AccountStatus;
  paymentMethod: PaymentMethod;
  installmentNumber: number;
  totalInstallments: number;
  notes?: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  type: 'ENTRADA' | 'SAIDA';
  category: string;
  description: string;
  amount: number;
  date: string;
  time: string;
  referenceType: 'SALE' | 'PURCHASE' | 'PAYABLE' | 'RECEIVABLE' | 'MANUAL';
  referenceId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  description: string;
  timestamp: string;
}

export interface StoreSettings {
  storeName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  receiptFooter: string;
  defaultMinStock: number;
  validityAlertDays: number[];
  maxDiscountAllowedPercent: number;
  autoFefoStockDeduction: boolean;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  };
}

export interface DashboardMetrics {
  period: string;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueSelectedPeriod: number;
  salesCount: number;
  averageTicket: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expensesTotal: number;
  estimatedNetProfit: number;
  // Alerts
  lowStockCount: number;
  outOfStockCount: number;
  expiringIn7DaysCount: number;
  expiringIn30DaysCount: number;
  expiredCount: number;
  overduePayablesCount: number;
  upcomingPayablesCount: number;
  stagnantProductsCount: number;
}
