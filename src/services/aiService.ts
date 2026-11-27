import type { QuestionnaireData, ReviewLength, AdminSettings } from '../types/index.ts';
import { DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types/index.ts';
import { SYNTHETIC_REVIEWS_DATASET } from '../data/trainingDataset.ts';

/** One AI call may hang on a flaky kiosk network; fail fast and fall back. */
export const AI_REQUEST_TIMEOUT_MS = 20_000;
/** One retry, only for transient failures (timeout / network / 429 / 5xx). */
const AI_MAX_RETRIES = 1;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function getOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
}

/** Error that knows whether a retry could help. */
class AiRequestError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, opts: { status?: number; retryable?: boolean } = {}) {
    super(message);
    this.name = 'AiRequestError';
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AiRequestError) return err.retryable;
  if (err instanceof Error) {
    // Fetch throws TypeError on network failure; AbortError is a timeout here.
    if (err.name === 'AbortError') return true;
    if (/timed out/i.test(err.message)) return true;
    return err instanceof TypeError;
  }
  return false;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = AI_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AiRequestError(`AI request timed out after ${timeoutMs / 1000}s`, {
        retryable: true,
      });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Read an error body without crashing on HTML / empty / non-JSON responses. */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `API error ${res.status}`;
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        const err = (parsed as { error?: unknown }).error;
        if (typeof err === 'string' && err) return err;
        if (err && typeof err === 'object' && 'message' in err) {
          const msg = (err as { message?: unknown }).message;
          if (typeof msg === 'string' && msg) return msg;
        }
      }
      return `API error ${res.status}`;
    } catch {
      // Plain-text / HTML error page from a proxy or provider.
      return text.slice(0, 200).trim() || `API error ${res.status}`;
    }
  } catch {
    return `API error ${res.status}`;
  }
}

/** Read a success body without crashing on empty / non-JSON responses. */
async function readJsonSafely(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text();
    if (!text) return {};
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function buildChatHeaders(settings: AdminSettings): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // The key goes ONLY to a known direct provider host. A custom base URL
  // is a server-side proxy by design and needs no key — and sending the
  // key to an arbitrary admin-entered host would leak it. Hostname-based
  // on purpose: a substring check would trust agentrouter.org.evil.com.
  if (settings.aiApiKey && requiresDirectApiKey(settings.aiBaseUrl)) {
    headers['Authorization'] = `Bearer ${settings.aiApiKey}`;
  }
  if (settings.aiBaseUrl.includes('openrouter.ai')) {
    const origin = getOrigin();
    if (origin) headers['HTTP-Referer'] = origin;
    headers['X-Title'] = settings.businessName;
  }
  return headers;
}

const LENGTH_GUIDE: Record<ReviewLength, string> = {
  short: 'Keep it concise, approximately 25-45 words.',
  balanced: 'Keep it well-rounded, approximately 55-90 words.',
  detailed: 'Make it thorough and descriptive, approximately 95-140 words.',
};

const PERSONAS = [
  'Tone: Pragmatic and honest local resident who values good pricing and reliable electronics in Mukerian.',
  'Tone: Enthusiastic homeowner happy with smooth purchasing, clear explanations, and helpful store staff.',
  'Tone: Direct, concise shopper who appreciates straightforward transactions without hassle.',
  'Tone: Family-oriented buyer shopping for home appliances with careful attention to durability and service.',
  'Tone: Casual, conversational customer sharing a relaxed everyday shopping impression.',
  'Tone: Tech-minded buyer focused on product selection, genuine brands, and sound advice from the team.',
];

