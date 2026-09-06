import { Router, Request, Response, NextFunction } from 'express';
import { db, generateSequentialStoreId } from './db.ts';
import {
  User,
  Product,
  Sale,
  SaleItem,
  StockMovement,
  AccountPayable,
  AccountReceivable,
  CashMovement,
  Purchase,
  Customer,
  Supplier,
  StockBatch,
  StoreSettings
} from '../src/types.ts';

import { getSupabaseStatus, isSupabaseConfigured, getSupabase } from './supabase.ts';

export const apiRouter = Router();

// Extend Request type
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// In-memory token store (Token -> UserID)
const tokenStore = new Map<string, string>([
  ['token_admin_demo', 'usr_admin'],
  ['token_vendedor_demo', 'usr_vendedor_1'],
  ['token_vendedor_2_demo', 'usr_vendedor_2'],
]);

// Auth Middleware
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const userId = tokenStore.get(token);
  if (!userId) {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }
  const user = db.getSnapshot().users.find((u) => u.id === userId && u.active);
  if (!user) {
    res.status(401).json({ error: 'Usuário inativo ou inexistente' });
    return;
  }
  req.user = user;
  next();
};

// Admin Only Middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Acesso Negado: Esta operação requer privilégios de Administrador.',
    });
    return;
  }
  next();
};

// Helper: calculate days remaining
function getDaysRemaining(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const snapshot = db.getSnapshot();
  const user = snapshot.users.find(
    (u) => u.email.toLowerCase() === (email || '').trim().toLowerCase() && u.active
  );

  if (!user) {
    res.status(401).json({ error: 'E-mail ou usuário não encontrado ou inativo.' });
    return;
  }

  // Password verification
  if (user.password && password && user.password !== password) {
    res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' });
    return;
  }

  // Generate or retrieve persistent token
  let token = `token_${user.id}_${Date.now()}`;
  if (user.id === 'usr_admin') token = 'token_admin_demo';
  if (user.id === 'usr_vendedor_1') token = 'token_vendedor_demo';
  if (user.id === 'usr_vendedor_2') token = 'token_vendedor_2_demo';

  tokenStore.set(token, user.id);

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'LOGIN',
    entity: 'SESSÃO',
    entityId: user.id,
    description: `${user.name} (${user.role}) realizou login no sistema.`,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    },
  });
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// User Management (Admin Only)
apiRouter.get('/users', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().users);
});

apiRouter.post('/users', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role, phone, avatarUrl } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Nome, e-mail e cargo são obrigatórios.' });
    return;
  }
  const snapshot = db.getSnapshot();
  if (snapshot.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'Já existe um usuário com este e-mail.' });
    return;
  }
  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role,
    active: true,
    phone: phone || '',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString().split('T')[0],
  };
  snapshot.users.push(newUser);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CADASTRAR_USUÁRIO',
    entity: 'USUÁRIO',
    entityId: newUser.id,
    description: `${req.user!.name} cadastrou o usuário ${newUser.name} como ${newUser.role}.`,
  });

  res.status(201).json(newUser);
});

apiRouter.put('/users/:id/toggle', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const user = snapshot.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  if (user.id === req.user!.id) {
    res.status(400).json({ error: 'Você não pode desativar seu próprio usuário administrador.' });
    return;
  }
  user.active = !user.active;
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALTERAR_STATUS_USUÁRIO',
    entity: 'USUÁRIO',
    entityId: user.id,
    description: `${req.user!.name} alterou status de ${user.name} para ${user.active ? 'Ativo' : 'Inativo'}.`,
  });

  res.json(user);
});

// ==========================================
// 2. PRODUCTS, BRANDS & CATEGORIES
// ==========================================

apiRouter.get('/brands', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().brands);
});

apiRouter.get('/categories', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().categories);
});

// Get Products - Automatically strips costs and margins for Vendedor!
apiRouter.get('/products', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.normalizeProducts();
  const snapshot = db.getSnapshot();
  const isVendedor = req.user?.role === 'VENDEDOR';

  const productsWithBatches = snapshot.products.map((p) => {
    const batches = snapshot.batches.filter((b) => b.productId === p.id && b.currentQuantity > 0);
    
    // Strict backend restriction: Strip financial margins and costs for Vendedor!
    if (isVendedor) {
      const { costPrice, marginValue, marginPercent, supplierId, supplierName, ...safeProduct } = p;
      return {
        ...safeProduct,
        batches: batches.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          currentQuantity: b.currentQuantity,
          status: b.status,
        })),
      };
    }

    return {
      ...p,
      batches,
    };
  });

  // Requirement: "Estoque nao deve ficar agrupado no mesmo cadastro mais de 1 unidade, deve ser separado por ID da loja e agrupado por SKU na mesma sequencia"
  productsWithBatches.sort((a, b) => {
    const skuA = (a.boxSku || a.sku || '').toLowerCase();
    const skuB = (b.boxSku || b.sku || '').toLowerCase();
    if (skuA !== skuB) {
      return skuA.localeCompare(skuB);
    }
    const idA = (a.storeIdCode || a.individualCode || '').toLowerCase();
    const idB = (b.storeIdCode || b.individualCode || '').toLowerCase();
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  });

  res.json(productsWithBatches);
});

