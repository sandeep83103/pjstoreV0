import { Order } from '../types';
import { uploadToS3, getPresignedDownloadUrl } from '../aws/s3Client';
import { orderRepository } from '../data';
import { env } from '../env';

// GST Legal Details for Parnika Jewellers
export const STORE_GST_CONFIG = {
  legalName: 'Parnika Jewellers',
  tradeName: 'Parnika Jewellers - Fashion & 1-Gram Gold',
  gstin: '36AAECP1234F1Z5',
  state: 'Telangana',
  stateCode: '36',
  address: 'Shop No. 12, Temple Road, Somajiguda, Hyderabad, Telangana - 500082',
  phone: '+91 96772 55036',
  email: 'support@parnikajewellers.com',
  website: 'https://www.parnikajewellers.com',
  defaultHsn: '7117', // HSN 7117: Imitation & Fashion Jewellery
  taxRatePercent: 3,  // Standard 3% GST on jewellery
};

export interface TaxBreakdown {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalWithTax: number;
  isIntraState: boolean;
  hsnCode: string;
}

/**
 * Calculate GST according to Indian Tax Rules (HSN 7117 @ 3%):
 * - Intra-State (Telangana): CGST 1.5% + SGST 1.5%
 * - Inter-State (Outside Telangana): IGST 3.0%
 *
 * In accordance with DEC-20 and EVAL-P6-02:
 * Tax is calculated at order subtotal level to eliminate 1-paise rounding discrepancies.
 */
export function calculateGst(order: Order): TaxBreakdown {
  const customerState = (order.shippingAddress?.state || '').trim().toLowerCase();
  const isIntraState = customerState === 'telangana' || customerState === 'tg';

  // Base taxable amount = subtotal - discount (minimum 0)
  const taxableAmount = Math.max(0, order.subtotal - (order.discount || 0));

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstRate = 1.5;
    sgstRate = 1.5;
    cgstAmount = Math.round(taxableAmount * 0.015);
    sgstAmount = Math.round(taxableAmount * 0.015);
  } else {
    igstRate = 3.0;
    igstAmount = Math.round(taxableAmount * 0.03);
  }

  const totalTax = isIntraState ? cgstAmount + sgstAmount : igstAmount;
  const totalWithTax = taxableAmount + totalTax + (order.shippingFee || 0);

  return {
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    totalWithTax,
    isIntraState,
    hsnCode: STORE_GST_CONFIG.defaultHsn,
  };
}

/**
 * Minimalist, high-performance, specification-compliant PDF builder in pure TypeScript.
 * Generates ISO 32000-1 (PDF 1.4) binary streams without external C++ or node-gyp dependencies.
 */
class SimplePdfDoc {
  private width = 595.28; // A4 pt
  private height = 841.89; // A4 pt
  private streamParts: string[] = [];

  constructor() {
    // Reset graphic state
    this.streamParts.push('q\n');
  }

  private escapePdfText(str: string): string {
    // Replace rupee symbol and non-ascii with readable clean text
    const clean = str
      .replace(/₹/g, 'Rs. ')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    return clean;
  }

  rect(x: number, y: number, w: number, h: number, fillColor?: [number, number, number], strokeColor?: [number, number, number], lineWidth: number = 1): this {
    this.streamParts.push('q\n');
    if (lineWidth) {
      this.streamParts.push(`${lineWidth.toFixed(2)} w\n`);
    }
    if (strokeColor) {
      this.streamParts.push(`${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG\n`);
    }
    if (fillColor) {
      this.streamParts.push(`${fillColor[0].toFixed(3)} ${fillColor[1].toFixed(3)} ${fillColor[2].toFixed(3)} rg\n`);
    }
    this.streamParts.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `);
    if (fillColor && strokeColor) {
      this.streamParts.push('B\n');
    } else if (fillColor) {
      this.streamParts.push('f\n');
    } else {
      this.streamParts.push('S\n');
    }
    this.streamParts.push('Q\n');
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, strokeColor: [number, number, number] = [0.8, 0.8, 0.8], lineWidth: number = 1): this {
    this.streamParts.push('q\n');
    this.streamParts.push(`${lineWidth.toFixed(2)} w\n`);
    this.streamParts.push(`${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG\n`);
    this.streamParts.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`);
    this.streamParts.push('Q\n');
    return this;
  }

