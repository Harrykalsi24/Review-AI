import type { QuestionnaireData, ReviewLength, AdminSettings } from '../types/index.ts';
import { DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types/index.ts';
import { SYNTHETIC_REVIEWS_DATASET } from '../data/trainingDataset.ts';

const LENGTH_GUIDE: Record<ReviewLength, string> = {
  short: 'Keep it concise, approximately 25-45 words.',
  balanced: 'Keep it well-rounded, approximately 55-90 words.',
  detailed: 'Make it thorough and descriptive, approximately 95-140 words.',
};

const PERSONAS = [
  'Tone: Pragmatic and honest local resident who values getting good value and reliable electronics in Mukerian.',
  'Tone: Enthusiastic homeowner happy with smooth purchasing, clear explanations, and helpful store staff.',
  'Tone: Direct, concise shopper who appreciates straightforward transactions without hassle.',
  'Tone: Family-oriented buyer shopping for home appliances with careful attention to durability and service.',
  'Tone: Casual, conversational customer sharing a relaxed everyday shopping impression.',
  'Tone: Tech-minded buyer focused on product selection, genuine brands, and sound advice from the team.',
];

const OPENERS = [
  'Start naturally, e.g. "I visited this shop to get...", "Bought our...", or "Went in looking for..."',
  'Start like: "Recently got our... from here and everything was smooth."',
  'Start like: "Visited this store yesterday looking for...", talking about the helpful staff.',
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

  // Shuffle and pick maxCount
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxCount).map(s => s.review);
}

/**
 * Removes any synthetic IDs, sample codes (ME-001), or accidental "Other <Product>" artifacts.
 */
