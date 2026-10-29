# ICAROPOS: contexto para continuar

## Qué pidió el usuario

Este repositorio `rianorussi-jpg/Ikaropos` es exclusivamente el dashboard personal de seguimiento del desarrollo. Primero dejar este dashboard listo; después continuar con el POS y el panel para los dueños, que tendrán repositorios separados todavía por conectar.

El POS será un ejecutable de Windows para restaurantes y debe permitir vender sin internet. Actualmente cada restaurante tiene su propio Supabase. Se propuso conservar esas bases, un registro central de negocios y SQLite local con sincronización para el POS; son propuestas pendientes de implementación y validación, no características terminadas.

## Dashboard actual

JavaScript con Vite, interfaz en español, responsive, cuatro etapas y 49 tareas. Checklist, estados, notas/evidencia, búsqueda/filtros, porcentajes por tareas, pagos manuales separados y respaldo JSON. Persiste solamente en localStorage. Todas las tareas y pagos comienzan pendientes. No hay autenticación, Supabase ni despliegue web implementados.

Comandos desde la raíz: `npm ci`, `npm run dev`, `npm test`, `npm run build`.

Se verificaron compilación, cuatro pruebas de datos/respaldos y pruebas con Chromium de casillas, persistencia, notas, filtros, etapas, pagos, exportación/importación y ancho móvil. Las herramientas temporales de prueba del navegador no forman parte del repositorio.

## Fuente del alcance

PDF aportado: `CotizacionICAROPOS 2.pdf`, propuesta Enla. No se añadió el PDF al repositorio. Sus requisitos están desglosados en `src/data.js` y resumidos en README y la sección Alcance de la app.

- 7 oct 2026: arquitectura/base operativa, $10,000 MXN.
- 22 oct 2026: venta/atención, $9,000 MXN.
- 6 nov 2026: administración/inventarios/recetas/costeo, $9,000 MXN.
- 21 nov 2026: integración/pruebas/entrega, $9,000 MXN.

Total $37,000 MXN. Las fechas son documentales; no confirman avance ni pagos. Windows y venta offline son requisitos de la conversación etiquetados como adicionales.

## Próximo objetivo: Supabase y acceso privado

El usuario autorizó conectar el dashboard al proyecto llamado **panel**, en **washtogo**. Es una base existente que usa para otras cosas.

**Todos los objetos nuevos del dashboard deben llevar el prefijo `ikarodb_`. Conservar los objetos y datos existentes. Primero inspeccionar la estructura en modo de solo lectura antes de diseñar o aplicar migraciones.** No asumir referencias de proyecto, esquemas, tablas ni permisos sin consultar.

Se necesita persistencia remota de tareas, notas y pagos, inicio de sesión privado y políticas RLS restringidas a usuarios autorizados. No introducir claves administrativas en el cliente. Evitar alterar globalmente la configuración de Auth que puedan usar otras aplicaciones sin evaluar el impacto.

El usuario instaló y conectó el plugin Supabase y mostró una captura que lo confirma. En este chat no se expusieron sus herramientas ni habilidades, incluso después de etiquetarlo; por eso **no se consultó ni modificó Supabase**. En el nuevo chat, descubrir sus herramientas y leer las habilidades de Supabase disponibles antes de trabajar. No solicitar credenciales mientras exista una integración utilizable.

Después de acceso privado y persistencia: desplegar en Vercel, conectado al repositorio. El usuario quiere una URL para verlo desde su Mac. Aún no existe despliegue ni enlace. No confundir publicar el entorno de Codex con desplegar la aplicación.

## Entorno y autorizaciones

El usuario publicó previamente el entorno de Codex y pidió no reaplicar configuraciones anteriores ni publicar el entorno por cuenta del agente. Esta petición de subir el proyecto a GitHub sí autoriza el commit y push del dashboard y de este contexto. No implica publicar el entorno ni desplegar una web pública.

Usar el checkout existente: cada tarea de nube ya está aislada; no crear worktrees salvo petición explícita. No hay secretos en este repositorio; `.env` y sus variantes están ignorados.

## Actualización: integración de Supabase (29 oct 2026)

Se leyó este contexto y se inspeccionó Panel de washtogo con el plugin Supabase. Referencia confirmada: `mpznsjnirpmhswqzymek`. Tablas existentes en public: businesses, products, orders, order_items, confirmaciones, admin_usuarios; todas con RLS. Se conservaron sin cambios.

Se aplicó la migración remota `ikarodb_private_progress`: tablas `ikarodb_members` (lista administrativa de correos autorizados) e `ikarodb_progress` (documento de avance por usuario, revisión para concurrencia). Restricciones, políticas y objetos nuevos llevan `ikarodb_`. El correo indicado por el usuario quedó autorizado; no se publica aquí. No se creó una cuenta Auth ni se enviaron mensajes. Su dueño deberá crearla y confirmar el correo mediante la nueva pantalla. Auth global sigue intacto; permite registro por email y exige confirmación.

El código ahora usa supabase-js fijado en package-lock, inicio de sesión/registro, acceso por RLS, guardado serializado y revisión optimista, errores visibles, exportación/importación explícita. No mezcla automáticamente datos locales anteriores. Consultar README para configuración, limitaciones y validación. Falta completar el acceso con la cuenta real del usuario y desplegar en Vercel; no se ha publicado el entorno ni desplegado la web.
