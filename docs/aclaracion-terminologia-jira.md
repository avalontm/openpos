# Aclaración de Terminología - Jira vs Confluence

## Diferencia Importante

### En Jira (donde trabajas con issues/tareas):

```
PROYECTO (Project) = La unidad principal de trabajo
├─ Tipo: Scrum (lo que creaste) ✓
├─ Tipo: Kanban
├─ Tipo: Company-managed
└─ Tipo: Team-managed

TABLERO (Board) = La visualización del proyecto
├─ Scrum Board (lo que ves en pantalla)
│  ├─ Backlog
│  ├─ Sprint
│  └─ Board
└─ Kanban Board

ISSUE TYPES (Tipos de Actividades) = Categorías dentro del proyecto
├─ Epic
├─ Story
├─ Task
├─ Bug
└─ Sub-task (+ cualquier otro que agregues)
```

### En Confluence (documentación):

```
ESPACIO (Space) = Área de documentación
├─ Espacio OPENPOS
├─ Espacio Developers
└─ Espacio General
```

---

## Terminología Correcta para tu Caso

| Lo que dijiste | Lo que quisiste decir | Terminología correcta |
|---|---|---|
| "Creé un espacio SCRUM" | Creé un proyecto tipo Scrum | ✓ "Creé un **Proyecto** SCRUM" |
| "Entré a la configuración del espacio" | Entré a la configuración del proyecto | ✓ "Entré a **Project Settings**" |
| "En el espacio veo Epic, Story, Task, Bug" | En mi proyecto veo estos tipos | ✓ "En mi **Proyecto** veo estos **Issue Types**" |

---

## Lo que Probablemente Hiciste

```
1. ✓ Ir a Jira Dashboard
2. ✓ Click "Create Project"
3. ✓ Seleccionar template "Scrum"
   → Esto crea un PROYECTO tipo Scrum
   → No es un "espacio", es un PROYECTO
4. ✓ Se genera automáticamente un TABLERO (Board)
5. ✓ Y varias secciones: Backlog, Sprint, Issues
```

---

## Dónde Está Cada Cosa en tu Proyecto Scrum

```
Tu PROYECTO "OPENPOS"
│
├─ 📋 Backlog
│  └─ Issues sin asignar a sprint
│
├─ 🏃 Sprint Active
│  └─ Issues del sprint actual
│
├─ 📊 Board (Tablero Scrum)
│  └─ Vista visual: To Do → In Progress → Done
│
├─ ⚙️ Project Settings (CONFIGURACIÓN)
│  ├─ General
│  ├─ Issue types ← Aquí agregas nuevos tipos
│  ├─ Custom fields
│  ├─ Components
│  ├─ Screens
│  └─ Workflows
│
└─ 👥 Team & Permissions
   └─ Quién tiene acceso
```

---

## Corrección en la Documentación

Cuando digo:
- **"Proyecto"** = Me refiero al **Proyecto Scrum que creaste en Jira**
- **"Espacio"** = Sería en **Confluence** (documentación), no en Jira

---

## Para Referenciarse Correctamente:

### ✅ CORRECTO:
- "En mi **Proyecto OPENPOS**..."
- "En **Project Settings**..."
- "Los **Issue Types** del proyecto son..."
- "El **Tablero Scrum** muestra..."

### ❌ INCORRECTO:
- "En mi espacio OPENPOS..." (eso sería Confluence)
- "En la configuración del espacio..."
- "El espacio tiene estos tipos de actividades..."

---

## Resumen

Lo que creaste es:
```
✓ UN PROYECTO JIRA tipo SCRUM
  (NO es un espacio - eso es Confluence)
  
Este proyecto contiene:
- Tipos de actividades (Epic, Story, Task, Bug, Sub-task + custom)
- Un Tablero Scrum visual
- Backlog y Sprints
- Project Settings para configurar
```

---

## Referencias Correctas en Documentación

Cuando la documentación dice:
- **"tu proyecto OPENPOS"** = El Proyecto Scrum que creaste en Jira ✓
- **"Project Settings"** = La configuración del Proyecto ✓
- **"Issue types"** = Los tipos de actividades del Proyecto ✓
- **"Espacio"** = Sería documentación en Confluence (no aplicable aquí) ✗