import { pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// 1. Users Table (supporting both Firebase UID and MARIS credentials)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull().default('VENDEDOR'),
  active: boolean('active').notNull().default(true),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  createdAt: text('created_at').notNull(),
});

// 2. Products Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  barcode: text('barcode').notNull(),
  sku: text('sku').notNull(),
  costPrice: doublePrecision('cost_price').notNull(),
  salePrice: doublePrecision('sale_price').notNull(),
  wholesalePrice: doublePrecision('wholesale_price').notNull(),
  minStock: integer('min_stock').notNull().default(5),
  currentStock: integer('current_stock').notNull().default(0),
  imageUrl: text('image_url').notNull(),
  description: text('description').notNull(),
  unit: text('unit').notNull().default('UN'),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 3. Batches (Validade & Lotes - FEFO)
export const batches = pgTable('batches', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  batchNumber: text('batch_number').notNull(),
  expirationDate: text('expiration_date').notNull(),
  quantity: integer('quantity').notNull(),
  initialQuantity: integer('initial_quantity').notNull(),
  costPrice: doublePrecision('cost_price').notNull(),
  purchaseId: text('purchase_id'),
  status: text('status').notNull().default('OK'),
  createdAt: text('created_at').notNull(),
});

// 4. Customers Table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  document: text('document'),
  email: text('email'),
  phone: text('phone').notNull(),
  address: text('address'),
  totalSpent: doublePrecision('total_spent').notNull().default(0),
  lastPurchaseDate: text('last_purchase_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 5. Suppliers Table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tradeName: text('trade_name').notNull(),
  document: text('document').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  contactPerson: text('contact_person').notNull(),
  address: text('address').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: text('created_at').notNull(),
});

// 6. Purchases Table
export const purchases = pgTable('purchases', {
  id: text('id').primaryKey(),
  purchaseNumber: text('purchase_number').notNull(),
  supplierId: text('supplier_id').notNull(),
  supplierName: text('supplier_name').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  date: text('date').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull().default('RECEIVED'),
  items: jsonb('items').notNull(),
  createdAt: text('created_at').notNull(),
});

// 7. Sales Table
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  saleNumber: text('sale_number').notNull(),
  date: text('date').notNull(),
  sellerId: text('seller_id').notNull(),
  sellerName: text('seller_name').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  subtotal: doublePrecision('subtotal').notNull(),
  discount: doublePrecision('discount').notNull().default(0),
  total: doublePrecision('total').notNull(),
  costTotal: doublePrecision('cost_total').notNull(),
  paymentMethod: text('payment_method').notNull(),
  installments: integer('installments').notNull().default(1),
  status: text('status').notNull().default('COMPLETED'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: text('cancelled_at'),
  cancelledBy: text('cancelled_by'),
  items: jsonb('items').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 8. Financial Transactions Table
export const financialTransactions = pgTable('financial_transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'PAYABLE' | 'RECEIVABLE'
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  dueDate: text('due_date').notNull(),
  paymentDate: text('payment_date'),
  status: text('status').notNull().default('PENDING'),
  recipient: text('recipient').notNull(),
  referenceId: text('reference_id'),
  createdAt: text('created_at').notNull(),
});

// 9. Stock Movements Table
export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  batchId: text('batch_id'),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: text('reason').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  date: text('date').notNull(),
});

// 10. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  details: text('details').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
});

// 11. Store Settings Table
export const storeSettings = pgTable('store_settings', {
  id: text('id').primaryKey(),
  storeName: text('store_name').notNull(),
  tradeName: text('trade_name').notNull(),
  cnpj: text('cnpj').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  receiptFooter: text('receipt_footer').notNull(),
  defaultMinStock: integer('default_min_stock').notNull().default(5),
  validityAlertDays: integer('validity_alert_days').notNull().default(45),
});
