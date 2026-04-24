# Configuración Jira Ejemplo - OPENPOS

## Estructura del Proyecto Jira

### Clave del Proyecto
- **Key**: `OPS` (OpenPOS)
- **Nombre**: OPENPOS
- **Tipo**: Scrum
- **Lead**: (Product Manager)

---

## Tipos de Issues

### 1. Epic
**Propósito**: Agrupar múltiples features relacionadas  
**Nomenclatura**: `EPIC-XXX`  
**Ejemplos:**
- `EPIC-001: Infraestructura del Proyecto`
- `EPIC-003: Sistema de Autenticación`
- `EPIC-005: Interfaz Principal de Ventas`

### 2. Story (User Story)
**Propósito**: Funcionalidad desde perspectiva del usuario  
**Nomenclatura**: `STORY-XXX`  
**Formato**: "Como [rol], quiero [acción] para [beneficio]"  
**Ejemplos:**
```
STORY-001: Como usuario, quiero login con PIN de 4 dígitos
Criterios de aceptación:
- [ ] PIN válido permite acceso
- [ ] PIN inválido rechaza (máx 3 intentos)
- [ ] Pantalla de login es clara y usable
```

### 3. Task (Tarea Técnica)
**Propósito**: Trabajo técnico específico  
**Nomenclatura**: `TASK-XXX`  
**Ejemplos:**
- `TASK-001: Configurar repositorio Git`
- `TASK-009: Crear tabla de usuarios`
- `TASK-019: Crear ProductGrid component`

### 4. Bug
**Propósito**: Defectos encontrados  
**Nomenclatura**: `BUG-XXX`  
**Prioridades**: Critical, High, Medium, Low

### 5. Sub-task
**Propósito**: Desglose de una Story o Task  
**Nomenclatura**: Automática (OPS-xxx.1, .2, etc.)  
**Uso**: Cuando una tarea tiene múltiples pasos

---

## Campos Personalizados

### Por Issue Type

#### Epic
- **Epic Link**: Vinculación con otras épicas
- **Target Version**: `v1.0.0`
- **Epic Status**: Not Started, In Progress, Done
- **Start Date**: Fecha de inicio planeada
- **End Date**: Fecha de finalización planeada

#### Story
- **Epic Link**: EPIC-XXX (requerido)
- **Story Points**: 1-13 (Fibonacci)
- **Priority**: Highest, High, Medium, Low, Lowest
- **Business Value**: 1-100
- **Sprint**: Sprint actual

#### Task
- **Epic Link**: EPIC-XXX
- **Time Estimate**: En horas
- **Time Logged**: Horas gastadas
- **Component**: Backend, Frontend, Database, etc.

#### Bug
- **Severity**: Blocker, Critical, Major, Minor, Trivial
- **Steps to Reproduce**: Descripción detallada
- **Environment**: Windows, Linux, macOS, Docker

---

## Componentes

```
OPENPOS
├── Backend
│   ├── Autenticación
│   ├── Base de Datos
│   ├── Facturación
│   └── Servicios
├── Frontend
│   ├── Componentes UI
│   ├── Screens
│   └── Hooks
├── CLI
│   ├── Comandos
│   └── Validación
├── Infraestructura
│   ├── Docker
│   ├── CI/CD
│   └── Database
└── Documentación
    ├── User Docs
    └── Developer Docs
```

---

## Prioridades

| Prioridad | Descripción | Acción |
|-----------|-------------|--------|
| **Highest** | Bloqueador de release | Resolver inmediatamente |
| **High** | Feature/bug crítico | Resolver en sprint actual |
| **Medium** | Feature/bug importante | Resolver en próximos 2 sprints |
| **Low** | Feature/bug menor | Backlog priorizado |
| **Lowest** | Mejora/nice-to-have | Cuando hay tiempo disponible |

---

## Etiquetas (Labels)

```
Categoría:
- backend
- frontend
- database
- infrastructure
- documentation

Tipo de Trabajo:
- feature
- bugfix
- refactor
- cleanup
- testing
- performance

Área:
- auth
- sales
- inventory
- billing
- printing
- reports
- settings

Estado:
- ready-for-dev
- code-review-needed
- waiting-for-qa
- blocked
- needs-discussion
```

