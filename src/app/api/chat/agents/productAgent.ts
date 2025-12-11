import { OpenAI } from 'openai';
import { getProductDataByGender, Product } from '../utils/dataLoader';
import { extractProductsFromQuery, extractProductsFromText } from '../utils/productExtractor';
import { GenderPreference } from '../utils/genderDetector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface ProductAgentOptions {
  messages: Array<{ role: string; content: string }>;
  languageCode: string;
  genderPreference: GenderPreference;
  currentGenderPreference: GenderPreference;
}

export interface ProductAgentResponse {
  stream: ReadableStream;
  products?: Product[];
}

function buildProductCatalog(genderPreference: GenderPreference): string {
  const products = getProductDataByGender(genderPreference);
  if (products.length === 0) {
    return 'Product catalog loading...';
  }

  const byCategory: Record<string, Product[]> = {};
  products.forEach((product) => {
    const category = product.category || 'other';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(product);
  });

  let catalog = '';
  Object.keys(byCategory).sort().forEach(category => {
    const categoryProducts = byCategory[category];
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    catalog += `\n${categoryName.toUpperCase()}:\n`;

    categoryProducts.forEach((product) => {
      const rating = product.rating?.average ? ` (${product.rating.average}/5 stars, ${product.rating.count || 0} reviews)` : '';
      const badges = product.badges && product.badges.length > 0 ? ` [${product.badges.join(', ')}]` : '';
      const colors = product.colors && product.colors.length > 0 ? ` Available colors: ${product.colors.slice(0, 5).join(', ')}${product.colors.length > 5 ? '...' : ''}` : '';
      const mainImage = product.images?.main ? ` [Main Image: ${product.images.main}]` : '';
      catalog += `- ${product.name}: ${product.description}. $${product.price} CAD${rating}${badges}${colors}${mainImage}\n`;
    });
  });

  return catalog;
}

function analyzeProductContext(messages: Array<{ role: string; content: string }>, currentMessage: string): {
  summary: string;
  previousRequests: string[];
  isGenderResponse: boolean;
} {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content || '');
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content || '');

  // Analyze conversation for context clues
  const allText = [...userMessages, ...assistantMessages].join(' ').toLowerCase();

  // Track previous product requests in the conversation
  const previousRequests: string[] = [];
  const productKeywords = ['jacket', 'pant', 'shoe', 'boot', 'gear', 'clothing', 'apparel', 'recommend', 'need', 'want', 'looking for', 'show me', 'mid layer', 'midlayer', 'layer', 'shell', 'insulation'];

  // Look at ALL user messages except the current one
  userMessages.slice(0, -1).forEach((msg, index) => {
    const msgLower = msg.toLowerCase();
    if (productKeywords.some(keyword => msgLower.includes(keyword)) ||
      msgLower.includes('for ') || // "jacket for skiing", "something for rain"
      msgLower.includes('when ') || // "when it's rainy"
      msgLower.includes('in ')) { // "in Vancouver"
      previousRequests.push(msg);
      console.log(`🔍 Context: Found previous request ${index + 1}: "${msg}"`);
    }
  });

  // Check if current message is likely a gender response (NOT an initial gender-specific request)
  const currentLower = currentMessage.toLowerCase();
  const genderWords = ['men', 'mens', "men's", 'women', 'womens', "women's", 'male', 'female', 'guy', 'lady'];

  // Only consider it a gender response if:
  // 1. It contains gender words
  // 2. It's a short message (< 50 chars)
  // 3. Has previous product requests
  // 4. The message is MOSTLY just gender (not "mens jacket for skiing")
  const hasGenderWord = genderWords.some(word => currentLower.includes(word));
  const isShortMessage = currentLower.length < 50;
  const hasPreviousRequests = previousRequests.length > 0;

  // Check if message is mostly just gender specification (not a full product request)
  const productWords = ['jacket', 'pant', 'shoe', 'boot', 'gear', 'clothing', 'for', 'in', 'when', 'need', 'want', 'looking', 'recommend'];
  const hasProductWords = productWords.some(word => currentLower.includes(word));

  // It's a gender response only if it has gender words, is short, has previous requests, 
  // AND doesn't contain substantial product request language
  const isGenderResponse = hasGenderWord &&
    isShortMessage &&
    hasPreviousRequests &&
    !hasProductWords; // Key change: exclude messages with product language

  // Activity detection
  const activities = [];
  if (allText.includes('ski') || allText.includes('snowboard')) activities.push('skiing/snowboarding');
  if (allText.includes('hik') || allText.includes('trail')) activities.push('hiking');
  if (allText.includes('climb') || allText.includes('alpine')) activities.push('climbing');
  if (allText.includes('run') || allText.includes('jog')) activities.push('running');
  if (allText.includes('city') || allText.includes('urban') || allText.includes('work')) activities.push('urban/casual');
  if (allText.includes('travel') || allText.includes('trip')) activities.push('travel');

  // Weather/condition detection
  const conditions = [];
  if (allText.includes('cold') || allText.includes('winter')) conditions.push('cold weather');
  if (allText.includes('rain') || allText.includes('wet')) conditions.push('wet conditions');
  if (allText.includes('wind') || allText.includes('windy')) conditions.push('windy');
  if (allText.includes('warm') || allText.includes('summer')) conditions.push('warm weather');

  // Product type mentions
  const productTypes = [];
  if (allText.includes('jacket') || allText.includes('shell')) productTypes.push('jackets');
  if (allText.includes('pant') || allText.includes('trouser')) productTypes.push('pants');
  if (allText.includes('shoe') || allText.includes('boot')) productTypes.push('footwear');
  if (allText.includes('layer') || allText.includes('insulation')) productTypes.push('layering');

  // Budget/priority indicators
  const priorities = [];
  if (allText.includes('budget') || allText.includes('cheap') || allText.includes('affordable')) priorities.push('budget-conscious');
  if (allText.includes('best') || allText.includes('premium') || allText.includes('high-end')) priorities.push('premium quality');
  if (allText.includes('light') || allText.includes('packable')) priorities.push('lightweight');
  if (allText.includes('durable') || allText.includes('tough')) priorities.push('durability');

  // Experience level
  let experienceLevel = 'not specified';
  if (allText.includes('beginner') || allText.includes('new to') || allText.includes('first time')) experienceLevel = 'beginner';
  if (allText.includes('experienced') || allText.includes('expert') || allText.includes('professional')) experienceLevel = 'experienced';

  // Build context summary
  let summary = 'New conversation';
  if (userMessages.length > 1) {
    const contextParts = [];
    if (activities.length > 0) contextParts.push(`Activities: ${activities.join(', ')}`);
    if (conditions.length > 0) contextParts.push(`Conditions: ${conditions.join(', ')}`);
    if (productTypes.length > 0) contextParts.push(`Interest in: ${productTypes.join(', ')}`);
    if (priorities.length > 0) contextParts.push(`Priorities: ${priorities.join(', ')}`);
    if (experienceLevel !== 'not specified') contextParts.push(`Experience: ${experienceLevel}`);

    summary = contextParts.length > 0 ? contextParts.join(' | ') : 'General product inquiry';
  }

  return { summary, previousRequests, isGenderResponse };
}

