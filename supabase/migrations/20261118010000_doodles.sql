-- Site v4, phase 8: doodles (Excalidraw drawings sent between us).
-- Additive, service-role-only, forced RLS, like the previous migrations.
--
-- doodles: one row per drawing. The Excalidraw scene (JSON) and a PNG
--   preview live in the private bucket "vg-doodles"; the site serves them
--   only with Valentina's session or the admin session.
-- The notification outbox learns a new kind, "doodle" (the check is
--   replaced by a wider one: every existing row still passes).

begin;

create table public.doodles (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('valentina', 'gianmaria')),
  title text check (title is null or length(title) between 1 and 80),
  -- A reply points to the doodle it answers.
  reply_to uuid references public.doodles (id) on delete set null,
  scene_object text not null check (scene_object ~ '^doodles/[0-9a-f-]{36}\.json$'),
  preview_object text not null check (preview_object ~ '^doodles/[0-9a-f-]{36}\.png$'),
  favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index doodles_created_idx on public.doodles (created_at desc);

alter table public.doodles enable row level security;
alter table public.doodles force row level security;
revoke all on public.doodles from public, anon, authenticated;
grant select, insert, update, delete on public.doodles to service_role;

-- The private bucket: no public URL, small files, two types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vg-doodles', 'vg-doodles', false, 3000000, array['image/png', 'application/json'])
on conflict (id) do nothing;

alter table public.notification_outbox
  drop constraint if exists notification_outbox_kind_check;
alter table public.notification_outbox
  add constraint notification_outbox_kind_check
  check (kind in ('coupon_redeemed', 'miss_you', 'digest', 'test', 'doodle'));

commit;
