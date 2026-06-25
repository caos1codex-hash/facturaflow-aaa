// ============================================================
// FacturaFlow AAA — Servicio de Generación de PDF
// ============================================================

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import QRCode from 'qrcode'
import { DEFAULT_COMPANY, CURRENCY_OPTIONS, PAYMENT_METHODS, PAYMENT_FORMS } from '../utils/constants'
import { formatCurrency, formatDate, formatDateShort } from '../utils/formatters'

// ── Constants ────────────────────────────────────────────────

const BRAND_COLOR = [99, 102, 241] // #6366f1
const BRAND_COLOR_HEX = '#6366f1'
const LIGHT_GRAY = [245, 247, 250]
const MEDIUM_GRAY = [148, 163, 184]
const DARK_TEXT = [15, 23, 42]
const WHITE = [255, 255, 255]
const MARGIN = 20 // mm
const PAGE_WIDTH = 210 // A4
const PAGE_HEIGHT = 297 // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

// ── Helpers ──────────────────────────────────────────────────

/**
 * Get currency config for a given code.
 */
function getCurrencyConfig(currencyCode = 'MXN') {
  return CURRENCY_OPTIONS.find((c) => c.code === currencyCode) ?? CURRENCY_OPTIONS[0]
}

/**
 * Format a number as currency string for PDF display.
 * Uses the Intl formatter from the app's formatters module.
 */
function formatMoney(amount, currencyCode = 'MXN') {
  if (amount == null || isNaN(amount)) return formatCurrency(0, currencyCode)
  return formatCurrency(amount, currencyCode)
}

/**
 * Build a full address string from a direccion object.
 */
function buildAddress(direccion) {
  if (!direccion) return ''
  const parts = [
    direccion.calle,
    direccion.colonia,
    direccion.codigoPostal,
    direccion.ciudad,
    direccion.estado,
    direccion.pais,
  ].filter(Boolean)
  return parts.join(', ')
}

/**
 * Get the company initials (up to 2 characters) for the fallback logo.
 */
function getCompanyInitials(name) {
  if (!name) return 'FF'
  const words = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Look up a payment method label from its key.
 */
function getPaymentMethodLabel(key) {
  const found = PAYMENT_METHODS.find((m) => m.key === key)
  return found ? found.label.replace(/^PUE — /, 'PUE').replace(/^PPD — /, 'PPD') : key || '—'
}

/**
 * Look up a payment form label from its key.
 */
function getPaymentFormLabel(key) {
  const found = PAYMENT_FORMS.find((f) => f.key === key)
  return found ? found.label.split(' — ')[0] + ' — ' + found.label.split(' — ').slice(1).join(' — ') : key || '—'
}

/**
 * Resolve company data: use the provided object or fall back to defaults.
 */
function resolveCompany(company) {
  return company ? { ...DEFAULT_COMPANY, ...company } : { ...DEFAULT_COMPANY }
}

/**
 * Generate a QR code data URL.
 */
async function generateQRDataURL(text, size = 80) {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('Error generating QR code:', err)
    return null
  }
}

// ── Main PDF Generator ───────────────────────────────────────

/**
 * Generate a professional invoice PDF.
 *
 * @param {Object} invoice — Invoice data object
 * @param {Object} company — Company settings object
 * @param {Object} client  — Client data object
 * @param {Object} options — Additional options
 * @returns {Promise<jsPDF>} The generated PDF document
 */
