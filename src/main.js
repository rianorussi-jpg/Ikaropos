import './style.css';
import {phases,tasks,statuses,progress,validateBackup} from './data.js';
import {client,loadRemote,writeRemote} from './remote.js';
let state={version:1,tasks:{},payments:{}},user=null,revision=null;
let saving=false,syncError='',pending=null,sessionEpoch=0;
const legacyKey='icaropos-project-v1';
let phase='base',view='overview',search='',filter='all';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const date=s=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const taskState=t=>state.tasks[t.id]||{status:'pending',note:''};
function save(){
 pending=structuredClone(state);
 updateSave();
 void flush();
}
async function flush(){
 if(saving||syncError||!user)return;
 saving=true; const epoch=sessionEpoch,uid=user.id;
 try{
  while(pending){
   const next=pending;pending=null;
   const nextRevision=await writeRemote(uid,next,revision);
   if(epoch!==sessionEpoch)return;
   revision=nextRevision;
  }
 }catch(error){if(epoch===sessionEpoch){pending=structuredClone(state);syncError=error.message||'No se pudo sincronizar.';}}
 finally{if(epoch===sessionEpoch){saving=false;updateSave();if(syncError)render();}}
}
function updateSave(){const el=document.querySelector('#save-status');if(el)el.textContent=syncError?'Sin guardar: '+syncError:saving||pending?'Guardando en Supabase…':'Guardado en Supabase';}
function render(){
 const completed=tasks.filter(t=>taskState(t).status==='done').length,blocked=tasks.filter(t=>taskState(t).status==='blocked').length,active=tasks.filter(t=>taskState(t).status==='active').length;
 document.querySelector('#app').innerHTML=`
 <aside class="sidebar"><a class="brand" href="#"><span class="brand-icon">i.</span>ICAROPOS<span class="brand-dot"></span></a><div class="workspace-label">ESPACIO DE DESARROLLO</div><div class="project"><span class="project-icon">I</span><div>ICAROPOS<small>Plataforma para restaurantes</small></div></div><div class="nav-label">PROYECTO</div><button class="nav ${view==='overview'?'selected':''}" data-view="overview">◫ <span>Vista general</span></button><button class="nav ${view==='roadmap'?'selected':''}" data-view="roadmap">≡ <span>Etapas y tareas</span><b>${tasks.length}</b></button><button class="nav ${view==='payments'?'selected':''}" data-view="payments">＄ <span>Inversión y pagos</span></button><button class="nav ${view==='scope'?'selected':''}" data-view="scope">▤ <span>Alcance y acuerdos</span></button><div class="sidebar-bottom"><span class="live-dot"></span> Seguimiento del proyecto<small>Desarrollado por Enla</small></div></aside>
 <div class="layout"><header><span>Workspace <span class="crumb">/</span> <strong>ICAROPOS</strong></span><div class="header-right"><span class="local-badge">● Supabase · acceso privado</span><button id="reload" class="button">Recargar</button><button id="logout" class="button">Cerrar sesión</button></div></header><main>
 <div class="page-heading"><div><div class="eyebrow">CONTROL DEL PROYECTO</div><h1>${{overview:'Cada etapa, un paso adelante.',roadmap:'El plan, tarea por tarea.',payments:'Inversión y entregables.',scope:'Un alcance claro desde el inicio.'}[view]}</h1><p>Una visión clara del desarrollo de tu plataforma para restaurantes.</p></div><div class="actions"><button id="import" class="button">↑ Importar</button><button id="export" class="button primary">↓ Exportar avance</button><input id="file" type="file" accept="application/json,.json" hidden></div></div>
 <div class="notice"><span>◉</span><div><strong>Tu centro de seguimiento</strong> Marca tareas, registra evidencia y consulta el avance real. <span id="save-status"></span>.</div></div>
 ${view==='overview'?`<section class="stats"><article><span>Avance general</span><strong>${progress(tasks,state.tasks)}<small>%</small></strong><div class="bar"><i style="width:${progress(tasks,state.tasks)}%"></i></div><small>${completed} de ${tasks.length} tareas completadas</small></article><article><span>Trabajo en movimiento</span><strong>${active.toString().padStart(2,'0')}<small class="stat-icon">↗</small></strong><small>Tareas en curso <b>· ${blocked} bloqueadas</b></small></article><article><span>Inversión del proyecto</span><strong>${money(37000)}<small> MXN</small></strong><small>4 parcialidades vinculadas a entregables</small></article><article><span>Entrega según cotización</span><strong class="date-stat">21 nov <small>2026</small></strong><small>Fecha documental · sujeta a seguimiento</small></article></section>`:''}
 ${['overview','roadmap'].includes(view)?`<section class="section-heading"><div><h2>Ruta de desarrollo <span>4 ETAPAS</span></h2><p>Del diseño de la arquitectura a una versión lista para entregar.</p></div><span class="muted">Cotización ICAROPOS · Enla</span></section><div class="phase-grid">${phases.map(p=>{const pt=p.groups.flatMap(g=>g.tasks),pr=progress(pt,state.tasks);return `<button class="phase-card ${phase===p.id?'current':''}" data-phase="${p.id}"><div class="phase-top"><span class="number">${p.number}</span><span class="pill ${pr===100?'done':''}">${pr===100?'Completada':pt.some(t=>['active','done','blocked'].includes(taskState(t).status))?'En desarrollo':'Por iniciar'}</span></div><h3>${p.name}</h3><p>${p.description}</p><div class="phase-progress"><b>${pr}%</b><span>${pt.filter(t=>taskState(t).status==='done').length}/${pt.length} tareas</span></div><div class="bar"><i style="width:${pr}%"></i></div><div class="phase-footer"><span>◷ ${date(p.date)}</span><b>${money(p.amount)}</b></div></button>`}).join('')}</div>${taskPanel()}`:''}
 ${view==='payments'?`<section class="panel"><div class="panel-heading"><div><h2>Plan de pagos</h2><p>Registro manual. Una tarea terminada no confirma un pago.</p></div><span class="pill">${money(phases.filter(p=>state.payments[p.id]).reduce((a,p)=>a+p.amount,0))} registrados</span></div><div class="payments">${phases.map(p=>`<article><span class="number">${p.number}</span><div><h3>${p.name}</h3><p>${date(p.date)} · Fecha de la cotización</p></div><strong>${money(p.amount)}</strong><label><input type="checkbox" data-payment="${p.id}" ${state.payments[p.id]?'checked':''}> Pago recibido</label></article>`).join('')}</div></section>`:''}
 ${view==='scope'?`<section class="scope-grid"><article class="panel prose"><div class="eyebrow">DOCUMENTO DE REFERENCIA</div><h2>CotizacionICAROPOS 2.pdf</h2><p>Propuesta de desarrollo de Enla. Inversión: $37,000 MXN en cuatro parcialidades. Inicio: 7 oct 2026. Entrega: 21 nov 2026.</p><h3>Incluido en la propuesta</h3><p>Ventas, mesas, pedidos, caja, productos, usuarios y permisos, reportes, restaurantes y sucursales, inventarios, almacenes, traspasos, recetas, subrecetas y costeo dinámico. Configuración de tickets, comandas, impresoras y estaciones compatibles.</p><h3>Límites del alcance</h3><p>Equipos y periféricos se cotizan aparte. Servicios de terceros, nube, bases de datos, mensajería, pasarelas, dominios, licencias y comisiones no están incluidos salvo acuerdo expreso. Nuevas integraciones pueden requerir una ampliación; la propuesta incluye preparación de arquitectura para canales externos.</p></article><article class="panel prose"><div class="eyebrow">ACUERDOS DE ESTA CONVERSACIÓN</div><h2>Decisiones adicionales</h2><p>POS para Windows, continuidad de venta sin internet y conexión con el Supabase correspondiente al negocio del usuario.</p><p>SQLite local y un registro central de negocios son propuestas de arquitectura pendientes de implementación y validación. La operación entre varias cajas durante un corte requiere definir comunicación por red local.</p><h3>Cómo leer el avance</h3><p>Cada tarea pesa igual. El porcentaje representa checklist completado, no horas consumidas ni aceptación contractual. Las tareas adicionales están identificadas. Las notas permiten registrar pruebas, enlaces y bloqueos.</p><h3>Datos y privacidad</h3><p>El avance se guarda en Supabase con acceso privado por cuenta autorizada. Espera la confirmación de guardado antes de cerrar. Exporta respaldos y no registres contraseñas o claves. Los avances locales previos se importan manualmente.</p></article></section>`:''}
 <footer><span>ICAROPOS <b>·</b> Control de desarrollo</span><span>Progreso basado en tareas, no en estimaciones.</span></footer></main></div><div id="toast" role="status" aria-live="polite"></div>`;
 bind();updateSave();
 if(syncError)document.querySelectorAll("[data-check],[data-status],[data-note],[data-payment],#import").forEach(el=>el.disabled=true);
}
function taskPanel(){const p=phases.find(p=>p.id===phase);return `<section class="panel" id="task-panel"><div class="panel-heading"><div><div class="eyebrow">ETAPA ${p.number}</div><h2>${p.name}</h2><p>Completa cada tarea cuando su resultado esté verificado.</p></div><span class="pill">${progress(p.groups.flatMap(g=>g.tasks),state.tasks)}% completado</span></div><div class="filters"><label class="search">⌕ <input id="search" aria-label="Buscar tareas" placeholder="Buscar una tarea…" value="${esc(search)}"></label><select id="filter" aria-label="Filtrar por estado"><option value="all">Todos los estados</option>${Object.entries(statuses).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></div><div id="task-list">${taskRows(p)}</div></section>`;}
function taskRows(p){let count=0;const html=p.groups.map(g=>{const selected=g.tasks.filter(t=>(filter==='all'||taskState(t).status===filter)&&t.title.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));count+=selected.length;return selected.length?`<div class="task-group"><h3>${g.name}<span>${selected.length}</span></h3>${selected.map(t=>{const s=taskState(t);return `<div class="task-row ${s.status==='done'?'completed':''}"><input class="task-check" type="checkbox" data-check="${t.id}" aria-label="Completar: ${esc(t.title)}" ${s.status==='done'?'checked':''}><div class="task-body"><span class="task-title">${esc(t.title)}</span>${t.additional?'<span class="additional">Adicional acordado</span>':''}<details ${s.note?'open':''}><summary>Notas y evidencia${s.note?' · con registro':''}</summary><textarea data-note="${t.id}" maxlength="10000" aria-label="Notas: ${esc(t.title)}" placeholder="Resultado verificado, enlace a prueba o motivo del bloqueo…">${esc(s.note)}</textarea></details></div><select class="status-select ${s.status}" data-status="${t.id}" aria-label="Estado: ${esc(t.title)}">${Object.entries(statuses).map(([v,l])=>`<option value="${v}" ${s.status===v?'selected':''}>${l}</option>`).join('')}</select></div>`}).join('')}</div>`:''}).join('');return count?html:'<div class="empty">No hay tareas que coincidan con tu búsqueda.</div>';}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;if(!el)return;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000);}
function bind(){
 document.querySelector('#logout').onclick=async()=>{
  if((saving||pending)&&!confirm('Hay cambios sin sincronizar. Exporta un respaldo antes de salir. ¿Cerrar sesión?'))return;
  const {error}=await client.auth.signOut({scope:'local'});if(error)toast(error.message);else location.reload();
 };
 document.querySelector('#reload').onclick=()=>{if((saving||pending)&&!confirm('Hay cambios sin guardar. Exporta un respaldo antes de recargar. ¿Continuar?'))return;location.reload();};
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();});
 document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{phase=b.dataset.phase;render();});
 document.querySelector('#search')?.addEventListener('input',e=>{search=e.target.value;document.querySelector('#task-list').innerHTML=taskRows(phases.find(p=>p.id===phase));bindTasks();});
 document.querySelector('#filter')?.addEventListener('change',e=>{filter=e.target.value;render();});
 document.querySelectorAll('[data-payment]').forEach(b=>b.onchange=()=>{state.payments[b.dataset.payment]=b.checked;save();render();});
 document.querySelector('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`icaropos-avance-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.querySelector('#import').onclick=()=>document.querySelector('#file').click();
 document.querySelector('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2000000)throw new Error('El archivo es demasiado grande.');const next=validateBackup(JSON.parse(await f.text()));if(!confirm('Importar reemplazará el avance y los pagos de tu cuenta en Supabase. ¿Continuar?'))return;state=next;save();render();toast('Respaldo importado; espera la confirmación de guardado.');}catch(error){toast(error instanceof SyntaxError?'El archivo no es un JSON válido.':error.message);}e.target.value='';};bindTasks();
}
function bindTasks(){document.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{const id=b.dataset.check;state.tasks[id]={...taskState({id}),status:b.checked?'done':'pending'};save();render();});document.querySelectorAll('[data-status]').forEach(b=>b.onchange=()=>{const id=b.dataset.status;state.tasks[id]={...taskState({id}),status:b.value};save();render();});document.querySelectorAll('[data-note]').forEach(b=>b.oninput=()=>{const id=b.dataset.note;state.tasks[id]={...taskState({id}),note:b.value};save();});}
function loginScreen(message=''){
 document.querySelector('#app').innerHTML=`<main class="auth-screen"><form class="auth-card" id="login"><div class="eyebrow">ICAROPOS · ACCESO PRIVADO</div><h1>Tu centro de seguimiento</h1><p>Inicia sesión con tu cuenta autorizada.</p><label for="email">Correo</label><input id="email" type="email" autocomplete="username" required><label for="password">Contraseña</label><input id="password" type="password" autocomplete="current-password" minlength="8" required><button class="button primary" type="submit">Iniciar sesión</button><button class="button" type="button" id="signup">Crear mi cuenta</button><p id="auth-error" class="auth-error" role="alert">${esc(message)}</p></form></main>`;
 document.querySelector('#signup').onclick=async()=>{
 const email=document.querySelector('#email'),password=document.querySelector('#password');
 if(!email.reportValidity()||!password.reportValidity())return;
 const button=document.querySelector('#signup');button.disabled=true;
 try{const {data,error}=await client.auth.signUp({email:email.value.trim().toLowerCase(),password:password.value});if(error)throw error;
 if(data.session)await start(data.session);else document.querySelector('#auth-error').textContent='Revisa tu correo para confirmar la cuenta. Después vuelve aquí e inicia sesión.';
 }catch(error){document.querySelector('#auth-error').textContent=error.message;}
 finally{button.disabled=false;}
 };
 document.querySelector('#login').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;
 try{const {data,error}=await client.auth.signInWithPassword({email:document.querySelector('#email').value.trim().toLowerCase(),password:document.querySelector('#password').value});if(error)throw new Error('No fue posible iniciar sesión. Revisa tu correo y contraseña.');await start(data.session);}
 catch(error){document.querySelector('#auth-error').textContent=error.message;button.disabled=false;}
 };
}
async function start(session){
 if(!session){loginScreen();return;}
 user=session.user;
 document.querySelector('#app').innerHTML='<main class="auth-screen"><p>Cargando tu avance…</p></main>';
 try{
  const remote=await loadRemote(user.id);
  state=remote?.state||validateBackup({version:1,tasks:{},payments:{}});revision=remote?.revision??null;
  if(!remote)revision=await writeRemote(user.id,state,null);
  render();
  // No se mezcla el localStorage antiguo con una cuenta automáticamente.
  try{if(localStorage.getItem(legacyKey))toast('Hay un avance local anterior. Expórtalo desde la versión anterior e impórtalo aquí si deseas conservarlo.');}catch{}
 }catch(error){await client.auth.signOut({scope:'local'});user=null;loginScreen(error.message||'No se pudo cargar tu avance.');}
}
if(!client){document.querySelector('#app').innerHTML='<main class="auth-screen"><p>Falta configurar la conexión a Supabase. Consulta .env.example.</p></main>';}
else{
 void (async()=>{
 client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){sessionEpoch++;user=null;pending=null;state={version:1,tasks:{},payments:{}};loginScreen();}});
 const {data,error}=await client.auth.getSession();
 if(error)loginScreen('No se pudo recuperar la sesión.');else await start(data.session);
 })();
}


window.addEventListener('beforeunload',e=>{if(saving||pending){e.preventDefault();e.returnValue='';}});
