begin;
select plan(32);

-- Every public table has RLS; every policy outside categories is owner-only
-- for authenticated; categories has one read-only policy.
select is_empty(
  $$select c.relname::text
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and (not c.relrowsecurity
        or not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname))$$,
  'every public table has RLS with owner-only policies, except categories, which is read-only: RLS and a policy on every table'
);

select is_empty(
  $$select tablename::text || '.' || policyname::text
    from pg_policies
    where schemaname = 'public'
      and tablename <> 'categories'
      and (
        roles <> array['authenticated']::name[]
        or coalesce(qual, '') !~ '^\(\( SELECT auth\.uid\(\) AS uid\) = (user_id|id)\)$'
        or coalesce(with_check, qual) !~ '^\(\( SELECT auth\.uid\(\) AS uid\) = (user_id|id)\)$'
      )$$,
  'every public table has RLS with owner-only policies, except categories, which is read-only: policies match the owner'
);

select is(
  (select array_agg(format('%s %s %s', cmd, roles, qual))
    from pg_policies
    where schemaname = 'public' and tablename = 'categories'),
  array['SELECT {authenticated} true'],
  'every public table has RLS with owner-only policies, except categories, which is read-only: categories policy'
);

select table_privs_are('public', 'categories', 'authenticated', array['SELECT'],
  'authenticated can only read categories');

-- Nothing in public is visible to anon.
select is_empty(
  $$select c.relname::text
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p', 'v', 'm')
      and has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')$$,
  'anon has no privileges on any public table'
);

-- Synced tables are written only through the sync RPC.
select table_privs_are('public', 'transactions', 'authenticated', array['SELECT'],
  'authenticated can only read transactions');
select table_privs_are('public', 'budget_plans', 'authenticated', array['SELECT'],
  'authenticated can only read budget plans');
select table_privs_are('public', 'budget_plan_limits', 'authenticated', array['SELECT'],
  'authenticated can only read category limits');
select table_privs_are('public', 'day_checkins', 'authenticated', array['SELECT'],
  'authenticated can only read day check-ins');
select table_privs_are('public', 'user_change_counters', 'authenticated', array['SELECT'],
  'authenticated can only read the change counter');
select table_privs_are('public', 'sync_applied_operations', 'authenticated', array['SELECT'],
  'authenticated can only read applied operations');

-- Two users with one row in every owned table, written as the server.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'beto@example.com', 'authenticated', 'authenticated');

insert into public.transactions (id, user_id, type, amount, category_slug, day, change_seq)
values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1', 'EXPENSE', 1250, 'food', '2026-10-05', 1);
insert into public.budget_plans (user_id, effective_month, total_budget, change_seq)
values ('00000000-0000-4000-8000-0000000000a1', '2026-10-01', 150000, 2);
insert into public.budget_plan_limits (user_id, effective_month, category_slug, limit_amount)
values ('00000000-0000-4000-8000-0000000000a1', '2026-10-01', 'food', 40000);
insert into public.day_checkins (user_id, day, change_seq)
values ('00000000-0000-4000-8000-0000000000a1', '2026-10-04', 3);
insert into public.sync_applied_operations (user_id, operation_id, entity_type, entity_key, result)
values ('00000000-0000-4000-8000-0000000000a1', gen_random_uuid(), 'day_checkin', '2026-10-04', '{}');
insert into public.user_upgrades (user_id, line, tier)
values ('00000000-0000-4000-8000-0000000000a1', 'WALLS', 1);
insert into public.game_liquidation_events (user_id, day, counted, streak_before, streak_after, gold_earned, hp, castle_status, rules_version)
values ('00000000-0000-4000-8000-0000000000a1', '2026-10-04', true, 0, 1, 10, 100, 'HEALTHY', 1);
insert into public.user_push_tokens (user_id, token_string)
values ('00000000-0000-4000-8000-0000000000a1', 'ExponentPushToken[ana]');
insert into public.notification_dispatch_queue (user_id, notification_type, title, body, dedupe_key, send_after)
values ('00000000-0000-4000-8000-0000000000a1', 'BATTLE_REPORT', 'Parte de batalla', 'Ayer sumaste 10 de oro.', 'battle-report:ana:2026-10-04', now());
insert into public.notification_logs (user_id, notification_type, title, body)
values ('00000000-0000-4000-8000-0000000000a1', 'BATTLE_REPORT', 'Parte de batalla', 'Ayer sumaste 10 de oro.');

