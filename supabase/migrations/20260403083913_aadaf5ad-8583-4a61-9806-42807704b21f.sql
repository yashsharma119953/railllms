
-- 1. Create a security definer function to get user location (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_location(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 2. Drop the recursive admin policy on profiles
DROP POLICY IF EXISTS "Admins can view profiles in their location" ON public.profiles;

-- 3. Recreate it using the security definer function
CREATE POLICY "Admins can view profiles in their location"
ON public.profiles
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND location = get_user_location(auth.uid())
);

-- 4. Add a policy allowing anon/public to read all profiles (demo mode)
CREATE POLICY "Allow public read profiles for demo"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- 5. Add a policy allowing anon to insert into admin_assignments (demo mode)
CREATE POLICY "Allow public insert admin_assignments for demo"
ON public.admin_assignments
FOR INSERT
TO anon
WITH CHECK (true);

-- 6. Add a policy allowing anon to read admin_assignments (demo mode)
CREATE POLICY "Allow public read admin_assignments for demo"
ON public.admin_assignments
FOR SELECT
TO anon
USING (true);

-- 7. Add a policy allowing anon to delete admin_assignments (demo mode)
CREATE POLICY "Allow public delete admin_assignments for demo"
ON public.admin_assignments
FOR DELETE
TO anon
USING (true);

-- 8. Fix exam_results recursion similarly - drop and recreate the admin policy
DROP POLICY IF EXISTS "Admins can view results for their users" ON public.exam_results;

CREATE POLICY "Admins can view results for their users"
ON public.exam_results
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.location = get_user_location(auth.uid())
  )
);

-- 9. Fix course_assignments recursion
DROP POLICY IF EXISTS "Admins manage course assignments for their users" ON public.course_assignments;

CREATE POLICY "Admins manage course assignments for their users"
ON public.course_assignments
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.location = get_user_location(auth.uid())
  )
);

-- 10. Fix exam_assignments recursion
DROP POLICY IF EXISTS "Admins manage exam assignments for their users" ON public.exam_assignments;

CREATE POLICY "Admins manage exam assignments for their users"
ON public.exam_assignments
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id IN (
    SELECT p.user_id FROM profiles p
    WHERE p.location = get_user_location(auth.uid())
  )
);