function extractExactAIMentionedProducts(aiResponse: string, products: Product[]): Product[] {
  console.log(`🎯 EXACT EXTRACTION: Parsing AI response for specific product mentions`);
  const responseLower = aiResponse.toLowerCase();
  const extractedProducts: Product[] = [];
  
  // Create a mapping of AI-mentioned names to actual database products
  const productNameMappings: Record<string, string[]> = {
    // Map AI mentions to actual database names (with and without "men's" suffix)
    'thorium ar jacket': ['therme down jacket men\'s'], // AI says "Thorium AR" but DB has "Therme Down"
    'thorium ar jacket men\'s': ['therme down jacket men\'s'],
    'alpha sv jacket': ['alpha sv jacket men\'s'],
    'alpha sv jacket men\'s': ['alpha sv jacket men\'s'],
    'cerium jacket': ['cerium jacket men\'s'],
    'cerium jacket men\'s': ['cerium jacket men\'s'],
    'cerium lt jacket': ['cerium jacket men\'s'], // Map LT variant to base model
    'cerium lt jacket men\'s': ['cerium jacket men\'s'],
    'beta ar jacket': ['beta ar jacket men\'s'],
    'beta ar jacket men\'s': ['beta ar jacket men\'s'],
    'atom jacket': ['atom jacket men\'s'],
    'atom jacket men\'s': ['atom jacket men\'s'],
    'atom sv jacket': ['atom sv jacket men\'s'],
    'atom sv jacket men\'s': ['atom sv jacket men\'s'],
    'alpha jacket': ['alpha jacket men\'s'],
    'alpha jacket men\'s': ['alpha jacket men\'s'],
    'beta jacket': ['beta jacket men\'s'],
    'beta jacket men\'s': ['beta jacket men\'s'],
    'gamma jacket': ['gamma jacket men\'s'],
    'gamma jacket men\'s': ['gamma jacket men\'s'],
    'delta jacket': ['delta jacket men\'s'],
    'delta jacket men\'s': ['delta jacket men\'s'],
    'macai jacket': ['macai jacket men\'s'],
    'macai jacket men\'s': ['macai jacket men\'s'],
    'sabre jacket': ['sabre jacket men\'s'],
    'sabre jacket men\'s': ['sabre jacket men\'s'],
    'fissile sv down jacket': ['fissile sv down jacket men\'s'],
    'fissile sv down jacket men\'s': ['fissile sv down jacket men\'s'],
    'kyanite jacket': ['kyanite jacket men\'s'],
    'kyanite jacket men\'s': ['kyanite jacket men\'s']
  };
  
  // Look for product mentions in the AI response
  Object.entries(productNameMappings).forEach(([aiName, dbNames]) => {
    if (responseLower.includes(aiName)) {
      console.log(`🎯 EXACT EXTRACTION: Found AI mention "${aiName}"`);
      
      // Find the actual products in the database
      dbNames.forEach(dbName => {
        const matchingProduct = products.find(product => 
          product.name.toLowerCase() === dbName
        );
        
        if (matchingProduct && !extractedProducts.find(p => p.id === matchingProduct.id)) {
          extractedProducts.push(matchingProduct);
          console.log(`✅ EXACT EXTRACTION: Mapped "${aiName}" to "${matchingProduct.name}"`);
        }
      });
    }
  });
  
  // Also look for exact product name matches (in case AI uses correct names)
  products.forEach(product => {
    const productNameLower = product.name.toLowerCase();
    
    // Check if the exact product name is mentioned
    if (responseLower.includes(productNameLower)) {
      if (!extractedProducts.find(p => p.id === product.id)) {
        extractedProducts.push(product);
        console.log(`✅ EXACT EXTRACTION: Found exact match "${product.name}"`);
      }
    }
  });
  
  console.log(`🎯 EXACT EXTRACTION: Found ${extractedProducts.length} exact matches`);
  return extractedProducts;
}

