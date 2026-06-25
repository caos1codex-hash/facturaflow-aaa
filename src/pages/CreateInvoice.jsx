import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  Send,
  RefreshCw,
  Search,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { addDays, format, parseISO } from 'date-fns';

import { useData } from '../hooks/useData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDate, generateInvoiceNumber, formatPercentage } from '../utils/formatters';
import { TAX_RATES, PAYMENT_METHODS, ROUTES } from '../utils/constants';

// ── Constantes ─────────────────────────────────────────────────
const PAYMENT_TERMS = [
  { value: '0', label: 'Contado' },
  { value: '15', label: '15 días' },
  { value: '30', label: '30 días' },
  { value: '45', label: '45 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

const taxOptions = TAX_RATES.map((t) => ({
  value: t.id,
  label: `${t.name} (${formatPercentage(t.rate)})`,
}));

const paymentMethodOptions = PAYMENT_METHODS.map((m) => ({
  value: m.key,
  label: m.label,
}));

// ── Línea vacía ────────────────────────────────────────────────
function createEmptyLine() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
    productoId: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0,
    impuestoId: 'iva-16',
  };
}

// ── Variantes de animación ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ════════════════════════════════════════════════════════════════
// Componente SearchableProductSelect (búsqueda inline)
// ════════════════════════════════════════════════════════════════
function SearchableProductSelect({ products, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const wrapperRef = React.useRef(null);

  // Sync con valor externo
  useEffect(() => {
    if (!value) {
      setSelectedProduct(null);
      setQuery('');
    } else {
      const found = products.find((p) => p.id === value);
      if (found) {
        setSelectedProduct(found);
        setQuery(found.nombre);
      }
    }
  }, [value, products]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        if (selectedProduct) setQuery(selectedProduct.nombre);
        else setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products.filter((p) => p.activo !== false).slice(0, 20);
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        (p.activo !== false) &&
        ((p.nombre || '').toLowerCase().includes(q) ||
         (p.sku || '').toLowerCase().includes(q) ||
         (p.categoria || '').toLowerCase().includes(q))
    ).slice(0, 20);
  }, [query, products]);

  const handleSelect = useCallback((product) => {
    setSelectedProduct(product);
    setQuery(product.nombre);
    setOpen(false);
    onChange(product);
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSelectedProduct(null);
    setQuery('');
    onChange(null);
  }, [onChange]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            // Si se borra, limpiar selección
            if (!e.target.value.trim()) {
              handleClear();
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar producto..."
          className="input-base w-full text-sm pl-8 pr-8 py-2"
        />
        {selectedProduct && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-40 w-full max-h-56 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] py-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className={`
                w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer
                ${p.id === selectedProduct?.id
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">{p.nombre}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {p.sku ? `SKU: ${p.sku} · ` : ''}{formatCurrency(p.precio ?? 0)}
                </span>
              </div>
              <Badge variant={p.tipo === 'Servicio' ? 'info' : 'success'} size="sm">
                {p.tipo || 'Producto'}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Componente CreateInvoice
// ════════════════════════════════════════════════════════════════
export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // ── Data hooks ───────────────────────────────────────────────
  const { items: clients, loading: loadingClients } = useData('clients');
  const { items: products, loading: loadingProducts } = useData('products');
  const { items: existingInvoices, loading: loadingInvoices, create, update, getById } = useData('invoices');

  // ── Estado del formulario ────────────────────────────────────
  const [form, setForm] = useState({
    clienteId: '',
    numero: '',
    fechaEmision: format(new Date(), 'yyyy-MM-dd'),
    fechaVencimiento: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    condicionesPago: '30',
    metodoPago: 'PUE',
    notas: '',
    status: 'BORRADOR',
  });

  const [lineItems, setLineItems] = useState([createEmptyLine()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  // ── Clientes en formato options ──────────────────────────────
  const clientOptions = useMemo(
    () => clients.map((c) => ({
      value: c.id,
      label: c.empresa ? `${c.nombre} — ${c.empresa}` : c.nombre,
    })),
    [clients]
  );

  // ── Generar número de factura ────────────────────────────────
  const generateNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const thisYearInvoices = existingInvoices.filter((inv) => {
      const invYear = (inv.numero || '').match(/-(\d{4})-/)?.[1];
      return invYear === String(year);
    });
    const nextSeq = thisYearInvoices.length + 1;
    return generateInvoiceNumber(nextSeq, 'FAC');
  }, [existingInvoices]);

  // ── Cargar datos al editar ───────────────────────────────────
  useEffect(() => {
    if (!isEditing || !id) return;

    async function loadInvoice() {
      setLoadingEdit(true);
      try {
        const invoice = await getById(id);
        if (!invoice) {
          toast.error('Factura no encontrada');
          navigate(ROUTES.FACTURAS);
          return;
        }

        // Cargar formulario
        setForm({
          clienteId: invoice.clienteId || '',
          numero: invoice.numero || '',
          fechaEmision: invoice.fechaEmision || invoice.fecha || format(new Date(), 'yyyy-MM-dd'),
          fechaVencimiento: invoice.fechaVencimiento || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          condicionesPago: invoice.condicionesPago || '30',
          metodoPago: invoice.metodoPago || 'PUE',
          notas: invoice.notas || '',
          status: invoice.status || 'BORRADOR',
        });

        // Cargar líneas
        if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
          setLineItems(
            invoice.items.map((item) => ({
              id: item.id || crypto.randomUUID?.() || Date.now().toString(36),
              productoId: item.productoId || '',
              descripcion: item.descripcion || '',
              cantidad: Number(item.cantidad) || 1,
              precioUnitario: Number(item.precioUnitario) || 0,
              descuento: Number(item.descuento) || 0,
              impuestoId: item.impuestoId || 'iva-16',
            }))
          );
        }
      } catch (err) {
        toast.error('Error al cargar la factura');
        console.error(err);
      } finally {
        setLoadingEdit(false);
      }
    }

    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  // ── Generar número al montar (solo nuevo) ────────────────────
  useEffect(() => {
    if (!isEditing && existingInvoices.length >= 0) {
      setForm((prev) => ({
        ...prev,
        numero: generateNumber(),
      }));
    }
  }, [isEditing, existingInvoices.length, generateNumber]);

  // ── Calcular líneas y totales ────────────────────────────────
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDescuento = 0;
    const taxBreakdown = {};

    const calculatedLines = lineItems.map((item) => {
      const qty = Math.max(0, Number(item.cantidad) || 0);
      const price = Math.max(0, Number(item.precioUnitario) || 0);
      const discountPct = Math.min(100, Math.max(0, Number(item.descuento) || 0));
      const taxRateInfo = TAX_RATES.find((t) => t.id === item.impuestoId);
      const taxRate = taxRateInfo ? taxRateInfo.rate : 0.16;
      const taxName = taxRateInfo ? taxRateInfo.name : 'IVA 16%';
      const taxId = item.impuestoId || 'iva-16';

      // Subtotal antes de descuento
      const lineGross = qty * price;
      // Descuento
      const lineDiscount = lineGross * (discountPct / 100);
      // Base gravable
      const base = lineGross - lineDiscount;
      // Impuesto de la línea
      const lineTax = base * taxRate;
      // Subtotal línea (con impuesto)
      const lineTotal = base + lineTax;

      subtotal += base;
      totalDescuento += lineDiscount;

      // Acumular impuestos por tipo
      if (lineTax > 0) {
        if (!taxBreakdown[taxId]) {
          taxBreakdown[taxId] = { name: taxName, rate: taxRate, amount: 0 };
        }
        taxBreakdown[taxId].amount += lineTax;
      }

      return {
        ...item,
        _lineGross: lineGross,
        _lineDiscount: lineDiscount,
        _lineBase: base,
        _lineTax: lineTax,
        _lineTotal: lineTotal,
      };
    });

    const totalTax = Object.values(taxBreakdown).reduce((sum, t) => sum + t.amount, 0);
    const total = subtotal + totalTax;

    return {
      calculatedLines,
      subtotal,
      totalDescuento,
      totalTax,
      total,
      taxBreakdown,
    };
  }, [lineItems]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleConditionChange = useCallback((value) => {
    const days = parseInt(value, 10) || 0;
    const newFecha = days > 0
      ? format(addDays(parseISO(form.fechaEmision || format(new Date(), 'yyyy-MM-dd')), days), 'yyyy-MM-dd')
      : form.fechaEmision;

    setForm((prev) => ({
      ...prev,
      condicionesPago: value,
      fechaVencimiento: newFecha,
    }));
  }, [form.fechaEmision]);

  const handleProductSelect = useCallback((lineId, product) => {
    if (!product) return;

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        return {
          ...item,
          productoId: product.id,
          descripcion: product.descripcion || product.nombre,
          precioUnitario: product.precio ?? 0,
          impuestoId: product.impuesto || 'iva-16',
        };
      })
    );
  }, []);

  const handleLineChange = useCallback((lineId, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        return { ...item, [field]: value };
      })
    );
  }, []);

  const handleAddLine = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLine()]);
  }, []);

  const handleRemoveLine = useCallback((lineId) => {
    setLineItems((prev) => {
      if (prev.length <= 1) {
        toast.error('La factura debe tener al menos una línea');
        return prev;
      }
      return prev.filter((item) => item.id !== lineId);
    });
  }, []);

  const handleRegenerateNumber = useCallback(() => {
    setForm((prev) => ({ ...prev, numero: generateNumber() }));
  }, [generateNumber]);

  // ── Validación ───────────────────────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.clienteId) {
      newErrors.clienteId = 'Debes seleccionar un cliente';
    }

    if (lineItems.length === 0) {
      newErrors.items = 'Debes agregar al menos un concepto';
    }

    const hasValidItem = lineItems.some(
      (item) => (item.productoId || item.descripcion) && Number(item.cantidad) > 0
    );

    if (!hasValidItem) {
      newErrors.items = 'Al menos un concepto debe tener producto y cantidad mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.clienteId, lineItems]);

  // ── Guardar ──────────────────────────────────────────────────
  const handleSave = useCallback(
    async (emitir = false) => {
      if (!validate()) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      setSaving(true);

      try {
        const client = clients.find((c) => c.id === form.clienteId);

        const invoiceData = {
          clienteId: form.clienteId,
          clienteNombre: client?.nombre || '',
          clienteEmpresa: client?.empresa || '',
          numero: form.numero,
          fechaEmision: form.fechaEmision,
          fechaVencimiento: form.fechaVencimiento,
          condicionesPago: form.condicionesPago,
          metodoPago: form.metodoPago,
          notas: form.notas.trim() || null,
          status: emitir ? 'EMITIDA' : 'BORRADOR',
          subtotal: calculations.subtotal,
          totalDescuento: calculations.totalDescuento,
          impuestos: calculations.totalTax,
          total: calculations.total,
          items: calculations.calculatedLines.map((line) => ({
            id: line.id,
            productoId: line.productoId || null,
            descripcion: line.descripcion || '',
            cantidad: Number(line.cantidad) || 0,
            precioUnitario: Number(line.precioUnitario) || 0,
            descuento: Number(line.descuento) || 0,
            impuestoId: line.impuestoId,
            subtotal: line._lineBase,
            impuesto: line._lineTax,
            totalLinea: line._lineTotal,
          })),
        };

        if (isEditing && id) {
          await update(id, invoiceData);
          toast.success(emitir ? 'Factura emitida correctamente' : 'Factura actualizada correctamente');
          navigate(ROUTES.FACTURA_VER.replace(':id', id));
        } else {
          const created = await create(invoiceData);
          toast.success(emitir ? 'Factura emitida correctamente' : 'Borrador guardado correctamente');
          navigate(ROUTES.FACTURA_VER.replace(':id', created.id));
        }
      } catch (err) {
        toast.error(err?.message || 'Error al guardar la factura');
      } finally {
        setSaving(false);
      }
    },
    [validate, form, clients, calculations, isEditing, id, create, update, navigate]
  );

  // ── Breadcrumbs ──────────────────────────────────────────────
  const breadcrumbs = useMemo(() => {
    const base = [{ label: 'Facturas', path: ROUTES.FACTURAS }];
    if (isEditing) {
      base.push({ label: `Editar: ${form.numero}` });
    } else {
      base.push({ label: 'Nueva Factura' });
    }
    return base;
  }, [isEditing, form.numero]);

  // ── Loading al editar ────────────────────────────────────────
  if (loadingEdit || (isEditing && loadingInvoices)) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-64 rounded-[var(--radius-sm)] animate-shimmer bg-[var(--bg-tertiary)]" />
        <div className="h-4 w-96 rounded-[var(--radius-sm)] animate-shimmer bg-[var(--bg-tertiary)]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="h-96 rounded-[var(--radius-lg)] animate-shimmer bg-[var(--bg-tertiary)]" />
          <div className="lg:col-span-2 h-96 rounded-[var(--radius-lg)] animate-shimmer bg-[var(--bg-tertiary)]" />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* ── Encabezado ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={isEditing ? 'Editar Factura' : 'Nueva Factura'}
          subtitle={isEditing ? `Modificando ${form.numero}` : 'Completa los datos para crear una factura'}
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSave(false)}
                loading={saving}
                icon={Save}
              >
                Guardar Borrador
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                loading={saving}
                icon={Send}
              >
                Emitir Factura
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* ── Layout principal ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Columna izquierda: Info de factura ─────────────── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          {/* Cliente */}
          <Card title="Cliente" icon={() => null} padding="p-4">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <AlertCircle size={28} className="text-[var(--color-warning)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  No hay clientes registrados
                </p>
                <Link to={ROUTES.CLIENTE_NUEVO}>
                  <Button variant="outline" size="sm" icon={Plus}>
                    Crear cliente primero
                  </Button>
                </Link>
              </div>
            ) : (
              <Select
                label="Cliente"
                required
                options={clientOptions}
                placeholder="Seleccionar cliente..."
                value={form.clienteId}
                onChange={(e) => handleFieldChange('clienteId', e.target.value)}
                error={errors.clienteId}
              />
            )}

            {form.clienteId && (() => {
              const client = clients.find((c) => c.id === form.clienteId);
              if (!client) return null;
              return (
                <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] flex flex-col gap-1">
                  {client.empresa && (
                    <span className="text-xs font-medium text-[var(--text-primary)]">{client.empresa}</span>
                  )}
                  {client.email && (
                    <span className="text-xs text-[var(--text-secondary)]">{client.email}</span>
                  )}
                  {client.rfc && (
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">RFC: {client.rfc}</span>
                  )}
                </div>
              );
            })()}
          </Card>

          {/* Datos de factura */}
          <Card title="Datos de Factura" icon={() => null} padding="p-4">
            <div className="flex flex-col gap-3">
              {/* Número */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Número de Factura
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.numero}
                    readOnly
                    className="input-base w-full text-sm bg-[var(--bg-tertiary)] cursor-default font-mono"
                  />
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      onClick={handleRegenerateNumber}
                      title="Regenerar número"
                      className="shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="F. Emisión"
                  type="date"
                  value={form.fechaEmision}
                  onChange={(e) => handleFieldChange('fechaEmision', e.target.value)}
                />
                <Input
                  label="F. Vencimiento"
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => handleFieldChange('fechaVencimiento', e.target.value)}
                />
              </div>

              {/* Condiciones + Método de pago */}
              <Select
                label="Condiciones de Pago"
                options={PAYMENT_TERMS}
                value={form.condicionesPago}
                onChange={(e) => handleConditionChange(e.target.value)}
              />

              <Select
                label="Método de Pago"
                options={paymentMethodOptions}
                value={form.metodoPago}
                onChange={(e) => handleFieldChange('metodoPago', e.target.value)}
              />

              {/* Notas */}
              <Input
                label="Notas"
                type="textarea"
                placeholder="Notas adicionales para el cliente..."
                value={form.notas}
                onChange={(e) => handleFieldChange('notas', e.target.value)}
              />
            </div>
          </Card>
        </motion.div>

        {/* ── Columna derecha: Conceptos + Resumen ───────────── */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-4">
          {/* Conceptos */}
          <Card
            title="Conceptos"
            subtitle={`${lineItems.length} artículo${lineItems.length !== 1 ? 's' : ''}`}
            icon={() => null}
            padding="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide min-w-[200px]">
                      Producto
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide min-w-[140px] hidden md:table-cell">
                      Descripción
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide w-20">
                      Cantidad
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide w-28">
                      Precio Unit.
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide w-20 hidden sm:table-cell">
                      Desc. %
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide w-24 hidden lg:table-cell">
                      Impuesto
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide w-28">
                      Subtotal
                    </th>
                    <th className="px-3 py-2.5 w-10" />
                  </tr>
                </thead>

                <tbody>
                  {calculations.calculatedLines.map((line, idx) => (
                    <tr
                      key={line.id}
                      className={`
                        border-b border-[var(--border-default)] last:border-b-0
                        ${idx % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]'}
                      `}
                    >
                      {/* Producto */}
                      <td className="px-3 py-2">
                        <SearchableProductSelect
                          products={products}
                          value={line.productoId}
                          onChange={(product) => handleProductSelect(line.id, product)}
                        />
                        {/* Descripción en móvil */}
                        <input
                          type="text"
                          value={line.descripcion}
                          onChange={(e) => handleLineChange(line.id, 'descripcion', e.target.value)}
                          placeholder="Descripción..."
                          className="input-base w-full text-xs px-2 py-1.5 mt-1.5 md:hidden"
                        />
                      </td>

                      {/* Descripción (desktop) */}
                      <td className="px-3 py-2 hidden md:table-cell">
                        <input
                          type="text"
                          value={line.descripcion}
                          onChange={(e) => handleLineChange(line.id, 'descripcion', e.target.value)}
                          placeholder="Descripción..."
                          className="input-base w-full text-sm px-2 py-1.5"
                        />
                      </td>

                      {/* Cantidad */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.cantidad}
                          onChange={(e) => handleLineChange(line.id, 'cantidad', e.target.value)}
                          className="input-base w-full text-sm px-2 py-1.5 text-center"
                        />
                      </td>

                      {/* Precio unitario */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.precioUnitario}
                          onChange={(e) => handleLineChange(line.id, 'precioUnitario', e.target.value)}
                          className="input-base w-full text-sm px-2 py-1.5 text-right font-mono"
                        />
                      </td>

                      {/* Descuento */}
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={line.descuento}
                          onChange={(e) => handleLineChange(line.id, 'descuento', e.target.value)}
                          className="input-base w-full text-sm px-2 py-1.5 text-center"
                        />
                      </td>

                      {/* Impuesto */}
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <select
                          value={line.impuestoId}
                          onChange={(e) => handleLineChange(line.id, 'impuestoId', e.target.value)}
                          className="input-base w-full text-sm px-2 py-1.5 appearance-none pr-7 cursor-pointer"
                        >
                          {taxOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Subtotal línea */}
                      <td className="px-3 py-2">
                        <span className="font-semibold text-[var(--text-primary)] font-mono text-sm">
                          {formatCurrency(line._lineTotal)}
                        </span>
                      </td>

                      {/* Eliminar */}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[#fee2e2] dark:hover:bg-[#450a0a] transition-colors cursor-pointer"
                          aria-label="Eliminar línea"
                          title="Eliminar línea"
                          disabled={lineItems.length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agregar línea */}
            <div className="px-4 py-3 border-t border-[var(--border-default)]">
              <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={handleAddLine}
                fullWidth
              >
                Agregar Línea
              </Button>
            </div>

            {errors.items && (
              <div className="px-4 pb-3">
                <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.items}
                </p>
              </div>
            )}
          </Card>

          {/* ── Resumen ──────────────────────────────────────── */}
          <Card title="Resumen" icon={() => null} padding="p-4">
            <div className="flex flex-col gap-2">
              {/* Subtotal */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--text-secondary)]">Subtotal</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              {/* Descuento total */}
              {calculations.totalDescuento > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">Descuento Total</span>
                  <span className="text-sm font-mono text-[var(--color-error)]">
                    -{formatCurrency(calculations.totalDescuento)}
                  </span>
                </div>
              )}

              {/* Desglose de impuestos */}
              <div className="border-t border-[var(--border-default)] pt-2 mt-1">
                {Object.values(calculations.taxBreakdown).map((tax) => (
                  <div key={tax.name} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {tax.name}
                    </span>
                    <span className="text-sm font-mono text-[var(--text-primary)]">
                      {formatCurrency(tax.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 mt-1 border-t-2 border-[var(--border-strong)]">
                <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
                <span className="text-xl font-bold text-[var(--color-brand-600)] font-mono">
                  {formatCurrency(calculations.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* ── Acciones inferiores (móvil) ───────────────────── */}
          <div className="flex items-center gap-3 lg:hidden">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleSave(false)}
              loading={saving}
              icon={Save}
            >
              Guardar Borrador
            </Button>
            <Button
              fullWidth
              onClick={() => handleSave(true)}
              loading={saving}
              icon={Send}
            >
              Emitir Factura
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}