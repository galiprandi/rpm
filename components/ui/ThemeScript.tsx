'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;

    // Reset classes
    root.classList.remove('light', 'dark', 'high-contrast');

    let resolved = 'light';
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      resolved = 'dark';
    } else if (theme === 'high-contrast') {
      resolved = 'high-contrast';
    }

    const isAdmin = window.location.pathname.startsWith('/adm');

    if (resolved === 'high-contrast') {
      if (isAdmin) {
        root.classList.add('dark', 'high-contrast');
      } else {
        root.classList.add('dark');
      }
    } else {
      root.classList.add(resolved);
    }
  }, []);

  return null;
}
