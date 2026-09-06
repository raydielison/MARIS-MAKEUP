export const SUPABASE_SQL_SCRIPT = `-- ==========================================================
-- MARIS MAKEUP - Schema de Tabelas para Supabase (PostgreSQL)
-- Cole este script no "SQL Editor" do seu painel Supabase
-- ==========================================================

-- 1. Tabela de Usuários e Perfis RBAC
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  uid TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'VENDEDOR',
  active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  phone TEXT,
  created_at TEXT NOT NULL
);

-- Inserir perfis iniciais da MARIS MAKEUP
INSERT INTO public.users (id, name, email, password, role, active, created_at)
VALUES 
  ('usr_admin', 'Marina (Administradora)', 'marina@makeup.com.br', 'marinamakeup', 'ADMIN', true, NOW()::TEXT),
  ('usr_vendedor_1', 'Vendedora MARIS', 'vendedor@makeup.com.br', 'vendedormakeup', 'VENDEDOR', true, NOW()::TEXT)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role;

-- 2. Tabela de Produtos & Estoque
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT NOT NULL,
  sku TEXT NOT NULL,
  cost_price DOUBLE PRECISION NOT NULL,
  sale_price DOUBLE PRECISION NOT NULL,
  wholesale_price DOUBLE PRECISION NOT NULL,
  min_stock INTEGER NOT NULL DEFAULT 5,
  current_stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'UN',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Tabela de Lotes & Validades (FEFO)
CREATE TABLE IF NOT EXISTS public.batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  initial_quantity INTEGER NOT NULL,
  cost_price DOUBLE PRECISION NOT NULL,
  purchase_id TEXT,
  status TEXT NOT NULL DEFAULT 'OK',
  created_at TEXT NOT NULL
);

-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  total_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_purchase_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 5. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  document TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL
);

-- 6. Tabela de Compras / Notas Fiscais
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  purchase_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  date TEXT NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  items JSONB NOT NULL,
  created_at TEXT NOT NULL
);

-- 7. Tabela de Vendas PDV
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  sale_number TEXT NOT NULL,
  date TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total DOUBLE PRECISION NOT NULL,
  cost_total DOUBLE PRECISION NOT NULL,
  payment_method TEXT NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  cancellation_reason TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT,
  items JSONB NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 8. Tabela Financeira (Contas a Pagar e Receber)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  due_date TEXT NOT NULL,
  payment_date TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  recipient TEXT NOT NULL,
  reference_id TEXT,
  created_at TEXT NOT NULL
);

-- 9. Movimentações de Estoque (Auditoria de Kardex)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch_id TEXT,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  date TEXT NOT NULL
);

-- 10. Trilha de Auditoria Imutável
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB
);

-- 11. Configurações da Loja
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  receipt_footer TEXT NOT NULL,
  default_min_stock INTEGER NOT NULL DEFAULT 5,
  validity_alert_days INTEGER NOT NULL DEFAULT 45
);
`;
