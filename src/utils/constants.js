// ============================================================
// FacturaFlow AAA — Constantes del sistema
// ============================================================

/** Estados de factura con etiquetas en español y colores */
export const INVOICE_STATUSES = {
  BORRADOR: {
    key: 'BORRADOR',
    label: 'Borrador',
    description: 'Factura en creación, aún no enviada',
    color: 'slate',
    bgClass: 'badge-borrador',
    dotColor: 'bg-slate-400',
  },
  EMITIDA: {
    key: 'EMITIDA',
    label: 'Emitida',
    description: 'Factura enviada al cliente',
    color: 'blue',
    bgClass: 'badge-emitida',
    dotColor: 'bg-blue-500',
  },
  PENDIENTE: {
    key: 'PENDIENTE',
    label: 'Pendiente',
    description: 'Factura pendiente de pago',
    color: 'amber',
    bgClass: 'badge-pendiente',
    dotColor: 'bg-amber-500',
  },
  PAGADA: {
    key: 'PAGADA',
    label: 'Pagada',
    description: 'Factura pagada completamente',
    color: 'emerald',
    bgClass: 'badge-pagada',
    dotColor: 'bg-emerald-500',
  },
  VENCIDA: {
    key: 'VENCIDA',
    label: 'Vencida',
    description: 'Factura con fecha de pago vencida',
    color: 'red',
    bgClass: 'badge-vencida',
    dotColor: 'bg-red-500',
  },
  CANCELADA: {
    key: 'CANCELADA',
    label: 'Cancelada',
    description: 'Factura anulada o cancelada',
    color: 'gray',
    bgClass: 'badge-cancelada',
    dotColor: 'bg-gray-400',
  },
}

/** Lista de estados como arreglo para iteraciones */
export const INVOICE_STATUS_LIST = Object.values(INVOICE_STATUSES)

/** Configuración predeterminada de la empresa */
export const DEFAULT_COMPANY = {
  nombre: 'Mi Empresa S.A. de C.V.',
  nombreComercial: 'Mi Empresa',
  rfc: 'XAXX010101000',
  regimenFiscal: '601 - General de Ley Personas Morales',
  direccion: {
    calle: 'Av. Reforma #123',
    colonia: 'Centro',
    ciudad: 'Ciudad de México',
    estado: 'Ciudad de México',
    codigoPostal: '06000',
    pais: 'México',
  },
  contacto: {
    telefono: '+52 55 1234 5678',
    email: 'contacto@miempresa.com',
    sitioWeb: 'www.miempresa.com',
  },
  logo: null,
  moneda: 'MXN',
  diasVencimientoFactura: 30,
  notaPredeterminada: 'Gracias por su compra. Pago a 30 días.',
  serieFactura: 'FAC',
}

/** Opciones de moneda disponibles */
export const CURRENCY_OPTIONS = [
  { code: 'MXN', label: 'Peso Mexicano', symbol: '$', locale: 'es-MX', decimals: 2 },
  { code: 'USD', label: 'Dólar Estadounidense', symbol: '$', locale: 'en-US', decimals: 2 },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE', decimals: 2 },
  { code: 'COP', label: 'Peso Colombiano', symbol: '$', locale: 'es-CO', decimals: 2 },
  { code: 'ARS', label: 'Peso Argentino', symbol: '$', locale: 'es-AR', decimals: 2 },
  { code: 'CLP', label: 'Peso Chileno', symbol: '$', locale: 'es-CL', decimals: 0 },
  { code: 'PEN', label: 'Sol Peruano', symbol: 'S/', locale: 'es-PE', decimals: 2 },
  { code: 'BRL', label: 'Real Brasileño', symbol: 'R$', locale: 'pt-BR', decimals: 2 },
]

/** Tasas de impuestos predeterminadas */
export const TAX_RATES = [
  { id: 'iva-16', name: 'IVA 16%', rate: 0.16, type: 'percentage', active: true },
  { id: 'iva-8', name: 'IVA 8%', rate: 0.08, type: 'percentage', active: true },
  { id: 'iva-0', name: 'IVA 0% (Exento)', rate: 0, type: 'percentage', active: true },
  { id: 'retencion-isor', name: 'Retención ISR 1.25%', rate: 0.0125, type: 'retention', active: false },
  { id: 'retencion-iva', name: 'Retención IVA 10.67%', rate: 0.1067, type: 'retention', active: false },
  { id: 'ieps', name: 'IEPS', rate: 0.08, type: 'percentage', active: false },
]

/** Métodos de pago SAT */
export const PAYMENT_METHODS = [
  { key: 'PUE', label: 'PUE — Pago en una sola exhibición' },
  { key: 'PPD', label: 'PPD — Pago en parcialidades o diferido' },
]

/** Formas de pago SAT */
export const PAYMENT_FORMS = [
  { key: '01', label: '01 — Efectivo' },
  { key: '02', label: '02 — Cheque nominativo' },
  { key: '03', label: '03 — Transferencia electrónica' },
  { key: '04', label: '04 — Tarjeta de crédito' },
  { key: '05', label: '05 — Monedero electrónico' },
  { key: '06', label: '06 — Dinero electrónico' },
  { key: '08', label: '08 — Vales de despensa' },
  { key: '12', label: '12 — Dación en pago' },
  { key: '14', label: '14 — Tarjeta de débito' },
  { key: '15', label: '15 — Tarjeta de servicios' },
  { key: '17', label: '17 — Compensación' },
  { key: '23', label: '23 — Novación' },
  { key: '24', label: '24 — Confusión' },
  { key: '25', label: '25 — Remisión' },
  { key: '26', label: '26 — Prescripción o caducidad' },
  { key: '27', label: '27 — A satisfacción del acreedor' },
  { key: '28', label: '28 — Subrogación' },
  { key: '29', label: '29 — Consignación' },
  { key: '30', label: '30 — Condonación' },
  { key: '99', label: '99 — Por definir' },
]

/** Tipos de comprobante */
export const CFDI_TYPES = [
  { key: 'I', label: 'I — Factura' },
  { key: 'E', label: 'E — Nota de crédito' },
  { key: 'N', label: 'N — Nota de débito' },
]

/** Tamaño de página para tablas y listas */
export const PAGE_SIZES = [10, 25, 50, 100]

/** Tamaño de página predeterminado */
export const DEFAULT_PAGE_SIZE = 25

/** Rutas de navegación */
export const ROUTES = {
  DASHBOARD: '/',
  FACTURAS: '/facturas',
  FACTURA_NUEVA: '/facturas/nueva',
  FACTURA_EDITAR: '/facturas/:id/editar',
  FACTURA_VER: '/facturas/:id',
  CLIENTES: '/clientes',
  CLIENTE_NUEVO: '/clientes/nuevo',
  PRODUCTOS: '/productos',
  PRODUCTO_NUEVO: '/productos/nuevo',
  REPORTES: '/reportes',
  CONFIGURACION: '/configuracion',
}