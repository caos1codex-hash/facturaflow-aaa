import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Box,
  Wrench,
  Tag,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useData } from '../hooks/useData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { required, numeric, validateSchema } from '../utils/validators';
import { TAX_RATES } from '../utils/constants';

// ── Estado inicial del formulario ──────────────────────────────
const INITIAL_FORM = {
  nombre: '',
  tipo: 'Producto',
  sku: '',
  categoria: '',
  precio: '',
  impuesto: 'iva-16',
  descripcion: '',
  activo: true,
  imagenUrl: '',
  stock: '',
};

// ── Tabs de filtro ────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'Producto', label: 'Productos' },
  { key: 'Servicio', label: 'Servicios' },
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// ── Opciones de impuestos para el select ───────────────────────
const taxOptions = TAX_RATES.filter((t) => t.active).map((t) => ({
  value: t.id,
  label: `${t.name} (${formatPercentage(t.rate)})`,
}));

// ── Esquema de validación ─────────────────────────────────────
function buildValidationSchema() {
  return {
    nombre: (val) => required(val, 'El nombre'),
    precio: (val) => numeric(val, 'El precio unitario'),
  };
}

// ════════════════════════════════════════════════════════════════
// Componente Products
// ════════════════════════════════════════════════════════════════
export default function Products() {
  const { items: products, loading, create, update, remove } = useData('products');

  // ── Estado local ─────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // ── Categorías únicas ───────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoria).filter(Boolean));
    return [...cats].sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  const categoryOptions = useMemo(
    () => [
      ...categories.map((c) => ({ value: c, label: c })),
    ],
    [categories]
  );

  // ── Productos filtrados ──────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtrar por tipo
    if (activeTab !== 'todos') {
      result = result.filter((p) => p.tipo === activeTab);
    }

    // Filtrar por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.nombre || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q) ||
          (p.descripcion || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, activeTab, search]);

  // ── Handlers del formulario ──────────────────────────────────
  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingProduct(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setImagePreview('');
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setForm({
      nombre: product.nombre || '',
      tipo: product.tipo || 'Producto',
      sku: product.sku || '',
      categoria: product.categoria || '',
      precio: product.precio ?? '',
      impuesto: product.impuesto || 'iva-16',
      descripcion: product.descripcion || '',
      activo: product.activo !== false,
      imagenUrl: product.imagenUrl || '',
      stock: product.stock ?? '',
    });
    setFormErrors({});
    setImagePreview(product.imagenUrl || '');
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormErrors({});
    setImagePreview('');
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validar
      const schema = buildValidationSchema();
      const validation = validateSchema(schema, form);

      if (!validation.valid) {
        setFormErrors(validation.errors);
        return;
      }

      setSaving(true);

      try {
        const precio = Number(form.precio) || 0;
        const selectedTax = TAX_RATES.find((t) => t.id === form.impuesto);
        const tasaImpuesto = selectedTax ? selectedTax.rate : 0.16;

        const payload = {
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          sku: form.sku.trim() || null,
          categoria: form.categoria.trim() || null,
          precio,
          tasaImpuesto,
          impuesto: form.impuesto,
          descripcion: form.descripcion.trim() || null,
          activo: form.activo,
          imagenUrl: form.imagenUrl.trim() || null,
          stock: form.tipo === 'Producto' ? (Number(form.stock) || 0) : null,
        };

        if (editingProduct) {
          await update(editingProduct.id, payload);
          toast.success('Producto actualizado correctamente');
        } else {
          await create(payload);
          toast.success('Producto creado correctamente');
        }

        handleCloseModal();
      } catch (err) {
        toast.error(err?.message || 'Error al guardar el producto');
      } finally {
        setSaving(false);
      }
    },
    [editingProduct, form, create, update, handleCloseModal]
  );

  // ── Eliminar producto ────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget.id);
      toast.success('Producto eliminado correctamente');
    } catch (err) {
      toast.error(err?.message || 'Error al eliminar el producto');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove]);

  // ── Previsualización de imagen ───────────────────────────────
  useEffect(() => {
    if (form.imagenUrl && form.imagenUrl.trim()) {
      setImagePreview(form.imagenUrl.trim());
    } else {
      setImagePreview('');
    }
  }, [form.imagenUrl]);

  // ── Limpiar errores al cerrar modal ──────────────────────────
  useEffect(() => {
    if (!modalOpen) {
      setFormErrors({});
    }
  }, [modalOpen]);

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
          title="Productos y Servicios"
          subtitle="Administra tu catálogo"
          breadcrumbs={[{ label: 'Productos y Servicios' }]}
          actions={
            <Button icon={Plus} onClick={openCreateModal}>
              Nuevo Producto
            </Button>
          }
        />
      </motion.div>

      {/* ── Tabs de filtro + Búsqueda ─────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer
                ${activeTab === tab.key
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Buscar producto o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
      </motion.div>

      {/* ── Grid de productos ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {!loading && filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              search || activeTab !== 'todos'
                ? 'No se encontraron resultados'
                : 'Aún no tienes productos'
            }
            description={
              search || activeTab !== 'todos'
                ? 'Intenta con otros términos de búsqueda o cambia el filtro.'
                : 'Comienza agregando tu primer producto o servicio al catálogo.'
            }
            action={
              !search && activeTab === 'todos' && (
                <Button icon={Plus} onClick={openCreateModal} size="sm">
                  Nuevo Producto
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="card-base p-5 flex flex-col gap-4"
                    >
                      <div className="h-40 rounded-[var(--radius-md)] animate-shimmer bg-[var(--bg-tertiary)]" />
                      <div className="h-5 w-3/4 rounded-[var(--radius-sm)] animate-shimmer bg-[var(--bg-tertiary)]" />
                      <div className="h-4 w-1/2 rounded-[var(--radius-sm)] animate-shimmer bg-[var(--bg-tertiary)]" />
                      <div className="h-4 w-1/3 rounded-[var(--radius-sm)] animate-shimmer bg-[var(--bg-tertiary)]" />
                    </motion.div>
                  ))
                : filteredProducts.map((product) => {
                    const taxInfo = TAX_RATES.find((t) => t.id === product.impuesto);
                    const isServicio = product.tipo === 'Servicio';

                    return (
                      <motion.div
                        key={product.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="card-base p-5 flex flex-col gap-3 group hover:shadow-[var(--shadow-lg)] transition-shadow duration-200"
                      >
                        {/* Imagen o placeholder */}
                        <div className="relative h-40 rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center">
                          {product.imagenUrl ? (
                            <img
                              src={product.imagenUrl}
                              alt={product.nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`absolute inset-0 items-center justify-center ${product.imagenUrl ? 'hidden' : 'flex'}`}
                          >
                            {isServicio ? (
                              <Wrench size={40} className="text-[var(--text-tertiary)]" strokeWidth={1.2} />
                            ) : (
                              <Box size={40} className="text-[var(--text-tertiary)]" strokeWidth={1.2} />
                            )}
                          </div>

                          {/* Indicador de tipo */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={isServicio ? 'info' : 'success'}
                              size="sm"
                            >
                              {product.tipo || 'Producto'}
                            </Badge>
                          </div>

                          {/* Indicador de estado */}
                          {!product.activo && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="default" size="sm" dot={false}>
                                Inactivo
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Info del producto */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {product.nombre}
                          </h3>

                          {product.sku && (
                            <span className="text-xs text-[var(--text-tertiary)] font-mono">
                              SKU: {product.sku}
                            </span>
                          )}

                          {product.categoria && (
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-[var(--text-tertiary)]" />
                              <span className="text-xs text-[var(--text-secondary)]">{product.categoria}</span>
                            </div>
                          )}
                        </div>

                        {/* Precio + Stock */}
                        <div className="flex items-end justify-between pt-2 border-t border-[var(--border-default)]">
                          <div className="flex flex-col">
                            <span className="text-xs text-[var(--text-tertiary)]">Precio</span>
                            <span className="text-lg font-bold text-[var(--text-primary)]">
                              {formatCurrency(product.precio ?? 0)}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            {isServicio ? (
                              <span className="text-xs text-[var(--text-tertiary)]">
                                {product.activo ? 'Disponible' : 'No disponible'}
                              </span>
                            ) : (
                              <>
                                <span className="text-xs text-[var(--text-tertiary)]">Stock</span>
                                <span
                                  className={`text-sm font-semibold ${
                                    (product.stock ?? 0) > 0
                                      ? 'text-[var(--color-success)]'
                                      : 'text-[var(--color-error)]'
                                  }`}
                                >
                                  {product.stock ?? 0} uds
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Info de impuesto */}
                        {taxInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                            <span>Impuesto:</span>
                            <span className="font-medium text-[var(--text-secondary)]">
                              {taxInfo.name}
                            </span>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() => handleEdit(product)}
                            className="flex-1"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteTarget(product)}
                            className="flex-1 text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[#fee2e2] dark:hover:bg-[#450a0a]"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Modal de crear/editar producto ─────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              icon={editingProduct ? Pencil : Plus}
            >
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="product-form">
          {/* Nombre + Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              required
              placeholder="Ej: Consultoría Legal"
              value={form.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              error={formErrors.nombre}
              autoFocus
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Tipo
              </label>
              <div className="flex items-center gap-2 p-1 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]">
                {['Producto', 'Servicio'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleFieldChange('tipo', tipo)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer
                      ${form.tipo === tipo
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    {tipo === 'Producto' ? (
                      <Box size={15} />
                    ) : (
                      <Wrench size={15} />
                    )}
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SKU + Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              placeholder="Ej: PROD-0001"
              value={form.sku}
              onChange={(e) => handleFieldChange('sku', e.target.value)}
              error={formErrors.sku}
            />

            {categories.length > 0 ? (
              <Select
                label="Categoría"
                options={categoryOptions}
                placeholder="Seleccionar categoría..."
                value={form.categoria}
                onChange={(e) => handleFieldChange('categoria', e.target.value)}
                error={formErrors.categoria}
              />
            ) : (
              <Input
                label="Categoría"
                placeholder="Ej: Tecnología"
                value={form.categoria}
                onChange={(e) => handleFieldChange('categoria', e.target.value)}
                error={formErrors.categoria}
                icon={Tag}
              />
            )}
          </div>

          {/* Precio + Impuesto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio unitario"
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.precio}
              onChange={(e) => handleFieldChange('precio', e.target.value)}
              error={formErrors.precio}
            />

            <Select
              label="Impuesto asociado"
              options={taxOptions}
              value={form.impuesto}
              onChange={(e) => handleFieldChange('impuesto', e.target.value)}
              error={formErrors.impuesto}
            />
          </div>

          {/* Stock (solo para productos) */}
          {form.tipo === 'Producto' && (
            <Input
              label="Stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.stock}
              onChange={(e) => handleFieldChange('stock', e.target.value)}
              error={formErrors.stock}
              hint="Cantidad disponible en inventario"
            />
          )}

          {/* Imagen URL */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Imagen URL"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={form.imagenUrl}
              onChange={(e) => handleFieldChange('imagenUrl', e.target.value)}
              error={formErrors.imagenUrl}
              icon={ImageIcon}
            />

            {/* Preview de imagen */}
            {imagePreview && (
              <div className="mt-1 relative w-24 h-24 rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)]">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview('')}
                />
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('imagenUrl', '');
                    setImagePreview('');
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Descripción */}
          <Input
            label="Descripción"
            type="textarea"
            placeholder="Describe el producto o servicio..."
            value={form.descripcion}
            onChange={(e) => handleFieldChange('descripcion', e.target.value)}
            error={formErrors.descripcion}
          />

          {/* Disponibilidad */}
          <div className="flex items-center justify-between py-2 px-3 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)]">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Disponibilidad
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                Los productos inactivos no aparecerán en las facturas
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange('activo', !form.activo)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer
                ${form.activo
                  ? 'bg-[var(--color-success)]'
                  : 'bg-[var(--border-strong)]'
                }
              `}
              role="switch"
              aria-checked={form.activo}
              aria-label="Disponibilidad del producto"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm
                  ${form.activo ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Diálogo de confirmación de eliminación ─────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="¿Eliminar producto?"
        message={`Se eliminará permanentemente "${deleteTarget?.nombre || ''}" del catálogo. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </motion.div>
  );
}