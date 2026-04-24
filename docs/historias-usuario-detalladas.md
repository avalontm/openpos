# Historias de Usuario Detalladas - OPENPOS

## Formato Estándar

```
ID: OPS-XXX
Tipo: Story
Prioridad: High/Medium/Low
Sprint: Sprint X
Estimación: X Story Points
Etiquetas: [area], [tipo]

Título: Como [rol], quiero [acción] para [beneficio]

Descripción:
[Contexto detallado del usuario]

Criterios de Aceptación:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio N

Tareas Relacionadas:
- TASK-XXX: ...
- TASK-XXX: ...

Notas Técnicas:
[Detalles de implementación]

Dependencias:
- OPS-XXX (debe completarse primero)
```

---

## Historias de Usuario Detalladas

### OPS-001: Login con PIN de 4 Dígitos

```
ID: OPS-001
Tipo: Story
Prioridad: Highest
Sprint: Sprint 2
Estimación: 5 Story Points
Etiquetas: auth, security, frontend

Título: Como usuario, quiero login con PIN de 4 dígitos para acceder al sistema

Descripción:
El usuario necesita autenticarse en el sistema con un PIN de 4 dígitos 
numéricos. Esto proporciona una barrera de seguridad básica y es apropiado 
para entornos de POS donde los usuarios pueden cambiar rápidamente.

El PIN debe ser verificado contra la base de datos. Si el PIN es incorrecto, 
el usuario debe recibir un mensaje de error claro. Después de 3 intentos 
fallidos consecutivos, la sesión debe bloquearse temporalmente.

La interfaz debe ser clara, con un campo de entrada que oculte los dígitos 
ingresados.

Criterios de Aceptación:
- [ ] LoginScreen muestra campo de entrada de PIN
- [ ] El PIN se oculta visualmente mientras se escribe (asteriscos)
- [ ] PIN se valida contra tabla de usuarios en la BD
- [ ] PIN válido permite acceso y redirige a PosScreen
- [ ] PIN inválido muestra mensaje de error: "PIN incorrecto"
- [ ] Después de 3 intentos fallidos, se bloquea por 30 segundos
- [ ] Mensaje de bloqueo: "Demasiados intentos. Intente en 30 segundos"
- [ ] Usuario inactivo se desconecta automáticamente después de 15 minutos
- [ ] El PIN se valida con hashing seguro (no en texto plano)
- [ ] Logs de intento de login se registran (incluyendo fallos)

Tareas Relacionadas:
- TASK-009: Crear tabla de usuarios con PIN hasheado
- TASK-010: Implementar validación de PIN con retry logic
- TASK-011: Crear LoginScreen component
- TASK-012: Tests unitarios para validación PIN

Notas Técnicas:
- Usar bcrypt para hash del PIN
- Store de auth con Zustand
- Mantener contador de intentos en memoria
- Auto-logout después de 15 min inactividad
- Logs a openpos.log

Dependencias:
- EPIC-002 (Base de datos) debe estar completada
- TASK-009 debe estar completada antes

Casos de Prueba:
1. PIN válido: "1234" → acceso
2. PIN inválido: "5678" → error
3. Múltiples intentos: 3 fallos → bloqueo
4. Timeout: Sin actividad 15 min → logout
5. Terminal redimensionada → UI se ajusta
```

### OPS-002: Logout y Cambio de Usuario

```
ID: OPS-002
Tipo: Story
Prioridad: High
Sprint: Sprint 2
Estimación: 2 Story Points
Etiquetas: auth, frontend

Título: Como usuario, quiero cerrar sesión para cambiar de usuario

Descripción:
El usuario debe poder cerrar su sesión de forma segura para permitir 
que otro usuario acceda con su propio PIN. La opción de logout debe 
estar fácilmente disponible en la interfaz principal.

Después de logout, el sistema debe retornar a LoginScreen limpiando 
toda la información de sesión.

Criterios de Aceptación:
- [ ] Tecla "L" en PosScreen abre confirmación de logout
- [ ] Diálogo confirma: "¿Cerrar sesión del usuario [nombre]?"
- [ ] Presionar Enter confirma logout
- [ ] Presionar Esc cancela logout
- [ ] Después de logout, se retorna a LoginScreen limpia
- [ ] Datos del carrito se descartan
- [ ] Sesión anterior se cierra completamente
- [ ] Logs registran usuario que cerró sesión

Tareas Relacionadas:
- TASK-013: Agregar handler de tecla L en PosScreen
- TASK-014: Crear Dialog de confirmación
- TASK-015: Implementar lógica de logout en store

Notas Técnicas:
- Handler de tecla global
- Limpiar store de cart y auth
- Reset de estado de modales
- Logging de audit

Dependencias:
- OPS-001 debe completarse primero
```