export async function generateInvoicePDF(invoice, company, client, options = {}) {
  const co = resolveCompany(company)
  const currencyCode = invoice?.moneda || co.moneda || 'MXN'
  const currency = getCurrencyConfig(currencyCode)
  const items = invoice?.items || invoice?.conceptos || []

  // ── Create document ──
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Store key metadata for footer callback
  const totalPages = { value: 0 } // Will be updated by putTotalPages
  const generatedDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // ==========================================================
  // 1. HEADER SECTION
  // ==========================================================

  let y = MARGIN

  // ── Company logo / initials ──
  if (co.logo) {
    try {
      // logo could be a base64 string or a URL
      const isBase64 = typeof co.logo === 'string' && co.logo.startsWith('data:')
      if (isBase64) {
        doc.addImage(co.logo, 'PNG', MARGIN, y, 22, 22)
      } else {
        // URL-based logo — draw initials as fallback in PDF context
        drawCompanyInitials(doc, MARGIN, y, co)
      }
    } catch {
      drawCompanyInitials(doc, MARGIN, y, co)
    }
  } else {
    drawCompanyInitials(doc, MARGIN, y, co)
  }

  // ── Company name (right of logo) ──
  const textStartX = MARGIN + (co.logo ? 27 : 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...DARK_TEXT)
  doc.text(co.nombreComercial || co.nombre, textStartX, y + 7)

  // ── Company details (smaller, gray) ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MEDIUM_GRAY)

  let detailY = y + 12
  const detailLines = []
  if (co.direccion) {
    const addr = buildAddress(co.direccion)
    if (addr) detailLines.push(addr)
  }
  if (co.contacto?.telefono) detailLines.push(`Tel: ${co.contacto.telefono}`)
  if (co.contacto?.email) detailLines.push(`Email: ${co.contacto.email}`)
  if (co.contacto?.sitioWeb) detailLines.push(`Web: ${co.contacto.sitioWeb}`)
  if (co.rfc) detailLines.push(`RFC: ${co.rfc}`)
  if (co.regimenFiscal) detailLines.push(`Régimen: ${co.regimenFiscal}`)

  for (const line of detailLines) {
    doc.text(line, textStartX, detailY, { maxWidth: 85 })
    detailY += 3.5
  }

  // ── Right side: FACTURA band + invoice number ──
  const bandX = PAGE_WIDTH - MARGIN - 55
  const bandW = 55

  // "FACTURA" colored band
  doc.setFillColor(...BRAND_COLOR)
  doc.roundedRect(bandX, y, bandW, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...WHITE)
  doc.text('FACTURA', bandX + bandW / 2, y + 8.5, { align: 'center' })

  // Invoice number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK_TEXT)
  doc.text(invoice?.numero || invoice?.folio || 'SIN FOLIO', bandX + bandW / 2, y + 20, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MEDIUM_GRAY)
  doc.text('Comprobante Fiscal Digital por Internet', bandX + bandW / 2, y + 25, { align: 'center' })

  // ── Status badge ──
  if (invoice?.estado) {
    const statusColors = {
      BORRADOR: [148, 163, 184],
      EMITIDA: [59, 130, 246],
      PENDIENTE: [245, 158, 11],
      PAGADA: [16, 185, 129],
      VENCIDA: [239, 68, 68],
      CANCELADA: [156, 163, 175],
    }
    const statusLabels = {
      BORRADOR: 'Borrador',
      EMITIDA: 'Emitida',
      PENDIENTE: 'Pendiente',
      PAGADA: 'Pagada',
      VENCIDA: 'Vencida',
      CANCELADA: 'Cancelada',
    }
    const color = statusColors[invoice.estado] || MEDIUM_GRAY
    const label = statusLabels[invoice.estado] || invoice.estado

    const statusW = doc.getTextWidth(label) + 8
    doc.setFillColor(...color)
    doc.roundedRect(bandX + (bandW - statusW) / 2, y + 28, statusW, 6, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text(label, bandX + bandW / 2, y + 32, { align: 'center' })
  }

  // ── Separator line ──
  y = Math.max(detailY, y + 38) + 4
  doc.setDrawColor(...BRAND_COLOR)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 6

  // ==========================================================
  // 2. CLIENT SECTION
  // ==========================================================

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND_COLOR)
  doc.text('Datos del Cliente', MARGIN, y)
  y += 1

  // Light background box
  const clientBoxStartY = y + 1
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(MARGIN, clientBoxStartY, CONTENT_WIDTH, 30, 2, 2, 'F')
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK_TEXT)
  const clientName = client?.nombreComercial || client?.nombre || client?.razonSocial || '—'
  doc.text(clientName, MARGIN + 4, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MEDIUM_GRAY)
  y += 5

  const clientLines = []
  if (client?.rfc) clientLines.push(`RFC: ${client.rfc}`)
  if (client?.empresa || client?.razonSocial) {
    const companyLine = client.empresa || client.razonSocial
    if (companyLine !== clientName) clientLines.push(companyLine)
  }
  if (client?.direccion) {
    const clientAddr = typeof client.direccion === 'string' ? client.direccion : buildAddress(client.direccion)
    if (clientAddr) clientLines.push(clientAddr)
  }
  if (client?.email) clientLines.push(`Email: ${client.email}`)
  if (client?.telefono) clientLines.push(`Tel: ${client.telefono}`)

  for (const line of clientLines) {
    doc.text(line, MARGIN + 4, y, { maxWidth: CONTENT_WIDTH - 8 })
    y += 3.5
  }

  y = clientBoxStartY + 30 + 6

  // ==========================================================
  // 3. INVOICE DETAILS BAR
  // ==========================================================

  const barHeight = 14
  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, barHeight, 2, 2, 'F')

  doc.setFontSize(7)
  doc.setTextColor(...MEDIUM_GRAY)

  const colCount = 4
  const colW = CONTENT_WIDTH / colCount

  const detailItems = [
    {
      label: 'Fecha Emisión',
      value: formatDateShort(invoice?.fechaEmision || invoice?.fecha),
    },
    {
      label: 'Fecha Vencimiento',
      value: formatDateShort(invoice?.fechaVencimiento),
    },
    {
      label: 'Método de Pago',
      value: getPaymentMethodLabel(invoice?.metodoPago),
    },
    {
      label: 'Condiciones de Pago',
      value: invoice?.condicionesPago || invoice?.formaPago
        ? getPaymentFormLabel(invoice?.formaPago)
        : 'Contado',
    },
  ]

  detailItems.forEach((item, i) => {
    const cellX = MARGIN + i * colW
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, cellX + 4, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK_TEXT)
    doc.setFontSize(8)
    doc.text(item.value, cellX + 4, y + 10)
    doc.setFontSize(7)
    doc.setTextColor(...MEDIUM_GRAY)
  })

  y += barHeight + 6

  // ==========================================================
  // 4. ITEMS TABLE
  // ==========================================================

  // Prepare table data
  const tableHeaders = [['#', 'Descripción', 'Cant.', 'P. Unitario', 'Descuento', 'Impuesto', 'Subtotal']]

  const tableBody = items.map((item, index) => {
    const qty = item.cantidad || item.cantidad ?? 0
    const unitPrice = item.precioUnitario || item.precio || 0
    const discount = item.descuento || 0
    const taxRate = item.tasaImpuesto || item.impuesto || 0.16
    const taxableBase = qty * unitPrice - discount
    const taxAmount = taxableBase * taxRate
    const subtotal = taxableBase + taxAmount

    // Tax label
    let taxLabel = ''
    if (taxRate === 0) {
      taxLabel = '0%'
    } else {
      taxLabel = `${(taxRate * 100).toFixed(0)}%`
    }

    return [
      String(index + 1),
      item.descripcion || item.nombre || '—',
      qty.toLocaleString('es-MX', { minimumFractionDigits: currency.decimals, maximumFractionDigits: currency.decimals }),
      formatMoney(unitPrice, currencyCode),
      discount > 0 ? formatMoney(discount, currencyCode) : '—',
      taxLabel,
      formatMoney(subtotal, currencyCode),
    ]
  })

  // Calculate totals
  const subtotalGeneral = items.reduce((sum, item) => {
    const qty = item.cantidad || 0
    const unitPrice = item.precioUnitario || item.precio || 0
    const discount = item.descuento || 0
    return sum + (qty * unitPrice - discount)
  }, 0)

  const totalDiscount = items.reduce((sum, item) => sum + (item.descuento || 0), 0)

  // Group taxes
  const taxGroups = {}
  items.forEach((item) => {
    const taxRate = item.tasaImpuesto || item.impuesto || 0.16
    const qty = item.cantidad || 0
    const unitPrice = item.precioUnitario || item.precio || 0
    const discount = item.descuento || 0
    const taxableBase = qty * unitPrice - discount
    const taxAmount = taxableBase * taxRate

    const key = taxRate === 0 ? 'Exento' : `${(taxRate * 100).toFixed(0)}%`
    if (!taxGroups[key]) taxGroups[key] = { rate: taxRate, amount: 0 }
    taxGroups[key].amount += taxAmount
  })

  const totalTaxes = Object.values(taxGroups).reduce((sum, t) => sum + t.amount, 0)
  const grandTotal = subtotalGeneral + totalTaxes

  // Footer row
  const tableFoot = [[
    '',
    '',
    '',
    '',
    { content: formatMoney(totalDiscount, currencyCode), styles: { fontStyle: 'bold' } },
    { content: formatMoney(totalTaxes, currencyCode), styles: { fontStyle: 'bold' } },
    { content: formatMoney(grandTotal, currencyCode), styles: { fontStyle: 'bold', fontSize: 9 } },
  ]]

  // Generate the autoTable
  doc.autoTable({
    startY: y,
    head: tableHeaders,
    body: tableBody,
    foot: tableFoot,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: DARK_TEXT,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    footStyles: {
      fillColor: LIGHT_GRAY,
      textColor: DARK_TEXT,
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineWidth: { top: 0.5 },
      lineColor: BRAND_COLOR,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },   // #
      1: { cellWidth: 'auto' },                   // Descripción
      2: { halign: 'right', cellWidth: 18 },     // Cantidad
      3: { halign: 'right', cellWidth: 22 },     // P. Unitario
      4: { halign: 'right', cellWidth: 20 },     // Descuento
      5: { halign: 'center', cellWidth: 18 },    // Impuesto
      6: { halign: 'right', cellWidth: 24 },     // Subtotal
    },
    didDrawPage: (data) => {
      // Footer on every page
      drawPageFooter(doc, data.pageNumber, co.nombreComercial || co.nombre, generatedDate, totalPages)
    },
  })

  // Get Y position after the table
  y = doc.lastAutoTable.finalY + 10

  // ==========================================================
  // 5. TOTALS SECTION (right-aligned)
  // ==========================================================

  // Check if we need a new page
  if (y > PAGE_HEIGHT - MARGIN - 70) {
    doc.addPage()
    y = MARGIN
  }

  const totalsX = PAGE_WIDTH - MARGIN - 80
  const labelX = totalsX
  const valueX = totalsX + 55

  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MEDIUM_GRAY)
  doc.text('Subtotal:', labelX, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_TEXT)
  doc.text(formatMoney(subtotalGeneral, currencyCode), valueX + 20, y, { align: 'right' })
  y += 6

  // Total discount
  if (totalDiscount > 0) {
    doc.setTextColor(...MEDIUM_GRAY)
    doc.text('Descuento:', labelX, y, { align: 'right' })
    doc.setTextColor(239, 68, 68) // red-500
    doc.text(`-${formatMoney(totalDiscount, currencyCode)}`, valueX + 20, y, { align: 'right' })
    y += 6
  }

  // Tax lines
  for (const [label, taxData] of Object.entries(taxGroups)) {
    const taxName = taxData.rate === 0 ? 'Exento' : `IVA (${label})`
    doc.setTextColor(...MEDIUM_GRAY)
    doc.text(`${taxName}:`, labelX, y, { align: 'right' })
    doc.setTextColor(...DARK_TEXT)
    doc.text(formatMoney(taxData.amount, currencyCode), valueX + 20, y, { align: 'right' })
    y += 6
  }

  y += 2

  // Divider line above total
  doc.setDrawColor(...BRAND_COLOR)
  doc.setLineWidth(0.6)
  doc.line(totalsX - 2, y, valueX + 22, y)
  y += 7

  // GRAND TOTAL
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK_TEXT)
  doc.text('TOTAL:', labelX, y, { align: 'right' })
  doc.setTextColor(...BRAND_COLOR)
  doc.text(formatMoney(grandTotal, currencyCode), valueX + 20, y, { align: 'right' })
  y += 6

  // Currency / amount in words
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...MEDIUM_GRAY)
  const amountWords = numberToWords(grandTotal, currencyCode)
  doc.text(`Son: ${amountWords}`, totalsX - 2, y + 3, { maxWidth: 82 })
  y += 10

  // ==========================================================
  // 6. NOTES SECTION
  // ==========================================================

  const notes = invoice?.notas || invoice?.observaciones || co.notaPredeterminada
  if (notes) {
    if (y > PAGE_HEIGHT - MARGIN - 35) {
      doc.addPage()
      y = MARGIN
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND_COLOR)
    doc.text('Notas:', MARGIN, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MEDIUM_GRAY)
    const noteLines = doc.splitTextToSize(notes, CONTENT_WIDTH)
    for (const line of noteLines) {
      if (y > PAGE_HEIGHT - MARGIN - 10) {
        doc.addPage()
        y = MARGIN
      }
      doc.text(line, MARGIN, y)
      y += 3.5
    }
  }

  // ==========================================================
  // 7. QR CODE (bottom-right of last page)
  // ==========================================================

  try {
    const qrData = JSON.stringify({
      numero: invoice?.numero || invoice?.folio || '',
      total: grandTotal,
      rfc: co.rfc || '',
      moneda: currencyCode,
    })

    const qrDataURL = await generateQRDataURL(qrData, 120)
    if (qrDataURL) {
      const qrX = PAGE_WIDTH - MARGIN - 22
      const qrY = PAGE_HEIGHT - MARGIN - 32
      doc.addImage(qrDataURL, 'PNG', qrX, qrY, 22, 22)

      // QR label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(...MEDIUM_GRAY)
      doc.text('Código de verificación', qrX + 11, qrY + 25, { align: 'center' })
    }
  } catch (err) {
    console.error('Error adding QR code to PDF:', err)
  }

  // ==========================================================
  // 8. SET TOTAL PAGES (two-pass resolution)
  // ==========================================================

  // putTotalPages replaces the placeholder in footer
  totalPages.value = doc.internal.getNumberOfPages()
  // We already drew the footer via didDrawPage, so update existing text
  // by redrawing the page number area on each page
  for (let i = 1; i <= totalPages.value; i++) {
    doc.setPage(i)
    // Clear the old page text area and redraw
    const footerY = PAGE_HEIGHT - MARGIN / 2 + 2
    doc.setFillColor(255, 255, 255)
    doc.rect(PAGE_WIDTH / 2 - 12, footerY - 3.5, 24, 5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MEDIUM_GRAY)
    doc.text(
      `Página ${i} de ${totalPages.value}`,
      PAGE_WIDTH / 2,
      footerY,
      { align: 'center' },
    )
  }

  return doc
}

