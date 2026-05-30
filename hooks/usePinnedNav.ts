'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'adm_pinned_nav';

/**
 * Manages the user's pinned navigation items, persisted in localStorage.
 */
export function usePinnedNav() {
  const [pinned, setPinned] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPinned(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  const togglePin = useCallback((href: string) => {
    setPinned((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const isPinned = useCallback((href: string) => pinned.includes(href), [pinned]);

  return { pinned, isPinned, togglePin, loaded };
}
