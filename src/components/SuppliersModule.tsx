import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Supplier } from '../types.ts';
import { Building2, Plus, Search, Phone, Mail, FileText, X } from 'lucide-react';

export const SuppliersModule: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    corporateName: '',
    tradeName: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers();
      setSuppliers(res);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setShowModal(false);
      setFormData({
        corporateName: '',
        tradeName: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar fornecedor');
    }
  };

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      s.tradeName.toLowerCase().includes(q) ||
      s.corporateName.toLowerCase().includes(q) ||
      (s.cnpj && s.cnpj.includes(q))
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Fornecedores & Fabricantes</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              {filtered.length} ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre distribuidoras de maquiagem, dados de faturamento, prazos de entrega e condições comerciais.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome fantasia, razão social, CNPJ..."
          className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{sup.tradeName}</h3>
                <div className="text-[11px] text-slate-500">{sup.corporateName}</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="font-mono text-[11px] text-slate-500">CNPJ: {sup.cnpj || '—'}</div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{sup.phone}</span>
              </div>
              {sup.email && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{sup.email}</span>
                </div>
              )}
              {sup.address && (
                <div className="text-[11px] text-slate-500 truncate">{sup.address}</div>
              )}
              {sup.notes && (
                <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {sup.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Novo Fornecedor</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Nome Fantasia *</label>
              <input
                type="text"
                required
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Ex: Belle Cosméticos Distribuidora"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.corporateName}
                onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                placeholder="Ex: Belle Distribuidora e Comércio Ltda"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Telefone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 3456-7890"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="pedidos@fornecedor.com.br"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Cidade - UF"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Observações e Condições</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Pedido mínimo R$ 500, prazo entrega 3 dias úteis..."
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

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
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar Fornecedor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
