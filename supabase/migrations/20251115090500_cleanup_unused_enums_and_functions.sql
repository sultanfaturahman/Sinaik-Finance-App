-- Remove unused role/report types and adjust onboarding trigger after dropping user_roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );

  -- Create initial UMKM status for new accounts.
  INSERT INTO public.umkm_status (user_id, level, annual_revenue)
  VALUES (NEW.id, 'ultra_mikro', 0);

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
DROP TYPE IF EXISTS public.app_role;
DROP TYPE IF EXISTS public.report_frequency;
