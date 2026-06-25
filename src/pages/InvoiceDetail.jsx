import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Download,
  Trash2,
  Printer,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Hash,
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
  Percent,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useData } from '../hooks/useData';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatPhone,
} from '../utils/formatters';
import {
  INVOICE_STATUSES,
  TAX_RATES,
  PAYMENT_METHODS,
  PAYMENT_FORMS,
  ROUTES,
} from '../utils/constants';

// ── Animaciones ──────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────
function getStatusVariant(status) {
  const cfg = INVOICE_STATUSES[status];
  return cfg?.color || 'default';
}

function getPaymentMethodLabel(key) {
  return PAYMENT_METHODS.find((m) => m.key === key)?.label || key || '—';
}

function getPaymentFormLabel(key) {
  return PAYMENT_FORMS.find((f) => f.key === key)?.label || key || '—';
}

function getTaxRate(id) {
  return TAX_RATES.find((t) => t.id === id);
}

// ════════════════════════════════════════════════════════════════
// Componente: Línea de tiempo de estado de pago
// ════════════════════════════════════════════════════════════════
function PaymentTimeline({ invoice }) {
  const steps = [
    {
      key: 'BORRADOR',
      label: 'Creada',
      icon: FileText,
      date: invoice.created_at,
    },
    {
      key: 'EMITIDA',
      label: 'Emitida',
      icon: Receipt,
      date: invoice.fechaEmision,
    },
    {
      key: 'PAGADA',
      label: 'Pagada',
      icon: CheckCircle2,
      date: invoice.fechaPago,
    },
  ];

  const statusOrder = ['BORRADOR', 'EMITIDA', 'PENDIENTE', 'VENCIDA', 'PAGADA', 'CANCELADA'];
  const currentIndex = statusOrder.indexOf(invoice.status);

  const getStepState = (stepKey) => {
    if (invoice.status === 'CANCELADA') {
      return stepKey === 'BORRADOR' ? 'completed' : 'cancelled';
    }
    if (stepKey === 'BORRADOR') return 'completed';
    if (stepKey === 'EMITIDA') {
      if (currentIndex >= 1) return 'completed';
      return 'pending';
    }
    if (stepKey === 'PAGADA') {
      if (invoice.status === 'PAGADA') return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => {
        const state = getStepState(step.key);
        const Icon = step.icon;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${state === 'completed'
                    ? 'border-[var(--color-success)] bg-[#d1fae5] text-[var(--color-success)]'
                    : state === 'cancelled'
                    ? 'border-[var(--text-tertiary)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                    : 'border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-tertiary)]'
                  }
                `}
              >
                {state === 'completed' ? <CheckCircle2 size={18} /> : state === 'cancelled' ? <XCircle size={18} /> : <Circle size={18} />}
              </div>
              <span className={`text-xs font-medium ${state === 'completed' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)'}`}>
                {step.label}
              </span>
              {step.date && state === 'completed' && (
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {formatDate(step.date, 'd MMM')}
                </span>
              )}
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-3 mt-[-20px]">
                <div className={`h-full rounded-full transition-colors ${
                  state === 'completed' ? 'bg-[var(--color-success)]' : 'bg-[var(--border-default)]'
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Componente: Modal Registrar Pago
// ════════════════════════════════════════════════════════════════
function RegisterPaymentModal({ isOpen, onClose, invoice, onConfirm }) {
  const [form, setForm] = useState({
    monto: invoice?.total || 0,
    fechaPago: new Date().toISOString().split('T')[0],
    referencia: '',
    metodoPago: '03',
    formaPago: '03',
  });

  useEffect(() => {
    if (invoice) {
      setForm((prev) => ({
        ...prev,
        monto: invoice.total || 0,
      }));
    }
  }, [invoice]);

  const paymentMethodOptions = PAYMENT_METHODS.map((m) => ({
    value: m.key,
    label: m.label,
  }));

  const paymentFormOptions = PAYMENT_FORMS.map((f) => ({
    value: f.key,
    label: f.label,
  }));

  const handleConfirm = () => {
    if (!form.monto || Number(form.monto) <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }
    if (!form.fechaPago) {
      toast.error('La fecha de pago es requerida');
      return;
    }
    onConfirm(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} icon={CheckCircle2}>
            Registrar Pago
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] flex items-center gap-2 text-sm">
          <Info size={16} className="text-[var(--color-brand-600)] shrink-0" />
          <span className="text-[var(--text-secondary)]">
            Factura <strong>{invoice?.numero}</strong> — Total: <strong>{formatCurrency(invoice?.total)}</strong>
          </span>
        </div>

        <Input
          label="Monto del pago"
          type="number"
          icon={DollarSign}
          value={form.monto}
          onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
          step="0.01"
          min="0"
        />

        <Input
          label="Fecha de pago"
          type="date"
          icon={Calendar}
          value={form.fechaPago}
          onChange={(e) => setForm((p) => ({ ...p, fechaPago: e.target.value }))}
        />

        <Input
          label="Referencia"
          type="text"
          icon={Hash}
          placeholder="Número de referencia del pago"
          value={form.referencia}
          onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
        />

        <Select
          label="Método de pago"
          options={paymentMethodOptions}
          value={form.metodoPago}
          onChange={(e) => setForm((p) => ({ ...p, metodoPago: e.target.value }))}
        />

        <Select
          label="Forma de pago"
          options={paymentFormOptions}
          value={form.formaPago}
          onChange={(e) => setForm((p) => ({ ...p, formaPago: e.target.value }))}
        />
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// Página principal: InvoiceDetail
// ════════════════════════════════════════════════════════════════
export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useApp();

  const { items: invoices, loading, getById, update, remove } = useData('invoices');
  const { items: clients } = useData('clients');
  const { items: products } = useData('products');

  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Cargar factura al montar ─────────────────────────────────
  useEffect(() => {
    async function load() {
      const data = await getById(id);
      if (data) {
        setInvoice(data);
      }
    }
    load();
  }, [id, getById]);

  // ── Buscar cliente asociado ──────────────────────────────────
  useEffect(() => {
    if (invoice?.clienteId && clients.length > 0) {
      const found = clients.find((c) => c.id === invoice.clienteId);
      setClient(found || null);
    }
  }, [invoice, clients]);

  // ── Calcular totales de líneas ───────────────────────────────
  const lineItems = useMemo(() => {
    if (!invoice?.items) return [];
    return invoice.items.map((item) => {
      const qty = Number(item.cantidad) || 0;
      const unitPrice = Number(item.precioUnitario) || 0;
      const discount = Number(item.descuento) || 0;
      const taxRate = getTaxRate(item.impuestoId);
      const rate = taxRate?.rate || 0;
      const lineSubtotal = qty * unitPrice;
      const discountAmount = lineSubtotal * (discount / 100);
      const taxableBase = lineSubtotal - discountAmount;
      const taxAmount = taxableBase * rate;
      const lineTotal = taxableBase + taxAmount;

      return {
        ...item,
        productName: item.productoId && products.length > 0
          ? products.find((p) => p.id === item.productoId)?.nombre || item.descripcion || '—'
          : item.descripcion || '—',
        taxName: taxRate?.name || '—',
        taxRateDisplay: formatPercentage(rate),
        qty,
        unitPrice,
        discount,
        rate,
        lineSubtotal,
        discountAmount,
        taxableBase,
        taxAmount,
        lineTotal,
      };
    });
  }, [invoice, products]);

  const summary = useMemo(() => {
    const subtotal = lineItems.reduce((s, i) => s + i.lineSubtotal, 0);
    const totalDiscount = lineItems.reduce((s, i) => s + i.discountAmount, 0);
    const totalTax = lineItems.reduce((s, i) => s + i.taxAmount, 0);
    const total = lineItems.reduce((s, i) => s + i.lineTotal, 0);

    // Desglose de impuestos
    const taxBreakdown = {};
    lineItems.forEach((item) => {
      const key = item.impuestoId || 'otro';
      if (!taxBreakdown[key]) {
        const tr = getTaxRate(key);
        taxBreakdown[key] = { name: tr?.name || 'Otro', rate: tr?.rate || 0, base: 0, amount: 0 };
      }
      taxBreakdown[key].base += item.taxableBase;
      taxBreakdown[key].amount += item.taxAmount;
    });

    return { subtotal, totalDiscount, totalTax, total, taxBreakdown: Object.values(taxBreakdown) };
  }, [lineItems]);

  // ── Columnas de la tabla de líneas ──────────────────────────
  const lineColumns = useMemo(
    () => [
      { key: 'productName', label: 'Producto / Descripción' },
      { key: 'qty', label: 'Cant.', width: '70px', render: (v) => v },
      { key: 'unitPrice', label: 'P. Unitario', width: '110px', render: (v) => formatCurrency(v) },
      { key: 'discount', label: 'Desc.', width: '70px', render: (v) => v > 0 ? `${v}%` : '—' },
      { key: 'taxRateDisplay', label: 'Impuesto', width: '80px' },
      { key: 'taxAmount', label: 'Monto Imp.', width: '110px', render: (v) => formatCurrency(v) },
      { key: 'lineTotal', label: 'Total', width: '120px', render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    ],
    []
  );

  // ── Registrar pago ───────────────────────────────────────────
  const handleRegisterPayment = useCallback(async (paymentData) => {
    setSavingPayment(true);
    try {
      await update(id, {
        status: 'PAGADA',
        fechaPago: paymentData.fechaPago,
        metodoPago: paymentData.metodoPago,
        formaPago: paymentData.formaPago,
        referenciaPago: paymentData.referencia,
        pago: {
          monto: Number(paymentData.monto),
          fecha: paymentData.fechaPago,
          referencia: paymentData.referencia,
          metodoPago: paymentData.metodoPago,
          formaPago: paymentData.formaPago,
        },
      });
      setInvoice((prev) => ({
        ...prev,
        status: 'PAGADA',
        fechaPago: paymentData.fechaPago,
        pago: {
          monto: Number(paymentData.monto),
          fecha: paymentData.fechaPago,
          referencia: paymentData.referencia,
        },
      }));
      setShowPaymentModal(false);
      toast.success('Pago registrado exitosamente');
    } catch (err) {
      toast.error('Error al registrar el pago');
    } finally {
      setSavingPayment(false);
    }
  }, [id, update]);

  // ── Eliminar factura ─────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await remove(id);
      toast.success('Factura eliminada');
      navigate(ROUTES.FACTURAS);
    } catch {
      toast.error('Error al eliminar la factura');
    } finally {
      setDeleting(false);
    }
  }, [id, remove, navigate]);

  // ── Descargar PDF ────────────────────────────────────────────
  const handleDownloadPDF = useCallback(() => {
    if (!invoice) return;
    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nombre || 'Mi Empresa', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (company.rfc) doc.text(`RFC: ${company.rfc}`, 14, 27);
    if (company.contacto?.email) doc.text(company.contacto.email, 14, 33);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.numero || 'Factura', 14, 48);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatDate(invoice.fecha)}`, 14, 55);
    doc.text(`Vencimiento: ${formatDate(invoice.fechaVencimiento)}`, 14, 60);
    doc.text(`Estado: ${INVOICE_STATUSES[invoice.status]?.label || invoice.status}`, 14, 65);

    // Cliente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', 14, 78);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(client?.nombre || '—', 14, 84);
    if (client?.email) doc.text(client.email, 14, 89);
    if (client?.telefono) doc.text(client.telefono, 14, 94);

    // Tabla de líneas
    const tableRows = lineItems.map((item) => [
      item.productName,
      String(item.qty),
      formatCurrency(item.unitPrice),
      item.discount > 0 ? `${item.discount}%` : '—',
      item.taxRateDisplay,
      formatCurrency(item.lineTotal),
    ]);

    doc.autoTable({
      startY: 102,
      head: [['Concepto', 'Cant.', 'P. Unitario', 'Desc.', 'Imp.', 'Total']],
      body: tableRows,
      foot: [['', '', '', '', 'Subtotal', formatCurrency(summary.subtotal)]],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    });

    // Totales
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    if (summary.totalDiscount > 0) {
      doc.text(`Descuento total: ${formatCurrency(summary.totalDiscount)}`, 140, finalY);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total: ${formatCurrency(summary.total)}`, 140, finalY + (summary.totalDiscount > 0 ? 7 : 0));

    doc.save(`${invoice.numero || 'factura'}.pdf`);
    toast.success('PDF descargado');
  }, [invoice, client, company, lineItems, summary]);

  // ── Imprimir ─────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Loading / Empty ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-[var(--color-brand-600)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <EmptyState
          icon={FileText}
          title="Factura no encontrada"
          description="La factura que buscas no existe o fue eliminada."
          action={
            <Link to={ROUTES.FACTURAS}>
              <Button variant="outline" icon={ArrowLeft}>
                Volver a Facturas
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const statusCfg = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.BORRADOR;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          breadcrumbs={[
            { label: 'Facturas', path: ROUTES.FACTURAS },
            { label: invoice.numero || 'Detalle' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.FACTURAS)}>
                Volver
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Pencil}
                onClick={() => navigate(ROUTES.FACTURA_EDITAR.replace(':id', id))}
              >
                Editar
              </Button>
              <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadPDF}>
                PDF
              </Button>
              <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
                Imprimir
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setShowDeleteDialog(true)}
              >
                Eliminar
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* ── Título de factura + estado ──────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {invoice.numero || 'Sin número'}
        </h2>
        <Badge variant={getStatusVariant(invoice.status)} size="lg" dot>
          {statusCfg.label}
        </Badge>
      </motion.div>

      {/* ── Línea de tiempo de pago ─────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <PaymentTimeline invoice={invoice} />
          {invoice.status !== 'PAGADA' && invoice.status !== 'CANCELADA' && invoice.status !== 'BORRADOR' && (
            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={() => setShowPaymentModal(true)}
              >
                Registrar Pago
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Info del cliente ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card title="Datos del Cliente" icon={User} subtitle="Información de facturación">
            <div className="flex flex-col gap-3">
              <InfoRow icon={User} label="Nombre" value={client?.nombre || '—'} />
              <InfoRow icon={User} label="Empresa" value={client?.empresa || '—'} />
              <InfoRow icon={Mail} label="Correo" value={client?.email || '—'} />
              <InfoRow icon={Phone} label="Teléfono" value={client?.telefono ? formatPhone(client.telefono) : '—'} />
              <InfoRow icon={MapPin} label="Dirección" value={client?.direccion || '—'} />
              {client?.rfc && <InfoRow icon={Hash} label="RFC / ID Fiscal" value={client.rfc} />}
            </div>
          </Card>
        </motion.div>

        {/* ── Info de la factura ───────────────────────────── */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card title="Datos de la Factura" icon={FileText} subtitle="Información general">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <InfoRow icon={Calendar} label="Fecha de emisión" value={formatDate(invoice.fecha)} />
              <InfoRow icon={Calendar} label="Fecha de vencimiento" value={formatDate(invoice.fechaVencimiento)} />
              <InfoRow icon={CreditCard} label="Método de pago" value={getPaymentMethodLabel(invoice.metodoPago)} />
              <InfoRow icon={Receipt} label="Forma de pago" value={getPaymentFormLabel(invoice.formaPago)} />
              <InfoRow icon={Hash} label="Condiciones de pago" value={invoice.condicionesPago ? `${invoice.condicionesPago} días` : '—'} />
              {invoice.moneda && <InfoRow icon={DollarSign} label="Moneda" value={invoice.moneda} />}
              {invoice.nota && (
                <div className="col-span-full mt-2 p-3 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)]">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Notas</span>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{invoice.nota}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Tabla de conceptos ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Conceptos" icon={FileText} subtitle={`${lineItems.length} artículo(s)`} padding="p-0">
          <Table
            columns={lineColumns}
            data={lineItems}
            emptyMessage="No hay conceptos en esta factura"
          />
        </Card>
      </motion.div>

      {/* ── Resumen de totales ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <Card>
              <div className="flex flex-col gap-2.5">
                <SummaryRow label="Subtotal" value={formatCurrency(summary.subtotal)} />
                {summary.totalDiscount > 0 && (
                  <SummaryRow label="Descuento total" value={`-${formatCurrency(summary.totalDiscount)}`} className="text-[var(--color-warning)]" />
                )}
                {summary.taxBreakdown.map((tax) => (
                  <SummaryRow
                    key={tax.name}
                    label={`${tax.name} (base: ${formatCurrency(tax.base)})`}
                    value={formatCurrency(tax.amount)}
                    className="text-[var(--text-secondary)]"
                  />
                ))}
                <div className="border-t border-[var(--border-default)] pt-2.5 mt-1">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(summary.total)}
                    className="text-lg font-bold text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* ── Modal: Registrar Pago ───────────────────────────── */}
      <RegisterPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onConfirm={handleRegisterPayment}
      />

      {/* ── Diálogo: Eliminar ──────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Eliminar Factura"
        message={`¿Estás seguro de eliminar la factura ${invoice.numero}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </motion.div>
  );
}

// ── Componentes auxiliares ───────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="flex items-center justify-center w-7 h-7 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] shrink-0 mt-0.5">
        <Icon size={13} />
      </div>
      <div className="min-w-0">
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
        <p className="text-[var(--text-primary)] font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, className = '' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm text-[var(--text-secondary)] ${className}`}>{label}</span>
      <span className={`text-sm tabular-nums ${className}`}>{value}</span>
    </div>
  );
}