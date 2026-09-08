import fs from 'fs';
import path from 'path';
import {
  User,
  Brand,
  ProductCategory,
  Supplier,
  Product,
  StockBatch,
  StockMovement,
  Customer,
  Sale,
  Purchase,
  AccountPayable,
  AccountReceivable,
  CashMovement,
  AuditLog,
  StoreSettings
} from '../src/types.ts';

export interface DatabaseSchema {
  users: User[];
  brands: Brand[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  products: Product[];
  batches: StockBatch[];
  stockMovements: StockMovement[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  cashMovements: CashMovement[];
  auditLogs: AuditLog[];
  settings: StoreSettings;
}

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Notice: Local data dir not writable, memory persistence active:', err);
}

// Initial clean seed data generator - Ready for real data registration
export function generateSequentialStoreId(baseStoreId: string, index: number): string {
  if (index === 0) return baseStoreId.trim();
  const trimmed = baseStoreId.trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const nextNum = parseInt(numStr, 10) + index;
    const padded = nextNum.toString().padStart(numStr.length, '0');
    return `${prefix}${padded}`;
  }
  return `${trimmed}-${index + 1}`;
}

function getInitialSeedData(): DatabaseSchema {
  const now = new Date();
  
  const addDays = (d: Date, days: number): string => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy.toISOString().split('T')[0];
  };

  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'Marina (Administradora)',
      email: 'marina@makeup.com.br',
      password: 'marinamakeup',
      role: 'ADMIN',
      active: true,
      avatarUrl: '',
      phone: '(11) 98765-4321',
      createdAt: addDays(now, -120),
    },
    {
      id: 'usr_vendedor_1',
      name: 'Vendedora MARIS',
      email: 'vendedor@makeup.com.br',
      password: 'vendedormakeup',
      role: 'VENDEDOR',
      active: true,
      avatarUrl: '',
      phone: '(11) 97654-3210',
      createdAt: addDays(now, -90),
    },
    {
      id: 'usr_vendedor_2',
      name: 'Beatriz Souza',
      email: 'beatriz@makeup.com.br',
      password: 'vendedormakeup',
      role: 'VENDEDOR',
      active: true,
      avatarUrl: '',
      phone: '(11) 96543-2109',
      createdAt: addDays(now, -60),
    },
  ];

  const brands: Brand[] = [
    { id: 'b_bt', name: 'Bruna Tavares', description: 'Linha profissional nacional de alta performance', active: true },
    { id: 'b_boca', name: 'Boca Rosa Beauty', description: 'Produtos icônicos de maquiagem e pele', active: true },
    { id: 'b_fran', name: 'Franciny Ehlke', description: 'Coleção Mboom com produtos inovadores', active: true },
    { id: 'b_mari', name: 'Mari Maria Makeup', description: 'Bases aveludadas, batons e pincéis', active: true },
    { id: 'b_ruby', name: 'Ruby Rose / Melu', description: 'Excelente custo-benefício e tendências', active: true },
    { id: 'b_vizzela', name: 'Vizzela Cosméticos', description: 'Marca 100% vegana e cruelty free', active: true },
    { id: 'b_mac', name: 'MAC Cosmetics', description: 'Referência mundial em maquiagem profissional', active: true },
  ];

  const categories: ProductCategory[] = [
    { id: 'cat_face', name: 'Pele & Rosto', slug: 'pele-rosto', description: 'Bases, corretivos, pós e blushes', active: true },
    { id: 'cat_olhos', name: 'Olhos & Sobrancelhas', slug: 'olhos', description: 'Sombras, rímel, delineadores e lápis', active: true },
    { id: 'cat_labios', name: 'Lábios', slug: 'labios', description: 'Batons, glosses, lip tints e lápis labial', active: true },
    { id: 'cat_skincare', name: 'Preparação & Fixação', slug: 'preparacao-fixacao', description: 'Brumas, primers e fixadores', active: true },
    { id: 'cat_acessorios', name: 'Acessórios & Pincéis', slug: 'acessorios', description: 'Esponjas, pincéis e curvex', active: true },
  ];

  // Clean empty tables ready for real user-entered data
  const suppliers: Supplier[] = [];
  const products: Product[] = [];
  const batches: StockBatch[] = [];
  const stockMovements: StockMovement[] = [];
  const customers: Customer[] = [];
  const sales: Sale[] = [];
  const purchases: Purchase[] = [];
  const accountsPayable: AccountPayable[] = [];
  const accountsReceivable: AccountReceivable[] = [];
  const cashMovements: CashMovement[] = [];
  const auditLogs: AuditLog[] = [
    {
      id: 'audit_init',
      userId: 'usr_admin',
      userName: 'Marina (Administradora)',
      userRole: 'ADMIN',
      action: 'SISTEMA_INICIALIZADO',
      entity: 'SISTEMA',
      entityId: 'sys_maris',
      description: 'Base de dados inicializada e limpa para cadastro de dados reais da MARIS MAKEUP.',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    },
  ];

  const settings: StoreSettings = {
    storeName: 'MARIS MAKEUP',
    tradeName: 'MARIS MAKEUP - Cosméticos & Beleza',
    cnpj: '33.987.654/0001-22',
    phone: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    email: 'contato@marismakeup.com.br',
    address: 'Av. Paulista, 1200 - Loja 15 - Bela Vista, São Paulo - SP',
    receiptFooter: 'Obrigada pela preferência! Trocas em até 7 dias com embalagem lacrada.',
    defaultMinStock: 5,
    validityAlertDays: [7, 30, 60, 90],
    maxDiscountAllowedPercent: 15,
    autoFefoStockDeduction: true,
  };

  return {
    users,
    brands,
    categories,
    suppliers,
    products,
    batches,
    stockMovements,
    customers,
    sales,
    purchases,
    accountsPayable,
    accountsReceivable,
    cashMovements,
    auditLogs,
    settings,
  };
}

