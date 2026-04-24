# Guía Rápida - Setup de Jira para OPENPOS

## Setup Inicial (Tiempo: ~45 minutos)

### Paso 0: IMPORTANTE - Diferencia Conceptual

Antes de empezar con los siguientes pasos, entiende la diferencia entre lo que **YA TIENES** y lo que vamos a **AGREGAR**:

```
LO QUE YA TIENES EN TU PROYECTO SCRUM:

TIPOS DE ACTIVIDADES (Issue Types) por defecto
├── Epic (YA EXISTE)
├── Story (YA EXISTE)
├── Task (YA EXISTE)
├── Bug (YA EXISTE)
└── Sub-task (YA EXISTE)

LO QUE VAMOS A AGREGAR:

NUEVOS TIPOS DE ACTIVIDADES (Issue Types)
├── Feature Request ← Nuevo
├── Documentation ← Nuevo
├── DevOps ← Nuevo
├── Research ← Nuevo
└── Support ← Nuevo

CAMPOS PERSONALIZADOS (Custom Fields) - Atributos adicionales
├── Story Points (para Story)
├── Severity (para Bug)
├── Time Estimate (para Task)
├── Component (para todos)
└── [+ otros que veremos en Paso 2]
```

### Paso 1: YA HECHO - Tu Proyecto Jira Scrum ✓

Tú ya completaste este paso:
- ✓ Creaste tu **Proyecto Scrum** OPENPOS
- ✓ Tienes el **Tablero Scrum** visible
- ✓ Ves los **Issue Types** por defecto (Epic, Story, Task, Bug, Sub-task)

**Aclaración importante de terminología**:
```
PROYECTO = La unidad de trabajo en Jira (lo que llamaste "espacio SCRUM")
TABLERO SCRUM = La visualización visual de tu Proyecto (lo que ves al abrir)
PROJECT SETTINGS = La configuración del Proyecto (rueda engranaje)
ISSUE TYPES = Los tipos de actividades (Epic, Story, etc.)
ESPACIO = Sería en Confluence (documentación), NO en Jira
```

Continúa con Paso 1.5 para agregar nuevos tipos de actividades.

### Paso 1.5: Agregar Nuevos Tipos de Actividades (5 min)

En tu **Proyecto OPENPOS** (el que ya creaste):

1. Ir a **Project Settings** (rueda engranaje abajo a la izquierda) → **Issue types**
2. Click **Add issue type**
3. Crear estos tipos adicionales recomendados:

```
✓ Epic (ya existe)
✓ Story (ya existe)  
✓ Task (ya existe)
✓ Bug (ya existe)
✓ Sub-task (ya existe)

AGREGAR ESTOS NUEVOS:
+ Feature Request (para solicitudes de clientes)
+ Documentation (para tareas de documentación)
+ DevOps (para tareas de infraestructura/CI-CD)
+ Research (para investigaciones/spikes técnicos)
+ Support (para tickets de soporte)
```

**Cómo agregar cada uno:**
1. Click **Add issue type**
2. **Name**: (ej: `Feature Request`)
3. **Description**: (ej: `Solicitud de nueva funcionalidad del cliente`)
4. **Type**: Select
   - Para Task similar → Pick `Task` like issue type
   - Para Story similar → Pick `Story` like issue type
5. Click **Create**

**Nota**: Para instrucciones detalladas, consulta [Agregar Tipos de Actividades en Jira](agregar-tipos-actividades-jira.md)

### Paso 2: Configurar Campos Personalizados (10 min)

En tu **Proyecto OPENPOS**, ir a **Project Settings** → **Custom Fields**

#### Crear campos:

```
1. "Epic Status" (Single Select)
   Options: Not Started, In Progress, Done
   
2. "Target Version" (Text)
   Default: v1.0.0
   
3. "Story Points" (Number)
   Only for Stories
   
4. "Business Value" (Number)
   Only for Stories (1-100)
   
5. "Time Estimate" (Number)
   Only for Tasks (en horas)
   
6. "Time Logged" (Number)
   For all issues
   
7. "Component" (Single Select)
   Options: Backend, Frontend, Database, CLI, Infrastructure, Documentation
   
8. "Severity" (Single Select) - solo para Bugs
   Options: Blocker, Critical, Major, Minor, Trivial
```

