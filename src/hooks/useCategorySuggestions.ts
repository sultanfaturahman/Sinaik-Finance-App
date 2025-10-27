import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [sectorId, setSectorId] = useState<SectorId | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [ready, setReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    const savedSector = readStorage<SectorId | null>(SELECTED_SECTOR_KEY, null);
    const savedSuggestions = readStorage<string[]>(CATEGORY_SUGGESTIONS_KEY, []);
    const completed = readStorage<boolean>(ONBOARDING_COMPLETED_KEY, false);

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
    setReady(true);
  }, []);

  useEffect(() => {
    syncFromStorage();

    if (!isBrowser) return;

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === SELECTED_SECTOR_KEY ||
        event.key === CATEGORY_SUGGESTIONS_KEY ||
        event.key === ONBOARDING_COMPLETED_KEY ||
        event.key === null
      ) {
        syncFromStorage();
      }
    };

    const handleCustomEvent = () => {
      syncFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CATEGORY_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CATEGORY_EVENT, handleCustomEvent as EventListener);
    };
  }, [syncFromStorage]);

  const sector = useMemo(
    () => SECTOR_PRESETS.find((item) => item.id === sectorId) ?? null,
    [sectorId]
  );

  const persistSuggestions = useCallback((items: string[]) => {
    const unique = toUniqueList(items);
    setSuggestions(unique);
    writeStorage(CATEGORY_SUGGESTIONS_KEY, unique);
  }, []);

  const setSector = useCallback(
    (id: SectorId) => {
      setSectorId(id);
      writeStorage(SELECTED_SECTOR_KEY, id);
      const preset = SECTOR_PRESETS.find((item) => item.id === id);
      if (preset) {
        persistSuggestions([
          ...preset.incomeSuggestions,
          ...preset.expenseSuggestions,
        ]);
      }
    },
    [persistSuggestions]
  );

  const completeOnboarding = useCallback(
    (customCategories?: string[]) => {
      setOnboardingCompleted(true);
      writeStorage(ONBOARDING_COMPLETED_KEY, true);

      if (customCategories && customCategories.length > 0) {
        persistSuggestions(customCategories);
      }
    },
    [persistSuggestions]
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
      const updated = suggestions.filter((item) => item.toLowerCase() !== category.toLowerCase());
      persistSuggestions(updated);
    },
    [persistSuggestions, suggestions]
  );

  const resetOnboarding = useCallback(() => {
    setOnboardingCompleted(false);
    setSectorId(null);
    setSuggestions([]);
    removeStorage(ONBOARDING_COMPLETED_KEY);
    removeStorage(SELECTED_SECTOR_KEY);
    removeStorage(CATEGORY_SUGGESTIONS_KEY);
  }, []);

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
