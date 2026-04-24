# Referencia de API - OPENPOS

## Comandos CLI

### Sintaxis General
```bash
pos.exe [comando] [opciones]
```

### Comandos Disponibles

#### 1. `pos.exe --help`
Muestra ayuda general del sistema.

#### 2. `pos.exe --version`
Muestra la versión del sistema.

#### 3. `pos.exe --settings`
Abre la interfaz TUI de configuración (modo interactivo).

#### 4. `pos.exe import products <archivo.csv> [--replace] [--dry-run]`
Importa productos desde un archivo CSV.

**Parámetros:**
- `archivo.csv`: Ruta al archivo CSV
- `--replace`: Reemplaza productos existentes (upsert)
- `--dry-run`: Simula la importación sin guardar cambios

**Formato CSV:**
```csv
sku,name,price,cost,category,stock,barcode,unittype,unitqty,minstock
001,Producto 1,10.50,5.00,BEB,100,123456789,pza,1,10
```

#### 5. `pos.exe export products <archivo.csv>`
Exporta todos los productos a un archivo CSV.

**Parámetros:**
- `archivo.csv`: Ruta donde guardar el archivo

#### 6. `pos.exe seed`
Carga datos de demostración en la base de datos.

#### 7. `pos.exe add user <username> <pin> [--role admin|cashier]`
Agrega un nuevo usuario al sistema.

**Parámetros:**
- `username`: Nombre de usuario único
- `pin`: PIN de 4 dígitos
- `--role`: Rol del usuario (por defecto: cashier)

#### 8. `pos.exe config get`
Muestra todas las configuraciones actuales.

#### 9. `pos.exe config set <key> <value>`
Establece un valor de configuración.

**Ejemplos:**
```bash
pos.exe config set storeName "Mi Tienda"
pos.exe config set taxRate 0.16
pos.exe config set ticketNumber 1000
```

## Servicios Internos

### BillingService (Facturación CFDI)

Ubicación: `src/shared/src/services/billing/`

#### Interfaz BillingProvider
```typescript
interface BillingProvider {
  initialize(config: BillingConfig): Promise<void>;
  createInvoice(invoice: InvoiceData): Promise<InvoiceResult>;
  cancelInvoice(uuid: string): Promise<void>;
  getInvoicePdf(uuid: string): Promise<Buffer>;
  sendInvoiceEmail(uuid: string, email: string): Promise<void>;
}
```

#### FacturapiProvider
Implementación concreta para FacturAPI.

**Configuración requerida:**
```json
{
  "billing": {
    "provider": "facturapi",
    "apiKey": "sk_test_...",
    "sandbox": true
  }
}
```

**Métodos:**
- `createInvoice()`: Crea factura CFDI con datos de venta
- `cancelInvoice()`: Cancela factura existente
- `getInvoicePdf()`: Obtiene PDF de la factura
- `sendInvoiceEmail()`: Envía factura por email

### ThermalDriver (Impresora Térmica)

Ubicación: `src/shared/src/utils/printer/`

#### Interfaces
```typescript
interface PrinterConfig {
  enabled: boolean;
  interface: string; // "tcp://192.168.1.100:9100" | "printer:NOMBRE" | "USB" | "/dev/usb/lp0"
  width: 48 | 58 | 80; // caracteres por línea
  charset: 'PC437' | 'PC850' | 'PC860' | 'PC863' | 'PC865' | 'PC858' | 'WIN1252' | 'ISO8859_1';
}

interface TicketData {
  store: StoreInfo;
  items: TicketItem[];
  totals: TicketTotals;
  qrCode?: string;
}
```

#### Métodos Principales
- `printTicket(data: TicketData)`: Imprime ticket completo
- `printTest()`: Imprime ticket de prueba
- `initialize()`: Configura conexión con impresora

#### Comandos ESC/POS Soportados
- Texto: alineación, negrita, tamaño doble
- Cortes: corte parcial/completo
- Códigos QR: generación con corrección de errores
- Imágenes: banner desde archivo PNG

### Stores de Zustand

#### useAuth
```typescript
const { isAuthenticated, user, login, logout } = useAuth();

// Login
const success = login(username, pin);
if (success) {
  // Usuario autenticado
}

// Logout
logout();
```

#### useCart
```typescript
const { 
  items, 
  ticketNum, 
  add, 
  remove, 
  inc, 
  dec, 
  clear, 
  nextTicket,
  subtotal,
  tax,
  total 
} = useCart();

// Agregar producto
add(product, quantity);

// Incrementar cantidad
inc(product.sku);

// Nuevo ticket
nextTicket();
```

#### useWindowManager
```typescript
const { openModal, closeModal, isModalOpen } = useWindowManager();

// Abrir modal
openModal('payment');

// Cerrar modal
closeModal();
```

### Utilidades de Base de Datos

Ubicación: `src/shared/src/db/`

#### Client
```typescript
import { db } from './client';

// Consultas type-safe
const products = await db.select().from(productsTable);
const sales = await db.select().from(salesTable).where(eq(salesTable.status, 'completed'));
```

#### Pagination
```typescript
import { searchProducts, findProductByCode } from './pagination';

// Búsqueda con paginación
const results = await searchProducts('query', 0, 50);

// Búsqueda por código
const product = await findProductByCode('123456789');
```

#### Import/Export CSV
```typescript
import { importProducts, exportProducts } from './import-csv';

// Importar
await importProducts('productos.csv', { replace: true });

// Exportar
await exportProducts('productos.csv');
```

### Componentes UI Reutilizables

Ubicación: `src/shared/src/components/`

#### Layout Components
- `Box`: Contenedor básico
- `Container`: Contenedor centrado
- `Panel`: Panel con borde
- `Split`: Layout dividido
- `Row/Col`: Sistema de cuadrícula

#### Form Components
- `Button`: Botón interactivo
- `Input`: Campo de entrada de texto
- `Select`: Selector desplegable
- `Modal`: Modal superpuesto
- `Dialog`: Diálogo de confirmación

#### Display Components
- `Text`: Texto con estilos
- `Badge`: Etiqueta/indicador
- `Spinner`: Indicador de carga
- `StatusBar`: Barra de estado
- `Divider`: Separador visual

### Hooks Personalizados

Ubicación: `src/shared/src/hooks/`

#### useLayout
```typescript
const { width, height, isSmall, isCompact } = useLayout();
// width: número de columnas
// height: número de filas
// isSmall: terminal pequeño
// isCompact: layout compacto
```

#### useWindowFocus
```typescript
const isFocused = useWindowFocus();
// true cuando la ventana tiene foco
```

### Configuración

Ubicación: `src/shared/src/config.ts`

#### Métodos
- `getConfig(key: string)`: Obtiene valor de configuración
- `setConfig(key: string, value: any)`: Establece configuración
- `getAllConfig()`: Obtiene todas las configuraciones

#### Claves Comunes
```typescript
storeName: string
storeRfc: string
storeAddress: string
taxRate: number // 0.16 para 16%
ticketNumber: number
printerEnabled: boolean
printerInterface: string
billingProvider: string
billingApiKey: string
billingSandbox: boolean
```

### Tema y Logger

#### Theme
Ubicación: `src/shared/src/theme.ts`
Define colores y estilos para terminal.

#### Logger
Ubicación: `src/shared/src/logger.ts`
```typescript
import { logger } from './logger';

logger.info('Mensaje informativo');
logger.error('Error:', error);
logger.debug('Datos de depuración');
```
// Logs se guardan en openpos.log