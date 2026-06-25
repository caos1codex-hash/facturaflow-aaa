import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Receipt,
  Calendar,
  Download,
  AlertTriangle,
  Users,
  Package,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
  parseISO,
  differenceInDays,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

import { useData } from '../hooks/useData';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TAX_RATES } from '../utils/constants';

// ── Registrar componentes Chart.js ──────────────────────────────
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── Colores ─────────────────────────────────────────────────────
const COLORS = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.1)',
  success: '#059669',
  successLight: 'rgba(5, 150, 105, 0.1)',
  warning: '#d97706',
  warningLight: 'rgba(217, 119, 6, 0.1)',
  error: '#dc2626',
  grid: 'rgba(100, 116, 139, 0.08)',
  tick: '#64748b',
  palette: [
    '#6366f1', '#059669', '#d97706', '#dc2626', '#8b5cf6',
    '#0891b2', '#be185d', '#4f46e5', '#16a34a', '#ea580c',
  ],
};

// ── Tabs de periodo ─────────────────────────────────────────────
const PERIOD_TABS = [
  { key: 'month', label: 'Este Mes' },
  { key: 'quarter', label: 'Últimos 3 Meses' },
  { key: 'year', label: 'Este Año' },
  { key: 'custom', label: 'Personalizado' },
];

// ── Animaciones ─────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ── Helpers ─────────────────────────────────────────────────────
function getPeriodDates(tab, customFrom, customTo) {
  const now = new Date();
  switch (tab) {
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'quarter':
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case 'year':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return {
        from: customFrom ? parseISO(customFrom) : startOfMonth(now),
        to: customTo ? parseISO(customTo) : endOfMonth(now),
      };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

function getPreviousPeriodDates(tab, customFrom, customTo) {
  const { from, to } = getPeriodDates(tab, customFrom, customTo);
  const diffMs = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - diffMs - 1),
    to: new Date(from.getTime() - 1),
  };
}

function filterByPeriod(items, dateField, from, to) {
  return items.filter((item) => {
    const d = item[dateField] ? parseISO(item[dateField]) : null;
    if (!d) return false;
    return isWithinInterval(d, { start: from, end: to });
  });
}

function getTaxRateObj(id) {
  return TAX_RATES.find((t) => t.id === id);
}

