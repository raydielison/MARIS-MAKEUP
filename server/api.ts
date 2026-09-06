import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { getSupabase, isSupabaseConfigured } from './supabase';

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
  req.user = { id: userId };
  next();
};

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (email === 'marina@makeup.com.br' && password === 'marinamakeup') return res.json({ token: 'token_admin_demo', user: { id: 'usr_admin', name: 'Marina (Administradora)', email, role: 'ADMIN', active: true } });
  if (email === 'vendedor@makeup.com.br' && password === 'vendedormakeup') return res.json({ token: 'token_vendedor_demo', user: { id: 'usr_vendedor_1', name: 'Vendedora MARIS', email, role: 'VENDEDOR', active: true } });
  return res.status(401).json({ error: 'E-mail ou senha inválidos' });
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.id === 'usr_admin') return res.json({ id: 'usr_admin', name: 'Marina (Administradora)', email: 'marina@makeup.com.br', role: 'ADMIN', active: true });
  return res.json({ id: 'usr_vendedor_1', name: 'Vendedora MARIS', email: 'vendedor@makeup.com.br', role: 'VENDEDOR', active: true });
});

apiRouter.get('/database/status', (_req: Request, res: Response) => {
  res.json({ production: 'supabase', configured: isSupabaseConfigured() });
});

apiRouter.get('/database/supabase-status', (_req: Request, res: Response) => {
  res.json({ configured: isSupabaseConfigured() });
});

apiRouter.get('/database/supabase-test', async (_req: Request, res: Response) => {
  if (!isSupabaseConfigured()) return res.json({ ok: false, configured: false });
  try {
    const client = getSupabase();
    const { error } = await client.from('products').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, configured: true, error: error.message });
    return res.json({ ok: true, configured: true });
  } catch (error: any) {
    return res.status(500).json({ ok: false, configured: true, error: error?.message || 'Erro no Supabase' });
  }
});

apiRouter.get('/alerts', (_req: Request, res: Response) => res.json({ lowStock: 0, outOfStock: 0, expiring: 0, expired: 0, overdue: 0 }));
apiRouter.get('/validity', (_req: Request, res: Response) => res.json({ expiring: [], expired: [] }));