function forceCorrectProducts(aiResponse: string, products: Product[], contextualQuery: string): Product[] {
  console.log(`🚨 FORCE CORRECT: AI mentioned products but we need to show the right ones`);
  
  // Analyze what the AI was trying to recommend based on context
  const responseLower = aiResponse.toLowerCase();
  const contextLower = contextualQuery.toLowerCase();
  
  let forcedProducts: Product[] = [];
  
  // If it's about cold weather / Antarctica / winter
  if (contextLower.includes('cold') || contextLower.includes('antarctica') || contextLower.includes('winter') || contextLower.includes('extreme')) {
    console.log(`🚨 FORCE CORRECT: Cold weather context detected`);
    
    // Get the best cold weather jackets from the database
    const coldWeatherJackets = products.filter(p => {
      const name = p.name.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      
      return category === 'jackets' && (
        name.includes('alpha sv') ||
        name.includes('therme down') ||
        name.includes('cerium') ||
        name.includes('atom sv') ||
        name.includes('fissile sv') ||
        desc.includes('down') ||
        desc.includes('insulated') ||
        desc.includes('warm')
      );
    });
    
    // Sort by relevance and take top 3
    forcedProducts = coldWeatherJackets
      .sort((a, b) => {
        // Prioritize specific cold weather models
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName.includes('alpha sv')) return -1;
        if (bName.includes('alpha sv')) return 1;
        if (aName.includes('therme down')) return -1;
        if (bName.includes('therme down')) return 1;
        if (aName.includes('cerium')) return -1;
        if (bName.includes('cerium')) return 1;
        
        return 0;
      })
      .slice(0, 3);
  }
  
  // If it's about mid layers / spring / layering
  else if (contextLower.includes('mid') || contextLower.includes('layer') || contextLower.includes('spring') || contextLower.includes('insulation')) {
    console.log(`🚨 FORCE CORRECT: Mid-layer context detected`);
    
    const midLayerProducts = products.filter(p => {
      const name = p.name.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      
      return (category === 'jackets' || category === 'shirts') && (
        name.includes('atom') ||
        name.includes('cerium') ||
        name.includes('delta') ||
        name.includes('kyanite') ||
        desc.includes('insulation') ||
        desc.includes('fleece') ||
        desc.includes('mid')
      );
    });
    
    forcedProducts = midLayerProducts.slice(0, 3);
  }
  
  // General jacket context
  else if (responseLower.includes('jacket') || contextLower.includes('jacket')) {
    console.log(`🚨 FORCE CORRECT: General jacket context detected`);
    
    const generalJackets = products.filter(p => {
      const category = (p.category || '').toLowerCase();
      return category === 'jackets';
    });
    
    // Sort by rating and take top 3
    forcedProducts = generalJackets
      .filter(p => p.rating?.average)
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        return ratingB - ratingA;
      })
      .slice(0, 3);
  }
  
  console.log(`🚨 FORCE CORRECT: Selected ${forcedProducts.length} products:`, forcedProducts.map(p => p.name));
  return forcedProducts;
}

