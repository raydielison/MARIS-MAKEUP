import React, { useState, useEffect } from 'react';
import { FinancialModule } from './FinancialModule.tsx';
import { ReportsModule } from './ReportsModule.tsx';
import { DollarSign, BarChart3 } from 'lucide-react';

interface FinancialReportsModuleProps {
  initialSubTab?: 'financial' | 'reports';
}

export const FinancialReportsModule: React.FC<FinancialReportsModuleProps> = ({
  initialSubTab = 'financial',
}) => {
  const [subTab, setSubTab] = useState<'financial' | 'reports'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Financeiro & Relatórios
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Módulo Unificado
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle de contas a pagar/receber, fluxo de caixa operacional, DRE e relatórios analíticos de vendas.
            </p>
          </div>

          {/* Subtabs Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80 self-start sm:self-auto">
            <button
              id="btn-subtab-financial"
              type="button"
              onClick={() => setSubTab('financial')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                subTab === 'financial'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Contas & Fluxo de Caixa</span>
            </button>

            <button
              id="btn-subtab-reports"
              type="button"
              onClick={() => setSubTab('reports')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                subTab === 'reports'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>DRE & Relatórios Gerenciais</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Subtab */}
      <div className="transition-all duration-200">
        {subTab === 'financial' && <FinancialModule />}
        {subTab === 'reports' && <ReportsModule />}
      </div>
    </div>
  );
};
