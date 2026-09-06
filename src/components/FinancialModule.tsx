import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import { AccountPayable, AccountReceivable, CashMovement } from '../types.ts';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Filter,
  X,
  Clock,
  CreditCard,
  Building2
} from 'lucide-react';

export const FinancialModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payables' | 'receivables' | 'cashflow'>('payables');
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [cashFlow, setCashFlow] = useState<{
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
    movements: CashMovement[];
  }>({ totalEntradas: 0, totalSaidas: 0, saldo: 0, movements: [] });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [payableStatusFilter, setPayableStatusFilter] = useState<string>('all');
  const [payableCategoryFilter, setPayableCategoryFilter] = useState<string>('all');

  // New Payable Modal
  const [showPayableModal, setShowPayableModal] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [payableForm, setPayableForm] = useState({
    description: '',
    category: 'ALUGUEL',
    amount: 100,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplierName: '',
    notes: '',
  });

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [pays, recs, flow] = await Promise.all([
        api.getPayables(),
        api.getReceivables(),
        api.getCashFlow(),
      ]);
      setPayables(pays);
      setReceivables(recs);
      setCashFlow(flow);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Handle Pay Account
  const handlePayAccount = async (id: string, description: string) => {
    if (!confirm(`Confirmar o pagamento da conta "${description}"? Isso gerará uma saída no Fluxo de Caixa.`)) return;
    try {
      await api.payPayable(id);
      loadFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao pagar conta');
    }
  };

  // Handle Receive Account
  const handleReceiveAccount = async (id: string, customer: string) => {
    if (!confirm(`Confirmar recebimento da parcela do cliente "${customer}"? Isso gerará uma entrada no Fluxo de Caixa.`)) return;
    try {
      await api.receiveReceivable(id);
      loadFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar recebimento');
    }
  };

  // Handle Create Payable
  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategory = payableForm.category === 'OUTROS'
        ? (customCategoryName.trim() || 'Outros')
        : payableForm.category;

      await api.createPayable({
        ...payableForm,
        category: finalCategory,
      });
      setShowPayableModal(false);
      setPayableForm({
        description: '',
        category: 'ALUGUEL',
        amount: 100,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        supplierName: '',
        notes: '',
      });
      setCustomCategoryName('');
      loadFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar conta a pagar');
    }
  };

  const customCategories = useMemo(() => {
    const defaultCodes = new Set(['FORNECEDOR', 'ALUGUEL', 'ENERGIA', 'INTERNET', 'MARKETING', 'SALARIOS', 'OUTROS']);
    const cats = new Set<string>();
    payables.forEach((p) => {
      if (p.category && !defaultCodes.has(p.category)) {
        cats.add(p.category);
      }
    });
    return Array.from(cats);
  }, [payables]);

  const filteredPayables = payables.filter((p) => {
    const matchStatus = payableStatusFilter === 'all' || p.status === payableStatusFilter;
    const matchCat = payableCategoryFilter === 'all' || p.category === payableCategoryFilter;
    return matchStatus && matchCat;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestão Financeira & DRE</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              Módulo Administrativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de Contas a Pagar, Contas a Receber, Fluxo de Caixa diário e baixas integradas.
          </p>
        </div>

        <button
          id="btn-new-payable"
          onClick={() => setShowPayableModal(true)}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta a Pagar / Despesa</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('payables')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-2 ${
            activeTab === 'payables'
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          <span>Contas a Pagar ({payables.filter((p) => p.status === 'PENDENTE' || p.status === 'VENCIDO').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-2 ${
            activeTab === 'receivables'
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          <span>Contas a Receber ({receivables.filter((r) => r.status === 'PENDENTE').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-2 ${
            activeTab === 'cashflow'
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>Fluxo de Caixa ({formatCurrency(cashFlow.saldo)})</span>
        </button>
      </div>

      {/* TAB 1: CONTAS A PAGAR */}
      {activeTab === 'payables' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={payableStatusFilter}
              onChange={(e) => setPayableStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
            >
              <option value="all">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="VENCIDO">Vencidos</option>
              <option value="PAGO">Pagos</option>
            </select>

            <select
              value={payableCategoryFilter}
              onChange={(e) => setPayableCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="FORNECEDOR">Fornecedor / Mercadorias</option>
              <option value="ALUGUEL">Aluguel do Ponto</option>
              <option value="ENERGIA">Energia Elétrica</option>
              <option value="INTERNET">Internet / Telefone</option>
              <option value="MARKETING">Marketing & Anúncios</option>
              <option value="SALARIOS">Salários / Comissões</option>
              <option value="OUTROS">Outros</option>
              {customCategories.length > 0 && (
                <optgroup label="Despesas Personalizadas">
                  {customCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Descrição / Fornecedor</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">Vencimento</th>
                    <th className="px-3 py-3">Valor</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayables.map((p) => {
                    const isOverdue = p.status === 'VENCIDO';
                    const isPaid = p.status === 'PAGO';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{p.description}</div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            {p.supplierName && (
                              <span className="text-[11px] text-slate-500 font-medium">{p.supplierName}</span>
                            )}
                            {p.paymentMethod && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                                {p.paymentMethod}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-500">{p.category}</td>
                        <td className="px-3 py-3 font-mono font-bold">
                          <span className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>
                            {p.dueDate}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-900 text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-3 py-3">
                          {isPaid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Pago ({p.paymentDate})
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Vencido!
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isPaid ? (
                            <button
                              onClick={() => handlePayAccount(p.id, p.description)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-md shadow-xs transition"
                            >
                              Dar Baixa (Pagar)
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 flex items-center justify-end space-x-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Liquidado</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAS A RECEBER */}
      {activeTab === 'receivables' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-3 py-3">Origem</th>
                  <th className="px-3 py-3">Parcela</th>
                  <th className="px-3 py-3">Vencimento</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((r) => {
                  const isReceived = r.status === 'RECEBIDO';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{r.customerName}</td>
                      <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                        Venda #{r.saleNumber}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-700">
                        {r.installmentNumber} / {r.totalInstallments}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-600">{r.dueDate}</td>
                      <td className="px-3 py-3 font-bold text-emerald-700 text-sm">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-3 py-3">
                        {isReceived ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Recebido ({r.receivedDate})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Aguardando
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isReceived ? (
                          <button
                            onClick={() => handleReceiveAccount(r.id, r.customerName)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs transition"
                          >
                            Baixar (Recebido)
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 flex items-center justify-end space-x-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Recebido</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {receivables.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      Nenhuma conta a receber pendente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FLUXO DE CAIXA */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Entradas Realizadas</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {formatCurrency(cashFlow.totalEntradas)}
              </div>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Saídas / Pagamentos</span>
              <div className="text-xl font-extrabold text-rose-600 mt-1">
                {formatCurrency(cashFlow.totalSaidas)}
              </div>
            </div>
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Saldo Atual de Caixa</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(cashFlow.saldo)}
              </div>
            </div>
          </div>

          {/* Movements Statement */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-3 py-3">Descrição da Movimentação</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Valor</th>
                    <th className="px-4 py-3 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashFlow.movements.map((m) => {
                    const isEntrada = m.type === 'ENTRADA';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{m.date}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900">{m.description}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-500">{m.category}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isEntrada
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 font-bold text-sm ${
                            isEntrada ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isEntrada ? `+${formatCurrency(m.amount)}` : `-${formatCurrency(m.amount)}`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(m.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PAYABLE ACCOUNT */}
      {showPayableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePayable}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Nova Conta a Pagar / Despesa</h3>
              <button
                type="button"
                onClick={() => setShowPayableModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Descrição do Gasto *</label>
              <input
                type="text"
                required
                value={payableForm.description}
                onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })}
                placeholder="Ex: Aluguel da Loja - Mês Atual"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-700 font-semibold">Categoria *</label>
                  {payableForm.category === 'OUTROS' && (
                    <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                      Editável
                    </span>
                  )}
                </div>
                <select
                  id="select-payable-category"
                  value={payableForm.category}
                  onChange={(e) => {
                    setPayableForm({ ...payableForm, category: e.target.value });
                    if (e.target.value !== 'OUTROS') {
                      setCustomCategoryName('');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                >
                  <option value="ALUGUEL">Aluguel do Ponto</option>
                  <option value="ENERGIA">Energia Elétrica</option>
                  <option value="INTERNET">Internet / Telefone</option>
                  <option value="FORNECEDOR">Fornecedor / Cosméticos</option>
                  <option value="MARKETING">Marketing / Anúncios</option>
                  <option value="SALARIOS">Salários / Comissões</option>
                  <option value="OUTROS">Outros (digite o nome da despesa)</option>
                </select>

                {payableForm.category === 'OUTROS' && (
                  <div className="mt-1.5 space-y-1 animate-fadeIn">
                    <label className="text-[11px] text-pink-700 font-bold block">
                      Nome da Nova Despesa *
                    </label>
                    <input
                      id="input-custom-expense-name"
                      type="text"
                      required
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Ex: Manutenção, Taxas, Embalagens, etc."
                      className="w-full bg-pink-50/70 border border-pink-300 rounded-md px-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-500 shadow-xs"
                      autoFocus
                    />
                    <p className="text-[10px] text-pink-600">
                      Esta despesa será salva com o nome que você digitar aqui.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payableForm.amount}
                  onChange={(e) =>
                    setPayableForm({ ...payableForm, amount: Number(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Data de Vencimento *</label>
                <input
                  type="date"
                  required
                  value={payableForm.dueDate}
                  onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Beneficiário / Fornecedor</label>
                <input
                  type="text"
                  value={payableForm.supplierName}
                  onChange={(e) => setPayableForm({ ...payableForm, supplierName: e.target.value })}
                  placeholder="Ex: Imobiliária Central"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPayableModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar Conta a Pagar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
