import { Product, getProductDataByGender } from './dataLoader';

export interface ExtractProductsOptions {
  query: string;
  genderPreference: 'men' | 'women' | 'all' | null;
  conversationHistory?: string[];
  limit?: number;
}

export function extractProductsFromQuery(options: ExtractProductsOptions): Product[] {
  const { query, genderPreference, conversationHistory = [], limit = 6 } = options;

  console.log(`🔍 ProductExtractor: extractProductsFromQuery called with:`, {
    query,
    genderPreference,
    conversationHistoryLength: conversationHistory.length,
    limit
  });

  const productsToSearch = getProductDataByGender(genderPreference);
  console.log(`🔍 ProductExtractor: Found ${productsToSearch.length} products for gender: ${genderPreference}`);

  if (productsToSearch.length === 0) {
    console.log(`❌ ProductExtractor: No products found for gender preference: ${genderPreference}`);
    return [];
  }

  const combinedText = [...conversationHistory, query].join(' ').toLowerCase();
  console.log(`🔍 ProductExtractor: Combined text to search: "${combinedText}"`);

  const extractedProducts: Product[] = [];

  // Check for "Top 10", "Top 5", or "Top 3" queries
  if (combinedText.includes('top 10') || combinedText.includes('top10') || combinedText.includes('top ten') || 
      combinedText.includes('top 5') || combinedText.includes('top5') || combinedText.includes('top five') ||
      combinedText.includes('top 3') || combinedText.includes('top3') || combinedText.includes('top three')) {
    let targetCategory: string | null = null;
    let targetGender: string | null = null;

    if (combinedText.includes('women') || combinedText.includes("women's") || combinedText.includes('womens')) {
      targetGender = 'women';
    } else if (combinedText.includes('men') || combinedText.includes("men's") || combinedText.includes('mens')) {
      targetGender = 'men';
    }

    if (combinedText.includes('jacket')) {
      targetCategory = 'jackets';
    } else if (combinedText.includes('pant')) {
      targetCategory = 'pants';
    } else if (combinedText.includes('shoe') || combinedText.includes('footwear')) {
      targetCategory = 'footwear';
    }

    let topProducts = [...productsToSearch];

    if (targetCategory) {
      topProducts = topProducts.filter((p) => {
        const pCategory = (p.category || '').toLowerCase();
        return pCategory === targetCategory ||
          (targetCategory === 'jackets' && (pCategory === 'jacket' || pCategory === 'jackets')) ||
          (targetCategory === 'pants' && (pCategory === 'pants' || pCategory === 'pant')) ||
          (targetCategory === 'footwear' && (pCategory === 'footwear' || pCategory === 'shoes' || pCategory === 'shoe'));
      });
    }

    if (targetGender) {
      topProducts = topProducts.filter((p) => {
        const pGender = (p.gender || '').toLowerCase();
        return pGender === targetGender || pGender === targetGender + "'s";
      });
    }

    const sortedProducts = topProducts
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, 5);

    return sortedProducts;
  }

  // Check for "best seller" queries
  if (combinedText.includes('best seller') || combinedText.includes('bestseller') || combinedText.includes('best sellers')) {
    let sortedProducts = [...productsToSearch]
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, limit);

    if (sortedProducts.length < limit) {
      const remaining = productsToSearch
        .filter(p => !sortedProducts.find(sp => sp.id === p.id))
        .filter(p => p.badges && p.badges.includes('New'))
        .slice(0, limit - sortedProducts.length);
      sortedProducts = [...sortedProducts, ...remaining];
    }

    return sortedProducts;
  }

  // Check for "Gift Guide"
  if (combinedText.includes('gift guide') || combinedText.includes('gift')) {
    let giftProducts = [...productsToSearch]
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 0)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, limit);

    if (giftProducts.length < limit) {
      const newProducts = productsToSearch
        .filter(p => !giftProducts.find(gp => gp.id === p.id))
        .filter(p => p.badges && p.badges.includes('New'))
        .slice(0, limit - giftProducts.length);
      giftProducts = [...giftProducts, ...newProducts];
    }

    return giftProducts;
  }

  // Check for "New Arrivals"
  if (combinedText.includes('new arrivals') || combinedText.includes('new arrival')) {
    return productsToSearch
      .filter(p => p.badges && p.badges.includes('New'))
      .slice(0, limit);
  }

  // Check for general category keywords
  const generalCategoryKeywords: Record<string, string[]> = {
    clothing: ['clothing', 'clothes', 'apparel'],
    footwear: ['footwear', 'shoes', 'boots'],
    packs: ['packs', 'backpacks', 'backpack', 'pack'],
    accessories: ['accessories', 'accessory'],
  };

  for (const [key, keywords] of Object.entries(generalCategoryKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      const categoryProducts = productsToSearch
        .filter((p) => {
          const pCategory = (p.category || '').toLowerCase();
          return pCategory === key ||
            (key === 'clothing' && (pCategory === 'jackets' || pCategory === 'jacket' || pCategory === 'pants' || pCategory === 'pant' || pCategory === 'hoody' || pCategory === 'hoodie')) ||
            (key === 'footwear' && (pCategory === 'footwear' || pCategory === 'shoes' || pCategory === 'shoe')) ||
            (key === 'packs' && (pCategory === 'packs' || pCategory === 'pack' || pCategory === 'backpacks' || pCategory === 'backpack')) ||
            (key === 'accessories' && pCategory === 'accessories');
        })
        .slice(0, limit);

      if (categoryProducts.length > 0) {
        return categoryProducts;
      }
    }
  }

  // Check for specific category keywords
  const categoryKeywords: Record<string, string[]> = {
    jacket: ['jacket', 'shell', 'coat'],
    pant: ['pant', 'pants', 'trouser', 'trousers'],
    shoe: ['shoe', 'shoes', 'boot', 'boots', 'footwear'],
    toque: ['toque', 'hat', 'beanie', 'cap'],
    hoody: ['hoody', 'hoodie', 'sweater', 'sweatshirt'],
  };

  for (const [key, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      const categoryProducts = productsToSearch
        .filter((p) => {
          const pCategory = (p.category || '').toLowerCase();
          return pCategory === key ||
            (key === 'jacket' && pCategory === 'jackets') ||
            (key === 'pant' && (pCategory === 'pants' || pCategory === 'pant')) ||
            (key === 'shoe' && (pCategory === 'footwear' || pCategory === 'shoes')) ||
            (key === 'toque' && pCategory === 'accessories');
        })
        .slice(0, limit);

      if (categoryProducts.length > 0) {
        console.log(`✅ ProductExtractor: Found ${categoryProducts.length} products for category "${key}":`, categoryProducts.map(p => p.name));
        return categoryProducts;
      }
    }
  }

  // UPSELL FALLBACK: If no specific matches found, return contextually relevant products
  console.log(`🛒 UPSELL FALLBACK: No specific matches found, analyzing conversation for relevant products`);

  let fallbackProducts: Product[] = [];

  // SMART CONTEXT ANALYSIS: Look for any product-related terms and context clues
  const weatherTerms = ['cold', 'warm', 'hot', 'cool', 'winter', 'summer', 'spring', 'fall', 'autumn', 'rain', 'snow', 'wind', 'sun'];
  const activityTerms = ['hiking', 'climbing', 'skiing', 'snowboard', 'running', 'cycling', 'walking', 'travel', 'work', 'city', 'urban', 'outdoor', 'mountain', 'trail'];
  const productTerms = ['jacket', 'shell', 'layer', 'mid', 'base', 'insulation', 'pant', 'shoe', 'boot', 'pack', 'bag', 'glove', 'hat', 'toque'];
  const featureTerms = ['waterproof', 'breathable', 'lightweight', 'packable', 'durable', 'warm', 'insulated', 'gore-tex', 'windproof'];

  // Analyze conversation context to determine what type of products to show
  const hasWeatherContext = weatherTerms.some(term => combinedText.includes(term));
  const hasActivityContext = activityTerms.some(term => combinedText.includes(term));
  const hasProductContext = productTerms.some(term => combinedText.includes(term));
  const hasFeatureContext = featureTerms.some(term => combinedText.includes(term));

  console.log(`🔍 UPSELL Context Analysis:`, {
    hasWeatherContext,
    hasActivityContext,
    hasProductContext,
    hasFeatureContext,
    combinedText: combinedText.substring(0, 100) + '...'
  });

  // Strategy 1: If there's any product/weather/activity context, show relevant category products
  if (hasProductContext || hasWeatherContext || hasActivityContext || hasFeatureContext) {
    console.log(`🛒 UPSELL: Product context detected - showing category-based products`);

    // Prioritize jackets and core products for most conversations
    const coreCategories = ['jackets', 'jacket', 'pants', 'pant'];
    fallbackProducts = productsToSearch.filter(p => {
      const category = (p.category || '').toLowerCase();
      return coreCategories.includes(category);
    });

    // If we have specific product terms, filter further
    if (combinedText.includes('jacket') || combinedText.includes('shell')) {
      fallbackProducts = fallbackProducts.filter(p => {
        const category = (p.category || '').toLowerCase();
        return category === 'jackets' || category === 'jacket';
      });
    } else if (combinedText.includes('pant')) {
      fallbackProducts = fallbackProducts.filter(p => {
        const category = (p.category || '').toLowerCase();
        return category === 'pants' || category === 'pant';
      });
    }

    // Sort by rating and take top products
    fallbackProducts = fallbackProducts
      .filter(p => p.rating?.average)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        return ratingB - ratingA;
      })
      .slice(0, limit);
  }

  // Strategy 2: If still no products, show top-rated products across all categories
  if (fallbackProducts.length === 0) {
    console.log(`🛒 UPSELL: No context matches - showing top-rated products as universal fallback`);
    fallbackProducts = productsToSearch
      .filter(p => p.rating?.average && parseFloat(p.rating.average) > 3.5)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;

        // Sort by rating first, then by review count
        if (ratingB === ratingA) {
          return countB - countA;
        }
        return ratingB - ratingA;
      })
      .slice(0, limit);
  }

  if (fallbackProducts.length > 0) {
    console.log(`✅ UPSELL FALLBACK: Found ${fallbackProducts.length} contextual products:`, fallbackProducts.map(p => p.name));
    return fallbackProducts;
  }

  console.log(`⚠️ ProductExtractor: No products found for query "${query}" - returning empty array`);
  return extractedProducts.slice(0, limit);
}



