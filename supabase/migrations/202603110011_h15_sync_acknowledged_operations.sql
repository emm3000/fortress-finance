-- H15: acknowledge accepted client sync operations to avoid incorrect retries after partial local failures.

begin;

create or replace function public.sync_client_state(
  p_last_sync_timestamp timestamptz default null,
  p_transactions jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_last_sync timestamptz;
  v_tx jsonb;
  v_tx_id uuid;
  v_existing record;
  v_incoming_updated_at timestamptz;
  v_now timestamptz;
  v_result jsonb;
  v_operation_id text;
  v_acknowledged_operation_ids jsonb := '[]'::jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_last_sync := coalesce(p_last_sync_timestamp, '1970-01-01T00:00:00Z'::timestamptz);
  v_now := timezone('UTC', now());

  if p_transactions is null or jsonb_typeof(p_transactions) <> 'array' then
    raise exception 'transactions payload must be an array';
  end if;

  for v_tx in
    select value
    from jsonb_array_elements(p_transactions)
  loop
    if jsonb_typeof(v_tx) <> 'object' then
      continue;
    end if;

    v_tx_id := (v_tx ->> 'id')::uuid;
    v_operation_id := nullif(v_tx ->> 'operationId', '');

    if v_tx_id is null then
      continue;
    end if;

    v_incoming_updated_at := coalesce(
      (v_tx ->> 'updatedAt')::timestamptz,
      v_now
    );

    select
      t.id,
      t.user_id,
      t.updated_at
    into v_existing
    from public.transactions t
    where t.id = v_tx_id;

    if found and v_existing.user_id <> v_user_id then
      raise exception 'No autorizado para modificar esta transacción';
    end if;

    -- Ignore older or already-applied client versions of the same transaction.
    if found and v_incoming_updated_at <= v_existing.updated_at then
      if v_operation_id is not null then
        v_acknowledged_operation_ids :=
          v_acknowledged_operation_ids || jsonb_build_array(v_operation_id);
      end if;
      continue;
    end if;

    if not found then
      insert into public.transactions (
        id,
        user_id,
        amount,
        type,
        category_id,
        date,
        notes,
        created_at,
        updated_at,
        deleted_at
      ) values (
        v_tx_id,
        v_user_id,
        coalesce((v_tx ->> 'amount')::numeric, 0),
        coalesce((v_tx ->> 'type')::public.transaction_type, 'EXPENSE'),
        (v_tx ->> 'categoryId')::uuid,
        coalesce((v_tx ->> 'date')::date, (v_now at time zone 'UTC')::date),
        nullif(v_tx ->> 'notes', ''),
        v_now,
        v_incoming_updated_at,
        (v_tx ->> 'deletedAt')::timestamptz
      )
      on conflict (id) do nothing;
    else
      update public.transactions
      set
        amount = coalesce((v_tx ->> 'amount')::numeric, amount),
        type = coalesce((v_tx ->> 'type')::public.transaction_type, type),
        category_id = coalesce((v_tx ->> 'categoryId')::uuid, category_id),
        date = coalesce((v_tx ->> 'date')::date, date),
        notes = nullif(coalesce(v_tx ->> 'notes', notes), ''),
        updated_at = v_incoming_updated_at,
        deleted_at = (v_tx ->> 'deletedAt')::timestamptz
      where id = v_tx_id
        and user_id = v_user_id;
    end if;

    if v_operation_id is not null then
      v_acknowledged_operation_ids :=
        v_acknowledged_operation_ids || jsonb_build_array(v_operation_id);
    end if;
  end loop;

  with pulled_transactions as (
    select
      t.id,
      t.user_id,
      t.category_id,
      t.amount,
      t.notes,
      t.date,
      t.type,
      t.created_at,
      t.updated_at,
      t.deleted_at
    from public.transactions t
    where t.user_id = v_user_id
      and t.updated_at > v_last_sync
    order by t.updated_at asc
  ),
  castle as (
    select
      cs.user_id,
      cs.hp,
      cs.max_hp,
      cs.status
    from public.castle_states cs
    where cs.user_id = v_user_id
    limit 1
  ),
  wallet as (
    select
      uw.user_id,
      uw.gold_balance,
      uw.streak_days
    from public.user_wallets uw
    where uw.user_id = v_user_id
    limit 1
  )
  select jsonb_build_object(
    'syncTimestamp',
    to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'acknowledgedOperationIds',
    v_acknowledged_operation_ids,
    'changes',
    jsonb_build_object(
      'transactions',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', pt.id,
              'userId', pt.user_id,
              'categoryId', pt.category_id,
              'amount', pt.amount,
              'notes', pt.notes,
              'date', pt.date,
              'type', pt.type,
              'createdAt', pt.created_at,
              'updatedAt', pt.updated_at,
              'deletedAt', pt.deleted_at
            )
            order by pt.updated_at asc
          )
          from pulled_transactions pt
        ),
        '[]'::jsonb
      ),
      'budgets', '[]'::jsonb,
      'inventory', '[]'::jsonb,
      'castle',
      (
        select case
          when c.user_id is null then null
          else jsonb_build_object(
            'userId', c.user_id,
            'hp', c.hp,
            'maxHp', c.max_hp,
            'status', c.status
          )
        end
        from castle c
      ),
      'wallet',
      (
        select case
          when w.user_id is null then null
          else jsonb_build_object(
            'userId', w.user_id,
            'goldBalance', w.gold_balance,
            'streakDays', w.streak_days
          )
        end
        from wallet w
      )
    )
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.sync_client_state(timestamptz, jsonb) to authenticated;

commit;
