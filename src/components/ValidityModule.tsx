import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  ClockAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Info,
  ShieldAlert
} from 'lucide-react';

export const ValidityModule: React.FC = () => {
  const [validityData, setValidityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const loadValidity = async () => {
    setLoading(true);
    try {
      const res = await api.getValidity();
      setValidityData(res);
    } catch (err) {
      console.error('Erro ao carregar validade:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValidity();
  }, []);

  const summary = validityData?.summary || {
    expired: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    expiring60Days: 0,
    expiring90Days: 0,
    totalBatches: 0,
  };

  const items: any[] = validityData?.items || [];

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'EXPIRED') return item.isExpired;
    if (selectedFilter === '7_DAYS') return item.statusGroup === '7_DAYS';
    if (selectedFilter === '30_DAYS') return item.statusGroup === '30_DAYS';
    if (selectedFilter === '60_DAYS') return item.statusGroup === '60_DAYS';
    if (selectedFilter === '90_DAYS') return item.statusGroup === '90_DAYS';
    if (selectedFilter === 'SAFE') return item.statusGroup === 'SAFE';
    return true;
  });

  const handleDischargeExpired = async (item: any) => {
    if (
      !confirm(
        `Deseja registrar o descarte por produto vencido de ${item.currentQuantity} unidades do produto "${item.productName}" (Lote ${item.batchNumber})?`
      )
    ) {
      return;
    }

    try {
      await api.createStockMovement({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.currentQuantity,
        type: 'OUT_EXPIRED',
        reason: `Descarte de lote vencido em ${item.expiryDate}`,
      });
      alert('Descarte registrado com sucesso no estoque e na auditoria!');
      loadValidity();
    } catch (err: any) {
      alert(err.message || 'Erro ao descartar produto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Controle de Validade & Regra FEFO</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              First Expire, First Out
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cosméticos têm prazo de validade rigoroso. O sistema prioriza a saída dos lotes mais antigos e impede vendas de vencidos.
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Bloqueio automático no PDV ativo para produtos vencidos</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Vencidos */}
        <button
          onClick={() => setSelectedFilter('EXPIRED')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === 'EXPIRED'
              ? 'bg-red-50 border-red-400 text-red-900 shadow-sm ring-1 ring-red-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-red-600">Vencidos</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">{summary.expired}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Bloqueados</div>
        </button>

        {/* 7 Dias */}
        <button
          onClick={() => setSelectedFilter('7_DAYS')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === '7_DAYS'
              ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-1 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-600">Até 7 dias</span>
            <ClockAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{summary.expiring7Days}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Urgência FEFO</div>
        </button>

        {/* 30 Dias */}
        <button
          onClick={() => setSelectedFilter('30_DAYS')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === '30_DAYS'
              ? 'bg-yellow-50 border-yellow-400 text-yellow-900 shadow-sm ring-1 ring-yellow-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-yellow-700">Até 30 dias</span>
            <Calendar className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-extrabold text-yellow-700 mt-2">{summary.expiring30Days}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Atenção comercial</div>
        </button>

        {/* 60 Dias */}
        <button
          onClick={() => setSelectedFilter('60_DAYS')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === '60_DAYS'
              ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-600">Até 60 dias</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">{summary.expiring60Days}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Monitoramento</div>
        </button>

        {/* 90 Dias */}
        <button
          onClick={() => setSelectedFilter('90_DAYS')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === '90_DAYS'
              ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-1 ring-purple-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-600">Até 90 dias</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">{summary.expiring90Days}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Prazo seguro</div>
        </button>

        {/* Todos os Lotes */}
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition ${
            selectedFilter === 'ALL'
              ? 'bg-pink-50 border-pink-400 text-pink-900 shadow-sm ring-1 ring-pink-300'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-pink-600">Todos</span>
            <Layers className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{summary.totalBatches}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Total de lotes</div>
        </button>
      </div>

      {/* FEFO Explanation Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-semibold">Como opera a regra FEFO na BelaMakeup?</strong>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Ao vender no PDV, o sistema busca automaticamente os lotes com a data de validade mais próxima (First Expire, First Out) e deduz deles primeiro. Lotes vencidos não são liberados para o carrinho em nenhuma hipótese.
          </p>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Prioridade FEFO</th>
                <th className="px-3 py-3">Produto & Cor</th>
                <th className="px-3 py-3">Número do Lote</th>
                <th className="px-3 py-3">Data de Validade</th>
                <th className="px-3 py-3">Estoque no Lote</th>
                <th className="px-3 py-3">Status de Validade</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const isExp = item.isExpired;
                const isUrgent = item.statusGroup === '7_DAYS';

                return (
                  <tr key={item.batchId} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center justify-center font-mono border border-slate-200">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.brandName} {item.shade ? `• Cor: ${item.shade}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 font-medium">
                      {item.batchNumber}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold">
                      <span className={isExp ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-800'}>
                        {item.expiryDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-sm text-slate-900">
                      {item.currentQuantity} un
                    </td>
                    <td className="px-3 py-3">
                      {isExp ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Vencido há {Math.abs(item.daysRemaining)} dias
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Vence em {item.daysRemaining} dias
                        </span>
                      ) : item.statusGroup === '30_DAYS' ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                          Vence em {item.daysRemaining} dias
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Validade Segura ({item.daysRemaining} dias)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isExp ? (
                        <button
                          onClick={() => handleDischargeExpired(item)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-md transition"
                          title="Dar baixa no estoque por produto vencido"
                        >
                          Registrar Descarte
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Pronto p/ FEFO</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum lote de produto encontrado nessa categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
