-- Enable delete for demo-mode auth flow (custom session without Supabase auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exam_schedules'
      AND policyname = 'Allow anon delete exam_schedules'
  ) THEN
    CREATE POLICY "Allow anon delete exam_schedules"
    ON public.exam_schedules FOR DELETE TO anon
    USING (true);
  END IF;
END $$;
