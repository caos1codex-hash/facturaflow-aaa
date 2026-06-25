import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  FileJson,
  FileDown,
  ChevronDown,
  Filter,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useData } from '../hooks/useData';
import { PageHeader } from '../components/ui/PageHeader';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { INVOICE_STATUSES, INVOICE_STATUS_LIST, ROUTES } from '../utils/constants';

// ── Elementos por página ───────────────────────────────────────
const PER_PAGE = 15;

// ── Tabs de estado para filtro rápido ──────────────────────────
const STATUS_FILTER_TABS = [
  { key: '', label: 'Todos' },
  ...INVOICE_STATUS_LIST.map((s) => ({ key: s.key, label: s.label })),
];

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

// ── Helper: obtener configuración de estado ────────────────────
function getStatusConfig(status) {
  return INVOICE_STATUSES[status] || INVOICE_STATUSES.BORRADOR;
}

// ── Helper: badge variant desde status key ─────────────────────
function getBadgeVariant(status) {
  if (!INVOICE_STATUSES[status]) return 'default';
  return status.toLowerCase();
}

// ════════════════════════════════════════════════════════════════
// Componente StatusDropdown (cambio rápido de estado)
// ════════════════════════════════════════════════════════════════
function StatusDropdown({ invoice, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const cfg = getStatusConfig(invoice.status);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer"
        aria-label="Cambiar estado"
      >
        <Badge variant={getBadgeVariant(invoice.status)} size="sm" dot>
          {cfg.label}
        </Badge>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-30 w-44 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] py-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Cambiar estado
            </div>
            {INVOICE_STATUS_LIST.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  onUpdate(invoice, s.key);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer
                  ${s.key === invoice.status
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dotColor}`} />
                {s.label}
                {s.key === invoice.status && (
                  <svg className="w-4 h-4 ml-auto text-[var(--color-brand-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Componente ExportDropdown
// ════════════════════════════════════════════════════════════════
function ExportDropdown({ data, onExport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const formats = [
    { key: 'csv', label: 'CSV', icon: FileDown, desc: 'Valores separados por comas' },
    { key: 'excel', label: 'Excel', icon: FileSpreadsheet, desc: 'Libro de Excel (.xlsx)' },
    { key: 'pdf', label: 'PDF', icon: FileText, desc: 'Documento PDF con tabla' },
    { key: 'json', label: 'JSON', icon: FileJson, desc: 'Datos en formato JSON' },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        icon={Download}
        iconRight={ChevronDown}
        iconPosition="right"
        onClick={() => setOpen((prev) => !prev)}
      >
        Exportar
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-30 w-56 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] py-1 overflow-hidden"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Formato de exportación
            </div>
            {formats.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  onExport(f.key, data);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <f.icon size={16} className="shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{f.desc}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Funciones de exportación
// ════════════════════════════════════════════════════════════════
function exportCSV(data) {
  const headers = [
    'Número',
    'Cliente',
    'Fecha Emisión',
    'Fecha Vencimiento',
    'Subtotal',
    'Impuestos',
    'Total',
    'Estado',
  ];

  const rows = data.map((inv) => [
    inv.numero || '',
    inv.clienteNombre || inv.cliente?.nombre || '',
    inv.fechaEmision || inv.fecha || '',
    inv.fechaVencimiento || inv.fechaVencimiento || '',
    Number(inv.subtotal || 0).toFixed(2),
    Number(inv.impuestos || 0).toFixed(2),
    Number(inv.total || 0).toFixed(2),
    getStatusConfig(inv.status).label,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `facturas_${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportExcel(data) {
  const rows = data.map((inv) => ({
    'Número': inv.numero || '',
    'Cliente': inv.clienteNombre || inv.cliente?.nombre || '',
    'Fecha Emisión': inv.fechaEmision || inv.fecha || '',
    'Fecha Vencimiento': inv.fechaVencimiento || '',
    'Subtotal': Number(inv.subtotal || 0),
    'Impuestos': Number(inv.impuestos || 0),
    'Total': Number(inv.total || 0),
    'Estado': getStatusConfig(inv.status).label,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Facturas');

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 20 }, // Número
    { wch: 30 }, // Cliente
    { wch: 14 }, // Fecha Emisión
    { wch: 14 }, // Fecha Vencimiento
    { wch: 14 }, // Subtotal
    { wch: 12 }, // Impuestos
    { wch: 14 }, // Total
    { wch: 12 }, // Estado
  ];

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `facturas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportPDF(data) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text('FacturaFlow AAA - Reporte de Facturas', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 14, 28);
  doc.text(`Total de facturas: ${data.length}`, 14, 34);

  // Tabla
  const tableData = data.map((inv) => [
    inv.numero || '',
    inv.clienteNombre || inv.cliente?.nombre || '',
    formatDate(inv.fechaEmision || inv.fecha),
    formatDate(inv.fechaVencimiento),
    formatCurrency(inv.subtotal || 0),
    formatCurrency(inv.impuestos || 0),
    formatCurrency(inv.total || 0),
    getStatusConfig(inv.status).label,
  ]);

  doc.autoTable({
    startY: 40,
    head: [['Número', 'Cliente', 'F. Emisión', 'F. Venc.', 'Subtotal', 'Impuestos', 'Total', 'Estado']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 22 },
    },
  });

  // Total general
  const totalGeneral = data.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const finalY = doc.lastAutoTable.finalY + 10;

  if (finalY < 270) {
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(`Total General: ${formatCurrency(totalGeneral)}`, 14, finalY);
  }

  doc.save(`facturas_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportJSON(data) {
  const cleanData = data.map((inv) => ({
    numero: inv.numero || '',
    cliente: inv.clienteNombre || inv.cliente?.nombre || '',
    fechaEmision: inv.fechaEmision || inv.fecha || '',
    fechaVencimiento: inv.fechaVencimiento || '',
    subtotal: Number(inv.subtotal || 0),
    impuestos: Number(inv.impuestos || 0),
    total: Number(inv.total || 0),
    estado: getStatusConfig(inv.status).label,
    estadoClave: inv.status,
    items: inv.items || [],
  }));

  const jsonContent = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `facturas_${new Date().toISOString().slice(0, 10)}.json`);
}

// ════════════════════════════════════════════════════════════════
// Componente Invoices
// ════════════════════════════════════════════════════════════════
export default function Invoices() {
  const navigate = useNavigate();
  const { items: invoices, loading, update, remove } = useData('invoices');

  // ── Estado local ─────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fechaEmision', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Facturas filtradas ───────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Filtro por estado
    if (statusFilter) {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Filtro por fecha desde
    if (dateFrom) {
      result = result.filter((inv) => {
        const fecha = inv.fechaEmision || inv.fecha;
        return fecha && fecha >= dateFrom;
      });
    }

    // Filtro por fecha hasta
    if (dateTo) {
      result = result.filter((inv) => {
        const fecha = inv.fechaEmision || inv.fecha;
        return fecha && fecha <= dateTo;
      });
    }

    // Filtro por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (inv) =>
          (inv.numero || '').toLowerCase().includes(q) ||
          (inv.clienteNombre || '').toLowerCase().includes(q) ||
          ((inv.cliente && inv.cliente.nombre) || '').toLowerCase().includes(q)
      );
    }

    // Ordenar
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';

      // Ordenamiento especial para montos
      if (['subtotal', 'impuestos', 'total'].includes(sortConfig.key)) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Ordenamiento por fecha
      if (['fechaEmision', 'fechaVencimiento', 'fecha'].includes(sortConfig.key)) {
        const aDate = new Date(a.fechaEmision || a.fecha || 0);
        const bDate = new Date(b.fechaEmision || b.fecha || 0);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const cmp = String(aVal).localeCompare(String(bVal), 'es');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [invoices, statusFilter, dateFrom, dateTo, search, sortConfig]);

  // ── Paginación ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredInvoices.slice(start, start + PER_PAGE);
  }, [filteredInvoices, currentPage]);

  // Reset a página 1 cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo, search]);

  // ── Navegación de página ─────────────────────────────────────
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleRowClick = useCallback((row) => {
    navigate(ROUTES.FACTURA_VER.replace(':id', row.id));
  }, [navigate]);

  const handleView = useCallback((e, row) => {
    e.stopPropagation();
    navigate(ROUTES.FACTURA_VER.replace(':id', row.id));
  }, [navigate]);

  const handleEdit = useCallback((e, row) => {
    e.stopPropagation();
    navigate(ROUTES.FACTURA_EDITAR.replace(':id', row.id));
  }, [navigate]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      toast.success('Factura eliminada correctamente');
    } catch (err) {
      toast.error(err?.message || 'Error al eliminar la factura');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove]);

  const handleStatusChange = useCallback(async (invoice, newStatus) => {
    if (invoice.status === newStatus) return;
    setStatusUpdating(invoice.id);
    try {
      await update(invoice.id, { status: newStatus });
      toast.success(`Estado cambiado a "${getStatusConfig(newStatus).label}"`);
    } catch (err) {
      toast.error(err?.message || 'Error al cambiar el estado');
    } finally {
      setStatusUpdating(null);
    }
  }, [update]);

  const handleExport = useCallback((format, data) => {
    if (data.length === 0) {
      toast.error('No hay facturas para exportar');
      return;
    }

    const exportData = search || statusFilter || dateFrom || dateTo ? filteredInvoices : invoices;

    try {
      switch (format) {
        case 'csv':
          exportCSV(exportData);
          toast.success('Archivo CSV descargado');
          break;
        case 'excel':
          exportExcel(exportData);
          toast.success('Archivo Excel descargado');
          break;
        case 'pdf':
          exportPDF(exportData);
          toast.success('Archivo PDF descargado');
          break;
        case 'json':
          exportJSON(exportData);
          toast.success('Archivo JSON descargado');
          break;
        default:
          break;
      }
    } catch (err) {
      toast.error('Error al exportar: ' + (err?.message || 'Error desconocido'));
    }
  }, [search, statusFilter, dateFrom, dateTo, filteredInvoices, invoices]);

  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  }, []);

  const hasActiveFilters = statusFilter || dateFrom || dateTo || search;

  // ── Columnas de la tabla ─────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'numero',
        label: 'Número',
        sortable: true,
        width: '150px',
        render: (val) => (
          <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
            {val || '—'}
          </span>
        ),
      },
      {
        key: 'clienteNombre',
        label: 'Cliente',
        sortable: true,
        render: (val, row) => (
          <span className="font-medium text-[var(--text-primary)]">
            {val || row.cliente?.nombre || '—'}
          </span>
        ),
      },
      {
        key: 'fechaEmision',
        label: 'F. Emisión',
        sortable: true,
        width: '120px',
        render: (val, row) => (
          <span className="text-[var(--text-secondary)]">
            {formatDate(val || row.fecha)}
          </span>
        ),
      },
      {
        key: 'fechaVencimiento',
        label: 'F. Venc.',
        sortable: true,
        width: '120px',
        render: (val) => (
          <span className="text-[var(--text-secondary)]">
            {formatDate(val)}
          </span>
        ),
      },
      {
        key: 'subtotal',
        label: 'Subtotal',
        sortable: true,
        width: '120px',
        render: (val) => (
          <span className="text-[var(--text-secondary)] font-mono text-xs">
            {formatCurrency(val || 0)}
          </span>
        ),
      },
      {
        key: 'impuestos',
        label: 'Impuestos',
        sortable: true,
        width: '110px',
        render: (val) => (
          <span className="text-[var(--text-secondary)] font-mono text-xs">
            {formatCurrency(val || 0)}
          </span>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        width: '130px',
        render: (val) => (
          <span className="font-semibold text-[var(--text-primary)] font-mono">
            {formatCurrency(val || 0)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Estado',
        width: '130px',
        render: (val, row) => (
          <StatusDropdown invoice={row} onUpdate={handleStatusChange} />
        ),
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '160px',
        render: (_val, row) => (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => handleView(e, row)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-brand-600)] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a5f] transition-colors cursor-pointer"
              aria-label="Ver factura"
              title="Ver"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={(e) => handleEdit(e, row)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-brand-600)] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a5f] transition-colors cursor-pointer"
              aria-label="Editar factura"
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExport('pdf', [row]);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-success)] hover:bg-[#d1fae5] dark:hover:bg-[#064e3b] transition-colors cursor-pointer"
              aria-label="Descargar PDF"
              title="Descargar PDF"
            >
              <Download size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[#fee2e2] dark:hover:bg-[#450a0a] transition-colors cursor-pointer"
              aria-label="Eliminar factura"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusUpdating]
  );

  // ── Números de página para paginación ────────────────────────
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(2, end - maxVisible + 1);
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

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
      {/* ── Encabezado de página ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Facturas"
          subtitle="Gestiona todas tus facturas"
          breadcrumbs={[{ label: 'Facturas' }]}
          actions={
            <div className="flex items-center gap-2">
              <ExportDropdown data={filteredInvoices} onExport={handleExport} />
              <Button
                icon={Plus}
                onClick={() => navigate(ROUTES.FACTURA_NUEVA)}
              >
                Nueva Factura
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* ── Barra de filtros ──────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {/* Tabs de estado + toggle de filtros */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          {/* Status pills */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] overflow-x-auto max-w-full">
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] whitespace-nowrap transition-all duration-200 cursor-pointer
                  ${statusFilter === tab.key
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle filtros avanzados + búsqueda */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none lg:w-64">
              <Input
                placeholder="Buscar por número o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? 'primary' : 'outline'}
              size="md"
              icon={Filter}
              onClick={() => setShowFilters((prev) => !prev)}
              className="shrink-0"
            >
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>
        </div>

        {/* Filtros avanzados */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <div className="flex flex-col gap-1.5 flex-1 w-full sm:w-auto">
                  <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar size={12} />
                    Desde
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 w-full sm:w-auto">
                  <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar size={12} />
                    Hasta
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={clearFilters}
                    className="shrink-0 text-[var(--text-secondary)]"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Tabla de facturas ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {!loading && filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              hasActiveFilters || search
                ? 'No se encontraron facturas'
                : 'Aún no tienes facturas'
            }
            description={
              hasActiveFilters || search
                ? 'Intenta con otros filtros o términos de búsqueda.'
                : 'Crea tu primera factura para comenzar a facturar.'
            }
            action={
              !hasActiveFilters && !search ? (
                <Button icon={Plus} onClick={() => navigate(ROUTES.FACTURA_NUEVA)} size="sm">
                  Nueva Factura
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={paginatedInvoices}
              loading={loading}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRowClick={handleRowClick}
              emptyMessage="No se encontraron facturas"
            />

            {/* ── Paginación ──────────────────────────────────── */}
            {!loading && filteredInvoices.length > PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
                <span className="text-xs text-[var(--text-tertiary)]">
                  Mostrando {((currentPage - 1) * PER_PAGE) + 1} a{' '}
                  {Math.min(currentPage * PER_PAGE, filteredInvoices.length)} de{' '}
                  {filteredInvoices.length} facturas
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Primera página"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {pageNumbers.map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-sm font-medium transition-colors cursor-pointer
                          ${currentPage === page
                            ? 'bg-[var(--color-brand-600)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                          }
                        `}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    aria-label="Última página"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Diálogo de confirmación de eliminación ─────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="¿Eliminar factura?"
        message={`Se eliminará permanentemente la factura "${deleteTarget?.numero || ''}". Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </motion.div>
  );
}