### OPS-003: Agregar Productos al Carrito

```
ID: OPS-003
Tipo: Story
Prioridad: Highest
Sprint: Sprint 3
Estimación: 8 Story Points
Etiquetas: sales, frontend, cart

Título: Como cajero, quiero agregar productos al carrito para construir la venta

Descripción:
El cajero necesita poder seleccionar productos del catálogo y agregarlos 
al carrito de compras. Debe poder especificar la cantidad de cada producto 
y ver el total en tiempo real.

Los productos se pueden agregar de múltiples formas:
1. Escaneando código de barras
2. Buscando por nombre o SKU
3. Navegando por categoría
4. Seleccionando de la grilla de productos

El carrito debe mostrar:
- Producto (nombre, SKU, precio unitario)
- Cantidad
- Subtotal por línea
- Total general
- Impuestos
- Total final

Criterios de Aceptación:
- [ ] ProductGrid muestra 50 productos iniciales
- [ ] Se puede buscar productos escribiendo "/" seguido de término
- [ ] Búsqueda filtra por nombre, SKU o código de barras
- [ ] Se puede navegar con flechas y Enter para seleccionar
- [ ] Seleccionar producto abre modal para ingresar cantidad
- [ ] Cantidad puede ser número decimal (ej: 0.5 kg)
- [ ] Producto se agrega al carrito con cantidad especificada
- [ ] Carrito se actualiza en tiempo real (subtotal, impuestos, total)
- [ ] Se puede modificar cantidad: tecla + para aumentar, - para disminuir
- [ ] Se puede eliminar línea: tecla D
- [ ] Carrito persiste durante la sesión
- [ ] Total incluye 16% IVA por defecto
- [ ] Se muestra cantidad de artículos en carrito

Tareas Relacionadas:
- TASK-019: Crear ProductGrid component
- TASK-020: Implementar búsqueda de productos
- TASK-021: Paginación de 50 productos
- TASK-023: Crear carrito store en Zustand
- TASK-024: Interfaz visual del carrito
- TASK-025: Modificar cantidades (inc/dec)
- TASK-026: Eliminar items del carrito

Notas Técnicas:
- Pagination.ts con offset 0, limit 50
- Store de cart con Zustand
- Búsqueda case-insensitive
- Cálculos en tiempo real
- Units fraccionarias soportadas

Dependencias:
- EPIC-002 (DB) completada
- EPIC-003 (Auth) completada
- Tabla de productos poblada con seed

Casos de Prueba:
1. Agregar 1 producto: subtotal correcto
2. Agregar múltiples productos: total correcto
3. Producto fraccionario (0.5 kg): cantidad se respeta
4. Modificar cantidad: total se recalcula
5. Eliminar item: cart se actualiza
6. Búsqueda: solo muestra coincidencias
7. Terminal pequeña: layout se adapta
8. Sin productos: mensaje "No hay productos"
```

### OPS-004: Procesar Pago en Efectivo

```
ID: OPS-004
Tipo: Story
Prioridad: Highest
Sprint: Sprint 3
Estimación: 5 Story Points
Etiquetas: sales, frontend, payments

Título: Como cajero, quiero procesar pagos en efectivo para completar la venta

Descripción:
El cajero puede procesar un pago en efectivo una vez que ha agregado 
productos al carrito. El flujo es:

1. Presionar Enter o tecla 1 para iniciar pago
2. Se abre PayModal que muestra:
   - Subtotal
   - Impuestos (16%)
   - Total a pagar
   - Metodos de pago disponibles
3. Seleccionar "Efectivo"
4. Ingresar monto recibido
5. Sistema calcula cambio
6. Confirmar pago
7. Venta se guarda en BD
8. Se imprime ticket (si impresora configurada)
9. Carrito se limpia para nueva venta

Criterios de Aceptación:
- [ ] Tecla Enter en carrito abre PayModal
- [ ] PayModal muestra subtotal, impuestos, total correcto
- [ ] Se pueden seleccionar métodos de pago (efectivo, tarjeta, transferencia)
- [ ] Seleccionar efectivo pide monto recibido
- [ ] Cambio se calcula: monto recibido - total
- [ ] Si cambio es negativo, se muestra error "Monto insuficiente"
- [ ] Si cambio es 0, se muestra "Pago exacto"
- [ ] Confirmar pago cierra modal
- [ ] Venta se registra en tabla sales con todos los datos
- [ ] Ticket number se incrementa automáticamente
- [ ] Número de ticket se persiste en config
- [ ] Carrito se limpia después de pago
- [ ] Usuario vuelve a vista principal lista para nueva venta
- [ ] Se registra usuario que procesó la venta (createdBy)

Tareas Relacionadas:
- TASK-027: Crear PayModal component
- TASK-028: Calcular total con impuestos (16% IVA)
- TASK-029: Calcular cambio
- TASK-030: Guardar venta en BD

Notas Técnicas:
- Aritmética precisa con decimales
- Transacción de BD atomática
- Logging de ventas
- Actualizar ticketNum en config
- Serializar items como JSON

Dependencias:
- OPS-003 debe completarse primero
- EPIC-002 (DB) completada

Casos de Prueba:
1. Pago exacto: cambio 0
2. Pago con cambio: cambio > 0
3. Pago insuficiente: monto < total
4. Venta de un producto: datos correctos en BD
5. Venta de múltiples productos: total correcto
6. Venta con producto fraccionario: cantidad se respeta
7. Terminal pequeña: modal se adapta
```

