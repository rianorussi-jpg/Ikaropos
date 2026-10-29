import test from 'node:test';
import assert from 'node:assert/strict';
import {remoteStore} from '../src/remote.js';
import {tasks} from '../src/data.js';
function mock(responses){
 const calls=[];
 const client={from(table){const call={table,filters:[]};calls.push(call);const q={select(value){call.select=value;return q;},eq(k,v){call.filters.push([k,v]);return q;},insert(value){call.insert=value;return q;},update(value){call.update=value;return q;},async maybeSingle(){return responses.shift();}};return q;}};
 return {store:remoteStore(client),calls};
}
const payload={version:1,tasks:{[tasks[0].id]:{status:'done',note:'Evidencia'}},payments:{base:true}};
test('rechaza cuenta no autorizada antes de consultar avances',async()=>{const {store,calls}=mock([{data:null,error:null}]);await assert.rejects(store.loadRemote('a'),/no tiene acceso/);assert.equal(calls.length,1);});
test('carga solo el avance del usuario y valida el formato remoto',async()=>{const {store,calls}=mock([{data:{email:'test@example.invalid'}},{data:{payload,revision:4}}]);const loaded=await store.loadRemote('a');assert.equal(loaded.state.tasks[tasks[0].id].note,'Evidencia');assert.equal(loaded.revision,4);assert.deepEqual(calls[1].filters,[['user_id','a']]);});
test('actualiza con dueño y revisión para detectar cambios concurrentes',async()=>{const {store,calls}=mock([{data:{revision:5}},{data:null}]);assert.equal(await store.writeRemote('a',payload,4),5);assert.deepEqual(calls[0].filters,[['user_id','a'],['revision',4]]);await assert.rejects(store.writeRemote('a',payload,4),/otro dispositivo/);});
test('primera escritura usa insert y propaga errores sin afirmar guardado',async()=>{const {store,calls}=mock([{data:{revision:1}},{error:new Error('Sin red')}]);assert.equal(await store.writeRemote('a',payload,null),1);assert.equal(calls[0].insert.user_id,'a');await assert.rejects(store.writeRemote('a',payload,1),/Sin red/);});
