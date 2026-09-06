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

apiRouter.get('/dashboard/admin', async (_req: Request, res: Response) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const [{ data: products = [] }, { data: batches = [] }, { data: sales = [] }, { data: financial = [] }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('financial_transactions').select('*'),
      ]);
      const revenue = (sales || []).reduce((sum: number, s: any) => sum + Number(s.total_amount ?? s.total ?? 0), 0);
      return res.json({ revenueToday: 0, revenueWeek: 0, revenueMonth: revenue, salesCount: (sales || []).length, averageTicket: sales?.length ? revenue / sales.length : 0, cogs: 0, grossProfit: revenue, expenses: 0, netProfit: revenue, lowStock: (products || []).filter((p: any) => Number(p.stock ?? p.current_stock ?? 0) <= Number(p.min_stock ?? 0)).length, outOfStock: (products || []).filter((p: any) => Number(p.stock ?? p.current_stock ?? 0) <= 0).length, expiring: 0, expired: 0, overdue: 0, stagnant: 0, topProducts: [], salesBySeller: [], salesByPayment: [], productsCount: products?.length || 0, batchesCount: batches?.length || 0, financialCount: financial?.length || 0 });
    }
    return res.json(db.getSnapshot());
  } catch (error: any) {
    console.error('Erro dashboard:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao carregar dashboard' });
  }
});

export default apiRouter;
