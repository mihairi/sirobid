import { useSettings } from "@/contexts/SettingsContext";
import { t, TranslationKey } from "@/lib/translations";

export function useTranslation() {
  const { settings } = useSettings();

  return {
    t: (key: TranslationKey) => t(key, settings.language),
    language: settings.language,
  };
}
