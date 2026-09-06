import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  PackageX,
  AlertTriangle,
  ClockAlert,
  ArrowUpRight,
  PieChart,
  Users,
  CreditCard,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DashboardAdminProps {
  onNavigate: (tab: string) => void;
  onOpenPDV: () => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({ onNavigate, onOpenPDV }) => {
  const [period, setPeriod] = useState<string>('30days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminDashboard(selectedPeriod);
      setData(res);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard admin:', err);
      setError(err.message || 'Não foi possível carregar as métricas administrativas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(period);
  }, [period]);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando métricas da MARIS MAKEUP...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Painel Temporariamente Indisponível</h2>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => loadDashboard(period)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const alerts = data?.alerts || {};
  const charts = data?.charts || {};

  const periodButtons = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: '7days', label: 'Últimos 7 dias' },
    { id: '30days', label: 'Últimos 30 dias' },
    { id: 'month', label: 'Este mês' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title & Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Painel Administrativo</h1>
            <span className="text-[10px] uppercase bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full border border-pink-200">
              Visão Completa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe em tempo real o faturamento, CMV, lucros e estoque da sua loja de cosméticos.
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-1.5 mr-1" />
          {periodButtons.map((btn) => (
            <button
              key={btn.id}
              id={`filter-period-${btn.id}`}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                period === btn.id
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Alerts Banner Section */}
      {(metrics.expiredCount > 0 ||
        metrics.expiringIn7DaysCount > 0 ||
        metrics.lowStockCount > 0 ||
        metrics.overduePayablesCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.expiredCount > 0 && (
            <div
              onClick={() => onNavigate('validity')}
              className="p-4 bg-red-50 border-l-4 border-red-400 rounded-xl cursor-pointer hover:bg-red-100/70 transition shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{metrics.expiredCount} Lote(s) Vencido(s)</div>
                  <div className="text-[11px] text-slate-600">Bloqueados para venda no PDV</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-500" />
            </div>
          )}

          {metrics.expiringIn7DaysCount > 0 && (
            <div
              onClick={() => onNavigate('validity')}
              className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-xl cursor-pointer hover:bg-orange-100/70 transition shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{metrics.expiringIn7DaysCount} Vencendo em 7 Dias</div>
                  <div className="text-[11px] text-slate-600">Priorizar saída (FEFO)</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-500" />
            </div>
          )}

          {metrics.lowStockCount > 0 && (
            <div
              onClick={() => onNavigate('stock')}
              className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl cursor-pointer hover:bg-amber-100/70 transition shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{metrics.lowStockCount} Estoque Baixo</div>
                  <div className="text-[11px] text-slate-600">Abaixo do estoque mínimo</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </div>
          )}

          {metrics.overduePayablesCount > 0 && (
            <div
              onClick={() => onNavigate('financial')}
              className="p-4 bg-slate-50 border-l-4 border-slate-400 rounded-xl cursor-pointer hover:bg-slate-100 transition shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  ?
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{metrics.overduePayablesCount} Conta(s) a Pagar</div>
                  <div className="text-[11px] text-slate-600">Necessita regularização</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>
      )}

      {/* Row 1: Big Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Faturamento Período */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Faturamento</span>
            <div className="w-7 h-7 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(metrics.revenueSelectedPeriod)}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1">
              Hoje: {formatCurrency(metrics.revenueToday)}
            </div>
          </div>
        </div>

        {/* Vendas & Ticket Médio */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Vendas Realizadas</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.salesCount} vendas</div>
            <div className="text-xs text-slate-500 mt-1">
              Ticket Médio: <span className="text-slate-800 font-semibold">{formatCurrency(metrics.averageTicket)}</span>
            </div>
          </div>
        </div>

        {/* Custo CMV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Custo Produtos (CMV)</span>
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(metrics.costOfGoodsSold)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Custo de aquisição</div>
          </div>
        </div>

        {/* Lucro Bruto */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Lucro Bruto</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {formatCurrency(metrics.grossProfit)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Margem Bruta:{' '}
              <span className="text-emerald-700 font-semibold">
                {metrics.revenueSelectedPeriod > 0
                  ? `${((metrics.grossProfit / metrics.revenueSelectedPeriod) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Despesas Pagas</span>
            <div className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(metrics.expensesTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Aluguel, Luz, etc.</div>
          </div>
        </div>

        {/* Lucro Líquido Estimado */}
        <div className="bg-white border-2 border-emerald-500/40 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">Lucro Líquido</span>
            <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {formatCurrency(metrics.estimatedNetProfit)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Líquido após despesas</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Top 5 Produtos Mais Vendidos */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <h2 className="text-sm font-bold text-slate-900">Top 5 Produtos Mais Vendidos</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Unidades</span>
          </div>

          <div className="space-y-4">
            {charts.topProducts && charts.topProducts.length > 0 ? (
              charts.topProducts.map((p: any, idx: number) => {
                const maxQty = Math.max(...charts.topProducts.map((i: any) => i.quantity), 1);
                const percent = Math.round((p.quantity / maxQty) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-800 font-medium truncate max-w-[200px]">{p.name}</span>
                      <span className="font-semibold text-slate-900">
                        {p.quantity} un <span className="text-slate-400 font-normal">({formatCurrency(p.total)})</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhuma venda no período selecionado.</p>
            )}
          </div>
        </div>

        {/* Chart 2: Vendas por Vendedor */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Desempenho por Vendedor</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Total</span>
          </div>

          <div className="space-y-4">
            {charts.salesBySeller && charts.salesBySeller.length > 0 ? (
              charts.salesBySeller.map((s: any, idx: number) => {
                const maxTotal = Math.max(...charts.salesBySeller.map((i: any) => i.total), 1);
                const percent = Math.round((s.total / maxTotal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-800 font-medium">{s.name}</span>
                      <span className="font-bold text-indigo-600">
                        {formatCurrency(s.total)} <span className="text-slate-400 font-normal">({s.count} vendas)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center">Sem dados de vendedores no período.</p>
            )}
          </div>
        </div>

        {/* Chart 3: Formas de Pagamento */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Formas de Pagamento</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Distribuição</span>
          </div>

          <div className="space-y-4">
            {charts.salesByPaymentMethod && Object.keys(charts.salesByPaymentMethod).length > 0 ? (
              Object.entries(charts.salesByPaymentMethod).map(([method, total]: any, idx) => {
                const totalAll = metrics.revenueSelectedPeriod || 1;
                const pct = Math.round((total / totalAll) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 uppercase font-semibold text-[11px]">{method}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(total)} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center">Sem vendas registradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Quick Action Launchers */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Pronto para acelerar as vendas da sua loja?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Abra a Frente de Caixa rápida (PDV) com cálculo automático de troco, suporte a código de barras e controle de validade FEFO.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="btn-dash-open-pdv"
            onClick={onOpenPDV}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs transition active:scale-95 flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Abrir PDV Agora</span>
          </button>
          <button
            id="btn-dash-open-products"
            onClick={() => onNavigate('products_stock')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition"
          >
            Gerenciar Produtos & Estoque
          </button>
        </div>
      </div>
    </div>
  );
};