### OPS-005: Facturar una Venta (CFDI)

```
ID: OPS-005
Tipo: Story
Prioridad: High
Sprint: Sprint 5
Estimación: 13 Story Points
Etiquetas: billing, frontend, integration

Título: Como cajero, quiero facturar una venta para cumplir requisitos fiscales

Descripción:
Después de procesar un pago, el cajero puede generar una factura CFDI 
(Comprobante Fiscal Digital por Internet) para el cliente. Esto es 
requerido para cumplir con regulaciones fiscales mexicanas.

El flujo es:
1. Después de pagar, se ofrece opción "¿Facturar? (S/N)"
2. Si sí, pedir RFC del cliente
3. Pedir razón social
4. Pedir email para envío
5. Buscar o crear cliente automáticamente
6. Enviar datos a FacturAPI
7. Guardar UUID de CFDI en BD
8. Enviar factura por email

Criterios de Aceptación:
- [ ] Después de pago, se pregunta "¿Facturar? (S/N)"
- [ ] Si no, venta se completa sin factura (status: completed, cfdiStatus: null)
- [ ] Si sí, solicita RFC (formato válido: AAA000000XX0)
- [ ] Valida que RFC tenga formato correcto
- [ ] Solicita razón social del cliente
- [ ] Solicita email para envío
- [ ] Busca cliente existente por RFC
- [ ] Si no existe, crea cliente nuevo automáticamente
- [ ] Se llama API de FacturAPI con datos de venta
- [ ] Si API es exitosa, se guarda UUID en sales.cfdiUuid
- [ ] Status CFDI se guarda como "issued"
- [ ] Se envía email a cliente con PDF de factura
- [ ] Se muestra mensaje de confirmación "Factura generada: UUID"
- [ ] Si API falla, se muestra error legible
- [ ] Venta se guarda aunque falle facturación (para reintento posterior)

Tareas Relacionadas:
- TASK-048: Crear BillingConfig screen
- TASK-049: Opción F en PosScreen para facturar
- TASK-050-056: Flujo de facturación
- TASK-057-060: Gestión de clientes

Notas Técnicas:
- Integración con FacturAPI
- RFC validation regex
- Email delivery async
- Retry logic para fallos de API
- Almacenar UUID en sales.cfdiUuid
- Crear clientes con código CL-XXXXX

Dependencias:
- OPS-004 debe completarse primero
- EPIC-009 (Configuración FacturAPI) completada
- API Key configurada en settings

Casos de Prueba:
1. RFC válido: factura se genera
2. RFC inválido: error y reintentar
3. Cliente nuevo: se crea automáticamente
4. Email válido: factura se envía
5. API falla: error se muestra, venta se guarda
6. UUID se persiste: puede consultarse después
```

### OPS-006: Importar Productos desde CSV

