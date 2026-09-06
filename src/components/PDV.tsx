import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Customer, Sale, PaymentMethod } from '../types.ts';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  QrCode,
  DollarSign,
  CreditCard,
  UserPlus,
  Printer,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Receipt,
  Instagram,
  Phone,
  Mail,
  X
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface PDVProps {
  onSaleCompleted?: (sale: Sale) => void;
  onNavigate?: (tab: string) => void;
}

export const PDV: React.FC<PDVProps> = ({ onSaleCompleted, onNavigate }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState<boolean>(false);
  const [showSearchCustomerModal, setShowSearchCustomerModal] = useState<boolean>(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Checkout form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [installments, setInstallments] = useState<number>(1);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Quick customer form state
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustInstagram, setNewCustInstagram] = useState<string>('');
  const [newCustCpf, setNewCustCpf] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, custs] = await Promise.all([api.getProducts(), api.getCustomers()]);
      setProducts(prods);
      setCustomers(custs);
    } catch (err) {
      console.error('Erro ao carregar dados do PDV:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filter products - Grouped by SKU in same sequence, then ordered by Store ID
  const filteredProducts = products
    .filter((p) => {
      if (!p.active) return false;
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.boxSku && p.boxSku.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.storeIdCode && p.storeIdCode.toLowerCase().includes(q)) ||
        (p.individualCode && p.individualCode.toLowerCase().includes(q)) ||
        p.barcode.includes(q) ||
        (p.shade && p.shade.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q));

      return matchCategory && matchQuery;
    })
    .sort((a, b) => {
      const skuA = (a.boxSku || a.sku || '').toLowerCase();
      const skuB = (b.boxSku || b.sku || '').toLowerCase();
      if (skuA !== skuB) {
        return skuA.localeCompare(skuB);
      }
      const idA = (a.storeIdCode || a.individualCode || '').toLowerCase();
      const idB = (b.storeIdCode || b.individualCode || '').toLowerCase();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // Exact match check prioritizing available stock not already full in cart
      const exactMatch =
        products.find(
          (p) =>
            p.active &&
            p.currentStock > 0 &&
            !cart.some((c) => c.product.id === p.id && c.quantity >= p.currentStock) &&
            ((p.storeIdCode && p.storeIdCode.toLowerCase() === q) ||
              (p.individualCode && p.individualCode.toLowerCase() === q) ||
              p.barcode.toLowerCase() === q ||
              (p.boxSku && p.boxSku.toLowerCase() === q) ||
              p.sku.toLowerCase() === q)
        ) ||
        products.find(
          (p) =>
            p.active &&
            ((p.storeIdCode && p.storeIdCode.toLowerCase() === q) ||
              (p.individualCode && p.individualCode.toLowerCase() === q) ||
              p.barcode.toLowerCase() === q ||
              (p.boxSku && p.boxSku.toLowerCase() === q) ||
              p.sku.toLowerCase() === q)
        );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        return;
      }

      // If only 1 product filtered, add it directly to cart
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
        return;
      }
    }
  };

  // Categories list for filter pills
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'cat_face', name: 'Pele & Rosto' },
    { id: 'cat_labios', name: 'Lábios' },
    { id: 'cat_olhos', name: 'Olhos' },
    { id: 'cat_skincare', name: 'Fixação' },
    { id: 'cat_acessorios', name: 'Acessórios' },
  ];

  // Cart Actions
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`O produto "${product.name}" está sem estoque disponível!`);
      return;
    }

    // Check if item is already in cart
    const existingIndex = cart.findIndex((i) => i.product.id === product.id);
    if (existingIndex >= 0) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.currentStock) {
        // Look for another unit of the same SKU that has available stock and isn't yet in cart
        const skuKey = (product.boxSku || product.sku || '').toLowerCase();
        const otherUnit = products.find(
          (p) =>
            p.active &&
            p.id !== product.id &&
            (p.boxSku || p.sku || '').toLowerCase() === skuKey &&
            p.currentStock > 0 &&
            !cart.some((c) => c.product.id === p.id)
        );
        if (otherUnit) {
          setCart([
            ...cart,
            {
              product: otherUnit,
              quantity: 1,
              discountValue: 0,
            },
          ]);
          return;
        }

        alert(`Estoque total disponível deste SKU "${product.name}" já foi adicionado ao carrinho!`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: product.sellPrice,
          discount: 0,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.product.currentStock) {
      alert(`Quantidade solicitada excede o estoque atual (${item.product.currentStock} un).`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Deseja limpar todos os itens do carrinho?')) {
      setCart([]);
      setSelectedCustomer(null);
      setGeneralDiscount(0);
      setNotes('');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity - item.discount, 0);
  const total = Math.max(0, subtotal - generalDiscount);

  // Quick Customer Register
  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const instagramClean = newCustInstagram.trim()
        ? `@${newCustInstagram.trim().replace(/^@/, '')}`
        : '';
      const created = await api.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        instagram: instagramClean,
        cpf: newCustCpf,
      });
      setCustomers([...customers, created]);
      setSelectedCustomer(created);
      setShowQuickCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustInstagram('');
      setNewCustCpf('');
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar cliente');
    }
  };

  // Filtered Customers for Search Modal (Searches Name, CPF, Email, Phone/WhatsApp, Instagram)
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchTerm.trim()) return true;
    const term = customerSearchTerm.trim().toLowerCase();
    const cleanDigitsTerm = term.replace(/\D/g, '');

    const nameMatch = c.name?.toLowerCase().includes(term);
    const emailMatch = c.email?.toLowerCase().includes(term);

    const cpfDigits = c.cpf ? c.cpf.replace(/\D/g, '') : '';
    const cpfMatch = (c.cpf && c.cpf.toLowerCase().includes(term)) || (cleanDigitsTerm.length > 0 && cpfDigits.includes(cleanDigitsTerm));

    const phoneDigits = c.phone ? c.phone.replace(/\D/g, '') : '';
    const whatsappDigits = c.whatsapp ? c.whatsapp.replace(/\D/g, '') : '';
    const phoneMatch = (c.phone && c.phone.toLowerCase().includes(term)) || (cleanDigitsTerm.length > 0 && phoneDigits.includes(cleanDigitsTerm));
    const whatsappMatch = (c.whatsapp && c.whatsapp.toLowerCase().includes(term)) || (cleanDigitsTerm.length > 0 && whatsappDigits.includes(cleanDigitsTerm));

    const instagramMatch = c.instagram?.toLowerCase().includes(term);

    return nameMatch || cpfMatch || emailMatch || phoneMatch || whatsappMatch || instagramMatch;
  });

  // Finalize Sale
  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setErrorMessage('');

    try {
      const receivedNum = Number(amountReceived.replace(',', '.')) || total;

      const payload = {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || 'Cliente Balcão',
        discount: generalDiscount,
        paymentMethod,
        installments: paymentMethod === 'PARCELADO' ? installments : 1,
        amountPaid: receivedNum,
        notes,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
      };

      const sale = await api.createSale(payload);

      // Refresh product list with updated stock
      loadInitialData();

      // Reset cart
      setCart([]);
      setSelectedCustomer(null);
      setGeneralDiscount(0);
      setNotes('');
      setShowCheckoutModal(false);

      // Open receipt modal
      setCompletedSale(sale);
      setShowReceiptModal(true);

      if (onSaleCompleted) {
        onSaleCompleted(sale);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar venda no PDV.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate change for Cash payment
  const changeValue = Math.max(
    0,
    (Number(amountReceived.replace(',', '.')) || total) - total
  );

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-5">
      {/* LEFT PANE: Product Search & Catalog */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-xs overflow-hidden">
        {/* Search Bar with Barcode Scanner hint */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              id="input-pdv-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por SKU da Caixa, Código ID Individual, nome ou bipar leitor..."
              className="w-full bg-white border border-slate-300 rounded-md pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            onClick={() => searchInputRef.current?.focus()}
            className="px-3.5 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Pronto para leitor óptico de código de barras"
          >
            <QrCode className="w-4 h-4 text-pink-600" />
            <span className="hidden sm:inline">Leitor Ativo</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 scrollbar-thin">
          {filteredProducts.map((p) => {
            const hasStock = p.currentStock > 0;
            const isLowStock = hasStock && p.currentStock <= p.minStock;

            return (
              <div
                key={p.id}
                id={`pdv-product-${p.id}`}
                onClick={() => addToCart(p)}
                className={`relative p-3 rounded-xl border transition flex flex-col justify-between cursor-pointer group ${
                  hasStock
                    ? 'bg-white border-slate-200 hover:border-pink-500 hover:shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  {/* Photo & Shade indicator */}
                  <div className="relative h-24 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                    <img
                      src={p.photo || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Visual Color Shade Swatch */}
                    {p.hexColor && (
                      <div
                        className="absolute bottom-1.5 left-1.5 w-4 h-4 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: p.hexColor }}
                        title={`Tonalidade: ${p.shade || 'Padrão'}`}
                      />
                    )}

                    {/* Stock status badge */}
                    <div className="absolute top-1.5 right-1.5">
                      {!hasStock ? (
                        <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Esgotado
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {p.currentStock} un
                        </span>
                      ) : (
                        <span className="bg-white/95 text-slate-700 border border-slate-200 text-[10px] font-medium px-1.5 py-0.5 rounded shadow-2xs">
                          {p.currentStock} un
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brand & Name */}
                  <div className="text-[10px] font-semibold text-pink-600 uppercase tracking-wider">
                    {p.brandName || 'Cosmético'}
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-pink-600">
                    {p.name}
                  </div>
                  {p.shade && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Cor: <span className="text-slate-700 font-medium">{p.shade}</span>
                    </div>
                  )}

                  {/* SKU da Caixa & Código ID Individual */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] font-mono">
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="SKU da Caixa original">
                      Cx: {p.boxSku || p.sku}
                    </span>
                    <span className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-bold border border-pink-200" title="Código ID Individual de Venda">
                      ID: {p.individualCode || p.barcode}
                    </span>
                  </div>

                  {isLowStock && (
                    <div className="mt-1 text-[10px] font-bold text-amber-600 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 inline" />
                      <span>Reposição necessária ({p.currentStock} un)</span>
                    </div>
                  )}
                </div>

                {/* Price & Add Indicator */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(p.sellPrice)}</div>
                  <div className="w-6 h-6 rounded-md bg-pink-50 group-hover:bg-pink-600 text-pink-600 group-hover:text-white flex items-center justify-center transition">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">
              Nenhum produto encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-xs shrink-0 justify-between">
        {/* Top Header of Cart */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-pink-600" />
              <h2 className="text-sm font-bold text-slate-900">Carrinho de Compras</h2>
              <span className="text-[11px] bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} itens
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-slate-400 hover:text-red-600 flex items-center space-x-1 font-medium"
                title="Limpar carrinho"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex-1 mr-2 min-w-0">
              <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Cliente</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[170px]">
                    <span className="block truncate font-bold text-slate-900">{selectedCustomer.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal flex items-center gap-1.5 truncate">
                      {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                      {selectedCustomer.cpf && <span>• CPF {selectedCustomer.cpf}</span>}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchTerm('');
                        setShowSearchCustomerModal(true);
                      }}
                      className="text-[10px] text-pink-600 hover:text-pink-700 font-semibold cursor-pointer hover:underline"
                      title="Pesquisar outro cliente"
                    >
                      Trocar
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer hover:underline"
                      title="Remover cliente da venda"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  id="select-pdv-customer"
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    setSelectedCustomer(c || null);
                  }}
                  className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer mt-0.5 truncate"
                >
                  <option value="" className="text-slate-500">
                    Cliente Balcão (Não identificado)
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-800">
                      {c.name} {c.phone ? `• ${c.phone}` : ''} {c.cpf ? `• CPF ${c.cpf}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                id="btn-search-customer"
                type="button"
                onClick={() => {
                  setCustomerSearchTerm('');
                  setShowSearchCustomerModal(true);
                }}
                className="p-1.5 rounded-md bg-white hover:bg-pink-50 text-slate-600 hover:text-pink-600 border border-slate-200 hover:border-pink-300 shadow-2xs transition flex items-center justify-center cursor-pointer"
                title="Pesquisar Cliente (Nome, CPF, E-mail ou Telefone)"
              >
                <Search className="w-4 h-4 text-pink-600" />
              </button>

              <button
                id="btn-quick-customer"
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
                className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition flex items-center justify-center cursor-pointer"
                title="Cadastrar Novo Cliente"
              >
                <UserPlus className="w-4 h-4 text-pink-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 scrollbar-thin max-h-[36vh] lg:max-h-[42vh]">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                  {item.product.shade && <span>{item.product.shade}</span>}
                  <span>•</span>
                  <span>{formatCurrency(item.unitPrice)}</span>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md p-0.5">
                <button
                  onClick={() => updateQuantity(idx, item.quantity - 1)}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-slate-900 px-1.5 min-w-[20px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(idx, item.quantity + 1)}
                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[60px]">
                <div className="text-xs font-bold text-slate-900">
                  {formatCurrency(item.unitPrice * item.quantity - item.discount)}
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFromCart(idx)}
                className="text-slate-400 hover:text-red-600 p-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
              <ShoppingCart className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
              <p className="font-medium text-slate-500">Nenhum item adicionado.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Clique nos produtos ao lado para adicionar ao pedido.</p>
            </div>
          )}
        </div>

        {/* Totals & Final Checkout Trigger */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          {/* General Discount input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Desconto Geral (R$):</span>
            <input
              id="input-pdv-discount"
              type="number"
              min="0"
              step="0.50"
              value={generalDiscount || ''}
              onChange={(e) => setGeneralDiscount(Number(e.target.value) || 0)}
              placeholder="0,00"
              className="w-24 text-right bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-900">Total a Pagar</span>
            <span className="text-2xl font-bold text-pink-600 tracking-tight">{formatCurrency(total)}</span>
          </div>

          {/* Checkout Button */}
          <button
            id="btn-pdv-checkout"
            disabled={cart.length === 0}
            onClick={() => {
              setAmountReceived(total.toFixed(2));
              setShowCheckoutModal(true);
            }}
            className={`w-full py-3 rounded-md font-semibold text-sm flex items-center justify-center space-x-2 shadow-xs transition active:scale-95 ${
              cart.length > 0
                ? 'bg-pink-600 hover:bg-pink-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <span>Finalizar Venda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: CHECKOUT & PAYMENT SELECTION */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Finalização de Venda</h3>
                <p className="text-xs text-slate-500">
                  Total: <strong className="text-pink-600">{formatCurrency(total)}</strong> •{' '}
                  {selectedCustomer?.name || 'Cliente Balcão'}
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Payment Method Selector Grid */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign },
                  { id: 'PIX', label: 'PIX Instantâneo', icon: QrCode },
                  { id: 'DEBITO', label: 'Cartão Débito', icon: CreditCard },
                  { id: 'CREDITO', label: 'Cartão Crédito', icon: CreditCard },
                  { id: 'PARCELADO', label: 'Crédito Parcelado', icon: CreditCard },
                  { id: 'OUTROS', label: 'Outros / Convênio', icon: Sparkles },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition ${
                        isSelected
                          ? 'bg-pink-50 border-pink-500 text-pink-700 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`} />
                      <span className="text-xs">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Dinheiro: Change Calculator */}
            {paymentMethod === 'DINHEIRO' && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">Valor Recebido do Cliente:</span>
                  <input
                    id="input-amount-received"
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-28 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-right text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-600">Troco a Devolver:</span>
                  <span
                    className={`text-sm font-bold ${
                      changeValue > 0 ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {formatCurrency(changeValue)}
                  </span>
                </div>
              </div>
            )}

            {/* If Pix: QR Code simulation */}
            {paymentMethod === 'PIX' && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-2">
                <div className="w-24 h-24 mx-auto bg-white rounded-lg p-1.5 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
                <div className="text-[11px] text-slate-600 font-mono">Chave Pix CNPJ: 33.987.654/0001-22</div>
                <div className="text-xs text-emerald-600 font-semibold">
                  Aguardando confirmação bancária instantânea
                </div>
              </div>
            )}

            {/* If Parcelado: Installments selection */}
            {paymentMethod === 'PARCELADO' && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">Número de Parcelas:</span>
                  <select
                    id="select-pdv-installments"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="bg-white border border-slate-300 text-slate-800 rounded-md px-2 py-1 text-xs"
                  >
                    {[2, 3, 4, 5, 6, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatCurrency(total / n)} sem juros
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  As parcelas serão lançadas automaticamente em Contas a Receber no módulo financeiro.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Observações da Venda (Opcional)</label>
              <input
                id="input-pdv-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Embalagem para presente, cliente vip..."
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                Voltar
              </button>
              <button
                id="btn-confirm-sale"
                type="button"
                disabled={submitting}
                onClick={handleFinalizeSale}
                className="flex-1 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5"
              >
                {submitting ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Venda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PESQUISAR CLIENTE CADASTRADO */}
      {showSearchCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Search className="w-4 h-4 text-pink-600" />
                  <span>Pesquisar Cliente Cadastrado</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Busca por Nome, CPF, E-mail ou Telefone / WhatsApp
                </p>
              </div>
              <button
                id="btn-close-search-customer-modal"
                type="button"
                onClick={() => setShowSearchCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-customer-term"
                  type="text"
                  autoFocus
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Digite nome, CPF, e-mail ou telefone..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
                {customerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
                <span>
                  {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                </span>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setShowSearchCustomerModal(false);
                    }}
                    className="text-pink-600 hover:text-pink-700 font-semibold cursor-pointer underline"
                  >
                    Desvincular (Cliente Balcão)
                  </button>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
              {filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    id={`customer-search-item-${c.id}`}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowSearchCustomerModal(false);
                    }}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-pink-50/80 border-pink-300 ring-1 ring-pink-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-pink-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-pink-600 text-white font-bold px-1.5 py-0.5 rounded">
                            Selecionado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        {c.phone && (
                          <span className="flex items-center gap-1 font-mono text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.phone}
                          </span>
                        )}
                        {c.cpf && (
                          <span className="font-mono text-slate-600">
                            CPF: <strong className="text-slate-800">{c.cpf}</strong>
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-slate-600 truncate max-w-[190px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {c.email}
                          </span>
                        )}
                        {c.instagram && (
                          <span className="text-pink-600 flex items-center gap-0.5">
                            <Instagram className="w-3 h-3" />
                            {c.instagram}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md shrink-0 transition ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-pink-600 hover:text-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">Nenhum cliente encontrado</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Não encontramos resultados para "{customerSearchTerm}" por Nome, CPF, E-mail ou Telefone.
                  </p>
                  <div className="mt-3 flex justify-center">
                    <button
                      id="btn-register-not-found-customer"
                      type="button"
                      onClick={() => {
                        setShowSearchCustomerModal(false);
                        setShowQuickCustomerModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Cadastrar Novo Cliente</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <button
                id="btn-switch-to-register-customer"
                type="button"
                onClick={() => {
                  setShowSearchCustomerModal(false);
                  setShowQuickCustomerModal(true);
                }}
                className="text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Novo Cliente</span>
              </button>

              <button
                id="btn-cancel-search-customer-modal"
                type="button"
                onClick={() => setShowSearchCustomerModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-semibold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK REGISTER CUSTOMER */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateQuickCustomer}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Cadastro Rápido de Cliente</h3>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Nome Completo *</label>
              <input
                id="input-quick-customer-name"
                type="text"
                required
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="Ex: Gabriela Rocha"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Telefone / WhatsApp *</label>
              <input
                id="input-quick-customer-phone"
                type="text"
                required
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="(11) 98888-7777"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Instagram (Opcional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-pink-500 font-bold select-none">
                  @
                </span>
                <input
                  id="input-quick-customer-instagram"
                  type="text"
                  value={newCustInstagram}
                  onChange={(e) => setNewCustInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="usuario.da.cliente"
                  className="w-full bg-white border border-slate-300 rounded-md pl-7 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">CPF (Opcional para Nota)</label>
              <input
                id="input-quick-customer-cpf"
                type="text"
                value={newCustCpf}
                onChange={(e) => setNewCustCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(false)}
                className="flex-1 py-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                id="btn-save-quick-customer"
                type="submit"
                className="flex-1 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
              >
                Salvar & Selecionar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: THERMAL RECEIPT MODAL */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">Venda Finalizada com Sucesso!</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper Mockup */}
            <div className="bg-slate-50 text-slate-900 p-4 rounded-lg shadow-inner font-mono text-[11px] space-y-2 border border-slate-200">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-bold text-sm tracking-wider text-slate-900">MARIS MAKEUP</div>
                <div className="text-[10px] text-slate-500">CNPJ: 33.987.654/0001-22</div>
                <div className="text-[10px] text-slate-500">Av. Paulista, 1200 - São Paulo - SP</div>
                <div className="text-[10px] font-semibold mt-1 text-slate-800">CUPOM NÃO FISCAL #{completedSale.saleNumber}</div>
                <div className="text-[9px] text-slate-400">
                  Data: {completedSale.date} {completedSale.time}
                </div>
              </div>

              <div className="text-[10px] text-slate-700">
                <div>Vendedor: {completedSale.sellerName}</div>
                <div>Cliente: {completedSale.customerName}</div>
              </div>

              {/* Items */}
              <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-1">
                {completedSale.items.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[160px]">
                      {it.quantity}x {it.productName} {it.shade ? `(${it.shade})` : ''}
                    </span>
                    <span className="font-semibold">{formatCurrency(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-right pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="text-pink-600">{formatCurrency(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Forma de Pagto:</span>
                  <span className="uppercase font-semibold">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.change && completedSale.change > 0 ? (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Troco:</span>
                    <span>{formatCurrency(completedSale.change)}</span>
                  </div>
                ) : null}
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-dashed border-slate-300">
                Obrigada pela preferência! Volte sempre ✨
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimir Cupom</span>
              </button>
              <button
                id="btn-close-receipt"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
