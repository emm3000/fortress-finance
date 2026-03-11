-- H14 phase-2: notification dispatch queue with dedupe and retry metadata.

begin;

create table if not exists public.notification_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.game_liquidation_events(id) on delete set null,
  notification_type public.notification_type not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  next_retry_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedupe_key),
  check (char_length(trim(dedupe_key)) > 0),
  check (status in ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
  check (attempts >= 0)
);

create index if not exists idx_notification_dispatch_queue_status_retry
  on public.notification_dispatch_queue (status, next_retry_at, created_at);

create index if not exists idx_notification_dispatch_queue_user_created
  on public.notification_dispatch_queue (user_id, created_at desc);

create index if not exists idx_notification_dispatch_queue_event
  on public.notification_dispatch_queue (event_id);

drop trigger if exists trg_notification_dispatch_queue_updated_at on public.notification_dispatch_queue;
create trigger trg_notification_dispatch_queue_updated_at
before update on public.notification_dispatch_queue
for each row execute function public.set_updated_at();

alter table public.notification_dispatch_queue enable row level security;

revoke all on public.notification_dispatch_queue from public;
grant select, insert, update, delete on public.notification_dispatch_queue to service_role;

drop policy if exists notification_dispatch_queue_service_role on public.notification_dispatch_queue;
create policy notification_dispatch_queue_service_role
on public.notification_dispatch_queue
for all
to service_role
using (true)
with check (true);

commit;