apiRouter.get('/dashboard/admin', async (req: Request, res: Response) => {
  try {
    const selectedPeriod = String(req.query.period || '30days');

    if (!isSupabaseConfigured()) {
      const snapshot: any = db.getSnapshot();
      if (snapshot?.metrics) return res.json(snapshot);
      return res.json({
        metrics: {
          period: selectedPeriod, revenueToday: 0, revenueWeek: 0, revenueMonth: 0,
          revenueSelectedPeriod: 0, salesCount: 0, averageTicket: 0, costOfGoodsSold: 0,
          grossProfit: 0, expensesTotal: 0, estimatedNetProfit: 0, lowStockCount: 0,
          outOfStockCount: 0, expiringIn7DaysCount: 0, expiringIn30DaysCount: 0,
          expiredCount: 0, overduePayablesCount: 0, upcomingPayablesCount: 0,
          stagnantProductsCount: 0
        },
        alerts: {},
        charts: { topProducts: [], salesBySeller: [], salesByPayment: [] }
      });
    }

    const supabase = getSupabase();
    const [productsResult, batchesResult, salesResult, financialResult] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('batches').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('financial_transactions').select('*'),
    ]);

    if (productsResult.error) throw new Error(`Produtos: ${productsResult.error.message}`);
    if (salesResult.error) throw new Error(`Vendas: ${salesResult.error.message}`);

    const products: any[] = productsResult.data || [];
    const batches: any[] = batchesResult.error ? [] : (batchesResult.data || []);
    const sales: any[] = salesResult.data || [];
    const financial: any[] = financialResult.error ? [] : (financialResult.data || []);

    const parseDate = (value: any): Date | null => {
      if (!value) return null;
      const d = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;
    const todayKey = today.toISOString().slice(0, 10);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today.getTime() - 6 * dayMs);
    const periodDays = selectedPeriod === 'today' ? 1 : selectedPeriod === 'yesterday' ? 1 : selectedPeriod === '7days' ? 7 : selectedPeriod === 'month' ? today.getDate() : 30;
    const selectedStart = selectedPeriod === 'yesterday'
      ? new Date(today.getTime() - dayMs)
      : new Date(today.getTime() - (periodDays - 1) * dayMs);
    selectedStart.setHours(0, 0, 0, 0);

    const validSales = sales.filter((s: any) => String(s.status || 'FINALIZADA').toUpperCase() !== 'CANCELADA' && String(s.status || 'FINALIZADA').toUpperCase() !== 'DEVOLVIDA');
    const saleDate = (s: any) => parseDate(s.date || s.sale_date || s.created_at || s.createdAt);
    const saleTotal = (s: any) => Number(s.total ?? s.total_amount ?? s.amount ?? 0);
    const saleCost = (s: any) => Number(s.cost_total ?? s.costTotal ?? s.cost_amount ?? s.cost ?? 0);

    const sumSales = (start: Date, end?: Date) => validSales.reduce((sum, s) => {
      const d = saleDate(s);
      if (!d || d < start || (end && d >= end)) return sum;
      return sum + saleTotal(s);
    }, 0);

    const revenueToday = sumSales(today, new Date(today.getTime() + dayMs));
    const revenueYesterday = sumSales(new Date(today.getTime() - dayMs), today);
    const revenueWeek = sumSales(weekStart, new Date(today.getTime() + dayMs));
    const revenueMonth = sumSales(monthStart, new Date(today.getTime() + dayMs));
    const revenueSelectedPeriod = selectedPeriod === 'yesterday' ? revenueYesterday : sumSales(selectedStart, new Date(today.getTime() + dayMs));
    const selectedSales = validSales.filter(s => {
      const d = saleDate(s);
      return d && d >= selectedStart && d < new Date(today.getTime() + dayMs) || (selectedPeriod === 'yesterday' && d && d >= selectedStart && d < today);
    });

    const costOfGoodsSold = selectedSales.reduce((sum, s) => {
      if (saleCost(s)) return sum + saleCost(s);
      const items = Array.isArray(s.items) ? s.items : [];
      return sum + items.reduce((itemSum: number, item: any) => itemSum + Number(item.total_cost ?? item.totalCost ?? item.unit_cost ?? item.unitCost ?? 0) * Number(item.quantity || 1), 0);
    }, 0);

    const grossProfit = revenueSelectedPeriod - costOfGoodsSold;
    const expensesTotal = financial.reduce((sum, f) => {
      const type = String(f.type || f.transaction_type || '').toUpperCase();
      const amount = Number(f.amount ?? f.value ?? f.total ?? 0);
      return type.includes('SAIDA') || type.includes('EXPENSE') || type.includes('DESPESA') ? sum + amount : sum;
    }, 0);

    const lowStockProducts = products.filter(p => Number(p.current_stock ?? p.stock ?? 0) <= Number(p.min_stock ?? p.minimum_stock ?? 0));
    const outOfStockProducts = products.filter(p => Number(p.current_stock ?? p.stock ?? 0) <= 0);
    const now = today;
    const expiryInfo = batches.map(b => ({ ...b, expiry: parseDate(b.expiry_date ?? b.expiryDate) })).filter(b => b.expiry);
    const expiredCount = expiryInfo.filter(b => b.expiry < now && Number(b.current_quantity ?? b.currentQuantity ?? 1) > 0).length;
    const expiringIn7DaysCount = expiryInfo.filter(b => b.expiry >= now && b.expiry <= new Date(now.getTime() + 7 * dayMs) && Number(b.current_quantity ?? b.currentQuantity ?? 1) > 0).length;
    const expiringIn30DaysCount = expiryInfo.filter(b => b.expiry >= now && b.expiry <= new Date(now.getTime() + 30 * dayMs) && Number(b.current_quantity ?? b.currentQuantity ?? 1) > 0).length;

    const topMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    validSales.forEach(s => {
      const d = saleDate(s);
      if (!d || d < selectedStart || d >= new Date(today.getTime() + dayMs)) return;
      (Array.isArray(s.items) ? s.items : []).forEach((item: any) => {
        const key = String(item.product_id ?? item.productId ?? item.product_name ?? item.productName ?? 'produto');
        const current = topMap.get(key) || { name: String(item.product_name ?? item.productName ?? key), quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.total_price ?? item.totalPrice ?? (Number(item.unit_price ?? item.unitPrice ?? 0) * Number(item.quantity || 0)));
        topMap.set(key, current);
      });
    });
    const topProducts = Array.from(topMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const sellerMap = new Map<string, { name: string; value: number; sales: number }>();
    selectedSales.forEach(s => {
      const name = String(s.seller_name ?? s.sellerName ?? 'Vendedor');
      const current = sellerMap.get(name) || { name, value: 0, sales: 0 };
      current.value += saleTotal(s);
      current.sales += 1;
      sellerMap.set(name, current);
    });

    const paymentMap = new Map<string, { name: string; value: number; sales: number }>();
    selectedSales.forEach(s => {
      const name = String(s.payment_method ?? s.paymentMethod ?? 'OUTROS');
      const current = paymentMap.get(name) || { name, value: 0, sales: 0 };
      current.value += saleTotal(s);
      current.sales += 1;
      paymentMap.set(name, current);
    });

    const metrics = {
      period: selectedPeriod,
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueSelectedPeriod,
      salesCount: selectedSales.length,
      averageTicket: selectedSales.length ? revenueSelectedPeriod / selectedSales.length : 0,
      costOfGoodsSold,
      grossProfit,
      expensesTotal,
      estimatedNetProfit: grossProfit - expensesTotal,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringIn7DaysCount,
      expiringIn30DaysCount,
      expiredCount,
      overduePayablesCount: financial.filter(f => String(f.status || '').toUpperCase() === 'VENCIDO').length,
      upcomingPayablesCount: financial.filter(f => String(f.status || '').toUpperCase() === 'PENDENTE').length,
      stagnantProductsCount: 0,
    };

    return res.json({
      metrics,
      alerts: {
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        expiring: expiringIn7DaysCount,
        expired: expiredCount,
        overdue: metrics.overduePayablesCount,
      },
      charts: {
        topProducts,
        salesBySeller: Array.from(sellerMap.values()),
        salesByPayment: Array.from(paymentMap.values()),
      },
      meta: { productsCount: products.length, batchesCount: batches.length, financialCount: financial.length, today: todayKey }
    });
  } catch (error: any) {
    console.error('Erro dashboard:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao carregar dashboard' });
  }
});

export default apiRouter;
