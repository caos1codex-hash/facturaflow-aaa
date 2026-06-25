import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useData } from '../hooks/useData';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatPhone } from '../utils/formatters';
import { required, validateEmail, validateTaxId, validateSchema } from '../utils/validators';

// ── Estado inicial del formulario ───────────────────────────
const INITIAL_FORM = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  direccion: '',
  rfc: '',
  observaciones: '',
};

// ── Variantes de animación ──────────────────────────────────
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

// ── Esquema de validación ───────────────────────────────────
function buildValidationSchema(isEditing) {
  return {
    nombre: (val) => required(val, 'El nombre completo'),
    email: (val) => {
      if (val && String(val).trim() !== '') return validateEmail(val);
      return { valid: true };
    },
    rfc: (val) => {
      if (val && String(val).trim() !== '') return validateTaxId(val);
      return { valid: true };
    },
  };
}

// ════════════════════════════════════════════════════════════
// Componente Clients
// ════════════════════════════════════════════════════════════
export default function Clients() {
  const { items: clients, loading, create, update, remove } = useData('clients');

  // ── Estado local ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Clientes filtrados y ordenados ────────────────────────
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filtrar por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.nombre || '').toLowerCase().includes(q) ||
          (c.empresa || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.rfc || '').toLowerCase().includes(q)
      );
    }

    // Ordenar
    result.sort((a, b) => {
      const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
      const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'es');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [clients, search, sortConfig]);

  // ── Definición de columnas ────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'nombre',
        label: 'Nombre',
        sortable: true,
        render: (val) => (
          <span className="font-medium text-[var(--text-primary)]">{val || '—'}</span>
        ),
      },
      { key: 'empresa', label: 'Empresa', sortable: true, render: (val) => val || '—' },
      {
        key: 'email',
        label: 'Email',
        render: (val) =>
          val ? (
            <span className="text-[var(--text-secondary)]">{val}</span>
          ) : (
            '—'
          ),
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        width: '140px',
        render: (val) => (
          <span className="text-[var(--text-secondary)]">{formatPhone(val)}</span>
        ),
      },
      {
        key: 'rfc',
        label: 'Identificación Fiscal',
        width: '160px',
        render: (val) =>
          val ? (
            <span className="font-mono text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-[var(--radius-sm)]">
              {val}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'id',
        label: 'Acciones',
        width: '110px',
        render: (_val, row) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-brand-600)] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a5f] transition-colors cursor-pointer"
              aria-label="Editar cliente"
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[#fee2e2] dark:hover:bg-[#450a0a] transition-colors cursor-pointer"
              aria-label="Eliminar cliente"
              title="Eliminar"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Handlers de ordenamiento ──────────────────────────────
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // ── Handlers del formulario ───────────────────────────────
  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingClient(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((client) => {
    setEditingClient(client);
    setForm({
      nombre: client.nombre || '',
      empresa: client.empresa || '',
      email: client.email || '',
      telefono: client.telefono || '',
      direccion: client.direccion || '',
      rfc: client.rfc || '',
      observaciones: client.observaciones || '',
    });
    setFormErrors({});
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingClient(null);
    setFormErrors({});
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validar
      const schema = buildValidationSchema(!!editingClient);
      const validation = validateSchema(schema, form);

      if (!validation.valid) {
        setFormErrors(validation.errors);
        return;
      }

      setSaving(true);

      try {
        const payload = {
          nombre: form.nombre.trim(),
          empresa: form.empresa.trim() || null,
          email: form.email.trim() || null,
          telefono: form.telefono.trim() || null,
          direccion: form.direccion.trim() || null,
          rfc: form.rfc.trim().toUpperCase() || null,
          observaciones: form.observaciones.trim() || null,
        };

        if (editingClient) {
          await update(editingClient.id, payload);
          toast.success('Cliente actualizado correctamente');
        } else {
          await create(payload);
          toast.success('Cliente creado correctamente');
        }

        handleCloseModal();
      } catch (err) {
        toast.error(err?.message || 'Error al guardar el cliente');
      } finally {
        setSaving(false);
      }
    },
    [editingClient, form, create, update, handleCloseModal]
  );

  // ── Eliminar cliente ──────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget.id);
      toast.success('Cliente eliminado correctamente');
    } catch (err) {
      toast.error(err?.message || 'Error al eliminar el cliente');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove]);

  // ── Limpiar errores cuando se cierra el modal ─────────────
  useEffect(() => {
    if (!modalOpen) {
      setFormErrors({});
    }
  }, [modalOpen]);

  // ══════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* ── Encabezado de página ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Clientes"
          subtitle="Gestiona tu cartera de clientes"
          breadcrumbs={[{ label: 'Clientes' }]}
          actions={
            <Button icon={Plus} onClick={openCreateModal}>
              Nuevo Cliente
            </Button>
          }
        />
      </motion.div>

      {/* ── Barra de búsqueda ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Input
            placeholder="Buscar por nombre, empresa, email o RFC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
      </motion.div>

      {/* ── Tabla de clientes ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {!loading && filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              search
                ? 'No se encontraron clientes'
                : 'Aún no tienes clientes'
            }
            description={
              search
                ? 'Intenta con otros términos de búsqueda.'
                : 'Comienza agregando tu primer cliente a la cartera.'
            }
            action={
              !search && (
                <Button icon={Plus} onClick={openCreateModal} size="sm">
                  Nuevo Cliente
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            data={filteredClients}
            loading={loading}
            sortConfig={sortConfig}
            onSort={handleSort}
            emptyMessage="No se encontraron clientes"
          />
        )}
      </motion.div>

      {/* ── Modal de crear/editar cliente ────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving} icon={editingClient ? Pencil : Plus}>
              {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="client-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              required
              placeholder="Ej: Juan Pérez García"
              value={form.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              error={formErrors.nombre}
              autoFocus
            />

            <Input
              label="Empresa"
              placeholder="Ej: Acme Corp S.A. de C.V."
              value={form.empresa}
              onChange={(e) => handleFieldChange('empresa', e.target.value)}
              icon={Building2}
              error={formErrors.empresa}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="cliente@ejemplo.com"
              value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={formErrors.email}
            />

            <Input
              label="Teléfono"
              placeholder="Ej: +52 55 1234 5678"
              value={form.telefono}
              onChange={(e) => handleFieldChange('telefono', e.target.value)}
              error={formErrors.telefono}
            />
          </div>

          <Input
            label="Dirección"
            placeholder="Calle, número, colonia, ciudad..."
            value={form.direccion}
            onChange={(e) => handleFieldChange('direccion', e.target.value)}
            error={formErrors.direccion}
          />

          <Input
            label="Identificación Fiscal / RFC"
            placeholder="Ej: XAXX010101000"
            value={form.rfc}
            onChange={(e) => handleFieldChange('rfc', e.target.value.toUpperCase())}
            error={formErrors.rfc}
            hint="Formato: 12 o 13 caracteres (moral o física)"
          />

          <Input
            label="Observaciones"
            type="textarea"
            placeholder="Notas adicionales sobre el cliente..."
            value={form.observaciones}
            onChange={(e) => handleFieldChange('observaciones', e.target.value)}
          />
        </form>
      </Modal>

      {/* ── Diálogo de confirmación de eliminación ───────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="¿Eliminar cliente?"
        message={`Se eliminará permanentemente a "${deleteTarget?.nombre || ''}" de tu cartera de clientes. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </motion.div>
  );
}