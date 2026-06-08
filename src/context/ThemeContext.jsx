import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("settings_theme") || "system";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("settings_theme", newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      // Remove both classes first
      root.classList.remove("light", "dark");

      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.add("light");
      } else {
        // System mode: check system preferences
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      }
    };

    applyTheme();

    // Listen for system preference change if in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = () => {
        root.classList.remove("light", "dark");
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }
  }, [theme]);

  // Determine active resolved theme ('light' | 'dark')
  const getResolvedTheme = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  };

  const [resolvedTheme, setResolvedTheme] = useState(getResolvedTheme());

  useEffect(() => {
    setResolvedTheme(getResolvedTheme());

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
