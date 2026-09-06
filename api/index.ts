import express from 'express';
import { apiRouter } from '../server/api.ts';
import { getSupabase, isSupabaseConfigured } from '../server/supabase.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));

/**
 * Dashboard serverless path.
 * The production database is Supabase; do not use data/db.json for dashboard
 * calculations because Vercel's filesystem is ephemeral.
 */
app.get(['/dashboard/admin', '/api/dashboard/admin'], async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  const token = auth.slice('Bearer '.length).trim();
  if (!token.startsWith('token_admin_') && token !== 'token_admin_demo') {
    res.status(403).json({ error: 'Acesso Negado: Esta operação requer privilégios de Administrador.' });
    return;
  }

  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: 'Supabase não configurado no ambiente da Vercel.' });
      return;
    }

    const supabase = getSupabase();
    const period = String(req.query.period || 'month');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const readTable = async (table: string) => {
      const result = await supabase.from(table).select('*');
      if (result.error) {
        console.error(`Supabase ${table}:`, result.error.message);
        return [] as any[];
      }
      return (result.data || []) as any[];
    };

    const [sales, products, batches, payables] = await Promise.all([
      readTable('sales'),
      readTable('products'),
      readTable('batches'),
      readTable('accounts_payable'),
    ]);

    const value = (row: any, ...keys: string[]) => {
      for (const key of keys) {
        if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
      }
      return undefined;
    };

    const number = (row: any, ...keys: string[]) => Number(value(row, ...keys) || 0);
    const dateOf = (row: any) => String(value(row, 'date', 'sale_date', 'purchase_date', 'created_at', 'createdAt') || '').slice(0, 10);

    const completedSales = sales.filter((s) => String(value(s, 'status') || 'FINALIZADA').toUpperCase() === 'FINALIZADA');

    const daysBack = period === 'today' ? 0 : period === 'yesterday' ? 1 : period === '7days' ? 7 : 30;
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() - daysBack);
    threshold.setHours(0, 0, 0, 0);
    const thresholdStr = threshold.toISOString().split('T')[0];

    let periodSales = completedSales;
    if (period === 'today') {
      periodSales = completedSales.filter((s) => dateOf(s) === todayStr);
    } else if (period === 'yesterday') {
      periodSales = completedSales.filter((s) => dateOf(s) === thresholdStr);
    } else {
      periodSales = completedSales.filter((s) => dateOf(s) >= thresholdStr && dateOf(s) <= todayStr);
    }

    const totalOf = (s: any) => number(s, 'total', 'total_amount', 'amount');
    const costOf = (s: any) => number(s, 'costTotal', 'cost_total', 'cost_of_goods_sold');
    const revenueSelectedPeriod = periodSales.reduce((sum, s) => sum + totalOf(s), 0);
    const revenueToday = completedSales.filter((s) => dateOf(s) === todayStr).reduce((sum, s) => sum + totalOf(s), 0);
    const revenueWeek = completedSales.filter((s) => dateOf(s) >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]).reduce((sum, s) => sum + totalOf(s), 0);
    const revenueMonth = completedSales.filter((s) => dateOf(s) >= new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]).reduce((sum, s) => sum + totalOf(s), 0);
    const costOfGoodsSold = periodSales.reduce((sum, s) => sum + costOf(s), 0);
    const salesCount = periodSales.length;
    const grossProfit = revenueSelectedPeriod - costOfGoodsSold;

    const lowStock = products.filter((p) => {
      const stock = number(p, 'currentStock', 'current_stock', 'stock');
      const min = number(p, 'minStock', 'min_stock');
      return stock > 0 && stock <= min;
    });
    const outOfStock = products.filter((p) => number(p, 'currentStock', 'current_stock', 'stock') === 0);

    const activeBatches = batches.filter((b) => number(b, 'currentQuantity', 'current_quantity', 'quantity') > 0);
    const remainingDays = (date: string) => {
      if (!date) return 999999;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return Math.ceil((d.getTime() - t.getTime()) / 86400000);
    };
    const expired = activeBatches.filter((b) => remainingDays(String(value(b, 'expiryDate', 'expiry_date') || '')) < 0);
    const expiring7 = activeBatches.filter((b) => {
      const d = remainingDays(String(value(b, 'expiryDate', 'expiry_date') || ''));
      return d >= 0 && d <= 7;
    });
    const overdue = payables.filter((p) => String(value(p, 'status') || '').toUpperCase() === 'PENDENTE' && remainingDays(String(value(p, 'dueDate', 'due_date') || '')) < 0);

    res.json({
      metrics: {
        period,
        revenueToday,
        revenueWeek,
        revenueMonth,
        revenueSelectedPeriod,
        salesCount,
        averageTicket: salesCount ? Number((revenueSelectedPeriod / salesCount).toFixed(2)) : 0,
        costOfGoodsSold,
        grossProfit,
        expensesTotal: 0,
        estimatedNetProfit: grossProfit,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        expiringIn7DaysCount: expiring7.length,
        expiringIn30DaysCount: activeBatches.filter((b) => { const d = remainingDays(String(value(b, 'expiryDate', 'expiry_date') || '')); return d >= 0 && d <= 30; }).length,
        expiredCount: expired.length,
        overduePayablesCount: overdue.length,
        upcomingPayablesCount: payables.filter((p) => { const d = remainingDays(String(value(p, 'dueDate', 'due_date') || '')); return String(value(p, 'status') || '').toUpperCase() === 'PENDENTE' && d >= 0 && d <= 7; }).length,
        stagnantProductsCount: 0,
      },
      alerts: {
        lowStock: lowStock.map((p) => ({ id: value(p, 'id'), name: value(p, 'name'), boxSku: value(p, 'boxSku', 'box_sku', 'sku'), individualCode: value(p, 'individualCode', 'individual_code', 'barcode'), stock: number(p, 'currentStock', 'current_stock', 'stock'), min: number(p, 'minStock', 'min_stock') })),
        outOfStock: outOfStock.map((p) => ({ id: value(p, 'id'), name: value(p, 'name'), boxSku: value(p, 'boxSku', 'box_sku', 'sku'), individualCode: value(p, 'individualCode', 'individual_code', 'barcode') })),
        expired: expired.map((b) => ({ batchNumber: value(b, 'batchNumber', 'batch_number'), productName: products.find((p) => String(value(p, 'id')) === String(value(b, 'productId', 'product_id')))?.name, days: remainingDays(String(value(b, 'expiryDate', 'expiry_date') || '')) })),
        expiringSoon: expiring7.map((b) => ({ batchNumber: value(b, 'batchNumber', 'batch_number'), productName: products.find((p) => String(value(p, 'id')) === String(value(b, 'productId', 'product_id')))?.name, days: remainingDays(String(value(b, 'expiryDate', 'expiry_date') || '')) })),
        overduePayables: overdue.map((p) => ({ description: value(p, 'description'), amount: number(p, 'amount'), dueDate: value(p, 'dueDate', 'due_date') })),
      },
      charts: {
        topProducts: [],
        salesBySeller: [],
        salesByPaymentMethod: {},
      },
    });
  } catch (error) {
    console.error('Erro no dashboard Supabase:', error);
    next(error);
  }
});

// Existing API routes.
app.use('/', apiRouter);
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
