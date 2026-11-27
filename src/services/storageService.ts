import type { AdminSettings, Product, ExperienceOption } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types';

const KEYS = {
  settings: 'me_settings',
  products: 'me_products',
  experiences: 'me_experiences',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asCappedString(value: unknown, fallback: string, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

function asHttpUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Private mode / full storage must never crash the kiosk.
    // eslint-disable-next-line no-console
    console.warn(`Could not save ${key} to local storage:`, err);
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** One validation pass for settings, used on load AND on save, so a
 *  tampered or oversized stored value can never be re-saved as-is. */
export function sanitizeSettings(s: AdminSettings): AdminSettings {
  return {
    businessName: asCappedString(s.businessName, DEFAULT_SETTINGS.businessName, 80),
    businessAddress: asCappedString(s.businessAddress, DEFAULT_SETTINGS.businessAddress, 120),
    businessDescription: asCappedString(
      s.businessDescription,
      DEFAULT_SETTINGS.businessDescription,
      300,
    ),
    contactInfo: asCappedString(s.contactInfo, DEFAULT_SETTINGS.contactInfo, 120),
    // Logo is a data URI or an http(s) URL; cap length (the embedded
    // default logo is ~47k) so a stored megabyte can't be re-saved.
    logoUrl: asCappedString(s.logoUrl, DEFAULT_SETTINGS.logoUrl, 200_000),
    googleReviewUrl: asHttpUrl(s.googleReviewUrl, DEFAULT_SETTINGS.googleReviewUrl),
    aiProvider: asCappedString(s.aiProvider, DEFAULT_SETTINGS.aiProvider, 40),
    aiApiKey: asCappedString(s.aiApiKey, DEFAULT_SETTINGS.aiApiKey, 200),
    aiBaseUrl: asHttpUrl(s.aiBaseUrl, DEFAULT_SETTINGS.aiBaseUrl),
    aiModel: asCappedString(s.aiModel, DEFAULT_SETTINGS.aiModel, 80),
    maxTokens: asNumber(s.maxTokens, DEFAULT_SETTINGS.maxTokens, 50, 1000),
    temperature: asNumber(s.temperature, DEFAULT_SETTINGS.temperature, 0, 2),
  };
}

function sanitizeProduct(p: Product | Record<string, unknown>): Product {
  const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
  return {
    id: asCappedString(p.id, '', 80),
    name: asCappedString(p.name, '', 80),
    icon: def ? def.icon : asCappedString(p.icon, 'Package', 40),
    enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
    order: asNumber(p.order, 0, 0, 1000),
  };
}

function sanitizeExperience(e: ExperienceOption | Record<string, unknown>): ExperienceOption {
  return {
    id: asCappedString(e.id, '', 80),
    label: asCappedString(e.label, '', 80),
    enabled: typeof e.enabled === 'boolean' ? e.enabled : true,
    order: asNumber(e.order, 0, 0, 1000),
  };
}

/** Dedupe by id, first entry wins, then sort by order. */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export const storageService = {
  getSettings(): AdminSettings {
    const parsed = parseJson(safeGet(KEYS.settings));
    if (!isRecord(parsed)) return { ...DEFAULT_SETTINGS };
    const logoUrl = asString(parsed.logoUrl, DEFAULT_SETTINGS.logoUrl);
    return sanitizeSettings({
      ...DEFAULT_SETTINGS,
      businessName: asString(parsed.businessName, DEFAULT_SETTINGS.businessName),
      businessAddress: asString(parsed.businessAddress, DEFAULT_SETTINGS.businessAddress),
      businessDescription: asString(
        parsed.businessDescription,
        DEFAULT_SETTINGS.businessDescription,
      ),
      contactInfo: asString(parsed.contactInfo, DEFAULT_SETTINGS.contactInfo),
      // Upgrade any stale or broken relative logo path to embedded LOGO_BASE64
      logoUrl:
        !logoUrl || logoUrl === '/logo.png' || logoUrl === 'logo.png'
          ? DEFAULT_SETTINGS.logoUrl
          : logoUrl,
      googleReviewUrl: asHttpUrl(parsed.googleReviewUrl, DEFAULT_SETTINGS.googleReviewUrl),
      aiProvider: asString(parsed.aiProvider, DEFAULT_SETTINGS.aiProvider),
      aiApiKey: asString(parsed.aiApiKey, DEFAULT_SETTINGS.aiApiKey),
      aiBaseUrl: asHttpUrl(parsed.aiBaseUrl, DEFAULT_SETTINGS.aiBaseUrl),
      aiModel: asString(parsed.aiModel, DEFAULT_SETTINGS.aiModel),
      maxTokens: asNumber(parsed.maxTokens, DEFAULT_SETTINGS.maxTokens, 50, 1000),
      temperature: asNumber(parsed.temperature, DEFAULT_SETTINGS.temperature, 0, 2),
    });
  },
  saveSettings(s: AdminSettings): void {
    safeSet(KEYS.settings, JSON.stringify(sanitizeSettings(s)));
  },
  getProducts(): Product[] {
    const parsed = parseJson(safeGet(KEYS.products));
    if (!Array.isArray(parsed)) return [...DEFAULT_PRODUCTS];
    const valid = parsed.filter(
      (p): p is Record<string, unknown> =>
        isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string',
    );
    if (valid.length === 0) return [...DEFAULT_PRODUCTS];
    // Deleted defaults stay deleted: the old code merged every missing
    // default back in, so the admin Delete button was undone on reload.
    return dedupeById(valid.map(sanitizeProduct)).sort((a, b) => a.order - b.order);
  },
  saveProducts(p: Product[]): void {
    safeSet(KEYS.products, JSON.stringify(dedupeById(p.map(sanitizeProduct))));
  },
  getExperiences(): ExperienceOption[] {
    const parsed = parseJson(safeGet(KEYS.experiences));
    if (!Array.isArray(parsed)) return [...DEFAULT_EXPERIENCES];
    const valid = parsed.filter(
      (e): e is Record<string, unknown> =>
        isRecord(e) && typeof e.id === 'string' && typeof e.label === 'string',
    );
    if (valid.length === 0) return [...DEFAULT_EXPERIENCES];
    return dedupeById(valid.map(sanitizeExperience)).sort((a, b) => a.order - b.order);
  },
  saveExperiences(e: ExperienceOption[]): void {
    safeSet(KEYS.experiences, JSON.stringify(dedupeById(e.map(sanitizeExperience))));
  },
};