  text(
    str: string,
    x: number,
    y: number,
    options: {
      bold?: boolean;
      size?: number;
      color?: [number, number, number];
      align?: 'left' | 'right' | 'center';
      width?: number;
    } = {}
  ): this {
    const font = options.bold ? '/F2' : '/F1';
    const size = options.size || 10;
    const color = options.color || [0.1, 0.1, 0.1];
    const escaped = this.escapePdfText(str);

    let posX = x;
    if (options.align === 'right' && options.width) {
      // Rough character width approximation for standard Helvetica: ~0.52 * size
      const textWidth = str.length * size * 0.52;
      posX = x + options.width - textWidth;
    } else if (options.align === 'center' && options.width) {
      const textWidth = str.length * size * 0.52;
      posX = x + (options.width - textWidth) / 2;
    }

    this.streamParts.push('BT\n');
    this.streamParts.push(`${font} ${size.toFixed(2)} Tf\n`);
    this.streamParts.push(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg\n`);
    this.streamParts.push(`${posX.toFixed(2)} ${y.toFixed(2)} Td\n`);
    this.streamParts.push(`(${escaped}) Tj\n`);
    this.streamParts.push('ET\n');
    return this;
  }

  toBuffer(): Buffer {
    this.streamParts.push('Q\n'); // Close root q
    const contentStream = this.streamParts.join('');
    const contentBytes = Buffer.from(contentStream, 'utf-8');

    // Build standard PDF objects
    const objects: string[] = [];

    // Obj 1: Catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Obj 2: Pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Obj 3: Page (A4 standard)
    objects.push(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width.toFixed(2)} ${this.height.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`
    );

    // Obj 4: Content Stream
    objects.push(
      `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
    );

    // Obj 5: Font Regular (Helvetica)
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    // Obj 6: Font Bold (Helvetica-Bold)
    objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

    // Construct PDF file buffer and compute XREF offsets
    let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets: number[] = [0];

    for (let i = 0; i < objects.length; i++) {
      offsets.push(Buffer.byteLength(body, 'utf-8'));
      body += objects[i];
    }

    const startXref = Buffer.byteLength(body, 'utf-8');
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i++) {
      const offset = (offsets[i] ?? 0).toString().padStart(10, '0');
      body += `${offset} 00000 n \n`;
    }

    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(body, 'utf-8');
  }
}

/**
 * Generate a complete, GST-compliant tax invoice PDF as a binary Buffer.
 */
export async function generateInvoicePdf(order: Order): Promise<Buffer> {
  const tax = calculateGst(order);
  const doc = new SimplePdfDoc();

  // Colors: Emerald, Gold, Dark Charcoal, Muted Gray, Card BG
  const emerald: [number, number, number] = [0.043, 0.231, 0.141]; // #0B3B24
  const deepEmerald: [number, number, number] = [0.024, 0.149, 0.09]; // #062617
  const gold: [number, number, number] = [0.831, 0.686, 0.216]; // #D4AF37
  const charcoal: [number, number, number] = [0.1, 0.1, 0.1];
  const muted: [number, number, number] = [0.4, 0.4, 0.4];
  const tableBg: [number, number, number] = [0.97, 0.97, 0.96];

  // 1. Top Decorative Emerald Bar
  doc.rect(0, 832, 595.28, 10, emerald);
  doc.rect(0, 829, 595.28, 3, gold);

  // 2. Header Section
  doc.text('TAX INVOICE', 40, 800, { bold: true, size: 18, color: deepEmerald });
  doc.text('ORIGINAL FOR RECIPIENT', 40, 788, { bold: false, size: 8, color: muted });

  // Store Brand info (Right aligned)
  doc.text(STORE_GST_CONFIG.legalName, 260, 800, { bold: true, size: 14, color: emerald, align: 'right', width: 295 });
  doc.text(`GSTIN: ${STORE_GST_CONFIG.gstin}`, 260, 786, { bold: true, size: 9, color: charcoal, align: 'right', width: 295 });
  doc.text(STORE_GST_CONFIG.address, 260, 774, { size: 8, color: muted, align: 'right', width: 295 });
  doc.text(`Phone: ${STORE_GST_CONFIG.phone} | Email: ${STORE_GST_CONFIG.email}`, 260, 762, { size: 8, color: muted, align: 'right', width: 295 });

  doc.line(40, 750, 555, 750, gold, 1);

  // 3. Invoice & Order Details Box (Left) vs Shipping Address Box (Right)
  // Left Box: Invoice Meta
  doc.rect(40, 665, 250, 75, tableBg, [0.88, 0.88, 0.88], 0.5);
  doc.text('INVOICE DETAILS', 50, 725, { bold: true, size: 9, color: emerald });
  const invoiceNo = `INV-${order.orderNo.replace(/^PJ-/, '')}`;
  doc.text(`Invoice No: ${invoiceNo}`, 50, 711, { bold: true, size: 9, color: charcoal });
  doc.text(`Order No: ${order.orderNo}`, 50, 699, { size: 8.5, color: charcoal });
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Invoice Date: ${orderDate}`, 50, 687, { size: 8.5, color: charcoal });
  doc.text(`Place of Supply: ${order.shippingAddress.state} (${tax.isIntraState ? 'Telangana - 36' : 'Inter-State'})`, 50, 675, { size: 8.5, color: charcoal });

  // Right Box: Customer & Shipping Details
  doc.rect(305, 665, 250, 75, tableBg, [0.88, 0.88, 0.88], 0.5);
  doc.text('BILLED & SHIPPED TO', 315, 725, { bold: true, size: 9, color: emerald });
  doc.text(order.shippingAddress.fullName, 315, 711, { bold: true, size: 9, color: charcoal });
  doc.text(`Phone: ${order.shippingAddress.phone}`, 315, 699, { size: 8.5, color: charcoal });
  doc.text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`, 315, 687, { size: 8, color: muted });
  doc.text(`${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 315, 675, { size: 8, color: muted });

  // 4. Products Table
  const tableTop = 645;
  // Table Header
  doc.rect(40, tableTop - 20, 515, 20, emerald);
  doc.text('#', 48, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('ITEM DESCRIPTION', 70, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('HSN', 270, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('QTY', 330, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1], align: 'right', width: 30 });
  doc.text('RATE (Rs.)', 380, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1], align: 'right', width: 65 });
  doc.text('AMOUNT (Rs.)', 465, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1], align: 'right', width: 80 });

  let curY = tableTop - 20;

  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    curY -= 22;

    // Zebra striping
    if (index % 2 === 1) {
      doc.rect(40, curY - 4, 515, 22, [0.98, 0.98, 0.98]);
    }
    doc.line(40, curY - 4, 555, curY - 4, [0.9, 0.9, 0.9], 0.5);

    doc.text(`${index + 1}`, 48, curY + 4, { size: 8.5, color: muted });
    const itemName = item.name.length > 36 ? item.name.substring(0, 34) + '...' : item.name;
    doc.text(itemName, 70, curY + 4, { bold: true, size: 8.5, color: charcoal });
    doc.text(`SKU: ${item.sku}`, 70, curY - 3, { size: 7, color: muted });
    doc.text(STORE_GST_CONFIG.defaultHsn, 270, curY + 4, { size: 8.5, color: charcoal });
    doc.text(`${item.quantity}`, 330, curY + 4, { size: 8.5, color: charcoal, align: 'right', width: 30 });
    doc.text(`${item.price.toLocaleString('en-IN')}`, 380, curY + 4, { size: 8.5, color: charcoal, align: 'right', width: 65 });
    doc.text(`${itemTotal.toLocaleString('en-IN')}`, 465, curY + 4, { bold: true, size: 8.5, color: charcoal, align: 'right', width: 80 });
  });

  curY -= 15;
  doc.line(40, curY, 555, curY, emerald, 1);

  // 5. Tax Breakdown & Final Totals
  const totalsTop = curY - 10;

  // Left Section: HSN Description & Terms
  doc.text('STATUTORY TAX DECLARATION & NOTES:', 40, totalsTop, { bold: true, size: 8, color: emerald });
  doc.text(`- HSN Code ${STORE_GST_CONFIG.defaultHsn}: Imitation & One-Gram Gold Plated Fashion Jewellery.`, 40, totalsTop - 12, { size: 7.5, color: muted });
  doc.text(`- Payment Method: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 40, totalsTop - 24, { size: 7.5, color: muted });
  if (order.couponCode) {
    doc.text(`- Coupon Code Applied: ${order.couponCode} (Saved Rs. ${order.discount.toLocaleString('en-IN')})`, 40, totalsTop - 36, { size: 7.5, color: emerald });
  }

  // Right Section: Financials Table
  const rightBoxX = 320;
  const rightBoxWidth = 235;

  let totY = totalsTop;
  const printRow = (label: string, value: string, isBold: boolean = false, color: [number, number, number] = charcoal) => {
    doc.text(label, rightBoxX, totY, { bold: isBold, size: 8.5, color });
    doc.text(value, rightBoxX, totY, { bold: isBold, size: 8.5, color, align: 'right', width: rightBoxWidth });
    totY -= 14;
  };

  printRow('Subtotal:', `Rs. ${order.subtotal.toLocaleString('en-IN')}`);
  if (order.discount > 0) {
    printRow('Discount:', `- Rs. ${order.discount.toLocaleString('en-IN')}`, false, [0.6, 0.1, 0.1]);
  }
  printRow('Shipping Fee:', order.shippingFee > 0 ? `Rs. ${order.shippingFee.toLocaleString('en-IN')}` : 'FREE');

  if (tax.isIntraState) {
    printRow(`CGST (${tax.cgstRate}%):`, `Rs. ${tax.cgstAmount.toLocaleString('en-IN')}`);
    printRow(`SGST (${tax.sgstRate}%):`, `Rs. ${tax.sgstAmount.toLocaleString('en-IN')}`);
  } else {
    printRow(`IGST (${tax.igstRate}%):`, `Rs. ${tax.igstAmount.toLocaleString('en-IN')}`);
  }

  totY -= 2;
  doc.rect(rightBoxX - 5, totY - 4, rightBoxWidth + 10, 22, emerald);
  doc.text('TOTAL INVOICE AMOUNT:', rightBoxX, totY + 3, { bold: true, size: 9.5, color: [1, 1, 1] });
  doc.text(`Rs. ${order.total.toLocaleString('en-IN')}`, rightBoxX, totY + 3, { bold: true, size: 10, color: gold, align: 'right', width: rightBoxWidth });

  // 6. Signatory & Bottom Footer
  const footerY = 90;
  doc.line(40, footerY + 45, 555, footerY + 45, [0.85, 0.85, 0.85], 0.5);

  doc.text('Declaration:', 40, footerY + 35, { bold: true, size: 7.5, color: muted });
  doc.text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 40, footerY + 25, { size: 7, color: muted });
  doc.text('This is a computer-generated tax invoice and requires no physical signature.', 40, footerY + 15, { size: 7, color: muted });

  // Authorized Signatory
  doc.text('For PARNIKA JEWELLERS', 400, footerY + 35, { bold: true, size: 8.5, color: deepEmerald, align: 'center', width: 155 });
  doc.text('(Authorized Signatory)', 400, footerY + 10, { size: 7.5, color: muted, align: 'center', width: 155 });

  // Bottom Gold Accent Bar
  doc.rect(0, 0, 595.28, 5, emerald);

  return doc.toBuffer();
}

/**
 * Generate a printable warehouse packing slip PDF for store dispatch staff.
 */
export async function generatePackingSlipPdf(order: Order): Promise<Buffer> {
  const doc = new SimplePdfDoc();
  const emerald: [number, number, number] = [0.043, 0.231, 0.141];
  const charcoal: [number, number, number] = [0.1, 0.1, 0.1];
  const muted: [number, number, number] = [0.4, 0.4, 0.4];

  doc.rect(0, 832, 595.28, 10, emerald);
  doc.text('PACKING SLIP / DISPATCH MANIFEST', 40, 800, { bold: true, size: 18, color: emerald });
  doc.text('PARNIKA JEWELLERS WAREHOUSE FULFILLMENT', 40, 786, { bold: true, size: 9, color: charcoal });

  doc.line(40, 770, 555, 770, emerald, 1);

  // Order Details Box
  doc.rect(40, 695, 250, 65, [0.97, 0.97, 0.97], [0.85, 0.85, 0.85], 0.5);
  doc.text(`Order No: ${order.orderNo}`, 50, 745, { bold: true, size: 10, color: charcoal });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 731, { size: 8.5, color: charcoal });
  doc.text(`Items Count: ${order.items.reduce((acc, i) => acc + i.quantity, 0)} Units`, 50, 717, { size: 8.5, color: charcoal });
  doc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 50, 703, { size: 8.5, color: charcoal });

  // Dispatch Destination Box
  doc.rect(305, 695, 250, 65, [0.97, 0.97, 0.97], [0.85, 0.85, 0.85], 0.5);
  doc.text('SHIP TO:', 315, 745, { bold: true, size: 9, color: emerald });
  doc.text(order.shippingAddress.fullName, 315, 731, { bold: true, size: 9, color: charcoal });
  doc.text(`Phone: ${order.shippingAddress.phone}`, 315, 717, { size: 8.5, color: charcoal });
  doc.text(`${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 315, 703, { size: 8, color: muted });

  // Items Checklist Table
  const tableTop = 665;
  doc.rect(40, tableTop - 20, 515, 20, emerald);
  doc.text('[ ] PACKED', 48, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('SKU / BARCODE', 120, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('PRODUCT NAME', 240, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1] });
  doc.text('QTY', 510, tableTop - 14, { bold: true, size: 8.5, color: [1, 1, 1], align: 'right', width: 35 });

  let curY = tableTop - 20;

  order.items.forEach((item, index) => {
    curY -= 24;
    doc.line(40, curY - 4, 555, curY - 4, [0.9, 0.9, 0.9], 0.5);

    doc.rect(50, curY, 12, 12, undefined, [0.4, 0.4, 0.4], 1); // Checkbox
    doc.text(`*${item.sku}*`, 120, curY + 3, { bold: true, size: 9, color: charcoal });
    doc.text(item.name.substring(0, 45), 240, curY + 3, { size: 9, color: charcoal });
    doc.text(`${item.quantity}`, 510, curY + 3, { bold: true, size: 10, color: charcoal, align: 'right', width: 35 });
  });

  return doc.toBuffer();
}

/**
 * Creates, uploads to S3, and records invoiceKey on the Order model.
 */
export async function createAndSaveInvoice(order: Order): Promise<{
  invoiceKey: string;
  downloadUrl: string;
  buffer: Buffer;
}> {
  const pdfBuffer = await generateInvoicePdf(order);
  const invoiceKey = `invoices/INV-${order.orderNo}.pdf`;

  // Upload to S3
  await uploadToS3(invoiceKey, pdfBuffer, 'application/pdf');

  // Update order record with invoiceKey in DynamoDB
  await orderRepository.updateInvoiceKey(order.id, invoiceKey);

  // Generate authenticated download link
  const downloadUrl = await getPresignedDownloadUrl(invoiceKey);

  return {
    invoiceKey,
    downloadUrl,
    buffer: pdfBuffer,
  };
}
