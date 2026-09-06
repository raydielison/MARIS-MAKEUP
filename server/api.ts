import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { getSupabase, isSupabaseConfigured } from './supabase.ts';

export const apiRouter = Router();
export interface AuthenticatedRequest extends Request { user?: any; }

const tokenStore = new Map<string, string>([
  ['token_admin_demo', 'usr_admin'],
  ['token_vendedor_demo', 'usr_vendedor_1'],
  ['token_vendedor_2_demo', 'usr_vendedor_2'],
]);

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'Token de autenticação não fornecido' }); return; }
  const token = authHeader.slice(7);
  const userId = tokenStore.get(token);
  if (!userId) { res.status(401).json({ error: 'Sessão inválida ou expirada' }); return; }
  const user = db.getSnapshot().users.find((u: any) => u.id === userId && u.active);
  if (!user) { res.status(401).json({ error: 'Usuário inativo ou inexistente' }); return; }
  req.user = user;
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Acesso Negado: Esta operação requer privilégios de Administrador.' }); return; }
  next();
};

function daysRemaining(value: string) {
  const d = new Date(value); d.setHours(0,0,0,0);
  const n = new Date(); n.setHours(0,0,0,0);
  return Math.ceil((d.getTime()-n.getTime()) / 86400000);
}

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const user = db.getSnapshot().users.find((u: any) => u.email.toLowerCase() === String(email || '').trim().toLowerCase() && u.active);
  if (!user) { res.status(401).json({ error: 'E-mail ou usuário não encontrado ou inativo.' }); return; }
  if (user.password && password !== user.password) { res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' }); return; }
  const token = user.id === 'usr_admin' ? 'token_admin_demo' : user.id === 'usr_vendedor_1' ? 'token_vendedor_demo' : `token_${user.id}`;
  tokenStore.set(token, user.id);
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role, avatarUrl:user.avatarUrl, phone:user.phone } });
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => res.json({ user:req.user }));

