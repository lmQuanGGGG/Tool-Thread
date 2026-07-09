ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Index để đếm nhanh theo IP và fingerprint (tránh full table scan)
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_ip ON public.profiles(last_login_ip);
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint ON public.profiles(device_fingerprint);
