import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  ShoppingCart,
  TrendingUp,
  Award,
  Sparkles,
  ReceiptText,
  Users,
  ChevronRight,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface DashboardSellerProps {
  onNavigate: (tab: string) => void;
  onOpenPDV: () => void;
}

export const DashboardSeller: React.FC<DashboardSellerProps> = ({ onNavigate, onOpenPDV }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSellerDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard vendedor:', err);
      setError(err.message || 'Não foi possível carregar as métricas de vendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando painel de vendas...</p>
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
          onClick={load}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Olá, {data?.sellerName || 'Vendedora'}! ✨
            </h1>
            <span className="text-[10px] uppercase bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full border border-pink-200">
              Terminal de Atendimento
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Bem-vinda ao seu terminal de vendas. Consulte preços de venda, confira estoques, cadastre clientes e inicie novas vendas no PDV.
          </p>
        </div>

        <button
          id="btn-seller-open-pdv"
          onClick={onOpenPDV}
          className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm rounded-md shadow-xs transition active:scale-95 flex items-center space-x-2 shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Iniciar Nova Venda (PDV)</span>
        </button>
      </div>

      {/* Seller Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Minhas Vendas Hoje */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Minhas Vendas Hoje</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {formatCurrency(data?.totalSoldToday)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total faturado por você hoje</div>
          </div>
        </div>

        {/* Minhas Vendas no Mês */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Vendido (30 Dias)</span>
            <div className="w-7 h-7 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data?.totalSoldMonth)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{data?.countSales || 0} atendimentos finalizados</div>
          </div>
        </div>

        {/* Ticket Médio Pessoal */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Meu Ticket Médio</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-600 tracking-tight">
              {formatCurrency(data?.ticketMedio)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Média por atendimento</div>
          </div>
        </div>

        {/* Clientes & Atendimento */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs cursor-pointer hover:border-pink-300 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Cadastro de Clientes</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Consultar / Cadastrar</div>
              <div className="text-xs text-slate-500 mt-0.5">Histórico e preferências</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Row: Meus Produtos Mais Vendidos & Últimas Vendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produtos do vendedor */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <h2 className="text-sm font-bold text-slate-900">Meus Campeões de Venda</h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Mais vendidos</span>
          </div>

          <div className="space-y-3">
            {data?.topProductsSold && data.topProductsSold.length > 0 ? (
              data.topProductsSold.map((prod: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{prod.name}</div>
                      <div className="text-[11px] text-slate-500">{prod.quantity} unidades vendidas</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{formatCurrency(prod.total)}</div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum produto vendido ainda.</p>
            )}
          </div>
        </div>

        {/* Minhas últimas vendas */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ReceiptText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Minhas Últimas Vendas</h2>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-pink-600 hover:text-pink-700 font-semibold flex items-center"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recentSales && data.recentSales.length > 0 ? (
              data.recentSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">Venda #{sale.saleNumber}</span>
                      <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>{sale.customerName}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-0.5 text-slate-400" />
                        {sale.date} {sale.time}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(sale.total)}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase">Finalizada</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhuma venda recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
