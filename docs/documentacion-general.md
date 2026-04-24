# Documentación General del Proyecto OPENPOS

## Resumen OP-007

**OPENPOS** es un sistema completo de punto de venta (POS) para terminal, construido con TypeScript/React, diseñado para operaciones minoristas modernas con características avanzadas como impresión térmica, facturación CFDI y programas de fidelidad.

## Tecnologías Utilizadas

| Capa | Tecnología |
|------|------------|
| **Entorno de Ejecución** | Bun (entorno JS de alto rendimiento) |
| **Framework de UI** | React 19 + Ink 7 (Interfaz de Usuario de Terminal) |
| **Gestión de Estado** | Zustand 5 |
| **ORM de Base de Datos** | Drizzle ORM |
| **Base de Datos** | SQLite (modo WAL para concurrencia) |
| **Construcción/Verificación de Tipos** | TypeScript 5.4, tsc |
| **Contenedor** | Docker/Docker Compose |

## Estructura del Proyecto

```
openpos/
├── src/
│   ├── app.tsx                 # Punto de entrada principal de React (aplicación TUI)
│   ├── cli.ts                  # Manejador de CLI y comandos
│   ├── modules/
│   │   ├── pos/                # Pantallas del Punto de Venta
│   │   │   ├── PosScreen.tsx        # Interfaz principal de ventas
│   │   │   ├── LoginScreen.tsx      # Autenticación
│   │   │   ├── LoadingScreen.tsx    # Cargador de inicio
│   │   │   ├── ReportsScreen.tsx    # Reportes de ventas
│   │   │   ├── TermsScreen.tsx      # Aceptación de términos y condiciones
│   │   │   └── components/
│   │   │       ├── PayModal.tsx     # Procesador de pagos
│   │   │       ├── ProductGrid.tsx  # UI del catálogo de productos
│   │   │       └── Ticket.tsx       # Visualización del ticket
│   │   └── settings/           # Interfaz de configuración
│   │       ├── SettingsApp.tsx      # Enrutador de configuraciones
│   │       ├── StoreConfig.tsx      # Detalles de la tienda
│   │       ├── BillingConfig.tsx    # Configuración de facturación
│   │       ├── ProductConfig.tsx    # Gestión de inventario
│   │       ├── UserConfig.tsx       # Gestión de usuarios/roles
│   │       ├── PrinterConfig.tsx    # Configuraciones de impresora
│   │       ├── ClientConfig.tsx     # Gestión de clientes
│   │       └── TaxConfig.tsx        # Configuración de impuestos
│   └── shared/                 # Paquete compartido del monorepo
│       └── src/
│           ├── db/                  # Capa de base de datos
│           │   ├── schema.ts        # Tablas de Drizzle
│           │   ├── client.ts        # Inicialización y configuración de BD
│           │   ├── pagination.ts    # Búsqueda de productos
│           │   ├── seed.ts          # Datos de demostración
│           │   └── import-csv.ts    # Importación CSV
│           ├── store/               # Stores de Zustand
│           │   ├── auth.ts          # Estado de autenticación
│           │   ├── cart.ts          # Carrito de compras
│           │   └── windowManager.ts # Estado de modales/diálogos
│           ├── services/
│           │   └── billing/         # Servicio de facturación CFDI
│           │       ├── BillingService.ts    # Interfaz del servicio
│           │       ├── BillingProvider.ts   # Proveedor abstracto
│           │       └── providers/
│           │           └── FacturapiProvider.ts
│           ├── utils/
│           │   └── printer/         # Controlador de impresora térmica
│           │       ├── ThermalDriver.ts
│           │       ├── TicketBuilder.ts
│           │       └── types.ts
│           ├── components/          # Componentes reutilizables de Ink UI
│           │   ├── Box.tsx
│           │   ├── Button.tsx
│           │   ├── Input.tsx
│           │   ├── Modal.tsx
│           │   ├── Select.tsx
│           │   └── ...
│           ├── hooks/               # Hooks personalizados de React
│           ├── config.ts            # Gestión de configuración
│           ├── theme.ts             # Tema de colores del terminal
│           └── logger.ts            # Registro de depuración
└── assets/                    # Archivos de configuración
    └── config.json            # Configuraciones predeterminadas
```

## Esquema de Base de Datos

### Tablas Principales

#### Productos
```typescript
id | barcode (único) | sku (único) | name | price | cost | category | stock
minStock | unitType (pza/kg/g/lt/ml/m/cm) | unitQty | active | timestamps
```
- Soporta unidades fraccionarias (kg, ml, etc.) con incrementos configurables
- Rastrea niveles mínimos de stock para gestión de inventario

