import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, EyeOff, Wifi, WifiOff, Trash2,
  Plus, GripVertical, ToggleLeft, ToggleRight, ExternalLink,
  Building2, Link2, Bot, Package, HelpCircle, AlertCircle,
} from 'lucide-react';
import ProductIcon from '../components/ProductIcon';
import { testApiConnection } from '../services/aiService';
import type { AdminSettings, Product, ExperienceOption } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types';

interface Props {
  settings: AdminSettings;
  products: Product[];
  experiences: ExperienceOption[];
  onSaveSettings: (s: AdminSettings) => void;
  onSaveProducts: (p: Product[]) => void;
  onSaveExperiences: (e: ExperienceOption[]) => void;
  onBack: () => void;
}

type Tab = 'business' | 'google' | 'ai' | 'products' | 'questionnaire';

export default function AdminPage({
  settings, products, experiences,
  onSaveSettings, onSaveProducts, onSaveExperiences, onBack,
}: Props) {
  const [localSettings, setLocalSettings] = useState<AdminSettings>({ ...settings });
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [localExperiences, setLocalExperiences] = useState<ExperienceOption[]>([...experiences]);
  const [tab, setTab] = useState<Tab>('business');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newExpLabel, setNewExpLabel] = useState('');

  const handleSave = () => {
    onSaveSettings(localSettings);
    onSaveProducts(localProducts);
    onSaveExperiences(localExperiences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatus(null);
    const result = await testApiConnection(localSettings);
    setApiStatus(result);
    setTestingApi(false);
  };

  const toggleProduct = (id: string) => {
    setLocalProducts(p => p.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };
  const deleteProduct = (id: string) => {
    setLocalProducts(p => p.filter(x => x.id !== id));
  };
  const addProduct = () => {
    if (!newProductName.trim()) return;
    const id = newProductName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setLocalProducts(p => [...p, { id, name: newProductName.trim(), icon: 'Package', enabled: true, order: p.length }]);
    setNewProductName('');
  };
  const resetProducts = () => setLocalProducts([...DEFAULT_PRODUCTS]);

  const toggleExp = (id: string) => {
    setLocalExperiences(e => e.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };
  const deleteExp = (id: string) => {
    setLocalExperiences(e => e.filter(x => x.id !== id));
  };
  const addExp = () => {
    if (!newExpLabel.trim()) return;
    const id = newExpLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setLocalExperiences(e => [...e, { id, label: newExpLabel.trim(), enabled: true, order: e.length }]);
    setNewExpLabel('');
  };
  const resetExperiences = () => setLocalExperiences([...DEFAULT_EXPERIENCES]);

  const up = localSettings;
  const set = (key: keyof AdminSettings, val: any) => setLocalSettings(s => ({ ...s, [key]: val }));

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'google', label: 'Google', icon: Link2 },
    { id: 'ai', label: 'AI', icon: Bot },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'questionnaire', label: 'Questions', icon: HelpCircle },
  ];

  const inputClass = "field w-full px-3 py-2.5 text-sm text-ink placeholder:text-muted";
  const labelClass = "block text-sm font-medium text-ink-2 mb-1.5";
  const sectionClass = "content-card p-5 flex flex-col gap-4";

  return (
    <div className="min-h-screen flex flex-col pt-24">
      {/* Floating glass toolbar: back + title. */}
      <header className="glass-toolbar glass-toolbar--fixed glass-sheen" data-refract>
        <div className="glass-toolbar__content">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="glass-toolbar__btn"
              aria-label="Back to review form"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="glass-toolbar__brand text-base truncate">Admin Settings</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
        {/* Tabs: flat, on an opaque card — settings navigation is content,
            not chrome, so it stays flat like iOS Settings. */}
        <div className="content-card flex px-2 sm:px-4">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  tab === t.id ? 'border-accent-deep text-accent-deep' : 'border-transparent text-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'business' && (
          <>
            <div className={sectionClass}>
              <h3 className="text-sm font-medium text-ink">Business Information</h3>
              <div>
                <label className={labelClass}>Business Name</label>
                <input className={inputClass} value={up.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Modern Electronics" />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input className={inputClass} value={up.businessAddress} onChange={e => set('businessAddress', e.target.value)} placeholder="Mukerian, Punjab, India" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={2} value={up.businessDescription} onChange={e => set('businessDescription', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Contact Info</label>
                <input className={inputClass} value={up.contactInfo} onChange={e => set('contactInfo', e.target.value)} placeholder="Phone, email" />
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input className={inputClass} value={up.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
                {up.logoUrl && <img src={up.logoUrl} alt="logo" className="mt-2 w-16 h-16 rounded-lg object-cover border border-rule" />}
              </div>
            </div>
          </>
        )}

        {tab === 'google' && (
          <div className={sectionClass}>
            <h3 className="text-sm font-medium text-ink">Google Review Settings</h3>
            <div>
              <label className={labelClass}>Google Review URL</label>
              <input
                className={inputClass}
                value={up.googleReviewUrl}
                onChange={e => set('googleReviewUrl', e.target.value)}
                placeholder="https://g.page/r/YOUR_BUSINESS_ID/review"
              />
            </div>
            {up.googleReviewUrl && (
              <button
                onClick={() => window.open(up.googleReviewUrl, '_blank', 'noopener')}
                className="flex items-center gap-2 text-sm text-accent-deep font-medium hover:text-accent"
              >
                <ExternalLink className="w-4 h-4" />
                Test Review Link
              </button>
            )}
            <div className="content-card-inner p-3 text-sm text-ink-2 leading-relaxed">
              <p className="font-semibold mb-1">How to get your Google Review link:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Search for your business on Google Maps</li>
                <li>Click on your business listing</li>
                <li>Click "Reviews" then "Write a review"</li>
                <li>Copy the URL from the address bar</li>
                <li>Paste it above</li>
              </ol>
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">AI Provider Settings</h3>
            </div>
            <div>
              <label className={labelClass}>Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'AgentRouter', base: 'https://agentrouter.org/v1', model: 'gpt-4o-mini' },
                  { label: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
                  { label: 'OpenAI Direct', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
                  { label: 'Groq Cloud', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      set('aiBaseUrl', p.base);
                      set('aiModel', p.model);
                    }}
                    className={`chip py-1.5 px-2 text-xs text-left transition-colors ${
                      up.aiBaseUrl === p.base
                        ? 'text-accent-deep font-medium'
                        : 'text-muted'
                    }`}
                    aria-pressed={up.aiBaseUrl === p.base}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>API Base URL</label>
              <input className={inputClass} value={up.aiBaseUrl} onChange={e => set('aiBaseUrl', e.target.value)} placeholder="https://agentrouter.org/v1" />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input className={inputClass} value={up.aiModel} onChange={e => set('aiModel', e.target.value)} placeholder="gpt-4o-mini" />
            </div>
            <div>
              <label className={labelClass}>API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  className={inputClass + ' pr-10'}
                  value={up.aiApiKey}
                  onChange={e => set('aiApiKey', e.target.value)}
                  placeholder="sk-..."
                />
                <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max Tokens</label>
                <input type="number" className={inputClass} value={up.maxTokens} onChange={e => set('maxTokens', Number(e.target.value))} min={50} max={1000} />
              </div>
              <div>
                <label className={labelClass}>Temperature</label>
                <input type="number" className={inputClass} value={up.temperature} onChange={e => set('temperature', Number(e.target.value))} min={0} max={2} step={0.1} />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTestApi}
                disabled={testingApi}
                className="glass-btn glass-btn--prominent flex-1"
              >
                {testingApi ? 'Testing...' : <><Wifi className="w-4 h-4" />Test Connection</>}
              </button>
              <button
                onClick={() => { set('aiApiKey', ''); setApiStatus(null); }}
                className="glass-btn"
              >
                <Trash2 className="w-4 h-4" />Clear
              </button>
            </div>
            {apiStatus && (
              <div className={`content-card-inner flex items-start gap-2 p-3 text-sm ${apiStatus.ok ? 'text-success' : 'text-error'}`}>
                {apiStatus.ok ? <Wifi className="w-4 h-4 mt-0.5" /> : <WifiOff className="w-4 h-4 mt-0.5" />}
                {apiStatus.message}
              </div>
            )}
            <div className="content-card-inner p-3 text-sm text-ink-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <span>Your API key is stored in your browser local storage. Never share this device or its browser storage with untrusted users. For production use, store API keys in server-side environment variables.</span>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">Product Categories</h3>
              <button onClick={resetProducts} className="text-xs text-muted hover:text-ink underline">Reset defaults</button>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProduct()}
                placeholder="New category name"
              />
              <button onClick={addProduct} className="glass-btn glass-btn--prominent glass-btn--icon" aria-label="Add category">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[...localProducts].sort((a, b) => a.order - b.order).map(p => (
                <div key={p.id} className="content-card-inner flex items-center gap-3 py-2 px-3">
                  <GripVertical className="w-4 h-4 text-rule-2" />
                  <ProductIcon iconName={p.icon || p.id} className="w-4 h-4 text-muted shrink-0" />
                  <span className="flex-1 text-sm text-ink">{p.name}</span>
                  <button onClick={() => toggleProduct(p.id)} className="text-muted hover:text-accent-deep" aria-label={`${p.enabled ? 'Disable' : 'Enable'} ${p.name}`}>
                    {p.enabled ? <ToggleRight className="w-5 h-5 text-accent-deep" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-rule-2 hover:text-error" aria-label={`Delete ${p.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'questionnaire' && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">Experience Options</h3>
              <button onClick={resetExperiences} className="text-xs text-muted hover:text-ink underline">Reset defaults</button>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newExpLabel}
                onChange={e => setNewExpLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExp()}
                placeholder="New option label"
              />
              <button onClick={addExp} className="glass-btn glass-btn--prominent glass-btn--icon" aria-label="Add option">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[...localExperiences].sort((a, b) => a.order - b.order).map(e => (
                <div key={e.id} className="content-card-inner flex items-center gap-3 py-2 px-3">
                  <GripVertical className="w-4 h-4 text-rule-2" />
                  <span className="flex-1 text-sm text-ink">{e.label}</span>
                  <button onClick={() => toggleExp(e.id)} className="text-muted hover:text-accent-deep" aria-label={`${e.enabled ? 'Disable' : 'Enable'} ${e.label}`}>
                    {e.enabled ? <ToggleRight className="w-5 h-5 text-accent-deep" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteExp(e.id)} className="text-rule-2 hover:text-error" aria-label={`Delete ${e.label}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* Save bar: floating glass surface, bottom edge. The button inside
          is the plain variant — no glass on glass. */}
      <div
        className="glass-surface glass-sheen z-40 w-[min(calc(100%-32px),768px)] p-2"
        style={{ position: 'fixed', bottom: 16, left: '50%', translate: '-50% 0' }}
        data-refract
      >
        <motion.button
          onClick={handleSave}
          className={`glass-btn glass-btn--plain w-full ${saved ? '' : 'glass-btn--prominent'}`}
          style={saved ? { background: 'var(--glass-switch-on)', color: '#fff' } : undefined}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved' : 'Save settings'}
        </motion.button>
      </div>
    </div>
  );
}