const OPENERS = [
  'Start naturally, e.g. "I visited this shop to get...", "Bought our...", or "Went in looking for..."',
  'Start like: "Recently got our... from here and everything was smooth."',
  'Start like: "Visited this store looking for...", talking about the helpful staff.',
  'Start like: "Picked up a... from here and had a great experience."',
  'Start like: "Checked out this electronics shop in Mukerian and found exactly what I needed."',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sanitizeUserInput(input?: string, maxLen = 80): string {
  if (!input) return '';
  return input
    .replace(/[<>{}[\]\\/`$]/g, '')
    .replace(/(ignore\s+(all\s+)?(previous|prior)|system:|assistant:|ignore\s+instructions)/gi, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Format product name into natural conversational noun (singular/mass where appropriate)
 */
export function formatProductNoun(name: string, withArticle = false): string {
  const lower = name.toLowerCase().trim();
  let base = name;

  if (!base.trim()) return base;

  // Map plural display labels to natural singular nouns
  if (lower === 'refrigerators') base = 'refrigerator';
  else if (lower === 'washing machines') base = 'washing machine';
  else if (lower === 'mobile phones') base = 'mobile phone';
  else if (lower === 'air conditioners') base = 'air conditioner';
  else if (lower === 'led tvs') base = 'LED TV';
  else if (lower === 'coolers') base = 'cooler';
  else if (lower === 'fans') base = 'fan';
  else if (lower === 'microwave ovens') base = 'microwave oven';
  else if (lower === 'water purifiers') base = 'water purifier';
  else if (lower === 'kitchen appliances') base = 'kitchen appliance';
  else if (lower === 'speakers') base = 'speaker system';

  if (!withArticle) return base;

  // Determine correct indefinite article: "a" vs "an"
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = base.trim()[0]?.toLowerCase();
  const startsWithVowelSound =
    vowels.includes(firstLetter) || /^led\b/i.test(base) || /^ac\b/i.test(base);

  return `${startsWithVowelSound ? 'an' : 'a'} ${base}`;
}

/**
 * Resolves the actual product names selected by the user.
 * CRITICAL FIX: When 'other' is selected, ONLY the custom product name is used.
 * The literal word "Other" is NEVER returned or combined with the custom name.
 */
export function resolveSelectedProductNames(
  selectedIds: string[],
  otherProductText?: string,
): string[] {
  const map = new Map(DEFAULT_PRODUCTS.map(p => [p.id, p.name]));
  const custom = sanitizeUserInput(otherProductText);
  const result: string[] = [];

  for (const id of selectedIds) {
    if (id === 'other') {
      if (custom && !result.includes(custom)) {
        result.push(custom);
      }
    } else {
      const name = map.get(id) || id;
      if (name.toLowerCase() !== 'other' && !result.includes(name)) {
        result.push(name);
      }
    }
  }

  return result;
}

/**
 * Resolves the experience highlights selected by the user.
 * The literal word "Other" is never returned if a custom highlight is entered.
 */
export function resolveSelectedExperienceLabels(
  selectedIds: string[],
  otherExpText?: string,
): string[] {
  const map = new Map(DEFAULT_EXPERIENCES.map(e => [e.id, e.label]));
  const custom = sanitizeUserInput(otherExpText);
  const result: string[] = [];

  for (const id of selectedIds) {
    if (id === 'other') {
      if (custom && !result.includes(custom)) {
        result.push(custom);
      }
    } else {
      const label = map.get(id) || id;
      if (label.toLowerCase() !== 'other' && !result.includes(label)) {
        result.push(label);
      }
    }
  }

  return result;
}

export function formatListForProse(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Maps product names to category labels in the training dataset.
 */
function mapToDatasetCategory(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes('fridge') || lower.includes('refrigerator')) return 'refrigerator';
  if (lower.includes('wash') || lower.includes('machine')) return 'washing_machine';
  if (
    lower.includes('phone') ||
    lower.includes('mobile') ||
    lower.includes('smartphone') ||
    lower.includes('redmi') ||
    lower.includes('iphone') ||
    lower.includes('samsung')
  ) {
    return 'smartphone';
  }
  if (lower.includes('ac') || lower.includes('air condition') || lower.includes('cooling')) {
    return 'air_conditioner';
  }
  if (lower.includes('tv') || lower.includes('television') || lower.includes('led')) {
    return 'television';
  }
  if (lower.includes('cooler')) return 'cooler';
  if (lower.includes('fan')) return 'ceiling_fan';
  if (lower.includes('micro') || lower.includes('oven')) return 'microwave';
  if (lower.includes('purifier') || lower.includes('water') || lower.includes('ro')) {
    return 'water_purifier';
  }
  if (
    lower.includes('speaker') ||
    lower.includes('soundbar') ||
    lower.includes('theatre') ||
    lower.includes('theater') ||
    lower.includes('audio') ||
    lower.includes('bluetooth')
  ) {
    return 'speakers';
  }
  return 'general';
}

/**
 * Retrieves reference writing samples from the JSON dataset for few-shot prompt guidance.
 * CRITICAL: Returns ONLY clean review text. Never exposes synthetic IDs or internal metadata.
 */
export function getReferenceReviews(
  productNames: string[],
  starRating: number,
  maxCount = 2,
): string[] {
  const targetSentiment = starRating <= 3 ? 'neutral' : 'positive';
  const categories = productNames.map(mapToDatasetCategory);

  const categoryMatched = SYNTHETIC_REVIEWS_DATASET.reviews.filter(
    r => r.sentiment === targetSentiment && categories.includes(r.category),
  );

  const fallbackSentimentMatched = SYNTHETIC_REVIEWS_DATASET.reviews.filter(
    r => r.sentiment === targetSentiment,
  );

  const pool = categoryMatched.length >= maxCount ? categoryMatched : fallbackSentimentMatched;
  if (!pool || pool.length === 0) return [];

  const shuffled = [...pool];
  // Fisher-Yates: the old sort(() => 0.5 - Math.random()) was biased.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, maxCount).map(s => s.review);
}

/**
 * Removes any synthetic IDs, sample codes (ME-001), or accidental "Other <Product>" artifacts.
 */
export function sanitizeGeneratedReviewText(text: string, customProductName?: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/\[\s*(?:record|sample|dataset\s+)?(?:ID\s*[:#]?\s*)?ME-\d{2,4}\s*\]/gi, '')
    .replace(/\(\s*(?:record|sample|dataset\s+)?(?:ID\s*[:#]?\s*)?ME-\d{2,4}\s*\)/gi, '')
    .replace(/\(\s*(?:record|sample|dataset)\s+ID\s*[:#]?\s*[A-Z0-9_-]*\s*\)/gi, '')
    .replace(/\bME-\d{2,4}\b/gi, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\bVariation\s+ID\s*#?\s*\d+\b/gi, '')
    .replace(/\b(sample|record|dataset)\s+ID\s*[:#]?\s*[A-Z0-9_-]+/gi, '')
    .replace(/^["'`\s]+|["'`\s]+$/g, '');

  if (customProductName) {
    const escaped = customProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\bOther\\s+(${escaped})\\b`, 'gi');
    cleaned = cleaned.replace(regex, '$1');
  }

  // Strip accidental "Other <CapitalizedProduct>"
  cleaned = cleaned
    .replace(/\bOther\s+([A-Z][a-zA-Z0-9_\s]{2,})/g, '$1')
    .replace(/\bOther\s*,\s*/gi, '')
    .replace(/\s*,\s*Other\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned;
}

function buildPrompt(data: QuestionnaireData, length: ReviewLength, businessName: string): string {
  const productNames = resolveSelectedProductNames(data.selectedProducts, data.otherProductText);
  const experienceLabels = resolveSelectedExperienceLabels(data.selectedExperiences, data.otherExperienceText);

  const productStr = productNames.length > 0
    ? productNames.map(p => formatProductNoun(p, false)).join(', ')
    : 'electronics';
  const highlightsStr = experienceLabels.length > 0 ? formatListForProse(experienceLabels) : '';

  const referenceSamples = getReferenceReviews(productNames, data.starRating || 5, 2);

  const parts: string[] = [];
  parts.push(`Product(s) purchased / viewed: ${productStr}`);
  if (highlightsStr) {
    parts.push(`Positive highlights: ${highlightsStr}`);
  }
  if (data.starRating) {
    parts.push(`Star rating: ${data.starRating} out of 5 stars`);
  }

  const chosenPersona = getRandomItem(PERSONAS);
  const chosenOpener = getRandomItem(OPENERS);

  const referenceSection =
    referenceSamples.length > 0
      ? `Reference writing samples (genuine customer style for natural Indian electronics store tone, length, and sentence rhythm - do NOT copy verbatim):\n${referenceSamples.map((s, i) => `Sample ${i + 1}: "${s}"`).join('\n')}\n`
      : '';

  return `You are helping a real customer write their personal Google review for ${businessName}, an electronics and appliance shop in Mukerian, Punjab, India.

Customer selection:
${parts.join('\n')}

${referenceSection}
Style & Generation Guidelines:
- NATURAL HUMAN VOICE: Write naturally and casually like an everyday customer posting on Google Maps in India. Use simple, natural everyday words. NEVER use stiff, heavy, or formal vocabulary like "courteous", "dependable", "exemplary", "transparent", or "commendable". Use simple conversational words like "polite", "helpful", "friendly", "honest", "nice", or "good".
- NEVER USE THE WORD "OTHER": The customer purchased/looked at "${productStr}". Use ONLY this exact product name. NEVER prefix it with "Other" or write "Other ${productStr}".
- NEVER OUTPUT SYNTHETIC IDS: Never output any IDs, dataset labels, reference codes (such as "ME-001"), or technical numbers.
- AVOID REPETITIVE BOILERPLATE: Avoid repeated phrases like "Great experience overall", "Outstanding service", or identical formulaic sentences.
- STORE NAME USAGE: DO NOT repeat "${businessName}" continuously. Refer to it naturally as "this shop", "here", "the store", or "${businessName}".
- ${data.starRating <= 3 ? 'Maintain a polite, honest, and grounded tone focused on browsing, inquiring, or comparing options.' : 'Express genuine customer satisfaction with practical, authentic appreciation.'}
- ${chosenPersona}
- ${chosenOpener}
- ${LENGTH_GUIDE[length]}
- Write in first person ("I" or "We") with natural conversational phrasing.
- Output ONLY the review text. No quotation marks, no headings, no labels.`;
}

/**
 * Builds grammatically flawless and natural sentences for single or multiple experience highlights.
 */
function buildExperienceSentence(expLabels: string[]): string {
  if (expLabels.length === 0) {
    const defaults = [
      'The staff explained the features clearly and answered all questions.',
      'Staff were polite and gave me enough time to decide.',
      'Staff were very helpful and the buying process was smooth.',
      'The buying process was easy and the staff was very cooperative.',
    ];
    return getRandomItem(defaults);
  }

  const isMultiple = expLabels.length > 1;
  const listStr = formatListForProse(expLabels.map(l => l.toLowerCase()));

  // Check if subject is compound (multiple items or containing 'and')
  const isCompoundSubject = isMultiple || listStr.includes(' and ');

  const singleTemplates = [
    `Really appreciated their ${listStr}.`,
    `What stood out was the ${listStr}.`,
    `Staff were friendly and their ${listStr} made the choice much easier.`,
    `They provided helpful guidance on ${listStr} without any pressure.`,
    `The ${listStr} ${isCompoundSubject ? 'were' : 'was'} very helpful.`,
  ];

  const multipleTemplates = [
    `Really appreciated their ${listStr}.`,
    `What stood out most was their ${listStr}.`,
    `Staff were friendly and their ${listStr} made the whole shopping trip easy.`,
    `They provided clear information on ${listStr} without any pressure.`,
    `Their ${listStr} ${isCompoundSubject ? 'were' : 'was'} really helpful.`,
  ];

  return getRandomItem(isMultiple ? multipleTemplates : singleTemplates);
}

// Highly varied offline generator inspired by dataset styles
export function generateLocalFallbackReview(
  data: QuestionnaireData,
  length: ReviewLength,
  businessName: string,
): string {
  const productNames = resolveSelectedProductNames(data.selectedProducts, data.otherProductText);
  const expLabels = resolveSelectedExperienceLabels(data.selectedExperiences, data.otherExperienceText);

  // Natural product string formatting
  let productDisplay = '';
  let singleProductWithArticle = '';

  if (productNames.length === 0) {
    productDisplay = 'electronics';
    singleProductWithArticle = 'electronics';
  } else if (productNames.length === 1) {
    const noun = formatProductNoun(productNames[0], false);
    singleProductWithArticle = formatProductNoun(productNames[0], true);
    productDisplay = noun;
  } else {
    // Multiple products
    const formattedList = formatListForProse(
      productNames.map(p => formatProductNoun(p, false)),
    );
    const multiPhrases = [
      formattedList,
      `home appliances including ${formatProductNoun(productNames[0], false)}`,
      formattedList,
    ];
    productDisplay = getRandomItem(multiPhrases);
    singleProductWithArticle = formattedList;
  }

  const stars = data.starRating || 5;

  const storeReferences = [
    'this shop',
    'here',
    'this store',
    'Modern Electronics',
    'this showroom in Mukerian',
    businessName,
  ];
  const pickedStore = getRandomItem(storeReferences);
  const pickedExp = buildExperienceSentence(expLabels);

  let review = '';

  // Neutral / lower star ratings (inspired by ME-021 to ME-038)
  if (stars <= 3) {
    const neutralTemplates = [
      `Visited ${pickedStore} to check options for ${productDisplay}. Staff were polite and answered my questions. Still comparing before making a final decision.`,
      `Checked a couple of ${productDisplay} models here. The staff explained the differences. Decent store with a fair collection.`,
      `Went in to ask about ${productDisplay} and available options. Got the basic details and pricing. A useful visit.`,
      `The store had several ${productDisplay} choices on display. I am still comparing prices, but the information provided was helpful.`,
      `Visited ${pickedStore} to inquire about ${productDisplay}. My questions were answered properly, though I did not purchase that day.`,
    ];
    review = getRandomItem(neutralTemplates);
  } else if (length === 'short') {
    const shortTemplates = [
      `Bought ${singleProductWithArticle} from ${pickedStore}. Staff explained the features clearly and helped me choose. Smooth purchase.`,
      `Purchased ${singleProductWithArticle} here. The buying process was easy and pricing was reasonable. Happy with the service.`,
      `Good experience. Went in for ${productDisplay} and got proper information without being rushed. Satisfied with the purchase.`,
      `Got our ${productDisplay} from ${pickedStore}. Helpful people and a smooth transaction. Would recommend.`,
      `Picked up ${singleProductWithArticle} here recently. Polite staff and good local service in Mukerian.`,
      `Needed ${singleProductWithArticle} and found a suitable model here. Quick billing and polite behavior. Nice store.`,
    ];
    review = getRandomItem(shortTemplates);
  } else if (length === 'balanced') {
    const balancedTemplates = [
      `Bought ${singleProductWithArticle} from Modern Electronics. The staff explained the features clearly and helped me compare different options. ${pickedExp} Delivery and billing were completely hassle-free.`,
      `We needed ${singleProductWithArticle} for our home and stopped by ${pickedStore}. Very happy with the purchase. ${pickedExp} Honest pricing and very friendly people to deal with.`,
      `Good experience shopping for ${productDisplay} here. The team showed available models without rushing me. ${pickedExp} Everything was handled smoothly and I'm happy with how it turned out.`,
      `Got our ${productDisplay} from ${pickedStore}. They had good options in our budget and explained the warranty details clearly. ${pickedExp} A reliable local electronics shop.`,
      `Visited ${pickedStore} looking for ${productDisplay}. ${pickedExp} The purchase was simple and the staff guided us well based on our actual requirements.`,
    ];
    review = getRandomItem(balancedTemplates);
  } else {
    // Detailed
    const detailedTemplates = [
      `We visited ${pickedStore} looking for ${productDisplay} and had a genuinely good experience. The staff took the time to explain the features and helped us compare a couple of models based on our requirements. ${pickedExp} The entire buying process from selection to billing was clean and smooth. Really glad to have a reliable store like this in Mukerian.`,
      `Purchased our new ${productDisplay} from Modern Electronics recently. The team answered all our questions patiently and didn't just push the most expensive option. ${pickedExp} Delivery was on time and the product arrived in perfect condition. Polite staff and fair prices throughout.`,
      `I stopped by ${pickedStore} to purchase ${singleProductWithArticle} after checking different showrooms. The options here were well organized and the advice was practical and simple. ${pickedExp} Good customer support, genuine products, and very helpful staff. Definitely satisfied with my purchase.`,
      `Needed ${singleProductWithArticle} for our house and visited Modern Electronics. The person attending us explained the different functions and maintenance tips in simple language. ${pickedExp} No confusing sales talk, just honest guidance and prompt service. Very pleased with the overall experience.`,
    ];
    review = getRandomItem(detailedTemplates);
  }

  const customText = data.otherProductText?.trim();
  return sanitizeGeneratedReviewText(review, customText);
}

const DIRECT_KEY_HOSTS = [
  'agentrouter.org',
  'api.openai.com',
  'openrouter.ai',
  'api.groq.com',
  'generativelanguage.googleapis.com',
];

function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl.trim()).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function requiresDirectApiKey(baseUrl: string): boolean {
  const host = hostOf(baseUrl);
  return DIRECT_KEY_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

export async function generateReview(
  data: QuestionnaireData,
  length: ReviewLength,
  settings: AdminSettings,
  onError?: (msg: string) => void,
): Promise<{ text: string; isFallback?: boolean }> {
  const prompt = buildPrompt(data, length, settings.businessName);
  const customText = data.otherProductText?.trim();
  const fallback = (): { text: string; isFallback: boolean } => ({
    text: generateLocalFallbackReview(data, length, settings.businessName),
    isFallback: true,
  });

  if (!settings.aiBaseUrl || (!settings.aiApiKey && requiresDirectApiKey(settings.aiBaseUrl))) {
    return fallback();
  }

  const url = `${normalizeBaseUrl(settings.aiBaseUrl)}/chat/completions`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildChatHeaders(settings),
        body: JSON.stringify({
          model: settings.aiModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: settings.maxTokens,
          // Respect the admin setting (clamped to 0–2); the old code
          // silently forced 0.7–1.0 whatever the admin chose.
          temperature: Math.min(2, Math.max(0, settings.temperature ?? 0.8)),
        }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new AiRequestError(msg, {
          status: res.status,
          retryable: res.status === 429 || res.status >= 500,
        });
      }

      const json = await readJsonSafely(res);
      const choices = Array.isArray(json.choices) ? json.choices : [];
      const first = choices[0] as { message?: { content?: unknown } } | undefined;
      const rawContent = typeof first?.message?.content === 'string'
        ? first.message.content.trim()
        : '';
      if (!rawContent) throw new AiRequestError('Empty response from AI', { retryable: true });

      const sanitized = sanitizeGeneratedReviewText(rawContent, customText);
      return { text: sanitized, isFallback: false };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!isRetryable(err) || attempt >= AI_MAX_RETRIES) break;
      await sleep(500 * (attempt + 1));
    }
  }

  onError?.(lastError?.message ?? 'AI request failed');
  return fallback();
}

export async function testApiConnection(settings: AdminSettings): Promise<{ ok: boolean; message: string }> {
  if (!settings.aiBaseUrl) return { ok: false, message: 'API base URL is empty.' };
  if (!settings.aiApiKey && requiresDirectApiKey(settings.aiBaseUrl)) {
    return { ok: false, message: 'API key is empty. Use a server-side proxy URL or enter a key.' };
  }
  try {
    const res = await fetchWithTimeout(
      `${normalizeBaseUrl(settings.aiBaseUrl)}/chat/completions`,
      {
        method: 'POST',
        headers: buildChatHeaders(settings),
        body: JSON.stringify({
          model: settings.aiModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      },
    );
    if (res.ok) return { ok: true, message: 'Connection successful! API is working.' };
    return { ok: false, message: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' };
  }
}
