-- ============================================================
-- SADOKU SUPABASE SQL NOTES
-- ============================================================

-- 1. UPDATE USER ROLE
--    Available roles: 'admin', 'basic', 'plus', 'premium', 'ultimate'
-- ============================================================
UPDATE public.user_profiles
SET role = 'plus', updated_at = NOW()
WHERE email = 'email@user.com';

-- 2. VIEW ALL USERS WITH ROLES
-- ============================================================
SELECT u.id, u.email, p.role, p.created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY p.created_at DESC;

-- 3. CREATE NEW USER MANUALLY (if needed outside signup)
-- ============================================================
-- Use Supabase Auth Admin API or dashboard instead.

-- 4. DELETE USER
-- ============================================================
-- DELETE FROM public.user_profiles WHERE email = 'email@user.com';
-- DELETE FROM auth.users WHERE email = 'email@user.com';