#### Ventas
```typescript
id | ticket | subtotal | tax | discount | total | received | change | method
status | items (JSON) | itemCount | timestamps | createdBy
customerRfc | customerRazonSocial | customerEmail
cfdiStatus | cfdiUuid
```
- Almacena historial completo de transacciones con metadatos CFDI
- Artículos serializados como JSON para seguimiento flexible de líneas

#### Usuarios
```typescript
id | username (único) | name | pin | role (admin|cashier) | active | timestamps
```
- Autenticación basada en PIN (sin contraseñas almacenadas en texto plano en el esquema)
- Control de acceso basado en roles (RBAC) para separación admin/cajero

#### Clientes
```typescript
id | code (único) | rfc (único) | razonSocial | email | telefono | direccion
regimenFiscal | puntos (puntos de fidelidad) | timestamps
```
- Registros de clientes para facturación (RFC requerido para CFDI)
- Integración de programa de fidelidad vía sistema de puntos

#### Configuración
```typescript
key (clave primaria) | value | updatedAt
```
- Almacén clave-valor para configuraciones: nombre de tienda, RFC, tasa de impuestos, claves API, etc.

## Gestión de Estado (Stores de Zustand)

### useAuth
```typescript
- isAuthenticated: boolean
- user: { id, username, pin, name, role, active }
- login(username, pin): boolean    // Validación de PIN
- logout(): void
```

### useCart
```typescript
- items: CartItem[] (Producto + qty)
- ticketNum: number  // Persistido en configuración
- add(product, qty), remove(sku), inc(sku), dec(sku), setQty()
- clear(): void
- nextTicket(): incrementa y guarda número de ticket
- Calculado: subtotal(), tax() (16% por defecto), total()
```

### useWindowManager
- Estado global de modales/diálogos para prevenir conflictos de entrada de teclado
- Previene navegación global cuando los modales están activos

## Características Principales

### 1. Gestión de Ventas
- **Checkout rápido**: Escaneo de códigos de barras, búsqueda de productos con paginación (50 artículos/página)
- **Métodos de pago**: Efectivo, tarjeta, transferencias (SPEI), códigos QR
- **Carrito en tiempo real**: Agregar/quitar artículos, ajustar cantidades con unidades fraccionarias
- **Impuestos automáticos**: Tasa de impuestos configurable (16% IVA por defecto)

### 2. Autenticación y Autorización
- Login basado en PIN (límite de 3 intentos antes de reinicio)
- Dos roles:
  - **Admin**: Acceso completo al sistema (configuración, usuarios, reportes)
  - **Cajero**: Checkout y reportes básicos únicamente
- Gestión de usuarios vía interfaz de configuraciones

### 3. Facturación (CFDI/Facturación)
- Integración con proveedor **FacturAPI** para facturación electrónica mexicana
- Búsqueda de RFC de cliente o creación al vuelo
- Códigos de uso CFDI (G01, I03, I04, D01, P01)
- Seguimiento de UUID de factura para cumplimiento
- Capacidad de envío por email
- Modo sandbox para pruebas

### 4. Inventario y Productos
- Importación masiva CSV con capacidad upsert (`--replace`)
- Categorías de productos, códigos de barras, SKUs
- Seguimiento de stock con umbrales mínimos
- Tipos de unidad: piezas (pza), kilogramos (kg), litros (lt), etc.

### 5. Impresión Térmica
- Controlador de comandos **ESC/POS** para impresoras de recibos térmicos
- Soporta interfaces TCP/IP y de impresora Windows
- Generación de códigos QR para verificación de tickets
- Impresión de banner de imagen (cargado desde archivo al inicio)
- Soporte de conjunto de caracteres (PC437, PC850, WPC1252, etc.)
- Márgenes configurables, alineación, negrita/ancho doble

### 6. Programa de Fidelidad
- Acumulación de puntos de cliente
- Recompensas basadas en puntos para clientes recurrentes
- Seguido en campo `clients.puntos`

### 7. Reportes
- Resúmenes de ventas diarios/período
- Ingresos por método de pago
- Análisis de ventas de productos
- Seguimiento de estado CFDI

