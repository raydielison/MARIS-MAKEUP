import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { StoreSettings, User, UserRole } from '../types.ts';
import { SUPABASE_SQL_SCRIPT } from '../data/supabaseSql.ts';
import { Settings, Users, Plus, Shield, CheckCircle2, UserX, UserCheck, Save, Sparkles, X, Database, Server, HardDrive, Key, Cloud, Check, Copy, AlertCircle, RefreshCw, Layers, Trash2, AlertTriangle } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [testingSupabase, setTestingSupabase] = useState<boolean>(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [cleaningData, setCleaningData] = useState<boolean>(false);
  const [cleanSuccess, setCleanSuccess] = useState<string | null>(null);
  const [showConfirmCleanModal, setShowConfirmCleanModal] = useState<boolean>(false);

  // New User Modal
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('VENDEDOR');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sett, usrs, dbInfo, supaInfo] = await Promise.all([
        api.getSettings(),
        api.getUsers(),
        api.getDatabaseStatus().catch(() => null),
        api.getSupabaseStatus().catch(() => null),
      ]);
      setSettings(sett);
      setUsers(usrs);
      setDbStatus(dbInfo);
      setSupabaseStatus(supaInfo);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await api.testSupabaseConnection();
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        message: err.message || 'Erro ao comunicar com a API do Supabase.',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSavingSettings(true);
    try {
      await api.updateSettings(settings);
      alert('Configurações da loja salvas com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleUser = async (id: string) => {
    try {
      await api.toggleUser(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do usuário');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        active: true,
      });
      setShowUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar usuário');
    }
  };

  const handleClearFictitiousData = async () => {
    setCleaningData(true);
    try {
      const res = await api.clearFictitiousData();
      setCleanSuccess(res.message);
      setShowConfirmCleanModal(false);
      await loadData();
      setTimeout(() => setCleanSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Erro ao limpar dados fictícios');
    } finally {
      setCleaningData(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configurações & Gestão de Usuários</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2.5 py-0.5 rounded-full border border-pink-200">
              ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dados cadastrais da loja, rodapé do comprovante térmico, parâmetros de alerta e controle de acesso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STORE DETAILS FORM */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <Settings className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-slate-900">Dados da Empresa & Comprovante</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Nome da Loja</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">CNPJ</label>
                <input
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Telefone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Endereço da Loja</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Mensagem de Rodapé do Cupom</label>
              <textarea
                rows={2}
                value={settings.receiptFooterMessage}
                onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Estoque Mínimo Padrão</label>
                <input
                  type="number"
                  value={settings.defaultMinStock}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultMinStock: Number(e.target.value) || 5 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Alerta de Validade (Dias)</label>
                <input
                  type="number"
                  value={settings.validityAlertDays}
                  onChange={(e) =>
                    setSettings({ ...settings, validityAlertDays: Number(e.target.value) || 30 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center justify-center space-x-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>

        {/* USER MANAGEMENT */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-pink-600" />
              <h3 className="text-sm font-bold text-slate-900">Usuários & Acesso por Perfil (RBAC)</h3>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center border border-pink-200 uppercase">
                    {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {u.role}
                  </span>

                  <button
                    onClick={() => handleToggleUser(u.id)}
                    className={`p-1.5 rounded-md text-xs transition ${
                      u.active
                        ? 'text-emerald-600 hover:bg-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={u.active ? 'Usuário Ativo (Clique para inativar)' : 'Usuário Inativo'}
                  >
                    {u.active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CLOUD SQL & PERSISTENCE ARCHITECTURE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Banco de Dados Relacional (Cloud SQL & PostgreSQL)</h3>
              <p className="text-[11px] text-slate-500">
                Infraestrutura gerenciada com alta disponibilidade, backups e migrações tipadas com Drizzle ORM.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL 17 Ativo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Provedor / Mecanismo
            </span>
            <div className="font-semibold text-slate-900 flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-pink-600" />
              <span>Google Cloud SQL</span>
            </div>
            <span className="text-[11px] text-slate-500">PostgreSQL 17 (Enterprise)</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Região & Conectividade
            </span>
            <div className="font-semibold text-slate-900">us-east1 (N. Virginia)</div>
            <span className="text-[11px] text-slate-500">Unix Domain Socket Proxy</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Camada ORM & Schema
            </span>
            <div className="font-semibold text-slate-900">Drizzle ORM & Kit</div>
            <span className="text-[11px] text-slate-500">11 Tabelas Tipadas Ativas</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Segurança & Acesso
            </span>
            <div className="font-semibold text-slate-900">Firebase Auth + RBAC</div>
            <span className="text-[11px] text-slate-500">Tokens Criptografados</span>
          </div>
        </div>

        {dbStatus && dbStatus.tables && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Tabelas Relacionais:</span>
            {dbStatus.tables.map((t: string) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SUPABASE RELATIONAL & REST API ENGINE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <Cloud className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Supabase (PostgreSQL & REST API)</h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  SDK v2 Integrado
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Acesso unificado com chaves de API (<code className="font-mono text-slate-700 font-semibold">SUPABASE_URL</code> e <code className="font-mono text-slate-700 font-semibold">SUPABASE_ANON_KEY</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {supabaseStatus?.configured ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Chaves Conectadas</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Aguardando Chaves no Settings</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>{testingSupabase ? 'Testando...' : 'Testar Conexão'}</span>
            </button>
          </div>
        </div>

        {/* Status Message from Ping/Test */}
        {supabaseTestResult && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs flex items-start space-x-2 ${
              supabaseTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {supabaseTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{supabaseTestResult.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              SUPABASE_URL (Projeto)
            </span>
            <div className="font-mono text-slate-900 font-semibold text-[11px] truncate">
              {supabaseStatus?.projectUrl || 'Não configurada (definir no painel)'}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {supabaseStatus?.projectUrl ? 'URL do projeto ativa' : 'Ex: https://xyzcompany.supabase.co'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                SUPABASE_ANON_KEY (Chave API)
              </span>
              <Key className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex items-center space-x-1.5">
              {supabaseStatus?.hasAnonKey ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  Presente no Ambiente
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  Pendente no Menu Settings
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Chave pública para operações REST e Auth</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                SERVICE_ROLE_KEY (Opcional)
              </span>
              <Shield className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex items-center space-x-1.5">
              {supabaseStatus?.hasServiceRoleKey ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  Presente no Servidor
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-semibold text-[10px]">
                  Opcional (Privada)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Isolada com segurança no backend Node.js</span>
          </div>
        </div>

        {/* Quick Instructions & Schema Action */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2">
            <Layers className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Como adicionar suas Chaves de API do Supabase:</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                1. No menu superior ou lateral do <strong>Google AI Studio</strong>, acesse <strong>Settings &rarr; Secrets</strong>.<br />
                2. Adicione as variáveis <strong>SUPABASE_URL</strong> e <strong>SUPABASE_ANON_KEY</strong> com as credenciais do seu painel Supabase.<br />
                3. O servidor MARIS MAKEUP carrega automaticamente sem necessidade de reinicialização.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Ver Script SQL das Tabelas</span>
          </button>
        </div>
      </div>

      {/* CARD: LIMPEZA DE DADOS FICTÍCIOS & PRONTIDÃO PARA PRODUÇÃO */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Base de Dados para Produção (Dados Reais)</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Base Limpa & Pronta
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Os dados fictícios foram removidos. Cadastre seus produtos, estoque, fornecedores e clientes reais da MARIS MAKEUP.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmCleanModal(true)}
            disabled={cleaningData}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Zerar / Limpar Dados de Teste</span>
          </button>
        </div>

        {cleanSuccess && (
          <div className="mt-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cleanSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Produtos & Estoque
            </span>
            <div className="font-semibold text-slate-900">Base Pronta para Entrada</div>
            <span className="text-[11px] text-slate-500">Cadastre seus cosméticos reais</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Vendas & Histórico PDV
            </span>
            <div className="font-semibold text-slate-900">Histórico de Testes Zerado</div>
            <span className="text-[11px] text-slate-500">Métricas e caixas zerados</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Contas & Fornecedores
            </span>
            <div className="font-semibold text-slate-900">Financeiro Zerado</div>
            <span className="text-[11px] text-slate-500">Pronto para lançamentos reais</span>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMAÇÃO DE LIMPEZA */}
      {showConfirmCleanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirmar Limpeza de Dados de Teste</h4>
                <p className="text-xs text-slate-500">Esta ação remove produtos, vendas e movimentações financeiras de teste.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Os usuários de acesso (administradora e vendedor) e as configurações da loja serão preservados para que você continue usando o sistema sem interrupções.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmCleanModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearFictitiousData}
                disabled={cleaningData}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {cleaningData ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar e Limpar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPABASE SQL SCRIPT */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Script DDL Completo para o Supabase SQL Editor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed rounded-b-none selection:bg-emerald-500 selection:text-white">
              <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCRIPT}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-xl">
              <span className="text-[11px] text-slate-500">
                Copie e cole este código no <strong>SQL Editor</strong> do painel do seu projeto no Supabase.
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW USER */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Usuário</h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Ex: Beatriz Lima"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">E-mail de Acesso *</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="usuario@marismakeup.com"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">Cargo / Permissão *</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              >
                <option value="VENDEDOR">VENDEDOR (Sem acesso a custos, lucros e financeiro)</option>
                <option value="ADMIN">ADMINISTRADOR (Acesso Total irrestrito)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
