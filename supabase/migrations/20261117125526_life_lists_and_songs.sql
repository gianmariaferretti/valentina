-- Phase 3: Next time (things to do, suitcase), bucket list and our songs.
-- Additive, service-role-only, forced RLS, like the previous migrations.
-- The next meeting date and the cities live in content_overrides (settings).

begin;

create table public.life_lists (
  id uuid primary key default gen_random_uuid(),
  list text not null check (list in ('todo', 'suitcase', 'bucket')),
  title text not null check (length(title) between 1 and 140),
  notes text check (notes is null or length(notes) <= 600),
  category text check (category is null or length(category) between 1 and 40),
  sort integer not null default 0,
  -- Valentina's proposals wait for Gianmaria's approval in the panel.
  status text not null default 'active' check (status in ('active', 'proposed')),
  proposed_by text not null default 'gianmaria' check (proposed_by in ('gianmaria', 'valentina')),
  done_at timestamptz,
  done_by text check (done_by is null or done_by in ('gianmaria', 'valentina')),
  -- What a tick unlocks, chosen in the panel: {"couponId": "..."} or {"kisses": 20}.
  reward jsonb check (reward is null or jsonb_typeof(reward) = 'object'),
  rewarded_at timestamptz,
  -- Object path in the private photo bucket (bucket list only).
  photo_object text check (photo_object is null or photo_object ~ '^bucket-list/[a-z0-9-]{8,80}\.(webp|jpg)$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index life_lists_list_sort_idx on public.life_lists (list, sort, created_at);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 140),
  artist text not null check (length(artist) between 1 and 140),
  spotify_url text check (
    spotify_url is null
    or spotify_url ~ '^https://open\.spotify\.com/(intl-[a-z]{2}/)?(track|album|playlist)/[A-Za-z0-9]{10,40}'
  ),
  song_date date,
  place text check (place is null or length(place) <= 120),
  why text check (why is null or length(why) <= 600),
  sort integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_life_lists_updated_at
before update on public.life_lists
for each row execute function public.set_updated_at();
create trigger set_songs_updated_at
before update on public.songs
for each row execute function public.set_updated_at();

alter table public.life_lists enable row level security;
alter table public.life_lists force row level security;
alter table public.songs enable row level security;
alter table public.songs force row level security;

revoke all on public.life_lists from public, anon, authenticated;
revoke all on public.songs from public, anon, authenticated;
grant select, insert, update, delete on public.life_lists to service_role;
grant select, insert, update, delete on public.songs to service_role;

-- Ticks or unticks an item. The reward is granted at most once, ever:
-- unticking and ticking again never pays twice. A coupon reward is unlocked
-- here, in the same transaction; kisses are credited by the server.
create function public.complete_life_item(
  p_user_id uuid,
  p_id uuid,
  p_done boolean,
  p_by text
)
returns table (done_at timestamptz, reward jsonb, newly_rewarded boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item public.life_lists%rowtype;
  coupon text;
begin
  if p_by not in ('gianmaria', 'valentina') or p_done is null then
    raise exception 'Invalid tick.';
  end if;
  select * into item from public.life_lists where id = p_id for update;
  if not found or item.status <> 'active' then
    raise exception 'list_item_unavailable';
  end if;

  if not p_done then
    update public.life_lists set done_at = null, done_by = null where id = p_id;
    return query select null::timestamptz, null::jsonb, false;
    return;
  end if;

  update public.life_lists
     set done_at = coalesce(item.done_at, timezone('utc', now())),
         done_by = coalesce(item.done_by, p_by),
         rewarded_at = case when item.reward is not null and item.rewarded_at is null
                            then timezone('utc', now()) else item.rewarded_at end
   where id = p_id;

  if item.reward is not null and item.rewarded_at is null then
    coupon := item.reward ->> 'couponId';
    if coupon is not null and coupon ~ '^[a-z0-9-]{1,100}$' then
      insert into public.coupon_state (user_id, coupon_id, unlocked_at)
      values (p_user_id, coupon, timezone('utc', now()))
      on conflict (user_id, coupon_id) do update
        set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);
    end if;
    return query select coalesce(item.done_at, timezone('utc', now())), item.reward, true;
  else
    return query select coalesce(item.done_at, timezone('utc', now())), item.reward, false;
  end if;
end;
$$;

revoke all on function public.complete_life_item(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.complete_life_item(uuid, uuid, boolean, text) to service_role;

-- Three clearly fake placeholder songs, to be replaced from the panel.
insert into public.songs (title, artist, why, sort) values
  ('Placeholder Song One', 'Replace Me', 'A placeholder. Add the real song, the date, the place and why it matters from the panel.', 0),
  ('Placeholder Song Two', 'Replace Me', 'Another placeholder, waiting for a real story.', 1),
  ('Placeholder Song Three', 'Replace Me', 'Placeholder number three. Gianmaria is still choosing.', 2);

commit;