apiRouter.get('/dashboard/admin', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const period = String(req.query.period || 'month');
    let products:any[] = [], batches:any[] = [], sales:any[] = [], payables:any[] = [];
    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      const results = await Promise.all([
        sb.from('products').select('*'), sb.from('batches').select('*'),
        sb.from('sales').select('*'), sb.from('financial_transactions').select('*')
      ]);
      const [p,b,s,f] = results;
      if (p.error) throw new Error(`Supabase products: ${p.error.message}`);
      if (b.error && !/does not exist|relation/i.test(b.error.message)) throw new Error(`Supabase batches: ${b.error.message}`);
      if (s.error) throw new Error(`Supabase sales: ${s.error.message}`);
      if (f.error && !/does not exist|relation/i.test(f.error.message)) throw new Error(`Supabase financial_transactions: ${f.error.message}`);
      products=p.data||[]; batches=b.data||[]; sales=s.data||[]; payables=f.data||[];
    } else {
      const snap:any=db.getSnapshot(); products=snap.products; batches=snap.batches; sales=snap.sales; payables=snap.accountsPayable;
    }
    const completed=sales.filter((s:any)=>s.status==='FINALIZADA');
    const today=new Date().toISOString().slice(0,10);
    const inDays=(date:any,n:number)=>{const d=new Date(date);const t=new Date();t.setDate(t.getDate()-n);return d>=t;};
    let selected=completed;
    if(period==='today')selected=completed.filter((s:any)=>s.date===today);
    else if(period==='yesterday'){const d=new Date();d.setDate(d.getDate()-1);selected=completed.filter((s:any)=>s.date===d.toISOString().slice(0,10));}
    else if(period==='7days')selected=completed.filter((s:any)=>inDays(s.date,7));
    else selected=completed.filter((s:any)=>inDays(s.date,30));
    const sum=(xs:any[],key:string)=>xs.reduce((a,x)=>a+Number(x[key]||0),0);
    const revenueToday=sum(completed.filter((s:any)=>s.date===today),'total');
    const revenueWeek=sum(completed.filter((s:any)=>inDays(s.date,7)),'total');
    const revenueMonth=sum(completed.filter((s:any)=>inDays(s.date,30)),'total');
    const revenueSelectedPeriod=sum(selected,'total');
    const costOfGoodsSold=sum(selected,'costTotal');
    const expensesTotal=payables.filter((x:any)=>x.status==='PAGO'&&x.category!=='FORNECEDOR').reduce((a,x)=>a+Number(x.amount||x.value||0),0);
    const lowStock=products.filter((p:any)=>Number(p.currentStock??p.current_stock??0)>0&&Number(p.currentStock??p.current_stock??0)<=Number(p.minStock??p.min_stock??0));
    const outOfStock=products.filter((p:any)=>Number(p.currentStock??p.current_stock??0)===0);
    const activeBatches=batches.filter((b:any)=>Number(b.currentQuantity??b.current_quantity??0)>0);
    const expired=activeBatches.filter((b:any)=>daysRemaining(b.expiryDate??b.expiry_date)<0);
    const exp7=activeBatches.filter((b:any)=>{const d=daysRemaining(b.expiryDate??b.expiry_date);return d>=0&&d<=7;});
    const exp30=activeBatches.filter((b:any)=>{const d=daysRemaining(b.expiryDate??b.expiry_date);return d>=0&&d<=30;});
    const overdue=payables.filter((p:any)=>p.status==='PENDENTE'&&daysRemaining(p.dueDate??p.due_date)<0);
    const productMap:any={};
    selected.forEach((s:any)=>(s.items||s.sale_items||[]).forEach((i:any)=>{const id=i.productId||i.product_id;if(!productMap[id])productMap[id]={name:i.productName||i.product_name||'',brand:'',quantity:0,total:0};productMap[id].quantity+=Number(i.quantity||0);productMap[id].total+=Number(i.totalPrice||i.total_price||0);}));
    const sellerMap:any={};selected.forEach((s:any)=>{const id=s.sellerId||s.seller_id;if(!sellerMap[id])sellerMap[id]={name:s.sellerName||s.seller_name||'',count:0,total:0};sellerMap[id].count++;sellerMap[id].total+=Number(s.total||0);});
    const paymentMap:any={};selected.forEach((s:any)=>{const m=s.paymentMethod||s.payment_method||'OUTROS';paymentMap[m]=(paymentMap[m]||0)+Number(s.total||0);});
    const soldIds=new Set(selected.flatMap((s:any)=>(s.items||s.sale_items||[]).map((i:any)=>i.productId||i.product_id)));
    res.json({metrics:{period,revenueToday,revenueWeek,revenueMonth,revenueSelectedPeriod,salesCount:selected.length,averageTicket:selected.length?Number((revenueSelectedPeriod/selected.length).toFixed(2)):0,costOfGoodsSold,grossProfit:revenueSelectedPeriod-costOfGoodsSold,expensesTotal,estimatedNetProfit:revenueSelectedPeriod-costOfGoodsSold-expensesTotal,lowStockCount:lowStock.length,outOfStockCount:outOfStock.length,expiringIn7DaysCount:exp7.length,expiringIn30DaysCount:exp30.length,expiredCount:expired.length,overduePayablesCount:overdue.length,upcomingPayablesCount:0,stagnantProductsCount:products.filter((p:any)=>Number(p.currentStock??p.current_stock??0)>0&&!soldIds.has(p.id)).length},alerts:{lowStock:lowStock.map((p:any)=>({id:p.id,name:p.name,boxSku:p.boxSku||p.box_sku||p.sku,individualCode:p.individualCode||p.individual_code||p.barcode,stock:p.currentStock??p.current_stock,min:p.minStock??p.min_stock})),outOfStock:outOfStock.map((p:any)=>({id:p.id,name:p.name,boxSku:p.boxSku||p.box_sku||p.sku,individualCode:p.individualCode||p.individual_code||p.barcode})),expired:expired.map((b:any)=>({batchNumber:b.batchNumber||b.batch_number,productName:products.find((p:any)=>p.id===(b.productId||b.product_id))?.name,days:daysRemaining(b.expiryDate||b.expiry_date)})),expiringSoon:exp7.map((b:any)=>({batchNumber:b.batchNumber||b.batch_number,productName:products.find((p:any)=>p.id===(b.productId||b.product_id))?.name,days:daysRemaining(b.expiryDate||b.expiry_date)})),overduePayables:overdue.map((p:any)=>({description:p.description,amount:p.amount||p.value,dueDate:p.dueDate||p.due_date}))},charts:{topProducts:Object.values(productMap).sort((a:any,b:any)=>b.quantity-a.quantity).slice(0,5),salesBySeller:Object.values(sellerMap),salesByPaymentMethod:paymentMap}});
  } catch(error:any){console.error('Dashboard Supabase error:',error);res.status(500).json({error:error?.message||'Erro ao carregar dashboard',source:'supabase'});}
});

apiRouter.get('/database/status',authenticate,requireAdmin,(_req,res)=>res.json({configured:isSupabaseConfigured()}));
apiRouter.get('/database/supabase-status',authenticate,requireAdmin,(_req,res)=>res.json({configured:isSupabaseConfigured()}));
apiRouter.get('/database/supabase-test',authenticate,requireAdmin,async(_req,res)=>{try{if(!isSupabaseConfigured())return res.status(503).json({ok:false,error:'Supabase não configurado'});const {error}=await getSupabase().from('products').select('id').limit(1);if(error)throw error;res.json({ok:true});}catch(e:any){res.status(500).json({ok:false,error:e.message});}});
apiRouter.get('/alerts',authenticate,(_req,res)=>res.json({lowStock:[],expiredBatches:[],expiringSoonBatches:[],overduePayables:[]}));
apiRouter.get('/validity',authenticate,(_req,res)=>res.json({expired:[],expiringSoon:[]}));

export default apiRouter;
