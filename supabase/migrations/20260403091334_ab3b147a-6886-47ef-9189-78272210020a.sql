
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_title TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Demo mode policies
CREATE POLICY "Allow anon read exam_schedules"
ON public.exam_schedules FOR SELECT TO anon
USING (true);

CREATE POLICY "Allow anon insert exam_schedules"
ON public.exam_schedules FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update exam_schedules"
ON public.exam_schedules FOR UPDATE TO anon
USING (true);

-- Authenticated policies
CREATE POLICY "Super admins manage all schedules"
ON public.exam_schedules FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view their schedules"
ON public.exam_schedules FOR SELECT
USING (has_role(auth.uid(), 'admin'));
