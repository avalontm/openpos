# Sprint 1: Setup e Infraestructura - OPENPOS

## 📅 Información General

**Sprint**: Sprint 1  
**Duración**: 2 semanas (Abril 21 - Mayo 4, 2026)  
**Objetivo**: Establecer base técnica y procesos  
**Story Points Estimados**: 30-40  
**Equipo**: 3-4 desarrolladores  

## 🎯 Objetivos del Sprint

- ✅ Repositorio configurado con branch protection
- ✅ Docker puede iniciar la aplicación
- ✅ Base de datos crea tablas automáticamente
- ✅ Datos de prueba cargan correctamente
- ✅ Infraestructura de desarrollo lista

## 📋 Epics del Sprint 1

### EPIC-001: Infraestructura del Proyecto
**Estado**: Not Started  
**Target Version**: v1.0.0  

#### Tasks:
- [ ] TASK-001: Configurar repositorio Git y flujo de trabajo
- [ ] TASK-002: Documentación inicial del proyecto
- [ ] TASK-003: Setup de CI/CD
- [ ] TASK-004: Configurar Docker y docker-compose

### EPIC-002: Base de Datos Inicial
**Estado**: Not Started  
**Target Version**: v1.0.0  

#### Tasks:
- [ ] TASK-005: Crear schema de productos
- [ ] TASK-006: Crear schema de usuarios
- [ ] TASK-007: Crear schema de ventas
- [ ] TASK-008: Implementar seed de datos de prueba

## 🔧 Tareas Técnicas Detalladas

### TASK-001: Configurar repositorio Git y flujo de trabajo
**Tipo**: Task  
**Component**: Infrastructure  
**Assignee**: Developer  
**Time Estimate**: 4 horas  

**Descripción**:
- Configurar repositorio Git con estructura de branches
- Implementar branch protection rules
- Configurar Git Flow o GitHub Flow
- Crear templates para Pull Requests

**Criterios de Aceptación**:
- [ ] Repositorio creado en GitHub/GitLab
- [ ] Branch `main` protegida (requiere PR)
- [ ] Branch `develop` creada
- [ ] PR template configurado
- [ ] Code owners definidos

### TASK-002: Documentación inicial del proyecto
**Tipo**: Documentation  
**Component**: Documentation  
**Assignee**: Developer  
**Time Estimate**: 6 horas  

**Descripción**:
- Crear README.md con setup instructions
- Documentar arquitectura del proyecto
- Crear guía de contribución
- Documentar dependencias y versiones

**Criterios de Aceptación**:
- [ ] README.md completo con instrucciones
- [ ] Documentación de arquitectura
- [ ] Guía de desarrollo creada
- [ ] Dependencias documentadas

### TASK-003: Setup de CI/CD
**Tipo**: DevOps  
**Component**: Infrastructure  
**Assignee**: Developer  
**Time Estimate**: 8 horas  

**Descripción**:
- Configurar GitHub Actions o similar
- Pipeline de build y test
- Integración con Docker
- Configurar deployment básico

**Criterios de Aceptación**:
- [ ] CI pipeline ejecuta tests
- [ ] Build de Docker funciona
- [ ] Tests pasan en CI
- [ ] Badges en README

### TASK-004: Configurar Docker y docker-compose
**Tipo**: DevOps  
**Component**: Infrastructure  
**Assignee**: Developer  
**Time Estimate**: 6 horas  

**Descripción**:
- Crear Dockerfile para la aplicación
- Configurar docker-compose.yml
- Setup de base de datos en contenedor
- Configurar networking entre servicios

**Criterios de Aceptación**:
- [ ] `docker-compose up` inicia aplicación
- [ ] Base de datos accesible
- [ ] Volúmenes configurados
- [ ] Environment variables documentadas

### TASK-005: Crear schema de productos
**Tipo**: Task  
**Component**: Database  
**Assignee**: Developer  
**Time Estimate**: 4 horas  

**Descripción**:
- Definir tabla `products` con Drizzle ORM
- Campos: id, name, price, barcode, category, stock
- Crear índices para búsqueda eficiente
- Implementar validaciones

**Criterios de Aceptación**:
- [ ] Schema de productos creado
- [ ] Migraciones automáticas
- [ ] Índices optimizados
- [ ] Validaciones implementadas

### TASK-006: Crear schema de usuarios
**Tipo**: Task  
**Component**: Database  
**Assignee**: Developer  
**Time Estimate**: 3 horas  

**Descripción**:
- Definir tabla `users` con PIN hasheado
- Campos: id, name, pin_hash, role, created_at
- Implementar roles (admin, cashier)
- Configurar permisos

