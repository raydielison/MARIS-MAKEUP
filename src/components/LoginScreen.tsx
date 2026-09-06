import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState<string>('marina@makeup.com.br');
  const [password, setPassword] = useState<string>('marinamakeup');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'ADMIN' | 'VENDEDOR') => {
    setError(null);
    if (role === 'ADMIN') {
      setEmail('marina@makeup.com.br');
      setPassword('marinamakeup');
    } else {
      setEmail('vendedor@makeup.com.br');
      setPassword('vendedormakeup');
    }
    setLoading(true);
    try {
      await loginDemo(role);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-600 text-white shadow-md shadow-pink-500/20 mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          MARIS MAKEUP
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sistema de Gestão, Estoque & Frente de Caixa PDV
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@makeup.com.br"
                  className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="block w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-xs text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition disabled:opacity-50"
              >
                {loading ? 'Validando acesso...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>

          {/* Quick Access Credentials Cards */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Perfis Disponíveis para Login
            </p>

            <div className="space-y-2.5">
              {/* ADMIN PROFILE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-900">Marina (Admin)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-mono text-slate-800">marina@makeup.com.br</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Senha: <code className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700 font-bold">marinamakeup</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ADMIN')}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-pink-500 hover:text-pink-600 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition"
                >
                  Entrar
                </button>
              </div>

              {/* VENDEDOR PROFILE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-900">Vendedor MARIS</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      VENDEDOR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-mono text-slate-800">vendedor@makeup.com.br</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Senha: <code className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700 font-bold">vendedormakeup</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('VENDEDOR')}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-pink-500 hover:text-pink-600 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Controle de Acesso RBAC com Auditoria Imutável</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
