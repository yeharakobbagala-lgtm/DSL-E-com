import * as path from 'path';
import * as fs from 'fs';

export interface OrderConfirmationEmailItem {
  productId: string;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  imageUrl?: string | null;
  customization?: {
    engravingText?: string;
    font?: string;
    position?: string;
  } | null;
}

export interface OrderConfirmationEmailData {
  orderId: string;
  orderNumber: string;
  orderDate?: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  promoCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    district?: string;
    postalCode?: string | null;
    province?: string | null;
    deliveryNotes?: string | null;
  } | string;
  orderUrl: string;
  items: OrderConfirmationEmailItem[];
  frontendUrl?: string;
}

export interface GeneratedEmail {
  html: string;
  text: string;
  attachments: Array<{
    filename: string;
    path: string;
    cid: string;
    contentType?: string;
  }>;
}

/**
 * Format currency in Sri Lankan Rupees (LKR)
 */
function formatLKR(cents: number): string {
  const amount = (cents / 100).toFixed(2);
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format human-readable payment method
 */
function formatPaymentMethod(method: string): string {
  const m = (method || '').toUpperCase();
  if (m === 'CASH_ON_DELIVERY') return 'Cash on Delivery';
  if (m === 'BANK_TRANSFER') return 'Direct Bank Transfer';
  if (m === 'CARD_PAYHERE') return 'PayHere Online Card';
  return method || 'Cash on Delivery';
}

/**
 * Format payment status badge
 */
function formatPaymentStatus(status: string): { label: string; bg: string; text: string } {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') {
    return { label: 'PAID', bg: '#DCFCE7', text: '#15803D' };
  }
  if (s === 'CONFIRMED') {
    return { label: 'CONFIRMED', bg: '#E0F2FE', text: '#0369A1' };
  }
  return { label: 'PAYMENT PENDING', bg: '#FEF3C7', text: '#B45309' };
}

/**
 * Format order date
 */