### 8. Configuraciones de Terminal (TUI)
- **Tienda**: Nombre, RFC, nombre legal, dirección, email, teléfono, régimen fiscal
- **Facturación**: Clave FacturAPI, proveedor, alternancia sandbox
- **Impuestos**: Tasa IVA, reinicio de número de ticket
- **Impresora**: Habilitar/deshabilitar, configuración de interfaz
- **Productos**: Agregar, editar, eliminar, buscar, filtrar por categoría
- **Usuarios**: Crear, editar, eliminar, cambiar roles
- **Clientes**: Agregar, editar, buscar (RFC/nombre/email/código)

## Detalles de Implementación Clave

### Base de Datos
- **Modo WAL** habilitado para acceso concurrente sin bloqueo
- Inicialización lazy vía patrón proxy en [client.ts](openpos/src/shared/src/db/client.ts#L1)
- Drizzle ORM para consultas type-safe

### Búsqueda y Paginación
- [pagination.ts](openpos/src/shared/src/db/pagination.ts) proporciona:
  - `searchProducts(query, offset, limit)`: Búsqueda insensible a mayúsculas SKU/nombre
  - `findProductByCode(code)`: Búsqueda directa de código de barras/SKU
  - Scroll infinito en PosScreen (carga lazy de 50 artículos a la vez)

### Arquitectura del Servicio de Facturación
- **Patrón proveedor**: Interfaz abstracta `BillingProvider` con implementación `FacturapiProvider`
- Soporta inicialización con clave API y modo sandbox
- Métodos: `createInvoice()`, `cancelInvoice()`, `getInvoicePdf()`, `sendInvoiceEmail()`

### Controlador de Impresora Térmica
- Generación de comandos ESC/POS de bajo nivel (concatenación de buffer)
- Constructor de comandos QR con codificación de longitud de datos
- Ayudantes de relleno/alineación de texto
- Detección de codificación de caracteres
- Auto-detección de interfaz (TCP, impresora Windows, archivo)

### Biblioteca de Componentes UI (basada en Ink)
Componentes reutilizables en `shared/src/components/`:
- `Box`, `Container`, `Panel`: Contenedores de layout
- `Button`, `Input`, `Select`: Controles de formulario
- `Modal`, `Dialog`, `Overlay`: Modales/ventanas
- `Badge`, `Text`, `Divider`: Elementos visuales
- `StatusBar`, `Spinner`: Componentes de retroalimentación
- `Split`, `Row`, `Col` (ayudantes de layout): Layout de cuadrícula

### Manejo de Errores
- Manejadores globales de excepciones no capturadas en [cli.ts](openpos/src/cli.ts#L1)
- SettingsErrorBoundary para crashes de UI graceful
- Logging estructurado a `openpos.log`

### Restricciones de Terminal
- Detección de tamaño de terminal (cols × filas) al inicio
- Niveles de layout responsivo: ancho compacto/normal, altura corta/alta
- Tamaños de componentes adaptados al espacio disponible
- Overlay "Demasiado pequeño" cuando terminal < tamaño mínimo

## Comandos CLI

```bash
# Modo interactivo (aplicación POS principal)
bun run dev

# Menú de configuración de ajustes
pos.exe --settings

# Importación CSV (con o sin reemplazo)
pos.exe import products [--replace]

# Exportación CSV
pos.exe export products

# Sembrar datos de demostración
pos.exe seed

# Gestión de usuarios
pos.exe add user <username> <pin> [--role admin|cashier]

# Gestión de configuración
pos.exe config get
pos.exe config set <key> <value>
```

## Puntos de Entrada

| Modo | Entrada | Propósito |
|------|---------|-----------|
| **POS Interactivo** | [src/app.tsx](openpos/src/app.tsx) | Aplicación principal React/Ink; Flujo Login → PosScreen |
| **CLI** | [src/cli.ts](openpos/src/cli.ts) | Analizador de comandos, semilla de BD, operaciones CSV |
| **Configuraciones TUI** | [SettingsApp.tsx](openpos/src/modules/settings/SettingsApp.tsx) | Interfaz de configuración de admin |

## Conclusiones Clave

1. **Diseño de monorepo**: Paquete compartido permite reutilización de código en múltiples puntos de entrada
2. **Nativo de Bun**: Aprovecha el controlador SQLite integrado de Bun para acceso ligero a BD
3. **Primero el terminal**: Optimizado para TUI de baja latencia con pipeline de renderizado Ink + React
4. **Facturación lista para producción**: Cumplimiento total CFDI para autoridad fiscal mexicana (SAT)
5. **Arquitectura modular**: Separación limpia de preocupaciones (stores, servicios, componentes, db)
6. **Seguridad de tipos**: Compilación completa TypeScript; Drizzle proporciona inferencia de tipos a nivel de esquema