// ════════════════════════════════════════════════════════════════
// Página: Reports
// ════════════════════════════════════════════════════════════════
export default function Reports() {
  const { company } = useApp();
  const { items: invoices, loading: loadingInv } = useData('invoices');
  const { items: clients, loading: loadingCli } = useData('clients');
  const { items: products, loading: loadingProd } = useData('products');

  const [periodTab, setPeriodTab] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const loading = loadingInv || loadingCli || loadingProd;

  // ── Fechas del periodo ───────────────────────────────────────
  const { periodFrom, periodTo, prevFrom, prevTo } = useMemo(() => {
    const { from, to } = getPeriodDates(periodTab, customFrom, customTo);
    const prev = getPreviousPeriodDates(periodTab, customFrom, customTo);
    return {
      periodFrom: from,
      periodTo: to,
      prevFrom: prev.from,
      prevTo: prev.to,
    };
  }, [periodTab, customFrom, customTo]);

  // ── Facturas del periodo ─────────────────────────────────────
  const periodInvoices = useMemo(
    () => filterByPeriod(invoices, 'fecha', periodFrom, periodTo),
    [invoices, periodFrom, periodTo]
  );

  const prevInvoices = useMemo(
    () => filterByPeriod(invoices, 'fecha', prevFrom, prevTo),
    [invoices, prevFrom, prevTo]
  );

  // ── KPIs ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const revenue = periodInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const prevRevenue = prevInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const invoiceCount = periodInvoices.length;
    const prevInvoiceCount = prevInvoices.length;
    const avgTicket = invoiceCount > 0 ? revenue / invoiceCount : 0;
    const prevAvgTicket = prevInvoiceCount > 0 ? prevRevenue / prevInvoiceCount : 0;
    const totalTax = periodInvoices.reduce((s, inv) => {
      if (!inv.items) return s;
      return s + inv.items.reduce((ls, item) => {
        const tr = getTaxRateObj(item.impuestoId);
        const rate = tr?.rate || 0;
        const qty = Number(item.cantidad) || 0;
        const price = Number(item.precioUnitario) || 0;
        const disc = Number(item.descuento) || 0;
        const base = qty * price * (1 - disc / 100);
        return ls + base * rate;
      }, 0);
    }, 0);

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      revenue,
      revenueChange: calcChange(revenue, prevRevenue),
      invoiceCount,
      invoiceCountChange: calcChange(invoiceCount, prevInvoiceCount),
      avgTicket,
      avgTicketChange: calcChange(avgTicket, prevAvgTicket),
      totalTax,
    };
  }, [periodInvoices, prevInvoices]);

  // ── Datos del gráfico de ingresos ────────────────────────────
  const revenueChartData = useMemo(() => {
    const isMonthly = periodTab === 'year' || periodTab === 'quarter';
    const now = new Date();
    let labels = [];
    let currentData = [];
    let previousData = [];

    if (isMonthly) {
      // Gráfico por mes
      const monthCount = periodTab === 'year' ? 12 : 3;
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, 'yyyy-MM');
        const label = format(d, 'MMM yyyy', { locale: es });
        labels.push(label);

        const monthRevenue = invoices
          .filter((inv) => {
            if (!inv.fecha || inv.status === 'CANCELADA') return false;
            return inv.fecha.slice(0, 7) === key;
          })
          .reduce((s, inv) => s + (Number(inv.total) || 0), 0);
        currentData.push(monthRevenue);

        // Periodo anterior
        const prevDate = subMonths(d, monthCount);
        const prevKey = format(prevDate, 'yyyy-MM');
        const prevRevenue = invoices
          .filter((inv) => {
            if (!inv.fecha || inv.status === 'CANCELADA') return false;
            return inv.fecha.slice(0, 7) === prevKey;
          })
          .reduce((s, inv) => s + (Number(inv.total) || 0), 0);
        previousData.push(prevRevenue);
      }
    } else {
      // Gráfico por día (máximo 31 días)
      const daysInPeriod = differenceInDays(periodTo, periodFrom) + 1;
      const maxDays = Math.min(daysInPeriod, 31);
      for (let i = 0; i < maxDays; i++) {
        const d = new Date(periodFrom);
        d.setDate(d.getDate() + i);
        const dateStr = format(d, 'yyyy-MM-dd');
        labels.push(format(d, 'd MMM', { locale: es }));

        const dayRevenue = invoices
          .filter((inv) => {
            if (!inv.fecha || inv.status === 'CANCELADA') return false;
            return inv.fecha.startsWith(dateStr);
          })
          .reduce((s, inv) => s + (Number(inv.total) || 0), 0);
        currentData.push(dayRevenue);

        // Día equivalente periodo anterior
        const prevDay = new Date(prevFrom);
        prevDay.setDate(prevDay.getDate() + i);
        const prevDateStr = format(prevDay, 'yyyy-MM-dd');
        const prevDayRevenue = invoices
          .filter((inv) => {
            if (!inv.fecha || inv.status === 'CANCELADA') return false;
            return inv.fecha.startsWith(prevDateStr);
          })
          .reduce((s, inv) => s + (Number(inv.total) || 0), 0);
        previousData.push(prevDayRevenue);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Periodo actual',
          data: currentData,
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primaryLight,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Periodo anterior',
          data: previousData,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [invoices, periodTab, periodFrom, periodTo, prevFrom]);

  const revenueChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          cornerRadius: 8,
          padding: 12,
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: COLORS.tick, font: { size: 11 }, maxRotation: 45 },
          border: { display: false },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.tick,
            font: { size: 11 },
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

  // ── Ventas por cliente ───────────────────────────────────────
  const salesByClient = useMemo(() => {
    const map = {};
    periodInvoices
      .filter((inv) => inv.status !== 'CANCELADA')
      .forEach((inv) => {
        const clientId = inv.clienteId || 'sin-cliente';
        if (!map[clientId]) {
          const cli = clients.find((c) => c.id === clientId);
          map[clientId] = { clientId, name: cli?.nombre || 'Sin cliente', count: 0, total: 0 };
        }
        map[clientId].count += 1;
        map[clientId].total += Number(inv.total) || 0;
      });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [periodInvoices, clients]);

  const clientChartData = useMemo(() => ({
    labels: salesByClient.map((c) => c.name),
    datasets: [
      {
        label: 'Total facturado',
        data: salesByClient.map((c) => c.total),
        backgroundColor: COLORS.palette.slice(0, salesByClient.length),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 32,
      },
    ],
  }), [salesByClient]);

  const clientChartOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          cornerRadius: 8,
          padding: 12,
          callbacks: { label: (ctx) => formatCurrency(ctx.parsed.x) },
        },
      },
      scales: {
        x: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.tick,
            font: { size: 11 },
            callback: (v) => v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v}`,
          },
          border: { display: false },
          beginAtZero: true,
        },
        y: {
          grid: { display: false },
          ticks: { color: COLORS.tick, font: { size: 11 } },
          border: { display: false },
        },
      },
    }),
    []
  );

  const clientColumns = useMemo(
    () => [
      { key: 'name', label: 'Cliente' },
      { key: 'count', label: 'Facturas', width: '90px', render: (v) => String(v) },
      {
        key: 'total',
        label: 'Total',
        width: '140px',
        render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
      },
    ],
    []
  );

  // ── Ventas por producto ──────────────────────────────────────
  const salesByProduct = useMemo(() => {
    const map = {};
    periodInvoices
      .filter((inv) => inv.status !== 'CANCELADA' && inv.items)
      .forEach((inv) => {
        inv.items.forEach((item) => {
          const prodId = item.productoId || item.descripcion || 'otro';
          if (!map[prodId]) {
            const prod = products.find((p) => p.id === item.productoId);
            map[prodId] = {
              prodId,
              name: prod?.nombre || item.descripcion || 'Sin descripción',
              qty: 0,
              total: 0,
            };
          }
          const qty = Number(item.cantidad) || 0;
          const price = Number(item.precioUnitario) || 0;
          const disc = Number(item.descuento) || 0;
          map[prodId].qty += qty;
          map[prodId].total += qty * price * (1 - disc / 100);
        });
      });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [periodInvoices, products]);

  const productChartData = useMemo(() => ({
    labels: salesByProduct.slice(0, 6).map((p) => p.name),
    datasets: [
      {
        data: salesByProduct.slice(0, 6).map((p) => p.total),
        backgroundColor: COLORS.palette.slice(0, 6),
        borderWidth: 2,
        borderColor: 'var(--bg-card)',
        hoverOffset: 8,
      },
    ],
  }), [salesByProduct]);

  const productChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          cornerRadius: 8,
          padding: 12,
          callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}` },
        },
      },
    }),
    []
  );

  const productColumns = useMemo(
    () => [
      { key: 'name', label: 'Producto' },
      { key: 'qty', label: 'Cantidad', width: '100px', render: (v) => String(v) },
      {
        key: 'total',
        label: 'Total',
        width: '140px',
        render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
      },
    ],
    []
  );

  // ── Resumen de impuestos ─────────────────────────────────────
  const taxSummary = useMemo(() => {
    const map = {};
    periodInvoices
      .filter((inv) => inv.status !== 'CANCELADA' && inv.items)
      .forEach((inv) => {
        inv.items.forEach((item) => {
          const tr = getTaxRateObj(item.impuestoId);
          const id = tr?.id || 'otro';
          const name = tr?.name || 'Otro';
          const rate = tr?.rate || 0;
          const qty = Number(item.cantidad) || 0;
          const price = Number(item.precioUnitario) || 0;
          const disc = Number(item.descuento) || 0;
          const base = qty * price * (1 - disc / 100);
          const taxAmt = base * rate;

          if (!map[id]) map[id] = { name, rate, base: 0, amount: 0 };
          map[id].base += base;
          map[id].amount += taxAmt;
        });
      });
    return Object.values(map);
  }, [periodInvoices]);

  const taxColumns = useMemo(
    () => [
      { key: 'name', label: 'Tipo de Impuesto' },
      {
        key: 'rate',
        label: 'Tasa',
        width: '90px',
        render: (v) => `${(v * 100).toFixed(2)}%`,
      },
      {
        key: 'base',
        label: 'Base Gravable',
        width: '150px',
        render: (v) => formatCurrency(v),
      },
      {
        key: 'amount',
        label: 'Monto',
        width: '140px',
        render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
      },
    ],
    []
  );

  const totalTaxes = taxSummary.reduce((s, t) => s + t.amount, 0);

  // ── Facturas vencidas ────────────────────────────────────────
  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((inv) => {
        if (!inv.fechaVencimiento || inv.status === 'PAGADA' || inv.status === 'CANCELADA') return false;
        return isAfter(now, parseISO(inv.fechaVencimiento));
      })
      .map((inv) => {
        const cli = clients.find((c) => c.id === inv.clienteId);
        const days = differenceInDays(now, parseISO(inv.fechaVencimiento));
        return {
          ...inv,
          id: inv.id,
          numero: inv.numero,
          clienteNombre: cli?.nombre || 'Sin cliente',
          fechaVencimiento: inv.fechaVencimiento,
          diasVencidos: days,
          total: Number(inv.total) || 0,
        };
      })
      .sort((a, b) => b.diasVencidos - a.diasVencidos);
  }, [invoices, clients]);

  const overdueColumns = useMemo(
    () => [
      { key: 'numero', label: 'Número', width: '160px' },
      { key: 'clienteNombre', label: 'Cliente' },
      {
        key: 'fechaVencimiento',
        label: 'Vencimiento',
        width: '120px',
        render: (v) => formatDate(v),
      },
      {
        key: 'diasVencidos',
        label: 'Días Vencidos',
        width: '110px',
        render: (v) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold bg-[#fee2e2] text-[var(--color-error)]">
            {v} días
          </span>
        ),
      },
      {
        key: 'total',
        label: 'Total',
        width: '140px',
        render: (v) => <span className="font-semibold text-[var(--color-error)]">{formatCurrency(v)}</span>,
      },
    ],
    []
  );

  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.total, 0);

  // ── Exportar PDF ──────────────────────────────────────────────
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FacturaFlow - Reporte Financiero', 14, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: es })}`, 14, 27);
      doc.text(`Periodo: ${format(periodFrom, 'dd/MM/yyyy')} al ${format(periodTo, 'dd/MM/yyyy')}`, 14, 33);

      // KPIs
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen', 14, 46);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ingresos del Periodo: ${formatCurrency(kpis.revenue)}`, 14, 53);
      doc.text(`Facturas del Periodo: ${kpis.invoiceCount}`, 14, 59);
      doc.text(`Ticket Promedio: ${formatCurrency(kpis.avgTicket)}`, 14, 65);
      doc.text(`Impuestos Cobrados: ${formatCurrency(kpis.totalTax)}`, 14, 71);

      // Clientes
      const clientRows = salesByClient.map((c) => [c.name, String(c.count), formatCurrency(c.total)]);
      doc.autoTable({
        startY: 82,
        head: [['Cliente', 'Facturas', 'Total']],
        body: clientRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      });

      // Impuestos
      const taxRows = taxSummary.map((t) => [t.name, `${(t.rate * 100).toFixed(2)}%`, formatCurrency(t.base), formatCurrency(t.amount)]);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 12,
        head: [['Impuesto', 'Tasa', 'Base', 'Monto']],
        body: taxRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      });

      doc.save(`reporte-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Reporte exportado como PDF');
    } catch {
      toast.error('Error al exportar el reporte');
    }
  }, [periodFrom, periodTo, kpis, salesByClient, taxSummary]);

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
          title="Reportes"
          subtitle="Análisis financiero detallado"
          breadcrumbs={[{ label: 'Reportes' }]}
          actions={
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportPDF}>
              Exportar PDF
            </Button>
          }
        />
      </motion.div>

      {/* ── Selector de periodo ────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card padding="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)]">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPeriodTab(tab.key)}
                  className={`
                    px-3.5 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-colors cursor-pointer
                    ${periodTab === tab.key
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {periodTab === 'custom' && (
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  label=""
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-40"
                />
                <span className="text-sm text-[var(--text-tertiary)]">a</span>
                <Input
                  type="date"
                  label=""
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            <div className="ml-auto text-xs text-[var(--text-tertiary)]">
              {format(periodFrom, 'd MMM yyyy', { locale: es })} — {format(periodTo, 'd MMM yyyy', { locale: es })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── KPIs ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Ingresos del Periodo"
          value={loading ? '—' : formatCurrency(kpis.revenue)}
          change={kpis.revenueChange}
          changeType={kpis.revenueChange > 0 ? 'increase' : kpis.revenueChange < 0 ? 'decrease' : 'neutral'}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Facturas del Periodo"
          value={loading ? '—' : kpis.invoiceCount}
          change={kpis.invoiceCountChange}
          changeType={kpis.invoiceCountChange > 0 ? 'increase' : kpis.invoiceCountChange < 0 ? 'decrease' : 'neutral'}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Ticket Promedio"
          value={loading ? '—' : formatCurrency(kpis.avgTicket)}
          change={kpis.avgTicketChange}
          changeType={kpis.avgTicketChange > 0 ? 'increase' : kpis.avgTicketChange < 0 ? 'decrease' : 'neutral'}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Impuestos Cobrados"
          value={loading ? '—' : formatCurrency(kpis.totalTax)}
          icon={Receipt}
          color="orange"
        />
      </motion.div>

      {/* ── Gráfico de ingresos ────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Ingresos" subtitle="Comparación con periodo anterior" icon={DollarSign}>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-4 w-3/4 rounded-[var(--radius-sm)] animate-shimmer" />
              </div>
            ) : (
              <Line data={revenueChartData} options={revenueChartOptions} />
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Ventas por cliente ────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card title="Ventas por Cliente" subtitle="Top 10 clientes" icon={Users}>
            {salesByClient.length > 0 ? (
              <>
                <div className="h-64 mb-4">
                  <Bar data={clientChartData} options={clientChartOptions} />
                </div>
                <Table columns={clientColumns} data={salesByClient} emptyMessage="Sin datos" />
              </>
            ) : (
              <EmptyState icon={Users} title="Sin datos" description="No hay ventas en este periodo." />
            )}
          </Card>
        </motion.div>

        {/* ── Ventas por producto ───────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card title="Ventas por Producto" subtitle="Distribución de ventas" icon={Package}>
            {salesByProduct.length > 0 ? (
              <>
                <div className="h-56 flex items-center justify-center mb-4">
                  <div className="w-full max-w-[280px]">
                    <Doughnut data={productChartData} options={productChartOptions} />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <Table
                    columns={productColumns}
                    data={salesByProduct.slice(0, 8)}
                    emptyMessage="Sin datos"
                  />
                </div>
              </>
            ) : (
              <EmptyState icon={Package} title="Sin datos" description="No hay ventas de productos en este periodo." />
            )}
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Resumen de impuestos ─────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card title="Resumen de Impuestos" subtitle="Desglose por tipo" icon={Receipt}>
            {taxSummary.length > 0 ? (
              <>
                <Table columns={taxColumns} data={taxSummary} emptyMessage="Sin impuestos" />
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-default)]">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Total de Impuestos</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">{formatCurrency(totalTaxes)}</span>
                </div>
              </>
            ) : (
              <EmptyState icon={Receipt} title="Sin impuestos" description="No hay impuestos registrados en este periodo." />
            )}
          </Card>
        </motion.div>

        {/* ── Facturas vencidas ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card
            title="Facturas Vencidas"
            subtitle={`${overdueInvoices.length} factura(s) pendiente(s)`}
            icon={AlertTriangle}
          >
            {overdueInvoices.length > 0 ? (
              <>
                <div className="max-h-72 overflow-y-auto">
                  <Table columns={overdueColumns} data={overdueInvoices} emptyMessage="Sin facturas vencidas" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-default)]">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Total Vencido</span>
                  <span className="text-base font-bold text-[var(--color-error)]">{formatCurrency(totalOverdue)}</span>
                </div>
              </>
            ) : (
              <EmptyState icon={AlertTriangle} title="¡Excelente!" description="No hay facturas vencidas." />
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}