```
ID: OPS-006
Tipo: Story
Prioridad: High
Sprint: Sprint 4
Estimación: 8 Story Points
Etiquetas: inventory, backend, cli

Título: Como admin, quiero importar productos desde CSV para cargar inventario

Descripción:
El administrador puede importar un catálogo completo de productos desde 
un archivo CSV. Esto es útil para:
- Cargar inventario inicial
- Actualizar precios en lote
- Agregar nuevos productos
- Sincronizar con sistemas externos

Formato CSV:
sku,name,price,cost,category,stock,barcode,unittype,unitqty,minstock

El comando soporta:
- Importación normal (INSERT si no existe, UPDATE si existe)
- Flag --replace (UPSERT - reemplazar todo)
- Flag --dry-run (simular sin guardar)

Criterios de Aceptación:
- [ ] Comando: pos.exe import products archivo.csv
- [ ] CSV debe tener headers
- [ ] Campos requeridos: sku, name, price
- [ ] Campos opcionales se cargan si existen
- [ ] Validar que sku sea único
- [ ] Validar que barcode sea único (si se proporciona)
- [ ] Validar que price sea número válido
- [ ] Validar que stock sea número válido
- [ ] Si --replace, reemplazar productos existentes con mismo sku
- [ ] Si --dry-run, simular sin guardar cambios
- [ ] Mostrar resumen: "Importados 150 productos, actualizados 30"
- [ ] Si hay errores, mostrar línea específica
- [ ] Crear backup de BD antes de importar (opcional)

Tareas Relacionadas:
- TASK-033: Crear parser de CSV
- TASK-034: Implementar upsert de productos
- TASK-035: Validar formato CSV
- TASK-036: Soporte para --replace flag

Notas Técnicas:
- CSV parser (Papaparse o similar)
- Validación de campos
- Transacción BD (rollback si falla)
- Logging detallado
- Manejo de errores por fila

Dependencias:
- EPIC-002 (DB) completada
- Tabla de productos creada

Casos de Prueba:
1. CSV válido: importa correctamente
2. CSV con errores: muestra línea y error
3. Producto duplicado: --replace lo actualiza
4. --dry-run: no guarda cambios
5. Archivo no existe: error claro
6. Campos faltantes: usa defaults o error
```

### OPS-007: Reportes de Ventas Diarias

```
ID: OPS-007
Tipo: Story
Prioridad: High
Sprint: Sprint 7
Estimación: 8 Story Points
Etiquetas: reports, frontend, analytics

Título: Como usuario, quiero ver reportes de ventas para analizar el desempeño

Descripción:
El usuario puede acceder a reportes detallados de ventas. Los reportes 
muestran:

- Ventas por día
- Total de transacciones
- Ingresos totales
- Impuestos recolectados
- Ventas por método de pago
- Productos más vendidos
- Clientes principales (si hay facturación)

Se puede filtrar por:
- Rango de fechas
- Método de pago
- Status CFDI
- Usuario (si admin)

Criterios de Aceptación:
- [ ] Tecla R en PosScreen abre ReportsScreen
- [ ] ReportsScreen muestra reporte del día actual por defecto
- [ ] Mostrar: fecha, total transacciones, ingresos, impuestos
- [ ] Mostrar desglose por método de pago
- [ ] Mostrar productos más vendidos (top 10)
- [ ] Se puede cambiar fecha con flechas ↑↓
- [ ] Se puede cambiar rango (día/semana/mes)
- [ ] Mostrar comparativa con período anterior
- [ ] Se pueden exportar datos a CSV
- [ ] Totales están correctos (validar contra BD)
- [ ] Terminal pequeña: layout se adapta

Tareas Relacionadas:
- TASK-075: Crear ReportsScreen
- TASK-076: Reporte diario
- TASK-077: Reporte por período
- TASK-078: Filtrado por método de pago

Notas Técnicas:
- Queries SQL agregadas
- Cálculos de comparativa
- Formato de moneda
- Caché de reportes (opcional)
- Async loading

Dependencias:
- OPS-004 debe completarse primero
- Tabla de sales con datos

Casos de Prueba:
1. Reporte del día: totales correctos
2. Comparativa semana anterior: valores calculados
3. Exportar CSV: archivo válido
4. Filtro por método: solo muestra ese método
```

---

## Historias de Usuario por Sprint

### Sprint 1 & 2 - Backend
- OPS-001: Login con PIN
- OPS-002: Logout

### Sprint 3 - POS Core
- OPS-003: Agregar productos al carrito
- OPS-004: Procesar pago en efectivo

### Sprint 4 - Inventario
- OPS-006: Importar productos desde CSV

### Sprint 5 - Billing
- OPS-005: Facturar venta (CFDI)

### Sprint 7 - Reports
- OPS-007: Reportes de ventas diarias

---

## Estimación de Complejidad

| Complejidad | Story Points | Ejemplos |
|------------|-------------|----------|
| **Trivial** | 1 | Cambios de UI simples |
| **Pequeña** | 2-3 | OPS-002 (Logout) |
| **Mediana** | 5-8 | OPS-001, OPS-004 |
| **Grande** | 13 | OPS-005 (CFDI), OPS-006 |
| **Muy Grande** | 21+ | Partir en historias más pequeñas |

---

## Conversión a Jira

Para cada historia, en Jira:

1. **Crear Epic**
   - Nombre: EPIC-XXX: [Nombre]
   - Epic Status: Not Started
   - Target Version: v1.0.0

2. **Crear Stories**
   - Type: Story
   - Epic Link: EPIC-XXX
   - Story Points: [Estimación]
   - Priority: [Prioridad]
   - Labels: [etiquetas]

3. **Crear Tasks**
   - Type: Task
   - Parent: Story OPS-XXX
   - Assignee: [Developer]
   - Component: [Backend/Frontend/etc]