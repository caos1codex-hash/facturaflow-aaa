import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Package,
  FilePlus,
  UserPlus,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

import { useData } from '../hooks/useData';
import { StatsCard } from '../components/ui/StatsCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { INVOICE_STATUSES, ROUTES } from '../utils/constants';

// ── Registrar componentes de Chart.js ───────────────────────
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Variantes de animación escalonada ───────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

// ── Colores del gráfico ─────────────────────────────────────
const CHART_COLORS = {
  bar: '#6366f1',
  barHover: '#4f46e5',
  grid: 'rgba(100, 116, 139, 0.08)',
  tick: '#64748b',
};

// ── Helpers para actividad reciente ─────────────────────────
const ACTIVITY_ICONS = {
  factura: FilePlus,
  cliente: UserPlus,
  pago: CreditCard,
  producto: Package,
};

function getActivityIcon(type) {
  return ACTIVITY_ICONS[type] || FilePlus;
}

function getActivityColor(type) {
  switch (type) {
    case 'factura': return 'text-[#1d4ed8] bg-[#eff6ff]';
    case 'cliente': return 'text-[#065f46] bg-[#d1fae5]';
    case 'pago':    return 'text-[#065f46] bg-[#d1fae5]';
    case 'producto':return 'text-[#7c3aed] bg-[#ede9fe]';
    default:        return 'text-[#475569] bg-[var(--bg-tertiary)]';
  }
}

// ════════════════════════════════════════════════════════════
// Componente Dashboard
// ════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { items: invoices, loading: loadingInv } = useData('invoices');
  const { items: clients, loading: loadingCli } = useData('clients');
  const { items: products, loading: loadingProd } = useData('products');

  // ── Estadísticas calculadas ───────────────────────────────
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === 'PAGADA');
    const pendingInvoices = invoices.filter(
      (i) => i.status === 'PENDIENTE' || i.status === 'EMITIDA'
    );
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return {
      totalInvoices,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      totalRevenue,
      activeClients: clients.length,
      productCount: products.length,
    };
  }, [invoices, clients, products]);

  // ── Datos del gráfico de ingresos (últimos 6 meses) ──────
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      });
    }

    const paidByMonth = months.map((m) => {
      return invoices
        .filter((inv) => {
          if (inv.status !== 'PAGADA' || !inv.fecha) return false;
          const invMonth = inv.fecha.slice(0, 7);
          return invMonth === m.key;
        })
        .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    });

    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: 'Ingresos',
          data: paidByMonth,
          backgroundColor: CHART_COLORS.bar,
          hoverBackgroundColor: CHART_COLORS.barHover,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 48,
        },
      ],
    };
  }, [invoices]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (ctx) => formatCurrency(ctx.parsed.y),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: CHART_COLORS.tick, font: { size: 12 } },
          border: { display: false },
        },
        y: {
          grid: { color: CHART_COLORS.grid },
          ticks: {
            color: CHART_COLORS.tick,
            font: { size: 12 },
            callback: (v) => {
              if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
              if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
              return `$${v}`;
            },
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  // ── Facturas recientes (últimas 5) ────────────────────────
  const recentInvoices = useMemo(() => {
    const sorted = [...invoices].sort(
      (a, b) => new Date(b.fecha || b.created_at || 0) - new Date(a.fecha || a.created_at || 0)
    );
    return sorted.slice(0, 5);
  }, [invoices]);

  const invoiceColumns = useMemo(
    () => [
      { key: 'numero', label: 'Número', width: '140px' },
      { key: 'clienteNombre', label: 'Cliente' },
      { key: 'fecha', label: 'Fecha', width: '120px', render: (val) => formatDate(val) },
      {
        key: 'total',
        label: 'Total',
        width: '120px',
        render: (val) => formatCurrency(val),
      },
      {
        key: 'status',
        label: 'Estado',
        width: '120px',
        render: (val) => {
          const statusCfg = INVOICE_STATUSES[val] || INVOICE_STATUSES.BORRADOR;
          return (
            <Badge variant={statusCfg.color} size="sm" dot>
              {statusCfg.label}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // ── Actividad reciente ────────────────────────────────────
  const recentActivity = useMemo(() => {
    const activities = [];

    invoices
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 3)
      .forEach((inv) => {
        activities.push({
          id: `inv-${inv.id}`,
          type: 'factura',
          description: `Factura ${inv.numero || 'sin número'} creada`,
          time: inv.created_at,
        });
      });

    clients
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 2)
      .forEach((cli) => {
        activities.push({
          id: `cli-${cli.id}`,
          type: 'cliente',
          description: `Cliente ${cli.nombre || 'nuevo'} registrado`,
          time: cli.created_at,
        });
      });

    // Ordenar por fecha
    activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    return activities.slice(0, 5);
  }, [invoices, clients]);

  // ── Loading global ────────────────────────────────────────
  const loading = loadingInv || loadingCli || loadingProd;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* ── Tarjetas de estadísticas ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Facturas Emitidas"
            value={loading ? '—' : stats.totalInvoices}
            icon={FileText}
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Facturas Pagadas"
            value={loading ? '—' : stats.paidCount}
            icon={CheckCircle}
            color="green"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Pendientes de Pago"
            value={loading ? '—' : stats.pendingCount}
            icon={Clock}
            color="orange"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Facturación Total"
            value={loading ? '—' : formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="purple"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Clientes Activos"
            value={loading ? '—' : stats.activeClients}
            icon={Users}
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsCard
            title="Productos"
            value={loading ? '—' : stats.productCount}
            icon={Package}
            color="green"
          />
        </motion.div>
      </div>

      {/* ── Gráfico de ingresos + Actividad reciente ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card
            title="Ingresos Mensuales"
            subtitle="Últimos 6 meses"
            icon={DollarSign}
          >
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="h-4 w-3/4 rounded-[var(--radius-sm)] animate-shimmer" />
                </div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Actividad reciente */}
        <motion.div variants={itemVariants}>
          <Card
            title="Actividad Reciente"
            subtitle="Últimas acciones"
            icon={FilePlus}
            padding="p-0"
          >
            <div className="divide-y divide-[var(--border-default)]">
              {recentActivity.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-[var(--text-tertiary)]">
                  No hay actividad reciente
                </div>
              ) : (
                recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClasses = getActivityColor(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 px-6 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] shrink-0 ${colorClasses}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm text-[var(--text-primary)] leading-snug">
                          {activity.description}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {formatRelativeTime(activity.time)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Facturas recientes ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card
          title="Facturas Recientes"
          subtitle="Últimas 5 facturas"
          icon={FileText}
          action={
            <Link to={ROUTES.FACTURAS}>
              <button className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors cursor-pointer">
                Ver todas
                <ArrowRight size={14} />
              </button>
            </Link>
          }
          padding="p-0"
        >
          <Table
            columns={invoiceColumns}
            data={recentInvoices}
            loading={loading}
            emptyMessage="Aún no hay facturas registradas"
            onRowClick={(row) => {
              // Navigate to invoice detail if needed
            }}
          />
        </Card>
      </motion.div>
    </motion.div>
  );
}