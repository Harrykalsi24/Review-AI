import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from './storageService';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '../types';

function installStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const stub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: stub,
    configurable: true,
  });
  return store;
}

describe('storageService.getSettings', () => {
  beforeEach(() => installStorage());

  it('returns defaults when storage is empty or corrupt', () => {
    expect(storageService.getSettings().businessName).toBe('Modern Electronics');
    installStorage({ me_settings: '{not json' });
    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS);
    installStorage({ me_settings: '"just a string"' });
    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps numbers and rejects non-HTTP URLs and wrong types', () => {
    installStorage({
      me_settings: JSON.stringify({
        businessName: 'My Shop',
        maxTokens: 99999,
        temperature: -5,
        googleReviewUrl: 'not a url',
        aiApiKey: 123,
      }),
    });
    const s = storageService.getSettings();
    expect(s.businessName).toBe('My Shop');
    expect(s.maxTokens).toBe(1000);
    expect(s.temperature).toBe(0);
    expect(s.googleReviewUrl).toBe(DEFAULT_SETTINGS.googleReviewUrl);
    expect(s.aiApiKey).toBe('');
  });

  it('accepts a proper Google review link (previously silently discarded)', () => {
    installStorage({
      me_settings: JSON.stringify({
        googleReviewUrl: 'https://g.page/r/abc123/review',
      }),
    });
    expect(storageService.getSettings().googleReviewUrl).toBe(
      'https://g.page/r/abc123/review',
    );
  });
});

describe('storageService.getProducts', () => {
  beforeEach(() => installStorage());

  it('returns defaults on corrupt data; deleted defaults stay deleted', () => {
    installStorage({ me_products: 'garbage' });
    expect(storageService.getProducts()).toEqual(DEFAULT_PRODUCTS);

    installStorage({
      me_products: JSON.stringify([
        { id: 'mobiles', name: 'Mobile Phones', icon: 'Smartphone', enabled: true, order: 0 },
        { id: 'mobiles', name: 'Mobile Phones duplicate', icon: 'Smartphone', enabled: true, order: 1 },
        { id: 'junk' },
        'not an object',
      ]),
    });
    const products = storageService.getProducts();
    expect(products.map(p => p.id)).toEqual(['mobiles']);
    // No defaults are merged back in: deleting one in admin used to be
    // undone on reload by the merge.
    expect(products.length).toBe(1);
  });
});

describe('storageService saves', () => {
  it('sanitizes on save: caps oversized text', () => {
    const store = installStorage();
    storageService.saveSettings({
      ...DEFAULT_SETTINGS,
      businessName: 'x'.repeat(500),
    });
    const saved = JSON.parse(store.get('me_settings') ?? '{}') as {
      businessName: string;
    };
    expect(saved.businessName.length).toBe(80);
  });

  it('never throws when localStorage is unavailable (private mode / full)', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
      configurable: true,
    });
    expect(() => storageService.saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => storageService.saveProducts(DEFAULT_PRODUCTS)).not.toThrow();
    expect(storageService.getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
