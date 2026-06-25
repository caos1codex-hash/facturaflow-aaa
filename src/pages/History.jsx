import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  UserPlus,
  UserCog,
  Trash2,
  CreditCard,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus,
  Edit3,
  Clock,
  Calendar,
  History as HistoryIcon,
} from 'lucide-react';
import {
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns';

import { useData } from '../hooks/useData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { formatRelativeTime, formatDate } from '../utils/formatters';

// ── Animaciones ─────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

// ── Opciones de filtro ──────────────────────────────────────────
const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'factura', label: 'Facturas' },
  { value: 'cliente', label: 'Clientes' },
  { value: 'producto', label: 'Productos' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'crear', label: 'Crear' },
  { value: 'editar', label: 'Editar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'pago', label: 'Pago' },
  { value: 'exportar', label: 'Exportar' },
];

const PER_PAGE = 20;

// ── Iconos y colores por acción ─────────────────────────────────
const ACTION_CONFIG = {
  crear: {
    icon: Plus,
    color: 'text-[var(--color-success)]',
    bg: 'bg-[#d1fae5]',
    label: 'creada',
    labelPlural: 'creada',
  },
  editar: {
    icon: Edit3,
    color: 'text-[#1d4ed8]',
    bg: 'bg-[#eff6ff]',
    label: 'editada',
    labelPlural: 'editado',
  },
  eliminar: {
    icon: Trash2,
    color: 'text-[var(--color-error)]',
    bg: 'bg-[#fee2e2]',
    label: 'eliminada',
    labelPlural: 'eliminado',
  },
  pago: {
    icon: CreditCard,
    color: 'text-[#065f46]',
    bg: 'bg-[#d1fae5]',
    label: 'pagada',
    labelPlural: 'pagado',
  },
  exportar: {
    icon: Download,
    color: 'text-[#7c3aed]',
    bg: 'bg-[#ede9fe]',
    label: 'exportada',
    labelPlural: 'exportado',
  },
};

function getEntityLabel(entity) {
  switch (entity) {
    case 'factura': return { singular: 'Factura', plural: 'Facturas' };
    case 'cliente': return { singular: 'Cliente', plural: 'Clientes' };
    case 'producto': return { singular: 'Producto', plural: 'Productos' };
    default: return { singular: 'Registro', plural: 'Registros' };
  }
}

