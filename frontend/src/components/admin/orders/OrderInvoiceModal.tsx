'use client';

import React from 'react';
import {
  X,
  Printer,
  PenTool,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Order } from '@/types/order';
import { formatLKR } from '@/lib/currency';

interface OrderInvoiceModalProps {
  order: Order | any;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const customizedItems = (order.items || []).filter((item: any) => Boolean(item.customization));
  const hasCustomization = customizedItems.length > 0;

  const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order.orderNumber || order.id?.slice(-6).toUpperCase()}`;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Floating Top Controls (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#FFD21C]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Commercial Invoice &amp; Engraving Work Order
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Body */}
        <div id="printable-invoice-content" className="p-8 sm:p-12 text-slate-900 space-y-8 bg-white print:p-6 print:text-black">
          
          {/* 1. Header & Company Brand Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#08275E] text-white flex items-center justify-center font-black text-xl tracking-tighter">
                  DSL
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#08275E] tracking-tight">
                    DSL STATIONERY (PVT) LTD
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Official Sri Lanka Stationery &amp; Personalised Writing Instruments
                  </p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p>No. 117, Colombo Road, Colombo 03, Sri Lanka</p>
                <p>Hotline: +94 114 963 069 | Support: info@dsl.lk</p>
                <p className="font-mono text-[11px] text-slate-500">VAT / Business Reg No: PV 00294182</p>
              </div>
            </div>

            {/* Invoice Meta Box */}
            <div className="sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 print:bg-transparent print:border print:p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0066CC] block">
                TAX INVOICE &amp; DISPATCH NOTE
              </span>
              <h2 className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {invoiceNumber}
              </h2>
              <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                <p>Order Ref: <strong className="font-mono text-slate-800">#{order.orderNumber}</strong></p>
                <p>Date: <span>{formattedDate}</span></p>
                <p>
                  Payment: <strong className="uppercase">{order.paymentMethod?.replace(/_/g, ' ')}</strong> ({order.paymentStatus})
                </p>
              </div>
            </div>
          </div>

          {/* 2. Customer & Shipping Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs print:bg-transparent print:border">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                Billed &amp; Delivered To:
              </span>
              <h3 className="font-black text-sm text-slate-900">
                {order.shippingAddress?.fullName || 'Valued DSL Customer'}
              </h3>
              <p className="text-slate-600 mt-1">{order.shippingAddress?.phone}</p>
              {order.shippingAddress?.email && (
                <p className="text-slate-600">{order.shippingAddress?.email}</p>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                Shipping Destination:
              </span>
              <div className="text-slate-700 space-y-0.5">
                <p className="font-medium">{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.district} District
                  {order.shippingAddress?.postalCode ? ` - ${order.shippingAddress?.postalCode}` : ''}
                </p>
                <p className="text-slate-500 font-semibold mt-1">Delivery: Standard Island-Wide Courier Service</p>
              </div>
            </div>
          </div>

          {/* 3. Items Ordered Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Ordered Items &amp; Charges Breakdown
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl print:rounded-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Item &amp; Description</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item: any, idx: number) => {
                    const hasCustom = Boolean(item.customization);
                    const unitPrice = item.unitPriceCents || item.product?.priceCents || 0;
                    const lineTotal = item.totalPriceCents || unitPrice * item.quantity;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {item.productName || item.product?.name}
                          </span>
                          {item.variantName && (
                            <span className="text-[11px] text-slate-500 block">
                              Variant: {item.variantName}
                            </span>
                          )}
                          {hasCustom && (
                            <div className="mt-1 p-1.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[11px] text-[#08275E]">
                              <span className="font-bold">Engraving: &ldquo;{item.customization.engravingText}&rdquo;</span>
                              <span className="text-slate-500 ml-2">({item.customization.font} • {item.customization.position})</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {item.sku || item.product?.sku || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-medium">
                          {formatLKR(unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {formatLKR(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. DEDICATED LASER ENGRAVING WORK ORDER & JOB TICKET (If Order Has Customized Items) */}
          {hasCustomization && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-slate-900 space-y-4 print:border-2 print:border-black print:bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200 print:border-black">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 print:text-black">
                      LASER ENGRAVING WORK ORDER &amp; OPERATOR JOB TICKET
                    </h4>
                    <p className="text-[10px] text-amber-700 print:text-black">
                      Execute engraving per exact customer specifications below. Inspect before packing.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-200 px-2.5 py-1 rounded-full text-amber-900 border border-amber-300">
                  WORK ORDER: #{order.orderNumber}-ENG
                </span>
              </div>

              {/* Engraving Specs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white rounded-xl border border-amber-200 overflow-hidden print:border-black">
                  <thead className="bg-amber-100/70 text-amber-950 font-bold uppercase text-[10px] tracking-wider border-b border-amber-200 print:bg-slate-200 print:border-black">
                    <tr>
                      <th className="py-2 px-3">Pen Model</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Exact Laser Engraving Text</th>
                      <th className="py-2 px-3">Typography Font</th>
                      <th className="py-2 px-3">Engraving Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 print:divide-black">
                    {customizedItems.map((item: any, idx: number) => (
                      <tr key={idx} className="font-medium">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.productName || item.product?.name}
                        </td>
                        <td className="py-2.5 px-3 font-black text-center text-amber-900 print:text-black">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-black text-sm bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 text-slate-950 block print:bg-transparent print:border-black">
                            &ldquo;{item.customization.engravingText}&rdquo;
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Length: {item.customization.engravingText.length} characters
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#08275E] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.customization.font}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Pen {item.customization.position}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quality Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[10px] text-slate-600 print:text-black border-t border-amber-200 print:border-black">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded print:border-black"></div>
                  <span>1. Spelling Verified Against Ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded print:border-black"></div>
                  <span>2. Laser Focus &amp; Alignment Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border border-slate-400 rounded print:border-black"></div>
                  <span>3. Cleaned &amp; Sealed in DSL Sleeve</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-amber-200/80 print:border-black">
                <span>Laser Machine Operator Signature: ___________________________</span>
                <span>Date: ________________</span>
              </div>
            </div>
          )}

          {/* 5. Financial Totals & Sign-off */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 space-y-1 max-w-sm">
              <p className="font-bold text-slate-700">Terms &amp; Fulfilment Policy:</p>
              <p>• Customised / engraved products are permanently tailored per customer order instructions.</p>
              <p>• Standard stationery items may be exchanged within 7 days in original sealed condition.</p>
              <p className="font-semibold text-[#08275E] pt-1">Thank you for choosing DSL Stationery!</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Items)</span>
                <span className="font-medium text-slate-900">{formatLKR(order.subtotalCents)}</span>
              </div>

              {order.discountCents > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discounts Applied</span>
                  <span>- {formatLKR(order.discountCents)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Island-Wide Delivery</span>
                <span className="font-medium text-slate-900">
                  {order.deliveryCents === 0 ? 'FREE' : formatLKR(order.deliveryCents)}
                </span>
              </div>

              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-[#08275E]">
                <span>Total Amount Paid / Due</span>
                <span>{formatLKR(order.totalCents)}</span>
              </div>

              <div className="pt-2 text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  order.paymentStatus === 'PAID' || order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  Payment Status: {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
