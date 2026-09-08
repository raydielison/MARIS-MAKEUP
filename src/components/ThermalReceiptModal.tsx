import React, { useState, useEffect } from 'react';
import { Sale, StoreSettings } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Printer,
  X,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ReceiptText
} from 'lucide-react';

interface ThermalReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  title?: string;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  onClose,
  title = 'Comprovante da Venda',
}) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.error('Erro ao carregar configurações da loja para o cupom:', err);
      }
    };
    fetchSettings();
  }, []);

  if (!sale) return null;

  const formatCurrency = (val: number = 0) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const storeName = settings?.storeName || settings?.tradeName || 'MARIS MAKEUP';
  const storeCnpj = settings?.cnpj || '33.987.654/0001-22';
  const storeAddress = settings?.address || 'Av. Paulista, 1200 - São Paulo - SP';
  const storePhone = settings?.phone || settings?.whatsapp || '(11) 98765-4321';
  const footerMsg = settings?.receiptFooter || 'Obrigada pela preferência! Volte sempre ✨';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const itemsText = sale.items
      .map(
        (it) =>
          `• ${it.quantity}x ${it.productName}${it.shade ? ` (${it.shade})` : ''} - ${formatCurrency(
            it.totalPrice
          )}`
      )
      .join('\n');

    const text = `🛍️ *${storeName.toUpperCase()}*
📄 *CUPOM NÃO FISCAL*
🔢 *VENDA Nº #${sale.saleNumber}*
📅 Data: ${sale.date} às ${sale.time}
👤 Cliente: ${sale.customerName || 'Cliente Balcão'}
💼 Atendente: ${sale.sellerName}
----------------------------------
*ITENS:*
${itemsText}
----------------------------------
Subtotal: ${formatCurrency(sale.subtotal)}
${sale.discount > 0 ? `Desconto: -${formatCurrency(sale.discount)}\n` : ''}*TOTAL: ${formatCurrency(
      sale.total
    )}*
Forma de Pagto: ${sale.paymentMethod}${sale.installments && sale.installments > 1 ? ` (${sale.installments}x)` : ''}
${sale.change && sale.change > 0 ? `Troco: ${formatCurrency(sale.change)}\n` : ''}----------------------------------
${footerMsg}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{title}</h3>
              <p className="text-[11px] text-pink-600 font-semibold font-mono">
                Venda #{sale.saleNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Ticket */}
        <div
          id="thermal-receipt-print-area"
          className="bg-slate-50 text-slate-900 p-4 rounded-xl shadow-inner font-mono text-[11px] space-y-2 border border-slate-300 max-h-[60vh] overflow-y-auto"
        >
          {/* Store Info */}
          <div className="text-center pb-2 flex flex-col items-center">
            <img
              src="/favicon.png"
              alt="Logo Maris Makeup"
              className="w-10 h-10 object-contain mb-1 rounded-md"
              referrerPolicy="no-referrer"
            />
            <div className="font-extrabold text-sm tracking-wider text-slate-950 uppercase">
              {storeName}
            </div>
            {storeCnpj && <div className="text-[10px] text-slate-600">CNPJ: {storeCnpj}</div>}
            {storeAddress && <div className="text-[10px] text-slate-600">{storeAddress}</div>}
            {storePhone && <div className="text-[10px] text-slate-600">Tel/Whats: {storePhone}</div>}
          </div>

          {/* Cupom Header & Number */}
          <div className="border-t border-b border-dashed border-slate-400 py-2 my-1 text-center bg-white/60 rounded">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
              CUPOM NÃO FISCAL
            </div>
            <div className="text-base font-black tracking-tight text-slate-950 mt-0.5">
              VENDA Nº #{sale.saleNumber}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {sale.date} às {sale.time}
            </div>
          </div>

          {/* Attendant & Customer */}
          <div className="text-[10px] text-slate-800 space-y-0.5 py-1">
            <div className="flex justify-between">
              <span className="text-slate-500">VENDEDOR(A):</span>
              <span className="font-semibold text-right truncate max-w-[170px]">{sale.sellerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CLIENTE:</span>
              <span className="font-semibold text-right truncate max-w-[170px]">
                {sale.customerName || 'Cliente Balcão'}
              </span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">CONTATO:</span>
                <span className="font-mono text-slate-700">{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Items Header */}
          <div className="border-t border-dashed border-slate-400 pt-1.5 pb-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase border-b border-dashed border-slate-300 pb-1 mb-1">
              <span>ITEM / PRODUTO</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-1.5">
              {sale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-950 truncate">
                      {it.quantity}x {it.productName}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {it.shade ? `Cor: ${it.shade} • ` : ''}
                      Un: {formatCurrency(it.unitPrice)}
                    </div>
                  </div>
                  <span className="font-bold text-slate-950 whitespace-nowrap">
                    {formatCurrency(it.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-right text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>DESCONTO:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-300">
              <span>TOTAL A PAGAR:</span>
              <span className="text-pink-700">{formatCurrency(sale.total)}</span>
            </div>

            <div className="flex justify-between text-slate-700 text-[10px] pt-1">
              <span className="text-slate-500">FORMA PAGTO:</span>
              <span className="font-bold uppercase">
                {sale.paymentMethod}
                {sale.installments && sale.installments > 1 ? ` (${sale.installments}x)` : ''}
              </span>
            </div>

            {sale.change && sale.change > 0 ? (
              <div className="flex justify-between text-slate-700 text-[10px]">
                <span className="text-slate-500">TROCO:</span>
                <span className="font-bold font-mono">{formatCurrency(sale.change)}</span>
              </div>
            ) : null}
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="border-t border-dashed border-slate-300 pt-1.5 text-[9px] text-slate-600 italic">
              Obs: {sale.notes}
            </div>
          )}

          {/* Footer Receipt Message */}
          <div className="border-t border-dashed border-slate-400 pt-2 pb-1 text-center space-y-1">
            <div className="text-[10px] font-medium text-slate-700">{footerMsg}</div>
            <div className="text-[9px] text-slate-400 font-mono">
              Controle: VND-#{sale.saleNumber} • Sistema Maris PDV
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={handlePrint}
            id="btn-print-receipt"
            className="flex-1 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom</span>
          </button>

          <button
            onClick={handleCopyText}
            id="btn-copy-receipt-whatsapp"
            className="py-2.5 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center space-x-1.5 transition"
            title="Copiar cupom formatado para enviar no WhatsApp"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>WhatsApp</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
