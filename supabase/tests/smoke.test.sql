begin;
select plan(2);

select has_schema('public');
select has_table('public', 'profiles', 'public.profiles exists');

select * from finish();
rollback;
