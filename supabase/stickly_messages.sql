create table if not exists public.stickly_messages (
  message_id bigint primary key,
  text text not null default '',
  category text not null default 'thoughts',
  timestamp timestamptz not null default now(),
  image text,
  likes integer not null default 0,
  username text not null default 'Anonymous',
  avatar text not null default '👤',
  expires_at timestamptz,
  replies jsonb not null default '[]'::jsonb,
  reports jsonb not null default '[]'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_stickly_messages_timestamp
  on public.stickly_messages (timestamp desc);

create index if not exists idx_stickly_messages_deleted
  on public.stickly_messages (deleted);

alter table public.stickly_messages enable row level security;

drop policy if exists "Public can read active stickly messages" on public.stickly_messages;
create policy "Public can read active stickly messages"
on public.stickly_messages
for select
to anon
using (deleted = false);

-- Service role key bypasses RLS for backend writes.
