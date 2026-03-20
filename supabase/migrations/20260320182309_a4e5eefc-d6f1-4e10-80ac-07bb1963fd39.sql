ALTER TABLE public.endpoint_configs 
  ADD COLUMN IF NOT EXISTS api_url text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS log_source text DEFAULT 'ping';

ALTER TABLE public.endpoint_configs ALTER COLUMN monitor_type SET DEFAULT 'wazuh';