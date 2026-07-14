"use client";

import { useEffect } from "react";

export function ThemeScript() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "system";
    const root = document.documentElement;

    // Reset classes
    root.classList.remove("light", "dark", "high-contrast");

    let resolved = "light";
    if (
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      resolved = "dark";
    } else if (theme === "high-contrast") {
      resolved = "high-contrast";
    }

    if (resolved === "high-contrast") {
      root.classList.add("high-contrast");
    } else {
      root.classList.add(resolved);
    }
  }, []);

  return null;
}