// ════════════════════════════════════════════════════════════════
// Componente: Evento individual
// ════════════════════════════════════════════════════════════════
function TimelineEvent({ event }) {
  const config = ACTION_CONFIG[event.action] || ACTION_CONFIG.crear;
  const Icon = config.icon;
  const entityInfo = getEntityLabel(event.entity);

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-4 px-1 py-3 group"
    >
      {/* Línea con punto */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full ${config.bg} ${config.color}`}>
          <Icon size={16} />
        </div>
        <div className="w-px flex-1 bg-[var(--border-default)] mt-2 mb-1 min-h-[16px]" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-sm text-[var(--text-primary)] leading-snug">
          <span className="font-semibold">{entityInfo.singular}</span>{' '}
          {event.reference && (
            <span className="font-semibold text-[var(--color-brand-600)]">{event.reference}</span>
          )}{' '}
          {config.labelPlural || config.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
            <Clock size={11} />
            {formatRelativeTime(event.timestamp)}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">•</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatDate(event.timestamp, 'd MMM yyyy, HH:mm')}
          </span>
        </div>
      </div>

      {/* Badge de acción */}
      <Badge
        variant={
          event.action === 'crear' ? 'success'
          : event.action === 'editar' ? 'info'
          : event.action === 'eliminar' ? 'danger'
          : event.action === 'pago' ? 'success'
          : 'default'
        }
        size="sm"
        className="shrink-0 self-center"
      >
        {config.label}
      </Badge>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// Página: History
// ════════════════════════════════════════════════════════════════
export default function HistoryPage() {
  const { items: invoices, loading: loadingInv } = useData('invoices');
  const { items: clients, loading: loadingCli } = useData('clients');
  const { items: products, loading: loadingProd } = useData('products');

  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const loading = loadingInv || loadingCli || loadingProd;

  // ── Generar eventos desde los datos ──────────────────────────
  const allEvents = useMemo(() => {
    const events = [];

    // Facturas: creado = createdAt, editado = updatedAt diferente
    invoices.forEach((inv) => {
      if (inv.created_at) {
        events.push({
          id: `inv-created-${inv.id}`,
          entity: 'factura',
          action: 'crear',
          reference: inv.numero || inv.id,
          timestamp: inv.created_at,
        });
      }
      if (inv.updated_at && inv.created_at && inv.updated_at !== inv.created_at) {
        events.push({
          id: `inv-updated-${inv.id}`,
          entity: 'factura',
          action: 'editar',
          reference: inv.numero || inv.id,
          timestamp: inv.updated_at,
        });
      }
      if (inv.status === 'PAGADA' && inv.fechaPago) {
        events.push({
          id: `inv-paid-${inv.id}`,
          entity: 'factura',
          action: 'pago',
          reference: inv.numero || inv.id,
          timestamp: inv.fechaPago,
        });
      }
    });

    // Clientes
    clients.forEach((cli) => {
      if (cli.created_at) {
        events.push({
          id: `cli-created-${cli.id}`,
          entity: 'cliente',
          action: 'crear',
          reference: cli.nombre || cli.id,
          timestamp: cli.created_at,
        });
      }
      if (cli.updated_at && cli.created_at && cli.updated_at !== cli.created_at) {
        events.push({
          id: `cli-updated-${cli.id}`,
          entity: 'cliente',
          action: 'editar',
          reference: cli.nombre || cli.id,
          timestamp: cli.updated_at,
        });
      }
    });

    // Productos
    products.forEach((prod) => {
      if (prod.created_at) {
        events.push({
          id: `prod-created-${prod.id}`,
          entity: 'producto',
          action: 'crear',
          reference: prod.nombre || prod.id,
          timestamp: prod.created_at,
        });
      }
      if (prod.updated_at && prod.created_at && prod.updated_at !== prod.created_at) {
        events.push({
          id: `prod-updated-${prod.id}`,
          entity: 'producto',
          action: 'editar',
          reference: prod.nombre || prod.id,
          timestamp: prod.updated_at,
        });
      }
    });

    // Ordenar por timestamp descendente
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return events;
  }, [invoices, clients, products]);

  // ── Aplicar filtros ──────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];

    if (entityFilter) {
      result = result.filter((e) => e.entity === entityFilter);
    }

    if (actionFilter) {
      result = result.filter((e) => e.action === actionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.reference?.toLowerCase().includes(q) ||
          e.entity?.toLowerCase().includes(q) ||
          e.action?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = parseISO(dateFrom);
      result = result.filter((e) => {
        const d = parseISO(e.timestamp);
        return !isBefore(d, from);
      });
    }

    if (dateTo) {
      const to = parseISO(dateTo);
      result = result.filter((e) => {
        const d = parseISO(e.timestamp);
        return !isAfter(d, to);
      });
    }

    return result;
  }, [allEvents, entityFilter, actionFilter, searchQuery, dateFrom, dateTo]);

  // ── Paginación ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handlePageChange = useCallback((newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  // ── Reset filtros ────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setEntityFilter('');
    setActionFilter('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const hasFilters = entityFilter || actionFilter || searchQuery || dateFrom || dateTo;

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
          title="Historial"
          subtitle="Registro de todas las actividades"
          breadcrumbs={[{ label: 'Historial' }]}
        />
      </motion.div>

      {/* ── Filtros ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card icon={Filter} title="Filtros" padding="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              icon={Search}
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />

            <Select
              options={ENTITY_OPTIONS}
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              icon={Calendar}
            />

            <Select
              options={ACTION_OPTIONS}
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            />

            <Input
              type="date"
              placeholder="Desde"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />

            <Input
              type="date"
              placeholder="Hasta"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-default)]">
              <span className="text-xs text-[var(--text-tertiary)]">
                {filteredEvents.length} resultado(s) encontrado(s)
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Timeline ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card padding="p-4">
          {loading ? (
            <div className="flex flex-col gap-4 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full animate-shimmer shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 rounded animate-shimmer" />
                    <div className="h-3 w-1/3 rounded animate-shimmer mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedEvents.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="Sin actividad"
              description={hasFilters
                ? "No se encontraron eventos con los filtros seleccionados."
                : "Aún no hay actividades registradas."
              }
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`${entityFilter}-${actionFilter}-${searchQuery}-${dateFrom}-${dateTo}-${currentPage}`}
            >
              {paginatedEvents.map((event) => (
                <TimelineEvent key={event.id} event={event} />
              ))}
            </motion.div>
          )}

          {/* ── Paginación ───────────────────────────────────── */}
          {filteredEvents.length > PER_PAGE && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-default)]">
              <span className="text-xs text-[var(--text-tertiary)]">
                Mostrando {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filteredEvents.length)} de {filteredEvents.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-[var(--text-primary)] font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}