// ── Page Footer (called per-page during autoTable) ───────────

function drawPageFooter(doc, pageNumber, companyName, generatedDate, totalPages) {
  const footerY = PAGE_HEIGHT - MARGIN / 2 + 2

  // Thin colored line
  doc.setDrawColor(...BRAND_COLOR)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, footerY - 6, PAGE_WIDTH - MARGIN, footerY - 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MEDIUM_GRAY)

  // Company name — left
  doc.text(companyName, MARGIN, footerY)

  // Page number — center (placeholder, updated later)
  doc.text(`Página ${pageNumber}`, PAGE_WIDTH / 2, footerY, { align: 'center' })

  // Generated date — right
  doc.text(`Generado: ${generatedDate}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' })
}

// ── Company Initials Fallback ────────────────────────────────

function drawCompanyInitials(doc, x, y, company) {
  const initials = getCompanyInitials(company.nombreComercial || company.nombre)
  const size = 22

  // Rounded rectangle background
  doc.setFillColor(...BRAND_COLOR)
  doc.roundedRect(x, y, size, size, 3, 3, 'F')

  // White initials text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text(initials, x + size / 2, y + size / 2 + 3.5, { align: 'center' })
}

// ── Number to Words (Spanish) ───────────────────────────────

function numberToWords(number, currencyCode = 'MXN') {
  const curr = getCurrencyConfig(currencyCode)

  if (number == null || isNaN(number)) return `cero ${curr.label}`

  const wholePart = Math.floor(Math.abs(number))
  const decimals = Math.round((Math.abs(number) - wholePart) * 100)

  const wholeWords = convertToSpanishWords(wholePart)
  const cents = String(decimals).padStart(2, '0')

  return `${wholeWords} ${curr.code} ${cents}/${String(curr.decimals === 0 ? 0 : 100).padStart(2, '0')}`
}

function convertToSpanishWords(num) {
  if (num === 0) return 'cero'
  if (num === 1) return 'uno'

  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const hundreds = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  function convert(n) {
    if (n === 0) return ''
    if (n === 100) return 'cien'

    let result = ''

    if (n >= 1000) {
      if (n === 1000) return 'mil'
      if (n < 2000) return 'mil ' + convert(n % 1000)

      const thousands = Math.floor(n / 1000)
      const rest = n % 1000
      result = convert(thousands) + ' mil'
      if (rest > 0) result += ' ' + convert(rest)
      return result
    }

    if (n >= 100) {
      const h = Math.floor(n / 100)
      const rest = n % 100
      if (rest === 0) {
        return hundreds[h]
      }
      // Special case: ciento (not cien) when there are digits after
      if (h === 1) {
        result = 'ciento'
      } else {
        result = hundreds[h]
      }
      result += ' ' + convert(rest)
      return result
    }

    if (n >= 20) {
      const t = Math.floor(n / 10)
      const rest = n % 10
      if (rest === 0) return tens[t]
      // Special: veintiuno, veintidós, etc.
      if (t === 2) {
        const veintiUnits = ['', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
        return veintiUnits[rest]
      }
      return tens[t] + ' y ' + units[rest]
    }

    if (n >= 10) {
      return teens[n - 10]
    }

    return units[n]
  }

  return convert(wholePart || num)
}

// ── Download Helper ──────────────────────────────────────────

/**
 * Generate a PDF and trigger a browser download.
 *
 * @param {Object} invoice
 * @param {Object} company
 * @param {Object} client
 */
export async function downloadPDF(invoice, company, client) {
  try {
    const doc = await generateInvoicePDF(invoice, company, client)
    const filename = `${invoice?.numero || invoice?.folio || 'factura'}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    throw error
  }
}

// ── Print Helper ─────────────────────────────────────────────

/**
 * Generate a PDF and open the browser print dialog.
 *
 * @param {Object} invoice
 * @param {Object} company
 * @param {Object} client
 */
export async function printInvoice(invoice, company, client) {
  try {
    const doc = await generateInvoicePDF(invoice, company, client)
    const blobUrl = doc.output('bloburl')
    const printWindow = window.open(blobUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    } else {
      // Fallback: use the built-in autoPrint
      doc.autoPrint()
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  } catch (error) {
    console.error('Error al imprimir factura:', error)
    throw error
  }
}