// Create product (Allowed for Admin and Vendedor)
apiRouter.post('/products', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();
  const {
    sku,
    boxSku,
    individualCode,
    storeIdCode,
    barcode,
    name,
    brandId,
    brandName,
    categoryId,
    categoryName,
    subcategory,
    description,
    shade,
    hexColor,
    supplierId,
    costPrice,
    sellPrice,
    purchaseLocation,
    minStock,
    unit,
    photo,
    trackBatches,
    initialStock,
    batchNumber,
    expiryDate,
  } = req.body;

  if (!name || !sellPrice) {
    res.status(400).json({ error: 'Nome e Preço de Venda são obrigatórios.' });
    return;
  }

  // Cost handling: accept costPrice directly from request
  const finalCostPrice = costPrice !== undefined ? Number(costPrice) || 0 : 0;
  const finalSellPrice = Number(sellPrice);
  const marginValue = finalSellPrice - finalCostPrice;
  const marginPercent = finalCostPrice > 0 ? (marginValue / finalCostPrice) * 100 : 0;

  // Resolve or create Brand from written brandName or brandId
  let resolvedBrandId = brandId || '';
  let resolvedBrandName = (brandName || '').trim();
  if (resolvedBrandName) {
    const existing = snapshot.brands.find(
      (b) => b.name.toLowerCase() === resolvedBrandName.toLowerCase()
    );
    if (existing) {
      resolvedBrandId = existing.id;
      resolvedBrandName = existing.name;
    } else {
      resolvedBrandId = `brand_${Date.now()}`;
      snapshot.brands.push({
        id: resolvedBrandId,
        name: resolvedBrandName,
        active: true,
      });
    }
  } else if (resolvedBrandId) {
    resolvedBrandName = snapshot.brands.find((b) => b.id === resolvedBrandId)?.name || '';
  }

  // Resolve or create Category from written categoryName or categoryId
  let resolvedCategoryId = categoryId || '';
  let resolvedCategoryName = (categoryName || '').trim();
  if (resolvedCategoryName) {
    const existing = snapshot.categories.find(
      (c) => c.name.toLowerCase() === resolvedCategoryName.toLowerCase()
    );
    if (existing) {
      resolvedCategoryId = existing.id;
      resolvedCategoryName = existing.name;
    } else {
      resolvedCategoryId = `cat_${Date.now()}`;
      snapshot.categories.push({
        id: resolvedCategoryId,
        name: resolvedCategoryName,
        slug: resolvedCategoryName.toLowerCase().replace(/\s+/g, '-'),
        active: true,
      });
    }
  } else if (resolvedCategoryId) {
    resolvedCategoryName = snapshot.categories.find((c) => c.id === resolvedCategoryId)?.name || '';
  }

  const supplier = snapshot.suppliers.find((s) => s.id === supplierId);

  const initialQty = Number(initialStock) || 0;
  const finalBoxSku = (boxSku || sku || `CX-${Date.now().toString().slice(-6)}`).trim();
  const finalIndividualCode = (storeIdCode || individualCode || `MR-${Math.floor(100000 + Math.random() * 900000)}`).trim();
  const finalBarcode = (barcode || finalIndividualCode).trim();
  const finalExpiryDate = expiryDate ? String(expiryDate).trim() : '';

  // User requirement: "Estoque nao deve ficar agrupado no mesmo cadastro mais de 1 unidade, deve ser separado por ID da loja e agrupado por SKU na mesma sequencia"
  const countToCreate = initialQty > 1 ? initialQty : 1;
  const stockPerUnit = initialQty > 1 ? 1 : initialQty;
  const createdProducts: Product[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < countToCreate; i++) {
    const currentStoreId = generateSequentialStoreId(finalIndividualCode, i);
    const currentBarcode = (i === 0 && barcode) ? finalBarcode : currentStoreId;
    const prodId = i === 0 ? `prod_${baseTimestamp}` : `prod_${baseTimestamp}_u${i + 1}`;

    const newProduct: Product = {
      id: prodId,
      sku: finalBoxSku,
      boxSku: finalBoxSku,
      storeIdCode: currentStoreId,
      individualCode: currentStoreId,
      barcode: currentBarcode,
      name,
      brandId: resolvedBrandId,
      brandName: resolvedBrandName,
      categoryId: resolvedCategoryId,
      categoryName: resolvedCategoryName,
      subcategory: subcategory || '',
      description: description || '',
      shade: shade || '',
      hexColor: hexColor || '#D19C7C',
      supplierId: supplierId || '',
      supplierName: supplier?.tradeName || '',
      purchaseLocation: purchaseLocation ? String(purchaseLocation).trim() : '',
      expiryDate: finalExpiryDate,
      costPrice: finalCostPrice,
      sellPrice: finalSellPrice,
      marginValue,
      marginPercent: Number(marginPercent.toFixed(2)),
      currentStock: stockPerUnit,
      minStock: Number(minStock) || 5,
      unit: unit || 'un',
      photo: photo || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
      active: true,
      trackBatches: !!trackBatches || !!finalExpiryDate,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    snapshot.products.push(newProduct);
    createdProducts.push(newProduct);

    // If initial stock or expiry date specified, register batch for FEFO and validity monitoring
    if (stockPerUnit > 0 || finalExpiryDate) {
      const batchQty = stockPerUnit > 0 ? stockPerUnit : 0;
      const batchExp = finalExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const createdBatch: StockBatch = {
        id: `batch_${baseTimestamp}_${i}`,
        productId: newProduct.id,
        batchNumber: batchNumber ? (countToCreate > 1 ? `${batchNumber}-${i + 1}` : batchNumber) : `LOT-${newProduct.id.slice(-4)}`,
        expiryDate: batchExp,
        initialQuantity: batchQty,
        currentQuantity: batchQty,
        status: getDaysRemaining(batchExp) <= 0 ? 'EXPIRED' : 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0],
      };
      snapshot.batches.push(createdBatch);

      if (stockPerUnit > 0) {
        const now = new Date();
        snapshot.stockMovements.push({
          id: `mov_${baseTimestamp}_${i}`,
          productId: newProduct.id,
          productName: newProduct.name,
          productSku: newProduct.sku,
          batchNumber: createdBatch.batchNumber,
          quantity: stockPerUnit,
          type: 'IN_ADJUSTMENT',
          userId: user.id,
          userName: user.name,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          reason: countToCreate > 1
            ? `Cadastro individual un. ${i + 1}/${countToCreate} (ID Loja: ${currentStoreId})`
            : 'Cadastro inicial do produto com estoque',
          previousStock: 0,
          newStock: stockPerUnit,
          createdAt: now.toISOString().split('T')[0],
        });
      }
    }
  }

  db.save();

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CADASTRO_PRODUTO',
    entity: 'PRODUTO',
    entityId: createdProducts[0].id,
    newValue: `Preço: R$ ${createdProducts[0].sellPrice.toFixed(2)} (${countToCreate} un. cadastradas)`,
    description: countToCreate > 1
      ? `${user.name} cadastrou ${countToCreate} unidades do produto ${createdProducts[0].name} (SKU: ${finalBoxSku}) separadas individualmente por ID Loja.`
      : `${user.name} cadastrou o produto ${createdProducts[0].name} (${createdProducts[0].sku}).`,
  });

  res.status(201).json(createdProducts[0]);
});

// Edit Product (Admin can edit all; Vendedor can edit only non-cost fields)
apiRouter.put('/products/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const snapshot = db.getSnapshot();
  const product = snapshot.products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  const {
    name,
    sku,
    boxSku,
    storeIdCode,
    individualCode,
    barcode,
    brandId,
    brandName,
    categoryId,
    categoryName,
    subcategory,
    description,
    shade,
    hexColor,
    sellPrice,
    costPrice,
    purchaseLocation,
    expiryDate,
    minStock,
    unit,
    photo,
    active,
  } = req.body;

  // Backend permission check: Vendedor cannot change costs!
  if (costPrice !== undefined && costPrice !== product.costPrice && user.role === 'VENDEDOR') {
    res.status(403).json({ error: 'Vendedor não possui permissão para alterar custos de produtos.' });
    return;
  }

  const prevSellPrice = product.sellPrice;
  const prevCostPrice = product.costPrice;

  if (name !== undefined) product.name = name;
  if (boxSku !== undefined) {
    product.boxSku = boxSku.trim();
    product.sku = boxSku.trim();
  } else if (sku !== undefined) {
    product.sku = sku.trim();
    if (!product.boxSku) product.boxSku = sku.trim();
  }
  if (storeIdCode !== undefined) {
    product.storeIdCode = storeIdCode.trim();
    product.individualCode = storeIdCode.trim();
  } else if (individualCode !== undefined) {
    product.individualCode = individualCode.trim();
    product.storeIdCode = individualCode.trim();
  }
  if (barcode !== undefined) product.barcode = barcode.trim();

  // Resolve written brand
  if (brandName !== undefined) {
    const trimmedBrandName = String(brandName).trim();
    if (trimmedBrandName) {
      const existing = snapshot.brands.find(
        (b) => b.name.toLowerCase() === trimmedBrandName.toLowerCase()
      );
      if (existing) {
        product.brandId = existing.id;
        product.brandName = existing.name;
      } else {
        const newBrandId = `brand_${Date.now()}`;
        snapshot.brands.push({ id: newBrandId, name: trimmedBrandName, active: true });
        product.brandId = newBrandId;
        product.brandName = trimmedBrandName;
      }
    } else {
      product.brandName = '';
    }
  } else if (brandId !== undefined) {
    product.brandId = brandId;
    product.brandName = snapshot.brands.find((b) => b.id === brandId)?.name || '';
  }

  // Resolve written category
  if (categoryName !== undefined) {
    const trimmedCatName = String(categoryName).trim();
    if (trimmedCatName) {
      const existing = snapshot.categories.find(
        (c) => c.name.toLowerCase() === trimmedCatName.toLowerCase()
      );
      if (existing) {
        product.categoryId = existing.id;
        product.categoryName = existing.name;
      } else {
        const newCatId = `cat_${Date.now()}`;
        snapshot.categories.push({
          id: newCatId,
          name: trimmedCatName,
          slug: trimmedCatName.toLowerCase().replace(/\s+/g, '-'),
          active: true,
        });
        product.categoryId = newCatId;
        product.categoryName = trimmedCatName;
      }
    } else {
      product.categoryName = '';
    }
  } else if (categoryId !== undefined) {
    product.categoryId = categoryId;
    product.categoryName = snapshot.categories.find((c) => c.id === categoryId)?.name || '';
  }
  if (subcategory !== undefined) product.subcategory = subcategory;
  if (description !== undefined) product.description = description;
  if (shade !== undefined) product.shade = shade;
  if (hexColor !== undefined) product.hexColor = hexColor;
  if (purchaseLocation !== undefined) product.purchaseLocation = purchaseLocation.trim();
  if (minStock !== undefined) product.minStock = Number(minStock);
  if (unit !== undefined) product.unit = unit;
  if (photo !== undefined) product.photo = photo;
  if (active !== undefined) product.active = !!active;

  if (expiryDate !== undefined) {
    product.expiryDate = expiryDate ? String(expiryDate).trim() : '';
    // Synchronize or register batch with this expiry date
    if (product.expiryDate) {
      const prodBatches = snapshot.batches.filter((b) => b.productId === product.id);
      if (prodBatches.length > 0) {
        prodBatches.forEach((b) => {
          if (b.currentQuantity > 0) {
            b.expiryDate = product.expiryDate!;
            b.status = getDaysRemaining(product.expiryDate!) <= 0 ? 'EXPIRED' : 'ACTIVE';
          }
        });
      } else {
        snapshot.batches.push({
          id: `batch_${Date.now()}`,
          productId: product.id,
          batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: product.expiryDate,
          initialQuantity: product.currentStock,
          currentQuantity: product.currentStock,
          status: getDaysRemaining(product.expiryDate) <= 0 ? 'EXPIRED' : 'ACTIVE',
          createdAt: new Date().toISOString().split('T')[0],
        });
      }
    }
  }

  if (sellPrice !== undefined) {
    product.sellPrice = Number(sellPrice);
  }

  if (costPrice !== undefined) {
    product.costPrice = Number(costPrice) || 0;
  }

  product.marginValue = product.sellPrice - product.costPrice;
  product.marginPercent = product.costPrice > 0 ? Number(((product.marginValue / product.costPrice) * 100).toFixed(2)) : 0;
  product.updatedAt = new Date().toISOString().split('T')[0];

  db.save();

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'EDITAR_PRODUTO',
    entity: 'PRODUTO',
    entityId: product.id,
    previousValue: `Venda: R$ ${prevSellPrice.toFixed(2)} | Custo: R$ ${prevCostPrice.toFixed(2)}`,
    newValue: `Venda: R$ ${product.sellPrice.toFixed(2)} | Custo: R$ ${product.costPrice.toFixed(2)}`,
    description: `${user.name} alterou informações do produto ${product.name}.`,
  });

  res.json(product);
});

