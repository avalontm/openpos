# OPENPOS v22.14.0

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
- Impresora térmica (opcional)

## Instalación

```bash
# Instalar dependencias
npm install

# Inicializar base de datos
bun run seed
```

## Uso

### Modo interactivo (Interfaz visual)

```bash
bun run dev
```

### Línea de comandos (CLI)

```bash
pos.exe --help              # Mostrar ayuda
pos.exe --version           # Mostrar versión
pos.exe import products     # Importar productos desde CSV
pos.exe export products     # Exportar productos a CSV
pos.exe seed                # Insertar productos de ejemplo
pos.exe config get          # Ver configuración
pos.exe config set <key> <value>  # Actualizar configuración
```

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

### Credenciales por defecto

| Usuario | PIN |
|---------|-----|
| admin   | 1234 |
| caja    | 5678 |

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

Licencia MIT - Copyright (c) 2025 avalontm

Proyecto desarrollado por AvalonTM
