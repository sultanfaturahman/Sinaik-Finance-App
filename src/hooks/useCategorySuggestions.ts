import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CATEGORY_SUGGESTIONS_KEY,
  ONBOARDING_COMPLETED_KEY,
  SECTOR_PRESETS,
  SELECTED_SECTOR_KEY,
  SectorId,
  SectorPreset,
} from '@/constants/categoryPresets';

const isBrowser = typeof window !== 'undefined';

const CATEGORY_EVENT = 'sinaik:category-preferences-changed';

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Failed to read localStorage key ${key}`, error);
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent(CATEGORY_EVENT, {
        detail: { key },
      })
    );
  } catch (error) {
    console.warn(`Failed to write localStorage key ${key}`, error);
  }
};

const removeStorage = (key: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent(CATEGORY_EVENT, {
        detail: { key },
      })
    );
  } catch (error) {
    console.warn(`Failed to remove localStorage key ${key}`, error);
  }
};

const toUniqueList = (items: string[]) => {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
};

export interface CategorySuggestionState {
  sector: SectorPreset | null;
  suggestions: string[];
  onboardingCompleted: boolean;
  ready: boolean;
  setSector: (sectorId: SectorId) => void;
  completeOnboarding: (customCategories?: string[]) => void;
  addSuggestion: (category: string) => void;
  bulkAddSuggestions: (categories: string[]) => void;
  removeSuggestion: (category: string) => void;
  resetOnboarding: () => void;
}

export const useCategorySuggestions = (): CategorySuggestionState => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [sectorId, setSectorId] = useState<SectorId | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [ready, setReady] = useState(false);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  const getStorageKey = useCallback(
    (key: string) => (userId ? `${key}:${userId}` : key),
    [userId]
  );

  useEffect(() => {
    setSectorId(null);
    setSuggestions([]);
    setOnboardingCompleted(false);
    setReady(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSyncedUserId(null);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !isBrowser) return;

    const scopedKeys: Array<[string, string]> = [
      [SELECTED_SECTOR_KEY, getStorageKey(SELECTED_SECTOR_KEY)],
      [CATEGORY_SUGGESTIONS_KEY, getStorageKey(CATEGORY_SUGGESTIONS_KEY)],
      [ONBOARDING_COMPLETED_KEY, getStorageKey(ONBOARDING_COMPLETED_KEY)],
    ];

    scopedKeys.forEach(([legacyKey, scopedKey]) => {
      if (window.localStorage.getItem(scopedKey) !== null) return;
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        window.localStorage.setItem(scopedKey, legacyValue);
        window.localStorage.removeItem(legacyKey);
      }
    });
  }, [getStorageKey, userId]);

  const syncFromStorage = useCallback(() => {
    const savedSector = readStorage<SectorId | null>(
      getStorageKey(SELECTED_SECTOR_KEY),
      null
    );
    const savedSuggestions = readStorage<string[]>(
      getStorageKey(CATEGORY_SUGGESTIONS_KEY),
      []
    );
    const completed = readStorage<boolean>(
      getStorageKey(ONBOARDING_COMPLETED_KEY),
      false
    );

    setSectorId(savedSector);

    if (savedSuggestions.length > 0) {
      setSuggestions(toUniqueList(savedSuggestions));
    } else if (savedSector) {
      const preset = SECTOR_PRESETS.find((item) => item.id === savedSector);
      if (preset) {
        setSuggestions(
          toUniqueList([...preset.incomeSuggestions, ...preset.expenseSuggestions])
        );
      }
    }

    setOnboardingCompleted(completed);

    const shouldWaitForRemote = Boolean(userId) && !completed && syncedUserId !== userId;
    setReady(!shouldWaitForRemote);
  }, [getStorageKey, syncedUserId, userId]);

  useEffect(() => {
    syncFromStorage();

    if (!isBrowser) return;

    const relevantKeys = [
      getStorageKey(SELECTED_SECTOR_KEY),
      getStorageKey(CATEGORY_SUGGESTIONS_KEY),
      getStorageKey(ONBOARDING_COMPLETED_KEY),
    ];

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || relevantKeys.includes(event.key)) {
        syncFromStorage();
      }
    };

    const handleCustomEvent = (event: Event) => {
      const detailKey = (event as CustomEvent<{ key: string }>).detail?.key;
      if (!detailKey || relevantKeys.includes(detailKey)) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CATEGORY_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CATEGORY_EVENT, handleCustomEvent as EventListener);
    };
  }, [getStorageKey, syncFromStorage]);

  useEffect(() => {
    if (!userId || syncedUserId === userId) {
      return;
    }

    let cancelled = false;

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, selected_sector, category_suggestions, profile_completed')
          .eq('id', userId)
          .single();

        if (cancelled) return;

        if (error) {
          console.warn('Failed to fetch onboarding preferences from Supabase', error);
          setSyncedUserId(userId);
          setReady(true);
          return;
        }

        if (!data) {
          setSyncedUserId(userId);
          setReady(true);
          return;
        }

        const onboardingFlag = Boolean(data.onboarding_completed || data.profile_completed);

        setOnboardingCompleted(onboardingFlag);
        if (onboardingFlag) {
          writeStorage(getStorageKey(ONBOARDING_COMPLETED_KEY), true);
        } else {
          removeStorage(getStorageKey(ONBOARDING_COMPLETED_KEY));
        }

        if (data.selected_sector) {
          setSectorId(data.selected_sector as SectorId);
          writeStorage(getStorageKey(SELECTED_SECTOR_KEY), data.selected_sector);
        }

        if (Array.isArray(data.category_suggestions) && data.category_suggestions.length > 0) {
          const unique = toUniqueList(data.category_suggestions);
          setSuggestions(unique);
          writeStorage(getStorageKey(CATEGORY_SUGGESTIONS_KEY), unique);
        } else if (data.selected_sector) {
          const preset = SECTOR_PRESETS.find((item) => item.id === data.selected_sector);
          if (preset) {
            const presetSuggestions = toUniqueList([
              ...preset.incomeSuggestions,
              ...preset.expenseSuggestions,
            ]);
            setSuggestions(presetSuggestions);
            writeStorage(getStorageKey(CATEGORY_SUGGESTIONS_KEY), presetSuggestions);
          }
        }

        setSyncedUserId(userId);
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to fetch onboarding preferences from Supabase', error);
          setSyncedUserId(userId);
          setReady(true);
        }
      }
    };

    fetchPreferences();

    return () => {
      cancelled = true;
    };
  }, [getStorageKey, syncedUserId, userId]);

  const sector = useMemo(
    () => SECTOR_PRESETS.find((item) => item.id === sectorId) ?? null,
    [sectorId]
  );

  const persistSuggestions = useCallback(
    (items: string[]) => {
      const unique = toUniqueList(items);
      setSuggestions(unique);
      writeStorage(getStorageKey(CATEGORY_SUGGESTIONS_KEY), unique);

      if (userId) {
        void supabase
          .from('profiles')
          .update({ category_suggestions: unique })
          .eq('id', userId);
      }
    },
    [getStorageKey, userId]
  );

  const setSector = useCallback(
    (id: SectorId) => {
      setSectorId(id);
      writeStorage(getStorageKey(SELECTED_SECTOR_KEY), id);

      if (userId) {
        void supabase
          .from('profiles')
          .update({ selected_sector: id })
          .eq('id', userId);
      }

      const preset = SECTOR_PRESETS.find((item) => item.id === id);
      if (preset) {
        persistSuggestions([
          ...preset.incomeSuggestions,
          ...preset.expenseSuggestions,
        ]);
      }
    },
    [getStorageKey, persistSuggestions, userId]
  );

  const completeOnboarding = useCallback(
    (customCategories?: string[]) => {
      setOnboardingCompleted(true);
      writeStorage(getStorageKey(ONBOARDING_COMPLETED_KEY), true);

      if (customCategories && customCategories.length > 0) {
        persistSuggestions(customCategories);
      }

      if (userId) {
        const payload: { onboarding_completed: boolean; selected_sector?: string | null } = {
          onboarding_completed: true,
        };

        if (sectorId) {
          payload.selected_sector = sectorId;
        }

        void supabase.from('profiles').update(payload).eq('id', userId);
      }
    },
    [getStorageKey, persistSuggestions, sectorId, userId]
  );

  const addSuggestion = useCallback(
    (category: string) => {
      if (!category) return;
      const updated = toUniqueList([...suggestions, category]);
      persistSuggestions(updated);
    },
    [persistSuggestions, suggestions]
  );

  const bulkAddSuggestions = useCallback(
    (categories: string[]) => {
      if (categories.length === 0) return;
      const updated = toUniqueList([...suggestions, ...categories]);
      persistSuggestions(updated);
    },
    [persistSuggestions, suggestions]
  );

  const removeSuggestion = useCallback(
    (category: string) => {
      const updated = suggestions.filter(
        (item) => item.toLowerCase() !== category.toLowerCase()
      );
      persistSuggestions(updated);
    },
    [persistSuggestions, suggestions]
  );

  const resetOnboarding = useCallback(() => {
    setOnboardingCompleted(false);
    setSectorId(null);
    setSuggestions([]);
    removeStorage(getStorageKey(ONBOARDING_COMPLETED_KEY));
    removeStorage(getStorageKey(SELECTED_SECTOR_KEY));
    removeStorage(getStorageKey(CATEGORY_SUGGESTIONS_KEY));

    if (userId) {
      void supabase
        .from('profiles')
        .update({
          onboarding_completed: false,
          selected_sector: null,
          category_suggestions: [],
        })
        .eq('id', userId);
    }
  }, [getStorageKey, userId]);

  return {
    sector,
    suggestions,
    onboardingCompleted,
    ready,
    setSector,
    completeOnboarding,
    addSuggestion,
    bulkAddSuggestions,
    removeSuggestion,
    resetOnboarding,
  };
};
