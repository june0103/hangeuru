-- docs/spec.md 7.1. Supabase SQL Editor에서 한 번 실행한다(spec 11.1)
create type public.plan as enum ('light', 'steady', 'daily');
create type public.seed as enum ('apple', 'tangerine', 'peach', 'coffee');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 2 and 20),
  plan          public.plan not null,
  seed          public.seed not null,
  join_date     date not null,                 -- 가입한 날의 KST 날짜
  harvested_at  timestamptz,                   -- 수확한 시각. 수확 전에는 비어 있다
  created_at    timestamptz not null default now()
);

create table public.attendance (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  work_date     date not null,                 -- 출근한 날의 KST 날짜
  check_in_at   timestamptz,                   -- 운영자가 넣은 기록은 비어 있을 수 있다
  check_out_at  timestamptz,
  created_at    timestamptz not null default now(),
  primary key (user_id, work_date),
  constraint attendance_out_after_in
    check (check_out_at is null or (check_in_at is not null and check_out_at >= check_in_at))
);
create index attendance_work_date_idx on public.attendance (work_date);

alter table public.profiles   enable row level security;
alter table public.attendance enable row level security;

create policy "members read profiles"   on public.profiles
  for select to authenticated using (true);
create policy "members read attendance" on public.attendance
  for select to authenticated using (true);

revoke all on public.profiles, public.attendance from anon;
grant select on public.profiles, public.attendance to authenticated;
