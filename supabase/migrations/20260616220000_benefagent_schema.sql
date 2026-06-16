-- BenefAgent schema (recreated on new Supabase project)

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  salary integer,
  contrib_pct numeric,
  family_status text default 'single',
  commute_type text default 'transit',
  accounts jsonb default '[]'::jsonb,
  trial_ends_at timestamptz,
  onboarded boolean default false,
  onboarded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  plan text,
  status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

-- benefits analysis
create table if not exists public.benefits_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  employer text,
  raw_json jsonb,
  total_opportunity numeric,
  created_at timestamptz default now()
);

create index if not exists benefits_results_user_id_idx on public.benefits_results (user_id);

create table if not exists public.benefit_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  result_id uuid references public.benefits_results (id) on delete cascade,
  title text,
  description text,
  estimated_value numeric,
  priority text,
  created_at timestamptz default now()
);

create index if not exists benefit_actions_user_id_idx on public.benefit_actions (user_id);
create index if not exists benefit_actions_result_id_idx on public.benefit_actions (result_id);

-- checker & claims history
create table if not exists public.check_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  expense text,
  account_type text,
  eligible text,
  verdict text,
  explanation text,
  estimated_savings numeric,
  created_at timestamptz default now()
);

create index if not exists check_history_user_id_idx on public.check_history (user_id);

create table if not exists public.claim_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  claim_number text,
  total_amount numeric,
  account_type text,
  employer text,
  created_at timestamptz default now()
);

create index if not exists claim_history_user_id_idx on public.claim_history (user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, trial_ends_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    now() + interval '2 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.benefits_results enable row level security;
alter table public.benefit_actions enable row level security;
alter table public.check_history enable row level security;
alter table public.claim_history enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- subscriptions (users read own; service role writes via webhook)
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);

-- benefits_results
create policy "benefits_results_select_own" on public.benefits_results for select using (auth.uid() = user_id);
create policy "benefits_results_insert_own" on public.benefits_results for insert with check (auth.uid() = user_id);

-- benefit_actions
create policy "benefit_actions_select_own" on public.benefit_actions for select using (auth.uid() = user_id);
create policy "benefit_actions_insert_own" on public.benefit_actions for insert with check (auth.uid() = user_id);

-- check_history
create policy "check_history_select_own" on public.check_history for select using (auth.uid() = user_id);
create policy "check_history_insert_own" on public.check_history for insert with check (auth.uid() = user_id);

-- claim_history
create policy "claim_history_select_own" on public.claim_history for select using (auth.uid() = user_id);
create policy "claim_history_insert_own" on public.claim_history for insert with check (auth.uid() = user_id);

-- service role bypasses RLS for stripe webhook (uses service key in edge function)
