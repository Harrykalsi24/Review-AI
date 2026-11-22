import type { QuestionnaireData, ReviewLength, AdminSettings } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_EXPERIENCES } from '../types';

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
  'Start like: "Today I visited this shop to get..." or "I bought this here and I\'m really happy..."',
  'Start like: "Recently got our... from here and everything was smooth."',
  'Start like: "Visited this store yesterday looking for...", talking about the helpful staff.',
  'Start like: "Picked up a... from here and had a great experience."',
  'Start like: "Checked out this electronics shop in Mukerian and found exactly what I needed."',
];

function resolveProducts(ids: string[]): string {
  const map = new Map(DEFAULT_PRODUCTS.map(p => [p.id, p.name]));
  return ids.map(id => map.get(id) || id).join(', ');
}

function resolveExperiences(ids: string[]): string {
  const map = new Map(DEFAULT_EXPERIENCES.map(e => [e.id, e.label]));
  return ids.map(id => map.get(id) || id).join(', ');
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sanitizeUserInput(input?: string, maxLen = 80): string {
  if (!input) return '';
  return input
    .replace(/[<>{}[\]\\/`$]/g, '')
    .replace(/(ignore\s+(all\s+)?(previous|prior)|system:|assistant:|ignore\s+instructions)/gi, '')
    .trim()
    .slice(0, maxLen);
}

function buildPrompt(data: QuestionnaireData, length: ReviewLength, businessName: string): string {
  const parts: string[] = [];
  const cleanOtherProduct = sanitizeUserInput(data.otherProductText);
  let products = resolveProducts(data.selectedProducts);
  if (cleanOtherProduct) {
    products = products ? `${products}, ${cleanOtherProduct}` : cleanOtherProduct;
  }
  if (products) parts.push(`Purchased / Looked at: ${products}`);

  const cleanOtherExp = sanitizeUserInput(data.otherExperienceText);
  let liked = resolveExperiences(data.selectedExperiences);
  if (cleanOtherExp) {
    liked = liked ? `${liked}, ${cleanOtherExp}` : cleanOtherExp;
  }
  if (liked) parts.push(`Positive highlights experienced: ${liked}`);
  if (data.starRating) parts.push(`Customer star satisfaction: ${data.starRating} out of 5 stars`);

  const chosenPersona = getRandomItem(PERSONAS);
  const chosenOpener = getRandomItem(OPENERS);
  const variationNonce = Math.floor(Math.random() * 10000);

  return `You are helping a real customer write their personal Google review for ${businessName}, an electronics and appliance shop in Mukerian, Punjab, India.

Customer selection:
${parts.join('\n')}

Style instructions:
- SOUND LIKE A REAL HUMAN: Write casually and naturally like a normal customer posting on Google Maps (e.g. "Today I visited this shop...", "I bought this here and I'm really happy", "Got my new appliance from here and everything went great").
- BUSINESS NAME RULE: DO NOT always repeat the formal store name "${businessName}". You can naturally refer to it as "this shop", "here", "this store", or occasionally "${businessName}". Avoid robotic or marketing language.
- MULTIPLE ITEMS VARIATION: If multiple products are selected, do not always rigidly list every item. Feel free to naturally say "today I bought a number of electronics", "purchased several home products", "bought a few electrical and electronic items", or name one or two with umbrella words like "bought a number of appliances".
- CRITICAL MANDATORY RULE: NEVER write negatively, critically, or disapprovingly under any circumstance. Even if 1, 2, or 3 stars are selected, ALWAYS maintain a warm, positive, polite, and supportive tone. Focus on good intentions, store collection, staff politeness, and community goodwill.
- ${chosenPersona}
- ${chosenOpener}
- ${LENGTH_GUIDE[length]}
- Write in first person ("I" or "We") with natural conversational phrasing
- Vary sentence lengths and rhythm so it sounds like a distinct individual (Variation ID #${variationNonce})
- Emphasize positive aspects of the shopping visit. Do NOT make up fake discounts or unmentioned staff names
- Output ONLY the review text. No quotes, no headings, no asterisks.`;
}

// Highly varied offline generators
export function generateLocalFallbackReview(
  data: QuestionnaireData,
  length: ReviewLength,
  businessName: string
): string {
  let rawProductList = resolveProducts(data.selectedProducts);
  const cleanOtherP = sanitizeUserInput(data.otherProductText);
  if (cleanOtherP) {
    rawProductList = rawProductList ? `${rawProductList}, ${cleanOtherP}` : cleanOtherP;
  }
  if (!rawProductList) rawProductList = 'electronics';

  // If multiple items are selected, randomly use umbrella phrases
  const totalItemsCount = data.selectedProducts.length + (cleanOtherP ? 1 : 0);
  let productList = rawProductList;
  if (totalItemsCount > 1 && Math.random() > 0.35) {
    const multiPhrases = [
      'a number of electronics',
      'several electrical items',
      'a number of home and electrical products',
      'a few electronic appliances',
      'several home appliances',
      `a number of electronics including ${rawProductList.split(',')[0]}`,
      rawProductList,
    ];
    productList = getRandomItem(multiPhrases);
  }

  const cleanOtherE = sanitizeUserInput(data.otherExperienceText);
  let expList = resolveExperiences(data.selectedExperiences);
  if (cleanOtherE) {
    expList = expList ? `${expList}, ${cleanOtherE}` : cleanOtherE;
  }
  const stars = data.starRating || 5;

  // Dynamic human store references: mostly "this shop", "here", "this store"
  const storeReferences = [
    'this shop',
    'here',
    'this store',
    'this place',
    'this shop in Mukerian',
    businessName,
  ];
  const pickedStore = getRandomItem(storeReferences);

  const expPhrasing = expList
    ? [
        `The ${expList.toLowerCase()} was really helpful.`,
        `Really happy with their ${expList.toLowerCase()}.`,
        `What stood out was the ${expList.toLowerCase()}.`,
        `Their ${expList.toLowerCase()} made things very easy.`,
      ]
    : ['Everything was handled neatly.', 'Staff was polite and assisted well.'];
  const pickedExp = getRandomItem(expPhrasing);

  if (stars <= 3) {
    const supportiveTemplates = [
      `Bought ${productList} from ${pickedStore}. Decent collection of appliances and courteous staff. Appreciate having a reliable local shop here.`,
      `Visited ${pickedStore} for ${productList}. Good variety on display and polite guidance from the team. A helpful showroom for home appliances.`,
      `Checked out ${productList} here recently. Friendly service and straightforward product options for household needs.`,
    ];
    return getRandomItem(supportiveTemplates);
  }

  if (length === 'short') {
    const shortTemplates = [
      `Today I visited this shop and bought ${productList}. Really happy with the purchase and the service!`,
      `I bought a ${productList} here and I'm very satisfied. The staff was polite and helpful.`,
      `Got my ${productList} from ${pickedStore} yesterday. Smooth buying experience and good pricing.`,
      `Visited this store to get ${productList}. Found what I needed quickly and had a great experience.`,
      `Picked up ${productList} here today. Very happy with the quality and courteous assistance.`,
    ];
    return getRandomItem(shortTemplates);
  }

  if (length === 'balanced') {
    const balancedTemplates = [
      `Today I visited this shop to buy ${productList} and I'm really happy with how it turned out. ${pickedExp} The staff explained all features patiently without rushing. Definitely a trustworthy place for appliances.`,
      `I bought a ${productList} here recently. The overall shopping experience was very smooth. ${pickedExp} Honest pricing and very courteous people to deal with. Will recommend to others.`,
      `We needed a ${productList} and stopped by ${pickedStore}. Very happy with the purchase. ${pickedExp} Good advice and quick billing. Good experience overall!`,
      `Got our ${productList} from ${pickedStore}. They had good options to choose from and gave genuine guidance. ${pickedExp} Happy with the whole process.`,
      `Visited ${pickedStore} looking for ${productList}. Great customer service and reasonable prices. ${pickedExp} Very satisfied with the shopping experience.`,
    ];
    return getRandomItem(balancedTemplates);
  }

  // Detailed
  const detailedTemplates = [
    `Today I visited this shop looking for ${productList} and honestly had a great experience. The staff was attentive and helped me choose the model that best fit what I needed. ${pickedExp} Everything from pricing to assistance was handled transparently. Truly satisfied with my purchase and glad I bought it from here.`,
    `Sharing a quick review: bought my ${productList} from ${pickedStore} recently. Walked in with a few questions and the team answered everything patiently. ${pickedExp} The product is working great and the service was top notch. A very dependable local store.`,
    `We visited ${pickedStore} to pick up ${productList}. The shopping experience was very pleasant from start to finish. ${pickedExp} The staff is polite, knowledgeable, and guided us well without any pressure. Highly satisfied customer!`,
    `I bought a ${productList} here after checking nearby places. Glad I came to ${pickedStore}! ${pickedExp} Fair pricing, genuine products, and very respectful staff. Would definitely visit again for any future appliances.`,
  ];
  return getRandomItem(detailedTemplates);
}

export async function generateReview(
  data: QuestionnaireData,
  length: ReviewLength,
  settings: AdminSettings,
  onError?: (msg: string) => void,
): Promise<{ text: string; isFallback?: boolean }> {
  const prompt = buildPrompt(data, length, settings.businessName);

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
        temperature: Math.min(1.0, Math.max(0.8, settings.temperature || 0.85)),
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = (errBody as any)?.error?.message || `API error ${res.status}`;
      throw new Error(msg);
    }

    const json = await res.json();
    const content = (json.choices?.[0]?.message?.content || '').trim();
    if (!content) throw new Error('Empty response from AI');
    return { text: content, isFallback: false };
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
