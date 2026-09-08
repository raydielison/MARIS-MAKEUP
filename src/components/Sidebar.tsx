import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Package,
  Boxes,
  ClockAlert,
  ReceiptText,
  Users,
  Building2,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  badgeCounts?: {
    lowStock: number;
    expiringBatches: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  badgeCounts = { lowStock: 1, expiringBatches: 2 },
}) => {
  const { isAdmin, isVendedor, user } = useAuth();

  const handleNav = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const totalStockAlerts = (badgeCounts.lowStock || 0) + (badgeCounts.expiringBatches || 0);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'VENDEDOR'],
      subtitle: isVendedor ? 'Meu Desempenho' : 'Visão Geral Executiva',
    },
    {
      id: 'pdv',
      label: 'PDV / Caixa',
      icon: ShoppingCart,
      roles: ['ADMIN', 'VENDEDOR'],
      highlight: true,
      subtitle: 'Nova Venda Rápida',
    },
    {
      id: 'products_stock',
      label: 'Produtos & Estoque',
      icon: Boxes,
      roles: ['ADMIN', 'VENDEDOR'],
      badge:
        totalStockAlerts > 0
          ? `${totalStockAlerts} alerta${totalStockAlerts > 1 ? 's' : ''}`
          : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      subtitle: 'Catálogo, Estoque & Validade',
    },
    {
      id: 'sales',
      label: 'Vendas & Histórico',
      icon: ReceiptText,
      roles: ['ADMIN', 'VENDEDOR'],
      subtitle: isVendedor ? 'Minhas Vendas' : 'Todas as Vendas & Estorno',
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: Users,
      roles: ['ADMIN', 'VENDEDOR'],
      subtitle: 'Cadastro & Histórico CRM',
    },
    // The following modules are strictly ADMIN ONLY:
    {
      id: 'suppliers',
      label: 'Fornecedores',
      icon: Building2,
      roles: ['ADMIN'],
      subtitle: 'Distribuidoras & Contatos',
    },
    {
      id: 'purchases',
      label: 'Compras',
      icon: Truck,
      roles: ['ADMIN'],
      subtitle: 'Entrada de Mercadorias',
    },
    {
      id: 'financial_reports',
      label: 'Financeiro & Relatórios',
      icon: DollarSign,
      roles: ['ADMIN'],
      subtitle: 'Contas, Caixa & DRE',
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      roles: ['ADMIN'],
      subtitle: 'Loja, Usuários & Regras',
    },
  ];

  const visibleNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-pink-500/30 bg-pink-50 shadow-xs">
              <img
                src="/favicon.png"
                alt="Logo Maris Makeup"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-white font-bold text-base tracking-tight">MARIS MAKEUP</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Notice */}
        <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isAdmin ? 'bg-pink-500' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              Modo: <strong className="text-white">{user?.role}</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">
            {isAdmin ? 'Total' : 'Vendas'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isProductsStockActive =
              item.id === 'products_stock' &&
              ['products_stock', 'products', 'stock', 'validity'].includes(currentTab);
            const isFinancialReportsActive =
              item.id === 'financial_reports' &&
              ['financial_reports', 'financial', 'reports'].includes(currentTab);
            const isActive =
              isProductsStockActive || isFinancialReportsActive || currentTab === item.id;
            const isHighlight = item.highlight;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs transition-colors group cursor-pointer ${
                  isActive
                    ? 'bg-pink-600/10 text-pink-500 font-semibold shadow-2xs'
                    : isHighlight
                    ? 'bg-pink-950/30 text-pink-400 border border-pink-900/50 hover:bg-pink-950/60 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive
                        ? 'text-pink-500'
                        : isHighlight
                        ? 'text-pink-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-sm font-semibold leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-pink-400/80' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-pink-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <p className="text-xs text-white font-medium">{user?.name || 'Ana Oliveira'}</p>
              <p className="text-[10px] text-slate-500">{user?.role === 'ADMIN' ? 'Administradora' : 'Vendedora'}</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
      </aside>
    </>
  );
};
