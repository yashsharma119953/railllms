
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS for user_roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  hrms_id TEXT UNIQUE,
  cug_number TEXT,
  location TEXT,
  designation TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can view profiles in their location" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') AND
    location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  );

-- Admin assignments (which admin manages which location)
CREATE TABLE public.admin_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  admin_name TEXT NOT NULL,
  location TEXT NOT NULL,
  cug_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage admin assignments" ON public.admin_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can view own assignment" ON public.admin_assignments
  FOR SELECT USING (auth.uid() = admin_user_id);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'video', 'ppt', 'doc', 'image')),
  file_url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view published courses" ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);
CREATE POLICY "Super admins manage courses" ON public.courses
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Course assignments
CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments" ON public.course_assignments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own assignments" ON public.course_assignments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Super admins manage course assignments" ON public.course_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage course assignments for their users" ON public.course_assignments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') AND
    user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.location = (SELECT pp.location FROM public.profiles pp WHERE pp.user_id = auth.uid())
    )
  );

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  scheduled_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active exams" ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "Super admins manage exams" ON public.exams
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  marks INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions for active exams" ON public.questions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    exam_id IN (SELECT id FROM public.exams WHERE is_active = true)
  );
CREATE POLICY "Super admins manage questions" ON public.questions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Exam assignments
CREATE TABLE public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, user_id)
);
ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam assignments" ON public.exam_assignments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins manage exam assignments" ON public.exam_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage exam assignments for their users" ON public.exam_assignments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') AND
    user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.location = (SELECT pp.location FROM public.profiles pp WHERE pp.user_id = auth.uid())
    )
  );

-- Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hrms_id TEXT NOT NULL,
  total_marks INTEGER NOT NULL,
  obtained_marks INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, user_id)
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.exam_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.exam_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can view all results" ON public.exam_results
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can view results for their users" ON public.exam_results
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') AND
    user_id IN (
      SELECT p.user_id FROM public.profiles p
      WHERE p.location = (SELECT pp.location FROM public.profiles pp WHERE pp.user_id = auth.uid())
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for content
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true);

CREATE POLICY "Authenticated users can view content" ON storage.objects
  FOR SELECT USING (bucket_id = 'content' AND auth.role() = 'authenticated');
CREATE POLICY "Super admins can upload content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'content' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can upload content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'content' AND public.has_role(auth.uid(), 'admin'));
