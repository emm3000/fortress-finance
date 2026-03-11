-- H5: user bootstrap + onboarding RPC.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data ->> 'name', '');

  insert into public.profiles (id, email, name)
  values (new.id, new.email, v_name)
  on conflict (id) do update
  set email = excluded.email,
      name = case
        when public.profiles.name is null or public.profiles.name = '' then excluded.name
        else public.profiles.name
      end,
      updated_at = now();

  insert into public.castle_states (user_id, level, hp, max_hp, status)
  values (new.id, 1, 100, 100, 'HEALTHY')
  on conflict (user_id) do nothing;

  insert into public.user_wallets (user_id, gold_balance, streak_days)
  values (new.id, 50, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.complete_onboarding(
  p_currency text,
  p_monthly_income_goal numeric
)
returns public.user_preferences
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_pref public.user_preferences;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_currency is null or char_length(trim(p_currency)) <> 3 then
    raise exception 'Currency must be a 3-letter code';
  end if;

  if p_monthly_income_goal is null or p_monthly_income_goal <= 0 then
    raise exception 'Monthly income goal must be greater than 0';
  end if;

  insert into public.user_preferences (user_id, currency, monthly_income_goal)
  values (v_user_id, upper(trim(p_currency))::char(3), p_monthly_income_goal)
  on conflict (user_id) do update
  set currency = excluded.currency,
      monthly_income_goal = excluded.monthly_income_goal,
      updated_at = now()
  returning * into v_pref;

  if not exists (
    select 1
    from public.user_initial_categories uic
    where uic.user_id = v_user_id
  ) then
    insert into public.user_initial_categories (user_id, category_id)
    select
      v_user_id,
      c.id
    from public.categories c
    where c.type = 'EXPENSE'
    order by c.name asc
    limit 4
    on conflict (user_id, category_id) do nothing;
  end if;

  return v_pref;
end;
$$;

grant execute on function public.complete_onboarding(text, numeric) to authenticated;

commit;
