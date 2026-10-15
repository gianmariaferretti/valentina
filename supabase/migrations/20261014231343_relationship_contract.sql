-- Matches the migration version assigned by the connected Supabase project.
begin;

create table public.relationship_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agreement_number text not null check (agreement_number = 'VG-2026-001'),
  version text not null check (length(version) between 1 and 40),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  content_snapshot jsonb not null check (jsonb_typeof(content_snapshot) = 'object'),
  status text not null default 'awaiting_valentina' check (status in ('awaiting_valentina', 'awaiting_countersignature', 'fully_executed')),
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  reward_requested_at timestamptz,
  unique (user_id, agreement_number, version),
  check ((status = 'fully_executed') = (executed_at is not null)),
  check (reward_requested_at is null or executed_at is not null)
);

create table public.relationship_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.relationship_contracts(id) on delete restrict,
  signer_role text not null check (signer_role in ('colombian', 'italian')),
  signer_name text not null check (length(signer_name) between 2 and 120),
  signature_png text not null check (length(signature_png) between 100 and 350000),
  signed_at timestamptz not null default now(),
  unique (contract_id, signer_role)
);

create table public.relationship_contract_admin_attempts (
  fingerprint text primary key check (fingerprint ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts between 0 and 1000)
);

create index relationship_contract_signatures_contract_idx
  on public.relationship_contract_signatures (contract_id, signed_at);

alter table public.relationship_contracts enable row level security;
alter table public.relationship_contracts force row level security;
alter table public.relationship_contract_signatures enable row level security;
alter table public.relationship_contract_signatures force row level security;
alter table public.relationship_contract_admin_attempts enable row level security;
alter table public.relationship_contract_admin_attempts force row level security;
revoke all on public.relationship_contracts from public, anon, authenticated;
revoke all on public.relationship_contract_signatures from public, anon, authenticated;
revoke all on public.relationship_contract_admin_attempts from public, anon, authenticated;
grant select, insert, update on public.relationship_contracts to service_role;
grant select, insert, delete on public.relationship_contract_signatures to service_role;
grant select, insert, update on public.relationship_contract_admin_attempts to service_role;

create function public.register_relationship_admin_attempt(p_fingerprint text)
returns boolean
language plpgsql security invoker set search_path = public as $$
declare
  saved_attempts integer;
begin
  insert into public.relationship_contract_admin_attempts (fingerprint, attempts)
  values (p_fingerprint, 1)
  on conflict (fingerprint) do update
  set window_started_at = case
        when relationship_contract_admin_attempts.window_started_at < now() - interval '15 minutes'
        then now() else relationship_contract_admin_attempts.window_started_at end,
      attempts = case
        when relationship_contract_admin_attempts.window_started_at < now() - interval '15 minutes'
        then 1 else least(relationship_contract_admin_attempts.attempts + 1, 1000) end
  returning attempts into saved_attempts;
  return saved_attempts <= 5;
end;
$$;

create function public.sign_relationship_contract(
  p_user_id uuid,
  p_agreement_number text,
  p_version text,
  p_content_hash text,
  p_content_snapshot jsonb,
  p_signer_role text,
  p_signer_name text,
  p_signature_png text
) returns table (contract_id uuid, contract_status text, signed_at timestamptz)
language plpgsql security invoker set search_path = public as $$
declare
  saved_contract public.relationship_contracts%rowtype;
  saved_signature_at timestamptz;
begin
  if p_agreement_number <> 'VG-2026-001' or
     p_signer_role not in ('colombian', 'italian') then
    raise exception 'Invalid contract identity or signer role';
  end if;

  insert into public.relationship_contracts (
    user_id, agreement_number, version, content_hash, content_snapshot
  ) values (
    p_user_id, p_agreement_number, p_version, p_content_hash, p_content_snapshot
  ) on conflict (user_id, agreement_number, version) do nothing;

  select * into saved_contract from public.relationship_contracts
  where user_id = p_user_id and agreement_number = p_agreement_number and version = p_version
  for update;

  if saved_contract.content_hash <> p_content_hash or
     saved_contract.content_snapshot <> p_content_snapshot then
    raise exception 'Signed text version does not match the archived contract';
  end if;
  if (p_signer_role = 'colombian' and saved_contract.status <> 'awaiting_valentina') or
     (p_signer_role = 'italian' and saved_contract.status <> 'awaiting_countersignature') then
    raise exception 'This signature is not expected in the current state';
  end if;

  insert into public.relationship_contract_signatures (
    contract_id, signer_role, signer_name, signature_png
  ) values (
    saved_contract.id, p_signer_role, p_signer_name, p_signature_png
  ) returning relationship_contract_signatures.signed_at into saved_signature_at;

  update public.relationship_contracts
  set status = case when p_signer_role = 'italian' then 'fully_executed' else 'awaiting_countersignature' end,
      executed_at = case when p_signer_role = 'italian' then now() else null end
  where id = saved_contract.id
  returning * into saved_contract;

  return query select saved_contract.id, saved_contract.status, saved_signature_at;
end;
$$;

create function public.withdraw_relationship_signature(
  p_user_id uuid, p_agreement_number text, p_version text
) returns boolean
language plpgsql security invoker set search_path = public as $$
declare
  saved_contract public.relationship_contracts%rowtype;
begin
  select * into saved_contract from public.relationship_contracts
  where user_id = p_user_id and agreement_number = p_agreement_number and version = p_version
  for update;
  if not found or saved_contract.status <> 'awaiting_countersignature' then
    return false;
  end if;
  delete from public.relationship_contract_signatures
  where contract_id = saved_contract.id and signer_role = 'colombian';
  update public.relationship_contracts set status = 'awaiting_valentina'
  where id = saved_contract.id;
  return true;
end;
$$;

create function public.claim_relationship_reward(
  p_user_id uuid, p_agreement_number text, p_version text
) returns timestamptz
language plpgsql security invoker set search_path = public as $$
declare
  requested_at timestamptz;
begin
  update public.relationship_contracts
  set reward_requested_at = coalesce(reward_requested_at, now())
  where user_id = p_user_id and agreement_number = p_agreement_number
    and version = p_version and status = 'fully_executed'
  returning reward_requested_at into requested_at;
  if not found then
    raise exception 'A fully signed agreement is required';
  end if;
  return requested_at;
end;
$$;

revoke all on function public.sign_relationship_contract(uuid, text, text, text, jsonb, text, text, text) from public, anon, authenticated;
revoke all on function public.withdraw_relationship_signature(uuid, text, text) from public, anon, authenticated;
revoke all on function public.claim_relationship_reward(uuid, text, text) from public, anon, authenticated;
revoke all on function public.register_relationship_admin_attempt(text) from public, anon, authenticated;
grant execute on function public.sign_relationship_contract(uuid, text, text, text, jsonb, text, text, text) to service_role;
grant execute on function public.withdraw_relationship_signature(uuid, text, text) to service_role;
grant execute on function public.claim_relationship_reward(uuid, text, text) to service_role;
grant execute on function public.register_relationship_admin_attempt(text) to service_role;

commit;
