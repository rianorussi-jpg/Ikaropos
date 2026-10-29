export const phases = [
 {id:'base',number:'01',name:'Arquitectura y base operativa',date:'2026-10-07',amount:10000,description:'Los cimientos para una operación conectada y escalable.',groups:[
 ['Definición y arquitectura',['Formalización y alcance de ICAROPOS','Estructura técnica principal','Modelo de restaurantes, sucursales, cajas y usuarios','Navegación principal e interfaz general','Separación entre Operación y Administración','Configuración base del sistema']],
 ['Requisitos de la conversación',['Aplicación de escritorio e instalador para Windows','Autenticación y asignación de la base Supabase por negocio','Diseño de almacenamiento SQLite y operación sin internet','Estrategia de sincronización, conflictos y prevención de duplicados']]]},
 {id:'sales',number:'02',name:'Venta y atención',date:'2026-10-22',amount:9000,description:'Del primer pedido al cierre de una venta.',groups:[
 ['Catálogo y orden',['Venta rápida con uso táctil','Catálogo por categorías y búsqueda de productos','Carrito con cantidades y edición de la orden','Notas y modificadores','Descuentos y cálculo de totales']],
 ['Servicio y cobro',['Comer aquí, para llevar y delivery','Mesas con estados y órdenes asociadas','Pedidos y comandas durante el servicio','Cobro en efectivo y cálculo de cambio','Registro de cobros con tarjeta y transferencia']],
 ['Control de caja',['Identificar restaurante, sucursal, caja y usuario en cada operación','Movimientos e historial de caja','Preparación de cortes y consulta de actividad']]]},
 {id:'admin',number:'03',name:'Administración e inventarios',date:'2026-11-06',amount:9000,description:'Control del negocio, producción y costos en un solo lugar.',groups:[
 ['Administración',['Gestión de productos y categorías','Empleados, usuarios y permisos','Administración de restaurantes y sucursales','Vista general del negocio y reportes']],
 ['Inventario y producción',['Existencias de insumos y productos por almacén','Traspasos con origen, destino, cantidades y trazabilidad','Recetas: insumos, cantidades, unidades y rendimientos','Subrecetas y preparaciones base','Edición y sustitución de insumos y rendimientos','Costeo dinámico según precios de compra vigentes','Consulta de costos, márgenes y precios de venta','Afectación de inventario según consumo de recetas']],
 ['Tickets y cocina',['Configuración general desde el sistema','Activar y desactivar tickets y comandas','Configuración de impresoras compatibles','Configuración de estaciones de cocina','Arquitectura para recibir pedidos de canales externos']]]},
 {id:'delivery',number:'04',name:'Integración y entrega',date:'2026-11-21',amount:9000,description:'Una entrega funcional respaldada por pruebas.',groups:[
 ['Calidad y entrega',['Consolidación e integración de módulos','Pruebas de los flujos principales','Corrección de incidencias dentro del alcance','Ajustes finales de interfaz y estabilidad','Preparación de la versión funcional de entrega']],
 ['Validación adicional acordada',['Venta completa sin conexión y recuperación al reiniciar','Sincronización tras recuperar internet sin ventas duplicadas','Validación de aislamiento y permisos por restaurante','Pruebas de instalación y funcionamiento en Windows']]]}
].map(p=>({...p,groups:p.groups.map(([name,titles],gi)=>({name,tasks:titles.map((title,ti)=>({id:`${p.id}-${gi}-${ti}`,title,additional:name.includes('conversación')||name.includes('adicional')}))}))}));
export const tasks=phases.flatMap(p=>p.groups.flatMap(g=>g.tasks));
export const statuses={pending:'Pendiente',active:'En curso',blocked:'Bloqueada',done:'Completada'};
export function progress(items,state){return items.length?Math.round(items.filter(t=>state[t.id]?.status==='done').length/items.length*100):0;}
export function validateBackup(data){
 if(data?.version!==1||!data.tasks||typeof data.tasks!=='object'||Array.isArray(data.tasks)) throw new Error('El respaldo no tiene el formato esperado.');
 const result={version:1,tasks:{},payments:{}};
 for(const t of tasks){const v=data.tasks[t.id];if(!v)continue;if(!Object.hasOwn(statuses,v.status)||typeof v.note!=='string'||v.note.length>10000)throw new Error('Hay una tarea inválida en el respaldo.');result.tasks[t.id]={status:v.status,note:v.note};}
 for(const p of phases)result.payments[p.id]=data.payments?.[p.id]===true;
 return result;
}
