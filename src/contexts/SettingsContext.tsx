import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "PLN" | "HUF" | "RON";
export type Language = "en" | "pl" | "hu" | "ro" | "de" | "fr";
export type ColorScheme = "navy-gold" | "emerald-cream" | "burgundy-pearl" | "midnight-silver";

export interface AppBranding {
  name: string;
  icon: "gavel" | "crown" | "diamond" | "star" | "hammer";
}

interface Settings {
  currency: Currency;
  language: Language;
  colorScheme: ColorScheme;
  branding: AppBranding;
}

interface SettingsContextType {
  settings: Settings;
  updateCurrency: (currency: Currency) => void;
  updateLanguage: (language: Language) => void;
  updateColorScheme: (scheme: ColorScheme) => void;
  updateBranding: (branding: AppBranding) => void;
}

const defaultSettings: Settings = {
  currency: "USD",
  language: "en",
  colorScheme: "navy-gold",
  branding: {
    name: "EliteAuctions",
    icon: "gavel",
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = "app_settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to parse settings:", e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Apply color scheme
    document.documentElement.setAttribute("data-theme", settings.colorScheme);
  }, [settings]);

  const updateCurrency = (currency: Currency) => {
    setSettings((prev) => ({ ...prev, currency }));
  };

  const updateLanguage = (language: Language) => {
    setSettings((prev) => ({ ...prev, language }));
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme: scheme }));
  };

  const updateBranding = (branding: AppBranding) => {
    setSettings((prev) => ({ ...prev, branding }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateCurrency,
        updateLanguage,
        updateColorScheme,
        updateBranding,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Currency formatting helper
export const currencyConfig: Record<Currency, { locale: string; code: string; symbol: string }> = {
  USD: { locale: "en-US", code: "USD", symbol: "$" },
  EUR: { locale: "de-DE", code: "EUR", symbol: "€" },
  PLN: { locale: "pl-PL", code: "PLN", symbol: "zł" },
  HUF: { locale: "hu-HU", code: "HUF", symbol: "Ft" },
  RON: { locale: "ro-RO", code: "RON", symbol: "lei" },
};

// Language labels
export const languageLabels: Record<Language, string> = {
  en: "English",
  pl: "Polski",
  hu: "Magyar",
  ro: "Română",
  de: "Deutsch",
  fr: "Français",
};

// Color scheme labels
export const colorSchemeLabels: Record<ColorScheme, { name: string; description: string }> = {
  "navy-gold": { name: "Navy & Gold", description: "Classic premium look" },
  "emerald-cream": { name: "Emerald & Cream", description: "Fresh and elegant" },
  "burgundy-pearl": { name: "Burgundy & Pearl", description: "Rich and sophisticated" },
  "midnight-silver": { name: "Midnight & Silver", description: "Modern and sleek" },
};

// Icon labels
export const iconLabels: Record<AppBranding["icon"], string> = {
  gavel: "Gavel",
  crown: "Crown",
  diamond: "Diamond",
  star: "Star",
  hammer: "Hammer",
};
