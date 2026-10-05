begin;
select plan(3);

-- Functions anon or authenticated may call. Liquidation lands in phase 3 as
-- service_role only, so it never joins this list.
create temporary table allowed_functions (signature text primary key) on commit drop;
insert into allowed_functions (signature)
values ('register_push_token(text,text)');

select is_empty(
  $$select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and has_function_privilege('anon', p.oid, 'EXECUTE')$$,
  'no public function is executable by anon or authenticated outside the allow-list in the test: anon'
);

select is_empty(
  $$select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      and p.oid::regprocedure::text not in (select signature from allowed_functions)$$,
  'no public function is executable by anon or authenticated outside the allow-list in the test: authenticated'
);

-- Functions a later migration creates start closed to anon and authenticated.
create function public.probe_future_function() returns int language sql as 'select 1';
select is(
  (select array_agg(r) from unnest(array['anon', 'authenticated']) r
    where has_function_privilege(r, 'public.probe_future_function()', 'EXECUTE')),
  null,
  'a function created by a later migration is not executable by anon or authenticated'
);
drop function public.probe_future_function();

select * from finish();
rollback;
