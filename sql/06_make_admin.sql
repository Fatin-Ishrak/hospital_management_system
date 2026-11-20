-- =====================================================================
-- 06_make_admin.sql  -  Make YOUR account the administrator.
-- Run in the Supabase SQL Editor AFTER you created your login account
-- (Authentication > Users > Add user). Replace the email below with the
-- exact email of YOUR account, then click Run.
-- Public users can never do this: the website has no way to set a role.
-- =====================================================================
UPDATE public.profiles
SET    role = 'admin'
WHERE  email = 'PUT-YOUR-EMAIL-HERE@example.com';

-- Check the result (you should see one row with role = admin):
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
