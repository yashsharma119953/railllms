-- Add super_admins table to allow runtime-managed super admin credentials
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert initial super admin row if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE username = 'Sr.DOM-PRYJ') THEN
    INSERT INTO public.super_admins (username, password) VALUES ('Sr.DOM-PRYJ', 'AcetiansTechnologies@2026');
  END IF;
END$$;
