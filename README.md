# ICAROPOS · Dashboard personal

Seguimiento del desarrollo del proyecto, separado del POS y del panel de restaurantes. Cuatro etapas, 49 tareas, notas/evidencia, filtros y pagos manuales basados en la cotización por $37,000 MXN. Las fechas documentales y el checklist no implican aceptación ni pagos recibidos.

## Desarrollo

Node.js 22 o 24. Ejecutar desde la raíz:

```sh
npm ci
cp .env.example .env.local
npm run dev
npm test
npm run build
```

Las dos variables de `.env.example` identifican el proyecto Panel y su clave publicable. Son configuración de cliente; nunca agregar claves secretas ni `service_role`. Configurar las mismas variables en el futuro despliegue. `.env.local` está ignorado.

## Acceso privado y persistencia

Supabase Panel, organización washtogo, referencia `mpznsjnirpmhswqzymek`. Iniciar sesión con correo y contraseña. Para una cuenta nueva, usar **Crear mi cuenta**, confirmar el correo recibido y volver al dashboard para iniciar sesión. El proyecto requiere confirmación por correo. No se cambiaron configuración global, redirecciones ni plantillas de Auth. Si la confirmación redirige a otra app existente del proyecto, volver manualmente a este dashboard tras confirmar.

Solo los correos provisionados por el administrador en `ikarodb_members` tienen acceso. El registro por sí solo no autoriza. El usuario no puede añadir miembros. Las políticas usan la identidad de Auth y restringen `ikarodb_progress` al propietario. Los correos de la lista no se incluyen en este repositorio público.

Se guarda un documento validado de versión 1 por cuenta: tareas (estado y nota), pagos y número de revisión. Las escrituras se serializan y comparan la revisión para no sobrescribir avances de otro dispositivo. La app muestra errores y conserva el estado en memoria para exportarlo; tras un conflicto bloquea nuevas ediciones hasta recargar. Exportar antes de recargar cuando haya cambios pendientes. Cerrar la pestaña puede perder cambios aún no confirmados. No hay modo de edición sin conexión.

Los avances anteriores de `icaropos-project-v1` no se importan automáticamente. Exportar el JSON desde la versión anterior e importarlo explícitamente tras iniciar sesión. Importar reemplaza el avance remoto de la cuenta tras confirmación. Las notas de los respaldos pueden contener información privada; no registrar contraseñas ni claves.

## Base de datos

La migración remota `ikarodb_private_progress` ya se aplicó al proyecto Panel. `database/ikarodb_setup.sql` documenta el DDL aplicado; no volver a ejecutarlo sobre ese proyecto. Todos los nuevos objetos de la aplicación llevan `ikarodb_`, incluidas restricciones y políticas. No se alteraron tablas, datos ni políticas anteriores. Para otra base, revisar su estructura antes de aplicar este SQL y provisionar su lista de correos autorizados por un canal administrativo.

## Validación

`npm test`: cuatro pruebas originales y cuatro de persistencia remota con cliente simulado (autorización, carga, primera escritura, errores y conflicto). `npm run build`: compilación de producción.

También se verificó RLS en Panel dentro de transacciones revertidas: acceso autorizado, lectura/escritura denegada a otra identidad, escritura con revisión antigua rechazada y ausencia de permisos anónimos o de autoautorización. No quedaron filas de prueba. Pantalla de acceso comprobada en el navegador integrado. El recorrido autenticado completo con una cuenta real queda pendiente de que su dueño cree y confirme la cuenta; no se conoce ni se necesita su contraseña. Chromium automatizado no pudo arrancar por restricciones del sandbox de macOS.

No se ha desplegado en Vercel. La siguiente etapa es revisar la integración, completar el inicio de sesión con la cuenta del usuario y preparar el despliegue autorizado.
