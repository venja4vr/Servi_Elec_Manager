# MER — Servi Elec Manager

Última actualización: **2026-06-16**  
Migraciones incluidas: **01 a 24**  
Tablas: **12**

---

## Archivos incluidos

| Archivo | Formato | Herramienta destino |
|---|---|---|
| `mer.dbml` | DBML | dbdiagram.io |
| `mer.mmd` | Mermaid | mermaid.live, GitHub, Notion |
| `mer.sql` | SQL DDL | pgModeler, DBeaver, psql |

---

## Cómo visualizar el diagrama

### Opción 1 — DBML en dbdiagram.io (recomendada)

1. Abrir [https://dbdiagram.io/d](https://dbdiagram.io/d) (gratis, sin registro)
2. Borrar el contenido de ejemplo
3. Copiar y pegar el contenido de `mer.dbml`
4. El diagrama se genera automáticamente con las relaciones y colores
5. Exportar como PNG, PDF o SVG desde el menú superior derecho

### Opción 2 — Mermaid en mermaid.live

1. Abrir [https://mermaid.live](https://mermaid.live)
2. Reemplazar el contenido del editor con `mer.mmd`
3. El diagrama aparece en el panel derecho en tiempo real
4. Exportar como SVG o PNG desde el botón "Download"

**También se puede incrustar directamente en GitHub** creando un bloque de código con ` ```mermaid ` — GitHub renderiza diagramas Mermaid nativamente.

### Opción 3 — SQL en DBeaver / pgModeler

**DBeaver:**
1. Conectarse a la base de datos PostgreSQL de producción
2. En el explorador, clic derecho en el schema → "ER Diagram"
3. DBeaver genera el diagrama desde la BD real

**pgModeler:**
1. File → Import → Database Model
2. Conectar a la BD PostgreSQL y el modelo se importa automáticamente

**Desde el archivo SQL:**
1. File → Import → SQL Script (`mer.sql`)
2. pgModeler parsea el DDL y genera el diagrama visual

---

## Tablas (12 en total)

| # | Tabla | Descripción |
|---|---|---|
| 1 | `usuario` | Usuarios del sistema (S=SuperAdmin, A=Admin) |
| 2 | `categoria` | Categorías de materiales de inventario |
| 3 | `material` | Inventario de materiales eléctricos |
| 4 | `material_precio_historico` | Historial de precios scrapeados (Sodimac, Easy) |
| 5 | `categoria_plantilla` | Categorías dinámicas para el menú del chatbot |
| 6 | `plantilla` | Plantillas de servicio (trabajos estándar) |
| 7 | `plantilla_material` | Puente N:N — qué materiales requiere cada plantilla |
| 8 | `comuna_grupo` | Zonas de distancia para cálculo de bencina |
| 9 | `proyecto` | Proyectos/trabajos (manual o desde chatbot) |
| 10 | `proyecto_material` | Materiales planeados por proyecto |
| 11 | `movimiento` | Registro de entradas/salidas de stock |
| 12 | `notificacion` | Notificaciones in-app para usuarios |

---

## Diagrama de dependencias (orden de creación)

```
usuario
categoria
categoria_plantilla                      (independiente)
plantilla                                (independiente)
     └── plantilla_material ──► material ──► categoria
comuna_grupo
     └── proyecto ──► plantilla
              └── proyecto_material ──► material
              └── movimiento ──► material, usuario
notificacion ──► usuario
material_precio_historico ──► material
```

---

## Notas sobre inconsistencias detectadas

> Estas inconsistencias existen entre la capa Pydantic/SQLAlchemy y la BD real.
> La BD (migraciones SQL) es la fuente de verdad.

| Campo | Columna en BD | Validación Pydantic | Estado |
|---|---|---|---|
| `proyecto.nombre_proyecto` | `VARCHAR(50)` | `max_length=100` | Pydantic permite más de lo que cabe en BD |
| `material.nombre_material` | `VARCHAR(50)` | `max_length=100` | Ídem |
| `movimiento` | Sin columna `tipo` | — | CLAUDE.md menciona entrada/salida pero la BD no tiene columna `tipo`; se infiere del contexto |
| `rol` en `usuario` | `CHECK IN ('S','A','T')` | Solo 'S' y 'A' en uso | 'T' (Técnico) es un valor legacy en el CHECK, nunca se usa en producción |

Para corregir los primeros dos casos se necesita una migración `ALTER TABLE ... ALTER COLUMN ... TYPE VARCHAR(100)`.
