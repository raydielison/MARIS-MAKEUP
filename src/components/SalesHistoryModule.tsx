import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Sale } from '../types.ts';
import {
  ReceiptText,
  Search,
  Filter,
  Printer,
  Ban,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Clock,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';

export const SalesHistoryModule: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modals
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await api.getSales();
      setSales(res);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSale || !cancelReason.trim()) return;

    setSubmittingCancel(true);
    try {
      await api.cancelSale(cancellingSale.id, cancelReason);
      alert('Venda cancelada com sucesso! O estoque foi estornado e o financeiro revertido.');
      setCancellingSale(null);
      setCancelReason('');
      loadSales();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar venda');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Filter list
  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      String(s.saleNumber).includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.sellerName.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

    return matchQ && matchStatus && matchPayment;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Vendas & Comprovantes</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              {filteredSales.length} vendas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consulte cupons emitidos, filtre por vendedor ou cliente e gerencie cancelamentos com estorno de estoque.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-sales"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número da venda, cliente ou vendedor..."
            className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
          />
        </div>

        <select
          id="filter-sales-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todos os Status</option>
          <option value="FINALIZADA">Finalizadas</option>
          <option value="CANCELADA">Canceladas / Estornadas</option>
        </select>

        <select
          id="filter-sales-payment"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todas as Formas de Pagto</option>
          <option value="DINHEIRO">Dinheiro</option>
          <option value="PIX">PIX</option>
          <option value="DEBITO">Cartão Débito</option>
          <option value="CREDITO">Cartão Crédito</option>
          <option value="PARCELADO">Crédito Parcelado</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Venda #</th>
                <th className="px-3 py-3">Data & Hora</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Vendedora</th>
                <th className="px-3 py-3">Itens</th>
                <th className="px-3 py-3">Pagamento</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => {
                const isCancelled = s.status === 'CANCELADA';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">#{s.saleNumber}</td>
                    <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">
                      <div>{s.date}</div>
                      <div className="text-[10px] text-slate-400">{s.time}</div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{s.customerName}</td>
                    <td className="px-3 py-3 text-slate-600">{s.sellerName}</td>
                    <td className="px-3 py-3 text-slate-700 font-mono">
                      {s.items.reduce((acc, i) => acc + i.quantity, 0)} un
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900 text-sm">
                      <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                        {formatCurrency(s.total)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Cancelada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Finalizada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`btn-view-sale-${s.id}`}
                          onClick={() => setViewingSale(s)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Ver detalhes e comprovante"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel Sale: Admin Only */}
                        {isAdmin && !isCancelled && (
                          <button
                            id={`btn-cancel-sale-${s.id}`}
                            onClick={() => {
                              setCancellingSale(s);
                              setCancelReason('');
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Cancelar Venda (Estornar)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW SALE DETAILS & RECEIPT */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ReceiptText className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-bold text-slate-900">Venda #{viewingSale.saleNumber}</h3>
                {viewingSale.status === 'CANCELADA' && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md">
                    CANCELADA
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sale metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Cliente:</span>
                <span className="font-semibold text-slate-800">{viewingSale.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Vendedora:</span>
                <span className="font-semibold text-slate-800">{viewingSale.sellerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Data & Hora:</span>
                <span className="font-mono text-slate-800">
                  {viewingSale.date} às {viewingSale.time}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Forma de Pagamento:</span>
                <span className="font-mono text-slate-800">{viewingSale.paymentMethod}</span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">Itens da Venda</h4>
              <div className="space-y-1.5">
                {viewingSale.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        {it.shade ? `Cor: ${it.shade} • ` : ''}
                        Lote: {it.batchNumber || 'FEFO'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(it.totalPrice)}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity}x {formatCurrency(it.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total breakdown */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewingSale.subtotal)}</span>
              </div>
              {viewingSale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(viewingSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="text-pink-600">{formatCurrency(viewingSale.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Reimprimir Comprovante</span>
              </button>
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CANCEL SALE MODAL (ADMIN ONLY) */}
      {cancellingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-white border border-red-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Cancelar Venda #{cancellingSale.saleNumber}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Atenção: Ao confirmar o cancelamento, o sistema irá:
              <strong className="text-red-700 block mt-1">
                1. Estornar as quantidades ao estoque dos produtos.
                <br />
                2. Lançar saída de estorno no fluxo de caixa / contas a receber.
                <br />
                3. Registrar a ocorrência na auditoria com o motivo.
              </strong>
            </p>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Motivo do Cancelamento *
              </label>
              <textarea
                id="input-cancel-reason"
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Desistência do cliente, erro no valor cobrado, item devolvido intacto..."
                className="w-full bg-white border border-slate-300 rounded-md p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCancellingSale(null)}
                className="flex-1 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Voltar
              </button>
              <button
                id="btn-confirm-cancel-sale"
                type="submit"
                disabled={submittingCancel}
                className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                {submittingCancel ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
