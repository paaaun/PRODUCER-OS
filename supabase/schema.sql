create extension if not exists "pgcrypto";

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 company_name text,
 created_at timestamptz not null default now()
);

create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 project_type text not null default 'Film',
 producer text,
 director text,
 status text not null default 'Development',
 budget numeric(12,2) not null default 0,
 start_date date,
 end_date date,
 created_at timestamptz not null default now()
);

create table if not exists public.project_members (
 project_id uuid references public.projects(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 role text not null default 'crew',
 created_at timestamptz not null default now(),
 primary key(project_id,user_id)
);

create table if not exists public.scenes (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade not null,
 scene_number text not null, int_ext text, day_night text, location text, set_name text, description text,
 characters text, extras text, props text, wardrobe text, makeup text, vehicles text, special_equipment text, notes text,
 created_at timestamptz not null default now()
);

create table if not exists public.shooting_schedule (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade not null,
 shoot_day integer not null, shoot_date date, scene_id uuid references public.scenes(id) on delete set null,
 start_time time, end_time time, location text, crew_call time, lunch_minutes integer default 60, notes text,
 created_at timestamptz not null default now()
);

create table if not exists public.crew (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
 name text not null, department text, position text, phone text, email text, day_rate numeric(10,2) default 0,
 availability text, notes text, created_at timestamptz not null default now()
);

create table if not exists public.locations (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
 name text not null, address text, contact_name text, phone text, price numeric(10,2) default 0,
 permits text, parking text, electricity text, dressing_room text, catering text, photos text[], notes text,
 created_at timestamptz not null default now()
);

create table if not exists public.budget_categories (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
 name text not null, planned numeric(12,2) default 0, created_at timestamptz not null default now()
);

create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
 category_id uuid references public.budget_categories(id) on delete set null, description text not null,
 planned_amount numeric(12,2) default 0, actual_amount numeric(12,2) default 0, paid boolean default false,
 expense_date date, notes text, created_at timestamptz not null default now()
);

create table if not exists public.daily_reports (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade not null,
 shoot_day integer not null, report_date date, crew_call time, first_shot time, lunch_time time, wrap_time time,
 scenes_scheduled text, scenes_completed text, scenes_omitted text, overtime_minutes integer default 0,
 delays text, incidents text, additional_expenses numeric(12,2) default 0, notes text, created_at timestamptz not null default now()
);

create table if not exists public.call_sheets (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade not null,
 shoot_day integer not null, call_date date, general_call time, weather text, parking text, catering text,
 emergency_contacts text, notes text, created_at timestamptz not null default now()
);

create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
 name text not null, document_type text, storage_path text, created_at timestamptz not null default now()
);

create or replace function public.is_project_member(pid uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.projects p where p.id=pid and p.owner_id=auth.uid())
 or exists(select 1 from public.project_members pm where pm.project_id=pid and pm.user_id=auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.scenes enable row level security;
alter table public.shooting_schedule enable row level security;
alter table public.crew enable row level security;
alter table public.locations enable row level security;
alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.daily_reports enable row level security;
alter table public.call_sheets enable row level security;
alter table public.documents enable row level security;

create policy "profile own" on public.profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "projects owner or member" on public.projects for select to authenticated using (owner_id=auth.uid() or exists(select 1 from public.project_members pm where pm.project_id=id and pm.user_id=auth.uid()));
create policy "projects owner insert" on public.projects for insert to authenticated with check (owner_id=auth.uid());
create policy "projects owner update" on public.projects for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "projects owner delete" on public.projects for delete to authenticated using (owner_id=auth.uid());

create policy "members visible" on public.project_members for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
create policy "owner manages members" on public.project_members for all to authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid())) with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));

-- Shared project tables: project owner and invited members can read/write.
do $$ declare t text; begin foreach t in array array['scenes','shooting_schedule','crew','locations','budget_categories','expenses','daily_reports','call_sheets','documents'] loop execute format('create policy "%1$s member access" on public.%1$I for all to authenticated using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));',t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
