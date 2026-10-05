begin;
select plan(43);

-- Tables of the v1 schema.
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'categories', 'categories table exists');
select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'budget_plans', 'budget plans table exists');
select has_table('public', 'budget_plan_limits', 'category limits table exists');
select has_table('public', 'day_checkins', 'day check-ins table exists');
select has_table('public', 'castle_states', 'castle state table exists');
select has_table('public', 'user_wallets', 'wallet table exists');
select has_table('public', 'user_upgrades', 'Mejoras owned table exists');
select has_table('public', 'game_liquidation_events', 'liquidation ledger table exists');
select has_table('public', 'user_push_tokens', 'push tokens table exists');
select has_table('public', 'notification_dispatch_queue', 'notification dispatch queue table exists');
select has_table('public', 'notification_logs', 'notification logs table exists');
select has_table('public', 'user_change_counters', 'per-user change counter table exists');
select has_table('public', 'sync_applied_operations', 'applied operations table exists');
select has_table('public', 'streak_repair_requests', 'streak repair requests table exists');

-- Columns the current client reads.
select columns_are(
  'public', 'profiles',
  array['id', 'email', 'name', 'currency', 'timezone', 'created_at', 'updated_at'],
  'profiles keeps id, name and email and adds currency and timezone'
);
select has_column('public', 'user_push_tokens', 'token_string', 'push tokens keep token_string');
select has_column('public', 'user_push_tokens', 'device_info', 'push tokens keep device_info');

-- Synced entities carry server ordering.
select has_column('public', 'transactions', 'version', 'transactions carry version');
select has_column('public', 'transactions', 'change_seq', 'transactions carry change_seq');
select has_column('public', 'budget_plans', 'version', 'budget plans carry version');
select has_column('public', 'budget_plans', 'change_seq', 'budget plans carry change_seq');
select has_column('public', 'day_checkins', 'version', 'day check-ins carry version');
select has_column('public', 'day_checkins', 'change_seq', 'day check-ins carry change_seq');

-- Money is bigint minor units; a Transaction's Day is a date.
select col_type_is('public', 'transactions', 'amount', 'bigint', 'transaction amount is bigint');
select col_type_is('public', 'budget_plans', 'total_budget', 'bigint', 'budget total is bigint');
select col_type_is('public', 'budget_plan_limits', 'limit_amount', 'bigint', 'category limit is bigint');
select col_type_is('public', 'transactions', 'day', 'date', 'a Transaction''s Day is a date');

insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-0000000000a1', 'ana@example.com', 'authenticated', 'authenticated');

select throws_ok(
  $$insert into public.transactions (id, user_id, type, amount, category_slug, day, change_seq)
    values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1', 'EXPENSE', 0, 'food', '2026-10-05', 1)$$,
  '23514', null,
  'a Transaction amount must be greater than zero'
);
select throws_ok(
  $$insert into public.transactions (id, user_id, type, amount, category_slug, day, change_seq)
    values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1', 'EXPENSE', 100000000001, 'food', '2026-10-05', 1)$$,
  '23514', null,
  'a Transaction amount must not exceed 100,000,000,000 minor units'
);
select lives_ok(
  $$insert into public.transactions (id, user_id, type, amount, category_slug, day, change_seq)
    values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1', 'EXPENSE', 100000000000, 'food', '2026-10-05', 1)$$,
  'a Transaction amount of exactly 100,000,000,000 minor units is accepted'
);
select throws_ok(
  $$insert into public.transactions (id, user_id, type, amount, category_slug, day, change_seq)
    values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1', 'INCOME', 500, 'food', '2026-10-05', 2)$$,
  '23503', null,
  'a Transaction''s Category must match its type'
);
select throws_ok(
  $$insert into public.budget_plans (user_id, effective_month, total_budget, change_seq)
    values ('00000000-0000-4000-8000-0000000000a1', '2026-10-01', 0, 3)$$,
  '23514', null,
  'a budget total must be greater than zero'
);
select throws_ok(
  $$insert into public.budget_plans (user_id, effective_month, total_budget, change_seq)
    values ('00000000-0000-4000-8000-0000000000a1', '2026-10-15', 100000, 3)$$,
  '23514', null,
  'an Effective month is the first day of a month'
);
select throws_ok(
  $$update public.profiles set timezone = 'Mars/Olympus' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '22023', null,
  'a profile timezone must be a known IANA zone'
);
select lives_ok(
  $$update public.profiles set timezone = 'America/Lima', currency = 'PEN' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  'a profile accepts an IANA timezone and an ISO 4217 currency'
);
select throws_ok(
  $$update public.profiles set timezone = 'UTC-5' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '22023', null,
  'a profile timezone must be an IANA name, not a POSIX offset'
);
select throws_ok(
  $$update public.profiles set timezone = 'Etc/GMT+5' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '22023', null,
  'a profile timezone must not be a fixed Etc/GMT offset'
);
select throws_ok(
  $$update public.profiles set timezone = 'posix/America/Lima' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '22023', null,
  'a profile timezone must not use the posix/ tree'
);
select throws_ok(
  $$update public.profiles set currency = 'USD' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  '23514', null,
  'a profile currency cannot change once set'
);
select lives_ok(
  $$update public.profiles set currency = 'PEN', name = 'Ana' where id = '00000000-0000-4000-8000-0000000000a1'$$,
  'a profile edit that keeps the currency is accepted'
);

-- Categories hold exactly the PRD slugs.
select set_eq(
  $$select slug, type::text from public.categories$$,
  $$values
    ('food', 'EXPENSE'), ('groceries', 'EXPENSE'), ('transport', 'EXPENSE'),
    ('housing', 'EXPENSE'), ('utilities', 'EXPENSE'), ('health', 'EXPENSE'),
    ('education', 'EXPENSE'), ('leisure', 'EXPENSE'), ('shopping', 'EXPENSE'),
    ('other_expense', 'EXPENSE'), ('salary', 'INCOME'), ('side_income', 'INCOME'),
    ('gifts', 'INCOME'), ('other_income', 'INCOME')$$,
  'categories holds the 14 PRD slugs'
);

select * from finish();
rollback;
