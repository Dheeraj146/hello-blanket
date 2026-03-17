
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');

-- Create severity enum
CREATE TYPE public.severity_level AS ENUM ('critical', 'high', 'medium', 'low');

-- Create endpoint_status enum
CREATE TYPE public.endpoint_status AS ENUM ('secure', 'warning', 'critical', 'offline');

-- Create event_status enum
CREATE TYPE public.event_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security events table
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity public.severity_level NOT NULL DEFAULT 'medium',
  source_endpoint TEXT,
  description TEXT,
  status public.event_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Endpoints table
CREATE TABLE public.endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  os TEXT,
  status public.endpoint_status NOT NULL DEFAULT 'secure',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  agent_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threat alerts table
CREATE TABLE public.threat_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity public.severity_level NOT NULL DEFAULT 'medium',
  source TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Profile auto-created by trigger" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER_ROLES RLS
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- SECURITY_EVENTS RLS
CREATE POLICY "Authenticated users can read events" ON public.security_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON public.security_events FOR ALL TO authenticated USING (public.is_admin());

-- ENDPOINTS RLS
CREATE POLICY "Authenticated users can read endpoints" ON public.endpoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage endpoints" ON public.endpoints FOR ALL TO authenticated USING (public.is_admin());

-- THREAT_ALERTS RLS
CREATE POLICY "Authenticated users can read alerts" ON public.threat_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage alerts" ON public.threat_alerts FOR ALL TO authenticated USING (public.is_admin());

-- AUDIT_LOGS RLS
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage audit logs" ON public.audit_logs FOR ALL TO authenticated USING (public.is_admin());

-- REPORTS RLS
CREATE POLICY "Authenticated users can read reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL TO authenticated USING (public.is_admin());

-- Indexes for performance
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX idx_threat_alerts_severity ON public.threat_alerts(severity);
CREATE INDEX idx_threat_alerts_detected ON public.threat_alerts(detected_at DESC);
CREATE INDEX idx_endpoints_status ON public.endpoints(status);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_reports_created ON public.reports(created_at DESC);
