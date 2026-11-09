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
function updateSave(){const el=document.querySelector('#save-status');if(el){el.classList.toggle('has-error',!!syncError);el.classList.toggle('is-saving',!!(saving||pending));el.textContent=syncError?'Sin guardar: '+syncError:saving||pending?'Guardando en Supabase…':'Todo guardado';}}
const openGroups=new Map();
const phaseTasks=p=>p.groups.flatMap(g=>g.tasks);
const countStatus=(list,status)=>list.filter(t=>taskState(t).status===status).length;
const phaseLabel=p=>progress(phaseTasks(p),state.tasks)===100?'Completada':phaseTasks(p).some(t=>taskState(t).status!=='pending')?'En desarrollo':'Por iniciar';
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({overview:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',roadmap:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',payments:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20m-6 5h3"/>',scope:'<path d="M5 3h10l4 4v14H5zM9 12h6m-6 4h6"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',check:'<path d="m5 12 4 4L19 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>'})[name]||''}</svg>`;
function render(){
 const completed=countStatus(tasks,'done'),active=countStatus(tasks,'active'),blocked=countStatus(tasks,'blocked'),percent=progress(tasks,state.tasks);
 const titles={overview:['El proyecto, en perspectiva.','Lo que ya construimos y lo que sigue para ICAROPOS.'],roadmap:['Un paso a la vez.','Explora cada etapa, actualiza las tareas y consulta su evidencia.'],payments:['La inversión, clara.','Pagos registrados por separado del avance del desarrollo.'],scope:['Todos en la misma página.','El alcance y los acuerdos que guían este proyecto.']};
 document.querySelector('#app').innerHTML=`<header class="topbar"><a class="brand" href="#" aria-label="ICAROPOS · Inicio"><span class="brand-mark">i.</span><strong>ICAROPOS</strong><span class="brand-caption">Project space</span></a><div class="topbar-tools"><span class="private-badge"><i></i>Espacio privado</span><button class="button icon-button" id="reload" aria-label="Recargar avance">↻</button><button class="button" id="logout">Cerrar sesión</button></div></header>
 <div class="app-shell"><nav class="main-nav" aria-label="Navegación principal">${[['overview','Resumen'],['roadmap','Etapas y tareas'],['payments','Pagos'],['scope','Alcance']].map(([id,label])=>`<button data-view="${id}" class="nav ${view===id?'selected':''}" ${view===id?'aria-current="page"':''}>${icon(id)}${label}</button>`).join('')}<span class="save-indicator" id="save-status" role="status" aria-live="polite"></span></nav>
 <main><section class="page-heading"><div><span class="eyebrow">DESARROLLO DE SOFTWARE / ICAROPOS</span><h1>${titles[view][0]}</h1><p>${titles[view][1]}</p></div><details class="backup-menu"><summary class="button">Respaldos <span>⌄</span></summary><div><button id="export">${icon('download')}Exportar avance</button><button id="import">↑ Importar respaldo</button><input id="file" type="file" accept="application/json,.json" hidden></div></details></section>
 ${syncError?`<div class="sync-warning" role="alert"><strong>Hay cambios sin guardar.</strong> ${esc(syncError)} Exporta un respaldo antes de recargar.</div>`:''}
 ${view==='overview'?overview(percent,completed,active,blocked):''}
 ${view==='roadmap'?`<div class="phase-tabs" aria-label="Etapas del proyecto">${phases.map(p=>`<button data-phase="${p.id}" class="${p.id===phase?'selected':''}" aria-pressed="${p.id===phase}"><span>${p.number}</span><div><strong>${p.name}</strong><small>${countStatus(phaseTasks(p),'done')}/${phaseTasks(p).length} terminadas</small></div><b>${progress(phaseTasks(p),state.tasks)}%</b></button>`).join('')}</div>${taskPanel()}`:''}
 ${view==='payments'?paymentsView():''}${view==='scope'?scopeView():''}
 <footer><span><b>ICAROPOS</b> · De la idea a la operación.</span><span>El avance refleja tareas verificadas; cada tarea pesa lo mismo.</span></footer></main></div><div id="toast" role="status" aria-live="polite"></div>`;
 bind();updateSave();
 if(syncError)document.querySelectorAll('[data-check],[data-status],[data-note],[data-payment],#import').forEach(el=>el.disabled=true);
}
function overview(percent,completed,active,blocked){
 const focus=tasks.filter(t=>taskState(t).status==='blocked').concat(tasks.filter(t=>taskState(t).status==='active')).slice(0,4);
 return `<section class="project-pulse"><div class="pulse-copy"><span class="eyebrow">TU SISTEMA ESTÁ TOMANDO FORMA</span><h2>Una plataforma.<br>Cuatro grandes etapas.</h2><p>De los cimientos técnicos a una operación de restaurante lista para entregar.</p><button data-view="roadmap" class="button pulse-button">Explorar el plan ${icon('arrow')}</button></div><div class="pulse-progress"><div class="progress-ring" style="--progress:${percent}%"><div><strong>${percent}<small>%</small></strong><span>avance total</span></div></div><p>${completed} de ${tasks.length} tareas terminadas</p></div><div class="pulse-numbers"><div><strong>${active.toString().padStart(2,'0')}</strong><span>En desarrollo</span></div><div><strong>${blocked.toString().padStart(2,'0')}</strong><span>Bloqueadas</span></div><div><strong>04</strong><span>Etapas del proyecto</span></div></div></section>
 <div class="overview-grid"><section class="journey"><div class="section-heading"><div><span class="eyebrow">EL CAMINO</span><h2>Tu ruta de desarrollo</h2></div><span class="subtle">Selecciona una etapa para explorarla</span></div><div class="journey-list">${phases.map(p=>{const all=phaseTasks(p),pr=progress(all,state.tasks);return `<button class="journey-card phase-${p.id}" data-phase="${p.id}"><span class="stage-number">${p.number}</span><div class="journey-content"><div class="journey-title"><h3>${p.name}</h3><span class="pill ${pr===100?'done':pr>0?'active':'pending'}">${phaseLabel(p)}</span></div><p>${p.description}</p><div class="journey-sections">${p.groups.map(g=>`<span>${g.name}</span>`).join('')}</div><div class="journey-bottom"><div class="bar"><i style="width:${pr}%"></i></div><span>${countStatus(all,'done')} de ${all.length} tareas</span></div></div><div class="journey-end"><strong>${pr}<small>%</small></strong>${icon('arrow')}</div></button>`}).join('')}</div></section>
 <aside class="focus-panel"><span class="eyebrow">DÓNDE ESTAMOS</span><h2>En el radar</h2><p>Trabajo en curso y bloqueos que necesitan atención.</p><div class="focus-list">${focus.length?focus.map(t=>{const p=phases.find(p=>phaseTasks(p).some(x=>x.id===t.id));return `<button data-focus="${t.id}" data-focus-phase="${p.id}"><span class="focus-stage">ETAPA ${p.number}<span class="status-dot ${taskState(t).status}"></span></span><strong>${esc(t.title)}</strong><small>${statuses[taskState(t).status]} ${icon('arrow')}</small></button>`}).join(''):'<div class="empty">No hay tareas en curso o bloqueadas. Abre una etapa para elegir el siguiente paso.</div>'}</div><div class="reference-note"><span>FECHA DE LA PROPUESTA</span><strong>21 nov, 2026</strong><p>Fecha documental de entrega. No determina el avance ni confirma una entrega.</p></div></aside></div>`;
}
function taskPanel(){const p=phases.find(p=>p.id===phase),all=phaseTasks(p),pr=progress(all,state.tasks);return `<section id="task-panel" class="stage-workspace"><div class="stage-heading"><div><span class="eyebrow">ETAPA ${p.number} / ${phases.length.toString().padStart(2,'0')}</span><h2>${p.name}</h2><p>${p.description}</p></div><div class="stage-total"><strong>${pr}<small>%</small></strong><span>${countStatus(all,'done')} de ${all.length} terminadas</span></div></div><div class="stage-meta"><span>${p.groups.length} secciones</span><span>${countStatus(all,'active')} en curso</span><span>${countStatus(all,'blocked')} bloqueadas</span><span>Fecha propuesta: ${date(p.date)}</span></div><div class="filters"><label class="search">${icon('roadmap')}<input id="search" aria-label="Buscar tareas" placeholder="Buscar tareas o dentro de la evidencia…" value="${esc(search)}"></label><select id="filter" aria-label="Filtrar por estado"><option value="all">Todos los estados</option>${Object.entries(statuses).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="task-legend"><span>Tarea</span><span>Estado del desarrollo</span></div><div id="task-list">${taskRows(p)}</div><div class="stage-footnote">Marca una tarea como completada cuando su resultado esté verificado. El pago se registra por separado.</div></section>`;}
function taskRows(p){let count=0;const firstUnfinished=p.groups.findIndex(g=>progress(g.tasks,state.tasks)<100);const html=p.groups.map((g,gi)=>{const selected=g.tasks.filter(t=>(filter==='all'||taskState(t).status===filter)&&(t.title+' '+taskState(t).note).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));count+=selected.length;const key=p.id+'-'+gi,open=search||filter!=='all'||(openGroups.has(key)?openGroups.get(key):gi===(firstUnfinished<0?0:firstUnfinished));return selected.length?`<details class="task-group" data-group="${key}" ${open?'open':''}><summary><span class="section-index">${(gi+1).toString().padStart(2,'0')}</span><div><h3>${g.name}</h3><span>${countStatus(g.tasks,'done')} de ${g.tasks.length} completadas${selected.length!==g.tasks.length?` · ${selected.length} coinciden`:''}</span></div><div class="group-progress"><div class="bar"><i style="width:${progress(g.tasks,state.tasks)}%"></i></div><b>${progress(g.tasks,state.tasks)}%</b></div><span class="chevron">⌄</span></summary><div class="group-tasks">${selected.map(t=>{const s=taskState(t);return `<article class="task-row ${s.status==='done'?'completed':''}"><input class="task-check" type="checkbox" data-check="${t.id}" aria-label="Completar: ${esc(t.title)}" ${s.status==='done'?'checked':''}><div class="task-body"><label class="task-title">${esc(t.title)}</label>${t.additional?'<span class="additional">Acuerdo adicional</span>':''}<details class="evidence"><summary>${s.note?'Ver evidencia y notas':'Agregar evidencia'}${s.note?'<span class="evidence-indicator"></span>':''}</summary><label class="sr-only" for="note-${t.id}">Notas: ${esc(t.title)}</label><textarea id="note-${t.id}" data-note="${t.id}" maxlength="10000" placeholder="Resultado verificado, enlace a prueba o motivo del bloqueo…">${esc(s.note)}</textarea><small>Los cambios se guardan automáticamente.</small></details></div><select class="status-select ${s.status}" data-status="${t.id}" aria-label="Estado: ${esc(t.title)}">${Object.entries(statuses).map(([v,l])=>`<option value="${v}" ${s.status===v?'selected':''}>${l}</option>`).join('')}</select></article>`}).join('')}</div></details>`:''}).join('');return count?html:'<div class="empty"><strong>No hay coincidencias.</strong><p>Prueba otra búsqueda o cambia el filtro de estado.</p></div>';}
function paymentsView(){const paid=phases.filter(p=>state.payments[p.id]).reduce((sum,p)=>sum+p.amount,0);return `<section class="payment-summary"><div><span class="eyebrow">INVERSIÓN TOTAL</span><strong>${money(37000)}<small>MXN</small></strong></div><div><span>Pagos registrados</span><strong>${money(paid)}</strong></div><div><span>Pendiente de registrar</span><strong>${money(37000-paid)}</strong></div></section><section class="payments"><div class="section-heading"><div><h2>Una parcialidad por etapa</h2><p>Registro manual. Completar tareas no confirma un pago.</p></div></div>${phases.map(p=>`<article><span class="stage-number">${p.number}</span><div><h3>${p.name}</h3><p>${date(p.date)} · Fecha de la cotización</p><span class="subtle">Avance del desarrollo: ${progress(phaseTasks(p),state.tasks)}%</span></div><strong>${money(p.amount)}<small> MXN</small></strong><label class="payment-toggle"><input type="checkbox" data-payment="${p.id}" aria-label="Pago de etapa ${p.number}: ${p.name}" ${state.payments[p.id]?'checked':''}><span>${state.payments[p.id]?'Pago registrado':'Marcar pago recibido'}</span></label></article>`).join('')}</section>`;}
function scopeView(){return `<section class="scope-intro"><span class="eyebrow">LA BASE DEL ACUERDO</span><h2>Un sistema de restaurante.<br>De principio a fin.</h2><p>Propuesta de Enla · CotizacionICAROPOS 2.pdf · $37,000 MXN en cuatro parcialidades.</p></section><div class="scope-grid"><article class="scope-card"><span class="scope-number">01</span><h3>Lo que construimos</h3><p>Ventas, mesas, pedidos, caja, productos, usuarios, permisos y reportes. Administración de restaurantes y sucursales, inventarios, almacenes y traspasos.</p><p>Recetas, subrecetas, costeo dinámico y configuración de tickets, comandas, impresoras y estaciones compatibles.</p></article><article class="scope-card"><span class="scope-number">02</span><h3>Acuerdos de operación</h3><p>POS de escritorio para Windows, continuidad de venta sin internet y Supabase independiente por restaurante, con directorio central de negocios.</p><p>El estado implementado y sus pruebas se documentan en cada tarea. La impresión es mediante tickets; no se utiliza monitor KDS.</p></article><article class="scope-card"><span class="scope-number">03</span><h3>Lo que se cotiza aparte</h3><p>Equipos y periféricos; servicios de terceros, nube, mensajería, pasarelas, dominios, licencias y comisiones, salvo acuerdo expreso.</p><p>Las nuevas integraciones pueden requerir una ampliación. Se contempla preparación de arquitectura para canales externos.</p></article><article class="scope-card"><span class="scope-number">04</span><h3>Cómo interpretar el avance</h3><p>Todos los puntos pesan igual. El porcentaje representa tareas completadas, no horas invertidas ni aceptación contractual.</p><p>Las fechas pertenecen a la propuesta. Los pagos se registran manualmente y la evidencia explica lo verificado y lo pendiente.</p></article></div><div class="privacy-note"><strong>Tu información permanece privada.</strong><p>El avance se guarda en Supabase con acceso por cuenta autorizada. Espera la confirmación de guardado y usa Respaldos para exportar una copia. No registres contraseñas ni claves.</p></div>`;}
function toast(message){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000);}
function bind(){
 document.querySelector('#logout').onclick=async()=>{
  if((saving||pending)&&!confirm('Hay cambios sin sincronizar. Exporta un respaldo antes de salir. ¿Cerrar sesión?'))return;
  const {error}=await client.auth.signOut({scope:'local'});if(error)toast(error.message);else location.reload();
 };
 document.querySelector('#reload').onclick=()=>{if((saving||pending)&&!confirm('Hay cambios sin guardar. Exporta un respaldo antes de recargar. ¿Continuar?'))return;location.reload();};
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();window.scrollTo({top:0,behavior:'instant'});});
 document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{phase=b.dataset.phase;view='roadmap';search='';filter='all';render();window.scrollTo({top:0,behavior:'instant'});});
 document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{phase=b.dataset.focusPhase;view='roadmap';search=tasks.find(t=>t.id===b.dataset.focus).title;filter='all';render();window.scrollTo({top:0,behavior:'instant'});});
 document.querySelector('.brand').onclick=e=>{e.preventDefault();view='overview';render();window.scrollTo({top:0,behavior:'instant'});};
 document.querySelector('#search')?.addEventListener('input',e=>{search=e.target.value;document.querySelector('#task-list').innerHTML=taskRows(phases.find(p=>p.id===phase));bindTasks();});
 document.querySelector('#filter')?.addEventListener('change',e=>{filter=e.target.value;render();});
 document.querySelectorAll('[data-payment]').forEach(b=>b.onchange=()=>{state.payments[b.dataset.payment]=b.checked;save();render();});
 document.querySelector('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`icaropos-avance-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.querySelector('#import').onclick=()=>document.querySelector('#file').click();
 document.querySelector('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2000000)throw new Error('El archivo es demasiado grande.');const next=validateBackup(JSON.parse(await f.text()));if(!confirm('Importar reemplazará el avance y los pagos de tu cuenta en Supabase. ¿Continuar?'))return;state=next;save();render();toast('Respaldo importado; espera la confirmación de guardado.');}catch(error){toast(error instanceof SyntaxError?'El archivo no es un JSON válido.':error.message);}e.target.value='';};bindTasks();
}
function bindTasks(){document.querySelectorAll('[data-group]').forEach(d=>d.ontoggle=()=>openGroups.set(d.dataset.group,d.open));document.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{const id=b.dataset.check;state.tasks[id]={...taskState({id}),status:b.checked?'done':'pending'};save();render();});document.querySelectorAll('[data-status]').forEach(b=>b.onchange=()=>{const id=b.dataset.status;state.tasks[id]={...taskState({id}),status:b.value};save();render();});document.querySelectorAll('[data-note]').forEach(b=>b.oninput=()=>{const id=b.dataset.note;state.tasks[id]={...taskState({id}),note:b.value};save();});}
function loginScreen(message=''){
 document.querySelector('#app').innerHTML=`<main class="auth-screen"><section class="auth-story"><span class="brand"><span class="brand-mark">i.</span><strong>ICAROPOS</strong></span><div><span class="eyebrow">PROJECT SPACE</span><h2>Las grandes ideas<br>se construyen<br>paso a paso.</h2><p>Un espacio para seguir cada decisión, cada entrega y cada avance de tu sistema.</p></div><span class="auth-signature">Del primer plano a la primera venta.</span></section><form class="auth-card" id="login"><div class="eyebrow">ICAROPOS · ACCESO PRIVADO</div><h1>Bienvenido de nuevo.</h1><p>Tu proyecto y todos sus avances, en un solo lugar.</p><label for="email">Correo</label><input id="email" type="email" autocomplete="username" required><label for="password">Contraseña</label><input id="password" type="password" autocomplete="current-password" minlength="8" required><button class="button primary" type="submit">Iniciar sesión</button><button class="button" type="button" id="signup">Crear mi cuenta</button><p id="auth-error" class="auth-error" role="alert">${esc(message)}</p></form></main>`;
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
