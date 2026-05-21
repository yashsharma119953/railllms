-- Add admin credential columns so super admin can generate login for admins
ALTER TABLE public.admin_assignments ADD COLUMN IF NOT EXISTS admin_username TEXT UNIQUE;
ALTER TABLE public.admin_assignments ADD COLUMN IF NOT EXISTS admin_password TEXT;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Backfill admin_username for existing rows using admin_name if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_assignments WHERE admin_username IS NULL) THEN
    UPDATE public.admin_assignments
    SET admin_username = lower(regexp_replace(admin_name, '\\s+', '', 'g')) || '@acetians.in'
    WHERE admin_username IS NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username IS NULL) THEN
    UPDATE public.profiles
    SET username = lower(regexp_replace(full_name, '\\s+', '_', 'g')) || '@acetians.in'
    WHERE username IS NULL;
  END IF;
END$$;
