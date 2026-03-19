
-- Add supervisor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Create email_server_configs table
CREATE TABLE public.email_server_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL DEFAULT 'IMAP',
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 993,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  use_tls BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_server_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email_server_configs" ON public.email_server_configs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Create endpoint_configs table
CREATE TABLE public.endpoint_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  os TEXT,
  monitor_type TEXT NOT NULL DEFAULT 'ping',
  is_active BOOLEAN NOT NULL DEFAULT true,
  scan_interval_minutes INTEGER NOT NULL DEFAULT 5,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.endpoint_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage endpoint_configs" ON public.endpoint_configs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Clear all seed/demo data
DELETE FROM public.domain_emails;
DELETE FROM public.threat_alerts;
DELETE FROM public.endpoints;
DELETE FROM public.security_events;
DELETE FROM public.reports;
