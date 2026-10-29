import {createClient} from '@supabase/supabase-js';
import {validateBackup} from './data.js';
const env=import.meta.env||{};
const url=env.VITE_SUPABASE_URL;
const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const client=url&&key?createClient(url,key,{auth:{storageKey:'ikarodb_auth',detectSessionInUrl:false}}):null;
export function remoteStore(client){
return {async loadRemote(userId){
 const {data:member,error:memberError}=await client.from('ikarodb_members').select('email').maybeSingle();
 if(memberError)throw memberError;
 if(!member)throw new Error('Tu cuenta no tiene acceso a este dashboard.');
 const {data,error}=await client.from('ikarodb_progress').select('payload,revision').eq('user_id',userId).maybeSingle();
 if(error)throw error;
 return data?{state:validateBackup(data.payload),revision:data.revision}:null;
},async writeRemote(userId,state,revision){
 const payload=validateBackup(state);
 const query=revision===null
 ?client.from('ikarodb_progress').insert({user_id:userId,payload,revision:1})
 :client.from('ikarodb_progress').update({payload,revision:revision+1}).eq('user_id',userId).eq('revision',revision);
 const {data,error}=await query.select('revision').maybeSingle();
 if(error)throw error;
 if(!data)throw new Error('El avance cambió en otro dispositivo. Exporta tus cambios y recarga antes de continuar.');
 return data.revision;
}};
}
export const {loadRemote,writeRemote}=remoteStore(client);
