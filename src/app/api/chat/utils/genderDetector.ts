export type GenderPreference = 'men' | 'women' | 'all' | null;

export function detectGenderPreference(
  message: string,
  storedPreference?: GenderPreference
): GenderPreference {
  const messageLower = message.toLowerCase();
  
  const isWomensQuery = /\b(women'?s?|womens|female|ladies|ladys|girls|girl'?s?)\b/i.test(messageLower);
  const isMensQuery = /\b(men'?s?|mens|male|guys|guy'?s?|boys|boy'?s?)\b/i.test(messageLower);
  const isAllOrBothQuery = /\b(all|both|everyone|everybody)\b/i.test(messageLower);
  
  if (isAllOrBothQuery) {
    return 'all';
  } else if (isWomensQuery) {
    return 'women';
  } else if (isMensQuery) {
    return 'men';
  } else if (storedPreference === 'women' || storedPreference === 'men') {
    return storedPreference;
  }
  
  return null;
}

export function isProductRequest(message: string): boolean {
  const productRequestPhrases = [
    'show me', 'find', 'recommend', 'what', 'which', 'best',
    'looking for', 'need', 'want', 'search', 'find me', 'show',
    'display', 'list', 'options', 'available', 'have', 'suggest',
    'help me find', 'can you show', 'i need', 'i want', 'i\'m looking',
    'looking to buy', 'buy', 'purchase', 'bestseller', 'best seller',
    'best sellers', 'top', 'popular', 'gift guide', 'gift',
    'new arrivals', 'new arrival', 'clothing', 'footwear', 'shoes',
    'packs', 'backpacks', 'accessories', 'veilance', 'outlet',
    'browse outlet', 'rebird', 'resale'
  ];
  
  const messageLower = message.toLowerCase();
  return productRequestPhrases.some(phrase => messageLower.includes(phrase));
}

export function isGenderOnlyMessage(message: string): boolean {
  const messageLower = message.toLowerCase();
  const isWomensQuery = /\b(women'?s?|womens|female|ladies|ladys|girls|girl'?s?)\b/i.test(messageLower);
  const isMensQuery = /\b(men'?s?|mens|male|guys|guy'?s?|boys|boy'?s?)\b/i.test(messageLower);
  const isAllOrBothQuery = /\b(all|both|everyone|everybody)\b/i.test(messageLower);
  
  if (!(isWomensQuery || isMensQuery || isAllOrBothQuery)) {
    return false;
  }
  
  const productRequestPhrases = [
    'show me', 'find', 'recommend', 'what', 'which', 'best',
    'looking for', 'need', 'want', 'search', 'find me', 'show',
    'display', 'list', 'options', 'available', 'have', 'suggest',
    'help me find', 'can you show', 'i need', 'i want', 'i\'m looking',
    'looking to buy', 'buy', 'purchase', 'bestseller', 'best seller',
    'best sellers', 'top', 'popular', 'gift guide', 'gift',
    'new arrivals', 'new arrival', 'clothing', 'footwear', 'shoes',
    'packs', 'backpacks', 'accessories', 'veilance', 'outlet',
    'browse outlet', 'rebird', 'resale'
  ];
  
  return !productRequestPhrases.some(phrase => messageLower.includes(phrase));
}

