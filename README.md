# OPENPOS

Sistema de punto de venta para terminal (TUI) construido con Bun, Ink, Zustand y Drizzle ORM.

## Screenshots

### Pantalla de Login
![Login](images/screen1.png)

### Pantalla Principal
![POS](images/screen2.png)

### Pantalla de Reportes
![Reports](images/screen3.png)

## Características

- Gestión de ventas y tickets
- Inventario con códigos de barras
- Impresión térmica de tickets (incluye banner desde imagen)
- Reportes de ventas
- Autenticación de empleados
- Soporte para diferentes unidades (pza, kg, lt, ml, etc.)
- Interfaz CLI para importación/exportación de productos

## Requisitos

- Bun (última versión)
- Node.js 22+
- Docker y Docker Compose (opcional)
- Impresora térmica (opcional)

## Instalación

```bash
# Instalar dependencias
npm install

# Inicializar base de datos
bun run seed
```

## Docker

Si prefieres usar Docker, el proyecto ya está configurado para ejecutarse en contenedores:

```bash
# Construir la imagen
docker-compose build

# Iniciar modo interactivo (Punto de Venta)
docker-compose up app
```

> [!IMPORTANT]
> Para interactuar con la interfaz TUI (terminal) dentro de Docker, es necesario que el servicio tenga `tty: true` y `stdin_open: true` (ya configurado en `docker-compose.yml`).

## Base de Datos

El sistema usa **SQLite** como motor de base de datos (archivo `pos.db`), gestionado con **Drizzle ORM**.

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `products` | Catálogo de productos (sku, name, price, stock, etc.) |
| `sales` | Registro de ventas/tickets |
| `users` | Usuarios del sistema (username, pin, role) |
| `config` | Configuración del negocio |

### Crear usuario

```bash
# Agregar usuario con rol cashier (por defecto)
pos.exe add user juan 1234

# Agregar usuario admin
pos.exe add user juan 1234 --role admin
```

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso completo al sistema |
| `cashier` | Usuario de caja (predeterminado)

## Uso

### Modo interactivo (Interfaz visual)

```bash
bun run dev
```

### Línea de comandos (CLI)

Puedes ejecutar los comandos directamente o a través de Docker:

| Comando | Ejecución Local | Ejecución Docker |
|---------|-----------------|------------------|
| Ayuda | `pos.exe --help` | `docker-compose run --rm app --help` |
| Versión | `pos.exe --version` | `docker-compose run --rm app --version` |
| Importar | `pos.exe import products` | `docker-compose run --rm app import products` |
| Exportar | `pos.exe export products` | `docker-compose run --rm app export products` |
| Seed | `pos.exe seed` | `docker-compose run --rm app seed` |
| Usuario | `pos.exe add user <user> <pin>` | `docker-compose run --rm app add user <user> <pin>` |
| Config Get | `pos.exe config get` | `docker-compose run --rm app config get` |
| Config Set | `pos.exe config set <k> <v>` | `docker-compose run --rm app config set <k> <v>` |

### Importar Productos

#### Formato CSV

```csv
sku,name,price,cost,category,stock,barcode,unittype,unitqty,minstock
001,Producto 1,10.50,5.00,BEB,100,123456789,pza,1,10
002,Producto 2,25.00,12.00,ALI,50,987654321,kg,1,5
```

#### Campos CSV

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| sku | ✅ | Código único |
| name | ✅ | Nombre del producto |
| price | ✅ | Precio de venta |
| cost | ❌ | Costo |
| category | ❌ | Categoría (default: GEN) |
| stock | ❌ | Stock inicial (default: 0) |
| minStock | ❌ | Stock mínimo (default: 5) |
| unitType | ❌ | pza, kg, g, lt, ml, m, cm (default: pza) |
| unitQty | ❌ | Cantidad por unidad |
| barcode | ❌ | Código de barras |

#### Ejemplos de importación

```bash
# Importar productos
pos.exe import products productos.csv

# Simular importación (sin guardar)
pos.exe import products productos.csv --dry-run
```

### Atajos de teclado

| Tecla | Acción |
|-------|--------|
| Tab | Cambiar panel |
| ↑↓←→ | Navegar |
| Enter | Seleccionar/Pagar |
| 1-4 | Alternativas de navegación |
| / | Buscar productos |
| R | Ver reportes |
| L | Cerrar sesión |
| Ctrl+Q | Salir |

### En panel Ticket (carrito)

| Tecla | Acción |
|-------|--------|
| + | Aumentar cantidad |
| - | Disminuir cantidad |
| d | Eliminar item |

## Configuración de Impresora

El sistema de impresión ya utiliza los datos del negocio desde la base de datos (nombre, RFC, dirección) y puede imprimir un banner desde `assets/banner.png`.

Editar `config.json` junto al ejecutable:

```json
{
  "printer": {
    "type": "epson",
    "interface": "printer:NOMBRE",
    "width": 48,
    "characterSet": "PC850"
  },
  "template": {
    "header": {
      "enabled": true
    }
  },
  "options": {
    "printCopies": 1,
    "cut": true
  }
}
```

### Tipos de conexión

| Tipo | Ejemplo | Descripción |
|------|---------|-------------|
| USB | `printer:NOMBRE` | Impresora USB (Windows) |
| Red | `tcp://192.168.1.100:9100` | Impresora de red |

### Ancho de papel

| Ancho | Caracteres | Tipo |
|-------|------------|------|
| 32 | 32 caracteres | 58mm |
| 48 | 48 caracteres | 80mm |

## Construcción

```bash
# Compilar executable
bun build src/app.tsx --compile --outfile pos.exe
```

El ejecutable `pos.exe` queda en el directorio del proyecto. Los comandos CLI funcionan directamente con el ejecutable.

## GitHub

Repositorio: https://github.com/avalontm/openpos.git

## Licencia

Licencia MIT - Copyright (c) 2026 avalontm

Proyecto desarrollado por AvalonTM
