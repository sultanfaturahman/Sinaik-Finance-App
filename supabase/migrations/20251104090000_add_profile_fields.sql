-- Add extended profile fields and completion tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- Keep completion flags aligned for existing users
UPDATE public.profiles
SET profile_completed = onboarding_completed,
    profile_completed_at = CASE
      WHEN onboarding_completed AND profile_completed_at IS NULL THEN now()
      ELSE profile_completed_at
    END
WHERE profile_completed IS DISTINCT FROM onboarding_completed;
