# FACTURAFLOW AAA

<div align="center">

![FACTURAFLOW AAA](https://img.shields.io/badge/FACTURAFLOW-AAA-6366f1?style=for-the-badge&labelColor=0f172a)

**Sistema Profesional de Facturacion**

Plataforma SaaS completa para la gestion empresarial de facturacion, clientes, productos y reportes financieros.

[🌐 Demo en Vivo](https://caos1codex-hash.github.io/facturaflow-aaa/) · [Reportar Bug](https://github.com/caos1codex-hash/facturaflow-aaa/issues) · [Solicitar Feature](https://github.com/caos1codex-hash/facturaflow-aaa/issues)

</div>

---

## Caracteristicas Principales

### Dashboard Ejecutivo
- KPIs en tiempo real: facturas emitidas, pagadas, pendientes
- Graficos dinamicos de ingresos mensuales con Chart.js
- Resumen financiero completo
- Actividad reciente con timeline

### Gestion de Clientes
- CRUD completo con busqueda y filtros
- Informacion fiscal (RFC/identificacion tributaria)
- Datos de contacto completos
- Validacion de formularios

### Catalogo de Productos y Servicios
- Productos y servicios con SKU y categorias
- Precios unitarios con impuestos asociados
- Control de disponibilidad
- Vista en tarjetas profesional

### Creador de Facturas
- Seleccion de cliente y productos con busqueda
- Numeracion automatica: FAC-2026-000001, FAC-2026-000002...
- Calculos automaticos de subtotal, impuestos y total
- Descuentos por linea y condiciones de pago
- Metodos de pago SAT (PUE/PPD, 22 formas de pago)

### Generacion PDF Profesional
- PDFs empresariales con diseno premium
- Logo de empresa, datos fiscales, codigo QR
- Tabla de productos con desglose de impuestos
- Total en letras, pie de pagina con paginacion
- Descarga directa o impresion

### Sistema de Impuestos Configurable
- IVA 16%, 8%, 0%, retenciones, IEPS
- Impuestos personalizados con porcentaje libre
- Calculo automatico por linea y total
- Desglose por tipo de impuesto

### Historial Completo
- Registro de todas las actividades (crear, editar, eliminar)
- Filtros por entidad, accion, fecha y busqueda
- Timeline visual con iconos por accion
- Paginacion completa

### Estados de Facturas
- 6 estados: Borrador, Emitida, Pendiente, Pagada, Vencida, Cancelada
- Indicadores visuales con colores
- Cambio de estado rapido desde la lista

### Exportacion
- **CSV** con codificacion UTF-8 BOM
- **Excel** (.xlsx) con columnas formateadas
- **PDF** con tabla profesional
- **JSON** estructurado
- Exportar facturas, clientes, productos y reportes

### Reportes Avanzados
- Ingresos por periodo con comparativa
- Ventas por cliente (top 10)
- Distribucion de ventas por producto
- Resumen de impuestos cobrados
- Facturas vencidas y pendientes
- Seleccion de periodo personalizado

### Buscador Global
- Busqueda universal en facturas, clientes y productos
- Resultados categorizados en tiempo real
- Navegacion por teclado
- Acceso rapido desde cualquier pagina

### Configuracion de Empresa
- Logo, nombre, datos fiscales, regimen fiscal
- Moneda configurable (MXN, USD, EUR, COP, ARS, CLP, PEN, BRL)
- Formato de fecha y plantilla de numeracion
- Importar/exportar configuracion JSON

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **React 19** | Framework UI |
| **Vite 8** | Build tool y dev server |
| **TailwindCSS v4** | Framework de estilos |
| **React Router v7** | Enrutamiento SPA |
| **Chart.js + react-chartjs-2** | Graficos y visualizaciones |
| **jsPDF + jspdf-autotable** | Generacion de PDFs |
| **Framer Motion** | Animaciones y transiciones |
| **Lucide React** | Biblioteca de iconos |
| **XLSX (SheetJS)** | Exportacion a Excel |
| **Supabase** | Backend y persistencia (opcional) |
| **date-fns** | Manipulacion de fechas |
| **react-hot-toast** | Notificaciones |
| **QRCode** | Generacion de codigos QR |

---

## Arquitectura

```
facturaflow-aaa/
├── .github/workflows/
│   └── deploy.yml            # GitHub Actions para Pages
├── public/
├── src/
│   ├── components/
│   │   ├── layout/           # Sidebar, Header, Layout
│   │   └── ui/               # Button, Card, Modal, Table, Badge, etc.
│   ├── context/              # ThemeContext, AppContext
│   ├── hooks/                # useData, useSearch, useTheme
│   ├── pages/                # Dashboard, Clients, Products, Invoices, etc.
│   ├── services/             # DataService (Supabase + localStorage), PDF
│   ├── utils/                # constants, formatters, validators
│   ├── App.jsx               # Enrutamiento principal
│   ├── main.jsx              # Entry point
│   └── index.css             # Estilos globales y tema
├── package.json
├── vite.config.js
└── README.md
```

---

## Instalacion Local

```bash
# Clonar el repositorio
git clone https://github.com/caos1codex-hash/facturaflow-aaa.git
cd facturaflow-aaa

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Configuracion de Supabase (Opcional)

La aplicacion funciona completamente con localStorage. Para persistencia en la nube con Supabase:

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Crear las tablas necesarias (invoices, clients, products, settings)
3. Copiar las credenciales
4. Crear un archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

---

## Demo en Vivo

🌐 **[https://caos1codex-hash.github.io/facturaflow-aaa/](https://caos1codex-hash.github.io/facturaflow-aaa/)**

---

## Roadmap

- [x] Dashboard ejecutivo con KPIs
- [x] Gestion de clientes (CRUD)
- [x] Catalogo de productos y servicios
- [x] Creador de facturas profesional
- [x] Generacion PDF empresarial con QR
- [x] Sistema de impuestos configurable
- [x] Historial de actividades
- [x] Estados de facturas con indicadores visuales
- [x] Exportacion CSV, Excel, PDF, JSON
- [x] Reportes avanzados con graficos
- [x] Buscador global
- [x] Configuracion de empresa
- [x] Dark Mode / Light Mode
- [x] Responsive completo
- [ ] Autenticacion de usuarios
- [ ] Multi-idioma (en, pt)
- [ ] Integracion con API de facturacion fiscal (CFDI)
- [ ] Panel de administracion multi-usuario
- [ ] App movil (PWA)
- [ ] Notificaciones por email
- [ ] Recurrencia de facturas

---

## Licencia

MIT License - Libre para uso personal y comercial.

---

<div align="center">

**Desarrollado con React + Vite + TailwindCSS**

Hecho con dedicacion para profesionales que merecen herramientas de primer nivel.

</div>