function enhancedProductMatching(aiResponse: string, products: Product[]): Product[] {
  console.log(`🔍 Enhanced matching: Analyzing AI response for product mentions`);
  const responseLower = aiResponse.toLowerCase();
  const matchedProducts: Product[] = [];
  
  // Look for common Arc'teryx product patterns in AI response
  // Updated to match actual database product names
  const productPatterns = [
    // Exact model matches (updated to match database names)
    { pattern: /beta ar/g, type: 'model', dbName: 'beta ar jacket' },
    { pattern: /alpha sv/g, type: 'model', dbName: 'alpha sv jacket' },
    { pattern: /alpha jacket/g, type: 'model', dbName: 'alpha jacket' },
    { pattern: /atom jacket/g, type: 'model', dbName: 'atom jacket' },
    { pattern: /atom sv/g, type: 'model', dbName: 'atom sv jacket' },
    { pattern: /cerium jacket/g, type: 'model', dbName: 'cerium jacket' },
    { pattern: /cerium lt/g, type: 'model', dbName: 'cerium jacket' }, // Map LT to base model
    { pattern: /thorium ar/g, type: 'model', dbName: 'therme down jacket' }, // Map to closest match
    { pattern: /gamma jacket/g, type: 'model', dbName: 'gamma jacket' },
    { pattern: /gamma mx/g, type: 'model', dbName: 'gamma mx jacket' },
    { pattern: /beta jacket/g, type: 'model', dbName: 'beta jacket' },
    { pattern: /beta sl/g, type: 'model', dbName: 'beta sl jacket' },
    { pattern: /macai jacket/g, type: 'model', dbName: 'macai jacket' },
    { pattern: /sabre jacket/g, type: 'model', dbName: 'sabre jacket' },
    
    // Product type matches
    { pattern: /jacket/g, type: 'category' },
    { pattern: /vest/g, type: 'category' },
    { pattern: /pant/g, type: 'category' },
    { pattern: /shell/g, type: 'category' }
  ];
  
  // Find products mentioned by model name first (highest priority)
  productPatterns.filter(p => p.type === 'model').forEach(({ pattern, dbName }) => {
    const matches = responseLower.match(pattern);
    if (matches) {
      const modelName = matches[0];
      console.log(`🎯 Enhanced matching: Found model mention "${modelName}", looking for "${dbName}"`);
      
      const matchingProducts = products.filter(product => {
        const productNameLower = product.name.toLowerCase();
        // Try exact match first, then partial match
        return productNameLower.includes(dbName || modelName) || 
               productNameLower.includes(modelName);
      });
      
      matchingProducts.forEach(product => {
        if (!matchedProducts.find(p => p.id === product.id)) {
          matchedProducts.push(product);
          console.log(`✅ Enhanced matching: Matched "${product.name}" for model "${modelName}"`);
        }
      });
    }
  });
  
  // If we found model matches, return those (most specific)
  if (matchedProducts.length > 0) {
    console.log(`🎯 Enhanced matching: Found ${matchedProducts.length} model matches, returning them`);
    return matchedProducts.slice(0, 6);
  }
  
  // Otherwise, look for category matches and return top products
  console.log(`🎯 Enhanced matching: No model matches, looking for category matches`);
  productPatterns.filter(p => p.type === 'category').forEach(({ pattern }) => {
    const matches = responseLower.match(pattern);
    if (matches) {
      const categoryName = matches[0];
      console.log(`🎯 Enhanced matching: Found category mention "${categoryName}"`);
      
      const matchingProducts = products.filter(product => {
        const category = (product.category || '').toLowerCase();
        return category.includes(categoryName) || 
               (categoryName === 'jacket' && category === 'jackets') ||
               (categoryName === 'pant' && category === 'pants');
      });
      
      // Take top products from this category (don't require ratings)
      const sortedProducts = matchingProducts
        .sort((a, b) => {
          // Sort by rating if available, otherwise by name
          const ratingA = parseFloat(a.rating?.average || '0');
          const ratingB = parseFloat(b.rating?.average || '0');
          if (ratingA && ratingB) {
            return ratingB - ratingA;
          }
          return a.name.localeCompare(b.name);
        })
        .slice(0, 6);
      
      sortedProducts.forEach(product => {
        if (!matchedProducts.find(p => p.id === product.id)) {
          matchedProducts.push(product);
          console.log(`✅ Enhanced matching: Matched "${product.name}" for category "${categoryName}"`);
        }
      });
    }
  });
  
  console.log(`🎯 Enhanced matching: Final result - ${matchedProducts.length} products matched`);
  return matchedProducts.slice(0, 6);
}

