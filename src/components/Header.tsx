import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sparkles,
  UserCheck,
  LogOut,
  ShoppingCart,
  Bell,
  AlertTriangle,
  Clock,
  DollarSign,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onOpenPDV: () => void;
  onNavigate: (tab: string) => void;
  onToggleMobileSidebar: () => void;
  alertsCount?: {
    lowStock: number;
    expired: number;
    expiring7Days: number;
    overduePayables: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPDV,
  onNavigate,
  onToggleMobileSidebar,
  alertsCount = { lowStock: 1, expired: 1, expiring7Days: 1, overduePayables: 1 },
}) => {
  const { user, isAdmin, loginDemo, logout } = useAuth();
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  const totalAlerts =
    alertsCount.lowStock +
    alertsCount.expired +
    alertsCount.expiring7Days +
    (isAdmin ? alertsCount.overduePayables : 0);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between text-slate-800 shadow-xs">
      {/* Left side: Hamburger & Store Title */}
      <div className="flex items-center space-x-3">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-pink-200 shadow-xs bg-pink-50">
            <img
              src="/favicon.png"
              alt="Logo Maris Makeup"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-slate-900 text-base">MARIS MAKEUP</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-pink-50 text-pink-600 border border-pink-200">
                ERP PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Gestão de Estoque, Vendas & Financeiro</p>
          </div>
        </div>
      </div>

      {/* Right side: Quick PDV button, Alerts dropdown, Profile & Role switcher */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Status Badges */}
        <div className="hidden md:flex items-center space-x-2">
          {totalAlerts > 0 ? (
            <span className="bg-red-100 text-red-600 px-2.5 py-0.5 rounded text-[10px] font-bold">
              {totalAlerts} Alertas
            </span>
          ) : (
            <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded text-[10px] font-bold">
              Tudo Regular
            </span>
          )}
          <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[10px] font-bold">
            PDV Pronto
          </span>
        </div>

        <div className="hidden sm:block h-8 w-[1px] bg-slate-200"></div>

        {/* PDV Quick Launch Button */}
        <button
          id="btn-quick-pdv"
          onClick={onOpenPDV}
          className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-md shadow-xs transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="font-semibold">Nova Venda / PDV</span>
        </button>

        {/* Alerts Button & Dropdown */}
        <div className="relative">
          <button
            id="btn-alerts-toggle"
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Alertas do Sistema"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-600 text-[10px] font-bold text-white flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Alertas Críticos</span>
                <span className="text-[11px] text-slate-500">{totalAlerts} pendência(s)</span>
              </div>

              <div className="space-y-2">
                {alertsCount.expired > 0 && (
                  <div
                    onClick={() => {
                      onNavigate('validity');
                      setShowAlertsMenu(false);
                    }}
                    className="p-2.5 rounded-lg bg-red-50 border-l-4 border-red-400 text-slate-800 flex items-center justify-between cursor-pointer hover:bg-red-100/70 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Produtos Vencidos!</div>
                        <div className="text-[10px] text-slate-600">{alertsCount.expired} lote(s) fora da validade</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded">Ver</span>
                  </div>
                )}

                {alertsCount.expiring7Days > 0 && (
                  <div
                    onClick={() => {
                      onNavigate('validity');
                      setShowAlertsMenu(false);
                    }}
                    className="p-2.5 rounded-lg bg-orange-50 border-l-4 border-orange-400 text-slate-800 flex items-center justify-between cursor-pointer hover:bg-orange-100/70 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Vencendo em até 7 dias</div>
                        <div className="text-[10px] text-slate-600">{alertsCount.expiring7Days} lote(s) requerem FEFO</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded">FEFO</span>
                  </div>
                )}

                {alertsCount.lowStock > 0 && (
                  <div
                    onClick={() => {
                      onNavigate('stock');
                      setShowAlertsMenu(false);
                    }}
                    className="p-2.5 rounded-lg bg-amber-50 border-l-4 border-amber-400 text-slate-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Estoque Baixo</div>
                        <div className="text-[10px] text-slate-600">{alertsCount.lowStock} produto(s) abaixo do mínimo</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded">Repor</span>
                  </div>
                )}

                {isAdmin && alertsCount.overduePayables > 0 && (
                  <div
                    onClick={() => {
                      onNavigate('financial');
                      setShowAlertsMenu(false);
                    }}
                    className="p-2.5 rounded-lg bg-slate-50 border-l-4 border-slate-400 text-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-slate-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800">Contas a Pagar Vencidas</div>
                        <div className="text-[10px] text-slate-600">{alertsCount.overduePayables} conta(s) em atraso</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-700 text-white font-bold px-2 py-0.5 rounded">Pagar</span>
                  </div>
                )}

                {totalAlerts === 0 && (
                  <p className="text-slate-500 text-center py-4">Nenhum alerta crítico no momento.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile & Quick Role Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center border border-pink-300 uppercase shadow-2xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</div>
            <div className="flex items-center space-x-1">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  isAdmin ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>

          {/* Quick Demo Switcher button */}
          <div className="flex items-center border-l border-slate-200 pl-2 space-x-1">
            <button
              id="btn-switch-role"
              onClick={() => loginDemo(isAdmin ? 'VENDEDOR' : 'ADMIN')}
              title={`Alternar para ${isAdmin ? 'Vendedor' : 'Administrador'}`}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center space-x-1 shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-pink-600" />
              <span className="hidden sm:inline">Mudar para {isAdmin ? 'Vendedor' : 'Admin'}</span>
            </button>

            <button
              id="btn-logout"
              onClick={logout}
              title="Sair da Conta"
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
