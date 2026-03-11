-- H3: Row Level Security baseline for v1 tables.
-- Applies ownership-based policies for authenticated users.

begin;

-- Enable RLS on all user-scoped tables and categories.
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.castle_states enable row level security;
alter table public.user_wallets enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_initial_categories enable row level security;
alter table public.notification_logs enable row level security;
alter table public.user_push_tokens enable row level security;
alter table public.categories enable row level security;

-- Grants for authenticated app usage.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.castle_states to authenticated;
grant select, insert, update, delete on public.user_wallets to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.user_initial_categories to authenticated;
grant select, insert, update, delete on public.notification_logs to authenticated;
grant select, insert, update, delete on public.user_push_tokens to authenticated;
grant select on public.categories to authenticated;

-- Profiles: owner only.
drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Transactions: owner only.
drop policy if exists transactions_owner_all on public.transactions;
create policy transactions_owner_all
on public.transactions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Budgets: owner only.
drop policy if exists budgets_owner_all on public.budgets;
create policy budgets_owner_all
on public.budgets
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Castle state: owner only.
drop policy if exists castle_states_owner_all on public.castle_states;
create policy castle_states_owner_all
on public.castle_states
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Wallet: owner only.
drop policy if exists user_wallets_owner_all on public.user_wallets;
create policy user_wallets_owner_all
on public.user_wallets
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Preferences: owner only.
drop policy if exists user_preferences_owner_all on public.user_preferences;
create policy user_preferences_owner_all
on public.user_preferences
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Initial category links: owner only.
drop policy if exists user_initial_categories_owner_all on public.user_initial_categories;
create policy user_initial_categories_owner_all
on public.user_initial_categories
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Notifications: owner only.
drop policy if exists notification_logs_owner_all on public.notification_logs;
create policy notification_logs_owner_all
on public.notification_logs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Push tokens: owner only.
drop policy if exists user_push_tokens_owner_all on public.user_push_tokens;
create policy user_push_tokens_owner_all
on public.user_push_tokens
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Categories: authenticated read-only.
drop policy if exists categories_select_authenticated on public.categories;
create policy categories_select_authenticated
on public.categories
for select
to authenticated
using (true);

commit;
