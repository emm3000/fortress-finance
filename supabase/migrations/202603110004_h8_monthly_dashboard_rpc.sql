-- H8: monthly dashboard aggregation RPC.

begin;

create or replace function public.get_monthly_dashboard(
  p_year integer default null,
  p_month integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_now_utc timestamp;
  v_year integer;
  v_month integer;
  v_from_date date;
  v_to_date date;
  v_from_ts timestamptz;
  v_to_ts timestamptz;
  v_result jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_now_utc := timezone('UTC', now());
  v_year := coalesce(p_year, extract(year from v_now_utc)::integer);
  v_month := coalesce(p_month, extract(month from v_now_utc)::integer);

  if v_year < 2000 or v_year > 2100 then
    raise exception 'Year out of range';
  end if;

  if v_month < 1 or v_month > 12 then
    raise exception 'Month must be between 1 and 12';
  end if;

  v_from_date := make_date(v_year, v_month, 1);
  v_to_date := (v_from_date + interval '1 month')::date;
  v_from_ts := make_timestamptz(v_year, v_month, 1, 0, 0, 0, 'UTC');
  v_to_ts := make_timestamptz(extract(year from v_to_date)::integer, extract(month from v_to_date)::integer, 1, 0, 0, 0, 'UTC');

  with monthly as (
    select
      t.type,
      t.amount::numeric as amount,
      t.category_id
    from public.transactions t
    where t.user_id = v_user_id
      and t.deleted_at is null
      and t.date >= v_from_date
      and t.date < v_to_date
  ),
  totals as (
    select
      coalesce(sum(case when m.type = 'INCOME' then m.amount else 0 end), 0) as income,
      coalesce(sum(case when m.type = 'EXPENSE' then m.amount else 0 end), 0) as expense,
      count(*) filter (where m.type = 'INCOME') as income_tx_count,
      count(*) filter (where m.type = 'EXPENSE') as expense_tx_count
    from monthly m
  ),
  expense_by_category as (
    select
      m.category_id,
      sum(m.amount) as total_spent,
      count(*) as tx_count
    from monthly m
    where m.type = 'EXPENSE'
    group by m.category_id
  ),
  top_expense_categories as (
    select
      ebc.category_id,
      coalesce(c.name, 'Categoría') as category_name,
      coalesce(c.icon, '') as category_icon,
      ebc.total_spent,
      ebc.tx_count
    from expense_by_category ebc
    left join public.categories c on c.id = ebc.category_id
    order by ebc.total_spent desc
    limit 5
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'year', v_year,
      'month', v_month,
      'from', to_char(v_from_ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'to', to_char(v_to_ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ),
    'totals', jsonb_build_object(
      'income', t.income,
      'expense', t.expense,
      'balance', t.income - t.expense
    ),
    'txCount', jsonb_build_object(
      'income', t.income_tx_count,
      'expense', t.expense_tx_count
    ),
    'topExpenseCategories', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'categoryId', tec.category_id,
            'categoryName', tec.category_name,
            'categoryIcon', tec.category_icon,
            'totalSpent', tec.total_spent,
            'txCount', tec.tx_count
          )
          order by tec.total_spent desc
        )
        from top_expense_categories tec
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from totals t;

  return v_result;
end;
$$;

grant execute on function public.get_monthly_dashboard(integer, integer) to authenticated;

commit;
