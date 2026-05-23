ALTER TABLE public.exam_results
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS cug_number TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS exam_results_exam_hrms_cug_unique
  ON public.exam_results (exam_id, hrms_id, cug_number);
