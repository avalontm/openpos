# Agregar Tipos de Actividades en Jira - OPENPOS

## ¿Qué es un "Tipo de Actividad" (Issue Type)?

Es una **categoría de trabajo** que puedes crear en Jira. Por defecto, los proyectos Scrum vienen con:
- Epic
- Story
- Task
- Bug
- Sub-task

Pero **puedes agregar más** según tus necesidades.

---

## Dónde Agregarlo en Jira

### Ruta en Jira Cloud
```
Tu Proyecto OPENPOS
  ↓
Project Settings (rueda de engranaje)
  ↓
Issue types (izquierda)
  ↓
Add issue type (botón azul)
```

### Ruta en Jira Server/Data Center
```
Tu Proyecto OPENPOS
  ↓
Project Settings
  ↓
Issue Types (en la sección de configuración)
  ↓
Create Issue Type
```

---

## Tipos de Actividades Recomendados para OPENPOS

### Tipos por Defecto (Mantener)
```
✓ Epic          - Características grandes que abarcan sprints
✓ Story         - Historias de usuario (Como usuario, quiero...)
✓ Task          - Tareas técnicas sin usuario final directo
✓ Bug           - Defectos encontrados
✓ Sub-task      - Desglose de Story o Task
```

### Tipos Adicionales Recomendados

#### 1. Feature Request
```
Nombre: Feature Request
Descripción: Solicitud de nueva funcionalidad del cliente
Basado en: Task (o Story, según prefieras)
Cuándo usarla: Solicitudes externas que no son bugs
Ejemplos:
- "Agregar soporte para múltiples ubicaciones"
- "Agregar API REST para integración"
- "Exportar reportes a Excel"
```

#### 2. Documentation
```
Nombre: Documentation
Descripción: Tarea de documentación de código o features
Basado en: Task
Cuándo usarla: Documentación de código, guías, wikis
Ejemplos:
- "Documentar API de facturación"
- "Crear manual de usuario"
- "Actualizar README"
```

#### 3. DevOps / Infrastructure
```
Nombre: DevOps
Descripción: Tareas de infraestructura, CI/CD, deployment
Basado en: Task
Cuándo usarla: Setup de servidor, Docker, GitHub Actions, etc.
Ejemplos:
- "Configurar CI/CD en GitHub Actions"
- "Crear Dockerfile optimizado"
- "Setup de base de datos en producción"
```

#### 4. Research / Technical Spike
```
Nombre: Research
Descripción: Investigaciones técnicas antes de implementar
Basado en: Task
Cuándo usarla: Cuando necesitas investigar/evaluar una solución
Ejemplos:
- "Investigar mejores librerías de impresión térmica"
- "Evaluar alternativas a FacturAPI"
- "Spike: Rendimiento con 10k productos"
```

#### 5. Support / Incident
```
Nombre: Support
Descripción: Tickets de soporte de usuarios finales
Basado en: Bug
Cuándo usarla: Problemas reportados en producción
Ejemplos:
- "Usuario no puede imprimir tickets"
- "Facturación no envía emails"
- "Terminal se congela al buscar productos"
```

---

## Paso a Paso: Agregar un Nuevo Tipo de Actividad

### En Jira Cloud (Recomendado)

#### Opción 1: Desde Project Settings (Más fácil)

1. Abre tu proyecto OPENPOS
2. Haz clic en la **rueda de engranaje** ⚙️ en la esquina inferior izquierda
3. Selecciona **Project settings**
4. En el menú izquierdo, click **Issue types**
5. Click en botón azul **Add issue type**
6. Completa el formulario:

```
Name: Documentation
Description: Tarea de documentación de código, guías y manuales
Parent issue type: Task (o "Story" - según prefieras)
Avatar: Selecciona un icono representativo
```

7. Click **Create**

#### Opción 2: Desde la Administración de Jira (Más completo)

1. Click en tu **avatar** (esquina inferior izquierda)
2. Click **Administration**
3. Click **Organization settings** (en el panel izquierdo)
4. Click **Issue types** (bajo Jira)
5. Click **Create issue type**
6. Llenar:
   - **Name**: Documentation
   - **Type**: Standard (para trabajo normal) o Sub-task (si es sub-tarea)
   - **Description**: Tarea de documentación de código, guías y manuales
   - **Avatar**: Seleccionar icono
7. Click **Create**

---

## Configurar Qué Campos Tienen Cada Tipo

Una vez creado el tipo de actividad, puedes configurar **qué campos aparecen** cuando se crea:

### Para cada Issue Type, configurar:

1. En **Project settings** → **Issue types** → Haz clic en el tipo (ej: Documentation)
2. Click **Configure fields**
3. Aquí puedes:
   - ✓ Agregar campos (Story Points, Priority, etc.)
   - ✗ Remover campos innecesarios
   - ⭐ Marcar campos como "required"

### Ejemplo: Campos para Documentation
```
Requeridos:
✓ Summary (siempre requerido)
✓ Priority
✓ Component

Opcionales:
○ Time Estimate
○ Assignee
○ Labels
```

### Ejemplo: Campos para Support/Incident
```
Requeridos:
✓ Summary
✓ Severity (Critical, Major, Minor)
✓ Affected Version
✓ Environment (Windows, Linux, Docker)
✓ Steps to Reproduce

Opcionales:
○ Assignee
○ Epic Link
```