function getArcteryxKnowledge(genderPreference: GenderPreference): string {
  const genderLabel = genderPreference === 'all' ? "ALL" :
    genderPreference === 'women' ? "WOMEN'S" :
      genderPreference === 'men' ? "MEN'S" : "PRODUCTS";

  const productCatalog = buildProductCatalog(genderPreference);

  return `
ARC'TERYX ${genderLabel} PRODUCT CATALOG (Current Inventory - ${genderLabel} PRODUCTS):

${genderPreference === 'women' ? '⚠️ NOTE: This catalog contains WOMEN\'S products. Use this catalog when users ask for women\'s products.' : genderPreference === 'men' ? '⚠️ NOTE: This catalog contains MEN\'S products. Use this catalog when users ask for men\'s products.' : '⚠️ NOTE: This catalog contains products from both men\'s and women\'s collections.'}

${productCatalog}

ADDITIONAL PRODUCT INFORMATION:

TECHNOLOGIES & MATERIALS:
- Gore-Tex Pro: Most durable, waterproof, breathable, extreme conditions
- Gore-Tex: Standard waterproof/breathable, versatile use
- Gore-Tex C-Knit: Softer, quieter, next-to-skin comfort
- Coreloft: Synthetic insulation, retains warmth when wet
- Down: Natural insulation, best warmth-to-weight, compressible
- Polartec Power Stretch: Four-way stretch, breathable, soft shell
- N80p-X: Durable face fabric, abrasion-resistant
- Bluesign approved: Sustainable manufacturing standards

SIZING:
- Arcteryx uses regular, slim, and relaxed fits
- Men's sizes: XS, S, M, L, XL, XXL
- Women's sizes: XXS, XS, S, M, L, XL
- Fit varies by product line - Alpha/Beta (regular), Veilance (slim)
- Size chart: Generally true to size, but check specific product
- Layering: Consider sizing up for layering underneath

COLLECTIONS:
- Core: Main outdoor performance line
- Veilance: Urban technical wear, minimalist design, premium
- System A: Streetwear-inspired, technical fabrics
- LEAF: Law Enforcement & Armed Forces, tactical gear

ACTIVITY RECOMMENDATIONS:
- Alpine Climbing: Alpha SV jacket, Beta AR pants, Atom LT mid-layer
- Skiing/Snowboarding: Beta AR jacket, Atom AR or Cerium LT, Beta AR pants
- Hiking/Backpacking: Beta LT or Zeta AR jacket, Gamma LT pants, Atom LT
- Trail Running: Beta LT or lightweight shell, Gamma LT pants
- Mountaineering: Alpha SV, Cerium LT or Thorium AR, Beta AR pants
- Cold Weather: Thorium AR or Atom AR, Delta AR pants

LAYERING SYSTEM:
1. Base Layer: Moisture-wicking (e.g., Rho, Motus)
2. Mid Layer: Insulation (Atom LT/AR, Cerium LT, Delta AR)
3. Outer Layer: Shell (Alpha/Beta/Zeta series)
4. Accessories: Toque, gloves, gaiters

CARE & WARRANTY:
- Lifetime warranty on manufacturing defects
- Proper care extends product life: wash regularly with technical detergent
- DWR (Durable Water Repellent) refresh: wash and tumble dry low
- Store clean and dry, avoid compression for down products
- Professional repairs available through ReBird program

SUSTAINABILITY:
- ReBird resale program for used gear
- Bluesign approved materials
- Recycled content in many products
- Fair Trade certified factories
- Product care extends lifespan, reducing waste

PRICING RANGES:
- Entry: $100-200 (base layers, accessories)
- Mid: $200-400 (Atom LT, Gamma LT, Beta LT)
- Premium: $400-600 (Beta AR, Cerium LT, Thorium AR)
- Pro: $600+ (Alpha SV, specialized gear)
`;
}

