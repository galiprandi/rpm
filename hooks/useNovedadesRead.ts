'use client';

import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'rpm_novedades_last_read';

/**
 * Hook para tracking de novedades no leídas
 * Usa localStorage para guardar la fecha de última lectura
 */
export function useNovedadesRead() {
  // Initialize from localStorage synchronously to avoid useEffect
  const [lastReadDate, setLastReadDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });
  const [hasUnread, setHasUnread] = useState(false);

  /**
   * Mark novedades as read by saving current timestamp to localStorage
   */
  const markAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, now);
    setLastReadDate(now);
    setHasUnread(false);
  };

  /**
   * Check if there are unread novedades
   * Compares last read date with the latest entry date in NOVEDADES.md
   */
  const checkUnread = useCallback(async () => {
    try {
      // Fetch NOVEDADES.md content
      const response = await fetch('/NOVEDADES.md');
      const content = await response.text();

      // Extract the first date from the markdown (latest entry)
      // Format: "🗓️ 6 de Mayo de 2026"
      const dateMatch = content.match(/🗓️\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/);
      
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const monthMap: Record<string, number> = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
          'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
          'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        
        const latestEntryDate = new Date(
          parseInt(year),
          monthMap[month.toLowerCase()] || 0,
          parseInt(day)
        );

        // Compare with last read date
        if (lastReadDate) {
          const readDate = new Date(lastReadDate);
          setHasUnread(latestEntryDate > readDate);
        } else {
          // Never read, so there are unread novedades
          setHasUnread(true);
        }
      }
    } catch (error) {
      console.error('Error checking unread novedades:', error);
    }
  }, [lastReadDate]);

  useEffect(() => {
    checkUnread();
  }, [checkUnread]);

  return {
    hasUnread,
    markAsRead,
    checkUnread,
  };
}
