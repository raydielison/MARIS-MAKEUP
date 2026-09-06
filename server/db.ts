import fs from 'fs';
import path from 'path';
import type { User, Brand, ProductCategory, Supplier, Product, StockBatch, StockMovement, Customer, Sale, Purchase, AccountPayable, AccountReceivable, CashMovement, AuditLog, StoreSettings } from '../src/types.ts';

export interface DatabaseSchema {
  users: User[]; brands: Brand[]; categories: ProductCategory[]; suppliers: Supplier[]; products: Product[]; batches: StockBatch[]; stockMovements: StockMovement[]; customers: Customer[]; sales: Sale[]; purchases: Purchase[]; accountsPayable: AccountPayable[]; accountsReceivable: AccountReceivable[]; cashMovements: CashMovement[]; auditLogs: AuditLog[]; settings: StoreSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString().slice(0, 10);
  const users: User[] = [
    { id:'usr_admin', name:'Marina (Administradora)', email:'marina@makeup.com.br', password:'marinamakeup', role:'ADMIN', active:true, avatarUrl:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', phone:'(11) 98765-4321', createdAt:now },
    { id:'usr_vendedor_1', name:'Vendedora MARIS', email:'vendedor@makeup.com.br', password:'vendedormakeup', role:'VENDEDOR', active:true, avatarUrl:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', phone:'(11) 97654-3210', createdAt:now },
    { id:'usr_vendedor_2', name:'Beatriz Souza', email:'beatriz@makeup.com.br', password:'vendedormakeup', role:'VENDEDOR', active:true, avatarUrl:'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', phone:'(11) 96543-2109', createdAt:now }
  ];
  return {
    users, brands:[{id:'b_bt',name:'Bruna Tavares',description:'Linha profissional nacional de alta performance',active:true},{id:'b_boca',name:'Boca Rosa Beauty',description:'Produtos icônicos de maquiagem e pele',active:true},{id:'b_fran',name:'Franciny Ehlke',description:'Coleção Mboom com produtos inovadores',active:true},{id:'b_mari',name:'Mari Maria Makeup',description:'Bases aveludadas, batons e pincéis',active:true},{id:'b_ruby',name:'Ruby Rose / Melu',description:'Excelente custo-benefício e tendências',active:true},{id:'b_vizzela',name:'Vizzela Cosméticos',description:'Marca 100% vegana e cruelty free',active:true},{id:'b_mac',name:'MAC Cosmetics',description:'Referência mundial em maquiagem profissional',active:true}],
    categories:[{id:'cat_face',name:'Pele & Rosto',slug:'pele-rosto',description:'Bases, corretivos, pós e blushes',active:true},{id:'cat_olhos',name:'Olhos & Sobrancelhas',slug:'olhos',description:'Sombras, rímel, delineadores e lápis',active:true},{id:'cat_labios',name:'Lábios',slug:'labios',description:'Batons, glosses, lip tints e lápis labial',active:true},{id:'cat_skincare',name:'Preparação & Fixação',slug:'preparacao-fixacao',description:'Brumas, primers e fixadores',active:true},{id:'cat_acessorios',name:'Acessórios & Pincéis',slug:'acessorios',description:'Esponjas, pincéis e curvex',active:true}],
    suppliers:[], products:[], batches:[], stockMovements:[], customers:[], sales:[], purchases:[], accountsPayable:[], accountsReceivable:[], cashMovements:[], auditLogs:[],
    settings:{storeName:'MARIS MAKEUP',tradeName:'MARIS MAKEUP - Cosméticos & Beleza',cnpj:'33.987.654/0001-22',phone:'(11) 3456-7890',whatsapp:'(11) 98765-4321',email:'contato@marismakeup.com.br',address:'Av. Paulista, 1200 - Loja 15 - Bela Vista, São Paulo - SP',receiptFooter:'Obrigada pela preferência! Trocas em até 7 dias com embalagem lacrada.',defaultMinStock:5,validityAlertDays:[7,30,60,90],maxDiscountAllowedPercent:15,autoFefoStockDeduction:true}
  };
}

class RelationalDatabase {
  private data: DatabaseSchema;
  constructor(){ this.data=this.loadData(); }
  private loadData(): DatabaseSchema {
    try { if(fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE,'utf-8')); } catch(err){ console.error('Error loading local database:',err); }
    const seed=getInitialSeedData();
    try{ fs.writeFileSync(DB_FILE,JSON.stringify(seed,null,2),'utf-8'); }catch(err){ console.error('Error writing local seed:',err); }
    return seed;
  }
  public getSnapshot(): DatabaseSchema { return this.data; }
  public save(): void { try{ fs.writeFileSync(DB_FILE,JSON.stringify(this.data,null,2),'utf-8'); }catch(err){ console.error('Error writing db.json:',err); } }
  public addAuditLog(log: Omit<AuditLog,'id'|'timestamp'>): void { this.data.auditLogs.unshift({...log,id:`audit_${Date.now()}`,timestamp:new Date().toISOString().replace('T',' ').substring(0,19)}); this.save(); }
  public clearFictitiousData(): DatabaseSchema { this.data.suppliers=[];this.data.products=[];this.data.batches=[];this.data.stockMovements=[];this.data.customers=[];this.data.sales=[];this.data.purchases=[];this.data.accountsPayable=[];this.data.accountsReceivable=[];this.data.cashMovements=[];this.data.auditLogs=[];this.save();return this.data; }
}

export const db = new RelationalDatabase();