### Paso 3: Crear Componentes (3 min)

En tu **Proyecto OPENPOS**, ir a **Project Settings** → **Components**

**IMPORTANTE**: Si no ves "Components" en el menú lateral izquierdo, intenta:

#### Opción A: Buscar en el menú
1. En **Project Settings**, buscar "Components" en la barra de búsqueda
2. O hacer scroll hasta el final del menú lateral

#### Opción B: URL directa
1. En tu navegador, agregar `/components` a la URL de tu proyecto
2. Ejemplo: `https://tuempresa.atlassian.net/projects/OPS/components`

#### Opción C: Desde la vista del proyecto
1. Ir a tu **Proyecto OPENPOS**
2. En el menú lateral izquierdo, buscar "Components" (puede estar abajo)

**Si definitivamente no encuentras Components:**
- Puede que tu proyecto Jira no tenga habilitada esta funcionalidad
- En ese caso, puedes saltar este paso y usar Labels en su lugar
- Los Labels son más flexibles y sirven para el mismo propósito

```
OPS
├── Backend
├── Frontend
├── Database
├── CLI
├── Infrastructure
├── Documentation
└── Printing
```

### Paso 4: Crear Labels (5 min)

En tu **Proyecto OPENPOS**, ir a **Project Settings** → **Labels**

**Nota**: Si no puedes crear Components (paso anterior), usa Labels para categorizar tus issues. Los Labels son más flexibles y sirven para el mismo propósito.

```
Categoría:
- backend, frontend, database, infrastructure, documentation

Tipo de Trabajo:
- feature, bugfix, refactor, cleanup, testing, performance

Área:
- auth, sales, inventory, billing, printing, reports, settings

Estado:
- ready-for-dev, code-review-needed, waiting-for-qa, blocked, needs-discussion
```

### Paso 5: Personalizar tu Tablero Scrum (5 min)

En tu **Proyecto OPENPOS**, ir a **Project Settings** → **Board**

Verifica que tu **Tablero Scrum** tenga estas columnas (probablemente ya las tiene por defecto):
```
Backlog → To Do → In Progress → Code Review → In QA → Done
```

Si necesitas agregar o cambiar columnas, puedes hacerlo aquí.

---

## Crear Epics en tu Proyecto (Tiempo: ~45 minutos para todos)

### Estructura de Epics

En tu **Proyecto OPENPOS**, crear 21 Epics según el release plan:

```bash
# Sprint 1-2
EPIC-001: Infraestructura del Proyecto
EPIC-002: Base de Datos Inicial
EPIC-003: Sistema de Autenticación
EPIC-004: Control de Acceso (RBAC)

# Sprint 3
EPIC-005: Interfaz Principal de Ventas
EPIC-006: Procesamiento de Pagos

# Sprint 4
EPIC-007: CRUD de Productos
EPIC-008: Seguimiento de Stock

# Sprint 5
EPIC-009: Integración FacturAPI
EPIC-010: Generación de Facturas
EPIC-011: Gestión de Clientes

# Sprint 6
EPIC-012: Driver de Impresora Térmica
EPIC-013: Configuración de Impresora
EPIC-014: Impresión de Tickets

# Sprint 7
EPIC-015: Reportes de Ventas
EPIC-016: Análisis de Inventario
EPIC-017: Exportación de Datos

# Sprint 8
EPIC-018: Testing Completo
EPIC-019: Documentación
EPIC-020: Optimización y Bug Fixes
EPIC-021: Release
```

### Crear cada Epic

1. Click **Create Issue**
2. Type: **Epic**
3. Summary: `EPIC-001: Infraestructura del Proyecto`
4. Custom Fields:
   - Epic Status: Not Started
   - Target Version: v1.0.0
5. Click **Create**

---

## Crear Sprints en tu Proyecto (Tiempo: ~20 minutos)

