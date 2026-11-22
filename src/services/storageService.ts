import type { AdminSettings, Product, ExperienceOption } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types';

const KEYS = {
  settings: 'me_settings',
  products: 'me_products',
  experiences: 'me_experiences',
} as const;

export const storageService = {
  getSettings(): AdminSettings {
    try {
      const raw = localStorage.getItem(KEYS.settings);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      const rawUrl = parsed.googleReviewUrl;
      const validUrl = rawUrl && rawUrl.includes('modern+electronics') ? rawUrl : DEFAULT_SETTINGS.googleReviewUrl;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        googleReviewUrl: validUrl,
        aiApiKey: parsed.aiApiKey || DEFAULT_SETTINGS.aiApiKey,
        aiBaseUrl: parsed.aiBaseUrl || DEFAULT_SETTINGS.aiBaseUrl,
        aiModel: parsed.aiModel || DEFAULT_SETTINGS.aiModel,
      };
    } catch { return { ...DEFAULT_SETTINGS }; }
  },
  saveSettings(s: AdminSettings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  },
  getProducts(): Product[] {
    try {
      const raw = localStorage.getItem(KEYS.products);
      if (!raw) return [...DEFAULT_PRODUCTS];
      const parsed: Product[] = JSON.parse(raw);
      return parsed.map(p => {
        const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
        return def ? { ...p, icon: def.icon } : p;
      });
    } catch { return [...DEFAULT_PRODUCTS]; }
  },
  saveProducts(p: Product[]): void {
    localStorage.setItem(KEYS.products, JSON.stringify(p));
  },
  getExperiences(): ExperienceOption[] {
    try {
      const raw = localStorage.getItem(KEYS.experiences);
      return raw ? JSON.parse(raw) : [...DEFAULT_EXPERIENCES];
    } catch { return [...DEFAULT_EXPERIENCES]; }
  },
  saveExperiences(e: ExperienceOption[]): void {
    localStorage.setItem(KEYS.experiences, JSON.stringify(e));
  },
};
