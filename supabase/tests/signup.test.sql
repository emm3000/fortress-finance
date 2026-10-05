begin;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data, aud, role)
values (
  '00000000-0000-4000-8000-0000000000a1',
  'ana@example.com',
  '{"name": "Ana"}'::jsonb,
  'authenticated',
  'authenticated'
);

select results_eq(
  $$select id, email, name from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'$$,
  $$values ('00000000-0000-4000-8000-0000000000a1'::uuid, 'ana@example.com'::text, 'Ana'::text)$$,
  'signing up creates a profiles row'
);

select is(
  (select timezone from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'),
  'UTC',
  'a new profile starts in UTC until the device reports its timezone'
);

select is(
  (select count(*)::int from public.castle_states where user_id = '00000000-0000-4000-8000-0000000000a1'),
  1,
  'signing up creates the castle state'
);

select is(
  (select count(*)::int from public.user_wallets where user_id = '00000000-0000-4000-8000-0000000000a1'),
  1,
  'signing up creates the wallet'
);

select is(
  (select last_change_seq from public.user_change_counters where user_id = '00000000-0000-4000-8000-0000000000a1'),
  0::bigint,
  'signing up creates the change counter at zero'
);

-- A user who signed up before the baseline: the drop wiped their rows.
insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-0000000000c3', 'carla@example.com', 'authenticated', 'authenticated');
delete from public.profiles where id = '00000000-0000-4000-8000-0000000000c3';
delete from public.castle_states where user_id = '00000000-0000-4000-8000-0000000000c3';
delete from public.user_wallets where user_id = '00000000-0000-4000-8000-0000000000c3';
delete from public.user_change_counters where user_id = '00000000-0000-4000-8000-0000000000c3';

select public.backfill_user_rows();

select results_eq(
  $$select
      (select count(*)::int from public.profiles where id = '00000000-0000-4000-8000-0000000000c3' and email = 'carla@example.com'),
      (select count(*)::int from public.castle_states where user_id = '00000000-0000-4000-8000-0000000000c3'),
      (select count(*)::int from public.user_wallets where user_id = '00000000-0000-4000-8000-0000000000c3'),
      (select count(*)::int from public.user_change_counters where user_id = '00000000-0000-4000-8000-0000000000c3')$$,
  $$values (1, 1, 1, 1)$$,
  'the baseline backfills profile, castle state, wallet and change counter for existing users'
);

select * from finish();
rollback;