// Delete Product (Admin Only)
apiRouter.delete('/products/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const productIndex = snapshot.products.findIndex((p) => p.id === id);

  if (productIndex === -1) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  const [removed] = snapshot.products.splice(productIndex, 1);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'EXCLUIR_PRODUTO',
    entity: 'PRODUTO',
    entityId: id,
    description: `${req.user!.name} excluiu o produto ${removed.name} (${removed.sku}).`,
  });

  res.json({ success: true, message: 'Produto excluído com sucesso.' });
});

// ==========================================
// 3. STOCK MOVEMENTS & ADJUSTMENTS
// ==========================================

apiRouter.get('/stock/movements', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().stockMovements);
});

apiRouter.post('/stock/movement', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { productId, batchId, quantity, type, reason } = req.body;
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const product = snapshot.products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    res.status(400).json({ error: 'Quantidade deve ser maior que zero.' });
    return;
  }

  const prevStock = product.currentStock;
  let newStock = prevStock;

  const isEntry = type.startsWith('IN_');
  if (isEntry) {
    newStock = prevStock + qty;
  } else {
    if (prevStock < qty) {
      res.status(400).json({ error: `Estoque insuficiente. Atual: ${prevStock}, Solicitado: ${qty}.` });
      return;
    }
    newStock = prevStock - qty;
  }

  // Handle batch if specified
  let batch: StockBatch | undefined;
  if (batchId) {
    batch = snapshot.batches.find((b) => b.id === batchId);
    if (batch) {
      if (isEntry) {
        batch.currentQuantity += qty;
      } else {
        batch.currentQuantity = Math.max(0, batch.currentQuantity - qty);
        if (batch.currentQuantity === 0) batch.status = 'DEPLETED';
      }
    }
  }

  product.currentStock = newStock;
  product.updatedAt = new Date().toISOString().split('T')[0];

  const now = new Date();
  const movement: StockMovement = {
    id: `mov_${Date.now()}`,
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    batchId: batch?.id,
    batchNumber: batch?.batchNumber,
    quantity: qty,
    type,
    userId: user.id,
    userName: user.name,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    reason: reason || 'Ajuste manual de estoque',
    previousStock: prevStock,
    newStock,
    createdAt: now.toISOString().split('T')[0],
  };

  snapshot.stockMovements.unshift(movement);
  db.save();

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'MOVIMENTAÇÃO_ESTOQUE',
    entity: 'ESTOQUE',
    entityId: product.id,
    previousValue: `${prevStock}`,
    newValue: `${newStock}`,
    description: `${user.name} alterou o estoque do produto ${product.name} de ${prevStock} para ${newStock}. Motivo: ${reason || 'Ajuste'}.`,
  });

  res.json({ success: true, movement, product });
});

// ==========================================
// 4. VALIDITY & FEFO CONTROL
// ==========================================

