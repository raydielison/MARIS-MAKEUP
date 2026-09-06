import React, { useState, useEffect } from 'react';
import { ProductsModule } from './ProductsModule.tsx';
import { StockModule } from './StockModule.tsx';
import { ValidityModule } from './ValidityModule.tsx';
import { Sparkles, Boxes, ClockAlert, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.ts';

interface ProductsStockModuleProps {
  initialSubTab?: 'products' | 'stock' | 'validity';
}

export const ProductsStockModule: React.FC<ProductsStockModuleProps> = ({
  initialSubTab = 'products',
}) => {
  const [subTab, setSubTab] = useState<'products' | 'stock' | 'validity'>(initialSubTab);
  const [counts, setCounts] = useState<{ lowStock: number; expiredOrExpiring: number }>({
    lowStock: 0,
    expiredOrExpiring: 0,
  });

  // Keep subTab synced if initialSubTab prop changes (e.g. user clicked alert in header)
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Load badge indicators
  useEffect(() => {
    const fetchBadgeInfo = async () => {
      try {
        const [alerts, validity] = await Promise.all([
          api.getAlerts().catch(() => null),
          api.getValidity().catch(() => null),
        ]);
        const lowStock = alerts?.lowStock?.length || 0;
        const expired = validity?.summary?.expired || alerts?.expiredBatches?.length || 0;
        const expiring7 = validity?.summary?.expiring7Days || alerts?.expiringSoonBatches?.length || 0;
        setCounts({
          lowStock,
          expiredOrExpiring: expired + expiring7,
        });
      } catch (e) {
        // silent fallback
      }
    };
    fetchBadgeInfo();
  }, [subTab]);

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Produtos & Estoque
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                Módulo Unificado
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão centralizada de catálogo, controle de estoque físico e monitoramento de validade FEFO.
            </p>
          </div>

          {/* Subtabs Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80 self-start sm:self-auto">
            <button
              id="btn-subtab-products"
              type="button"
              onClick={() => setSubTab('products')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                subTab === 'products'
                  ? 'bg-white text-pink-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Catálogo de Produtos</span>
            </button>

            <button
              id="btn-subtab-stock"
              type="button"
              onClick={() => setSubTab('stock')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                subTab === 'stock'
                  ? 'bg-white text-pink-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Estoque & Movimentação</span>
              {counts.lowStock > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {counts.lowStock}
                </span>
              )}
            </button>

            <button
              id="btn-subtab-validity"
              type="button"
              onClick={() => setSubTab('validity')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                subTab === 'validity'
                  ? 'bg-white text-pink-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ClockAlert className="w-3.5 h-3.5" />
              <span>Validade & Lotes FEFO</span>
              {counts.expiredOrExpiring > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  {counts.expiredOrExpiring}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Subtab */}
      <div className="transition-all duration-200">
        {subTab === 'products' && <ProductsModule />}
        {subTab === 'stock' && <StockModule />}
        {subTab === 'validity' && <ValidityModule />}
      </div>
    </div>
  );
};
