-- Read-only audit of SI-MAUNG tables: RLS status, every policy, and policies
-- that look permissive. Safe to run on production (SELECT only).
-- RLS policies are combined with OR: one permissive policy (USING (true))
-- exposes every row regardless of the simaung_* policies.

select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'transactions', 'savings_goals')
order by 1;

select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'transactions', 'savings_goals')
order by tablename, policyname;

-- Policies that need a human look (not created by SI-MAUNG and not tied to auth.uid()).
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'transactions', 'savings_goals')
  and policyname not like 'simaung_%'
  and (coalesce(qual, '') !~ 'auth\.uid\(\)' or coalesce(with_check, 'auth.uid()') !~ 'auth\.uid\(\)');

-- Table privileges for the public client roles.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('profiles', 'transactions', 'savings_goals') and grantee in ('anon', 'authenticated')
group by 1, 2
order by 1, 2;
