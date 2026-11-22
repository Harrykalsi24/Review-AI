import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, EyeOff, Wifi, WifiOff, Trash2,
  Plus, GripVertical, ToggleLeft, ToggleRight, ExternalLink,
  Building2, Link2, Bot, Package, HelpCircle,
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
    setLocalProducts(p => [...p, { id, name: newProductName.trim(), icon: '🛒', enabled: true, order: p.length }]);
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

  const inputClass = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-700 bg-white";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
  const sectionClass = "bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-4 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-sm font-bold text-slate-800 pr-7">Admin Settings</h1>
        </div>
        {/* Tab bar */}
        <div className="flex border-t border-slate-100 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2.5 px-1 text-xs font-medium transition-colors border-b-2 ${
                  tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">

        {tab === 'business' && (
          <>
            <div className={sectionClass}>
              <h3 className="text-sm font-bold text-slate-800">Business Information</h3>
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
                <input className={inputClass} value={up.contactInfo} onChange={e => set('contactInfo', e.target.value)} placeholder="Phone, email..." />
              </div>
              <div>
                <label className={labelClass}>Logo URL</label>
                <input className={inputClass} value={up.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
                {up.logoUrl && <img src={up.logoUrl} alt="logo" className="mt-2 w-16 h-16 rounded-xl object-cover border border-slate-200" />}
              </div>
            </div>
          </>
        )}

        {tab === 'google' && (
          <div className={sectionClass}>
            <h3 className="text-sm font-bold text-slate-800">Google Review Settings</h3>
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
                className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                Test Review Link
              </button>
            )}
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
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
              <h3 className="text-sm font-bold text-slate-800">AI Provider Settings</h3>
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
                    className={`py-1.5 px-2 text-xs rounded-lg border text-left transition-colors ${
                      up.aiBaseUrl === p.base
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
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
                <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {testingApi ? 'Testing...' : <><Wifi className="w-4 h-4" />Test Connection</>}
              </button>
              <button
                onClick={() => { set('aiApiKey', ''); setApiStatus(null); }}
                className="flex items-center gap-1.5 py-2.5 px-3 border border-slate-200 text-slate-500 text-sm font-medium rounded-xl hover:bg-slate-50"
              >
                <Trash2 className="w-4 h-4" />Clear
              </button>
            </div>
            {apiStatus && (
              <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${apiStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {apiStatus.ok ? <Wifi className="w-4 h-4 mt-0.5" /> : <WifiOff className="w-4 h-4 mt-0.5" />}
                {apiStatus.message}
              </div>
            )}
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ Your API key is stored in your browser's local storage. Never share this device or its browser storage with untrusted users. For production use, store API keys in server-side environment variables.
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Product Categories</h3>
              <button onClick={resetProducts} className="text-xs text-slate-500 hover:text-slate-700 underline">Reset defaults</button>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProduct()}
                placeholder="New category name..."
              />
              <button onClick={addProduct} className="flex items-center gap-1 py-2.5 px-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {localProducts.sort((a, b) => a.order - b.order).map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-xl">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <ProductIcon iconName={p.icon || p.id} className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700">{p.name}</span>
                  <button onClick={() => toggleProduct(p.id)} className="text-slate-400 hover:text-blue-600">
                    {p.enabled ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-slate-300 hover:text-red-500">
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
              <h3 className="text-sm font-bold text-slate-800">Experience Options</h3>
              <button onClick={resetExperiences} className="text-xs text-slate-500 hover:text-slate-700 underline">Reset defaults</button>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={newExpLabel}
                onChange={e => setNewExpLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExp()}
                placeholder="New option label..."
              />
              <button onClick={addExp} className="flex items-center gap-1 py-2.5 px-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {localExperiences.sort((a, b) => a.order - b.order).map(e => (
                <div key={e.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-xl">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <span className="flex-1 text-sm text-slate-700">{e.label}</span>
                  <button onClick={() => toggleExp(e.id)} className="text-slate-400 hover:text-blue-600">
                    {e.enabled ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteExp(e.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>

      {/* Save button */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
        <motion.button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </motion.button>
      </div>
    </div>
  );
}
