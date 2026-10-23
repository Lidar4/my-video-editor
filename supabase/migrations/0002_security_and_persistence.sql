-- Follow-up migration: keep 0001 immutable and add safe, atomic operations.

create index if not exists projects_workspace_updated_idx on public.projects (workspace_id, updated_at desc);
create index if not exists project_revisions_project_revision_idx on public.project_revisions (project_id, revision desc);
create index if not exists media_assets_workspace_created_idx on public.media_assets (workspace_id, created_at desc);
create index if not exists timeline_tracks_timeline_position_idx on public.timeline_tracks (timeline_id, position);
create index if not exists timeline_clips_track_position_idx on public.timeline_clips (track_id, position);
create index if not exists ai_plans_project_created_idx on public.ai_plans (project_id, created_at desc);
create index if not exists render_jobs_project_created_idx on public.render_jobs (project_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.bootstrap_user_workspace(workspace_name text default 'My creative space')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  workspace_id uuid;
  workspace_slug text;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = 'P0001'; end if;
  workspace_slug := 'workspace-' || replace(current_user_id::text, '-', '');
  select wm.workspace_id into workspace_id
  from public.workspace_members wm
  where wm.user_id = current_user_id and wm.role = 'owner'
  order by wm.created_at asc limit 1;
  if workspace_id is null then
    insert into public.workspaces (owner_id, name, slug)
    values (current_user_id, left(nullif(trim(workspace_name), ''), 160), workspace_slug)
    returning id into workspace_id;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (workspace_id, current_user_id, 'owner');
  end if;
  return workspace_id;
end;
$$;

revoke all on function public.bootstrap_user_workspace(text) from public;
grant execute on function public.bootstrap_user_workspace(text) to authenticated;

create or replace function public.save_project_revision(target_project_id uuid, expected_revision integer, snapshot jsonb)
returns table (revision integer, saved_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
  next_revision integer;
begin
  select p.workspace_id into target_workspace_id from public.projects p where p.id = target_project_id for update;
  if target_workspace_id is null then raise exception 'Project not found' using errcode = 'P0001'; end if;
  if not public.is_workspace_member(target_workspace_id, 'editor') then raise exception 'Not authorized' using errcode = 'P0001'; end if;
  update public.projects
  set current_revision = current_revision + 1, updated_at = now()
  where id = target_project_id and current_revision = expected_revision
  returning current_revision into next_revision;
  if next_revision is null then raise exception 'Revision conflict' using errcode = 'P0001'; end if;
  insert into public.project_revisions (project_id, revision, snapshot, created_by)
  values (target_project_id, next_revision, snapshot, auth.uid());
  return query select next_revision, now();
end;
$$;

revoke all on function public.save_project_revision(uuid, integer, jsonb) from public;
grant execute on function public.save_project_revision(uuid, integer, jsonb) to authenticated;

create or replace function public.workspace_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
strict
as $$
declare parsed uuid;
begin
  if object_name !~ '^workspaces/[0-9a-fA-F-]{36}/projects/[0-9a-fA-F-]{36}/assets/[0-9a-fA-F-]{36}/(source|thumbnail)(/.*)?$' then return null; end if;
  begin parsed := split_part(object_name, '/', 2)::uuid; exception when invalid_text_representation then return null; end;
  return parsed;
end;
$$;

-- Replace only storage policies: 0001 remains the historical baseline migration.
drop policy if exists storage_member_read on storage.objects;
drop policy if exists storage_editor_upload on storage.objects;
drop policy if exists storage_editor_update on storage.objects;
drop policy if exists storage_owner_delete on storage.objects;
create policy storage_member_read on storage.objects for select using (bucket_id = 'motionforge-media' and public.is_workspace_member(public.workspace_id_from_storage_path(name), 'viewer'));
create policy storage_editor_upload on storage.objects for insert with check (bucket_id = 'motionforge-media' and public.is_workspace_member(public.workspace_id_from_storage_path(name), 'editor'));
create policy storage_editor_update on storage.objects for update using (bucket_id = 'motionforge-media' and public.is_workspace_member(public.workspace_id_from_storage_path(name), 'editor')) with check (bucket_id = 'motionforge-media' and public.is_workspace_member(public.workspace_id_from_storage_path(name), 'editor'));
create policy storage_owner_delete on storage.objects for delete using (bucket_id = 'motionforge-media' and public.is_workspace_member(public.workspace_id_from_storage_path(name), 'owner'));
