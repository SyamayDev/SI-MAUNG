-- Row Level Security check for SI-MAUNG with two SYNTHETIC users.
-- Run against a LOCAL or staging database only (never production):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_check.sql
-- Everything happens inside one transaction that is rolled back at the end,
-- so no data is left behind. Any failed expectation raises an exception.

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('a0000000-0000-4000-8000-00000000000a', 'rls-a@example.test', '{"full_name":"Uji A"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'rls-b@example.test', '{"full_name":"Uji B"}');

do $$
begin
  if (select count(*) from public.profiles where id in ('a0000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-00000000000b')) <> 2 then
    raise exception 'FAIL: sign-up trigger did not create both profiles';
  end if;
  raise notice 'PASS: profiles created by trigger';
end $$;

-- ---------------------------------------------------------------- user A
set local role authenticated;
-- Both settings: newer auth.uid() reads request.jwt.claims, older builds request.jwt.claim.sub.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-00000000000a","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-00000000000a', true);

insert into public.transactions (type, amount, description, category, transaction_date)
values ('expense', 25000, 'Kopi uji', 'food', current_date);
insert into public.savings_goals (name, target_amount) values ('Tujuan uji', 1000000);

do $$
begin
  if (select count(*) from public.transactions) <> 1 then raise exception 'FAIL: A should see exactly its own transaction'; end if;
  if (select user_id from public.transactions limit 1) <> 'a0000000-0000-4000-8000-00000000000a' then
    raise exception 'FAIL: user_id default should be auth.uid()';
  end if;
  raise notice 'PASS: A inserts and reads own rows (user_id defaults to auth.uid())';

  begin
    insert into public.transactions (user_id, type, amount, description, category)
    values ('b0000000-0000-4000-8000-00000000000b', 'expense', 1, 'Spoof', 'other');
    raise exception 'FAIL: A inserted a row owned by B';
  exception when insufficient_privilege then
    raise notice 'PASS: A cannot insert rows for B';
  end;

  begin
    update public.transactions set user_id = 'b0000000-0000-4000-8000-00000000000b';
    raise exception 'FAIL: A moved a row to B';
  exception when insufficient_privilege then
    raise notice 'PASS: A cannot hand a row over to B';
  end;

  begin
    insert into public.transactions (type, amount, description, category) values ('expense', -5, 'Negatif', 'food');
    raise exception 'FAIL: negative amount accepted';
  exception when check_violation then
    raise notice 'PASS: negative amount rejected';
  end;

  begin
    insert into public.transactions (type, amount, description, category) values ('loan', 5, 'Tipe salah', 'food');
    raise exception 'FAIL: unknown type accepted';
  exception when check_violation then
    raise notice 'PASS: unknown type rejected';
  end;

  begin
    update public.savings_goals set current_amount = -1;
    raise exception 'FAIL: negative goal progress accepted';
  exception when check_violation then
    raise notice 'PASS: negative goal progress rejected';
  end;
end $$;

-- ---------------------------------------------------------------- user B
-- Both settings: newer auth.uid() reads request.jwt.claims, older builds request.jwt.claim.sub.
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-00000000000b","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-00000000000b', true);

do $$
declare
  n int;
begin
  if (select count(*) from public.transactions) <> 0 then raise exception 'FAIL: B can read A transactions'; end if;
  if (select count(*) from public.savings_goals) <> 0 then raise exception 'FAIL: B can read A goals'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: B should see only its own profile'; end if;
  raise notice 'PASS: B cannot read A data';

  update public.transactions set amount = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A rows'; end if;
  delete from public.transactions;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A rows'; end if;
  update public.savings_goals set current_amount = 999;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B changed A goal'; end if;
  raise notice 'PASS: B cannot update or delete A data';
end $$;

-- ------------------------------------------------------------ anonymous
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true), set_config('request.jwt.claim.sub', '', true);
do $$
begin
  begin
    perform count(*) from public.transactions;
    raise exception 'FAIL: anon can query transactions';
  exception when insufficient_privilege then
    raise notice 'PASS: anon has no access to transactions';
  end;
end $$;

reset role;
rollback;