apiRouter.get('/validity', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const snapshot = db.getSnapshot();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items = snapshot.batches
    .filter((b) => b.currentQuantity > 0)
    .map((b) => {
      const product = snapshot.products.find((p) => p.id === b.productId);
      const days = getDaysRemaining(b.expiryDate);

      let statusGroup: 'EXPIRED' | '7_DAYS' | '30_DAYS' | '60_DAYS' | '90_DAYS' | 'SAFE' = 'SAFE';
      if (days < 0) statusGroup = 'EXPIRED';
      else if (days <= 7) statusGroup = '7_DAYS';
      else if (days <= 30) statusGroup = '30_DAYS';
      else if (days <= 60) statusGroup = '60_DAYS';
      else if (days <= 90) statusGroup = '90_DAYS';

      return {
        batchId: b.id,
        productId: b.productId,
        productName: product?.name || 'Produto',
        sku: product?.sku || '',
        shade: product?.shade || '',
        brandName: product?.brandName || '',
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        manufacturingDate: b.manufacturingDate,
        currentQuantity: b.currentQuantity,
        daysRemaining: days,
        statusGroup,
        isExpired: days < 0,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining); // FEFO order

  res.json({
    summary: {
      expired: items.filter((i) => i.statusGroup === 'EXPIRED').length,
      expiring7Days: items.filter((i) => i.statusGroup === '7_DAYS').length,
      expiring30Days: items.filter((i) => i.statusGroup === '30_DAYS').length,
      expiring60Days: items.filter((i) => i.statusGroup === '60_DAYS').length,
      expiring90Days: items.filter((i) => i.statusGroup === '90_DAYS').length,
      totalBatches: items.length,
    },
    items,
  });
});

// ==========================================
// 5. SALES & PDV (TRANSACTIONAL)
// ==========================================

apiRouter.post('/sales', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { customerId, discount, paymentMethod, installments, amountPaid, notes, items } = req.body;
  const user = req.user!;
  const snapshot = db.getSnapshot();

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Nenhum produto informado no carrinho.' });
    return;
  }

  // Validate stock and validity before making changes
  for (const item of items) {
    const product = snapshot.products.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      res.status(400).json({ error: `Produto ${item.productName || item.productId} não disponível.` });
      return;
    }
    if (product.currentStock < item.quantity) {
      res.status(400).json({
        error: `Estoque insuficiente para ${product.name}. Disponível: ${product.currentStock}, Solicitado: ${item.quantity}.`,
      });
      return;
    }

    // Check FEFO / Expired batches rule: "O sistema deve impedir a venda de produtos vencidos."
    if (product.trackBatches) {
      const activeBatches = snapshot.batches
        .filter((b) => b.productId === product.id && b.currentQuantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      // If only expired batches exist
      const nonExpiredBatches = activeBatches.filter((b) => getDaysRemaining(b.expiryDate) >= 0);
      const totalNonExpiredStock = nonExpiredBatches.reduce((acc, b) => acc + b.currentQuantity, 0);

      if (totalNonExpiredStock < item.quantity && activeBatches.length > 0) {
        res.status(400).json({
          error: `Não é possível vender o produto ${product.name}: os lotes disponíveis estão vencidos! O sistema bloqueia a venda de produtos fora da validade.`,
        });
        return;
      }
    }
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  let subtotal = 0;
  let costTotal = 0;
  const saleItems: SaleItem[] = [];

  // Deduct stock and assign FEFO batches
  for (const item of items) {
    const product = snapshot.products.find((p) => p.id === item.productId)!;
    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const itemDiscount = Number(item.discount) || 0;
    const itemTotal = unitPrice * qty - itemDiscount;

    subtotal += unitPrice * qty;
    costTotal += product.costPrice * qty;

    let selectedBatchId: string | undefined = undefined;
    let selectedBatchNumber: string | undefined = undefined;

    // FEFO: Deduct from earliest expiring batch
    if (product.trackBatches) {
      const activeBatches = snapshot.batches
        .filter((b) => b.productId === product.id && b.currentQuantity > 0 && getDaysRemaining(b.expiryDate) >= 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      let remainingToDeduct = qty;
      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;
        selectedBatchId = batch.id;
        selectedBatchNumber = batch.batchNumber;

        const deduct = Math.min(batch.currentQuantity, remainingToDeduct);
        batch.currentQuantity -= deduct;
        if (batch.currentQuantity === 0) batch.status = 'DEPLETED';
        remainingToDeduct -= deduct;
      }
    }

    const prevStock = product.currentStock;
    product.currentStock -= qty;
    product.updatedAt = dateStr;

    // Record stock movement
    snapshot.stockMovements.unshift({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      batchId: selectedBatchId,
      batchNumber: selectedBatchNumber,
      quantity: qty,
      type: 'OUT_SALE',
      userId: user.id,
      userName: user.name,
      date: dateStr,
      time: timeStr,
      reason: `Venda no PDV`,
      previousStock: prevStock,
      newStock: product.currentStock,
      createdAt: dateStr,
    });

    saleItems.push({
      id: `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      saleId: '', // Will assign below
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      shade: product.shade,
      batchId: selectedBatchId,
      batchNumber: selectedBatchNumber,
      quantity: qty,
      unitPrice,
      unitCost: product.costPrice,
      discount: itemDiscount,
      totalPrice: itemTotal,
    });
  }

  const finalDiscount = Number(discount) || 0;
  const total = Math.max(0, subtotal - finalDiscount);
  const profitTotal = total - costTotal;

  // Find customer if provided
  let customer: Customer | undefined;
  if (customerId) {
    customer = snapshot.customers.find((c) => c.id === customerId);
    if (customer) {
      customer.totalSpent += total;
      customer.purchaseCount += 1;
      customer.lastPurchaseDate = dateStr;
    }
  }

  const nextSaleNum = (snapshot.sales.length + 1001).toString();
  const saleId = `sale_${Date.now()}`;

  saleItems.forEach((si) => (si.saleId = saleId));

  const newSale: Sale = {
    id: saleId,
    saleNumber: nextSaleNum,
    date: dateStr,
    time: timeStr,
    sellerId: user.id,
    sellerName: user.name,
    customerId: customer?.id,
    customerName: customer?.name || req.body.customerName || 'Cliente Balcão',
    customerPhone: customer?.phone,
    subtotal,
    discount: finalDiscount,
    total,
    costTotal,
    profitTotal,
    paymentMethod: paymentMethod || 'DINHEIRO',
    installments: Number(installments) || 1,
    amountPaid: Number(amountPaid) || total,
    change: Math.max(0, (Number(amountPaid) || total) - total),
    status: 'FINALIZADA',
    notes: notes || '',
    items: saleItems,
    createdAt: dateStr,
  };

  snapshot.sales.unshift(newSale);

  // Financial integration:
  // If payment is immediate (Dinheiro, Pix, Débito, Crédito à vista) -> Cash Movement ENTRADA
  if (paymentMethod !== 'PARCELADO') {
    snapshot.cashMovements.unshift({
      id: `cash_${Date.now()}`,
      type: 'ENTRADA',
      category: 'Vendas PDV',
      description: `Venda #${nextSaleNum} - ${newSale.customerName} (${paymentMethod})`,
      amount: total,
      date: dateStr,
      time: timeStr,
      referenceType: 'SALE',
      referenceId: saleId,
      userId: user.id,
      userName: user.name,
      createdAt: dateStr,
    });
  } else {
    // Installments -> Create Accounts Receivable
    const instCount = Math.max(1, Number(installments) || 2);
    const instAmount = Number((total / instCount).toFixed(2));
    for (let i = 1; i <= instCount; i++) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + i * 30);
      snapshot.accountsReceivable.unshift({
        id: `rec_${Date.now()}_${i}`,
        saleId,
        saleNumber: nextSaleNum,
        customerId: customer?.id,
        customerName: newSale.customerName,
        amount: instAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'PENDENTE',
        paymentMethod: 'PARCELADO',
        installmentNumber: i,
        totalInstallments: instCount,
        createdAt: dateStr,
      });
    }
  }

  db.save();

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'VENDA_PDV',
    entity: 'VENDA',
    entityId: newSale.id,
    newValue: `R$ ${total.toFixed(2)}`,
    description: `${user.name} realizou a venda #${nextSaleNum} no valor de R$ ${total.toFixed(2)} para ${newSale.customerName}.`,
  });

  // Return sale (strip costs if Vendedor)
  if (user.role === 'VENDEDOR') {
    const { costTotal, profitTotal, ...safeSale } = newSale;
    res.status(201).json(safeSale);
    return;
  }

  res.status(201).json(newSale);
});

// Get Sales (Admin sees all; Vendedor sees own sales)
apiRouter.get('/sales', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  let salesList = snapshot.sales;
  if (user.role === 'VENDEDOR') {
    salesList = salesList.filter((s) => s.sellerId === user.id);
  }

  // Strip financial cost/profit info for Vendedor
  if (user.role === 'VENDEDOR') {
    const sanitized = salesList.map((s) => {
      const { costTotal, profitTotal, ...rest } = s;
      const safeItems = s.items.map((it) => {
        const { unitCost, ...itemRest } = it;
        return itemRest;
      });
      return { ...rest, items: safeItems };
    });
    res.json(sanitized);
    return;
  }

  res.json(salesList);
});

// Cancel Sale (ADMIN ONLY)
apiRouter.post('/sales/:id/cancel', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin = req.user!;
  const snapshot = db.getSnapshot();

  const sale = snapshot.sales.find((s) => s.id === id);
  if (!sale) {
    res.status(404).json({ error: 'Venda não encontrada.' });
    return;
  }

  if (sale.status === 'CANCELADA') {
    res.status(400).json({ error: 'Esta venda já foi cancelada anteriormente.' });
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  // Revert Stock for each item
  for (const item of sale.items) {
    const product = snapshot.products.find((p) => p.id === item.productId);
    if (product) {
      const prevStock = product.currentStock;
      product.currentStock += item.quantity;
      product.updatedAt = dateStr;

      // Restore batch quantity if applicable
      if (item.batchId) {
        const batch = snapshot.batches.find((b) => b.id === item.batchId);
        if (batch) {
          batch.currentQuantity += item.quantity;
          if (batch.status === 'DEPLETED') batch.status = 'ACTIVE';
        }
      }

      snapshot.stockMovements.unshift({
        id: `mov_cancel_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        type: 'IN_RETURN',
        userId: admin.id,
        userName: admin.name,
        date: dateStr,
        time: timeStr,
        reason: `Cancelamento da venda #${sale.saleNumber}: ${reason || 'Devolução'}`,
        previousStock: prevStock,
        newStock: product.currentStock,
        createdAt: dateStr,
      });
    }
  }

  // Revert Customer stats
  if (sale.customerId) {
    const customer = snapshot.customers.find((c) => c.id === sale.customerId);
    if (customer) {
      customer.totalSpent = Math.max(0, customer.totalSpent - sale.total);
      customer.purchaseCount = Math.max(0, customer.purchaseCount - 1);
    }
  }

  // Revert Financial: Create cash movement SAIDA (refund) or cancel receivable
  if (sale.paymentMethod !== 'PARCELADO') {
    snapshot.cashMovements.unshift({
      id: `cash_cancel_${Date.now()}`,
      type: 'SAIDA',
      category: 'Estorno de Venda',
      description: `Estorno de venda cancelada #${sale.saleNumber}`,
      amount: sale.total,
      date: dateStr,
      time: timeStr,
      referenceType: 'SALE',
      referenceId: sale.id,
      userId: admin.id,
      userName: admin.name,
      createdAt: dateStr,
    });
  } else {
    // Cancel receivables
    snapshot.accountsReceivable.forEach((ar) => {
      if (ar.saleId === sale.id) {
        ar.status = 'CANCELADO';
      }
    });
  }

  sale.status = 'CANCELADA';
  sale.cancelReason = reason || 'Cancelado pelo administrador';
  sale.cancelledByUserId = admin.id;
  sale.cancelledByName = admin.name;
  sale.cancelledAt = `${dateStr} ${timeStr}`;

  db.save();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'CANCELAMENTO_VENDA',
    entity: 'VENDA',
    entityId: sale.id,
    previousValue: 'FINALIZADA',
    newValue: 'CANCELADA',
    description: `${admin.name} cancelou a venda #${sale.saleNumber}. Motivo: ${reason || 'Cancelamento'}.`,
  });

  res.json({ success: true, message: `Venda #${sale.saleNumber} cancelada e estoque estornado com sucesso.`, sale });
});