export function extractProductsFromText(
  text: string,
  products: Product[],
  userQuery: string
): Product[] {
  const textLower = text.toLowerCase();
  const queryLower = userQuery.toLowerCase();
  const extractedProducts: Product[] = [];

  console.log('🔍 Product extraction - FULL AI text:', textLower);
  console.log('🔍 Product extraction - User query:', queryLower);
  console.log('🔍 Available products count:', products.length);
  console.log('🔍 Sample product names:', products.slice(0, 5).map(p => p.name));

  // Check if AI is asking for clarification (don't show products)
  const clarificationPhrases = [
    'are you looking for',
    'men\'s or women\'s',
    'men or women',
    'which gender',
    'please clarify',
    'could you please confirm'
  ];

  const isAskingForClarification = clarificationPhrases.some(phrase =>
    textLower.includes(phrase)
  );

  if (isAskingForClarification) {
    console.log('🚫 Skipping products - AI is asking for clarification');
    return [];
  }

  // PRIORITY: Extract products in the ORDER they are mentioned by the AI
  // This ensures we show exactly what the bot recommends in the right sequence

  const productMatches: Array<{ product: Product; position: number }> = [];

  products.forEach((product) => {
    const productNameLower = product.name.toLowerCase();

    // Remove gender prefixes for matching
    const productNameWithoutGender = productNameLower
      .replace(/\b(men's|mens|women's|womens)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    let matchPosition = -1;

    // Check for exact or near-exact product name mentions
    if (textLower.includes(productNameLower)) {
      matchPosition = textLower.indexOf(productNameLower);
      console.log(`✅ Found EXACT product mention: "${product.name}" at position ${matchPosition}`);
    }
    else if (productNameWithoutGender.length > 8 && textLower.includes(productNameWithoutGender)) {
      matchPosition = textLower.indexOf(productNameWithoutGender);
      console.log(`✅ Found product mention: "${product.name}" (matched: "${productNameWithoutGender}") at position ${matchPosition}`);
    }
    // Also check for key model names but be more strict
    else {
      const nameParts = productNameWithoutGender.split(' ');
      if (nameParts.length >= 2) {
        const keyName = nameParts.slice(0, 2).join(' '); // e.g., "alpha sv", "beta ar"
        if (keyName.length > 6 && textLower.includes(keyName)) {
          matchPosition = textLower.indexOf(keyName);
          console.log(`✅ Found product by key name: "${product.name}" (matched: "${keyName}") at position ${matchPosition}`);
        }
      }
    }

    if (matchPosition >= 0) {
      productMatches.push({ product, position: matchPosition });
    }
  });

  // Sort by position in text (order mentioned) and add to extracted products
  productMatches
    .sort((a, b) => a.position - b.position)
    .forEach(match => {
      if (!extractedProducts.find(p => p.id === match.product.id)) {
        extractedProducts.push(match.product);
      }
    });

  // REMOVED: Category matching and fallback logic
  // We ONLY want to show products that the AI specifically mentions by name
  // This ensures the product carousel matches exactly what the bot recommends

  console.log('🎯 STRICT MODE: Only showing products specifically mentioned by the AI');

  const finalProducts = extractedProducts.slice(0, 6);
  console.log(`🎯 FINAL RESULT - Products to show (${finalProducts.length}):`, finalProducts.map(p => p.name));

  if (finalProducts.length === 0) {
    console.log(`✅ CORRECT: No products specifically mentioned by AI - showing no products`);
  } else {
    console.log(`✅ SHOWING ONLY: Products specifically mentioned by AI in order`);
  }

  return finalProducts;
}

