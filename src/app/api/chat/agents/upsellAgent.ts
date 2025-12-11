import { OpenAI } from 'openai';
import { getProductDataByGender, Product } from '../utils/dataLoader';
import { GenderPreference } from '../utils/genderDetector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface UpsellAgentOptions {
  addedProduct: {
    id: string;
    name: string;
    category?: string;
    description?: string;
    price: number;
  };
  cartItems: Array<{
    id: string;
    name: string;
    category?: string;
  }>;
  languageCode: string;
  genderPreference: GenderPreference;
  conversationContext?: string;
}

export interface UpsellAgentResponse {
  stream: ReadableStream;
  products?: Product[];
}

function getComplementaryProducts(
  addedProduct: UpsellAgentOptions['addedProduct'],
  cartItems: UpsellAgentOptions['cartItems'],
  genderPreference: GenderPreference,
  conversationContext?: string
): Product[] {
  const allProducts = getProductDataByGender(genderPreference);
  
  // Get categories already in cart (including the newly added item)
  const cartCategories = new Set([
    ...cartItems.map(item => item.category?.toLowerCase() || ''),
    addedProduct.category?.toLowerCase() || ''
  ]);
  
  // Get product IDs already in cart
  const cartProductIds = new Set([
    ...cartItems.map(item => item.id),
    addedProduct.id
  ]);
  
  console.log('🛒 Upsell Debug:', {
    addedProduct: addedProduct.name,
    addedCategory: addedProduct.category,
    cartCategories: Array.from(cartCategories),
    totalProducts: allProducts.length
  });
  
  // UPSELL LIMITING LOGIC: Only show upsells if cart has 3 or fewer items
  // This prevents infinite upselling
  if (cartItems.length >= 3) {
    console.log('🛒 Upsell: Cart has 3+ items, skipping upsell to prevent spam');
    return [];
  }
  
  // Define complementary category mapping with better base layer support
  const complementaryCategories: Record<string, string[]> = {
    'jackets': ['pants', 'accessories', 'footwear', 'shirts'],
    'jacket': ['pants', 'accessories', 'footwear', 'shirts'],
    'pants': ['jackets', 'footwear', 'accessories', 'shirts'],
    'pant': ['jackets', 'footwear', 'accessories', 'shirts'],
    'footwear': ['pants', 'jackets', 'accessories', 'shirts'],
    'shoes': ['pants', 'jackets', 'accessories', 'shirts'],
    'shoe': ['pants', 'jackets', 'accessories', 'shirts'],
    'shirts': ['jackets', 'pants', 'accessories', 'footwear'], // Base layers complement with outer layers
    'shirt': ['jackets', 'pants', 'accessories', 'footwear'],
    'accessories': ['jackets', 'pants', 'footwear', 'shirts'],
    // Handle specific base layer scenarios
    'base layers': ['jackets', 'pants', 'accessories'],
    'base layer': ['jackets', 'pants', 'accessories'],
    'underwear': ['jackets', 'pants', 'accessories'],
    'tops': ['pants', 'jackets', 'accessories'],
    'bottoms': ['jackets', 'shirts', 'accessories']
  };
  
  const addedCategory = addedProduct.category?.toLowerCase() || '';
  let suggestedCategories = complementaryCategories[addedCategory] || [];
  
  // CATEGORY LIMITING: Only suggest categories not already in cart
  suggestedCategories = suggestedCategories.filter(category => !cartCategories.has(category));
  
  if (suggestedCategories.length === 0) {
    console.log('🛒 Upsell: All complementary categories already in cart or no mapping found');
    return [];
  }
  
  // Find products in complementary categories that aren't already in cart
  let complementaryProducts = allProducts.filter(product => {
    const productCategory = (product.category || '').toLowerCase();
    return (
      suggestedCategories.includes(productCategory) &&
      !cartProductIds.has(product.id)
    );
  });
  
  console.log('🛒 Upsell: Found', complementaryProducts.length, 'complementary products before context filtering');
  
  // CONTEXT-AWARE FILTERING: Use conversation context to filter products
  if (conversationContext) {
    const contextLower = conversationContext.toLowerCase();
    console.log('🛒 Upsell: Using conversation context:', contextLower);
    
    // Analyze context for activity, season, and conditions
    const isSpring = contextLower.includes('spring');
    const isSummer = contextLower.includes('summer');
    const isWinter = contextLower.includes('winter');
    const isFall = contextLower.includes('fall') || contextLower.includes('autumn');
    
    const isRain = contextLower.includes('rain') || contextLower.includes('waterproof') || contextLower.includes('wet');
    const isHiking = contextLower.includes('hik') || contextLower.includes('trail');
    const isSkiing = contextLower.includes('ski') || contextLower.includes('snow');
    const isClimbing = contextLower.includes('climb') || contextLower.includes('alpine');
    const isUrban = contextLower.includes('city') || contextLower.includes('urban') || contextLower.includes('work');
    
    // Filter products based on context
    complementaryProducts = complementaryProducts.filter(product => {
      const name = product.name.toLowerCase();
      const desc = (product.description || '').toLowerCase();
      
      // Spring context - prioritize lightweight, versatile items
      if (isSpring) {
        // For spring rain jackets, suggest lightweight pants and breathable accessories
        if (isRain) {
          return (
            name.includes('gamma') || name.includes('beta') || name.includes('light') ||
            desc.includes('versatile') || desc.includes('breathable') || desc.includes('stretch') ||
            desc.includes('lightweight') || desc.includes('packable')
          );
        }
        // General spring - avoid heavy winter items
        return !(
          name.includes('down') || name.includes('insulated') || name.includes('toque') ||
          desc.includes('insulation') || desc.includes('warmth') || desc.includes('cold')
        );
      }
      
      // Summer context - prioritize breathable, lightweight items
      if (isSummer) {
        return (
          name.includes('light') || name.includes('short') || name.includes('gamma') ||
          desc.includes('light') || desc.includes('breathable') || desc.includes('summer') ||
          desc.includes('versatile') || desc.includes('active') || desc.includes('stretch')
        );
      }
      
      // Winter context - prioritize warm, insulated items
      if (isWinter || isSkiing) {
        return (
          name.includes('down') || name.includes('insulated') || name.includes('toque') ||
          name.includes('warm') || desc.includes('insulation') || desc.includes('warmth') ||
          desc.includes('cold') || desc.includes('thermal')
        );
      }
      
      // Rain context - prioritize waterproof items
      if (isRain) {
        return (
          name.includes('gtx') || name.includes('gore') || name.includes('waterproof') ||
          desc.includes('waterproof') || desc.includes('gore-tex') || desc.includes('weather')
        );
      }
      
      // Hiking context - prioritize durable, trail-appropriate items
      if (isHiking) {
        return (
          name.includes('gamma') || name.includes('konseal') || name.includes('trail') ||
          desc.includes('durable') || desc.includes('trail') || desc.includes('hiking') ||
          desc.includes('outdoor') || desc.includes('rugged')
        );
      }
      
      // Urban context - prioritize sleek, versatile items
      if (isUrban) {
        return (
          name.includes('veilance') || name.includes('gamma') || name.includes('atom') ||
          desc.includes('versatile') || desc.includes('urban') || desc.includes('minimal') ||
          desc.includes('sleek') || desc.includes('everyday')
        );
      }
      
      // Default: allow all products if no specific context
      return true;
    });
    
    console.log('🛒 Upsell: After context filtering:', complementaryProducts.length, 'products remain');
  }
  
  // If we have base layer/shirt, prioritize outer layers for summer (fallback logic)
  if (addedCategory === 'shirts' || addedCategory === 'shirt') {
    // For base layers, prioritize lightweight jackets and shorts/pants
    complementaryProducts = complementaryProducts.filter(product => {
      const name = product.name.toLowerCase();
      const desc = (product.description || '').toLowerCase();
      
      // Prioritize lightweight, summer-appropriate items
      return (
        name.includes('light') || name.includes('short') || name.includes('gamma') ||
        desc.includes('light') || desc.includes('breathable') || desc.includes('summer') ||
        desc.includes('versatile') || desc.includes('active')
      );
    });
    
    console.log('🛒 Upsell: Filtered for base layer complements:', complementaryProducts.length);
  }
  
  // GROUP BY CATEGORY and take only the BEST item from each category
  const productsByCategory: Record<string, Product[]> = {};
  
  complementaryProducts.forEach(product => {
    const category = (product.category || '').toLowerCase();
    if (!productsByCategory[category]) {
      productsByCategory[category] = [];
    }
    productsByCategory[category].push(product);
  });
  
  // Take the best product from each category (max 3 categories)
  const finalProducts: Product[] = [];
  const categoryKeys = Object.keys(productsByCategory).slice(0, 3); // Limit to 3 categories max
  
  categoryKeys.forEach(category => {
    const categoryProducts = productsByCategory[category];
    
    // Sort by rating and take the best one from this category
    const bestProduct = categoryProducts
      .filter(p => p.rating?.average) // Prefer rated products
      .sort((a, b) => {
        const ratingA = parseFloat(a.rating?.average || '0');
        const ratingB = parseFloat(b.rating?.average || '0');
        return ratingB - ratingA;
      })[0] || categoryProducts[0]; // Fallback to first if no rated products
    
    if (bestProduct) {
      finalProducts.push(bestProduct);
    }
  });
  
  console.log('🛒 Upsell: Final products (1 per category):', finalProducts.map(p => `${p.name} (${p.category})`));
  
  return finalProducts;
}

