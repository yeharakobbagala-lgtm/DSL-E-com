import { en } from './en';
import { si } from './si';
import { ta } from './ta';

export type LanguageCode = 'en' | 'si' | 'ta';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇱🇰' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en,
  si,
  ta,
};

export type TranslationKey = keyof typeof en;
