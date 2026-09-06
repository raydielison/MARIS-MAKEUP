import express, { Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '10mb' }));

let supabaseClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (url && /^https?:\/\//.test(url)) return url.replace(/\/+$/, '');
  return '';
}

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = getSupabaseUrl();
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase não configurado: defina SUPABASE_URL e SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY na Vercel.');
    }
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

function isAdmin(req: Request): boolean {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice('Bearer '.length).trim();
  return token === 'token_admin_demo' || token.startsWith('token_admin_');
}

// Vercel rewrites /api and /api/ to this function. Keep the root endpoint valid.
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'MARIS MAKEUP API' });
});

app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'MARIS MAKEUP API' });
});

app.get('/api/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'MARIS MAKEUP API' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get(['/dashboard/admin', '/api/dashboard/admin'], async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
    return;
  }

  try {
    const supabase = getSupabase();
    const period = String(req.query.period || 'month');
    const [salesResult, productsResult, batchesResult, financeResult] = await Promise.all([
      supabase.from('sales').select('*'),
      supabase.from('products').select('*'),
      supabase.from('batches').select('*'),
      supabase.from('financial_transactions').select('*'),
    ]);

    if (salesResult.error) throw new Error(`Supabase sales: ${salesResult.error.message}`);
    if (productsResult.error) throw new Error(`Supabase products: ${productsResult.error.message}`);

    const sales: any[] = salesResult.data || [];
    const products: any[] = productsResult.data || [];
    const batches: any[] = batchesResult.error ? [] : (batchesResult.data || []);
    const finance: any[] = financeResult.error ? [] : (financeResult.data || []);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dateOf = (row: any) => String(row?.date ?? row?.sale_date ?? row?.created_at ?? '').slice(0, 10);
    const amountOf = (row: any) => Number(row?.total ?? row?.total_amount ?? row?.amount ?? 0) || 0;
    const costOf = (row: any) => Number(row?.costTotal ?? row?.cost_total ?? row?.cost_of_goods_sold ?? 0) || 0;
    const completed = sales.filter((s) => String(s?.status ?? 'FINALIZADA').toUpperCase() === 'FINALIZADA');
    const daysAgo = period === 'today' ? 0 : period === 'yesterday' ? 1 : period === '7days' ? 7 : 30;
    const threshold = new Date(today);
    threshold.setHours(0, 0, 0, 0);
    threshold.setDate(threshold.getDate() - daysAgo);
    const thresholdStr = threshold.toISOString().slice(0, 10);
    let selected = completed;
    if (period === 'today') selected = completed.filter((s) => dateOf(s) === todayStr);
    else if (period === 'yesterday') selected = completed.filter((s) => dateOf(s) === thresholdStr);
    else selected = completed.filter((s) => dateOf(s) >= thresholdStr && dateOf(s) <= todayStr);

    const revenueToday = completed.filter((s) => dateOf(s) === todayStr).reduce((a, s) => a + amountOf(s), 0);
    const weekThreshold = new Date(today); weekThreshold.setDate(weekThreshold.getDate() - 7);
    const monthThreshold = new Date(today); monthThreshold.setDate(monthThreshold.getDate() - 30);
    const revenueWeek = completed.filter((s) => dateOf(s) >= weekThreshold.toISOString().slice(0, 10)).reduce((a, s) => a + amountOf(s), 0);
    const revenueMonth = completed.filter((s) => dateOf(s) >= monthThreshold.toISOString().slice(0, 10)).reduce((a, s) => a + amountOf(s), 0);
    const revenueSelectedPeriod = selected.reduce((a, s) => a + amountOf(s), 0);
    const costOfGoodsSold = selected.reduce((a, s) => a + costOf(s), 0);
    const grossProfit = revenueSelectedPeriod - costOfGoodsSold;
    const stockOf = (p: any) => Number(p?.currentStock ?? p?.current_stock ?? p?.stock ?? 0) || 0;
    const minStockOf = (p: any) => Number(p?.minStock ?? p?.min_stock ?? 0) || 0;
    const lowStock = products.filter((p) => stockOf(p) > 0 && stockOf(p) <= minStockOf(p));
    const outOfStock = products.filter((p) => stockOf(p) === 0);
    const daysRemaining = (value: any) => {
      if (!value) return 999999;
      const d = new Date(String(value));
      if (Number.isNaN(d.getTime())) return 999999;
      d.setHours(0, 0, 0, 0);
      const t = new Date(); t.setHours(0, 0, 0, 0);
      return Math.ceil((d.getTime() - t.getTime()) / 86400000);
    };
    const activeBatches = batches.filter((b) => Number(b?.currentQuantity ?? b?.current_quantity ?? b?.quantity ?? 0) > 0);
    const expired = activeBatches.filter((b) => daysRemaining(b?.expiryDate ?? b?.expiry_date) < 0);
    const expiring7 = activeBatches.filter((b) => { const d = daysRemaining(b?.expiryDate ?? b?.expiry_date); return d >= 0 && d <= 7; });
    const overdue = finance.filter((p) => String(p?.status ?? '').toUpperCase() === 'PENDENTE' && daysRemaining(p?.dueDate ?? p?.due_date) < 0);

    res.status(200).json({
      metrics: {
        period, revenueToday, revenueWeek, revenueMonth, revenueSelectedPeriod,
        salesCount: selected.length,
        averageTicket: selected.length ? Number((revenueSelectedPeriod / selected.length).toFixed(2)) : 0,
        costOfGoodsSold, grossProfit, expensesTotal: 0, estimatedNetProfit: grossProfit,
        lowStockCount: lowStock.length, outOfStockCount: outOfStock.length,
        expiringIn7DaysCount: expiring7.length,
        expiringIn30DaysCount: activeBatches.filter((b) => { const d = daysRemaining(b?.expiryDate ?? b?.expiry_date); return d >= 0 && d <= 30; }).length,
        expiredCount: expired.length, overduePayablesCount: overdue.length,
        upcomingPayablesCount: 0, stagnantProductsCount: 0,
      },
      alerts: {
        lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, boxSku: p.boxSku ?? p.box_sku ?? p.sku, individualCode: p.individualCode ?? p.individual_code ?? p.barcode, stock: stockOf(p), min: minStockOf(p) })),
        outOfStock: outOfStock.map((p) => ({ id: p.id, name: p.name, boxSku: p.boxSku ?? p.box_sku ?? p.sku, individualCode: p.individualCode ?? p.individual_code ?? p.barcode })),
        expired: expired.map((b) => ({ batchNumber: b.batchNumber ?? b.batch_number, productName: products.find((p) => String(p.id) === String(b.productId ?? b.product_id))?.name, days: daysRemaining(b.expiryDate ?? b.expiry_date) })),
        expiringSoon: expiring7.map((b) => ({ batchNumber: b.batchNumber ?? b.batch_number, productName: products.find((p) => String(p.id) === String(b.productId ?? b.product_id))?.name, days: daysRemaining(b.expiryDate ?? b.expiry_date) })),
        overduePayables: overdue.map((p) => ({ description: p.description, amount: p.amount ?? p.value ?? 0, dueDate: p.dueDate ?? p.due_date })),
      },
      charts: { topProducts: [], salesBySeller: [], salesByPaymentMethod: {} },
    });
  } catch (error: any) {
    console.error('Erro no dashboard Supabase:', error);
    res.status(500).json({ error: error?.message || 'Erro ao carregar dashboard', source: 'supabase' });
  }
});

export default app;
