import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  BarChart3,
  Download,
  Calendar,
  Printer,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  PieChart,
  Users,
  DollarSign
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const [reportType, setReportType] = useState<'sales' | 'stock' | 'dre' | 'sellers'>('dre');
  const [period, setPeriod] = useState<string>('month');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDashboard(period);
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period]);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const metrics = dashboardData?.metrics || {};
  const charts = dashboardData?.charts || {};

  // Export CSV function
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'dre') {
      csvContent += 'Indicador DRE;Valor (R$)\n';
      csvContent += `Faturamento Bruto;${metrics.revenueSelectedPeriod || 0}\n`;
      csvContent += `(-) CMV Custos das Mercadorias;${metrics.costOfGoodsSold || 0}\n`;
      csvContent += `(=) Lucro Bruto;${metrics.grossProfit || 0}\n`;
      csvContent += `(-) Despesas Operacionais;${metrics.expensesTotal || 0}\n`;
      csvContent += `(=) Lucro Líquido Estimado;${metrics.estimatedNetProfit || 0}\n`;
    } else if (reportType === 'sellers') {
      csvContent += 'Vendedor;Total Vendido (R$);Quantidade Vendas\n';
      (charts.salesBySeller || []).forEach((s: any) => {
        csvContent += `${s.name};${s.total};${s.count}\n`;
      });
    } else if (reportType === 'sales') {
      csvContent += 'Produto;Quantidade Vendida;Total (R$)\n';
      (charts.topProducts || []).forEach((p: any) => {
        csvContent += `${p.name};${p.quantity};${p.total}\n`;
      });
    } else {
      csvContent += 'Métrica de Estoque;Quantidade\n';
      csvContent += `Estoque Baixo;${metrics.lowStockCount || 0}\n`;
      csvContent += `Lotes Vencidos;${metrics.expiredCount || 0}\n`;
      csvContent += `Lotes Vencendo em 7 Dias;${metrics.expiringIn7DaysCount || 0}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_marismakeup_${reportType}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Central de Relatórios Executivos</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              Exportação CSV & Impressão
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            DRE Gerencial detalhado, desempenho da equipe de vendas e controle analítico de estoque.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md flex items-center space-x-1.5 border border-slate-300 shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs & Period */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'dre', label: 'DRE / Financeiro', icon: DollarSign },
            { id: 'sales', label: 'Vendas & Produtos', icon: BarChart3 },
            { id: 'sellers', label: 'Desempenho Vendedores', icon: Users },
            { id: 'stock', label: 'Estoque & Validade', icon: Layers },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = reportType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setReportType(t.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
                  isSelected
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
        >
          <option value="today">Hoje</option>
          <option value="yesterday">Ontem</option>
          <option value="7days">Últimos 7 dias</option>
          <option value="30days">Últimos 30 dias</option>
          <option value="month">Este Mês</option>
        </select>
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        {/* DRE VIEW */}
        {reportType === 'dre' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Demonstrativo de Resultado do Exercício (DRE Simplificado)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo em regime de competência considerando faturamento de vendas, CMV (custos de aquisição) e despesas fixas/variáveis.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">(+) FATURAMENTO BRUTO DE VENDAS</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {formatCurrency(metrics.revenueSelectedPeriod)}
                </span>
              </div>

              <div className="flex justify-between p-3.5 rounded-lg bg-rose-50/60 border border-rose-200 text-rose-700">
                <span className="font-medium">(-) Custo das Mercadorias Vendidas (CMV)</span>
                <span className="font-bold">-{formatCurrency(metrics.costOfGoodsSold)}</span>
              </div>

              <div className="flex justify-between p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                <span>(=) LUCRO BRUTO OPERACIONAL</span>
                <span className="text-sm">{formatCurrency(metrics.grossProfit)}</span>
              </div>

              <div className="flex justify-between p-3.5 rounded-lg bg-rose-50/60 border border-rose-200 text-rose-700">
                <span className="font-medium">(-) Despesas Operacionais (Aluguel, Luz, Marketing, etc.)</span>
                <span className="font-bold">-{formatCurrency(metrics.expensesTotal)}</span>
              </div>

              <div className="flex justify-between p-4 rounded-lg bg-slate-900 text-white border border-slate-800 font-extrabold text-base">
                <span>(=) LUCRO LÍQUIDO ESTIMADO DO PERÍODO</span>
                <span className="text-emerald-400">{formatCurrency(metrics.estimatedNetProfit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* SELLERS PERFORMANCE VIEW */}
        {reportType === 'sellers' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Desempenho da Equipe Comercial</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranking de faturamento, volume de vendas e comissão estimada por atendente.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Vendedora</th>
                    <th className="px-3 py-3">Qtd Vendas</th>
                    <th className="px-3 py-3">Total Faturado</th>
                    <th className="px-3 py-3">Ticket Médio</th>
                    <th className="px-4 py-3 text-right">Comissão Estimada (3%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(charts.salesBySeller || []).map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                      <td className="px-3 py-3 font-mono text-slate-600">{s.count}</td>
                      <td className="px-3 py-3 font-bold text-emerald-700">{formatCurrency(s.total)}</td>
                      <td className="px-3 py-3 font-mono text-slate-600">
                        {formatCurrency(s.count > 0 ? s.total / s.count : 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-pink-700">
                        {formatCurrency(s.total * 0.03)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS / SALES VIEW */}
        {reportType === 'sales' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Produtos com Maior Saída no Período</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unidades vendidas e receita gerada por item de maquiagem.
              </p>
            </div>

            <div className="space-y-2.5">
              {(charts.topProducts || []).map((p: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center font-mono">
                      #{i + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900">{p.quantity} unidades</span>
                    <span className="text-slate-500 ml-2">({formatCurrency(p.total)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOCK REPORT */}
        {reportType === 'stock' && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Diagnóstico de Estoque & Validade</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visão consolidada de riscos de ruptura e vencimento de lotes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Itens com Estoque Baixo</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.lowStockCount || 0}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Lotes Vencidos (Bloqueados)</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">{metrics.expiredCount || 0}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Lotes Vencendo em 7 dias (FEFO)</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.expiringIn7DaysCount || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
