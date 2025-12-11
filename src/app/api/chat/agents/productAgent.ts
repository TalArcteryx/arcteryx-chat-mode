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

  if (!shouldSkipDirectExtraction && isGenderClear) {
    const conversationHistory = allUserMessages.slice(0, -1);
    console.log(`🔍 Attempting direct extraction with:`, {
      query: lastUserMessageText,
      genderPreference: currentGenderPreference,
      conversationHistory: conversationHistory.length,
      shouldSkip: shouldSkipDirectExtraction,
      isGenderClear
    });
    
    const directProducts = extractProductsFromQuery({
      query: lastUserMessageText,
      genderPreference: currentGenderPreference,
      conversationHistory,
    });

    console.log(`🎯 Direct extraction result: ${directProducts.length} products found`);
    if (directProducts.length > 0) {
      console.log(`✅ Product Agent: Extracted ${directProducts.length} products directly from query:`, directProducts.map(p => p.name));
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: directProducts })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return { stream, products: directProducts };
    } else {
      console.log(`⚠️ Direct extraction found 0 products - falling back to AI processing`);
    }
  } else {
    console.log(`🚫 Skipping direct extraction - using AI for context-aware response`, {
      shouldSkipDirectExtraction,
      isGenderClear,
      isGenderResponse: conversationContext.isGenderResponse,
      messageLength: lastUserMessageText.length,
      hasPreviousRequests: conversationContext.previousRequests.length > 0
    });
  }

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

💬 COMMUNICATION STYLE - CONCISE & PRODUCT-FOCUSED:
- Keep responses SHORT and to the point (2-3 sentences max)
- ALWAYS mention specific product names when making recommendations
- Focus on the most important features/benefits only
- Let the product carousel do the visual selling
- Be enthusiastic but brief

🎨 RESPONSE STRUCTURE - KEEP IT SIMPLE:
1. Brief acknowledgment (1 sentence)
2. Mention 2-3 specific product names with key benefit
3. One sentence about why they're perfect for their need
4. End with offer to help with questions

EXAMPLES OF GOOD RESPONSES:
❌ TOO WORDY: "That's a great question! For skiing, you'll want something that offers excellent waterproof protection while maintaining breathability. The technical features you should look for include Gore-Tex Pro fabric, which provides the most durable waterproof protection, and proper ventilation systems. I'd recommend considering the Beta AR jacket, which features Gore-Tex Pro construction and is specifically designed for alpine conditions. It offers excellent durability and weather protection. You might also want to consider the Alpha SV for more extreme conditions, though it's a bit heavier. Both of these jackets offer excellent value and performance for skiing applications."

✅ PERFECT: "For skiing, I recommend the Beta AR jacket and Alpha SV jacket. Both feature Gore-Tex Pro for maximum waterproof protection and are built specifically for mountain conditions. Need help with sizing or have other questions?"

🎯 PRODUCT NAME TRIGGERS (Use these exact names to ensure product tiles appear):
- Jackets: "Beta AR jacket", "Alpha SV jacket", "Zeta SL jacket", "Atom LT jacket"
- Pants: "Beta AR pants", "Gamma LT pants", "Atom LT pants"  
- Mid-layers: "Atom LT vest", "Cerium LT vest", "Thorium AR jacket"
- Always say "jacket", "vest", "pants" after the product name!

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

      // ENHANCED: Always try to extract products when AI mentions them
      console.log(`🎯 AI Response complete. Length: ${fullResponse.length} chars`);
      
      if (isGenderClear && fullResponse.length > 50) {
        // Use contextual query for product extraction
        const contextualQuery = conversationContext.previousRequests.length > 0 
          ? `${conversationContext.previousRequests.join(' ')} ${lastUserMessageText}` 
          : lastUserMessageText;
        
        console.log(`🔍 Attempting to extract products from AI response...`);
        const extractedProducts = extractProductsFromText(fullResponse, products, contextualQuery);
        
        if (extractedProducts.length > 0) {
          console.log(`✅ Found ${extractedProducts.length} products specifically mentioned by AI:`, extractedProducts.map(p => p.name));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: extractedProducts })}\n\n`));
        } else {
          console.log(`ℹ️ No products specifically mentioned by AI - not showing any products (this is correct behavior)`);
        }
      } else {
        console.log(`⚠️ Skipping product extraction - no gender set or response too short`);
      }

      // Always send DONE at the end
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return { stream };
}