### Configurar Sprints

En tu **Proyecto OPENPOS**, ir a **Backlog**
2. Click **Create Sprint** (8 veces)

```
Sprint 1: Abril 21 - Mayo 4 (Setup & DB)
Sprint 2: Mayo 5 - Mayo 18 (Auth)
Sprint 3: Mayo 19 - Junio 1 (Ventas)
Sprint 4: Junio 2 - Junio 15 (Inventario)
Sprint 5: Junio 16 - Junio 29 (Facturación)
Sprint 6: Junio 30 - Julio 13 (Impresora)
Sprint 7: Julio 14 - Julio 27 (Reportes)
Sprint 8: Julio 28 - Agosto 10 (QA & Release)
```

3. Para cada sprint, configurar:
   - Start Date
   - End Date
   - Goal (ej: "Setup e Infraestructura")

---

## Crear Issues en tu Proyecto

### Template para Stories

```
[Copiar y pegar en tu Proyecto OPENPOS, rellenar información]

Title: Como [rol], quiero [acción] para [beneficio]

Description:
[Contexto detallado]

Type: Story
Epic Link: [EPIC-XXX]
Sprint: [Sprint X]
Story Points: [5]
Priority: [High]
Labels: [feature, area]
Component: [Backend/Frontend/etc]
Assignee: [Developer]

Acceptance Criteria:
- [ ] Criterio 1
- [ ] Criterio 2

Related Tasks:
TASK-XXX, TASK-YYY
```

### Crear Historias Principales

Usar el archivo [historias-usuario-detalladas.md](historias-usuario-detalladas.md)

Para cada historia en tu **Proyecto OPENPOS**:
1. Click **Create Issue**
2. Copiar template
3. Rellenar campos
4. Click **Create**

**Tip**: Crear primero todas las historias de Sprint 1 y 2, luego ir por sprint

### Crear Tasks desde Historias

Después de crear cada Story:

1. Click en la Story
2. Click **Create Sub-task**
3. Type: **Sub-task**
4. Title: `[Nombre de la tarea técnica]`
5. Assignee: Developer
6. Time Estimate: [horas]
7. Component: [Backend/Frontend/etc]

---

## Configurar Automaciones (Opcional, Tiempo: ~20 min)

### Automación 1: Auto-asignar cuando mueve a In Progress

```
If: Status changed to "In Progress"
Then: Assign to the user who made the change
```

### Automación 2: Cambiar color por prioridad

```
If: Priority = Highest
Then: Label color = Red

If: Priority = High  
Then: Label color = Orange

If: Priority = Medium
Then: Label color = Yellow
```

### Automación 3: Auto-move a Code Review

```
If: Pull Request created
Then: Move issue to "Code Review"
```

---

## Integración con GitHub (Tiempo: ~15 min)

### Conectar Jira con GitHub

1. **Project Settings** → **Apps & Integrations**
2. Click **GitHub**
3. Authorize
4. Seleccionar repositorio

### Configurar Commits

En commits, referenciar issues:

```bash
git commit -m "feat: agregar login screen

- Crear componente LoginScreen
- Implementar validación PIN

Closes OPS-001"
```

Al hacer push, Jira actualiza automáticamente:
- Agrega link al commit
- Puede auto-mover a "Done" si incluye "Closes"

---

## First Sprint Setup Checklist

### Pre-Sprint (Viernes anterior)

- [ ] Sprint 1 creado en tu **Proyecto OPENPOS**
- [ ] Todas las historias de Sprint 1 creadas
- [ ] Todas las historias tienen Story Points
- [ ] Criterios de aceptación definidos
- [ ] Team ha revisado y estimado
- [ ] Dependencias identificadas

### Sprint Planning (Lunes 10:00 AM)

- [ ] Demo de Sprint 0 (setup, docs)
- [ ] Sprint goal comunicado
- [ ] Historias asignadas a developers
- [ ] Blockers identificados
- [ ] Estimado: 30-40 story points
- [ ] Pull request template comunicado
- [ ] Daily standup confirmado para 9:00 AM

