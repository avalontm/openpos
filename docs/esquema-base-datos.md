# Esquema de Base de Datos - OPENPOS

## Descripción General

El sistema OPENPOS utiliza **SQLite** como motor de base de datos, gestionado a través de **Drizzle ORM** para consultas type-safe. La base de datos se inicializa en modo WAL (Write-Ahead Logging) para permitir acceso concurrente sin bloqueos.

Archivo de base de datos: `pos.db`

## Tablas Principales

### 1. `products` - Catálogo de Productos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| `barcode` | TEXT | UNIQUE, NULLABLE | Código de barras único |
| `sku` | TEXT | UNIQUE | Código SKU único |
| `name` | TEXT | NOT NULL | Nombre del producto |
| `price` | REAL | NOT NULL | Precio de venta |
| `cost` | REAL | NULLABLE | Costo de adquisición |
| `category` | TEXT | DEFAULT 'GEN' | Categoría del producto |
| `stock` | REAL | DEFAULT 0 | Cantidad en stock |
| `minStock` | REAL | DEFAULT 5 | Nivel mínimo de stock |
| `unitType` | TEXT | DEFAULT 'pza' | Tipo de unidad (pza, kg, g, lt, ml, m, cm) |
| `unitQty` | REAL | DEFAULT 1 | Cantidad por unidad |
| `active` | INTEGER | DEFAULT 1 | Producto activo (1) o inactivo (0) |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

**Notas:**
- Soporta unidades fraccionarias para productos como alimentos o líquidos
- `unitQty` permite incrementos personalizados (ej: vender por 0.5 kg)
- Índices en `barcode`, `sku`, `category` para búsquedas rápidas

### 2. `sales` - Registro de Ventas

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| `ticket` | TEXT | NOT NULL | Número de ticket |
| `subtotal` | REAL | NOT NULL | Subtotal antes de impuestos |
| `tax` | REAL | NOT NULL | Monto de impuestos |
| `discount` | REAL | DEFAULT 0 | Descuento aplicado |
| `total` | REAL | NOT NULL | Total de la venta |
| `received` | REAL | NULLABLE | Monto recibido |
| `change` | REAL | NULLABLE | Cambio devuelto |
| `method` | TEXT | NOT NULL | Método de pago (cash, card, transfer, qr) |
| `status` | TEXT | DEFAULT 'completed' | Estado (completed, cancelled) |
| `items` | TEXT | NOT NULL | Artículos en JSON |
| `itemCount` | INTEGER | NOT NULL | Número de artículos |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |
| `createdBy` | INTEGER | NOT NULL | ID del usuario que creó la venta |
| `customerRfc` | TEXT | NULLABLE | RFC del cliente (para facturación) |
| `customerRazonSocial` | TEXT | NULLABLE | Razón social del cliente |
| `customerEmail` | TEXT | NULLABLE | Email del cliente |
| `cfdiStatus` | TEXT | NULLABLE | Estado CFDI (issued, cancelled) |
| `cfdiUuid` | TEXT | NULLABLE | UUID de la factura CFDI |

**Notas:**
- `items` almacena un array JSON con detalles de cada producto vendido
- Campos CFDI se llenan solo cuando se genera factura electrónica
- Relación con tabla `users` vía `createdBy`

### 3. `users` - Usuarios del Sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| `username` | TEXT | UNIQUE NOT NULL | Nombre de usuario |
| `name` | TEXT | NOT NULL | Nombre completo |
| `pin` | TEXT | NOT NULL | PIN de acceso (hash) |
| `role` | TEXT | DEFAULT 'cashier' | Rol (admin, cashier) |
| `active` | INTEGER | DEFAULT 1 | Usuario activo (1) o inactivo (0) |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

**Notas:**
- PIN se almacena hasheado para seguridad
- Dos roles: admin (acceso completo) y cashier (solo ventas)
- Autenticación requiere PIN válido

### 4. `clients` - Clientes para Facturación

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único |
| `code` | TEXT | UNIQUE NOT NULL | Código interno único (CL-00001) |
| `rfc` | TEXT | UNIQUE NOT NULL | RFC del cliente |
| `razonSocial` | TEXT | NOT NULL | Razón social o nombre |
| `email` | TEXT | NULLABLE | Correo electrónico |
| `telefono` | TEXT | NULLABLE | Número de teléfono |
| `direccion` | TEXT | NULLABLE | Dirección fiscal |
| `regimenFiscal` | TEXT | NULLABLE | Régimen fiscal (601, 603, etc.) |
| `puntos` | INTEGER | DEFAULT 0 | Puntos de fidelidad |
| `createdAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

**Notas:**
- RFC único requerido para facturación CFDI
- Sistema de puntos para programa de fidelidad
- `code` generado automáticamente con prefijo CL-

### 5. `config` - Configuración del Sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| `key` | TEXT | PRIMARY KEY | Clave de configuración |
| `value` | TEXT | NOT NULL | Valor de configuración |
| `updatedAt` | TEXT | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

**Notas:**
- Almacén clave-valor para configuraciones dinámicas
- Claves comunes: storeName, storeRfc, taxRate, ticketNumber, etc.

## Relaciones

- `sales.createdBy` → `users.id`
- `sales.customerRfc` puede relacionarse con `clients.rfc` (no FK formal)

## Índices

- `products`: barcode, sku, category, active
- `sales`: ticket, createdAt, createdBy, cfdiStatus
- `users`: username, role, active
- `clients`: code, rfc, email

## Migraciones

Las migraciones se manejan automáticamente por Drizzle ORM al inicializar la aplicación. El esquema se define en `src/shared/src/db/schema.ts`.

## Semilla de Datos

Datos de demostración se pueden cargar con `pos.exe seed`, que incluye:
- Usuario admin por defecto
- Productos de ejemplo
- Configuraciones básicas

## Consultas Comunes

### Búsqueda de Productos
```sql
SELECT * FROM products 
WHERE (name LIKE ? OR sku LIKE ? OR barcode = ?) 
AND active = 1 
ORDER BY name 
LIMIT ? OFFSET ?
```

### Ventas por Período
```sql
SELECT * FROM sales 
WHERE createdAt BETWEEN ? AND ? 
ORDER BY createdAt DESC
```

### Reporte de Ventas
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as transactions,
  SUM(total) as revenue,
  SUM(tax) as tax_collected
FROM sales 
WHERE status = 'completed' 
GROUP BY DATE(createdAt) 
ORDER BY date DESC
```