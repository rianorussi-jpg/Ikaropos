# ICAROPOS · Dashboard de seguimiento

Dashboard privado de desarrollo (interfaz en español) construido con JavaScript y Vite. Este repositorio contiene el seguimiento del proyecto, no el POS ni el panel de los restaurantes.

## Desarrollo

Requiere Node.js 22 o 24 y npm. Desde `/workspace/Ikaropos` (o la raíz del checkout):

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

El entorno de cada tarea ya está aislado: usar el checkout existente, sin crear worktrees salvo petición explícita.

## Funcionalidad

- Cuatro etapas tomadas de `CotizacionICAROPOS 2.pdf` (Enla), con fechas documentales y pagos por $37,000 MXN.
- Checklist, estados pendiente/en curso/bloqueada/completada, notas y evidencia por tarea.
- Porcentaje calculado por tareas completadas, con igual peso; no representa horas ni aceptación contractual.
- Búsqueda y filtro de estado. Registro manual de pagos separado de la entrega técnica.
- Requisitos adicionales de la conversación identificados: Windows, Supabase por negocio y venta sin internet.
- Guardado local por navegador; exportación e importación JSON con validación y confirmación de reemplazo.
- Todas las tareas y pagos comienzan pendientes. El plan no implica funcionalidades implementadas.

## Persistencia y siguiente paso

No hay base de datos, autenticación ni sincronización remota en esta versión. El guardado usa `localStorage`; borrar los datos del navegador elimina el avance. Exportar respaldos periódicamente. Los respaldos contienen las notas: no incluir credenciales ni datos sensibles. Si el navegador impide guardar, la interfaz lo avisa.

Para seguimiento desde varios dispositivos, el siguiente paso recomendado es un proyecto Supabase exclusivo del dashboard, con Supabase Auth, acceso restringido a usuarios autorizados y RLS. Entidades: proyecto, etapas, tareas, notas/evidencias, pagos y registro de cambios. El estado remoto debe prevalecer tras autenticación y las actualizaciones deben gestionar conflictos. Nunca incluir claves administrativas en el cliente. Esta conexión aún no está implementada ni verificada y no depende de las bases operativas de los restaurantes.

El inicio offline del POS y su sincronización pertenecen al futuro repositorio del POS; este dashboard únicamente les da seguimiento.

## Origen del alcance

El PDF es una cotización del POS, no un diseño del dashboard. Sus cuatro entregables se desglosaron en `src/data.js`. Fechas: 7 y 22 de octubre, 6 y 21 de noviembre de 2026. Los acuerdos de conversación están etiquetados por separado. No se agregaron supuestos de pagos recibidos, avance previo o integraciones externas terminadas.

No se ha desplegado la web. El contexto para continuar está en `CONTEXTO.md`. Un despliegue público de esta versión no tendrá protección de acceso.
