-- =====================================================================
-- 07_schema_check.sql  -  READ-ONLY. Safe to run any time in the Supabase SQL Editor.
-- It changes nothing. It counts the database objects that the website needs and
-- compares them with the numbers from the original scripts 01-05.
-- Every row in the result should show  OK  in the last column.
-- =====================================================================
WITH found AS (
  SELECT 'tables' AS item,
         (SELECT count(*) FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE')::int AS actual,
         9 AS expected
  UNION ALL SELECT 'views',
         (SELECT count(*) FROM information_schema.views WHERE table_schema = 'public')::int, 4
  UNION ALL SELECT 'functions (public)',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public')::int, 26
  UNION ALL SELECT 'triggers on public tables',
         (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE NOT t.tgisinternal AND n.nspname = 'public')::int, 14
  UNION ALL SELECT 'sign-up trigger on auth.users',
         (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE NOT t.tgisinternal AND n.nspname = 'auth' AND t.tgname = 'on_auth_user_created')::int, 1
  UNION ALL SELECT 'RLS policies',
         (SELECT count(*) FROM pg_policies WHERE schemaname = 'public')::int, 26
  UNION ALL SELECT 'tables with RLS switched on',
         (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity)::int, 9
  UNION ALL SELECT 'functions the website calls',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname IN
            ('book_appointment','set_appointment_status','reschedule_appointment','mark_invoice_paid',
             'available_slots','get_dashboard_stats','verify_doctor_code'))::int, 7
  UNION ALL SELECT 'admin accounts',
         (SELECT count(*) FROM public.profiles WHERE role = 'admin')::int, 1   -- at least 1 is fine
)
SELECT item, actual, expected,
       CASE WHEN item = 'admin accounts' THEN CASE WHEN actual >= 1 THEN 'OK' ELSE 'CHECK' END
            WHEN actual = expected THEN 'OK' ELSE 'CHECK' END AS status
FROM found;
