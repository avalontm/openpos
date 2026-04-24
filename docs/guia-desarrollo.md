# Guía de Desarrollo - OPENPOS

## Requisitos del Sistema

- **Bun**: Última versión (1.0+)
- **Node.js**: 22+ (para compatibilidad)
- **Sistema Operativo**: Windows 10+, Linux, macOS
- **Docker**: Opcional, para desarrollo en contenedores
- **Docker Compose**: Opcional

## Instalación del Entorno de Desarrollo

### 1. Instalar Bun
```bash
# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# Linux/macOS
curl -fsSL https://bun.sh/install | bash
```

### 2. Clonar el Repositorio
```bash
git clone https://github.com/avalontm/openpos.git
cd openpos
```

### 3. Instalar Dependencias
```bash
# Con Bun (recomendado)
bun install

# O con npm
npm install
```

### 4. Inicializar Base de Datos
```bash
# Cargar datos de demostración
bun run seed

# O con el ejecutable
./pos.exe seed
```

## Estructura del Monorepo

El proyecto utiliza un diseño de monorepo con un paquete compartido:

```
openpos/
├── src/                    # Código fuente principal
│   ├── app.tsx            # Aplicación TUI principal
│   ├── cli.ts             # CLI y comandos
│   └── modules/           # Módulos específicos
├── shared/                # Paquete compartido
│   ├── package.json       # Dependencias compartidas
│   ├── src/               # Código compartido
│   └── tsconfig.json      # Configuración TypeScript
├── package.json           # Dependencias del proyecto
├── tsconfig.json          # Configuración TypeScript principal
└── bunfig.toml           # Configuración de Bun
```

## Comandos de Desarrollo

### Desarrollo Interactivo
```bash
# Iniciar aplicación TUI
bun run dev

# Con recarga automática (si se configura)
bun --hot run dev
```

### Construcción
```bash
# Compilar ejecutable
bun build src/app.tsx --compile --outfile pos.exe

# Construir para desarrollo
bun run build
```

### Testing
```bash
# Ejecutar tests (si existen)
bun test

# Ejecutar linter
bun run lint
```

### Base de Datos
```bash
# Sembrar datos de desarrollo
bun run seed

# Resetear base de datos
rm pos.db && bun run seed
```

## Configuración de Desarrollo

### Variables de Entorno
Crear archivo `.env` en la raíz:
```env
# Base de datos
DATABASE_URL=file:pos.db

# FacturAPI (desarrollo)
FACTURAPI_API_KEY=sk_test_...
FACTURAPI_SANDBOX=true

# Logging
LOG_LEVEL=debug
```

### Configuración de TypeScript
- `tsconfig.json`: Configuración principal
- `shared/tsconfig.json`: Configuración del paquete compartido
- Strict mode habilitado
- Target: ES2022

### Configuración de Bun
`bunfig.toml`:
```toml
[install]
# Configuración de instalación

[run]
# Configuración de ejecución
```

## Desarrollo con Docker

### Construir Imagen
```bash
docker-compose build
```

### Ejecutar en Modo Desarrollo
```bash
# Modo interactivo
docker-compose up app

# Con logs
docker-compose up -d app
docker-compose logs -f app
```

### Desarrollo con Volúmenes
```yaml
# docker-compose.yml
volumes:
  - .:/app
  - /app/node_modules
```

## Arquitectura y Patrones

### Patrón de Estado
- **Zustand** para gestión de estado global
- Stores separados por dominio: `auth`, `cart`, `windowManager`
- Estado persistente en SQLite

### Patrón de Componentes
- **React + Ink** para UI de terminal
- Componentes reutilizables en `shared/src/components/`
- Layout responsivo basado en tamaño de terminal

### Patrón de Servicios
- **Provider Pattern** para servicios externos (FacturAPI)
- Interfaz abstracta + implementación concreta
- Configuración inyectada

### Patrón de Base de Datos
- **Repository Pattern** implícito en Drizzle ORM
- Consultas type-safe
- Migraciones automáticas

## Debugging

### Logging
```typescript
import { logger } from './shared/src/logger';

logger.debug('Variable:', variable);
logger.error('Error:', error);
```

Logs se guardan en `openpos.log`.

### Depuración de Terminal
- Verificar tamaño de terminal: `echo $COLUMNS $LINES`
- Probar componentes individualmente
- Usar `console.log` para debugging (visible en logs)

### Depuración de Base de Datos
```bash
# Abrir SQLite
sqlite3 pos.db

# Ver tablas
.tables

# Ver esquema
.schema products

# Consultas de debug
SELECT * FROM products LIMIT 5;
```

## Testing

### Estrategia de Testing
- Tests unitarios para utilidades
- Tests de integración para servicios
- Tests end-to-end para flujos completos

### Ejecutar Tests
```bash
# Todos los tests
bun test

# Tests específicos
bun test utils/printer

# Con cobertura
bun test --coverage
```

### Ejemplo de Test
```typescript
import { describe, it, expect } from 'bun:test';
import { calculateTax } from './utils/tax';

describe('Tax calculation', () => {
  it('should calculate 16% IVA', () => {
    const result = calculateTax(100, 0.16);
    expect(result).toBe(16);
  });
});
```

## Contribución

### Flujo de Trabajo
1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios
3. Ejecutar tests: `bun test`
4. Commit: `git commit -m "feat: descripción"`
5. Push: `git push origin feature/nueva-funcionalidad`
6. Crear PR

### Estándares de Código
- **ESLint** configurado
- **Prettier** para formato
- TypeScript strict mode
- Nombres descriptivos en español (UI) / inglés (código)

### Commits
Seguir [Conventional Commits](https://conventionalcommits.org/):
- `feat:` nuevas funcionalidades
- `fix:` corrección de bugs
- `docs:` cambios en documentación
- `refactor:` refactorización
- `test:` agregar tests

## Despliegue

### Construcción de Producción
```bash
# Compilar ejecutable
bun build src/app.tsx --compile --outfile pos.exe

# Crear paquete de distribución
# (copiar pos.exe, assets/, README.md)
```

### Variables de Producción
```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=file:pos.db
```

### Docker Production
```bash
# Construir imagen optimizada
docker build -t openpos:latest .

# Ejecutar
docker run -it openpos:latest
```

## Solución de Problemas

### Problemas Comunes

#### Error de Base de Datos
```
Error: SQLITE_CANTOPEN
```
**Solución:** Verificar permisos del archivo `pos.db`

#### Error de Terminal
```
Error: Terminal too small
```
**Solución:** Redimensionar terminal a mínimo 80x24

#### Error de Impresora
```
Error: Connection refused
```
**Solución:** Verificar configuración de interfaz de impresora

#### Error de Dependencias
```
Error: Cannot find module
```
**Solución:** `bun install` o `rm -rf node_modules && bun install`

### Recursos Adicionales
- [Documentación de Bun](https://bun.sh/docs)
- [Documentación de Drizzle](https://orm.drizzle.team/)
- [Documentación de Ink](https://github.com/vadimdemedes/ink)
- [Documentación de Zustand](https://zustand-demo.pmnd.rs/)