// Database class with memory cache & persistent sync
class RelationalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.normalizeProducts();
  }

  // Ensures: "Estoque nao deve ficar agrupado no mesmo cadastro mais de 1 unidade, deve ser separado por ID da loja e agrupado por SKU na mesma sequencia"
  public normalizeProducts(): void {
    if (!this.data.products || this.data.products.length === 0) return;
    const products = this.data.products;
    const normalized: Product[] = [];
    let hasChanges = false;

    for (const p of products) {
      if (p.currentStock && p.currentStock > 1) {
        hasChanges = true;
        const totalUnits = Math.floor(p.currentStock);
        const baseStoreId = (p.storeIdCode || p.individualCode || p.barcode || String(Math.floor(10000 + Math.random() * 90000))).trim();

        for (let i = 0; i < totalUnits; i++) {
          const unitStoreId = generateSequentialStoreId(baseStoreId, i);
          normalized.push({
            ...p,
            id: i === 0 ? p.id : `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
            storeIdCode: unitStoreId,
            individualCode: unitStoreId,
            barcode: unitStoreId,
            currentStock: 1,
            sku: p.boxSku || p.sku,
            boxSku: p.boxSku || p.sku,
          });
        }
      } else {
        normalized.push(p);
      }
    }

    if (hasChanges) {
      this.data.products = normalized;
      this.saveData();
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
      if (fs.existsSync(BUNDLED_DB_FILE)) {
        const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.saveData(parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('Error loading database from disk, creating seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave: DatabaseSchema = this.data): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to db.json:', err);
    }
  }

  // Get current state
  public getSnapshot(): DatabaseSchema {
    return this.data;
  }

  public save(): void {
    this.saveData(this.data);
  }

  // Audit helper
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
  }

  // Clear mock / fictitious business data while preserving login users & store settings
  public clearFictitiousData(): DatabaseSchema {
    this.data.suppliers = [];
    this.data.products = [];
    this.data.batches = [];
    this.data.stockMovements = [];
    this.data.customers = [];
    this.data.sales = [];
    this.data.purchases = [];
    this.data.accountsPayable = [];
    this.data.accountsReceivable = [];
    this.data.cashMovements = [];
    this.data.auditLogs = [
      {
        id: `audit_clean_${Date.now()}`,
        userId: 'usr_admin',
        userName: 'Marina (Administradora)',
        userRole: 'ADMIN',
        action: 'SISTEMA_LIMPO',
        entity: 'SISTEMA',
        entityId: 'sys_maris',
        description: 'Base de dados limpa. Todos os dados fictícios foram removidos para entrada de dados reais.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      },
    ];
    this.save();
    return this.data;
  }
}

export const db = new RelationalDatabase();
