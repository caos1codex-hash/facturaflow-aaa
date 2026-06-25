import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { CURRENCY_OPTIONS } from './constants'

// ============================================================
// Formato de Moneda
// ============================================================

/**
 * Formatea un número como moneda según el código de moneda.
 * @param {number} amount — Monto a formatear
 * @param {string} currencyCode — Código ISO de moneda (MXN, USD, EUR...)
 * @param {object} options — Opciones adicionales de Intl.NumberFormat
 * @returns {string} Monto formateado, ej: "$1,234.56"
 */
export function formatCurrency(amount, currencyCode = 'MXN', options = {}) {
  const currency = CURRENCY_OPTIONS.find((c) => c.code === currencyCode) ?? CURRENCY_OPTIONS[0]

  const formatter = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: options.decimals ?? currency.decimals,
    maximumFractionDigits: options.decimals ?? currency.decimals,
    ...options,
  })

  return formatter.format(amount)
}

/**
 * Retorna el símbolo de una moneda.
 * @param {string} currencyCode
 * @returns {string}
 */
export function getCurrencySymbol(currencyCode = 'MXN') {
  const currency = CURRENCY_OPTIONS.find((c) => c.code === currencyCode)
  return currency?.symbol ?? '$'
}

// ============================================================
// Formato de Fechas
// ============================================================

/**
 * Formatea una fecha como cadena legible en español.
 * @param {string|Date} date — Fecha a formatear
 * @param {string} pattern — Patrón de date-fns (default: "d MMM yyyy")
 * @returns {string}
 */
export function formatDate(date, pattern = 'd MMM yyyy') {
  if (!date) return '—'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return format(parsed, pattern, { locale: es })
}

/**
 * Formatea una fecha con hora.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return formatDate(date, "d MMM yyyy, HH:mm")
}

/**
 * Formatea una fecha como fecha corta.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateShort(date) {
  return formatDate(date, 'dd/MM/yyyy')
}

/**
 * Formatea una fecha como "hace X tiempo" (tiempo relativo).
 * @param {string|Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '—'
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return formatDistanceToNow(parsed, { addSuffix: true, locale: es })
}

// ============================================================
// Generador de Número de Factura
// ============================================================

/**
 * Genera un número de factura con formato FAC-YYYY-NNNNNN.
 * El número consecutivo se basa en el año y el último número usado.
 * @param {number} sequence — Número secuencial (1-indexed)
 * @param {string} prefix — Prefijo de la serie (default: "FAC")
 * @returns {string} Ej: "FAC-2025-000001"
 */
export function generateInvoiceNumber(sequence, prefix = 'FAC') {
  const year = new Date().getFullYear()
  const paddedSequence = String(sequence).padStart(6, '0')
  return `${prefix}-${year}-${paddedSequence}`
}

/**
 * Extrae el número secuencial de un número de factura.
 * @param {string} invoiceNumber — Ej: "FAC-2025-000042"
 * @returns {number|null}
 */
export function extractSequence(invoiceNumber) {
  const match = invoiceNumber?.match(/-(\d{6})$/)
  return match ? parseInt(match[1], 10) : null
}

// ============================================================
// Formato de Porcentajes
// ============================================================

/**
 * Formatea un valor decimal como porcentaje.
 * @param {number} value — Valor decimal (0.16 = 16%)
 * @param {number} decimals — Decimales a mostrar
 * @returns {string} Ej: "16.00%"
 */
export function formatPercentage(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0%'
  return `${(value * 100).toFixed(decimals)}%`
}

// ============================================================
// Formato de Teléfono
// ============================================================

/**
 * Formatea un número de teléfono mexicano.
 * Soporta formatos de 10 y 13 dígitos (con código de país).
 * @param {string} phone — Número de teléfono
 * @returns {string} Ej: "+52 55 1234 5678"
 */
export function formatPhone(phone) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 13) {
    // Formato internacional completo: +XX X XXXX XXXX
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`
  }
  if (digits.length === 10) {
    // Formato nacional: (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length === 7 || digits.length === 8) {
    // Formato local
    return `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}`
  }

  return phone
}

// ============================================================
// Utilidades adicionales
// ============================================================

/**
 * Trunca texto con puntos suspensivos.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text ?? '—'
  return `${text.slice(0, maxLength)}…`
}

/**
 * Capitaliza la primera letra de un texto.
 * @param {string} text
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convierte bytes a formato legible.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}