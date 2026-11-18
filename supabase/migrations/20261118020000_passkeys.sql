-- Site v4, phase 9: passkeys (Face ID / Touch ID / fingerprint).
-- Additive, service-role-only, forced RLS, like the previous migrations.
--
-- passkeys: one row per registered device. The public key and signature
--   counter verify each login; the private key never leaves the device.
--   A passkey stops working when it is revoked in the panel, or when
--   "log out of every device" runs after it was created (its created_at is
--   compared with auth_revocations.revoked_before by the server).
-- webauthn_challenges: one random challenge per ceremony, valid for five
--   minutes and usable once (consume_webauthn_challenge marks it used in
--   the same statement that checks it).

begin;

create table public.passkeys (
  -- The credential id, base64url, as the browser reports it.
  -- (Postgres regexes allow at most 255 repetitions: the length is a
  -- separate check.)
  id text primary key check (id ~ '^[A-Za-z0-9_-]+$' and length(id) between 16 and 1400),
  scope text not null default 'visitor' check (scope in ('visitor', 'admin')),
  public_key bytea not null check (octet_length(public_key) between 16 and 2048),
  counter bigint not null default 0 check (counter >= 0),
  transports text[] not null default '{}',
  device text check (device is null or length(device) <= 80),
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index passkeys_scope_idx on public.passkeys (scope, created_at desc);

create table public.webauthn_challenges (
  challenge text primary key check (challenge ~ '^[A-Za-z0-9_-]+$' and length(challenge) between 16 and 256),
  scope text not null check (scope in ('visitor', 'admin')),
  purpose text not null check (purpose in ('register', 'login')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index webauthn_challenges_expiry_idx on public.webauthn_challenges (expires_at);

alter table public.passkeys enable row level security;
alter table public.passkeys force row level security;
alter table public.webauthn_challenges enable row level security;
alter table public.webauthn_challenges force row level security;

revoke all on public.passkeys from public, anon, authenticated;
revoke all on public.webauthn_challenges from public, anon, authenticated;
grant select, insert, update, delete on public.passkeys to service_role;
grant select, insert, update, delete on public.webauthn_challenges to service_role;

-- Marks a challenge used and says whether it was valid: right scope and
-- purpose, not expired, never used before. Old challenges are swept away.
create function public.consume_webauthn_challenge(
  p_challenge text,
  p_scope text,
  p_purpose text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  found boolean;
begin
  update public.webauthn_challenges
     set used_at = timezone('utc', now())
   where challenge = p_challenge
     and scope = p_scope
     and purpose = p_purpose
     and used_at is null
     and expires_at > timezone('utc', now())
  returning true into found;
  delete from public.webauthn_challenges
   where expires_at < timezone('utc', now()) - interval '1 day';
  return coalesce(found, false);
end;
$$;

revoke all on function public.consume_webauthn_challenge(text, text, text) from public, anon, authenticated;
grant execute on function public.consume_webauthn_challenge(text, text, text) to service_role;

commit;
