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
      catalog += `- ${product.name}: ${product.description}. $${product.price} CAD${rating}${badges}${colors}\n`;
    });
  });

  return catalog;
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

  // Check if we can extract products directly from user query
  const conversationHistory = allUserMessages.slice(0, -1);
  const directProducts = extractProductsFromQuery({
    query: lastUserMessageText,
    genderPreference: currentGenderPreference,
    conversationHistory,
  });

  if (directProducts.length > 0 && isGenderClear) {
    console.log(`✅ Product Agent: Extracted ${directProducts.length} products directly from query`);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Log product extraction
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: { level: 'success', message: `Extracted ${directProducts.length} products`, details: `Products matched from ${genderLabel} catalog` } })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: directProducts })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });
    return { stream, products: directProducts };
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
    content: `You are an expert Arcteryx product specialist and shopping assistant. Your role is to help customers find the perfect gear for their outdoor adventures through intelligent, personalized recommendations.${languageInstruction}

⚠️ CRITICAL: PRODUCT GENDER CLARIFICATION ⚠️
- ALWAYS clarify gender preference FIRST before showing any products
- When a user asks about ANY product, you MUST check if gender is clear:
  * If they mentioned "men's", "men", "male", "guy's", "guys" → Use MEN'S products from catalog (NO need to ask again)
  * If they mentioned "women's", "women", "female", "ladies", "lady's" → Use WOMEN'S products from catalog (NO need to ask again)
  * If gender is NOT mentioned AND it's a product-related query → You MUST ask for clarification FIRST: "Are you looking for men's or women's [product]?" Do NOT show products until gender is clarified.
- Current gender preference: ${isGenderClear ? (currentGenderPreference === 'women' ? 'WOMEN\'S' : currentGenderPreference === 'men' ? 'MEN\'S' : 'ALL') : 'NOT SET - MUST CLARIFY FIRST'}

${arcteryxKnowledge}

KEY RESPONSIBILITIES:
${isGenderClear ? `- Use the ACTUAL product catalog above (with real product names, prices, and descriptions) to make accurate recommendations for ${genderLabel} products
- Reference specific products by their exact names from the catalog
- CRITICAL: Always mention at least 2-5 specific product names from the catalog when making recommendations - this enables the product carousel to display them
- ONLY answer what the user asks - don't add extra information unless asked` : `- DO NOT show products until gender is clarified. Ask: "Are you looking for men's or women's [product]?"`}

COMMUNICATION STYLE:
- ALWAYS respond in SHORT, BULLET-POINT format unless the user explicitly asks to elaborate or explain in detail
- Keep answers EXTREMELY concise - maximum 2-3 bullet points
- ONLY respond to what the user asks - don't volunteer extra information
- Use bullet points (•) or dashes (-) for lists
- Only provide detailed explanations if user asks "tell me more", "elaborate", "explain", "details", etc.
- Don't add unsolicited information about pricing, colors, ratings, or features unless the user specifically asks
- Don't suggest complementary products unless asked
- Don't mention warranty or sustainability unless asked
- Be direct and to the point - answer the question and stop`
  };

  // Call AI
  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 200,
    temperature: 0.7,
    stream: true,
  });

  const products = getProductDataByGender(currentGenderPreference);
  let fullResponse = '';
  let productsSent = false;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let charCount = 0;
      let foundProducts: Product[] = [];
      
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          charCount += content.length;

          // Check for products in response, but don't send them yet - wait for more explanation
          if (!productsSent && isGenderClear && charCount > 100) {
            const extractedProducts = extractProductsFromText(fullResponse, products, lastUserMessageText);
            if (extractedProducts.length > 0) {
              foundProducts = extractedProducts;
              // Don't send products yet - continue streaming text for explanation
            }
          }

          // Always stream text content - don't stop even if products are found
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }

      // After streaming is complete, send products if found
      if (isGenderClear) {
        const extractedProducts = foundProducts.length > 0 
          ? foundProducts 
          : extractProductsFromText(fullResponse, products, lastUserMessageText);
        
        if (extractedProducts.length > 0) {
          console.log(`✅ Product Agent: Extracted ${extractedProducts.length} products after streaming`);
          // Log product extraction
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: { level: 'success', message: `Extracted ${extractedProducts.length} products after streaming`, details: `Products matched from ${genderLabel} catalog` } })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: extractedProducts })}\n\n`));
          productsSent = true;
        }
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return { stream };
}