---

## Tablero Kanban

### Columnas
1. **Backlog** - Issues sin asignar
2. **To Do** - Listos para comenzar
3. **In Progress** - Siendo trabajados
4. **Code Review** - Esperando revisión
5. **In QA** - Testing
6. **Done** - Completados

### Reglas de Transición

```
Backlog → To Do
- [ ] Estimado (Story Points)
- [ ] Criterios de aceptación definidos
- [ ] Dependencias identificadas

To Do → In Progress
- [ ] Asignado a desarrollador
- [ ] Rama creada en Git

In Progress → Code Review
- [ ] PR creado
- [ ] Tests escritos
- [ ] Self-review completado

Code Review → In QA (o Back to In Progress)
- [ ] 2 approvals mínimo
- [ ] Build exitoso en CI

In QA → Done (o Back to In Progress)
- [ ] Tests pasados
- [ ] No bugs encontrados
```

---

## Sprints

### Calendario de Sprints (v1.0.0)

**Sprint 1**: Abril 21 - Mayo 4 (2 semanas)  
**Sprint 2**: Mayo 5 - Mayo 18 (2 semanas)  
**Sprint 3**: Mayo 19 - Junio 1 (2 semanas)  
**Sprint 4**: Junio 2 - Junio 15 (2 semanas)  
**Sprint 5**: Junio 16 - Junio 29 (2 semanas)  
**Sprint 6**: Junio 30 - Julio 13 (2 semanas)  
**Sprint 7**: Julio 14 - Julio 27 (2 semanas)  
**Sprint 8**: Julio 28 - Agosto 10 (2 semanas)  

### Capacidad por Sprint
- **Team Size**: 3-4 desarrolladores
- **Velocity Target**: 30-40 story points
- **Daily Standup**: 9:00 AM (15 min)
- **Sprint Planning**: Lunes 10:00 AM (2 horas)
- **Sprint Review**: Viernes 4:00 PM (1 hora)
- **Retrospective**: Viernes 5:00 PM (1 hora)

---

## Flujo de Trabajo Git

### Nomenclatura de Ramas

```
feature/OPS-001-descripcion-feature
bugfix/OPS-025-descripcion-bug
refactor/OPS-015-descripcion-refactor
```

### Pull Request Template

```markdown
## Relacionado
Cierra #OPS-XXX

## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Documentation

## Checklist
- [ ] Tests escritos
- [ ] Documentación actualizada
- [ ] Sin breaking changes
- [ ] Code review completado

## Screenshots (si aplica)
[Adjuntar images]
```

---

## Reportes Jira

### Burndown Chart
- **Eje X**: Días del sprint
- **Eje Y**: Story points pendientes
- **Meta**: Alcanzar 0 al final del sprint

### Velocity Chart
- Histórico de story points completados por sprint
- Objetivo: Mantener consistencia

### Cumulative Flow
- Muestra estado de issues en el tiempo
- Identifica cuellos de botella

### Release Report
- Resumen de features completadas
- Bugs fijos por versión
- Metricas de calidad

---

## Workflows Personalizados

### Story Workflow
```
To Do → In Progress → Code Review → In QA → Done
   ↓        ↓             ↓          ↓
   └────────┴─────────────┴──────────┘
              Blocked
```

### Bug Workflow
```
New → In Progress → Code Review → QA Verification → Resolved
 ↓         ↓             ↓              ↓              ↓
 └─────────┴─────────────┴──────────────┴──────────────┘
                       Reopened
```

### Task Workflow
```
To Do → In Progress → Done
  ↓         ↓
  └────────┘
  Blocked
```

---

## Criterios de Aceptación Estándar

### Para Todos los Issues

- [ ] **Cobertura de Tests**: Mínimo 80% del código nuevo
- [ ] **Documentación**: Actualizada si aplica
- [ ] **Code Style**: Sigue estándares del proyecto
- [ ] **Performance**: Sin degradación notable
- [ ] **Security**: Sin vulnerabilidades conocidas

