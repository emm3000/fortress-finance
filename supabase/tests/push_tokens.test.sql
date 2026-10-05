begin;
select plan(4);

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'beto@example.com', 'authenticated', 'authenticated');

-- Ana registers the phone's token, then logs out offline; Beto signs in on the
-- same phone.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}';
select lives_ok(
  $$select public.register_push_token('ExponentPushToken[shared-phone]', 'Pixel 8')$$,
  'a user registers a push token'
);

set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}';
select lives_ok(
  $$select public.register_push_token('ExponentPushToken[shared-phone]', 'Pixel 8')$$,
  'a user registers a push token another user holds'
);

reset role;

select results_eq(
  $$select user_id from public.user_push_tokens where token_string = 'ExponentPushToken[shared-phone]'$$,
  $$values ('00000000-0000-4000-8000-0000000000b2'::uuid)$$,
  'user B registering user A''s token leaves exactly one row for that token, owned by B, and A has no row for it'
);

set local role anon;
select throws_ok(
  $$select public.register_push_token('ExponentPushToken[anon]', null)$$,
  '42501', null,
  'anon cannot register a push token'
);
reset role;

select * from finish();
rollback;
