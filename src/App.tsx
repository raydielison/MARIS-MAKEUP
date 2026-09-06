import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';

// Modules
import { DashboardAdmin } from './components/DashboardAdmin.tsx';
import { DashboardSeller } from './components/DashboardSeller.tsx';
import { PDV } from './components/PDV.tsx';
import { ProductsStockModule } from './components/ProductsStockModule.tsx';
import { SalesHistoryModule } from './components/SalesHistoryModule.tsx';
import { CustomersModule } from './components/CustomersModule.tsx';
import { SuppliersModule } from './components/SuppliersModule.tsx';
import { PurchasesModule } from './components/PurchasesModule.tsx';
import { FinancialReportsModule } from './components/FinancialReportsModule.tsx';
import { SettingsModule } from './components/SettingsModule.tsx';

import { LoginScreen } from './components/LoginScreen.tsx';

import { api } from './services/api.ts';
import { ShieldAlert, Sparkles, ShoppingBag } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isAdmin, isVendedor, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const [badgeCounts, setBadgeCounts] = useState({
    lowStock: 0,
    expiringBatches: 0,
    expired: 0,
    overduePayables: 0,
  });

  // Fetch quick metrics for notifications and badges
  const refreshBadgeCounts = async () => {
    try {
      const [validity, alerts] = await Promise.all([
        api.getValidity().catch(() => null),
        api.getAlerts().catch(() => null),
      ]);

      setBadgeCounts({
        expired: validity?.summary?.expired || alerts?.expiredBatches?.length || 0,
        expiringBatches:
          (validity?.summary?.expiring7Days || 0) + (validity?.summary?.expiring30Days || 0) ||
          alerts?.expiringSoonBatches?.length ||
          0,
        lowStock: alerts?.lowStock?.length || 0,
        overduePayables: alerts?.overduePayables?.length || 0,
      });
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    refreshBadgeCounts();
  }, [currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm animate-pulse">
          M
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">MARIS MAKEUP</h2>
          <p className="text-xs text-slate-500 mt-1">Carregando sistema de gestão e estoque...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, show the login screen
  if (!user) {
    return <LoginScreen />;
  }

  // Check RBAC access for current tab
  const adminOnlyTabs = [
    'suppliers',
    'purchases',
    'financial',
    'reports',
    'financial_reports',
    'settings',
  ];
  const isRestricted = adminOnlyTabs.includes(currentTab) && !isAdmin;

  const renderActiveModule = () => {
    if (isRestricted) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Módulo Restrito ao Administrador</h3>
            <p className="text-xs text-slate-600 mt-1">
              Seu perfil atual ({user?.role}) não possui permissão para acessar custos, relatórios financeiros ou configurações avançadas.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
          >
            Voltar ao Meu Dashboard
          </button>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return isAdmin ? (
          <DashboardAdmin
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenPDV={() => setCurrentTab('pdv')}
          />
        ) : (
          <DashboardSeller
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenPDV={() => setCurrentTab('pdv')}
          />
        );

      case 'pdv':
        return (
          <PDV
            onSaleCompleted={() => {
              refreshBadgeCounts();
            }}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );

      case 'products_stock':
        return <ProductsStockModule initialSubTab="products" />;

      case 'products':
        return <ProductsStockModule initialSubTab="products" />;

      case 'stock':
        return <ProductsStockModule initialSubTab="stock" />;

      case 'validity':
        return <ProductsStockModule initialSubTab="validity" />;

      case 'sales':
        return <SalesHistoryModule />;

      case 'customers':
        return <CustomersModule />;

      case 'suppliers':
        return <SuppliersModule />;

      case 'purchases':
        return <PurchasesModule />;

      case 'financial_reports':
        return <FinancialReportsModule initialSubTab="financial" />;

      case 'financial':
        return <FinancialReportsModule initialSubTab="financial" />;

      case 'reports':
        return <FinancialReportsModule initialSubTab="reports" />;

      case 'settings':
        return <SettingsModule />;

      default:
        return isAdmin ? (
          <DashboardAdmin
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenPDV={() => setCurrentTab('pdv')}
          />
        ) : (
          <DashboardSeller
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenPDV={() => setCurrentTab('pdv')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        onOpenPDV={() => setCurrentTab('pdv')}
        onNavigate={(tab) => setCurrentTab(tab)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        alertsCount={{
          lowStock: badgeCounts.lowStock,
          expired: badgeCounts.expired,
          expiring7Days: badgeCounts.expiringBatches,
          overduePayables: badgeCounts.overduePayables,
        }}
      />

      {/* Main App Body with Responsive Sidebar and Content View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          badgeCounts={{
            lowStock: badgeCounts.lowStock,
            expiringBatches: badgeCounts.expiringBatches,
          }}
        />

        {/* Dynamic Main Workspace Container */}
        <main
          id="main-app-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50"
        >
          <div className="max-w-7xl mx-auto">{renderActiveModule()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
