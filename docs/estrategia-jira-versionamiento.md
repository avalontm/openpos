# Estrategia de Conexión Jira, Versionamiento y Línea Base

Este documento reúne en un solo lugar:

- Cómo conectar tu repositorio GitHub con Jira.
- La estrategia de versionamiento y ramas para un equipo de 3 integrantes.
- El registro de cambios iniciales.
- La descripción de la línea base del sistema.

---

## 1. Cómo conectar mi repositorio a Jira

### Requisitos previos

- Tener un proyecto Jira creado (por ejemplo, `OPENPOS` o clave `OPS`).
- Tener acceso de administrador al proyecto Jira o permisos para instalar apps.
- Tener el repositorio en GitHub accesible para el equipo.

### Pasos para conectar Jira con GitHub

1. Abrir Jira y entrar al proyecto.
2. Ir a `Project settings` → `Apps & integrations`.
3. Seleccionar **GitHub** como proveedor.
4. Autorizar a Jira para que acceda a tu cuenta de GitHub.
5. Seleccionar el repositorio de `openpos`.
6. Confirmar que la integración está activa.

### Configuración recomendada

- Asegúrate de que Jira vea al menos un commit del repositorio.
- Usa la clave del issue en el mensaje de commit y en el nombre de la rama.
- Activa la sincronización para que Jira muestre commits y PRs asociados.

### Ejemplo de commit

```bash
git commit -m "feat: implementar login de cajero

- Agrega pantalla LoginScreen
- Añade validación de PIN

Closes OPS-001"
```

### Ejemplo de nombre de rama

- `feat/OPS-001-login-cajero`
- `fix/OPS-023-correccion-reportes`
- `chore/ops-setup-entorno`

### Cómo verificar la integración

- En Jira, el issue `OPS-001` debe mostrar el commit y/o PR asociado.
- En GitHub, el pull request debe contener la referencia `OPS-XXX` en el título y/o descripción.
- El panel de integración de Jira debe mostrar el repositorio con estado activo.

### Evidencias de integración Jira–repositorio

Estas son las evidencias que deberías guardar o presentar:

- Captura de pantalla de `Project settings` → `Apps & integrations` mostrando GitHub conectado.
- Un issue Jira con uno o más commits listados.
- Un pull request en GitHub que contenga la referencia al issue Jira.
- Si usas Jira Cloud, comprobar que el issue se actualiza cuando haces `Closes OPS-XXX`.

---

## 2. Estrategia de versionamiento y ramas en GitHub

### 2.1 Modelo de versionamiento

Usaremos Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- `MAJOR`: Cambios incompatibles o nueva versión mayor.
- `MINOR`: Nuevas funcionalidades hacia atrás compatible.
- `PATCH`: Correcciones de errores y ajustes pequeños.

Ejemplos:

- `v0.1.0` → primera línea base / primera versión pública.
- `v0.2.0` → nueva funcionalidad.
- `v0.2.1` → corrección menor.

### 2.2 Ramas principales

Para un equipo de 3 personas se recomienda un flujo simple y claro:

- `main`
  - Rama protegida.
  - Siempre debe contener código estable.
  - Sólo merges por Pull Requests revisados.

- `feat/<KEY>-<descripción>`
  - Para nuevas funcionalidades.
  - Ejemplo: `feat/OPS-012-login`.

- `fix/<KEY>-<descripción>`
  - Para corrección de errores.
  - Ejemplo: `fix/OPS-023-bug-cobro`.

- `chore/<descripción>`
  - Para tareas de mantenimiento, configuración e infraestructura.
  - Ejemplo: `chore/ajustar-eslint`.

- `release/<version>` (opcional)
  - Para preparar una versión.
  - Ejemplo: `release/v0.1.0`.

- `hotfix/<version>`
  - Para corrección urgente en `main`.
  - Ejemplo: `hotfix/v0.1.1`.

### 2.3 Flujo de trabajo recomendado