// ==========================================
// 6. CUSTOMERS (CLIENTES)
// ==========================================

apiRouter.get('/customers', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().customers);
});

apiRouter.post('/customers', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, cpf, phone, whatsapp, email, instagram, birthDate, address, notes } = req.body;
  const user = req.user!;
  if (!name || !phone) {
    res.status(400).json({ error: 'Nome e Telefone são obrigatórios.' });
    return;
  }
  const snapshot = db.getSnapshot();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    name,
    cpf: cpf || '',
    phone,
    whatsapp: whatsapp || phone,
    instagram: instagram ? instagram.trim() : '',
    email: email || '',
    birthDate: birthDate || '',
    address: address || '',
    notes: notes || '',
    totalSpent: 0,
    purchaseCount: 0,
    active: true,
    createdAt: new Date().toISOString().split('T')[0],
  };
  snapshot.customers.push(newCustomer);
  db.save();

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CADASTRO_CLIENTE',
    entity: 'CLIENTE',
    entityId: newCustomer.id,
    description: `${user.name} cadastrou a cliente ${newCustomer.name}.`,
  });

  res.status(201).json(newCustomer);
});

apiRouter.put('/customers/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const customer = snapshot.customers.find((c) => c.id === id);
  if (!customer) {
    res.status(404).json({ error: 'Cliente não encontrado.' });
    return;
  }
  Object.assign(customer, req.body);
  db.save();
  res.json(customer);
});

apiRouter.delete('/customers/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const index = snapshot.customers.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Cliente não encontrado.' });
    return;
  }
  const deleted = snapshot.customers[index];
  snapshot.customers.splice(index, 1);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'EXCLUIR_CLIENTE',
    entity: 'CLIENTE',
    entityId: id,
    description: `${req.user!.name} excluiu o cadastro da cliente ${deleted.name}.`,
  });

  res.json({ message: 'Cliente excluído com sucesso.', id });
});

// ==========================================
// 7. SUPPLIERS & PURCHASES
// ==========================================

apiRouter.get('/suppliers', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().suppliers);
});

apiRouter.post('/suppliers', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { corporateName, tradeName, cnpj, phone, whatsapp, email, address, notes } = req.body;
  if (!corporateName || !cnpj) {
    res.status(400).json({ error: 'Razão social e CNPJ são obrigatórios.' });
    return;
  }
  const snapshot = db.getSnapshot();
  const newSupplier: Supplier = {
    id: `sup_${Date.now()}`,
    corporateName,
    tradeName: tradeName || corporateName,
    cnpj,
    phone: phone || '',
    whatsapp: whatsapp || '',
    email: email || '',
    address: address || '',
    notes: notes || '',
    active: true,
    createdAt: new Date().toISOString().split('T')[0],
  };
  snapshot.suppliers.push(newSupplier);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CADASTRO_FORNECEDOR',
    entity: 'FORNECEDOR',
    entityId: newSupplier.id,
    description: `${req.user!.name} cadastrou o fornecedor ${newSupplier.tradeName}.`,
  });

  res.status(201).json(newSupplier);
});

apiRouter.get('/purchases', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().purchases);
});

