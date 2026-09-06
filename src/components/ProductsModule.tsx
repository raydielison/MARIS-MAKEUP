import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Brand, ProductCategory } from '../types.ts';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  DollarSign,
  Percent,
  X,
  Eye,
  Tag,
  QrCode,
  RefreshCw,
  Barcode,
  MapPin,
  Calendar
} from 'lucide-react';

export const ProductsModule: React.FC = () => {
  const { isAdmin, isVendedor } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    categoryName: '',
    brandId: '',
    categoryId: '',
    boxSku: '',
    storeIdCode: '',
    individualCode: '',
    sku: '',
    barcode: '',
    shade: '',
    hexColor: '#e11d48',
    costPrice: 0,
    sellPrice: 0,
    purchaseLocation: '',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minStock: 5,
    unit: 'UN',
    description: '',
    initialStock: 1,
    batchNumber: 'LOTE-001',
  });

  const generateIndividualId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `MR-${randomNum}`;
  };

  const getValidHexForPicker = (color: string) => {
    if (!color) return '#e11d48';
    let hex = color.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return hex;
    }
    if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return '#e11d48';
  };

  const formatHexColor = (color: string) => {
    if (!color) return '#e11d48';
    let clean = color.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    return clean.toUpperCase();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, brs, cats] = await Promise.all([
        api.getProducts(),
        api.getBrands(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setBrands(brs);
      setCategories(cats);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const openNewModal = () => {
    setEditingProduct(null);
    const newIndividualId = generateIndividualId();
    setFormData({
      name: '',
      brandName: '',
      categoryName: '',
      brandId: '',
      categoryId: '',
      boxSku: '',
      storeIdCode: newIndividualId,
      individualCode: newIndividualId,
      sku: '',
      barcode: '',
      shade: '',
      hexColor: '#d97706',
      costPrice: 20,
      sellPrice: 45,
      purchaseLocation: '',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minStock: 5,
      unit: 'UN',
      description: '',
      initialStock: 1,
      batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const storeId = product.storeIdCode || product.individualCode || product.barcode || generateIndividualId();
    const brandObj = brands.find((b) => b.id === product.brandId);
    const catObj = categories.find((c) => c.id === product.categoryId);
    setFormData({
      name: product.name,
      brandName: product.brandName || brandObj?.name || '',
      categoryName: product.categoryName || catObj?.name || '',
      brandId: product.brandId || '',
      categoryId: product.categoryId || '',
      boxSku: product.boxSku || product.sku || '',
      storeIdCode: storeId,
      individualCode: storeId,
      sku: product.boxSku || product.sku || '',
      barcode: product.barcode || '',
      shade: product.shade || '',
      hexColor: product.hexColor || '#e11d48',
      costPrice: product.costPrice || 0,
      sellPrice: product.sellPrice,
      purchaseLocation: product.purchaseLocation || '',
      expiryDate: product.expiryDate || (product.batches && product.batches[0]?.expiryDate) || '',
      minStock: product.minStock,
      unit: product.unit || 'UN',
      description: product.description || '',
      initialStock: 0,
      batchNumber: '',
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }
    if (!formData.brandName.trim()) {
      alert('Por favor, digite a Marca do produto.');
      return;
    }
    if (!formData.categoryName.trim()) {
      alert('Por favor, digite a Categoria do produto.');
      return;
    }
    if (!formData.boxSku.trim()) {
      alert('Por favor, informe o Número SKU da Caixa (Embalagem de Fábrica / Fornecedor).');
      return;
    }
    const storeIdClean = (formData.storeIdCode || formData.individualCode).trim();
    if (!storeIdClean) {
      alert('Por favor, informe ou gere o Número ID da Loja para venda.');
      return;
    }
    const sellPriceNum = Number(String(formData.sellPrice).replace(',', '.')) || 0;
    const costPriceNum = Number(String(formData.costPrice).replace(',', '.')) || 0;

    if (!sellPriceNum || sellPriceNum <= 0) {
      alert('Por favor, informe um Preço de Venda válido (maior que zero).');
      return;
    }
    if (!formData.expiryDate) {
      alert('Por favor, selecione a Data de Validade do produto.');
      return;
    }

    try {
      const boxSkuClean = formData.boxSku.trim();
      const barcodeClean = formData.barcode.trim() || storeIdClean;
      const purchaseLocationClean = formData.purchaseLocation.trim();
      const expiryClean = formData.expiryDate.trim();
      const brandNameClean = formData.brandName.trim();
      const categoryNameClean = formData.categoryName.trim();
      const hexColorClean = formatHexColor(formData.hexColor);

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          brandName: brandNameClean,
          categoryName: categoryNameClean,
          brandId: formData.brandId,
          categoryId: formData.categoryId,
          boxSku: boxSkuClean,
          storeIdCode: storeIdClean,
          individualCode: storeIdClean,
          sku: boxSkuClean,
          barcode: barcodeClean,
          shade: formData.shade,
          hexColor: hexColorClean,
          costPrice: costPriceNum,
          sellPrice: sellPriceNum,
          purchaseLocation: purchaseLocationClean,
          expiryDate: expiryClean,
          minStock: Number(formData.minStock) || 5,
          unit: formData.unit,
          description: formData.description,
        });
      } else {
        await api.createProduct({
          ...formData,
          name: formData.name.trim(),
          brandName: brandNameClean,
          categoryName: categoryNameClean,
          boxSku: boxSkuClean,
          storeIdCode: storeIdClean,
          individualCode: storeIdClean,
          sku: boxSkuClean,
          barcode: barcodeClean,
          hexColor: hexColorClean,
          costPrice: costPriceNum,
          sellPrice: sellPriceNum,
          purchaseLocation: purchaseLocationClean,
          expiryDate: expiryClean,
          minStock: Number(formData.minStock) || 5,
          initialStock: Number(formData.initialStock) || 0,
        });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja inativar/remover o produto "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto');
    }
  };

  // Map total available units per SKU for accurate stock replenishment monitoring
  const skuTotalStockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.active) continue;
      const key = (p.boxSku || p.sku || '').trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + (p.currentStock || 0));
    }
    return map;
  }, [products]);

  // Filtered list - Grouped by SKU in the exact same sequence, then ordered by Store ID
  const filtered = products
    .filter((p) => {
      if (!p.active) return false;
      const q = search.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.boxSku && p.boxSku.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.storeIdCode && p.storeIdCode.toLowerCase().includes(q)) ||
        (p.individualCode && p.individualCode.toLowerCase().includes(q)) ||
        p.barcode.includes(q) ||
        (p.shade && p.shade.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        (p.purchaseLocation && p.purchaseLocation.toLowerCase().includes(q));

      const matchBrand = selectedBrand === 'all' || p.brandId === selectedBrand;
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

      const skuKey = (p.boxSku || p.sku || '').trim().toLowerCase();
      const skuTotal = skuTotalStockMap.get(skuKey) ?? p.currentStock;

      let matchStock = true;
      if (stockFilter === 'low') matchStock = skuTotal > 0 && skuTotal <= p.minStock;
      if (stockFilter === 'out') matchStock = p.currentStock <= 0;
      if (stockFilter === 'ok') matchStock = skuTotal > p.minStock;
      if (stockFilter === 'replenish') matchStock = skuTotal <= p.minStock;

      return matchQ && matchBrand && matchCategory && matchStock;
    })
    .sort((a, b) => {
      // Group by SKU first in same sequence
      const skuA = (a.boxSku || a.sku || '').toLowerCase();
      const skuB = (b.boxSku || b.sku || '').toLowerCase();
      if (skuA !== skuB) {
        return skuA.localeCompare(skuB);
      }
      // Then sequence by ID Loja
      const idA = (a.storeIdCode || a.individualCode || '').toLowerCase();
      const idB = (b.storeIdCode || b.individualCode || '').toLowerCase();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const lowStockCount = products.filter((p) => {
    if (!p.active) return false;
    const skuKey = (p.boxSku || p.sku || '').trim().toLowerCase();
    const skuTotal = skuTotalStockMap.get(skuKey) ?? p.currentStock;
    return skuTotal <= p.minStock;
  }).length;

  // Calculate margin previews
  const marginProfit = formData.sellPrice - formData.costPrice;
  const marginPercent =
    formData.costPrice > 0 ? ((marginProfit / formData.costPrice) * 100).toFixed(1) : '100';

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Cosméticos & Maquiagem</h1>
            <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-2 py-0.5 rounded-full border border-pink-200">
              {filtered.length} itens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie tonalidades, marcas, SKU da caixa, código individual de venda e estoque mínimo para reposição.
          </p>
        </div>

        <button
          id="btn-new-product"
          onClick={openNewModal}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-2 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Low Stock Replenishment Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-950">
                Aviso de Reposição de Estoque ({lowStockCount} produto{lowStockCount > 1 ? 's' : ''} em baixa)
              </h2>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Existem itens que atingiram ou estão abaixo do estoque mínimo. Consulte o SKU da caixa para solicitar nova remessa com o fornecedor.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStockFilter(stockFilter === 'replenish' ? 'all' : 'replenish')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center space-x-1.5 ${
              stockFilter === 'replenish'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{stockFilter === 'replenish' ? 'Mostrar Todos os Produtos' : 'Filtrar Itens para Reposição'}</span>
          </button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-product-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU da Caixa, Código ID, nome..."
            className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Brand */}
        <select
          id="filter-product-brand"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todas as Marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          id="filter-product-category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Status */}
        <select
          id="filter-product-stock"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
        >
          <option value="all">Todos os Estoques</option>
          <option value="replenish">⚠️ Reposição Necessária (Baixo/Esgotado)</option>
          <option value="low">Estoque Baixo (Alerta)</option>
          <option value="out">Sem Estoque (Esgotado)</option>
          <option value="ok">Estoque Normal</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Produto & Tonalidade</th>
                <th className="px-3 py-3">Marca / Categoria</th>
                <th className="px-3 py-3">SKU Caixa / ID Venda</th>
                <th className="px-3 py-3">Estoque & Reposição</th>
                {isAdmin && <th className="px-3 py-3">Custo Unit.</th>}
                <th className="px-3 py-3">Preço Venda</th>
                {isAdmin && <th className="px-3 py-3">Margem / Lucro</th>}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => {
                const skuKey = (prod.boxSku || prod.sku || '').trim().toLowerCase();
                const totalSkuStock = skuTotalStockMap.get(skuKey) ?? prod.currentStock;
                const isOut = prod.currentStock <= 0;
                const isLow = totalSkuStock > 0 && totalSkuStock <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition group">
                    {/* Name + Swatch */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={prod.photo || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                          {prod.hexColor && (
                            <div
                              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl border-t border-l border-white shadow-xs"
                              style={{ backgroundColor: prod.hexColor }}
                              title={`Cor: ${prod.shade || 'Padrão'}`}
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-pink-600 transition">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                            {prod.shade ? (
                              <span className="flex items-center space-x-1">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: prod.hexColor || '#e11d48' }}
                                />
                                <span>Cor: {prod.shade}</span>
                              </span>
                            ) : (
                              <span>Sem variação</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Brand / Category */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{prod.brandName}</div>
                      <div className="text-[11px] text-slate-500">{prod.categoryName}</div>
                    </td>

                    {/* SKU da Caixa, ID da Loja, Local de Compra & Validade */}
                    <td className="px-3 py-3 text-[11px]">
                      <div className="flex items-center space-x-1 font-mono">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200" title="Número SKU que veio na caixa do fornecedor">
                          Cx: {prod.boxSku || prod.sku}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 font-mono mt-1">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded border border-pink-200" title="Número ID da Loja para venda">
                          ID Loja: {prod.storeIdCode || prod.individualCode || prod.barcode}
                        </span>
                      </div>
                      {prod.purchaseLocation && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1" title="Local de Compra">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{prod.purchaseLocation}</span>
                        </div>
                      )}
                      {prod.expiryDate && (
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1" title="Data de Validade">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Val: {new Date(prod.expiryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </td>

                    {/* Stock & Replenishment Alert */}
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded-md border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                        {totalSkuStock > 1 && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Total de unidades cadastradas neste SKU">
                            Total SKU: {totalSkuStock}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-medium mt-1">
                        {isOut ? (
                          <span className="text-red-600 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 inline shrink-0" />
                            <span>Esgotado (Repor Já)</span>
                          </span>
                        ) : isLow ? (
                          <span className="text-amber-600 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 inline shrink-0" />
                            <span>Reposição Baixa (Mín: {prod.minStock})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Mínimo: {prod.minStock}</span>
                        )}
                      </div>
                    </td>

                    {/* Cost (Admin Only) */}
                    {isAdmin && (
                      <td className="px-3 py-3 text-slate-600 font-mono">
                        {formatCurrency(prod.costPrice)}
                      </td>
                    )}

                    {/* Sell Price */}
                    <td className="px-3 py-3 font-bold text-slate-900 text-sm">
                      {formatCurrency(prod.sellPrice)}
                    </td>

                    {/* Margin (Admin Only) */}
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="text-emerald-600 font-semibold text-xs">
                          {formatCurrency(prod.sellPrice - (prod.costPrice || 0))}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {prod.profitMargin ? `${prod.profitMargin.toFixed(1)}% margem` : '—'}
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`btn-edit-prod-${prod.id}`}
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            id={`btn-del-prod-${prod.id}`}
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        {products.length === 0 ? 'Nenhum produto cadastrado ainda' : 'Nenhum produto encontrado'}
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {products.length === 0
                          ? 'A base de dados está limpa. Comece cadastrando seus cosméticos e maquiagens reais com códigos de barras, marcas e tonalidades.'
                          : 'Tente ajustar os filtros de busca, marca ou status de estoque.'}
                      </p>
                      {products.length === 0 && (
                        <button
                          type="button"
                          onClick={openNewModal}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-2 transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Primeiro Produto</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Produto de Maquiagem' : 'Cadastrar Novo Produto de Maquiagem'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-700 font-semibold block mb-1">Nome do Produto *</label>
                <input
                  id="input-product-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Base Líquida Matte Velvet HD"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Marca *
                </label>
                <input
                  id="input-product-brand"
                  type="text"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Ex: Boca Rosa, Bruna Tavares, Ruby Rose..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Categoria *
                </label>
                <input
                  id="input-product-category"
                  type="text"
                  required
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  placeholder="Ex: Batom, Base Líquida, Rímel, Iluminador..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Shade & Hex Color */}
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Cor / Tonalidade (Ex: Cor 02, Bege Médio, Nude)
                </label>
                <input
                  id="input-product-shade"
                  type="text"
                  value={formData.shade}
                  onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
                  placeholder="Ex: Tom 2.5 Warm"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Amostra de Cor (Paleta / Identificador HEX)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="input-product-hexcolor"
                    type="color"
                    value={getValidHexForPicker(formData.hexColor)}
                    onChange={(e) => setFormData({ ...formData, hexColor: e.target.value.toUpperCase() })}
                    className="w-9 h-9 rounded-md border border-slate-300 bg-white cursor-pointer p-0.5 flex-shrink-0"
                    title="Clique para abrir a paleta visual de cores"
                  />
                  <div className="relative flex-1">
                    <input
                      id="input-product-hexcolor-code"
                      type="text"
                      value={formData.hexColor}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val && !val.startsWith('#') && /^[0-9A-Fa-f]{1,6}$/.test(val)) {
                          val = `#${val}`;
                        }
                        setFormData({ ...formData, hexColor: val });
                      }}
                      placeholder="Ex: #f40606 ou f40606"
                      maxLength={9}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-pink-500"
                      title="Digite o identificador ou código da cor (ex: #f40606)"
                    />
                  </div>
                </div>

                {/* Atalhos rápidos de cores frequentes de cosméticos */}
                <div className="flex items-center space-x-1.5 mt-1.5 pt-0.5 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mr-0.5">Atalhos:</span>
                  {[
                    { label: 'Vermelho', hex: '#F40606' },
                    { label: 'Vinho', hex: '#881337' },
                    { label: 'Nude Rosado', hex: '#E29578' },
                    { label: 'Rosa Pink', hex: '#F43F5E' },
                    { label: 'Coral', hex: '#FB7185' },
                    { label: 'Marrom Intenso', hex: '#78350F' },
                    { label: 'Bege Claro', hex: '#F5D0B5' },
                    { label: 'Bege Médio', hex: '#D97706' },
                    { label: 'Preto', hex: '#1E293B' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, hexColor: preset.hex })}
                      title={`${preset.label} (${preset.hex})`}
                      className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer flex-shrink-0 ${
                        formData.hexColor.toUpperCase() === preset.hex.toUpperCase()
                          ? 'ring-2 ring-pink-500 ring-offset-1 border-white scale-110'
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Box SKU, Store ID Code, and Barcode Card */}
              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <Package className="w-4 h-4 text-pink-600" />
                  <span>Identificação: SKU da Caixa & Número ID da Loja</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* SKU da Caixa */}
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Número SKU da Caixa (Embalagem / Fornecedor) *
                    </label>
                    <input
                      id="input-product-box-sku"
                      type="text"
                      required
                      value={formData.boxSku}
                      onChange={(e) => setFormData({ ...formData, boxSku: e.target.value, sku: e.target.value })}
                      placeholder="Ex: CX-BR-4029 ou LOTE-CX-881"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Mesmo código SKU impresso na caixa ou fardo que veio do fornecedor. Usado para reposição.
                    </p>
                  </div>

                  {/* Número ID da Loja */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-700 font-semibold">
                        Número ID da Loja (Para Venda & Bipagem) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = generateIndividualId();
                          setFormData((prev) => ({ ...prev, storeIdCode: newId, individualCode: newId }));
                        }}
                        className="text-[11px] text-pink-600 hover:text-pink-700 font-semibold flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Gerar ID</span>
                      </button>
                    </div>
                    <input
                      id="input-product-individual-code"
                      type="text"
                      required
                      value={formData.storeIdCode || formData.individualCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storeIdCode: e.target.value,
                          individualCode: e.target.value,
                        })
                      }
                      placeholder="Ex: MR-849102"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Código individual exclusivo para venda rápida, etiqueta e bipagem no PDV.
                    </p>
                  </div>

                  {/* Código de Barras EAN Opcional */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Código de Barras EAN-13 (Opcional)
                    </label>
                    <input
                      id="input-product-barcode"
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Ex: 7891234567890 (opcional)"
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preços e Local de Compra */}
              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Preços & Local de Compra</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Preço de Compra */}
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Preço de Compra (Custo Unitário R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-500 pointer-events-none select-none">
                        R$
                      </span>
                      <input
                        id="input-product-cost"
                        type="text"
                        inputMode="decimal"
                        required
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Custo pago por unidade na aquisição da mercadoria.
                    </p>
                  </div>

                  {/* Preço de Venda */}
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Preço de Venda (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-pink-600 pointer-events-none select-none">
                        R$
                      </span>
                      <input
                        id="input-product-sell"
                        type="text"
                        inputMode="decimal"
                        required
                        value={formData.sellPrice}
                        onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Preço final cobrado do cliente no balcão / PDV.
                    </p>
                  </div>

                  {/* Local de Compra */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Local de Compra (Fornecedor / Distribuidora / Loja) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="input-product-purchase-location"
                        type="text"
                        value={formData.purchaseLocation}
                        onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value })}
                        placeholder="Ex: Distribuidora 25 de Março - SP, Atacadão Beleza Viva, Importadora Central"
                        className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Informe onde foi adquirida esta mercadoria para controle de reposição e fornecimento.
                    </p>
                  </div>
                </div>

                {/* Profit & Margin Preview for Admin */}
                {isAdmin && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Lucro Bruto Unitário:{' '}
                      <strong className="text-emerald-600 text-sm font-bold ml-1">
                        {formatCurrency(marginProfit)}
                      </strong>
                    </div>
                    <div className="text-xs text-slate-600">
                      Margem sobre Compra:{' '}
                      <strong className="text-emerald-600 text-sm font-bold ml-1">{marginPercent}%</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Data de Validade & Estoque */}
              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  <span>Data de Validade & Parâmetros de Estoque</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  {/* Data de Validade (Sem exceção, sempre presente no cadastro) */}
                  <div className="sm:col-span-1">
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Data de Validade *
                    </label>
                    <input
                      id="input-product-expiry-date"
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Data limite de validade recomendada pelo fabricante.
                    </p>
                  </div>

                  {/* Estoque Mínimo */}
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">
                      Estoque Mínimo de Alerta
                    </label>
                    <input
                      id="input-product-minstock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Avisa quando estiver em baixa para reposição.
                    </p>
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label className="text-xs text-slate-700 font-semibold block mb-1">Unidade de Medida</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    >
                      <option value="UN">Unidade (UN)</option>
                      <option value="KIT">Kit / Conjunto</option>
                      <option value="CX">Caixa (CX)</option>
                      <option value="ML">Mililitros (ML)</option>
                    </select>
                  </div>
                </div>

                {/* Batch Number & Initial Stock if creating new product */}
                {!editingProduct && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-medium">
                        Qtd Inicial em Estoque
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.initialStock}
                        onChange={(e) =>
                          setFormData({ ...formData, initialStock: Number(e.target.value) || 0 })
                        }
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                      {formData.initialStock > 1 ? (
                        <p className="text-[10px] text-pink-700 bg-pink-50 border border-pink-200 rounded p-1.5 mt-1 leading-tight font-medium">
                          Serão gerados {formData.initialStock} cadastros individuais de 1 UN cada, com ID Loja sequencial ({formData.storeIdCode || 'MR-...'}...) agrupados pelo mesmo SKU da caixa.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Cada unidade fica registrada com 1 UN e ID Loja próprio.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-medium">
                        Número do Lote da Caixa
                      </label>
                      <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-product"
                type="submit"
                className="px-5 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