1. Crear issue en Jira con la descripción de la tarea.
2. Crear la rama desde `main`.
3. Trabajar localmente en la rama.
4. Hacer commits frecuentes que referencien la clave Jira.
5. Abrir Pull Request hacia `main`.
6. Revisar el PR con al menos otro integrante del equipo.
7. Mergear cuando el PR esté aprobado y pase los checks.
8. Marcar el issue Jira como `Done` o cerrar con `Closes OPS-XXX`.

### 2.4 Roles y coordinación para 3 integrantes

- Cada integrante debe revisar los PRs de los demás.
- Evitar que dos personas trabajen en la misma rama al mismo tiempo.
- Priorizar ramas cortas y tareas pequeñas para reducir conflictos.
- Usar `@equipo` o comentarios en PRs para coordinar revisiones.

### 2.5 Normas de commits y PR

- Mensajes de commit claros y cortos.
- Incluir clave de Jira en cada commit importante.
- Ejemplo de convención:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`

- En la descripción del PR:
  - Referenciar el issue Jira.
  - Explicar el alcance del cambio.
  - Añadir evidencia de pruebas si aplica.

### 2.6 Protección de rama `main`

Configurar en GitHub:

- Requerir revisión de al menos 1 o 2 compañeros.
- Requerir que el PR pase CI / lint / tests.
- No permitir `push` directo a `main`.

---

## 3. Registro de cambios iniciales

Este registro describe los componentes que constituyen la primera versión del sistema.

### Versión inicial propuesta

- `v0.1.0` – Línea base inicial.

### Cambios incluidos en el registro inicial

- Configuración inicial del repositorio `openpos`.
- Estructura de proyecto con `src/`, `modules/`, `shared/`, `db/`.
- Implementación básica de pantalla de login.
- Pantalla de punto de venta (`PosScreen`).
- Módulo de productos y grid de productos.
- Módulo de tickets y reporte de ventas.
- Configuraciones de facturación y cliente.
- Integración inicial para impresión y base de datos.
- Documentación en `docs/` y `CONTRIBUTING.md`.

### Ejemplo de changelog inicial

```markdown
# Changelog

## [0.1.0] - 2026-04-23
### Added
- Estructura base del repositorio OPENPOS.
- Interfaz de login y flujo de autenticación.
- Pantalla principal de ventas y manejo de carrito.
- Configuración de producto, tienda y facturación.
- Documentación básica de Jira y flujo de trabajo.
```

> Nota: Ajusta la fecha y los detalles con la información real de tu equipo.

---

## 4. Descripción de la línea base del sistema

### ¿Qué es la línea base?

La línea base es el punto de referencia inicial del sistema: una versión estable acordada que sirve como base para futuros cambios.

En un proyecto académico o de entrega, la línea base debe quedar documentada y etiquetada.

### Línea base propuesta para OPENPOS

- Rama base: `main`.
- Versión: `v0.1.0`.
- Estado: incluye la funcionalidad mínima viable del sistema.
- Tag sugerido: `baseline-0.1.0` o `v0.1.0`.

### Componentes incluidos en la línea base

- Frontend en `src/` y `src/modules/pos/`.
- Configuraciones de terminal y tienda en `src/modules/settings/`.
- Componentes compartidos en `src/shared/src/components/`.
- Base de datos inicial y scripts en `src/shared/db/`.
- Documentación en `docs/`.
- Configuraciones de build en `build.bat` y `package.json`.

### Cómo registrar la línea base en GitHub

```bash
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Línea base inicial OPENPOS"
git push origin v0.1.0
```

### Por qué es importante

- Permite volver a un estado conocido si hay problemas.
- Facilita comparaciones entre versiones.
- Da claridad para el equipo y el evaluador.

---

## 5. Recomendaciones finales

- Usa la clave Jira en ramas, commits y PRs.
- Mantén `main` siempre estable.
- Documenta cada lanzamiento con un changelog.
- Guarda una copia de la evidencia de integración Jira/GitHub.
- Si el equipo lo desea, pueden usar `develop` como rama de integración, pero para un grupo pequeño es mejor mantener solo `main` y ramas de característica.

---

## 6. Cómo entregar este documento

Incluye este archivo en la carpeta `docs/` de tu repositorio y agrega su ruta en el índice principal si lo deseas.

- `docs/estrategia-jira-versionamiento.md`
