-- Centralized password change RPC so the client can update passwords through RLS safely.
CREATE OR REPLACE FUNCTION public.change_account_password(
  p_role app_role,
  p_username text,
  p_current_password text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_role = 'super_admin' THEN
    UPDATE public.super_admins
    SET password = p_new_password
    WHERE username = p_username
      AND password = p_current_password;
  ELSIF p_role = 'admin' THEN
    UPDATE public.admin_assignments
    SET admin_password = p_new_password
    WHERE admin_username = p_username
      AND admin_password = p_current_password;
  ELSIF p_role = 'user' THEN
    UPDATE public.profiles
    SET password = p_new_password
    WHERE username = p_username
      AND password = p_current_password;
  ELSE
    RAISE EXCEPTION 'Unsupported role';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current password is incorrect or account not found';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_account_password(app_role, text, text, text) TO anon, authenticated;
