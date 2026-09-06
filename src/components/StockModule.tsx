import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, StockMovement } from '../types.ts';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Calendar,
  X,
  Package,
  Tag,
  Filter,
  MapPin
} from 'lucide-react';

export const StockModule: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [search, setSearch] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'replenish' | 'out'>('all');

  // Modal for Manual Stock Movement
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('IN_ADJUSTMENT');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, moves] = await Promise.all([api.getProducts(), api.getStockMovements()]);
      setProducts(prods);
      setMovements(moves);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    setSubmitting(true);
    try {
      await api.createStockMovement({
        productId: selectedProductId,
        quantity,
        type: movementType,
        reason: reason || 'Ajuste manual de estoque',
      });
      setShowMoveModal(false);
      setReason('');
      setQuantity(1);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação');
    } finally {
      setSubmitting(false);
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'IN_PURCHASE':
        return { label: 'Entrada Compra', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'IN_ADJUSTMENT':
        return { label: 'Entrada Ajuste', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'IN_RETURN':
        return { label: 'Devolução Venda', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'OUT_SALE':
        return { label: 'Saída Venda', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'OUT_ADJUSTMENT':
        return { label: 'Saída Ajuste', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'OUT_EXPIRED':
        return { label: 'Descarte Vencido', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'OUT_DAMAGE':
        return { label: 'Avaria / Perda', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: type, bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const skuTotalStockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.active) continue;
      const key = (p.boxSku || p.sku || '').trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + (p.currentStock || 0));
    }
    return map;
  }, [products]);

  const filteredProducts = products
    .filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.boxSku && p.boxSku.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.storeIdCode && p.storeIdCode.toLowerCase().includes(q)) ||
        (p.individualCode && p.individualCode.toLowerCase().includes(q)) ||
        (p.purchaseLocation && p.purchaseLocation.toLowerCase().includes(q)) ||
        p.barcode.includes(q) ||
        (p.shade && p.shade.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q));

      const skuKey = (p.boxSku || p.sku || '').trim().toLowerCase();
      const skuTotal = skuTotalStockMap.get(skuKey) ?? p.currentStock;

      if (stockFilter === 'replenish') {
        return matchSearch && skuTotal <= p.minStock;
      }
      if (stockFilter === 'out') {
        return matchSearch && p.currentStock <= 0;
      }
      return matchSearch;
    })
    .sort((a, b) => {
      const skuA = (a.boxSku || a.sku || '').toLowerCase();
      const skuB = (b.boxSku || b.sku || '').toLowerCase();
      if (skuA !== skuB) {
        return skuA.localeCompare(skuB);
      }
      const idA = (a.storeIdCode || a.individualCode || '').toLowerCase();
      const idB = (b.storeIdCode || b.individualCode || '').toLowerCase();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const lowStockCount = products.filter((p) => {
    if (!p.active) return false;
    const skuKey = (p.boxSku || p.sku || '').trim().toLowerCase();
    const skuTotal = skuTotalStockMap.get(skuKey) ?? p.currentStock;
    return skuTotal <= p.minStock;
  }).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Controle & Movimentação de Estoque</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              FEFO Habilitado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe saldos em tempo real, defina estoques mínimos e registre entradas e saídas auditadas.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="btn-stock-movement"
            onClick={() => setShowMoveModal(true)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition active:scale-95"
          >
            <Boxes className="w-4 h-4" />
            <span>Ajuste / Movimentação Manual</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Overview vs History */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          id="tab-stock-overview"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-pink-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Visão Geral do Estoque</span>
        </button>
        <button
          id="tab-stock-history"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'bg-pink-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Movimentações ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Low Stock Replenishment Alert Banner */}
          {lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-950 flex items-center space-x-2">
                    <span>Aviso de Reposição de Estoque</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {lowStockCount} produto(s) em baixa
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Estes itens atingiram o estoque mínimo ou zeraram. Use o <strong>SKU da Caixa</strong> para realizar o pedido de reposição junto aos fornecedores.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setStockFilter(stockFilter === 'replenish' ? 'all' : 'replenish')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    stockFilter === 'replenish'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{stockFilter === 'replenish' ? 'Ver Todos os Produtos' : 'Filtrar Somente Reposição'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Search bar & filter pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU da Caixa, Código ID, nome, cor..."
                className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  stockFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setStockFilter('replenish')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
                  stockFilter === 'replenish'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Em Baixa ({lowStockCount})</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Produto & Tonalidade</th>
                    <th className="px-3 py-3">SKU da Caixa (Fábrica)</th>
                    <th className="px-3 py-3">Número ID Loja (Venda)</th>
                    <th className="px-3 py-3">Marca / Origem</th>
                    <th className="px-3 py-3">Estoque Atual</th>
                    <th className="px-3 py-3">Estoque Mínimo</th>
                    <th className="px-3 py-3">Status de Reposição</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const skuKey = (p.boxSku || p.sku || '').trim().toLowerCase();
                    const totalSkuStock = skuTotalStockMap.get(skuKey) ?? p.currentStock;
                    const isOut = p.currentStock <= 0;
                    const isLow = totalSkuStock > 0 && totalSkuStock <= p.minStock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            {p.hexColor && (
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-white shadow-xs"
                                style={{ backgroundColor: p.hexColor }}
                              />
                            )}
                            <div>
                              <div>{p.name}</div>
                              {p.shade && <div className="text-[11px] text-slate-500">Cor: {p.shade}</div>}
                              {p.expiryDate && (
                                <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>Val: {new Date(p.expiryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700 font-semibold">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title="SKU que veio na caixa do fornecedor">
                            {p.boxSku || p.sku}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-pink-700 font-bold">
                          <span className="bg-pink-50 px-2 py-0.5 rounded border border-pink-100" title="Número ID da Loja para venda individual">
                            {p.storeIdCode || p.individualCode || p.barcode}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          <div>{p.brandName}</div>
                          {p.purchaseLocation && (
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5" title="Local de Compra">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">{p.purchaseLocation}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span
                              className={`font-bold text-xs px-2 py-0.5 rounded-md border ${
                                isOut
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {p.currentStock} {p.unit}
                            </span>
                            {totalSkuStock > 1 && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Total no SKU">
                                Total SKU: {totalSkuStock}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 font-mono">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="px-3 py-3">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Esgotado - Repor Já</span>
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Reposição Baixa ({p.currentStock} un)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Estoque Normal</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setMovementType('IN_PURCHASE');
                              setReason(`Reposição de lote caixa SKU: ${p.boxSku || p.sku}`);
                              setShowMoveModal(true);
                            }}
                            className="text-xs text-pink-600 hover:text-pink-700 font-semibold px-2.5 py-1 rounded-md hover:bg-pink-50 transition border border-pink-200"
                          >
                            Repor / Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Nenhum produto localizado com o filtro aplicado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data & Hora</th>
                  <th className="px-3 py-3">Produto</th>
                  <th className="px-3 py-3">Tipo Movimento</th>
                  <th className="px-3 py-3 text-center">Qtd</th>
                  <th className="px-3 py-3">Saldo Anterior → Novo</th>
                  <th className="px-3 py-3">Motivo</th>
                  <th className="px-4 py-3 text-right">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const badge = getMovementBadge(m.type);
                  const isPositive = m.type.startsWith('IN_');

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        <div>{m.date}</div>
                        <div className="text-[10px] text-slate-400">{m.time}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{m.productName}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        <span className="text-slate-400">{m.previousStock}</span>
                        <span className="text-slate-400 mx-1.5">→</span>
                        <span className="text-slate-900 font-bold">{m.newStock}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-xs truncate">{m.reason}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{m.userName}</td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      Nenhuma movimentação de estoque registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL STOCK MOVEMENT */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStockMovement}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Movimentação Manual de Estoque</h3>
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Selecionar Produto *</label>
              <select
                id="select-movement-product"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.shade ? `(${p.shade})` : ''} - Atual: {p.currentStock} un
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Tipo de Movimentação *</label>
              <select
                id="select-movement-type"
                required
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              >
                <option value="IN_ADJUSTMENT">Entrada por Ajuste de Inventário (+)</option>
                <option value="IN_RETURN">Entrada por Devolução de Cliente (+)</option>
                <option value="OUT_ADJUSTMENT">Saída por Ajuste de Inventário (-)</option>
                <option value="OUT_EXPIRED">Saída por Produto Vencido (-)</option>
                <option value="OUT_DAMAGE">Saída por Avaria / Danificado (-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Quantidade *</label>
              <input
                id="input-movement-qty"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Motivo / Justificativa *</label>
              <textarea
                id="input-movement-reason"
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Contagem física de balanço, avaria no transporte, etc."
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-movement"
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                {submitting ? 'Salvando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
