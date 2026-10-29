-- Dashboard privado. No altera objetos preexistentes ni configuración global de Auth.
create table public.ikarodb_members (
 email text not null,
 constraint ikarodb_members_pkey primary key(email),
 constraint ikarodb_members_email_check check(email=lower(email) and length(email)>3)
);
alter table public.ikarodb_members enable row level security;
revoke all on public.ikarodb_members from anon, authenticated;
grant select on public.ikarodb_members to authenticated;
create policy ikarodb_members_read_self on public.ikarodb_members for select to authenticated
 using(email=(select auth.jwt()->>'email'));
create table public.ikarodb_progress (
 user_id uuid not null,
 payload jsonb not null,
 revision integer not null default 1,
 constraint ikarodb_progress_pkey primary key(user_id),
 constraint ikarodb_progress_user_fkey foreign key(user_id) references auth.users(id) on delete cascade,
 constraint ikarodb_progress_revision_check check(revision>0),
 constraint ikarodb_progress_payload_check check(
  jsonb_typeof(payload)='object' and payload @> '{"version":1}'::jsonb
  and payload ? 'tasks' and jsonb_typeof(payload->'tasks')='object'
  and payload ? 'payments' and jsonb_typeof(payload->'payments')='object'
  and octet_length(payload::text)<=1000000)
);
alter table public.ikarodb_progress enable row level security;
revoke all on public.ikarodb_progress from anon, authenticated;
grant select,insert,update on public.ikarodb_progress to authenticated;
create policy ikarodb_progress_select on public.ikarodb_progress for select to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.ikarodb_members));
create policy ikarodb_progress_insert on public.ikarodb_progress for insert to authenticated
 with check(user_id=(select auth.uid()) and exists(select 1 from public.ikarodb_members));
create policy ikarodb_progress_update on public.ikarodb_progress for update to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.ikarodb_members))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.ikarodb_members));
-- La lista de correos autorizados se provisiona fuera del repositorio.
