'use client';

import { Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

const LANGUES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'sr', label: 'Srpski' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
] as const;

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: {
          new (options: object, elementId: string): unknown;
          InlineLayout: { SIMPLE: number };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function langueEnCours() {
  if (typeof document === 'undefined') return 'fr';
  const value = document.cookie.split('; ').find((entry) => entry.startsWith('googtrans='))?.split('=')[1];
  return value?.split('/').pop() || 'fr';
}

export default function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const [langue, setLangue] = useState('fr');

  useEffect(() => {
    setLangue(langueEnCours());
    if (document.getElementById('google-translate-script')) return;
    window.googleTranslateElementInit = () => {
      window.google?.translate?.TranslateElement && new window.google.translate.TranslateElement(
        { pageLanguage: 'fr', includedLanguages: 'en,de,nl,es,it,sr,pt,ru', autoDisplay: false },
        'google_translate_element',
      );
    };
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const changerLangue = (code: string) => {
    document.cookie = code === 'fr'
      ? 'googtrans=; path=/; max-age=0; SameSite=Lax'
      : `googtrans=/fr/${code}; path=/; max-age=31536000; SameSite=Lax`;
    setLangue(code);
    window.location.reload();
  };

  return (
    <label className={mobile ? 'mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-encre' : 'flex items-center gap-2'}>
      <Languages size={mobile ? 17 : 16} className="shrink-0 text-prune" aria-hidden="true" />
      <span className="sr-only">Choisir la langue</span>
      <select
        value={langue}
        onChange={(event) => changerLangue(event.target.value)}
        className={mobile ? 'min-w-0 flex-1 bg-transparent font-medium outline-none' : 'max-w-28 bg-transparent text-sm font-medium text-ardoise outline-none hover:text-encre'}
        aria-label="Choisir la langue"
      >
        {LANGUES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
    </label>
  );
}
