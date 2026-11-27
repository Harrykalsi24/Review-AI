/**
 * Minimal typings for the vendored liquid-glass.js engine
 * (jcm-developer/liquid-glass-components v2.1.0). The script exposes a
 * single global; init() is safe to call again after React renders new
 * markup, already-initialised elements are skipped.
 */
declare global {
  interface Window {
    LiquidGlass?: {
      init: (root?: ParentNode) => void;
      select: (container: HTMLElement, target: number | HTMLElement) => void;
      refresh: (el: HTMLElement) => void;
      readonly supported: boolean;
    };
  }
}

/* Side-effect import of the engine's .js file. */
declare module '*.js';

export {};