-- Beto signs in.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}';

select is_empty(
  $$select 'profiles' from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'transactions' from public.transactions where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'budget_plans' from public.budget_plans where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'budget_plan_limits' from public.budget_plan_limits where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'day_checkins' from public.day_checkins where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'user_change_counters' from public.user_change_counters where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'sync_applied_operations' from public.sync_applied_operations where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'castle_states' from public.castle_states where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'user_wallets' from public.user_wallets where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'user_upgrades' from public.user_upgrades where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'game_liquidation_events' from public.game_liquidation_events where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'user_push_tokens' from public.user_push_tokens where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'notification_dispatch_queue' from public.notification_dispatch_queue where user_id = '00000000-0000-4000-8000-0000000000a1'
    union all select 'notification_logs' from public.notification_logs where user_id = '00000000-0000-4000-8000-0000000000a1'$$,
  'an authenticated user cannot read another user''s rows'
);

select is(
  (select count(*)::int from public.castle_states),
  1,
  'an authenticated user reads their own castle state'
);

select is(
  (select count(*)::int from public.categories),
  14,
  'an authenticated user reads every category'
);

-- Unfiltered on purpose: RLS must narrow it to Beto's row.
update public.profiles set timezone = 'America/Bogota', currency = 'COP';

-- R14: game state and notifications are written by the server only.
select throws_ok(
  $$insert into public.castle_states (user_id) values ('00000000-0000-4000-8000-0000000000b2')$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: castle state insert'
);
select throws_ok(
  $$update public.castle_states set hp = 100$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: castle state update'
);
select throws_ok(
  $$delete from public.castle_states$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: castle state delete'
);
select throws_ok(
  $$update public.user_wallets set gold = 9999$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: wallet update'
);
select throws_ok(
  $$delete from public.user_wallets$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: wallet delete'
);
select throws_ok(
  $$insert into public.user_upgrades (user_id, line, tier) values ('00000000-0000-4000-8000-0000000000b2', 'TOWERS', 1)$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: Mejoras insert'
);
select throws_ok(
  $$insert into public.game_liquidation_events (user_id, day, counted, streak_before, streak_after, hp, castle_status, rules_version)
    values ('00000000-0000-4000-8000-0000000000b2', '2026-10-04', true, 0, 50, 100, 'HEALTHY', 1)$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: ledger insert'
);
select throws_ok(
  $$update public.game_liquidation_events set gold_earned = 9999$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: ledger update'
);
select throws_ok(
  $$delete from public.notification_logs$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: notification logs delete'
);
select throws_ok(
  $$insert into public.notification_logs (user_id, notification_type, title, body)
    values ('00000000-0000-4000-8000-0000000000b2', 'BATTLE_REPORT', 't', 'b')$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: notification logs insert'
);
select throws_ok(
  $$update public.notification_dispatch_queue set status = 'SENT'$$,
  '42501', null,
  'an authenticated user cannot insert, update or delete castle state, wallet, Mejoras owned, the liquidation ledger, notification logs or the dispatch queue: dispatch queue update'
);

reset role;

select results_eq(
  $$select id, timezone from public.profiles order by email$$,
  $$values
    ('00000000-0000-4000-8000-0000000000a1'::uuid, 'UTC'::text),
    ('00000000-0000-4000-8000-0000000000b2'::uuid, 'America/Bogota'::text)$$,
  'an authenticated user edits only their own profile'
);

-- Privileges behind the denials above, for every write verb.
select table_privs_are('public', 'castle_states', 'authenticated', array['SELECT'],
  'authenticated can only read castle state');
select table_privs_are('public', 'user_wallets', 'authenticated', array['SELECT'],
  'authenticated can only read the wallet');
select table_privs_are('public', 'user_upgrades', 'authenticated', array['SELECT'],
  'authenticated can only read Mejoras owned');
select table_privs_are('public', 'game_liquidation_events', 'authenticated', array['SELECT'],
  'authenticated can only read the liquidation ledger');
select table_privs_are('public', 'notification_logs', 'authenticated', array['SELECT'],
  'authenticated can only read notification logs');
select table_privs_are('public', 'notification_dispatch_queue', 'authenticated', array['SELECT'],
  'authenticated can only read the dispatch queue');

select * from finish();
rollback;
