
CREATE POLICY "Allow anon insert profiles for demo"
ON public.profiles FOR INSERT TO anon
WITH CHECK (true);