// Register Purchase (Admin Only) -> Automatically adds to stock and accounts payable!
apiRouter.post('/purchases', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    supplierId,
    invoiceNumber,
    paymentCondition = 'A_PAGAR',
    paymentMethod = 'BOLETO',
    dueDate,
    notes,
    items,
  } = req.body;
  const admin = req.user!;
  const snapshot = db.getSnapshot();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  let supplier = snapshot.suppliers.find((s) => s.id === supplierId);
  if (!supplier && (req.body.supplierName || req.body.newSupplierName)) {
    const sName = (req.body.supplierName || req.body.newSupplierName).trim();
    if (sName) {
      supplier = {
        id: `sup_${Date.now()}`,
        corporateName: sName,
        tradeName: sName,
        cnpj: req.body.supplierCnpj || '00.000.000/0001-00',
        phone: req.body.supplierPhone || '',
        whatsapp: '',
        email: '',
        address: '',
        notes: 'Cadastrado na entrada de compra',
        active: true,
        createdAt: dateStr,
      };
      snapshot.suppliers.push(supplier);
    }
  }

  if (!supplier) {
    res.status(400).json({ error: 'Fornecedor obrigatório. Selecione ou informe o nome do fornecedor.' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Adicione pelo menos um produto à compra.' });
    return;
  }

  let totalCost = 0;
  const purchaseNumber = `COM-${now.getFullYear()}-${(snapshot.purchases.length + 1).toString().padStart(3, '0')}`;
  const purchaseId = `pur_${Date.now()}`;

  for (const item of items) {
    let product = snapshot.products.find((p) => p.id === item.productId);
    const qty = Number(item.quantity) || 1;
    const unitCost = Number(item.unitCost) || 0;

    if (!product && (item.productName || item.name)) {
      const prodName = (item.productName || item.name).trim();
      if (prodName) {
        const autoSellPrice = unitCost > 0 ? Number((unitCost * 1.6).toFixed(2)) : 29.90;
        const autoMarginVal = unitCost > 0 ? Number((autoSellPrice - unitCost).toFixed(2)) : 0;
        product = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: prodName,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: `${Math.floor(7890000000000 + Math.random() * 9999999999)}`,
          brandId: 'b_geral',
          brandName: item.brand || 'Geral',
          categoryId: 'c_geral',
          categoryName: item.category || 'Maquiagem',
          shade: item.shade || '',
          hexColor: '#C48B71',
          costPrice: unitCost,
          sellPrice: autoSellPrice,
          marginValue: autoMarginVal,
          marginPercent: unitCost > 0 ? Number(((autoMarginVal / unitCost) * 100).toFixed(2)) : 60,
          currentStock: 0,
          minStock: 5,
          unit: 'un',
          active: true,
          trackBatches: true,
          supplierId: supplier.id,
          supplierName: supplier.tradeName,
          createdAt: dateStr,
          updatedAt: dateStr,
        };
        snapshot.products.push(product);
        item.productId = product.id;
        item.productName = product.name;
      }
    }

    if (!product) continue;

    totalCost += qty * unitCost;

    // Requirement: "Estoque nao deve ficar agrupado no mesmo cadastro mais de 1 unidade, deve ser separado por ID da loja e agrupado por SKU na mesma sequencia"
    // Update product cost
    if (unitCost > 0) {
      product.costPrice = unitCost;
      product.marginValue = product.sellPrice - product.costPrice;
      product.marginPercent = Number(((product.marginValue / product.costPrice) * 100).toFixed(2));
    }
    product.updatedAt = dateStr;

    // If product currently has 0 stock, the first unit occupies this product record
    let baseStoreId = (product.storeIdCode || product.individualCode || `MR-${Math.floor(100000 + Math.random() * 900000)}`).trim();
    if (!product.storeIdCode) {
      product.storeIdCode = baseStoreId;
      product.individualCode = baseStoreId;
      product.barcode = product.barcode || baseStoreId;
    }

    const unitsToCreate = product.currentStock === 0 ? qty - 1 : qty;
    if (product.currentStock === 0) {
      product.currentStock = 1;

      let batchNumber = item.batchNumber;
      if (product.trackBatches && item.expiryDate) {
        batchNumber = item.batchNumber || `LOTE-NF-${Date.now().toString().slice(-4)}`;
        snapshot.batches.push({
          id: `batch_${Date.now()}_0`,
          productId: product.id,
          batchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          initialQuantity: 1,
          currentQuantity: 1,
          status: getDaysRemaining(item.expiryDate) <= 0 ? 'EXPIRED' : 'ACTIVE',
          createdAt: dateStr,
        });
      }

      snapshot.stockMovements.unshift({
        id: `mov_pur_${Date.now()}_0`,
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        batchNumber,
        quantity: 1,
        type: 'IN_PURCHASE',
        userId: admin.id,
        userName: admin.name,
        date: dateStr,
        time: timeStr,
        reason: `Compra ${purchaseNumber} - ${supplier.tradeName} (Unidade 1/${qty})`,
        previousStock: 0,
        newStock: 1,
        createdAt: dateStr,
      });
    }

    // Allocate remaining units as separate 1 UN records grouped by same SKU with sequential ID Loja
    for (let u = 0; u < unitsToCreate; u++) {
      const unitIndex = (product.currentStock === 1 ? 1 : 0) + u;
      const unitStoreId = generateSequentialStoreId(baseStoreId, unitIndex);
      const newUnitProd: Product = {
        ...product,
        id: `prod_${Date.now()}_u${u + 1}_${Math.random().toString(36).substring(2, 5)}`,
        sku: product.boxSku || product.sku,
        boxSku: product.boxSku || product.sku,
        storeIdCode: unitStoreId,
        individualCode: unitStoreId,
        barcode: unitStoreId,
        currentStock: 1,
        createdAt: dateStr,
        updatedAt: dateStr,
      };
      snapshot.products.push(newUnitProd);

      let batchNumber = item.batchNumber;
      if (newUnitProd.trackBatches && item.expiryDate) {
        batchNumber = item.batchNumber ? `${item.batchNumber}-${unitIndex + 1}` : `LOTE-NF-${Date.now().toString().slice(-4)}-${unitIndex + 1}`;
        snapshot.batches.push({
          id: `batch_${Date.now()}_u${u + 1}`,
          productId: newUnitProd.id,
          batchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          initialQuantity: 1,
          currentQuantity: 1,
          status: getDaysRemaining(item.expiryDate) <= 0 ? 'EXPIRED' : 'ACTIVE',
          createdAt: dateStr,
        });
      }

      snapshot.stockMovements.unshift({
        id: `mov_pur_${Date.now()}_u${u + 1}`,
        productId: newUnitProd.id,
        productName: newUnitProd.name,
        productSku: newUnitProd.sku,
        batchNumber,
        quantity: 1,
        type: 'IN_PURCHASE',
        userId: admin.id,
        userName: admin.name,
        date: dateStr,
        time: timeStr,
        reason: `Compra ${purchaseNumber} - ${supplier.tradeName} (ID Loja: ${unitStoreId})`,
        previousStock: 0,
        newStock: 1,
        createdAt: dateStr,
      });
    }
  }

  const isPaid = paymentCondition === 'PAGO';
  const resolvedPaymentMethod = paymentMethod || (isPaid ? 'Pix' : 'Boleto');
  const resolvedDueDate = isPaid ? dateStr : (dueDate || dateStr);
  const payableId = `pay_${Date.now()}`;

  const purchase: Purchase = {
    id: purchaseId,
    purchaseNumber,
    supplierId: supplier.id,
    supplierName: supplier.tradeName,
    purchaseDate: dateStr,
    invoiceNumber: invoiceNumber || '',
    paymentMethod: resolvedPaymentMethod as any,
    paymentCondition: isPaid ? 'PAGO' : 'A_PAGAR',
    paymentStatus: isPaid ? 'PAGO' : 'PENDENTE',
    dueDate: isPaid ? undefined : resolvedDueDate,
    totalCost,
    status: 'RECEBIDA',
    notes: notes || '',
    userId: admin.id,
    userName: admin.name,
    items,
    createdAt: dateStr,
  };

  snapshot.purchases.unshift(purchase);

  if (isPaid) {
    // Registra conta já paga/liquidada no financeiro
    snapshot.accountsPayable.unshift({
      id: payableId,
      description: `Compra ${purchaseNumber} - ${supplier.tradeName} (NF ${invoiceNumber || 'S/N'})`,
      category: 'FORNECEDOR',
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      amount: totalCost,
      dueDate: dateStr,
      paymentDate: dateStr,
      status: 'PAGO',
      paymentMethod: resolvedPaymentMethod as any,
      notes: `Compra paga à vista (${resolvedPaymentMethod}) - Entrada #${purchaseNumber}`,
      isRecurring: false,
      createdAt: dateStr,
    });

    // Saída de caixa imediata para compras pagas
    snapshot.cashMovements.unshift({
      id: `cash_${Date.now()}`,
      type: 'SAIDA',
      category: 'FORNECEDOR',
      description: `Pagamento Compra ${purchaseNumber} - ${supplier.tradeName} (${resolvedPaymentMethod})`,
      amount: totalCost,
      date: dateStr,
      time: timeStr,
      referenceType: 'PAYABLE',
      referenceId: payableId,
      userId: admin.id,
      userName: admin.name,
      createdAt: dateStr,
    });
  } else {
    // A PAGAR: Permanece PENDENTE na aba FINANCEIRO no campo CONTAS A PAGAR com a data de vencimento
    snapshot.accountsPayable.unshift({
      id: payableId,
      description: `Compra ${purchaseNumber} - ${supplier.tradeName} (NF ${invoiceNumber || 'S/N'})`,
      category: 'FORNECEDOR',
      supplierId: supplier.id,
      supplierName: supplier.tradeName,
      amount: totalCost,
      dueDate: resolvedDueDate,
      status: 'PENDENTE',
      paymentMethod: resolvedPaymentMethod as any,
      notes: `Gerado automaticamente da entrada de compra #${purchaseNumber} (${resolvedPaymentMethod})`,
      isRecurring: false,
      createdAt: dateStr,
    });
  }

  db.save();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'REGISTRO_COMPRA',
    entity: 'COMPRA',
    entityId: purchaseId,
    newValue: `R$ ${totalCost.toFixed(2)}`,
    description: `${admin.name} registrou a compra ${purchaseNumber} com fornecedor ${supplier.tradeName} no valor de R$ ${totalCost.toFixed(2)}.`,
  });

  res.status(201).json(purchase);
});

// ==========================================
// 8. FINANCIAL & CASH FLOW (ADMIN ONLY)
// ==========================================

apiRouter.get('/financial/payables', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().accountsPayable);
});

