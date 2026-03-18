
CREATE TABLE public.domain_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  sender text NOT NULL,
  recipient text NOT NULL,
  subject text,
  domain text NOT NULL DEFAULT 'telesoft.com',
  protocol text NOT NULL DEFAULT 'SMTP',
  direction text NOT NULL DEFAULT 'outbound',
  status text NOT NULL DEFAULT 'delivered',
  size_bytes integer DEFAULT 0,
  has_attachment boolean DEFAULT false,
  spam_score numeric(3,1) DEFAULT 0,
  threat_detected boolean DEFAULT false,
  threat_type text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read domain_emails"
ON public.domain_emails FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert domain_emails"
ON public.domain_emails FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update domain_emails"
ON public.domain_emails FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can delete domain_emails"
ON public.domain_emails FOR DELETE TO authenticated USING (public.is_admin());

INSERT INTO public.domain_emails (sender, recipient, subject, domain, protocol, direction, status, size_bytes, has_attachment, spam_score, threat_detected, threat_type, ip_address, created_at) VALUES
('john@telesoft.com', 'client@acme.com', 'Q4 Security Report', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 245000, true, 0.0, false, null, '10.0.1.45', now() - interval '2 hours'),
('alerts@vendor.com', 'security@telesoft.com', 'Critical Vulnerability Alert CVE-2026-1234', 'telesoft.com', 'SMTP', 'inbound', 'delivered', 18500, false, 0.2, false, null, '203.45.67.89', now() - interval '3 hours'),
('unknown@malicious.xyz', 'hr@telesoft.com', 'Urgent: Update Your Password Now', 'telesoft.com', 'SMTP', 'inbound', 'quarantined', 32000, true, 8.5, true, 'phishing', '185.234.12.99', now() - interval '4 hours'),
('admin@telesoft.com', 'team@telesoft.com', 'Weekly Standup Notes', 'telesoft.com', 'EXCHANGE', 'outbound', 'delivered', 12000, false, 0.0, false, null, '10.0.1.10', now() - interval '5 hours'),
('newsletter@marketing.com', 'info@telesoft.com', 'Industry News Digest', 'telesoft.com', 'SMTP', 'inbound', 'delivered', 89000, false, 1.2, false, null, '54.23.45.12', now() - interval '6 hours'),
('support@telesoft.com', 'user@client.com', 'Ticket #4521 - Resolution', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 15600, false, 0.0, false, null, '10.0.1.50', now() - interval '7 hours'),
('spam@botnet.ru', 'sales@telesoft.com', 'You won $1,000,000!!!', 'telesoft.com', 'SMTP', 'inbound', 'blocked', 4500, false, 9.8, true, 'spam', '91.234.56.78', now() - interval '8 hours'),
('ceo@telesoft.com', 'board@telesoft.com', 'Board Meeting Agenda', 'telesoft.com', 'EXCHANGE', 'outbound', 'delivered', 340000, true, 0.0, false, null, '10.0.1.5', now() - interval '9 hours'),
('phish@fake-bank.com', 'finance@telesoft.com', 'Invoice Payment Required', 'telesoft.com', 'SMTP', 'inbound', 'quarantined', 28000, true, 9.2, true, 'phishing', '123.45.67.89', now() - interval '10 hours'),
('dev@telesoft.com', 'ops@telesoft.com', 'Deployment Complete - v2.4.1', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 8900, false, 0.0, false, null, '10.0.2.20', now() - interval '11 hours'),
('noreply@github.com', 'dev@telesoft.com', '[telesoft/core] Pull Request #892', 'telesoft.com', 'SMTP', 'inbound', 'delivered', 22000, false, 0.1, false, null, '140.82.112.3', now() - interval '12 hours'),
('malware@darkweb.io', 'admin@telesoft.com', 'Important Document', 'telesoft.com', 'SMTP', 'inbound', 'blocked', 1500000, true, 9.9, true, 'malware', '45.67.89.101', now() - interval '13 hours'),
('hr@telesoft.com', 'newemployee@gmail.com', 'Welcome to Telesoft - Onboarding', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 56000, true, 0.0, false, null, '10.0.1.30', now() - interval '14 hours'),
('scanner@telesoft.com', 'soc@telesoft.com', 'Daily Vulnerability Scan Results', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 185000, true, 0.0, false, null, '10.0.3.100', now() - interval '15 hours'),
('partner@securityfirm.com', 'ciso@telesoft.com', 'Penetration Test Report', 'telesoft.com', 'SMTP', 'inbound', 'delivered', 2400000, true, 0.3, false, null, '198.51.100.42', now() - interval '16 hours'),
('spoofed@telesoft.com', 'finance@telesoft.com', 'Wire Transfer Request - Urgent', 'telesoft.com', 'SMTP', 'inbound', 'quarantined', 9800, false, 8.8, true, 'spoofing', '178.62.33.44', now() - interval '18 hours'),
('it@telesoft.com', 'all@telesoft.com', 'Scheduled Maintenance Window', 'telesoft.com', 'EXCHANGE', 'outbound', 'delivered', 11200, false, 0.0, false, null, '10.0.1.15', now() - interval '20 hours'),
('soc@telesoft.com', 'incident@telesoft.com', 'INC-2026-089 Escalation', 'telesoft.com', 'IMAP', 'outbound', 'delivered', 67000, true, 0.0, false, null, '10.0.4.10', now() - interval '22 hours'),
('vendor@cloudsvc.com', 'procurement@telesoft.com', 'License Renewal Notice', 'telesoft.com', 'SMTP', 'inbound', 'delivered', 34000, true, 0.5, false, null, '52.14.89.201', now() - interval '1 day'),
('botnet@zombie.cn', 'random@telesoft.com', '', 'telesoft.com', 'SMTP', 'inbound', 'blocked', 800, false, 10.0, true, 'spam', '220.181.57.216', now() - interval '1 day 2 hours'),
('cto@telesoft.com', 'engineering@telesoft.com', 'Architecture Review - Microservices', 'telesoft.com', 'EXCHANGE', 'outbound', 'delivered', 420000, true, 0.0, false, null, '10.0.1.8', now() - interval '1 day 4 hours'),
('monitor@telesoft.com', 'noc@telesoft.com', 'SMTP Relay Health Check', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 3200, false, 0.0, false, null, '10.0.5.1', now() - interval '1 day 6 hours'),
('attacker@ransomware.net', 'it@telesoft.com', 'Your files have been encrypted', 'telesoft.com', 'SMTP', 'inbound', 'blocked', 45000, true, 10.0, true, 'ransomware', '185.100.87.202', now() - interval '1 day 8 hours'),
('compliance@telesoft.com', 'legal@telesoft.com', 'GDPR Compliance Update', 'telesoft.com', 'SMTP', 'outbound', 'delivered', 98000, true, 0.0, false, null, '10.0.1.22', now() - interval '1 day 10 hours'),
('backup@telesoft.com', 'admin@telesoft.com', 'IMAP Backup Complete - March 2026', 'telesoft.com', 'IMAP', 'outbound', 'delivered', 156000, false, 0.0, false, null, '10.0.6.50', now() - interval '1 day 12 hours');
