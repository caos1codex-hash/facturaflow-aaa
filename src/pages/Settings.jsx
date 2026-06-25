import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Building2,
  FileText,
  Palette,
  Image,
  Trash2,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  Hash,
  CalendarDays,
  Percent,
  Stamp,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  DEFAULT_COMPANY,
  CURRENCY_OPTIONS,
  TAX_RATES,
} from '../utils/constants';

// ── Animaciones ─────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ── Opciones de selectores ─────────────────────────────────────
const currencyOptions = CURRENCY_OPTIONS.map((c) => ({
  value: c.code,
  label: `${c.symbol} ${c.code} — ${c.label}`,
}));

const dateFormatOptions = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const taxRateOptions = TAX_RATES.map((t) => ({
  value: t.id,
  label: t.name,
}));

const REGIMEN_FISCAL_OPTIONS = [
  { value: '601 - General de Ley Personas Morales', label: '601 — General de Ley Personas Morales' },
  { value: '603 - Personas Morales con Fines No Lucrativos', label: '603 — Personas Morales con Fines No Lucrativos' },
  { value: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México', label: '610 — Residentes en el Extranjero' },
  { value: '620 - Sueldos y Salarios e Ingresos Asimilados a Salarios', label: '620 — Sueldos y Salarios' },
  { value: '621 - Incorporación Fiscal', label: '621 — Incorporación Fiscal' },
  { value: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', label: '622 — Actividades Agrícolas' },
  { value: '623 - Opcional para Grupos de Sociedades', label: '623 — Opcional para Grupos de Sociedades' },
  { value: '624 - Coordinados', label: '624 — Coordinados' },
  { value: '625 - Régimen de las Actividades Empresariales con Ingresos hasta $500,000', label: '625 — Actividades Empresariales (hasta $500K)' },
  { value: '626 - Régimen Simplificado de Confianza (RESICO)', label: '626 — RESICO' },
];

// ════════════════════════════════════════════════════════════════
// Página: Settings
// ════════════════════════════════════════════════════════════════
export default function Settings() {
  const { company, updateCompany, saveCompany } = useApp();
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Estado local del formulario ──────────────────────────────
  const [form, setForm] = useState({
    nombre: '',
    nombreComercial: '',
    rfc: '',
    regimenFiscal: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    correo: '',
    telefono: '',
    sitioWeb: '',
    direccionFiscal: '',
    moneda: 'MXN',
    formatoFecha: 'DD/MM/YYYY',
    impuestoPredeterminado: 'iva-16',
    porcentajeImpuesto: 16,
    plantillaNumero: 'FAC-{YEAR}-{SEQUENCE}',
    logo: null,
  });

  // ── Sincronizar con company context ─────────────────────────
  useEffect(() => {
    setForm({
      nombre: company.nombre || '',
      nombreComercial: company.nombreComercial || '',
      rfc: company.rfc || '',
      regimenFiscal: company.regimenFiscal || '',
      direccion: company.direccion?.calle || '',
      ciudad: company.direccion?.ciudad || '',
      estado: company.direccion?.estado || '',
      codigoPostal: company.direccion?.codigoPostal || '',
      correo: company.contacto?.email || '',
      telefono: company.contacto?.telefono || '',
      sitioWeb: company.contacto?.sitioWeb || '',
      direccionFiscal: company.direccionFiscal || '',
      moneda: company.moneda || 'MXN',
      formatoFecha: company.formatoFecha || 'DD/MM/YYYY',
      impuestoPredeterminado: company.impuestoPredeterminado || 'iva-16',
      porcentajeImpuesto: company.porcentajeImpuesto ?? 16,
      plantillaNumero: company.plantillaNumero || 'FAC-{YEAR}-{SEQUENCE}',
      logo: company.logo || null,
    });
  }, [company]);

  // ── Actualizar campo del formulario ──────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // ── Validar formulario ───────────────────────────────────────
  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre de la empresa es obligatorio';
    if (form.porcentajeImpuesto !== '' && (isNaN(Number(form.porcentajeImpuesto)) || Number(form.porcentajeImpuesto) < 0 || Number(form.porcentajeImpuesto) > 100)) {
      newErrors.porcentajeImpuesto = 'El porcentaje debe estar entre 0 y 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // ── Guardar cambios ──────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validate()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const settings = {
        ...DEFAULT_COMPANY,
        nombre: form.nombre.trim(),
        nombreComercial: form.nombreComercial.trim(),
        rfc: form.rfc.trim(),
        regimenFiscal: form.regimenFiscal,
        direccion: {
          ...DEFAULT_COMPANY.direccion,
          calle: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
          estado: form.estado.trim(),
          codigoPostal: form.codigoPostal.trim(),
        },
        contacto: {
          ...DEFAULT_COMPANY.contacto,
          telefono: form.telefono.trim(),
          email: form.correo.trim(),
          sitioWeb: form.sitioWeb.trim(),
        },
        logo: form.logo,
        moneda: form.moneda,
        formatoFecha: form.formatoFecha,
        impuestoPredeterminado: form.impuestoPredeterminado,
        porcentajeImpuesto: Number(form.porcentajeImpuesto),
        plantillaNumero: form.plantillaNumero.trim(),
        direccionFiscal: form.direccionFiscal.trim(),
      };

      const result = await saveCompany(settings);
      if (result.success) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error(result.error || 'Error al guardar la configuración');
      }
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }, [form, validate, saveCompany]);

  // ── Restablecer valores ──────────────────────────────────────
  const handleReset = useCallback(async () => {
    const result = await saveCompany({ ...DEFAULT_COMPANY });
    if (result.success) {
      toast.success('Configuración restablecida a valores predeterminados');
    } else {
      toast.error(result.error || 'Error al restablecer');
    }
  }, [saveCompany]);

  // ── Logo upload ──────────────────────────────────────────────
  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      handleChange('logo', ev.target.result);
      toast.success('Logo cargado correctamente');
    };
    reader.readAsDataURL(file);
  }, [handleChange]);

  const handleRemoveLogo = useCallback(() => {
    handleChange('logo', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Logo eliminado');
  }, [handleChange]);

  // ── Exportar configuración ───────────────────────────────────
  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify({ ...company, exportDate: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturaflow-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Configuración exportada');
    } catch {
      toast.error('Error al exportar la configuración');
    }
  }, [company]);

  // ── Importar configuración ───────────────────────────────────
  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.nombre) {
          toast.error('Archivo de configuración inválido');
          return;
        }
        // Merge con valores actuales
        const merged = { ...DEFAULT_COMPANY, ...data };
        saveCompany(merged).then((result) => {
          if (result.success) {
            toast.success('Configuración importada correctamente');
          } else {
            toast.error('Error al importar la configuración');
          }
        });
      } catch {
        toast.error('El archivo no es un JSON válido');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  }, [saveCompany]);

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
          title="Configuración"
          subtitle="Datos de tu empresa"
          breadcrumbs={[{ label: 'Configuración' }]}
        />
      </motion.div>

      {/* ── Datos de la Empresa ────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Datos de la Empresa" icon={Building2} subtitle="Información general de tu negocio">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">Logo de la Empresa</span>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-default)] flex items-center justify-center overflow-hidden bg-[var(--bg-tertiary)]">
                  {form.logo ? (
                    <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]">
                      <Image size={24} />
                      <span className="text-[10px]">Sin logo</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" icon={Upload} onClick={() => fileInputRef.current?.click()}>
                    Subir Logo
                  </Button>
                  {form.logo && (
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={handleRemoveLogo} className="text-[var(--color-error)]">
                      Eliminar
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">PNG, JPG o SVG. Máximo 2MB.</span>
            </div>

            {/* Campos principales */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre de la empresa"
                required
                icon={Building2}
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={errors.nombre}
                placeholder="Mi Empresa S.A. de C.V."
              />
              <Input
                label="Nombre comercial"
                icon={Building2}
                value={form.nombreComercial}
                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                placeholder="Mi Empresa"
              />
              <Input
                label="Dirección"
                type="textarea"
                icon={MapPin}
                value={form.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Av. Reforma #123, Col. Centro"
              />
              <div className="flex flex-col gap-4">
                <Input
                  label="Ciudad"
                  icon={MapPin}
                  value={form.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  placeholder="Ciudad de México"
                />
              </div>
              <Input
                label="Estado"
                icon={MapPin}
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                placeholder="Ciudad de México"
              />
              <Input
                label="Código Postal"
                icon={Hash}
                value={form.codigoPostal}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
                placeholder="06000"
              />
              <Input
                label="Correo electrónico"
                type="email"
                icon={Mail}
                value={form.correo}
                onChange={(e) => handleChange('correo', e.target.value)}
                placeholder="contacto@miempresa.com"
              />
              <Input
                label="Teléfono"
                icon={Phone}
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="+52 55 1234 5678"
              />
              <Input
                label="Sitio web"
                icon={Globe}
                value={form.sitioWeb}
                onChange={(e) => handleChange('sitioWeb', e.target.value)}
                placeholder="www.miempresa.com"
                className="sm:col-span-2"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Datos Fiscales ──────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Datos Fiscales" icon={Stamp} subtitle="Información para facturación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Input
              label="RFC / Identificación fiscal"
              icon={Hash}
              value={form.rfc}
              onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
              placeholder="XAXX010101000"
              className="uppercase"
            />
            <Select
              label="Régimen fiscal"
              options={REGIMEN_FISCAL_OPTIONS}
              value={form.regimenFiscal}
              onChange={(e) => handleChange('regimenFiscal', e.target.value)}
            />
            <Input
              label="Dirección fiscal (si es diferente)"
              type="textarea"
              icon={MapPin}
              value={form.direccionFiscal}
              onChange={(e) => handleChange('direccionFiscal', e.target.value)}
              placeholder="Dejar vacío si es la misma dirección"
              hint="Opcional. Solo si la dirección fiscal difiere de la comercial."
              className="sm:col-span-2"
            />
          </div>
        </Card>
      </motion.div>

      {/* ── Preferencias ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Preferencias" icon={Palette} subtitle="Configuración regional y plantillas">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Select
              label="Moneda"
              options={currencyOptions}
              value={form.moneda}
              onChange={(e) => handleChange('moneda', e.target.value)}
            />
            <Select
              label="Formato de fecha"
              options={dateFormatOptions}
              value={form.formatoFecha}
              onChange={(e) => handleChange('formatoFecha', e.target.value)}
            />
            <Select
              label="Impuesto predeterminado"
              options={taxRateOptions}
              value={form.impuestoPredeterminado}
              onChange={(e) => handleChange('impuestoPredeterminado', e.target.value)}
            />
            <Input
              label="Porcentaje de impuesto predeterminado"
              type="number"
              icon={Percent}
              value={form.porcentajeImpuesto}
              onChange={(e) => handleChange('porcentajeImpuesto', e.target.value)}
              min="0"
              max="100"
              step="0.01"
              error={errors.porcentajeImpuesto}
              hint="Se usará al crear nuevas facturas"
            />
            <Input
              label="Plantilla de número de factura"
              icon={FileText}
              value={form.plantillaNumero}
              onChange={(e) => handleChange('plantillaNumero', e.target.value)}
              placeholder="FAC-{YEAR}-{SEQUENCE}"
              hint="Variables: {YEAR}, {MONTH}, {SEQUENCE}"
              className="sm:col-span-2"
            />
          </div>
        </Card>
      </motion.div>

      {/* ── Acciones ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card title="Acciones" icon={FileText} subtitle="Exportar, importar o restablecer">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={Save}
              loading={saving}
              onClick={handleSave}
            >
              Guardar Cambios
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={RotateCcw}
              onClick={() => setShowResetDialog(true)}
            >
              Restablecer Valores
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={Download}
              onClick={handleExport}
            >
              Exportar Configuración
            </Button>

            <Button
              variant="outline"
              size="lg"
              icon={Upload}
              onClick={() => importInputRef.current?.click()}
            >
              Importar Configuración
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </Card>
      </motion.div>

      {/* ── Diálogo de restablecer ─────────────────────────── */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
        title="Restablecer Configuración"
        message="¿Estás seguro? Se restaurarán todos los valores a la configuración predeterminada. Esta acción no se puede deshacer."
        confirmText="Restablecer"
        variant="warning"
      />
    </motion.div>
  );
}