apiRouter.post('/financial/payables', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { description, category, supplierId, supplierName: reqSupplierName, amount, dueDate, paymentMethod, notes, isRecurring } = req.body;
  const admin = req.user!;
  if (!description || !amount || !dueDate) {
    res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios.' });
    return;
  }
  const snapshot = db.getSnapshot();
  const supplier = snapshot.suppliers.find((s) => s.id === supplierId);

  const payable: AccountPayable = {
    id: `pay_${Date.now()}`,
    description,
    category: (category && category.trim()) ? category.trim() : 'OUTROS',
    supplierId,
    supplierName: supplier?.tradeName || reqSupplierName || '',
    amount: Number(amount),
    dueDate,
    status: 'PENDENTE',
    paymentMethod: paymentMethod || 'PIX',
    notes: notes || '',
    isRecurring: !!isRecurring,
    createdAt: new Date().toISOString().split('T')[0],
  };

  snapshot.accountsPayable.unshift(payable);
  db.save();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'CRIAR_CONTA_PAGAR',
    entity: 'FINANCEIRO',
    entityId: payable.id,
    newValue: `R$ ${payable.amount.toFixed(2)}`,
    description: `${admin.name} cadastrou a conta a pagar "${payable.description}" no valor de R$ ${payable.amount.toFixed(2)}.`,
  });

  res.status(201).json(payable);
});

// Mark payable as paid -> Creates Cash Movement SAIDA
apiRouter.post('/financial/payables/:id/pay', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const snapshot = db.getSnapshot();
  const payable = snapshot.accountsPayable.find((p) => p.id === id);

  if (!payable) {
    res.status(404).json({ error: 'Conta não encontrada.' });
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  payable.status = 'PAGO';
  payable.paymentDate = dateStr;

  // Register Cash Movement SAIDA
  snapshot.cashMovements.unshift({
    id: `cash_${Date.now()}`,
    type: 'SAIDA',
    category: payable.category,
    description: `Pagamento: ${payable.description}`,
    amount: payable.amount,
    date: dateStr,
    time: timeStr,
    referenceType: 'PAYABLE',
    referenceId: payable.id,
    userId: admin.id,
    userName: admin.name,
    createdAt: dateStr,
  });

  db.save();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'BAIXA_CONTA_PAGAR',
    entity: 'FINANCEIRO',
    entityId: payable.id,
    previousValue: 'PENDENTE',
    newValue: 'PAGO',
    description: `${admin.name} efetuou o pagamento de "${payable.description}" no valor de R$ ${payable.amount.toFixed(2)}.`,
  });

  res.json({ success: true, payable });
});

apiRouter.get('/financial/receivables', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().accountsReceivable);
});

// Mark receivable as paid -> Creates Cash Movement ENTRADA
apiRouter.post('/financial/receivables/:id/receive', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const admin = req.user!;
  const snapshot = db.getSnapshot();
  const receivable = snapshot.accountsReceivable.find((r) => r.id === id);

  if (!receivable) {
    res.status(404).json({ error: 'Conta a receber não encontrada.' });
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  receivable.status = 'PAGO';
  receivable.paymentDate = dateStr;

  snapshot.cashMovements.unshift({
    id: `cash_${Date.now()}`,
    type: 'ENTRADA',
    category: 'Recebimento de Venda',
    description: `Recebimento Parcela Venda #${receivable.saleNumber} (${receivable.customerName})`,
    amount: receivable.amount,
    date: dateStr,
    time: timeStr,
    referenceType: 'RECEIVABLE',
    referenceId: receivable.id,
    userId: admin.id,
    userName: admin.name,
    createdAt: dateStr,
  });

  db.save();

  db.addAuditLog({
    userId: admin.id,
    userName: admin.name,
    userRole: admin.role,
    action: 'BAIXA_CONTA_RECEBER',
    entity: 'FINANCEIRO',
    entityId: receivable.id,
    previousValue: 'PENDENTE',
    newValue: 'PAGO',
    description: `${admin.name} confirmou recebimento da venda #${receivable.saleNumber} no valor de R$ ${receivable.amount.toFixed(2)}.`,
  });

  res.json({ success: true, receivable });
});

apiRouter.get('/financial/cashflow', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const snapshot = db.getSnapshot();
  const movements = snapshot.cashMovements;

  let totalEntradas = 0;
  let totalSaidas = 0;

  movements.forEach((m) => {
    if (m.type === 'ENTRADA') totalEntradas += m.amount;
    if (m.type === 'SAIDA') totalSaidas += m.amount;
  });

  const saldo = totalEntradas - totalSaidas;

  res.json({
    totalEntradas,
    totalSaidas,
    saldo,
    movements,
  });
});

// ==========================================
// 9. DASHBOARD & REPORTS (ADMIN & SELLER)
// ==========================================

apiRouter.get('/dashboard/admin', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as string) || 'month';
  const snapshot = db.getSnapshot();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Date filters
  const filterByDays = (dateStr: string, daysBack: number) => {
    const target = new Date(dateStr);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysBack);
    return target >= threshold;
  };

  const salesCompleted = snapshot.sales.filter((s) => s.status === 'FINALIZADA');

  // Revenue metrics
  const revenueToday = salesCompleted
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + s.total, 0);

  const revenueWeek = salesCompleted
    .filter((s) => filterByDays(s.date, 7))
    .reduce((acc, s) => acc + s.total, 0);

  const revenueMonth = salesCompleted
    .filter((s) => filterByDays(s.date, 30))
    .reduce((acc, s) => acc + s.total, 0);

  // Selected period filtering
  let periodSales = salesCompleted;
  if (period === 'today') {
    periodSales = salesCompleted.filter((s) => s.date === todayStr);
  } else if (period === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    periodSales = salesCompleted.filter((s) => s.date === yStr);
  } else if (period === '7days') {
    periodSales = salesCompleted.filter((s) => filterByDays(s.date, 7));
  } else if (period === '30days' || period === 'month') {
    periodSales = salesCompleted.filter((s) => filterByDays(s.date, 30));
  }

  const revenueSelectedPeriod = periodSales.reduce((acc, s) => acc + s.total, 0);
  const costOfGoodsSold = periodSales.reduce((acc, s) => acc + (s.costTotal || 0), 0);
  const grossProfit = revenueSelectedPeriod - costOfGoodsSold;
  const salesCount = periodSales.length;
  const averageTicket = salesCount > 0 ? Number((revenueSelectedPeriod / salesCount).toFixed(2)) : 0;

  // Expenses in period
  const expensesPaid = snapshot.accountsPayable
    .filter((p) => p.status === 'PAGO' && p.category !== 'FORNECEDOR')
    .reduce((acc, p) => acc + p.amount, 0);

  const estimatedNetProfit = grossProfit - expensesPaid;

  // Real-time Alerts
  const lowStockProducts = snapshot.products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockProducts = snapshot.products.filter((p) => p.currentStock === 0);

  const activeBatches = snapshot.batches.filter((b) => b.currentQuantity > 0);
  const expiredBatches = activeBatches.filter((b) => getDaysRemaining(b.expiryDate) < 0);
  const expiring7DaysBatches = activeBatches.filter((b) => {
    const d = getDaysRemaining(b.expiryDate);
    return d >= 0 && d <= 7;
  });
  const expiring30DaysBatches = activeBatches.filter((b) => {
    const d = getDaysRemaining(b.expiryDate);
    return d >= 0 && d <= 30;
  });

  const overduePayables = snapshot.accountsPayable.filter((p) => p.status === 'PENDENTE' && getDaysRemaining(p.dueDate) < 0);
  const upcomingPayables = snapshot.accountsPayable.filter((p) => {
    const d = getDaysRemaining(p.dueDate);
    return p.status === 'PENDENTE' && d >= 0 && d <= 7;
  });

  // Top products sold
  const productSalesMap: Record<string, { name: string; brand: string; quantity: number; total: number }> = {};
  periodSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          brand: '',
          quantity: 0,
          total: 0,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].total += item.totalPrice;
    });
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Sales by seller
  const sellerSalesMap: Record<string, { name: string; count: number; total: number }> = {};
  periodSales.forEach((s) => {
    if (!sellerSalesMap[s.sellerId]) {
      sellerSalesMap[s.sellerId] = { name: s.sellerName, count: 0, total: 0 };
    }
    sellerSalesMap[s.sellerId].count += 1;
    sellerSalesMap[s.sellerId].total += s.total;
  });

  // Sales by payment method
  const paymentMethodMap: Record<string, number> = {};
  periodSales.forEach((s) => {
    paymentMethodMap[s.paymentMethod] = (paymentMethodMap[s.paymentMethod] || 0) + s.total;
  });

  const productsSoldIds = new Set(periodSales.flatMap((s) => s.items.map((it) => it.productId)));
  const stagnantProducts = snapshot.products.filter((p) => p.currentStock > 0 && !productsSoldIds.has(p.id));

  res.json({
    metrics: {
      period,
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueSelectedPeriod,
      salesCount,
      averageTicket,
      costOfGoodsSold,
      grossProfit,
      expensesTotal: expensesPaid,
      estimatedNetProfit,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringIn7DaysCount: expiring7DaysBatches.length,
      expiringIn30DaysCount: expiring30DaysBatches.length,
      expiredCount: expiredBatches.length,
      overduePayablesCount: overduePayables.length,
      upcomingPayablesCount: upcomingPayables.length,
      stagnantProductsCount: stagnantProducts.length,
    },
    alerts: {
      lowStock: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        boxSku: p.boxSku || p.sku,
        individualCode: p.individualCode || p.barcode,
        stock: p.currentStock,
        min: p.minStock,
      })),
      outOfStock: outOfStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        boxSku: p.boxSku || p.sku,
        individualCode: p.individualCode || p.barcode,
      })),
      expired: expiredBatches.map((b) => ({
        batchNumber: b.batchNumber,
        productName: snapshot.products.find((p) => p.id === b.productId)?.name,
        days: getDaysRemaining(b.expiryDate),
      })),
      expiringSoon: expiring7DaysBatches.map((b) => ({
        batchNumber: b.batchNumber,
        productName: snapshot.products.find((p) => p.id === b.productId)?.name,
        days: getDaysRemaining(b.expiryDate),
      })),
      overduePayables: overduePayables.map((p) => ({
        description: p.description,
        amount: p.amount,
        dueDate: p.dueDate,
      })),
    },
    charts: {
      topProducts,
      salesBySeller: Object.values(sellerSalesMap),
      salesByPaymentMethod: paymentMethodMap,
    },
  });
});