function buildUpsellPrompt(
  addedProduct: UpsellAgentOptions['addedProduct'],
  cartItems: UpsellAgentOptions['cartItems'],
  complementaryProducts: Product[],
  languageCode: string,
  conversationContext?: string
): string {
  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  const cartSummary = cartItems.length > 0 
    ? `Current cart items: ${cartItems.map(item => item.name).join(', ')}`
    : 'Cart was previously empty';

  const contextInfo = conversationContext 
    ? `\n- Original customer request: "${conversationContext}"`
    : '';

  const productList = complementaryProducts.map(p => 
    `- **${p.name}** - $${p.price} CAD - ${p.description}`
  ).join('\n');

  return `You are an expert Arc'teryx sales assistant providing personalized upsell recommendations.${languageInstruction}

CONTEXT:
- Customer just added: **${addedProduct.name}** ($${addedProduct.price} CAD)
- ${cartSummary}${contextInfo}

MISSION: Provide a brief, enthusiastic upsell message recommending complementary products that match the customer's specific needs and original request context.

TONE & STYLE:
- Warm, helpful, and excited about their purchase
- Focus on completing their outdoor setup
- Mention how products work together
- Keep it concise (2-3 sentences max)
- Use natural, conversational language

AVAILABLE COMPLEMENTARY PRODUCTS:
${productList}

INSTRUCTIONS:
1. Start with a brief congratulatory message about their purchase
2. Suggest 2-3 complementary products that work well together
3. Explain briefly why these products complement their purchase (layering system, activity needs, etc.)
4. Keep the tone positive and helpful, not pushy
5. For base layers, focus on completing the layering system with outer shells or versatile pieces

Example structures:
- For base layers: "Perfect base layer choice! To complete your layering system for summer activities, consider..."
- For jackets: "Great choice on the [jacket]! To complete your [activity] setup, I'd recommend..."
- For general items: "Excellent pick! Here are some great additions that work perfectly with your [product]..."

Generate your upsell message now:`;
}

export async function handleUpsellRequest(options: UpsellAgentOptions): Promise<UpsellAgentResponse> {
  const { addedProduct, cartItems, languageCode, genderPreference } = options;

  console.log('🛒 Upsell Agent: Generating recommendations for:', addedProduct.name);

  // Get complementary products
  const complementaryProducts = getComplementaryProducts(addedProduct, cartItems, genderPreference, options.conversationContext);
  
  if (complementaryProducts.length === 0) {
    console.log('🛒 Upsell Agent: No complementary products found');
    // Return empty stream if no products to recommend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });
    return { stream };
  }

  console.log('🛒 Upsell Agent: Found complementary products:', complementaryProducts.map(p => p.name));

  // Build the prompt
  const prompt = buildUpsellPrompt(addedProduct, cartItems, complementaryProducts, languageCode, options.conversationContext);

  // Create the stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 300,
        });

        let accumulatedContent = '';

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedContent += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }

        // Send products after the message is complete
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: complementaryProducts })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

      } catch (error) {
        console.error('🛒 Upsell Agent Error:', error);
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    },
  });

  return { stream, products: complementaryProducts };
}