### Para Features

- [ ] **Completitud**: Todas las stories incluidas
- [ ] **End-to-End**: Funciona de punta a punta
- [ ] **Browser/Terminal**: Compatibilidad verificada
- [ ] **Accesibilidad**: Si aplica

### Para Bugs

- [ ] **Reproducible**: Pasos claros para reproducir
- [ ] **Root Cause**: Identificada y documentada
- [ ] **Fix Verified**: Confirmado que resuelve el problema
- [ ] **Regression Tests**: Agregados para evitar recurrencia

---

## Integraciones

### GitHub
- Sincronización automática de commits
- Auto-linking: Mencionar OPS-XXX en commits cierra issues
- Branch protection rules

### Slack
- Notificaciones de cambios en issues
- Recordatorios de sprints
- Alertas de blockers

### CI/CD
- Build automático en cada PR
- Tests automáticos
- Code coverage

---

## Ejemplos de Issues

### Ejemplo 1: Story

```
Key: OPS-001
Type: Story
Title: Como usuario, quiero login con PIN de 4 dígitos
Epic: EPIC-003

Description:
El usuario necesita acceder al sistema con autenticación PIN para 
garantizar seguridad. El PIN debe ser de 4 dígitos numéricos.

Story Points: 5

Priority: High

Criterios de Aceptación:
- [ ] LoginScreen muestra campo de PIN
- [ ] PIN se valida contra tabla de usuarios
- [ ] Máximo 3 intentos fallidos antes de bloqueo
- [ ] Contraseña se oculta al escribir
- [ ] Login exitoso redirige a PosScreen
- [ ] Login fallido muestra error legible

Tareas:
- OPS-009: Crear tabla de usuarios
- OPS-010: Implementar validación de PIN
- OPS-011: Crear LoginScreen component
```

### Ejemplo 2: Task

```
Key: OPS-009
Type: Task
Title: Crear tabla de usuarios
Epic: EPIC-003

Description:
Crear la tabla de usuarios en SQLite con Drizzle ORM que incluya
campos para username, PIN hasheado, nombre, rol y estado.

Time Estimate: 4 horas

Priority: High

Component: Database

Checklist:
- [ ] Schema definido en schema.ts
- [ ] Migraciones creadas
- [ ] Índices en username
- [ ] Tests unitarios
- [ ] Seed data incluida
```

### Ejemplo 3: Bug

```
Key: OPS-256
Type: Bug
Title: Búsqueda de productos devuelve resultados duplicados
Epic: EPIC-005

Severity: High

Priority: High

Description:
Cuando se busca un producto, aparecen resultados duplicados 
en el grid. Parece que la paginación no está filtrando correctamente.

Steps to Reproduce:
1. Ir a PosScreen
2. Escribir "/" para buscar
3. Escribir "agua"
4. Ver resultados - aparecen duplicados

Expected Behavior:
Se debería mostrar cada producto una sola vez

Actual Behavior:
Se muestran algunos productos 2-3 veces

Environment:
- OS: Windows 10
- Terminal Size: 120x40
- Version: v1.0.0-beta.1

Labels: frontend, bug, searching
```

---

## Checklist Sprint Planning

- [ ] Backlog priorizado para próximas 2 semanas
- [ ] Todas las stories tienen criterios de aceptación
- [ ] Estimaciones hechas (Story Points)
- [ ] Dependencias identificadas
- [ ] Blockers comunicados
- [ ] Recursos asignados
- [ ] Sprint goal comunicado al equipo
- [ ] Capacidad vs. backlog es realista

---

## Checklist Sprint Review

- [ ] Todas las stories demostradas
- [ ] Criterios de aceptación verificados
- [ ] Feedback del stakeholder capturado
- [ ] Issues no completados movidos a backlog
- [ ] Retro planeada
- [ ] Documentación de release actualizada

---

## Checklist Sprint Retrospective

- [ ] Qué funcionó bien
- [ ] Qué no funcionó bien
- [ ] Acciones de mejora para próximo sprint
- [ ] Blockers identificados y asignados
- [ ] Team morale checado
- [ ] Ajustes de procesos propuestos