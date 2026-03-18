CREATE TABLE public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own visits"
ON public.page_visits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all visits"
ON public.page_visits
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can read own visits"
ON public.page_visits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);