**Criterios de Aceptación**:
- [ ] Schema de usuarios creado
- [ ] PIN hasheado con bcrypt
- [ ] Roles definidos
- [ ] Migraciones listas

### TASK-007: Crear schema de ventas
**Tipo**: Task  
**Component**: Database  
**Assignee**: Developer  
**Time Estimate**: 5 horas  

**Descripción**:
- Definir tabla `sales` y `sale_items`
- Relaciones entre ventas y productos
- Campos: id, user_id, total, created_at, items[]
- Implementar cálculo automático de totales

**Criterios de Aceptación**:
- [ ] Schema de ventas creado
- [ ] Relaciones correctas
- [ ] Cálculos automáticos
- [ ] Migraciones funcionales

### TASK-008: Implementar seed de datos de prueba
**Tipo**: Task  
**Component**: Database  
**Assignee**: Developer  
**Time Estimate**: 4 horas  

**Descripción**:
- Crear script de seed con productos de prueba
- Crear usuarios de prueba (admin/cashier)
- Implementar comando CLI para seed
- Datos realistas para testing

**Criterios de Aceptación**:
- [ ] Script de seed creado
- [ ] Productos de prueba insertados
- [ ] Usuarios de prueba creados
- [ ] Comando `bun run seed` funciona

## 📊 Métricas del Sprint

- **Total Tasks**: 8
- **Story Points**: ~35
- **Duración**: 10 días hábiles
- **Velocity Esperada**: 30-40 SP
- **Capacidad**: 3-4 developers

## ✅ Definition of Done

- [ ] Código revisado y aprobado
- [ ] Tests unitarios pasan
- [ ] Documentación actualizada
- [ ] Demo funcional al equipo
- [ ] Merge a main branch
- [ ] Deploy a staging funciona

## 🚀 Deliverables del Sprint

1. **Repositorio configurado** con CI/CD
2. **Base de datos** con schemas iniciales
3. **Docker setup** completo
4. **Documentación** inicial lista
5. **Seed data** para testing

## 📋 Checklist Pre-Sprint

### Viernes anterior al Sprint 1:
- [ ] Repositorio creado y configurado
- [ ] Equipo tiene acceso al repo
- [ ] Docker y Node.js instalados
- [ ] Jira project creado (OPS)
- [ ] Sprint 1 creado en Jira
- [ ] Epics EPIC-001 y EPIC-002 creados

### Sprint Planning (Lunes):
- [ ] Demo de Sprint 0 (planning)
- [ ] Sprint goal: "Setup e Infraestructura"
- [ ] Tasks asignadas a developers
- [ ] Definition of Done acordada
- [ ] Dependencias identificadas

## 🔄 Flujo de Trabajo Diario

- **Daily Standup**: 9:00 AM (15 min)
- **Trabajo enfocado**: 9:15 AM - 12:00 PM
- **Almuerzo**: 12:00 PM - 1:00 PM
- **Trabajo enfocado**: 1:00 PM - 5:00 PM
- **Code Review**: 4:00 PM - 5:00 PM

## 📈 Seguimiento de Progreso

### Día 1-2: Infraestructura
- TASK-001: Git setup
- TASK-002: Documentación inicial

### Día 3-4: CI/CD y Docker
- TASK-003: CI/CD setup
- TASK-004: Docker configuration

### Día 5-7: Base de Datos
- TASK-005: Schema productos
- TASK-006: Schema usuarios
- TASK-007: Schema ventas

### Día 8-10: Seed y Testing
- TASK-008: Seed data
- Testing integración
- Code review final

## 🎯 Sprint Goal

**"Establecer una base sólida de infraestructura y base de datos que permita desarrollar las funcionalidades core del POS de manera eficiente y confiable."**

## 🚨 Riesgos Identificados

- **Riesgo**: Complejidad de Docker setup
  - **Mitigación**: Documentar paso a paso, pair programming

- **Riesgo**: Curva de aprendizaje de Drizzle ORM
  - **Mitigación**: Sesión de capacitación, ejemplos prácticos

- **Riesgo**: Configuración de CI/CD
  - **Mitigación**: Usar templates probados, documentación detallada

## 📚 Recursos y Referencias

- [Guía de Desarrollo](guia-desarrollo.md) - Setup del entorno
- [Esquema de Base de Datos](esquema-base-datos.md) - Detalles de schemas
- [Referencia de API](referencia-api.md) - Comandos CLI disponibles
- [Release Plan Completo](release-plan-ejemplo.md) - Contexto general