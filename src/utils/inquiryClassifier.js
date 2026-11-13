// Fail-closed accommodation inquiry classifier.
// A message qualifies only when it contains (1) a supported area,
// (2) accommodation context, and (3) clear buyer/guest seeking intent.
const AREA_PATTERNS = [
  { name: 'Nyali', pattern: /\b(?:nyali|nyalli|nyli|old[\s_-]?nyali|new[\s_-]?nyali|links[\s_-]?(?:road|rd)?|greenwood|cinemax|city[\s_-]?mall|mkomani)\b/i },
  { name: 'Westlands', pattern: /\b(?:westlands?|west[\s_-]?lands?)\b/i },
  { name: 'Kileleshwa', pattern: /\bkileleshwa\b/i },
  { name: 'Bamburi', pattern: /\bbamburi\b/i }
];

const ACCOMMODATION = /\b(?:air[\s-]?bnb|bnb|b&b|apartments?|flats?|houses?|homes?|units?|studios?|rooms?|chumba|nyumba|malazi|accommodation|place to stay|short[\s-]?stay|furnished|serviced|bedrooms?|\d+\s*(?:br|bed|bedroom)s?)\b/i;

const BUYER_INTENT = [
  /\b(?:(?:i(?:'m| am)?\s+)?(?:looking for|searching for|in search of|seeking|in need of))\b/i,
  /\b(?:i\s+(?:need|want|require)\b)\s*(?:an?\s+)?/i,
  /\b(?:looking|planning|wanting)\s+to\s+(?:book|rent|stay|get|find|lease)\b/i,
  /\b(?:anyone\s+(?:with|has|have)|does anyone have|who\s+(?:has|knows)|is there\s+(?:an?\s+)?|are there\s+(?:any\s+)?|can anyone recommend)\b/i,
  /\b(?:natafuta|ninatafuta|nahitaji|ninahitaji|naomba\s+(?:kupata|nyumba|chumba|malazi))\b/i,
  /\b(?:kuna\s+(?:yeyote|mwenye|mtu|nyumba|chumba)|nani\s+(?:ako\s+na|ana|anayejua)|mko\s+na|uko\s+na)\b/i
];

const SELLER_SIGNALS = [
  /\b(?:we\s+(?:offer|have|provide|manage|rent out|let out)|our\s+(?:apartments?|units?|houses?|villas?|properties|rooms?|rates?|prices?))\b/i,
  /\b(?:book\s+now|book\s+today|book\s+with\s+us|now\s+(?:available|booking|letting|renting)|available\s+(?:now|today|for\s+(?:booking|rent|occupation)))\b/i,
  /\b(?:daily|nightly)\s+rates?|\brates?\s*[:=-]\s*(?:ksh|kes|usd|\$)?\s*\d+|\bprice\s*[:=-]\s*(?:ksh|kes|usd|\$)?\s*\d+/i,
  /\b(?:paybill|till\s*(?:no|number)?|lipa\s+na\s+mpesa)\b/i,
  /\b(?:contact|call|whatsapp|dm)\s+(?:me|us|now|for bookings|for details)\b/i,
  /\b(?:property for sale|land for sale|plots? for sale|title deed ready)\b/i,
  /\b(?:experience luxury|welcome to our|enjoy your stay|perfect for your holiday|limited offer|special offer)\b/i
];

export function checkMessageForKeywords(messageText) {
  if (typeof messageText !== 'string' || !messageText.trim()) return null;

  const text = messageText.normalize('NFKC').toLowerCase()
    .replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').trim();

  const matchedAreas = AREA_PATTERNS.filter(area => area.pattern.test(text));
  if (matchedAreas.length === 0) return null;

  // Reject seller/promotional content before evaluating buyer intent.
  if (SELLER_SIGNALS.some(pattern => pattern.test(text))) return null;

  const hasAccommodation = ACCOMMODATION.test(text);
  const hasBuyerIntent = BUYER_INTENT.some(pattern => pattern.test(text));
  if (!hasAccommodation || !hasBuyerIntent) return null;

  const isShortStay = /\b(?:air[\s-]?bnb|bnb|b&b|short[\s-]?stay|holiday|vacation|staycation|nightly|per night|weekend stay)\b/i.test(text);
  const isFurnished = /\b(?:furnished|serviced)\b/i.test(text);
  const ruleName = isShortStay
    ? 'Short-stay / Airbnb guest enquiry'
    : isFurnished
      ? 'Furnished rental enquiry'
      : 'House / Apartment inquiry';
  const areaNames = matchedAreas.map(area => area.name);

  return {
    isQualifiedInquiry: true,
    ruleName,
    priority: 'CRITICAL',
    matchedKeywords: [
      ...areaNames,
      isShortStay ? 'Short-stay / Airbnb' : isFurnished ? 'Furnished unit' : 'Residential rental',
      'Explicit buyer / guest intent'
    ],
    matchedAreas: areaNames,
    categories: [ruleName],
    leadType: `Potential ${areaNames.join(' / ')} Client / Guest`
  };
}
