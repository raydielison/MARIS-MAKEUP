import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Customer } from '../types.ts';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  Clock,
  Edit2,
  ChevronRight,
  X,
  UserCheck,
  Trash2,
  Instagram
} from 'lucide-react';

export const CustomersModule: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [inactivityFilter, setInactivityFilter] = useState<string>('all');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    cpf: '',
    birthDate: '',
    address: '',
    notes: '',
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      setCustomers(res);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const openNewModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      instagram: '',
      cpf: '',
      birthDate: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      instagram: customer.instagram || '',
      cpf: customer.cpf || '',
      birthDate: customer.birthDate || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o cadastro da cliente "${customer.name}"?\nEsta ação é permanente e removerá o histórico do cliente.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      if (editingCustomer?.id === customer.id) {
        setShowModal(false);
        setEditingCustomer(null);
      }
      if (viewingCustomer?.id === customer.id) {
        setViewingCustomer(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setShowModal(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente');
    }
  };

  // Filter list
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchQ =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.cpf && c.cpf.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    let matchInactivity = true;
    if (inactivityFilter !== 'all') {
      if (!c.lastPurchaseDate) {
        matchInactivity = true;
      } else {
        const days = Math.floor(
          (Date.now() - new Date(c.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (inactivityFilter === '30') matchInactivity = days >= 30;
        if (inactivityFilter === '60') matchInactivity = days >= 60;
        if (inactivityFilter === '90') matchInactivity = days >= 90;
      }
    }

    return matchQ && matchInactivity;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Clientes & Fidelidade CRM</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              {filtered.length} clientes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre clientes, consulte histórico de compras, ticket médio e acione pós-venda via WhatsApp.
          </p>
        </div>

        <button
          id="btn-new-customer"
          onClick={openNewModal}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-customer"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, WhatsApp, CPF..."
            className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
          />
        </div>

        <select
          id="filter-customer-inactivity"
          value={inactivityFilter}
          onChange={(e) => setInactivityFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todos os Clientes</option>
          <option value="30">Sem comprar há 30+ dias</option>
          <option value="60">Sem comprar há 60+ dias</option>
          <option value="90">Inativos (90+ dias)</option>
        </select>
      </div>

      {/* Customers Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-3 py-3">Contato & WhatsApp</th>
                <th className="px-3 py-3">CPF</th>
                <th className="px-3 py-3">Total Gasto</th>
                <th className="px-3 py-3">Última Compra</th>
                <th className="px-3 py-3">Compras</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const cleanPhone = (c.phone || '').replace(/\D/g, '');

                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {c.email && <span className="text-[11px] text-slate-400">{c.email}</span>}
                        {c.instagram && (
                          <span className="inline-flex items-center text-[10px] text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 font-mono">
                            @{c.instagram.replace(/^@/, '')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-700">{c.phone}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 font-mono text-slate-500">{c.cpf || '—'}</td>

                    <td className="px-3 py-3 font-bold text-emerald-700 text-sm">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                      {c.lastPurchaseDate ? c.lastPurchaseDate.split('T')[0] : 'Nenhuma'}
                    </td>

                    <td className="px-3 py-3 font-bold text-slate-800">
                      {c.purchaseCount || 0} compras
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`btn-view-customer-${c.id}`}
                          onClick={() => setViewingCustomer(c)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Ver Ficha Completa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-customer-${c.id}`}
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Editar Cadastro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-customer-${c.id}`}
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Excluir Cadastro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum cliente cadastrado com esses termos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT CUSTOMER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomer}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Nome Completo *</label>
              <input
                id="input-customer-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Mariana Vasconcelos"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Telefone / WhatsApp *</label>
                <input
                  id="input-customer-phone"
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98888-0000"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">CPF</label>
                <input
                  id="input-customer-cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">E-mail</label>
                <input
                  id="input-customer-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Instagram (@)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none">
                    @
                  </span>
                  <input
                    id="input-customer-instagram"
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace(/^@/, '') })}
                    placeholder="usuario"
                    className="w-full bg-white border border-slate-300 rounded-md pl-6 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Data de Nascimento</label>
              <input
                id="input-customer-birth"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Endereço</label>
              <input
                id="input-customer-address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, Número, Bairro, Cidade"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Observações de Maquiagem / Tom</label>
              <textarea
                id="input-customer-notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Prefere base matte, subtom quente, alérgica a fragrâncias..."
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              {editingCustomer && (
                <button
                  type="button"
                  id="btn-delete-customer-modal"
                  onClick={() => handleDeleteCustomer(editingCustomer)}
                  className="px-3 py-2 rounded-md border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center space-x-1.5 transition"
                  title="Excluir este cadastro de cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                id="btn-save-customer"
                type="submit"
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CUSTOMER CRM PROFILE */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-bold text-slate-900">{viewingCustomer.name}</h3>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Gasto</span>
                <div className="text-lg font-extrabold text-emerald-700 mt-1">
                  {formatCurrency(viewingCustomer.totalSpent)}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Ticket Médio</span>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {formatCurrency(
                    viewingCustomer.purchaseCount
                      ? viewingCustomer.totalSpent / viewingCustomer.purchaseCount
                      : 0
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="text-xs space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">Telefone:</span>{' '}
                <span className="text-slate-900 font-mono font-medium">{viewingCustomer.phone}</span>
              </div>
              {viewingCustomer.cpf && (
                <div>
                  <span className="text-slate-500">CPF:</span>{' '}
                  <span className="text-slate-900 font-mono font-medium">{viewingCustomer.cpf}</span>
                </div>
              )}
              {viewingCustomer.instagram && (
                <div>
                  <span className="text-slate-500">Instagram:</span>{' '}
                  <span className="text-pink-600 font-mono font-medium">@{viewingCustomer.instagram.replace(/^@/, '')}</span>
                </div>
              )}
              {viewingCustomer.email && (
                <div>
                  <span className="text-slate-500">E-mail:</span>{' '}
                  <span className="text-slate-900">{viewingCustomer.email}</span>
                </div>
              )}
              {viewingCustomer.address && (
                <div>
                  <span className="text-slate-500">Endereço:</span>{' '}
                  <span className="text-slate-900">{viewingCustomer.address}</span>
                </div>
              )}
              {viewingCustomer.notes && (
                <div>
                  <span className="text-slate-500 block">Notas de Maquiagem:</span>
                  <p className="text-slate-700 italic mt-0.5">{viewingCustomer.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                id="btn-delete-viewing-customer"
                onClick={() => handleDeleteCustomer(viewingCustomer)}
                className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center transition"
                title="Excluir este Cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {viewingCustomer.phone && (
                <a
                  href={`https://wa.me/55${viewingCustomer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Mensagem WhatsApp</span>
                </a>
              )}
              <button
                onClick={() => {
                  const cust = viewingCustomer;
                  setViewingCustomer(null);
                  openEditModal(cust);
                }}
                className="px-3 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 flex items-center space-x-1"
                title="Editar Cadastro"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