### Durante Sprint

- [ ] Daily standup 9:00 AM (15 min)
- [ ] Issues movidas en tablero
- [ ] Commits referencian OPS-XXX
- [ ] PRs incluyen link a Jira
- [ ] Comentarios en Jira con updates

### Fin de Sprint (Viernes 4:00 PM)

- [ ] Sprint Review (demo)
- [ ] Feedback del stakeholder
- [ ] Retrospective
- [ ] Sprint 2 planificado

---

## Comandos CLI Útiles

### Crear Issue desde Terminal (si tienes Jira CLI)

```bash
# Login
jira login --instance <URL> --user <email>

# Crear issue
jira issue create \
  --type Story \
  --project OPS \
  --summary "Como usuario, quiero..." \
  --assignee <user> \
  --customfield "Story Points" 5

# Ver tablero
jira board list
jira board view OPS-1

# Transicionar issue
jira issue move OPS-001 --transition "To Do"
```

---

## Reportes en Jira

### Crear Dashboard

1. **Dashboards** → **Create dashboard**
2. Nombre: `OPENPOS v1.0.0 Release`
3. Agregar gadgets:

```
- Sprint Summary (actual sprint)
- Burndown Chart
- Velocity Chart
- Epic Report
- Issue Statistics
- Team Workload
```

### Reportes para Stakeholders

**Sprint Review Report** (cada viernes):
- Issues completadas
- Velocity
- Release progress %
- Blockers

---

## Acceso y Permisos

### Roles en Jira

```
Admin (PM):
- Crear/modificar epics
- Configurar sprints
- Mover issues entre sprints
- Aprobar releases

Dev (Developers):
- Crear sub-tasks
- Mover issues en tablero
- Comentar
- Time logging

QA:
- Crear bugs
- Move to QA
- Move to Done

Viewer (Stakeholders):
- Solo ver dashboard
- Solo ver board
```

---

## Troubleshooting Común

### Issue no aparece en tablero
**Solución**: Asignar a Sprint y Estado "To Do"

### Story Points no aparecen
**Solución**: Ir a Project Settings, verificar que custom field está asignado a Story type

### No se sincroniza con GitHub
**Solución**: Verificar integración en Project Settings → Apps & Integrations

### Componentes no aparecen en Project Settings
**Solución**: 
- Buscar "Components" en la barra de búsqueda de Project Settings
- O usar URL directa: `https://tuempresa.atlassian.net/projects/OPS/components`
- Si no existe, usar Labels como alternativa (más flexible)

### No puedo crear componentes
**Solución**: Verificar que tienes permisos de Admin en el proyecto. Si no, pedir al Project Admin que los cree.

---

## Quick Reference: Estados y Transiciones

```
BACKLOG → TO DO → IN PROGRESS → CODE REVIEW → IN QA → DONE
  ↑                                              ↑
  └──────────────────── BLOCKED ────────────────┘
```

- **Backlog**: Nuevo, sin asignar
- **To Do**: Listo para trabajar
- **In Progress**: Developer trabajando
- **Code Review**: PR abierto, esperando revisión
- **In QA**: Testing del QA
- **Done**: Completado y en main branch

---

## Próximos Pasos

1. **Crear proyecto Jira** (pasos 1-5)
2. **Importar epics** (21 epics totales)
3. **Crear 8 sprints** con fechas
4. **Crear historias de Sprint 1 y 2** (8-10 historias)
5. **Primera Planning Session** (Sprint 1)
6. **Compartir acceso con team**
7. **Configurar Dashboard para stakeholders**

---

## Recursos Adicionales

- [Release Plan Ejemplo](release-plan-ejemplo.md) - Detalle completo de todos los sprints
- [Agregar Tipos de Actividades en Jira](agregar-tipos-actividades-jira.md) - Guía completa para crear nuevos issue types
- [Historias de Usuario](historias-usuario-detalladas.md) - Detalles de cada historia
- [Configuración Jira Detallada](configuracion-jira-ejemplo.md) - Guía completa de campos y workflows