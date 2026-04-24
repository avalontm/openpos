# Cómo Encontrar y Configurar Componentes en Jira

## ¿Dónde están los Componentes en Jira?

Los componentes en Jira pueden estar en diferentes lugares dependiendo de tu versión de Jira y configuración. Aquí te explico todas las formas de acceder a ellos.

## Método 1: Project Settings (Más común)

1. Abre tu **Proyecto OPENPOS**
2. En la esquina inferior izquierda, haz click en **Project Settings** (rueda engranaje)
3. En el menú lateral izquierdo, busca **Components**
4. Si no lo ves, intenta:
   - Hacer scroll hacia abajo en el menú
   - Usar la barra de búsqueda dentro de Project Settings

## Método 2: URL Directa

Si el método anterior no funciona, puedes acceder directamente por URL:

```
https://tuempresa.atlassian.net/projects/[CLAVE_DEL_PROYECTO]/components
```

Por ejemplo, si tu proyecto es "OPS":
```
https://tuempresa.atlassian.net/projects/OPS/components
```

## Método 3: Desde la Vista del Proyecto

1. Ve a tu **Proyecto OPENPOS**
2. En el menú lateral izquierdo, busca la sección **Project settings**
3. Dentro de ahí, busca **Components**

## ¿Qué hacer si no encuentras Components?

### Opción A: Verificar Permisos
- Asegúrate de tener permisos de **Project Admin** o **Admin**
- Si no tienes permisos, pide al administrador del proyecto que configure los componentes

### Opción B: Usar Labels como Alternativa
Si definitivamente no puedes acceder a Components, usa **Labels** que son más flexibles:

1. Ve a **Project Settings** → **Labels**
2. Crea labels para categorizar tus issues:

```
component-backend
component-frontend
component-database
component-cli
component-infrastructure
component-documentation
component-printing
```

### Opción C: Verificar Tipo de Proyecto
- Los componentes están disponibles en proyectos **Jira Software** (Scrum/Kanban)
- Si tienes un proyecto Jira Work Management, los componentes pueden llamarse diferente

## Cómo Crear Componentes

Una vez que encuentres la sección Components:

1. Haz click en **Create component**
2. Llena los campos:
   - **Name**: Nombre del componente (ej: "Backend")
   - **Description**: Descripción opcional
   - **Component Lead**: Persona responsable (opcional)
   - **Default Assignee**: Asignado por defecto (opcional)

3. Haz click en **Create**

## Componentes Recomendados para OPENPOS

```
Backend - Lógica del servidor, APIs, base de datos
Frontend - Interfaz de usuario, React components
Database - Esquemas, migraciones, queries
CLI - Comandos de terminal, scripts
Infrastructure - Docker, CI/CD, deployment
Documentation - README, guías, documentación técnica
Printing - Drivers de impresora, tickets
```

## Troubleshooting

### "Components" no aparece en ningún lado
- Verifica que estás en un proyecto Jira Software
- Confirma que tienes permisos de administrador
- Intenta refrescar la página o usar otra navegador

### No puedo crear componentes
- Verifica permisos de Project Admin
- Si es un proyecto compartido, pide al owner que los cree

### Los componentes no se aplican a issues
- Al crear un issue, el campo "Component" debería aparecer
- Si no aparece, ve a Project Settings → Issue Types y asigna el campo Component a los tipos de issue deseados

## Alternativa: Usar Labels

Si los componentes no funcionan en tu setup, configura labels equivalentes:

```bash
# En Project Settings → Labels
component-backend
component-frontend
component-database
component-cli
component-infrastructure
component-documentation
component-printing
```

Los labels son más flexibles y puedes usarlos en filtros y reportes de la misma manera.