export function sanitizeGeneratedReviewText(text: string, customProductName?: string): string {
  if (!text) return '';
  let cleaned = text
    // Strip parenthesized/bracketed sample/record/dataset/synthetic IDs
    .replace(/\[\s*(?:record|sample|dataset\s+)?(?:ID\s*[:#]?\s*)?ME-\d{2,4}\s*\]/gi, '')
    .replace(/\(\s*(?:record|sample|dataset\s+)?(?:ID\s*[:#]?\s*)?ME-\d{2,4}\s*\)/gi, '')
    .replace(/\(\s*(?:record|sample|dataset)\s+ID\s*[:#]?\s*[A-Z0-9_-]*\s*\)/gi, '')
    // Strip bare synthetic dataset IDs e.g. ME-001, ME-038
    .replace(/\bME-\d{2,4}\b/gi, '')
    // Strip leftover empty brackets/parentheses
    .replace(/\[\s*\]/g, '')
    .replace(/\(\s*\)/g, '')
    // Strip any internal reference labels
    .replace(/\bVariation\s+ID\s*#?\s*\d+\b/gi, '')
    .replace(/\b(sample|record|dataset)\s+ID\s*[:#]?\s*[A-Z0-9_-]+/gi, '')
    // Strip quotes wrapped around whole review
    .replace(/^["'`\s]+|["'`\s]+$/g, '');

  // Strip accidental "Other <CustomProduct>"
  if (customProductName) {
    const escaped = customProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\bOther\\s+(${escaped})\\b`, 'gi');
    cleaned = cleaned.replace(regex, '$1');
  }

  // Strip general "Other <CapitalizedProductName>"
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

  const productStr = productNames.length > 0 ? formatListForProse(productNames) : 'electronics';
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
- NATURAL HUMAN VOICE: Write naturally and casually like an authentic local customer posting on Google Maps in India. Use realistic vocabulary, sentence flow, and rhythm.
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

// Highly varied offline generator inspired by dataset styles
export function generateLocalFallbackReview(
  data: QuestionnaireData,
  length: ReviewLength,
  businessName: string,
): string {
  const productNames = resolveSelectedProductNames(data.selectedProducts, data.otherProductText);
  const expLabels = resolveSelectedExperienceLabels(data.selectedExperiences, data.otherExperienceText);

  let productList = productNames.length > 0 ? formatListForProse(productNames) : 'electronics';

  // Umbrella phrasing for multiple products
  if (productNames.length > 1 && Math.random() > 0.4) {
    const multiPhrases = [
      'a few electronics',
      'a couple of home appliances',
      'some electrical items',
      `appliances including ${productNames[0]}`,
      productList,
    ];
    productList = getRandomItem(multiPhrases);
  }

  const stars = data.starRating || 5;

  const storeReferences = [
    'this shop',
    'here',
    'this store',
    'Modern Electronics',
    'this shop in Mukerian',
    businessName,
  ];
  const pickedStore = getRandomItem(storeReferences);

  const expList = expLabels.length > 0 ? formatListForProse(expLabels) : '';
  const expPhrasing = expList
    ? [
        `The ${expList.toLowerCase()} was really helpful.`,
        `Really appreciated their ${expList.toLowerCase()}.`,
        `Staff was polite and their ${expList.toLowerCase()} made the choice much easier.`,
        `What stood out was the ${expList.toLowerCase()}.`,
        `They gave proper information on ${expList.toLowerCase()} without any pressure.`,
      ]
    : [
        'The staff explained the features clearly and answered all questions.',
        'Staff were polite and gave me enough time to decide.',
        'Customer service was courteous and the buying process was straightforward.',
      ];
  const pickedExp = getRandomItem(expPhrasing);

  const article =
    /s$/i.test(productList) || productList.includes(' and ')
      ? ''
      : /^[aeiou]/i.test(productList)
        ? 'an '
        : 'a ';
  const itemWithArticle = `${article}${productList}`;

  let review = '';

  // Neutral / lower star ratings (inspired by ME-021 to ME-038)
  if (stars <= 3) {
    const neutralTemplates = [
      `Visited ${pickedStore} to check options for ${productList}. Staff were polite and answered my questions. Still comparing before making a final decision.`,
      `Checked a couple of ${productList} models here. The staff explained the differences. Decent store with a fair collection.`,
      `Went in to ask about ${productList} and available options. Got the basic details and pricing. A useful visit.`,
      `The store had several ${productList} choices on display. I am still comparing prices, but the information provided was helpful.`,
      `Visited ${pickedStore} to inquire about ${productList}. My questions were answered properly, though I did not purchase that day.`,
    ];
    review = getRandomItem(neutralTemplates);
  } else if (length === 'short') {
    const shortTemplates = [
      `Bought ${itemWithArticle} from ${pickedStore}. Staff explained the features clearly and helped me choose. Smooth purchase.`,
      `Purchased ${itemWithArticle} here. The buying process was easy and pricing was reasonable. Happy with the service.`,
      `Good experience. Went in for ${productList} and got proper information without being rushed. Satisfied with the purchase.`,
      `Got our ${productList} from ${pickedStore}. Helpful people and a smooth transaction. Would recommend.`,
      `Picked up ${productList} here recently. Courteous staff and dependable local service in Mukerian.`,
      `Needed ${itemWithArticle} and found a suitable one here. Quick billing and polite behavior. Nice store.`,
    ];
    review = getRandomItem(shortTemplates);
  } else if (length === 'balanced') {
    const balancedTemplates = [
      `Bought ${itemWithArticle} from Modern Electronics. The staff explained the features clearly and helped me compare different options. ${pickedExp} Delivery and billing were completely hassle-free.`,
      `We needed ${itemWithArticle} for our home and stopped by ${pickedStore}. Very happy with the purchase. ${pickedExp} Honest pricing and very courteous people to deal with.`,
      `Good experience shopping for ${productList} here. The team showed available models without rushing me. ${pickedExp} Everything was handled smoothly and I'm happy with how it turned out.`,
      `Got our ${productList} from ${pickedStore}. They had good options in our budget and explained the warranty details clearly. ${pickedExp} A dependable local electronics showroom.`,
      `Visited ${pickedStore} looking for ${productList}. ${pickedExp} The purchase was straightforward and the staff guided us well based on our actual requirements.`,
    ];
    review = getRandomItem(balancedTemplates);
  } else {
    // Detailed
    const detailedTemplates = [
      `We visited ${pickedStore} looking for ${productList} and had a genuinely good experience. The staff took the time to explain the features and helped us compare a couple of models based on our requirements. ${pickedExp} The entire buying process from selection to billing was transparent and smooth. Really glad to have a reliable store like this in Mukerian.`,
      `Purchased our new ${productList} from Modern Electronics recently. The team answered all our questions patiently and didn't just push the most expensive option. ${pickedExp} Delivery was on time and the product arrived in perfect condition. Courteous staff and fair prices throughout.`,
      `I stopped by ${pickedStore} to purchase ${itemWithArticle} after checking other stores. The options here were well organized and the advice was practical and straightforward. ${pickedExp} Excellent customer support, genuine products, and very respectful staff. Definitely satisfied with my purchase.`,
      `Needed ${itemWithArticle} for our house and visited Modern Electronics. The person attending us explained the different functions and maintenance tips in simple language. ${pickedExp} No confusing sales talk, just honest guidance and prompt service. Very pleased with the overall experience.`,
    ];
    review = getRandomItem(detailedTemplates);
  }

  const customText = data.otherProductText?.trim();
  return sanitizeGeneratedReviewText(review, customText);
}

export async function generateReview(
  data: QuestionnaireData,
  length: ReviewLength,
  settings: AdminSettings,
  onError?: (msg: string) => void,
): Promise<{ text: string; isFallback?: boolean }> {
  const prompt = buildPrompt(data, length, settings.businessName);
  const customText = data.otherProductText?.trim();

  if (!settings.aiApiKey || !settings.aiBaseUrl) {
    return {
      text: generateLocalFallbackReview(data, length, settings.businessName),
      isFallback: true,
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.aiApiKey}`,
    };

    if (settings.aiBaseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = settings.businessName;
    }

    const res = await fetch(`${settings.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: settings.maxTokens,
        temperature: Math.min(1.0, Math.max(0.7, settings.temperature || 0.8)),
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = (errBody as any)?.error?.message || `API error ${res.status}`;
      throw new Error(msg);
    }

    const json = await res.json();
    const rawContent = (json.choices?.[0]?.message?.content || '').trim();
    if (!rawContent) throw new Error('Empty response from AI');

    const sanitized = sanitizeGeneratedReviewText(rawContent, customText);
    return { text: sanitized, isFallback: false };
  } catch (err: any) {
    onError?.(err.message);
    return {
      text: generateLocalFallbackReview(data, length, settings.businessName),
      isFallback: true,
    };
  }
}

export async function testApiConnection(settings: AdminSettings): Promise<{ ok: boolean; message: string }> {
  if (!settings.aiApiKey) return { ok: false, message: 'API key is empty.' };
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.aiApiKey}`,
    };
    if (settings.aiBaseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = settings.businessName;
    }
    const res = await fetch(`${settings.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    });
    if (res.ok) return { ok: true, message: 'Connection successful! API is working.' };
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: (err as any)?.error?.message || `Status ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e.message || 'Network error' };
  }
}