function formatOrderDate(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generates the complete, responsive, table-based HTML email for order confirmation.
 * Fully compatible with Gmail (Desktop, Android, iOS), Apple Mail, and Outlook.
 */
export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData): GeneratedEmail {
  const attachments: Array<{ filename: string; path: string; cid: string; contentType?: string }> = [];

  // Determine asset base directory in backend
  const backendAssetsDir = path.resolve(__dirname, '../../../assets/email');
  const frontendPublicDir = path.resolve(process.cwd(), '../frontend/public');

  // 1. Logo
  const logoPath = fs.existsSync(path.join(backendAssetsDir, 'dsl-logo.png'))
    ? path.join(backendAssetsDir, 'dsl-logo.png')
    : path.join(frontendPublicDir, 'images/dsl-logo-official.png');
  const logoCid = 'dsl-logo@dslstationery.lk';
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'dsl-logo.png',
      path: logoPath,
      cid: logoCid,
      contentType: 'image/png',
    });
  }

  // 2. Success Bag Illustration
  const bagPath = path.join(backendAssetsDir, 'order-success-bag.png');
  const bagCid = 'order-success-bag@dslstationery.lk';
  if (fs.existsSync(bagPath)) {
    attachments.push({
      filename: 'order-success-bag.png',
      path: bagPath,
      cid: bagCid,
      contentType: 'image/png',
    });
  }

  // 3. Stationery Header Banner
  const headerPath = path.join(backendAssetsDir, 'stationery-header.png');
  const headerCid = 'stationery-header@dslstationery.lk';
  if (fs.existsSync(headerPath)) {
    attachments.push({
      filename: 'stationery-header.png',
      path: headerPath,
      cid: headerCid,
      contentType: 'image/png',
    });
  }

  // 4. Decorative Waves Footer
  const wavesPath = path.join(backendAssetsDir, 'decorative-waves.png');
  const wavesCid = 'decorative-waves@dslstationery.lk';
  if (fs.existsSync(wavesPath)) {
    attachments.push({
      filename: 'decorative-waves.png',
      path: wavesPath,
      cid: wavesCid,
      contentType: 'image/png',
    });
  }

  // 5. Default Product Fallback
  const defaultProductPath = fs.existsSync(path.join(backendAssetsDir, 'default-product.png'))
    ? path.join(backendAssetsDir, 'default-product.png')
    : path.join(frontendPublicDir, 'products/default.png');
  const defaultProductCid = 'default-product@dslstationery.lk';
  if (fs.existsSync(defaultProductPath)) {
    attachments.push({
      filename: 'default-product.png',
      path: defaultProductPath,
      cid: defaultProductCid,
      contentType: 'image/png',
    });
  }

  // Process items and map item image attachments
  const itemRowsHtml = data.items
    .map((item, idx) => {
      let itemImgCid = defaultProductCid;

      if (item.imageUrl) {
        // Strip leading slash or query strings
        const cleanRelPath = item.imageUrl.replace(/^\/+/, '').split('?')[0];
        const localProdPath = path.join(frontendPublicDir, cleanRelPath);

        if (fs.existsSync(localProdPath)) {
          const itemCid = `product-${idx}-${path.basename(localProdPath)}@dslstationery.lk`;
          attachments.push({
            filename: path.basename(localProdPath),
            path: localProdPath,
            cid: itemCid,
            contentType: 'image/png',
          });
          itemImgCid = itemCid;
        }
      }

      const unitFormatted = formatLKR(item.unitPriceCents);
      const totalFormatted = formatLKR(item.totalPriceCents);

      const variantBadge = item.variantName
        ? `<div style="font-size: 12px; color: #0284C7; background-color: #E0F2FE; display: inline-block; padding: 2px 8px; border-radius: 4px; margin-top: 4px; font-weight: 600;">${escapeHtml(item.variantName)}</div>`
        : '';

      const customizationBadge = item.customization?.engravingText
        ? `<div style="font-size: 11px; color: #B45309; background-color: #FEF3C7; padding: 3px 8px; border-radius: 4px; margin-top: 4px; font-family: monospace;">🖋️ Engraved: "${escapeHtml(item.customization.engravingText)}" (${escapeHtml(item.customization.font || 'Standard')})</div>`
        : '';

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #F1F5F9;" valign="top">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="64" valign="top" style="padding-right: 14px;">
                  <img src="cid:${itemImgCid}" alt="${escapeHtml(item.productName)}" width="60" height="60" style="display: block; width: 60px; height: 60px; object-fit: contain; border-radius: 8px; border: 1px solid #E2E8F0; background-color: #F8FAFC;" />
                </td>
                <td valign="top" style="font-family: Arial, Helvetica, sans-serif;">
                  <div style="font-size: 14px; font-weight: 700; color: #1E293B; line-height: 1.3;">
                    ${escapeHtml(item.productName)}
                  </div>
                  ${variantBadge}
                  ${customizationBadge}
                  <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
                    Qty: <strong>${item.quantity}</strong> × ${unitFormatted}
                  </div>
                </td>
                <td width="100" align="right" valign="top" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: #08275E; white-space: nowrap;">
                  ${totalFormatted}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  // Delivery Address formatting
  let addressHtml = '';
  if (typeof data.deliveryAddress === 'string') {
    addressHtml = `<p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">${escapeHtml(data.deliveryAddress)}</p>`;
  } else if (data.deliveryAddress) {
    const a = data.deliveryAddress;
    const lines = [
      a.fullName ? `<strong>${escapeHtml(a.fullName)}</strong>` : '',
      a.phone ? `Phone: ${escapeHtml(a.phone)}` : '',
      a.addressLine1 ? escapeHtml(a.addressLine1) : '',
      a.addressLine2 ? escapeHtml(a.addressLine2) : '',
      [a.city, a.district].filter(Boolean).map(escapeHtml).join(', '),
      [a.province, a.postalCode].filter(Boolean).map(escapeHtml).join(' '),
    ].filter(Boolean);

    addressHtml = lines.map((l) => `<div style="font-size: 13px; color: #334155; line-height: 1.4;">${l}</div>`).join('');
    if (a.deliveryNotes) {
      addressHtml += `<div style="font-size: 12px; color: #64748B; margin-top: 6px; font-style: italic;">Note: ${escapeHtml(a.deliveryNotes)}</div>`;
    }
  }

  // Price calculations
  const subtotalFormatted = formatLKR(data.subtotalCents);
  const deliveryFormatted = data.deliveryFeeCents === 0 ? '<span style="color: #15803D; font-weight: bold;">FREE</span>' : formatLKR(data.deliveryFeeCents);
  const totalFormatted = formatLKR(data.totalCents);
  const paymentBadge = formatPaymentStatus(data.paymentStatus);
  const paymentMethodName = formatPaymentMethod(data.paymentMethod);
  const formattedDate = formatOrderDate(data.orderDate);

  const discountRow = data.discountCents > 0
    ? `
      <tr>
        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #15803D; padding: 4px 0;">
          Discount Applied ${data.promoCode ? `(${escapeHtml(data.promoCode)})` : ''}
        </td>
        <td align="right" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #15803D;">
          -${formatLKR(data.discountCents)}
        </td>
      </tr>
    `
    : '';

  // FULL TABLE-BASED HTML EMAIL FOR GMAIL (Clean white background, royal blue palette, subtle gold accents)
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Order #${escapeHtml(data.orderNumber)} Confirmation - DSL Stationery</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Outer Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F8FAFC" style="background-color: #F8FAFC; width: 100%; margin: 0; padding: 24px 0 36px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container (Max 600px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0, 102, 204, 0.08);">
          
          <!-- Decorative Top Header Banner -->
          <tr>
            <td align="center" style="background-color: #F0F9FF; line-height: 0;">
              <img src="cid:${headerCid}" alt="DSL Stationery Header" width="600" height="90" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
            </td>
          </tr>

          <!-- DSL Official Logo -->
          <tr>
            <td align="center" style="padding: 24px 24px 10px 24px;">
              <a href="${data.frontendUrl || 'https://dslstationery.lk'}" target="_blank" style="text-decoration: none;">
                <img src="cid:${logoCid}" alt="DSL Stationery" width="180" style="display: block; max-width: 180px; width: 100%; height: auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Success Icon & Thank You Section -->
          <tr>
            <td align="center" style="padding: 10px 32px 24px 32px; font-family: Arial, Helvetica, sans-serif;">
              <!-- Shopping Bag with Confirmation Checkmark -->
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center">
                    <img src="cid:${bagCid}" alt="Order Placed Successfully" width="110" height="110" style="display: block; width: 110px; height: 110px; border: 0; margin: 0 auto;" />
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="color: #08275E; font-size: 24px; font-weight: 800; margin: 16px 0 6px 0; letter-spacing: -0.3px;">
                Thank You for Your Order!
              </h1>
              
              <p style="color: #64748B; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
                Hello <strong>${escapeHtml(data.customerName)}</strong>, your order has been confirmed and our warehouse is carefully packaging your stationery items.
              </p>

              <!-- Order Summary Meta Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#F0F7FF" style="background-color: #F0F7FF; border: 1px solid #C6E7FF; border-radius: 12px; padding: 16px;">
                <tr>
                  <td width="50%" align="left" valign="top" style="font-family: Arial, Helvetica, sans-serif; padding: 4px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.5px;">Order Number</div>
                    <div style="font-size: 16px; font-weight: 800; color: #0066CC; margin-top: 2px;">#${escapeHtml(data.orderNumber)}</div>
                  </td>
                  <td width="50%" align="right" valign="top" style="font-family: Arial, Helvetica, sans-serif; padding: 4px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.5px;">Order Date</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1E293B; margin-top: 2px;">${formattedDate}</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" align="left" valign="top" style="font-family: Arial, Helvetica, sans-serif; padding: 8px 10px 4px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.5px;">Payment Method</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1E293B; margin-top: 2px;">${escapeHtml(paymentMethodName)}</div>
                  </td>
                  <td width="50%" align="right" valign="top" style="font-family: Arial, Helvetica, sans-serif; padding: 8px 10px 4px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.5px;">Payment Status</div>
                    <div style="display: inline-block; font-size: 11px; font-weight: 700; color: ${paymentBadge.text}; background-color: ${paymentBadge.bg}; padding: 3px 10px; border-radius: 999px; margin-top: 3px;">
                      ${paymentBadge.label}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Product Details Section -->
          <tr>
            <td style="padding: 0 32px 20px 32px; font-family: Arial, Helvetica, sans-serif;">
              <div style="font-size: 15px; font-weight: 800; color: #08275E; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 4px;">
                Order Items (${data.items.reduce((acc, it) => acc + it.quantity, 0)})
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${itemRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Order Summary & Delivery Address Columns -->
          <tr>
            <td style="padding: 0 32px 24px 32px; font-family: Arial, Helvetica, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Left: Delivery Address -->
                  <td width="48%" valign="top" bgcolor="#F8FAFC" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0066CC; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center;">
                      📍 Delivery Address
                    </div>
                    ${addressHtml}
                  </td>

                  <!-- Spacing -->
                  <td width="4%"></td>

                  <!-- Right: Price Breakdown -->
                  <td width="48%" valign="top" bgcolor="#F8FAFC" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #08275E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Price Summary
                    </div>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #64748B; padding: 4px 0;">Subtotal</td>
                        <td align="right" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1E293B;">${subtotalFormatted}</td>
                      </tr>
                      <tr>
                        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #64748B; padding: 4px 0;">Delivery Fee</td>
                        <td align="right" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 600; color: #1E293B;">${deliveryFormatted}</td>
                      </tr>
                      ${discountRow}
                      <tr>
                        <td colspan="2" style="padding: 6px 0;">
                          <div style="border-top: 1px dashed #CBD5E1;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 800; color: #08275E; padding: 4px 0;">Total</td>
                        <td align="right" style="font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 800; color: #0066CC;">${totalFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary Call To Action Button (Bulletproof Table Button for Email Clients) -->
          <tr>
            <td align="center" style="padding: 0 32px 28px 32px; font-family: Arial, Helvetica, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" bgcolor="#0066CC" style="border-radius: 28px; background-color: #0066CC; box-shadow: 0 4px 14px rgba(0, 102, 204, 0.35);">
                    <a href="${data.orderUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 28px; letter-spacing: 0.3px;">
                      View Your Order &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 10px;">
                Or visit: <a href="${data.orderUrl}" style="color: #0066CC; text-decoration: underline; word-break: break-all;">${data.orderUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Support & Assistance Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px; font-family: Arial, Helvetica, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#FFFDF0" style="background-color: #FFFDF0; border: 1px solid #FEF08A; border-radius: 12px; padding: 14px;">
                <tr>
                  <td width="32" valign="middle" style="padding-right: 10px;">
                    <span style="font-size: 22px;">💡</span>
                  </td>
                  <td valign="middle" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #713F12; line-height: 1.5;">
                    <strong>Need help with your order?</strong> Our customer happiness team is available Mon&ndash;Fri, 8:30 AM &ndash; 5:30 PM.<br/>
                    Email us at <a href="mailto:support@dslstationery.lk" style="color: #0066CC; font-weight: bold; text-decoration: none;">support@dslstationery.lk</a> or call <strong style="color: #08275E;">+94 (11) 234-5678</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Decorative Bottom Waves Graphic -->
          <tr>
            <td align="center" style="line-height: 0; background-color: #FFFFFF;">
              <img src="cid:${wavesCid}" alt="Decorative Waves" width="600" height="80" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
            </td>
          </tr>

          <!-- Deep Blue Footer Section -->
          <tr>
            <td bgcolor="#08275E" style="background-color: #08275E; padding: 24px 32px; font-family: Arial, Helvetica, sans-serif; text-align: center;">
              <p style="color: #FFFFFF; font-size: 13px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.5px;">
                DSL Stationery &mdash; Premier Office & School Stationery in Sri Lanka
              </p>
              <p style="color: #94A3B8; font-size: 11px; margin: 0 0 12px 0; line-height: 1.5;">
                DSL Enterprises (Pvt) Ltd. All rights reserved.<br/>
                No. 42, Stationery Avenue, Colombo 03, Sri Lanka.
              </p>
              <div style="font-size: 11px; color: #64748B;">
                This email was sent to <a href="mailto:${escapeHtml(data.customerEmail)}" style="color: #38BDF8; text-decoration: none;">${escapeHtml(data.customerEmail)}</a> regarding order #${escapeHtml(data.orderNumber)}.
              </div>
            </td>
          </tr>

        </table>
        <!-- End Container -->
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // PLAIN TEXT FALLBACK FOR MAXIMUM ACCESSIBILITY & DELIVERABILITY
  const textItems = data.items
    .map(
      (it) =>
        `- ${it.productName}${it.variantName ? ` (${it.variantName})` : ''} x ${it.quantity} @ ${formatLKR(it.unitPriceCents)} = ${formatLKR(it.totalPriceCents)}`
    )
    .join('\n');

  const text = `
DSL Stationery - Order #${data.orderNumber} Confirmation

Dear ${data.customerName},

Thank you for your order with DSL Stationery!
Your order #${data.orderNumber} has been received and confirmed on ${formattedDate}.

ORDER ITEMS:
${textItems}

ORDER SUMMARY:
Subtotal: ${subtotalFormatted}
Delivery Fee: ${data.deliveryFeeCents === 0 ? 'FREE' : formatLKR(data.deliveryFeeCents)}
${data.discountCents > 0 ? `Discount: -${formatLKR(data.discountCents)}\n` : ''}Total: ${totalFormatted}

Payment Method: ${paymentMethodName}
Payment Status: ${data.paymentStatus}

TRACK YOUR ORDER:
${data.orderUrl}

Need assistance? Contact support@dslstationery.lk or call +94 (11) 234-5678.

Best regards,
DSL Stationery Team
https://dslstationery.lk
`;

  return {
    html,
    text,
    attachments,
  };
}

function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