---

## Tabla de Tipos Recomendados para OPENPOS

| Tipo | Basado en | Cuándo Usar | Campos Clave |
|------|-----------|------------|--------------|
| Epic | Epic | Características grandes (1-2 meses) | Epic Status, Target Version |
| Story | Story | Historias de usuario | Story Points, Acceptance Criteria |
| Task | Task | Trabajo técnico | Time Estimate, Component |
| Bug | Bug | Defectos encontrados | Severity, Steps to Reproduce |
| Documentation | Task | Docs de código/user guides | Priority, Component |
| DevOps | Task | Infraestructura/CI-CD | Time Estimate, Environment |
| Research | Task | Investigaciones técnicas | Time Estimate, Research Findings |
| Support | Bug | Tickets de soporte usuario | Severity, Affected Version |
| Feature Request | Story | Solicitudes del cliente | Priority, Business Value |

---

## Diferencia: Issue Types vs Custom Fields

### Issue Types (Tipos de Actividades)
```
Son categorías PRINCIPALES de trabajo
Ejemplos:
- Story: Funcionalidad desde perspectiva de usuario
- Task: Trabajo técnico sin usuario final
- Bug: Defecto a corregir
- Documentation: Tarea de documentación

Cada tipo puede tener DIFERENTES campos
```

### Custom Fields (Campos Personalizados)
```
Son ATRIBUTOS adicionales que se agregan a los tipos
Ejemplos:
- Story Points: Solo para Story
- Severity: Solo para Bug
- Time Estimate: Para Task y Documentation
- Epic Link: Para Story, Task, Bug

Mismo campo puede usarse en varios tipos
```

### Ejemplo Visual

```
OPENPOS Project
│
├─ Issue Type: Story
│  ├─ Fields: 
│  │  ├─ Summary (always)
│  │  ├─ Story Points ← Custom Field
│  │  ├─ Business Value ← Custom Field
│  │  └─ Priority (always)
│
├─ Issue Type: Task
│  ├─ Fields:
│  │  ├─ Summary (always)
│  │  ├─ Time Estimate ← Custom Field
│  │  └─ Component ← Custom Field
│
└─ Issue Type: Documentation (NEW)
   ├─ Fields:
   │  ├─ Summary (always)
   │  ├─ Time Estimate ← Custom Field
   │  ├─ Component ← Custom Field
   │  └─ Priority (always)
```

---

## Checklist: Setup Completo de Issue Types

### Crear Tipos
- [ ] Mantener: Epic, Story, Task, Bug, Sub-task
- [ ] Agregar: Documentation
- [ ] Agregar: DevOps
- [ ] Agregar: Research
- [ ] Agregar: Support
- [ ] Agregar: Feature Request (opcional)

### Configurar Campos por Tipo
- [ ] Story: Story Points, Business Value, Epic Link
- [ ] Task: Time Estimate, Component, Assignee
- [ ] Bug: Severity, Steps to Reproduce, Affected Version
- [ ] Documentation: Time Estimate, Component, Priority
- [ ] DevOps: Time Estimate, Environment, Component
- [ ] Research: Time Estimate, Research Findings (custom)
- [ ] Support: Severity, Affected Version, Steps to Reproduce

### Crear Custom Fields (si no existen)
- [ ] Story Points (Number, para Story)
- [ ] Business Value (Number, para Story)
- [ ] Time Estimate (Number, para Task/Documentation/DevOps/Research)
- [ ] Severity (Select, para Bug/Support)
- [ ] Component (Select, para todos)

---

## Errores Comunes

### ❌ "No puedo crear un Issue Type"
**Solución**: Verifica que tengas permisos de Admin en el proyecto. Si estás en Jira Cloud, algunos tipos pueden ser read-only.

### ❌ "Mi Issue Type no aparece en la lista de crear issue"
**Solución**: Asegúrate que el tipo esté habilitado para el esquema del proyecto.
1. Ve a Project Settings → Issue types
2. Verifica que esté en la lista
3. Si no está, click "Add to scheme"

### ❌ "Los campos no aparecen para mi nuevo tipo"
**Solución**: Configurar los campos específicamente:
1. Project Settings → Issue types → [Tu tipo]
2. Click "Configure fields"
3. Agregar los campos que quieres

### ❌ "No puedo eliminar un Issue Type"
**Solución**: Solo los tipos de Jira nativos no se pueden eliminar. Los custom sí (pero en algunas versiones solo Admin puede).

---

## Próximos Pasos

1. **Crear Issue Types básicos**: Documentation, DevOps, Support
2. **Configurar campos** para cada tipo
3. **Crear Custom Fields** necesarios
4. **Actualizar plantillas** de crear issues con los nuevos tipos
5. **Comunicar al team** cómo y cuándo usar cada tipo

---

## Recursos

- [Guía Rápida Jira](guia-rapida-jira.md) - Setup rápido
- [Configuración Jira Detallada](configuracion-jira-ejemplo.md) - Más opciones
- [Jira Cloud Docs (oficial)](https://support.atlassian.com/jira-cloud-administration/docs/configure-issue-types/) - Documentación oficial