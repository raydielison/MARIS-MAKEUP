import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Purchase, Supplier, Product } from '../types.ts';
import {
  Truck,
  Plus,
  Trash2,
  Receipt,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  DollarSign
} from 'lucide-react';

export const PurchasesModule: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Purchase Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isCustomSupplier, setIsCustomSupplier] = useState<boolean>(false);
  const [newSupplierName, setNewSupplierName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  
  // INSERIR PAGAMENTO: PAGO vs A PAGAR
  const [paymentCondition, setPaymentCondition] = useState<'PAGO' | 'A_PAGAR'>('A_PAGAR');
  const [paidMethod, setPaidMethod] = useState<string>('Pix');
  const [toPayMethod, setToPayMethod] = useState<'Boleto' | 'Link de Pagamento'>('Boleto');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  interface PurchaseItemRow {
    productId: string;
    productName: string;
    shade?: string;
    quantity: number;
    unitCost: number;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
  }

  const [items, setItems] = useState<PurchaseItemRow[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pur, sup, prod] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(pur);
      setSuppliers(sup);
      setProducts(prod);
      if (sup.length > 0 && !selectedSupplierId) setSelectedSupplierId(sup[0].id);
    } catch (err) {
      console.error('Erro ao carregar compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const createNewItemRow = (): PurchaseItemRow => {
    const defaultBatch = `LT-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (products.length > 0) {
      const firstProd = products[0];
      return {
        productId: firstProd.id,
        productName: firstProd.name,
        shade: firstProd.shade || '',
        quantity: 1,
        unitCost: firstProd.costPrice || 20,
        batchNumber: defaultBatch,
        manufacturingDate: today,
        expiryDate: nextYear,
      };
    }

    return {
      productId: 'NEW_PRODUCT',
      productName: '',
      shade: '',
      quantity: 1,
      unitCost: 0,
      batchNumber: defaultBatch,
      manufacturingDate: today,
      expiryDate: nextYear,
    };
  };

  const addItemRow = () => {
    const newRow = createNewItemRow();
    setItems((prev) => [...prev, newRow]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, field: keyof PurchaseItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;

      if (field === 'productId') {
        if (value === 'NEW_PRODUCT') {
          updated[index] = {
            ...updated[index],
            productId: 'NEW_PRODUCT',
            productName: '',
            shade: '',
            unitCost: 0,
          };
        } else {
          const p = products.find((prod) => prod.id === value);
          if (p) {
            updated[index] = {
              ...updated[index],
              productId: p.id,
              productName: p.name,
              shade: p.shade || '',
              unitCost: p.costPrice || 20,
            };
          }
        }
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const openNewPurchase = () => {
    setInvoiceNumber(`NF-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewSupplierName('');
    setIsCustomSupplier(suppliers.length === 0);
    if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    } else {
      setSelectedSupplierId('');
    }
    setPaymentCondition('A_PAGAR');
    setToPayMethod('Boleto');
    setPaidMethod('Pix');
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const initialRow = createNewItemRow();
    setItems([initialRow]);
    setShowModal(true);
  };

  const totalPurchase = items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierToUse = (isCustomSupplier || suppliers.length === 0)
      ? newSupplierName.trim()
      : selectedSupplierId;

    if (!supplierToUse) {
      alert('Informe ou selecione o fornecedor da compra.');
      return;
    }

    if (items.length === 0) {
      alert('Adicione ao menos um produto à compra.');
      return;
    }

    for (const it of items) {
      if (!it.productName || it.productName.trim() === '') {
        alert('Por favor, informe o nome de todos os produtos na lista de compra.');
        return;
      }
      if (it.quantity <= 0) {
        alert('A quantidade dos produtos deve ser maior que 0.');
        return;
      }
    }

    const activePaymentMethod = paymentCondition === 'PAGO' ? paidMethod : toPayMethod;

    if (paymentCondition === 'A_PAGAR' && toPayMethod === 'Boleto' && !dueDate) {
      alert('Por favor, selecione a data de vencimento do boleto.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPurchase({
        supplierId: (!isCustomSupplier && suppliers.length > 0) ? selectedSupplierId : undefined,
        supplierName: (isCustomSupplier || suppliers.length === 0) ? newSupplierName.trim() : undefined,
        invoiceNumber,
        paymentCondition,
        paymentMethod: activePaymentMethod,
        dueDate: paymentCondition === 'A_PAGAR' ? dueDate : undefined,
        notes,
        items,
      });

      if (paymentCondition === 'PAGO') {
        alert(`Compra registrada com sucesso! Pagamento (${activePaymentMethod}) liquidado e estoque atualizado.`);
      } else {
        alert(`Compra registrada com sucesso! Estoque atualizado e conta (${activePaymentMethod}) lançada como PENDENTE em Contas a Pagar na aba Financeiro.`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar compra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compras & Entrada de Mercadorias</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              {purchases.length} entradas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ao registrar compras de fornecedores, o sistema atualiza o estoque físico, cria novos lotes com validade e lança Contas a Pagar.
          </p>
        </div>

        <button
          id="btn-new-purchase"
          onClick={openNewPurchase}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nova Compra</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nota Fiscal</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Fornecedor</th>
                <th className="px-3 py-3">Itens Comprados</th>
                <th className="px-3 py-3">Total da NF</th>
                <th className="px-3 py-3">Status Financeiro</th>
                <th className="px-4 py-3 text-right">Cadastrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => {
                const isPaid = p.paymentCondition === 'PAGO' || p.paymentStatus === 'PAGO';
                const pDate = (p as any).purchaseDate || (p as any).date || p.createdAt;
                const pTotal = (p as any).totalCost || (p as any).totalAmount || 0;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.invoiceNumber || 'S/N'}</td>
                    <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">{pDate}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800">{p.supplierName}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <span className="font-bold text-slate-900">
                        {p.items?.reduce((acc, i) => acc + i.quantity, 0) || 0} unidades
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                        {p.items?.map((i) => i.productName).join(', ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900 text-sm">
                      {formatCurrency(pTotal)}
                    </td>
                    <td className="px-3 py-3">
                      {isPaid ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Pago ({p.paymentMethod || 'À vista'})</span>
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>A Pagar ({p.paymentMethod || 'Boleto'})</span>
                          </span>
                          {p.dueDate && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Venc: {p.dueDate.split('-').reverse().join('/')}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 font-mono text-[11px]">
                      {p.userName}
                    </td>
                  </tr>
                );
              })}

              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma compra de fornecedor registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePurchase}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-bold text-slate-900">Registrar Compra de Fornecedor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Data */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-700 font-semibold">Fornecedor *</label>
                  {suppliers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomSupplier(!isCustomSupplier)}
                      className="text-[10px] text-pink-600 hover:text-pink-700 font-medium cursor-pointer"
                    >
                      {isCustomSupplier ? 'Escolher da lista' : '+ Novo Fornecedor'}
                    </button>
                  )}
                </div>

                {isCustomSupplier || suppliers.length === 0 ? (
                  <input
                    id="input-supplier-name"
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Nome do Fornecedor / Distribuidora"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                ) : (
                  <select
                    id="select-supplier"
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Nota Fiscal (NF-e)</label>
                <input
                  id="input-invoice-number"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: NF-1092"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* INSERIR PAGAMENTO: Opções PAGO e A PAGAR */}
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Inserir Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    id="btn-payment-condition-pago"
                    onClick={() => setPaymentCondition('PAGO')}
                    className={`py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center justify-center space-x-1 ${
                      paymentCondition === 'PAGO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PAGO</span>
                  </button>
                  <button
                    type="button"
                    id="btn-payment-condition-a-pagar"
                    onClick={() => setPaymentCondition('A_PAGAR')}
                    className={`py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center justify-center space-x-1 ${
                      paymentCondition === 'A_PAGAR'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>A PAGAR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Painel Detalhado de Pagamento (PAGO ou A PAGAR) */}
            <div
              id="container-payment-details"
              className={`p-3.5 rounded-xl border transition ${
                paymentCondition === 'PAGO'
                  ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                  : 'bg-pink-50/50 border-pink-200 text-slate-800'
              }`}
            >
              {paymentCondition === 'PAGO' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Forma de Pagamento (Compra já Paga / À Vista) *</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Liquidado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <select
                        id="select-paid-method"
                        value={paidMethod}
                        onChange={(e) => setPaidMethod(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartao a vista">Cartão a vista</option>
                        <option value="Cartao parcelado">Cartão parcelado</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      Ao selecionar <strong>PAGO</strong>, a compra será registrada com baixa imediata no financeiro e lançada no fluxo de caixa.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-pink-600" />
                      <span>Condição de Pagamento Futuro (A PAGAR) *</span>
                    </span>
                    <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">
                      Pendente no Financeiro
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                        Forma de Cobrança *
                      </label>
                      <select
                        id="select-topay-method"
                        value={toPayMethod}
                        onChange={(e) => setToPayMethod(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
                      >
                        <option value="Boleto">Boleto</option>
                        <option value="Link de Pagamento">Link de Pagamento</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                        {toPayMethod === 'Boleto' ? 'Vencimento do Boleto *' : 'Vencimento do Link de Pagamento *'}
                      </label>
                      <input
                        id="input-due-date"
                        type="date"
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Ao salvar, o valor ficará registrado como <strong className="text-rose-600">PENDENTE</strong> na aba <strong className="text-slate-800">FINANCEIRO</strong> no campo <strong className="text-slate-800">CONTAS A PAGAR</strong> com vencimento em <span className="font-mono font-semibold">{dueDate ? dueDate.split('-').reverse().join('/') : ''}</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Produtos da Compra, Lotes e Validade
                  </h4>
                  {products.length === 0 && (
                    <p className="text-[11px] text-pink-600 font-medium">
                      Digite os produtos recebidos na nota abaixo para cadastrá-los e lançar o estoque.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  id="btn-add-item-purchase"
                  onClick={addItemRow}
                  className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  title="Adicionar mais um item a esta compra"
                >
                  <Plus className="w-3.5 h-3.5 text-pink-600" />
                  <span>Adicionar Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-slate-500 font-medium">Produto *</label>
                          {products.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (it.productId === 'NEW_PRODUCT') {
                                  updateItemRow(idx, 'productId', products[0].id);
                                } else {
                                  updateItemRow(idx, 'productId', 'NEW_PRODUCT');
                                }
                              }}
                              className="text-[10px] text-pink-600 hover:text-pink-800 font-medium cursor-pointer"
                            >
                              {it.productId === 'NEW_PRODUCT' ? 'Escolher do catálogo' : '+ Digitar novo produto'}
                            </button>
                          )}
                        </div>

                        {it.productId === 'NEW_PRODUCT' || products.length === 0 ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              required
                              placeholder="Nome do produto (ex: Base Líquida Matte)"
                              value={it.productName}
                              onChange={(e) => updateItemRow(idx, 'productName', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                            />
                            <input
                              type="text"
                              placeholder="Tom / Cor / Variação (ex: Tom 02 - Quente) - opcional"
                              value={it.shade || ''}
                              onChange={(e) => updateItemRow(idx, 'shade', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[11px] text-slate-600 focus:outline-none focus:border-pink-500"
                            />
                          </div>
                        ) : (
                          <select
                            value={it.productId}
                            onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.shade ? `(${p.shade})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Quantidade *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={it.quantity}
                          onChange={(e) =>
                            updateItemRow(idx, 'quantity', Number(e.target.value) || 1)
                          }
                          className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 block mb-0.5">Custo Unit. (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={it.unitCost}
                            onChange={(e) =>
                              updateItemRow(idx, 'unitCost', Number(e.target.value) || 0)
                            }
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-pink-500"
                          />
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-slate-400 hover:text-red-500 p-1.5 mt-3 rounded-md hover:bg-red-50 transition cursor-pointer"
                            title="Remover Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Batch & Expiry for FEFO */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Número do Lote *</label>
                        <input
                          type="text"
                          required
                          value={it.batchNumber}
                          onChange={(e) => updateItemRow(idx, 'batchNumber', e.target.value)}
                          placeholder="LOTE-001"
                          className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Fabricação</label>
                        <input
                          type="date"
                          value={it.manufacturingDate}
                          onChange={(e) => updateItemRow(idx, 'manufacturingDate', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Data de Validade *</label>
                        <input
                          type="date"
                          required
                          value={it.expiryDate}
                          onChange={(e) => updateItemRow(idx, 'expiryDate', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-pink-600 font-semibold focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-500 mb-2">Nenhum produto adicionado nesta compra ainda.</p>
                    <button
                      type="button"
                      id="btn-add-first-purchase-item"
                      onClick={addItemRow}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Primeiro Item</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Total summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Total da Nota Fiscal a Pagar:</span>
              <span className="text-lg font-extrabold text-slate-900">{formatCurrency(totalPurchase)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                {submitting ? 'Registrando...' : 'Finalizar Entrada de Compra'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
