-- Persist onboarding preferences and category selections per user
ALTER TABLE public.profiles
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN selected_sector TEXT,
  ADD COLUMN category_suggestions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Ensure existing rows have initialized arrays
UPDATE public.profiles
SET category_suggestions = ARRAY[]::TEXT[]
WHERE category_suggestions IS NULL;