// Global System Alerts (Low Stock Replenishment, Expired Batches, etc.)
apiRouter.get('/alerts', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = db.getSnapshot();
    const lowStock = snapshot.products.filter((p) => p.currentStock <= p.minStock);
    const activeBatches = snapshot.batches.filter((b) => b.currentQuantity > 0);
    const expiredBatches = activeBatches.filter((b) => getDaysRemaining(b.expiryDate) < 0);
    const expiringSoonBatches = activeBatches.filter((b) => {
      const d = getDaysRemaining(b.expiryDate);
      return d >= 0 && d <= 7;
    });
    const overduePayables = snapshot.accountsPayable.filter(
      (p) => p.status === 'PENDENTE' && getDaysRemaining(p.dueDate) < 0
    );

    res.json({
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        boxSku: p.boxSku || p.sku,
        individualCode: p.individualCode || p.barcode,
        stock: p.currentStock,
        min: p.minStock,
      })),
      expiredBatches,
      expiringSoonBatches,
      overduePayables,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter alertas' });
  }
});

// Seller Dashboard (For Vendedores - Only shows personal performance & customer info)
apiRouter.get('/dashboard/seller', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();
  const todayStr = new Date().toISOString().split('T')[0];

  const mySales = snapshot.sales.filter((s) => s.sellerId === user.id && s.status === 'FINALIZADA');
  const mySalesToday = mySales.filter((s) => s.date === todayStr);

  const totalSoldToday = mySalesToday.reduce((acc, s) => acc + s.total, 0);
  const totalSoldMonth = mySales.reduce((acc, s) => acc + s.total, 0);
  const countSales = mySales.length;
  const ticketMedio = countSales > 0 ? Number((totalSoldMonth / countSales).toFixed(2)) : 0;

  // Personal top products
  const productMap: Record<string, { name: string; quantity: number; total: number }> = {};
  mySales.forEach((s) => {
    s.items.forEach((it) => {
      if (!productMap[it.productId]) {
        productMap[it.productId] = { name: it.productName, quantity: 0, total: 0 };
      }
      productMap[it.productId].quantity += it.quantity;
      productMap[it.productId].total += it.totalPrice;
    });
  });

  res.json({
    sellerName: user.name,
    totalSoldToday,
    totalSoldMonth,
    countSales,
    ticketMedio,
    recentSales: mySales.slice(0, 5),
    topProductsSold: Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  });
});

// ==========================================
// 10. AUDIT LOGS & SETTINGS (ADMIN ONLY)
// ==========================================

apiRouter.get('/audit', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().auditLogs);
});

apiRouter.get('/settings', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSnapshot().settings);
});

apiRouter.put('/settings', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const snapshot = db.getSnapshot();
  Object.assign(snapshot.settings, req.body);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALTERAR_CONFIGURAÇÕES',
    entity: 'CONFIGURAÇÕES',
    entityId: 'settings',
    description: `${req.user!.name} atualizou as configurações gerais da loja.`,
  });

  res.json(snapshot.settings);
});

// Database status & health
apiRouter.get('/database/status', authenticate, async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'ONLINE',
    provider: 'Google Cloud SQL (PostgreSQL 17)',
    instance: 'ai-studio-71958d98',
    region: 'us-east1',
    orm: 'Drizzle ORM',
    authProvider: 'Firebase Authentication & RBAC',
    tables: [
      'users',
      'products',
      'batches',
      'customers',
      'suppliers',
      'purchases',
      'sales',
      'financial_transactions',
      'stock_movements',
      'audit_logs',
      'store_settings'
    ]
  });
});

// Supabase configuration status & diagnostics
apiRouter.get('/database/supabase-status', authenticate, async (_req: AuthenticatedRequest, res: Response) => {
  const status = getSupabaseStatus();
  res.json(status);
});

// Supabase ping / test connection
apiRouter.get('/database/supabase-test', authenticate, async (_req: AuthenticatedRequest, res: Response) => {
  if (!isSupabaseConfigured()) {
    res.status(400).json({
      success: false,
      message: 'SUPABASE_URL e SUPABASE_ANON_KEY não estão configurados no ambiente. Configure no painel de Segredos/Settings.'
    });
    return;
  }

  try {
    const supabase = getSupabase();
    const resolvedUrl = getSupabaseStatus().projectUrl;

    // Test basic query to public.users or health check
    const { data, error } = await supabase.from('users').select('id, name, role').limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        // Connected and authenticated successfully, but tables haven't been created yet!
        res.json({
          success: true,
          authenticated: true,
          needsSchema: true,
          projectUrl: resolvedUrl,
          message: `Chaves de API validadas com SUCESSO no Supabase (${resolvedUrl})! A API REST está respondendo, porém as tabelas ainda precisam ser criadas. Copie o script SQL e execute no SQL Editor do Supabase.`,
          error,
        });
        return;
      }

      res.json({
        success: false,
        authenticated: false,
        message: `Conectou ao Supabase (${resolvedUrl}), mas a API retornou: ${error.message} (Código: ${error.code}).`,
        error,
      });
      return;
    }

    res.json({
      success: true,
      authenticated: true,
      needsSchema: false,
      projectUrl: resolvedUrl,
      message: `Conexão com o Supabase estabelecida e tabelas validadas com sucesso (${resolvedUrl})!`,
      sampleData: data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Falha ao conectar ao Supabase.',
    });
  }
});

// Clear fictitious data endpoint (Admin only)
apiRouter.post('/database/clear-fictitious-data', authenticate, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    db.clearFictitiousData();
    res.json({
      success: true,
      message: 'Todos os dados fictícios foram removidos com sucesso. A base de dados está limpa e pronta para receber novos cadastros reais.',
      snapshot: {
        productsCount: 0,
        salesCount: 0,
        batchesCount: 0,
        customersCount: 0,
        suppliersCount: 0,
        purchasesCount: 0,
        accountsPayableCount: 0,
        accountsReceivableCount: 0,
        cashMovementsCount: 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Erro ao limpar dados fictícios'
    });
  }
});