export async function handleProductRequest(options: ProductAgentOptions): Promise<ProductAgentResponse> {
  const { messages, languageCode, currentGenderPreference } = options;

  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastUserMessageText = lastUserMessage?.content || '';
  const allUserMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content?.toLowerCase() || '');

  const isGenderClear = currentGenderPreference !== null;
  const genderLabel = currentGenderPreference === 'all' ? "ALL" :
    currentGenderPreference === 'women' ? "WOMEN'S" :
      currentGenderPreference === 'men' ? "MEN'S" : "PRODUCTS";

  // Analyze conversation context for better recommendations
  const conversationContext = analyzeProductContext(messages, lastUserMessageText);

  // Debug logging
  console.log(`🔍 Product Agent Debug:`, {
    lastMessage: lastUserMessageText,
    isGenderClear,
    currentGenderPreference,
    previousRequests: conversationContext.previousRequests,
    isGenderResponse: conversationContext.isGenderResponse,
    summary: conversationContext.summary
  });

  // Only use direct extraction for very specific, complete product requests
  // NOT for gender responses or ambiguous queries
  const shouldSkipDirectExtraction =
    conversationContext.isGenderResponse || // User just specified gender (follow-up)
    lastUserMessageText.toLowerCase().length < 10; // Very short messages
  // Removed: conversationContext.previousRequests.length > 0 - this was preventing initial gender-specific queries

  // COMMENTED OUT: Direct extraction logic to prevent generic product displays
  
  // if (!shouldSkipDirectExtraction && isGenderClear) {
  //   const conversationHistory = allUserMessages.slice(0, -1);
  //   console.log(`🔍 Attempting direct extraction with:`, {
  //     query: lastUserMessageText,
  //     genderPreference: currentGenderPreference,
  //     conversationHistory: conversationHistory.length,
  //     shouldSkip: shouldSkipDirectExtraction,
  //     isGenderClear
  //   });

  //   const directProducts = extractProductsFromQuery({
  //     query: lastUserMessageText,
  //     genderPreference: currentGenderPreference,
  //     conversationHistory,
  //   });

  //   console.log(`🎯 Direct extraction result: ${directProducts.length} products found`);
  //   if (directProducts.length > 0) {
  //     console.log(`✅ Product Agent: Extracted ${directProducts.length} products directly from query:`, directProducts.map(p => p.name));
  //     const encoder = new TextEncoder();
  //     const stream = new ReadableStream({
  //       async start(controller) {
  //         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: directProducts })}\n\n`));
  //         controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
  //         controller.close();
  //       },
  //     });
  //     return { stream, products: directProducts };
  //   } else {
  //     console.log(`⚠️ Direct extraction found 0 products - falling back to AI processing`);
  //   }
  // } else {
  //   console.log(`🚫 Skipping direct extraction - using AI for context-aware response`, {
  //     shouldSkipDirectExtraction,
  //     isGenderClear,
  //     isGenderResponse: conversationContext.isGenderResponse,
  //     messageLength: lastUserMessageText.length,
  //     hasPreviousRequests: conversationContext.previousRequests.length > 0
  //   });
  // }
  
  console.log(`🚫 DIRECT EXTRACTION DISABLED: All queries will go through AI processing only`);

  // Build system message
  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond to the user in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  const arcteryxKnowledge = isGenderClear
    ? getArcteryxKnowledge(currentGenderPreference!)
    : `⚠️ IMPORTANT: Gender preference has NOT been set yet. You MUST ask the user to clarify if they want MEN'S or WOMEN'S products BEFORE showing any products or making recommendations.

When the user asks about products, respond with: "Are you looking for men's or women's [product type]?" and wait for their response before proceeding.

${getArcteryxKnowledge(null)}`;

  const systemMessage: { role: 'system'; content: string } = {
    role: 'system',
    content: `You are an expert Arc'teryx product specialist and outdoor gear consultant. Your mission is to understand each customer's unique needs and match them with the perfect gear for their adventures.${languageInstruction}

🎯 CONVERSATION CONTEXT:
${conversationContext.summary}

🔍 SPECIAL QUERY ANALYSIS:
${lastUserMessageText.toLowerCase().includes('what about') ? `
🚨 "WHAT ABOUT..." QUERY DETECTED!

This is a RECOMMENDATION REQUEST in the current context, NOT an informational question.

CRITICAL INSTRUCTIONS:
- The user is asking for product recommendations for "${lastUserMessageText.replace(/what about/i, '').trim()}"
- Use the conversation context to understand what they need
- Provide specific product recommendations with names and prices
- DO NOT explain what the product category is - they want recommendations!

Example: If they ask "what about mid layers", recommend specific mid-layer products like:
"For mid layers in your context, I recommend: **Atom Jacket Men's - $350 CAD** - Perfect synthetic insulation..."` : ''}

${conversationContext.previousRequests.length > 0 ? `
Previous context: ${conversationContext.previousRequests.join(' → ')}`  : ''}

📝 CONVERSATION HISTORY ANALYSIS:
${conversationContext.previousRequests.length > 0 ? `
Previous product requests in this conversation:
${conversationContext.previousRequests.map((req, idx) => `${idx + 1}. "${req}"`).join('\n')}

🚨 CRITICAL CONTEXT RULE: When the user specifies gender after a product request, you MUST combine the gender with their original request. 
Example: If they asked for "jacket for skiing" and then said "men's", recommend MEN'S JACKETS FOR SKIING, not generic men's jackets.

🔍 CURRENT SITUATION ANALYSIS:
${conversationContext.isGenderResponse ? `
🚨 CRITICAL ALERT: User just specified gender preference - this is a continuation of their previous request!

IMMEDIATE ACTION REQUIRED:
The user previously asked: "${conversationContext.previousRequests[conversationContext.previousRequests.length - 1]}"
Now they specified: ${currentGenderPreference === 'women' ? 'WOMEN\'S' : 'MEN\'S'} products

⚠️ CRITICAL GENDER RULE: You MUST use ${currentGenderPreference === 'women' ? 'WOMEN\'S' : 'MEN\'S'} products ONLY!
- Current gender setting: ${currentGenderPreference === 'women' ? 'WOMEN\'S' : 'MEN\'S'}
- DO NOT recommend ${currentGenderPreference === 'women' ? 'men\'s' : 'women\'s'} products
- ONLY use products from the ${currentGenderPreference === 'women' ? 'WOMEN\'S' : 'MEN\'S'} catalog above

MANDATORY OPENING: "Perfect! For ${currentGenderPreference === 'women' ? 'women\'s' : 'men\'s'} ${conversationContext.previousRequests[conversationContext.previousRequests.length - 1].toLowerCase().replace(/^(i want|i need|looking for|show me)/, '').trim()}, I recommend..."` : `
✅ This appears to be a new product inquiry - proceed normally.`}` : 'This appears to be a new product inquiry.'}

⚠️ GENDER PREFERENCE PROTOCOL ⚠️
- Current gender preference: ${isGenderClear ? (currentGenderPreference === 'women' ? 'WOMEN\'S' : currentGenderPreference === 'men' ? 'MEN\'S' : 'ALL') : 'NOT SET - MUST CLARIFY FIRST'}
${isGenderClear ? `✅ Gender is set - proceed with ${genderLabel} product recommendations` : `❌ Gender NOT set - You MUST ask: "Are you looking for men's or women's [product type]?" before showing any products`}

${arcteryxKnowledge}

🧠 INTELLIGENT RECOMMENDATION APPROACH:
${isGenderClear ? `
1. UNDERSTAND THE NEED:
   - What activity/environment? (skiing, hiking, city, etc.)
   - What conditions? (weather, season, intensity)
   - What's their experience level? (beginner, intermediate, expert)
   - What's their priority? (performance, comfort, style, budget)

2. MATCH PRODUCTS STRATEGICALLY:
   - Start with 2-3 core recommendations that directly address their need
   - Explain WHY each product fits (technical features, use cases)
   - Mention real product names, prices, and key features from the catalog
   - Consider layering systems and complementary products
   - Address any concerns or limitations honestly

3. PERSONALIZE THE EXPERIENCE:
   - Reference their specific use case in explanations
   - Suggest sizing considerations for their activity
   - Mention care tips for longevity
   - Offer alternatives at different price points when relevant

4. ENABLE PRODUCT DISCOVERY:
   - CRITICAL: ALWAYS mention specific product names (Beta AR, Alpha SV, Atom LT, etc.)
   - Use exact product names from the catalog to trigger product tiles
   - Mention 2-3 products minimum in every recommendation
   - Say things like "I recommend the Beta AR jacket" or "Consider the Atom LT vest"` : `
🚫 GENDER NOT SET - Ask for clarification before proceeding with product recommendations`}

🎯 MANDATORY RESPONSE STRUCTURE:
You MUST follow this exact structure for EVERY response:

1. **REITERATE USER REQUEST** (1 sentence)
   - Acknowledge what the user is looking for
   - Example: "You're looking for men's jackets for very cold weather in Antarctica."

2. **PRODUCT RECOMMENDATIONS** (2-3 products with details)
   - For each product: **Product Name - Price CAD** - One sentence explanation
   - Example: "**Thorium AR Jacket - $450 CAD** - This down-insulated jacket provides exceptional warmth for extreme cold conditions like Antarctica."
   - Example: "**Alpha SV Jacket - $825 CAD** - The most durable shell jacket with Gore-Tex Pro for ultimate protection against harsh weather."

3. **PRODUCT CAROUSEL APPEARS AUTOMATICALLY** (system handles this)

EXAMPLES OF PERFECT RESPONSES:

✅ PERFECT STRUCTURE:
"You're looking for men's jackets for very cold weather in Antarctica.

For extreme cold conditions, I recommend:

**Thorium AR Jacket - $450 CAD** - This down-insulated jacket provides exceptional warmth-to-weight ratio perfect for Antarctic conditions.

**Alpha SV Jacket - $825 CAD** - The most durable Gore-Tex Pro shell for ultimate protection against wind and snow.

**Cerium LT Jacket - $375 CAD** - Lightweight down insulation that's perfect for layering in extreme cold."

❌ WRONG - Missing reiteration, no prices, wrong format

🎯 PRODUCT NAME TRIGGERS (Use these EXACT names from the catalog to ensure product tiles appear):

COLD WEATHER JACKETS (for Antarctica, winter, extreme cold):
- "Alpha SV Jacket Men's" - Most durable shell for severe conditions
- "Therme Down Jacket Men's" - Waterproof down jacket for cold and wet conditions  
- "Cerium Jacket Men's" - Lightweight, warm, versatile down jacket
- "Atom SV Jacket Men's" - Warmest Atom jacket for cold-weather hiking
- "Fissile SV Down Jacket Men's" - Pinnacle resort jacket

ALL-WEATHER SHELLS:
- "Beta AR Jacket Men's" - Durable, protective all-mountain shell
- "Beta Jacket Men's" - GORE-TEX ePE shell made for maximum versatility
- "Alpha Jacket Men's" - Light, durable hardshell for alpine ascents

MID-LAYERS & INSULATION:
- "Atom Jacket Men's" - Warm-even-when-wet synthetically insulated jacket
- "Delta Jacket Men's" - Fleece jacket delivering warmth for less weight
- "Kyanite Jacket Men's" - Warm Polartec stretch fleece jacket

CRITICAL RULES:
1. ONLY use product names from the list above - they are verified to exist in the database
2. NEVER mention "Thorium AR" - it doesn't exist (use "Therme Down Jacket Men's" instead)
3. NEVER mention "LT" or "AR" versions unless specifically listed above
4. Always include "Men's" or "Women's" suffix exactly as shown

Remember: Be helpful but CONCISE - the product tiles will show the details!`
  };

  // Call AI
  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 300, // Reduced from 1000 to force concise responses
    temperature: 0.7,
    stream: true,
  });

  const products = getProductDataByGender(currentGenderPreference);
  let fullResponse = '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Stream all content first, then extract products at the end
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          // Always stream content immediately without interruption
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      // UPSELL FEATURE: Always show relevant products after every response
      console.log(`🎯 AI Response complete. Length: ${fullResponse.length} chars`);

      if (isGenderClear && fullResponse.length > 20) {
        // Build contextual query from entire conversation for better product matching
        const contextualQuery = conversationContext.previousRequests.length > 0
          ? `${conversationContext.previousRequests.join(' ')} ${lastUserMessageText}`
          : lastUserMessageText;

        console.log(`🔍 UPSELL: Extracting products for contextual query: "${contextualQuery}"`);

        // PRIORITY 1: Extract products specifically mentioned by AI (most important)
        console.log(`🎯 PRIORITY 1: Extracting products mentioned by AI in response`);
        console.log(`🔍 DEBUG: AI Response text: "${fullResponse}"`);
        console.log(`🔍 DEBUG: Available products sample:`, products.slice(0, 3).map(p => p.name));
        
        // SMART EXTRACTION: Parse AI response for product mentions and map to real products
        let extractedProducts = extractExactAIMentionedProducts(fullResponse, products);
        console.log(`🔍 DEBUG: Smart extraction returned ${extractedProducts.length} products:`, extractedProducts.map(p => p.name));
        
        // COMMENTED OUT: All fallback logic to ensure carousel shows ONLY AI-mentioned products
        
        // // CRITICAL FIX: If AI mentioned products but we couldn't find exact matches, 
        // // this means the AI is hallucinating product names. Force show the correct products.
        // if (extractedProducts.length === 0 && (fullResponse.includes('jacket') || fullResponse.includes('recommend'))) {
        //   console.log(`🚨 CRITICAL FIX: AI mentioned products but none found - forcing correct products`);
        //   extractedProducts = forceCorrectProducts(fullResponse, products, contextualQuery);
        //   console.log(`🔍 DEBUG: Forced correct products:`, extractedProducts.map(p => p.name));
        // }
        
        // // STOP HERE if we found any exact matches - don't add extra products
        // if (extractedProducts.length > 0) {
        //   console.log(`✅ EXACT MATCH SUCCESS: Found ${extractedProducts.length} exact matches, using ONLY these products`);
        // } else {
        //   // PRIORITY 2: If AI mentioned products but we couldn't match them, try enhanced matching
        //   if (fullResponse.includes('jacket') || fullResponse.includes('vest') || fullResponse.includes('pant') || fullResponse.includes('recommend')) {
        //     console.log(`🔍 PRIORITY 2: AI mentioned products but no exact matches found - trying enhanced matching`);
        //     extractedProducts = enhancedProductMatching(fullResponse, products);
        //     console.log(`🔍 DEBUG: enhancedProductMatching returned ${extractedProducts.length} products:`, extractedProducts.map(p => p.name));
        //   }
        // }

        // // PRIORITY 3: If still no products, FORCE show products based on conversation context (UPSELL)
        // if (extractedProducts.length === 0) {
        //   console.log(`🛒 PRIORITY 3: FORCING product display for upsell - extracting from conversation context`);
        //   extractedProducts = extractProductsFromQuery({
        //     query: contextualQuery,
        //     genderPreference: currentGenderPreference,
        //     conversationHistory: conversationContext.previousRequests,
        //     limit: 6
        //   });
        //   console.log(`🔍 DEBUG: Fallback extractProductsFromQuery returned ${extractedProducts.length} products:`, extractedProducts.map(p => p.name));
        // }

        // // PRIORITY 4: If STILL no products, show top-rated products as final fallback
        // if (extractedProducts.length === 0) {
        //   console.log(`🚨 PRIORITY 4: EMERGENCY FALLBACK - showing top-rated products`);
        //   extractedProducts = products
        //     .filter(p => p.rating?.average && parseFloat(p.rating.average) > 4.0)
        //     .sort((a, b) => {
        //       const ratingA = parseFloat(a.rating?.average || '0');
        //       const ratingB = parseFloat(b.rating?.average || '0');
        //       return ratingB - ratingA;
        //     })
        //     .slice(0, 6);
        //   console.log(`🔍 DEBUG: Emergency fallback returned ${extractedProducts.length} products:`, extractedProducts.map(p => p.name));
        // }
        
        console.log(`🎯 FINAL DECISION: Using ONLY exact AI-mentioned products (${extractedProducts.length} products):`, extractedProducts.map(p => p.name));

        if (extractedProducts.length > 0) {
          console.log(`✅ UPSELL: Showing ${extractedProducts.length} products:`, extractedProducts.map(p => p.name));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: extractedProducts })}\n\n`));
        } else {
          console.log(`⚠️ UPSELL: No relevant products found for context - this should be rare`);
        }
      } else {
        console.log(`⚠️ Skipping upsell products - no gender set or response too short`);
      }

      // Always send DONE at the end
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return { stream };
}

