create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'editor', 'viewer');
create type public.project_status as enum ('draft', 'active', 'archived');
create type public.asset_status as enum ('pending', 'ready', 'failed', 'deleted');
create type public.track_type as enum ('video', 'audio', 'voiceover', 'subtitle', 'overlay');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type public.plan_approval_status as enum ('draft', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  preferred_language text not null default 'bn',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  aspect_ratio text not null default '16:9' check (aspect_ratio in ('16:9', '9:16', '1:1', '4:5')),
  status public.project_status not null default 'draft',
  current_revision integer not null default 0 check (current_revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null check (revision >= 0),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (project_id, revision)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('video/mp4', 'video/quicktime', 'image/png', 'image/jpeg', 'audio/mpeg', 'audio/wav', 'application/x-subrip')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 524288000),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  storage_path text not null unique,
  thumbnail_path text,
  status public.asset_status not null default 'pending',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.timelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  duration_ms bigint not null default 0 check (duration_ms >= 0),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table public.timeline_tracks (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references public.timelines(id) on delete cascade,
  type public.track_type not null,
  name text not null check (char_length(name) between 1 and 120),
  position integer not null default 0 check (position >= 0),
  muted boolean not null default false,
  locked boolean not null default false,
  unique (timeline_id, position)
);

create table public.timeline_clips (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.timeline_tracks(id) on delete cascade,
  asset_id uuid references public.media_assets(id) on delete set null,
  source_in_ms bigint not null default 0 check (source_in_ms >= 0),
  source_out_ms bigint not null check (source_out_ms > source_in_ms),
  timeline_start_ms bigint not null default 0 check (timeline_start_ms >= 0),
  timeline_end_ms bigint not null check (timeline_end_ms > timeline_start_ms),
  transform jsonb not null default '{"x":0,"y":0,"scale":1,"rotation":0,"opacity":1}'::jsonb,
  caption_text text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  appearance_description text not null default '',
  clothing_description text not null default '',
  voice_profile jsonb not null default '{}'::jsonb,
  character_prompt text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 20000),
  plan_json jsonb not null,
  total_duration_ms bigint not null check (total_duration_ms > 0),
  approval_status public.plan_approval_status not null default 'draft',
  provider text,
  estimated_cost_usd numeric(12, 4),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null check (revision >= 0),
  status public.job_status not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  output_asset_id uuid references public.media_assets(id) on delete set null,
  retry_count integer not null default 0 check (retry_count between 0 and 5),
  idempotency_key text not null unique,
  error_code text,
  worker_id text,
  created_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(target_workspace_id uuid, minimum_role public.workspace_role default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and case minimum_role
        when 'viewer' then wm.role in ('viewer', 'editor', 'owner')
        when 'editor' then wm.role in ('editor', 'owner')
        when 'owner' then wm.role = 'owner'
      end
  );
$$;

create or replace function public.project_workspace(target_project_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$ select workspace_id from public.projects where id = target_project_id; $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
alter table public.media_assets enable row level security;
alter table public.timelines enable row level security;
alter table public.timeline_tracks enable row level security;
alter table public.timeline_clips enable row level security;
alter table public.characters enable row level security;
alter table public.ai_plans enable row level security;
alter table public.render_jobs enable row level security;

create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy workspace_members_read on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy workspace_members_owner_write on public.workspace_members for all using (public.is_workspace_member(workspace_id, 'owner')) with check (public.is_workspace_member(workspace_id, 'owner'));
create policy workspaces_member_read on public.workspaces for select using (public.is_workspace_member(id));
create policy workspaces_owner_write on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy projects_member_read on public.projects for select using (public.is_workspace_member(workspace_id));
create policy projects_editor_write on public.projects for insert with check (public.is_workspace_member(workspace_id, 'editor'));
create policy projects_editor_update on public.projects for update using (public.is_workspace_member(workspace_id, 'editor')) with check (public.is_workspace_member(workspace_id, 'editor'));
create policy projects_owner_delete on public.projects for delete using (public.is_workspace_member(workspace_id, 'owner'));

create policy project_revisions_member_read on public.project_revisions for select using (public.is_workspace_member(public.project_workspace(project_id)));
create policy project_revisions_editor_write on public.project_revisions for insert with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));

create policy media_assets_member_read on public.media_assets for select using (public.is_workspace_member(workspace_id));
create policy media_assets_editor_write on public.media_assets for insert with check (public.is_workspace_member(workspace_id, 'editor'));
create policy media_assets_editor_update on public.media_assets for update using (public.is_workspace_member(workspace_id, 'editor')) with check (public.is_workspace_member(workspace_id, 'editor'));
create policy media_assets_owner_delete on public.media_assets for delete using (public.is_workspace_member(workspace_id, 'owner'));

create policy timelines_member_read on public.timelines for select using (public.is_workspace_member(public.project_workspace(project_id)));
create policy timelines_editor_write on public.timelines for all using (public.is_workspace_member(public.project_workspace(project_id), 'editor')) with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));
create policy tracks_member_read on public.timeline_tracks for select using (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = timeline_id))));
create policy tracks_editor_write on public.timeline_tracks for all using (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = timeline_id)), 'editor')) with check (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = timeline_id)), 'editor'));
create policy clips_member_read on public.timeline_clips for select using (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = (select timeline_id from public.timeline_tracks where id = track_id)))));
create policy clips_editor_write on public.timeline_clips for all using (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = (select timeline_id from public.timeline_tracks where id = track_id))), 'editor')) with check (public.is_workspace_member(public.project_workspace((select project_id from public.timelines where id = (select timeline_id from public.timeline_tracks where id = track_id))), 'editor'));

create policy characters_member_read on public.characters for select using (public.is_workspace_member(workspace_id));
create policy characters_editor_write on public.characters for all using (public.is_workspace_member(workspace_id, 'editor')) with check (public.is_workspace_member(workspace_id, 'editor'));
create policy plans_member_read on public.ai_plans for select using (public.is_workspace_member(public.project_workspace(project_id)));
create policy plans_editor_write on public.ai_plans for insert with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));
create policy plans_editor_update on public.ai_plans for update using (public.is_workspace_member(public.project_workspace(project_id), 'editor')) with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));
create policy jobs_member_read on public.render_jobs for select using (public.is_workspace_member(public.project_workspace(project_id)));
create policy jobs_editor_create on public.render_jobs for insert with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));
create policy jobs_editor_cancel on public.render_jobs for update using (public.is_workspace_member(public.project_workspace(project_id), 'editor')) with check (public.is_workspace_member(public.project_workspace(project_id), 'editor'));

insert into storage.buckets (id, name, public) values ('motionforge-media', 'motionforge-media', false) on conflict (id) do nothing;
create policy storage_member_read on storage.objects for select using (bucket_id = 'motionforge-media' and public.is_workspace_member((storage.foldername(name))[2]::uuid));
create policy storage_editor_upload on storage.objects for insert with check (bucket_id = 'motionforge-media' and public.is_workspace_member((storage.foldername(name))[2]::uuid, 'editor'));
create policy storage_editor_update on storage.objects for update using (bucket_id = 'motionforge-media' and public.is_workspace_member((storage.foldername(name))[2]::uuid, 'editor')) with check (bucket_id = 'motionforge-media' and public.is_workspace_member((storage.foldername(name))[2]::uuid, 'editor'));
create policy storage_owner_delete on storage.objects for delete using (bucket_id = 'motionforge-media' and public.is_workspace_member((storage.foldername(name))[2]::uuid, 'owner'));
