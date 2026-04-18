import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, t } from './mockData';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: typeof t.ua;
}

const Ctx = createContext<I18nCtx | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('ua');
  return <Ctx.Provider value={{ lang, setLang, tr: t[lang] }}>{children}</Ctx.Provider>;
};

export const useI18n = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used within I18nProvider');
  return c;
};
