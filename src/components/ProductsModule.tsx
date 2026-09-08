import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Brand, ProductCategory, KitItem } from '../types.ts';
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
  Calendar,
  Boxes,
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
  const [viewKitProduct, setViewKitProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productType: 'UNIDADE' as 'UNIDADE' | 'KIT',
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
    kitItemCount: 2,
    kitItems: [
      {
        id: '1',
        name: '',
        sku: '',
        batchNumber: 'LT-01',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        brandName: '',
        barcode: '',
        shade: '',
      },
      {
        id: '2',
        name: '',
        sku: '',
        batchNumber: 'LT-02',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        brandName: '',
        barcode: '',
        shade: '',
      },
    ] as KitItem[],
  });

  const generateIndividualId = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return String(randomNum);
  };

  const updateKitItemCount = (count: number) => {
    const validCount = Math.max(2, Math.min(30, count));
    setFormData((prev) => {
      const currentItems = [...(prev.kitItems || [])];
      if (currentItems.length < validCount) {
        for (let i = currentItems.length; i < validCount; i++) {
          currentItems.push({
            id: String(i + 1),
            name: '',
            sku: '',
            batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
            expiryDate: prev.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            brandName: prev.brandName || '',
            barcode: '',
            shade: '',
          });
        }
      } else if (currentItems.length > validCount) {
        currentItems.length = validCount;
      }
      return {
        ...prev,
        kitItemCount: validCount,
        kitItems: currentItems,
      };
    });
  };

  const handleKitItemChange = (index: number, field: keyof KitItem, value: string) => {
    setFormData((prev) => {
      const items = [...(prev.kitItems || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, kitItems: items };
    });
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
    const defaultExp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      productType: 'UNIDADE',
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
      expiryDate: defaultExp,
      minStock: 5,
      unit: 'UN',
      description: '',
      initialStock: 1,
      batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
      kitItemCount: 2,
      kitItems: [
        {
          id: '1',
          name: '',
          sku: '',
          batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: defaultExp,
          brandName: '',
          barcode: '',
          shade: '',
        },
        {
          id: '2',
          name: '',
          sku: '',
          batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: defaultExp,
          brandName: '',
          barcode: '',
          shade: '',
        },
      ],
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const storeId = product.storeIdCode || product.individualCode || product.barcode || generateIndividualId();
    const brandObj = brands.find((b) => b.id === product.brandId);
    const catObj = categories.find((c) => c.id === product.categoryId);
    const isKit =
      product.productType === 'KIT' ||
      product.unit === 'KIT' ||
      (!!product.kitItems && product.kitItems.length > 0);
    const defaultExp =
      product.expiryDate || (product.batches && product.batches[0]?.expiryDate) || '';

    const existingKitItems: KitItem[] =
      product.kitItems && product.kitItems.length > 0
        ? product.kitItems
        : [
            {
              id: '1',
              name: '',
              sku: '',
              batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
              expiryDate: defaultExp || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              brandName: product.brandName || '',
              barcode: '',
              shade: '',
            },
            {
              id: '2',
              name: '',
              sku: '',
              batchNumber: `LT-${Math.floor(100 + Math.random() * 900)}`,
              expiryDate: defaultExp || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              brandName: product.brandName || '',
              barcode: '',
              shade: '',
            },
          ];

    setFormData({
      productType: isKit ? 'KIT' : 'UNIDADE',
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
      expiryDate: defaultExp,
      minStock: product.minStock,
      unit: product.unit || (isKit ? 'KIT' : 'UN'),
      description: product.description || '',
      initialStock: 1,
      batchNumber: (product.batches && product.batches[0]?.batchNumber) || `LT-${Math.floor(100 + Math.random() * 900)}`,
      kitItemCount: product.kitItemCount || existingKitItems.length,
      kitItems: existingKitItems,
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const isKit = formData.productType === 'KIT';
    const storeIdClean = (formData.storeIdCode || formData.individualCode).trim();

    if (!storeIdClean) {
      alert('Por favor, informe ou gere o Número ID da Loja (5 números aleatórios) para venda única.');
      return;
    }

    const sellPriceNum = Number(String(formData.sellPrice).replace(',', '.')) || 0;
    const costPriceNum = Number(String(formData.costPrice).replace(',', '.')) || 0;

    if (!sellPriceNum || sellPriceNum <= 0) {
      alert('Por favor, informe um Preço de Venda válido (maior que zero).');
      return;
    }

    if (isKit) {
      if (!formData.name.trim()) {
        alert('Por favor, informe o Nome do Kit / Conjunto.');
        return;
      }
      if (!formData.categoryName.trim()) {
        alert('Por favor, digite a Categoria do Kit.');
        return;
      }
      // Validate individual kit items
      for (let i = 0; i < formData.kitItems.length; i++) {
        const item = formData.kitItems[i];
        if (!item.name?.trim()) {
          alert(`Por favor, preencha o Nome do Item ${i + 1} do Kit.`);
          return;
        }
        if (!item.sku?.trim()) {
          alert(`Por favor, preencha o SKU do Item ${i + 1} do Kit.`);
          return;
        }
        if (!item.batchNumber?.trim()) {
          alert(`Por favor, preencha o Lote do Item ${i + 1} do Kit.`);
          return;
        }
        if (!item.expiryDate?.trim()) {
          alert(`Por favor, selecione a Data de Validade do Item ${i + 1} do Kit.`);
          return;
        }
        if (!item.brandName?.trim()) {
          alert(`Por favor, preencha a Marca do Item ${i + 1} do Kit.`);
          return;
        }
      }
    } else {
      // Unidade
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
      if (!formData.expiryDate) {
        alert('Por favor, selecione a Data de Validade do produto.');
        return;
      }
    }

    try {
      const boxSkuClean = (formData.boxSku || (isKit ? `KIT-${storeIdClean}` : `CX-${storeIdClean}`)).trim();
      const barcodeClean = formData.barcode.trim() || storeIdClean;
      const purchaseLocationClean = formData.purchaseLocation.trim();
      const expiryClean = (formData.expiryDate || (isKit && formData.kitItems[0]?.expiryDate) || '').trim();
      const brandNameClean = (formData.brandName || (isKit ? (formData.kitItems[0]?.brandName || 'Kit') : '')).trim();
      const categoryNameClean = formData.categoryName.trim() || (isKit ? 'Kits & Conjuntos' : 'Maquiagem');
      const hexColorClean = formatHexColor(formData.hexColor);

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          productType: formData.productType,
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
          minStock: Number(formData.minStock) || (isKit ? 2 : 5),
          unit: isKit ? 'KIT' : 'UN',
          description: formData.description,
          kitItems: isKit ? formData.kitItems : undefined,
          kitItemCount: isKit ? formData.kitItems.length : undefined,
        });
      } else {
        await api.createProduct({
          ...formData,
          productType: formData.productType,
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
          minStock: Number(formData.minStock) || (isKit ? 2 : 5),
          initialStock: 1, // Estoque é único para unidade e único para kit
          unit: isKit ? 'KIT' : 'UN',
          kitItems: isKit ? formData.kitItems : undefined,
          kitItemCount: isKit ? formData.kitItems.length : undefined,
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
                          <div className="font-bold text-slate-900 group-hover:text-pink-600 transition flex items-center space-x-1.5 flex-wrap">
                            <span>{prod.name}</span>
                            {prod.productType === 'KIT' && (
                              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                KIT ({prod.kitItemCount || (prod.kitItems && prod.kitItems.length) || 0} itens)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 flex-wrap gap-1">
                            {prod.productType === 'KIT' && prod.kitItems && prod.kitItems.length > 0 ? (
                              <div className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-0.5 flex flex-wrap gap-1">
                                {prod.kitItems.map((ki, kIdx) => (
                                  <span key={ki.id || kIdx} className="font-medium">
                                    {ki.name} ({ki.sku}){kIdx < (prod.kitItems?.length ?? 0) - 1 ? ' • ' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : prod.shade ? (
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CAIXA DE PARÂMETROS DO ESTOQUE NO TOPO (Seleção exclusiva de Unidade vs Kit/Conjunto) */}
            <div className="p-4 bg-pink-50/70 rounded-xl border-2 border-pink-300 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-pink-200">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Boxes className="w-4 h-4 text-pink-600" />
                  <span>Caixa de Parâmetros do Estoque & Tipo de Produto *</span>
                </div>
                <span className="text-[10px] font-semibold text-pink-700 uppercase tracking-wider bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">
                  Seleção Exclusiva
                </span>
              </div>

              {/* Seletor Exclusivo: Unidade ou Kit/Conjunto */}
              <div>
                <label className="text-xs text-slate-800 font-bold block mb-1.5">
                  Selecione exclusivamente a modalidade de estoque:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        productType: 'UNIDADE',
                        unit: 'UN',
                        initialStock: 1,
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition flex items-start space-x-3 cursor-pointer ${
                      formData.productType === 'UNIDADE'
                        ? 'border-pink-500 bg-white ring-2 ring-pink-400/30 shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        formData.productType === 'UNIDADE'
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.productType === 'UNIDADE' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>Unidade</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                          Estoque Único (1 UN)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ao selecionar unidade, o estoque é único para a venda.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        productType: 'KIT',
                        unit: 'KIT',
                        initialStock: 1,
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition flex items-start space-x-3 cursor-pointer ${
                      formData.productType === 'KIT'
                        ? 'border-pink-500 bg-white ring-2 ring-pink-400/30 shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        formData.productType === 'KIT'
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.productType === 'KIT' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>Kit / Conjunto</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                          Quantidade Multi-Itens
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        O estoque deve ter sua quantidade escrita, detalhando cada item.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Parâmetros imediatos conforme o tipo */}
              {formData.productType === 'UNIDADE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-pink-200">
                  <div>
                    <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                      Controle do Estoque
                    </label>
                    <div className="px-3 py-2 bg-white rounded-md border border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Estoque Único</span>
                      <span className="text-emerald-700 font-mono">1 UNIDADE</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Estoque unitário fixo por registro.</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                      Data de Validade *
                    </label>
                    <input
                      id="input-product-expiry-date"
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                      Estoque Mínimo de Alerta
                    </label>
                    <input
                      id="input-product-minstock"
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 border-t border-pink-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Campo onde se escreve a quantidade do Kit */}
                    <div>
                      <label className="text-[11px] text-purple-950 font-bold block mb-1">
                        Quantidade de Itens no Kit/Conjunto *
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="input-kit-item-count"
                          type="number"
                          min="2"
                          max="30"
                          required
                          value={formData.kitItemCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              updateKitItemCount(val);
                            }
                          }}
                          className="w-full bg-white border-2 border-purple-400 rounded-md px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                        />
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">itens</span>
                      </div>
                      <p className="text-[10px] text-purple-700 font-medium mt-1">
                        Escreva a quantidade para gerar os campos abaixo.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                        Estoque da Venda
                      </label>
                      <div className="px-3 py-2 bg-white rounded-md border border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Conjunto Fechado</span>
                        <span className="text-purple-700 font-mono">1 KIT</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Venda agrupada no PDV.</p>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-700 font-semibold block mb-1">
                        Estoque Mínimo de Alerta
                      </label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ID DA LOJA (ÚNICO PARA A VENDA SER ÚNICA - 5 NÚMEROS ALEATÓRIOS) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-pink-600" />
                  <label className="text-xs text-slate-800 font-bold">
                    ID da Loja (O ID da loja será único para a venda ser única) *
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = generateIndividualId();
                    setFormData((prev) => ({ ...prev, storeIdCode: newId, individualCode: newId }));
                  }}
                  className="text-[11px] text-pink-600 hover:text-pink-700 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Gerar 5 Números Aleatórios</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    id="input-product-storeid"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    required
                    value={formData.storeIdCode || formData.individualCode}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setFormData({
                        ...formData,
                        storeIdCode: numericOnly,
                        individualCode: numericOnly,
                      });
                    }}
                    placeholder="Ex: 77926"
                    className="w-full bg-white border-2 border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 font-mono tracking-widest font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Exatamente 5 números aleatórios. Usado para bipar e registrar a venda única no caixa/PDV.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800 mb-0.5">Venda Única no PDV</div>
                  {formData.productType === 'KIT' ? (
                    <span className="text-purple-700">
                      O kit com todos os {formData.kitItemCount} itens cadastrados terá este ID único{' '}
                      <strong>{formData.storeIdCode || '00000'}</strong> para a venda ser realizada como uma só.
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      O produto individual terá o ID único <strong>{formData.storeIdCode || '00000'}</strong>{' '}
                      para bipagem e baixa imediata no estoque.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CONDICIONAL: CAMPOS SE FOR KIT / CONJUNTO */}
            {formData.productType === 'KIT' ? (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Boxes className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-900">
                      Itens do Kit / Conjunto (Escreva os dados para cada um dos {formData.kitItems.length} itens)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                    Nome • SKU • Lote • Validade • Marca • Código de Barras
                  </span>
                </div>

                {/* Lista dinâmica de itens do Kit */}
                {formData.kitItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Item {index + 1} de {formData.kitItems.length} do Kit
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Identificação individual
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Nome do item */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Nome do Item *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleKitItemChange(index, 'name', e.target.value)}
                          placeholder={`Ex: ${index === 0 ? 'Batom Líquido Matte' : index === 1 ? 'Gloss Labial Brilho' : 'Rímel Volume'}`}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Marca do item */}
                      <div>
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Marca *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.brandName}
                          onChange={(e) => handleKitItemChange(index, 'brandName', e.target.value)}
                          placeholder="Ex: Boca Rosa, Ruby Rose..."
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* SKU do item */}
                      <div>
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          SKU do Item *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.sku}
                          onChange={(e) => handleKitItemChange(index, 'sku', e.target.value)}
                          placeholder="Ex: BAT-ROSA-01"
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Lote do item */}
                      <div>
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Lote *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.batchNumber}
                          onChange={(e) => handleKitItemChange(index, 'batchNumber', e.target.value)}
                          placeholder="Ex: LT-8842"
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Validade do item */}
                      <div>
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Data de Validade *
                        </label>
                        <input
                          type="date"
                          required
                          value={item.expiryDate}
                          onChange={(e) => handleKitItemChange(index, 'expiryDate', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Código de barras do item */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Código de Barras do Item
                        </label>
                        <input
                          type="text"
                          value={item.barcode || ''}
                          onChange={(e) => handleKitItemChange(index, 'barcode', e.target.value)}
                          placeholder="Ex: 7891234567890 (opcional)"
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {/* Cor / Tonalidade do item */}
                      <div>
                        <label className="text-[11px] text-slate-700 font-semibold block mb-0.5">
                          Cor / Tonalidade
                        </label>
                        <input
                          type="text"
                          value={item.shade || ''}
                          onChange={(e) => handleKitItemChange(index, 'shade', e.target.value)}
                          placeholder="Ex: Nude Suave"
                          className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Dados Gerais do Kit */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center space-x-2">
                    <Package className="w-4 h-4 text-pink-600" />
                    <span>Identificação e Descrição do Kit / Conjunto para Venda</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-700 font-semibold block mb-1">
                        Nome do Kit / Conjunto *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Kit Labial Perfeito Boca Rosa (Batom + Gloss + Lápis)"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold block mb-1">
                        Categoria do Kit *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.categoryName}
                        onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                        placeholder="Ex: Kits & Conjuntos, Presentes..."
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold block mb-1">
                        SKU da Caixa / Embalagem do Kit
                      </label>
                      <input
                        type="text"
                        value={formData.boxSku}
                        onChange={(e) => setFormData({ ...formData, boxSku: e.target.value, sku: e.target.value })}
                        placeholder="Ex: KIT-CX-001"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold block mb-1">
                        Código de Barras Externo do Kit (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Ex: 7890000000000"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold block mb-1">
                        Local de Compra / Fornecedor
                      </label>
                      <input
                        type="text"
                        value={formData.purchaseLocation}
                        onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value })}
                        placeholder="Ex: Atacado Beleza Central"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CONDICIONAL: CAMPOS SE FOR UNIDADE */
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
                </div>

                {/* Código de Barras EAN Opcional */}
                <div>
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
                </div>

                {/* Local de Compra */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Local de Compra / Fornecedor (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="input-product-purchase-location"
                      type="text"
                      value={formData.purchaseLocation}
                      onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value })}
                      placeholder="Ex: Distribuidora 25 de Março - SP, Atacadão Beleza Viva"
                      className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PREÇOS DE COMPRA E VENDA */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Preços de Compra & Venda</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Preço de Compra */}
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Preço de Compra (Custo Total R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-500 pointer-events-none select-none">
                      R$
                    </span>
                    <input
                      id="input-product-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-md pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.productType === 'KIT' ? 'Custo de compra do Kit completo.' : 'Custo unitário pago na mercadoria.'}
                  </p>
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    Preço de Venda (Final no Caixa R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-emerald-600 pointer-events-none select-none">
                      R$
                    </span>
                    <input
                      id="input-product-sell"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.sellPrice}
                      onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-md pl-10 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.productType === 'KIT' ? 'Preço único de venda do kit no PDV.' : 'Preço de venda ao consumidor.'}
                  </p>
                </div>
              </div>

              {/* Profit & Margin Preview for Admin */}
              {isAdmin && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Lucro Bruto: <strong className="text-emerald-600 text-sm font-bold ml-1">{formatCurrency(formData.sellPrice - formData.costPrice)}</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    Margem:{' '}
                    <strong className="text-emerald-600 text-sm font-bold ml-1">
                      {formData.costPrice > 0 ? (((formData.sellPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1) : '100'}%
                    </strong>
                  </div>
                </div>
              )}
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
