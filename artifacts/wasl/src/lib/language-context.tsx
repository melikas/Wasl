import { createContext, useContext, type ReactNode } from "react";
import { translate, type AppLanguage } from "./i18n";

const LanguageContext = createContext<AppLanguage>("en");

export function LanguageProvider({ language, children }: { language: AppLanguage; children: ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useAppTranslation() {
  const language = useContext(LanguageContext);
  return { language, t: (value: string) => translate(value, language) };
}