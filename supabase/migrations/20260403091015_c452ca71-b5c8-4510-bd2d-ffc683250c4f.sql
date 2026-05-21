
-- Storage policies for content bucket (demo mode)
CREATE POLICY "Allow anon upload to content bucket"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'content');

CREATE POLICY "Allow anon read content bucket"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'content');

-- Allow anon insert into courses for demo
CREATE POLICY "Allow anon insert courses for demo"
ON public.courses FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon read courses for demo
CREATE POLICY "Allow anon read courses for demo"
ON public.courses FOR SELECT TO anon
USING (true);

-- Allow anon insert questions for demo
CREATE POLICY "Allow anon insert questions for demo"
ON public.questions FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon read questions for demo
CREATE POLICY "Allow anon read questions for demo"
ON public.questions FOR SELECT TO anon
USING (true);

-- Allow anon insert/read exams for demo
CREATE POLICY "Allow anon insert exams for demo"
ON public.exams FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon read exams for demo"
ON public.exams FOR SELECT TO anon
USING (true);

-- Allow anon insert exam_results for demo
CREATE POLICY "Allow anon insert exam_results for demo"
ON public.exam_results FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon read exam_results for demo"
ON public.exam_results FOR SELECT TO anon
USING (true);
