import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export type Intent = 'product' | 'faq' | 'general';

export interface RouterResult {
  intent: Intent;
  confidence: number;
  reasoning?: string;
}

interface ConversationContext {
  hasProductDiscussion: boolean;
  hasQuestionPattern: boolean;
  recentTopics: string[];
  userIntentSignals: string[];
}

function analyzeConversationContext(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): ConversationContext {
  const messageLower = userMessage.toLowerCase();
  const recentMessages = conversationHistory.slice(-4).map(m => m.content?.toLowerCase() || '');

  // Analyze conversation for product-related discussion
  const productTerms = [
    'jacket', 'jackets', 'shell', 'coat', 'pant', 'pants', 'shoe', 'shoes', 'boot', 'boots',
    'gear', 'equipment', 'clothing', 'apparel', 'backpack', 'pack', 'glove', 'gloves',
    'hat', 'toque', 'beanie', 'layer', 'layering', 'insulation', 'waterproof', 'breathable',
    'gore-tex', 'arcteryx', 'outdoor', 'hiking', 'climbing', 'skiing', 'snowboard'
  ];

  const hasProductDiscussion = recentMessages.some(msg =>
    productTerms.some(term => msg.includes(term))
  );

  // Detect question patterns
  const questionPatterns = [
    /^(what|how|when|where|why|which|can|could|would|should|do|does|is|are)/,
    /\?$/,
    /tell me about/,
    /explain/,
    /help me understand/
  ];

  const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(messageLower));

  // Extract recent topics
  const recentTopics = recentMessages.flatMap(msg => {
    const words = msg.split(/\s+/).filter(w => w.length > 3);
    return words.slice(0, 3);
  });

  // Identify user intent signals
  const intentSignals = [];
  if (messageLower.includes('looking for') || messageLower.includes('need') || messageLower.includes('want')) {
    intentSignals.push('seeking');
  }
  if (messageLower.includes('recommend') || messageLower.includes('suggest') || messageLower.includes('best')) {
    intentSignals.push('recommendation');
  }
  if (messageLower.includes('show') || messageLower.includes('see') || messageLower.includes('browse')) {
    intentSignals.push('browsing');
  }
  if (hasQuestionPattern) {
    intentSignals.push('questioning');
  }

  return {
    hasProductDiscussion,
    hasQuestionPattern,
    recentTopics,
    userIntentSignals: intentSignals
  };
}

function performAdvancedKeywordAnalysis(userMessage: string, context: ConversationContext): RouterResult | null {
  const messageLower = userMessage.toLowerCase();

  // Enhanced FAQ patterns with context awareness
  const faqPatterns = {
    policy: ['return', 'refund', 'exchange', 'warranty', 'guarantee', 'policy', 'policies'],
    shipping: ['shipping', 'delivery', 'ship', 'deliver', 'tracking', 'order status'],
    sizing: ['size', 'sizing', 'fit', 'fits', 'too big', 'too small', 'measurements'],
    care: ['wash', 'washing', 'clean', 'cleaning', 'care', 'maintain', 'maintenance', 'repair'],
    support: ['help', 'support', 'customer service', 'contact', 'phone', 'email'],
    technical: ['waterproof', 'breathable', 'gore-tex', 'material', 'fabric', 'technology']
  };

  // Enhanced product patterns with natural language variations
  const productPatterns = {
    seeking: ['looking for', 'need', 'want', 'searching for', 'in the market for'],
    recommendation: ['recommend', 'suggest', 'best', 'top', 'good', 'better', 'which'],
    browsing: ['show', 'see', 'browse', 'check out', 'look at', 'view'],
    comparison: ['compare', 'difference', 'versus', 'vs', 'better than', 'similar to'],
    specific: ['jacket', 'pant', 'shoe', 'boot', 'gear', 'equipment', 'clothing']
  };

  // Calculate pattern scores first
  let faqScore = 0;
  let productScore = 0;

  // FAQ scoring
  Object.entries(faqPatterns).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw => messageLower.includes(kw)).length;
    faqScore += matches * (category === 'policy' || category === 'support' ? 2 : 1);
  });

  // Product scoring with context boost
  Object.entries(productPatterns).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw => messageLower.includes(kw)).length;
    let multiplier = 1;
    if (category === 'seeking' || category === 'recommendation') multiplier = 2;
    if (context.hasProductDiscussion) multiplier *= 1.5;
    productScore += matches * multiplier;
  });

  // Question pattern analysis
  if (context.hasQuestionPattern) {
    if (productScore > 0) {
      productScore += 1; // "What jacket do you recommend?"
    } else {
      faqScore += 2; // "How do I return an item?"
    }
  }

  // Intent signal boost
  if (context.userIntentSignals.includes('seeking') || context.userIntentSignals.includes('recommendation')) {
    productScore += 2;
  }
  if (context.userIntentSignals.includes('questioning') && faqScore > 0) {
    faqScore += 1;
  }

  // "What about..." queries are almost always product recommendations in context
  if (messageLower.startsWith('what about') || messageLower.includes('what about')) {
    console.log(`🎯 Router: "What about..." query detected - boosting product intent`);
    productScore += 5; // Strong boost for "what about" queries
    
    // If it mentions product categories, it's definitely a product request
    const productCategories = ['jacket', 'pant', 'shoe', 'boot', 'layer', 'mid', 'shell', 'vest', 'gear', 'clothing'];
    if (productCategories.some(cat => messageLower.includes(cat))) {
      return { intent: 'product', confidence: 0.95, reasoning: '"What about..." product category query' };
    }
  }

  // Gender-specific queries (both initial and follow-up)
  const genderResponses = ['men', 'mens', "men's", 'women', 'womens', "women's", 'male', 'female', 'guy', 'lady'];
  const hasGenderTerm = genderResponses.some(g => messageLower.includes(g));
  
  // If message contains gender AND product terms, it's definitely a product request
  if (hasGenderTerm && productScore > 0) {
    return { intent: 'product', confidence: 0.95, reasoning: 'Gender-specific product request' };
  }
  
  // If it's a short gender response in product context (follow-up)
  if (context.hasProductDiscussion && hasGenderTerm && userMessage.length < 50) {
    return { intent: 'product', confidence: 0.95, reasoning: 'Gender specification in product context' };
  }

  // Decision logic with confidence scoring
  const totalScore = faqScore + productScore;
  if (totalScore === 0) return null;

  if (productScore > faqScore * 1.5) {
    const confidence = Math.min(0.95, 0.7 + (productScore / (totalScore + 2)) * 0.25);
    return { intent: 'product', confidence, reasoning: `Product signals (${productScore}) > FAQ signals (${faqScore})` };
  }

  if (faqScore > productScore * 1.2) {
    const confidence = Math.min(0.95, 0.7 + (faqScore / (totalScore + 2)) * 0.25);
    return { intent: 'faq', confidence, reasoning: `FAQ signals (${faqScore}) > Product signals (${productScore})` };
  }

  return null; // Ambiguous, needs AI classification
}

export async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<RouterResult> {
  // Analyze conversation context
  const context = analyzeConversationContext(userMessage, conversationHistory);

  // Try advanced keyword analysis first
  const keywordResult = performAdvancedKeywordAnalysis(userMessage, context);
  if (keywordResult && keywordResult.confidence > 0.8) {
    console.log(`🎯 Router: Keyword classification - ${keywordResult.intent} (${keywordResult.confidence.toFixed(2)}) - ${keywordResult.reasoning}`);
    return keywordResult;
  }

  // Use AI classification for ambiguous cases
  try {
    const typedHistory = conversationHistory.slice(-4).map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const contextInfo = `
Context Analysis:
- Recent product discussion: ${context.hasProductDiscussion ? 'Yes' : 'No'}
- Question pattern detected: ${context.hasQuestionPattern ? 'Yes' : 'No'}
- User intent signals: ${context.userIntentSignals.join(', ') || 'None'}
- Recent topics: ${context.recentTopics.slice(0, 5).join(', ') || 'None'}
${keywordResult ? `- Keyword analysis: ${keywordResult.intent} (confidence: ${keywordResult.confidence.toFixed(2)})` : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `You are an advanced intent classifier for an Arc'teryx e-commerce chat system. Your job is to understand user intent in natural conversation.

INTENT CATEGORIES:
• "product" - User wants to browse, find, compare, or get recommendations for Arc'teryx products (jackets, pants, shoes, gear, etc.). This includes:
  - Direct product requests ("show me jackets")
  - Recommendation seeking ("what's the best jacket for skiing?")
  - Product comparisons ("difference between Alpha and Beta")
  - Gender specifications in product context ("men's jackets", "women's")
  - Activity-based requests ("gear for hiking")

• "faq" - User is asking questions about policies, processes, or general information:
  - Returns, exchanges, warranty policies
  - Shipping, delivery, order status
  - Sizing, fit, care instructions
  - Technical product questions (materials, technologies)
  - Support and contact information

• "general" - Everything else:
  - Greetings and casual conversation
  - Brand questions and company information
  - General outdoor advice not specific to products
  - Unclear or off-topic messages

ANALYSIS APPROACH:
1. Consider the conversation context and flow
2. Look for natural language patterns, not just keywords
3. Understand implied intent (e.g., "for skiing" often implies product search)
4. Consider follow-up responses in ongoing conversations

${contextInfo}

Respond with ONLY the category name: "product", "faq", or "general"`
        },
        ...typedHistory,
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 15,
      temperature: 0.2,
    });

    const intent = completion.choices[0]?.message?.content?.toLowerCase().trim() as Intent;

    if (intent === 'product' || intent === 'faq' || intent === 'general') {
      const confidence = keywordResult ? Math.max(0.75, keywordResult.confidence * 0.9) : 0.85;
      console.log(`🤖 Router: AI classification - ${intent} (${confidence.toFixed(2)}) with context`);
      return { intent, confidence, reasoning: 'AI classification with context analysis' };
    }

    // Fallback to keyword result or default
    if (keywordResult) {
      console.log(`🔄 Router: Fallback to keyword result - ${keywordResult.intent}`);
      return keywordResult;
    }

    return { intent: 'general', confidence: 0.7, reasoning: 'Default fallback' };
  } catch (error) {
    console.error('Error classifying intent:', error);

    // Fallback to keyword result or simple logic
    if (keywordResult) {
      return keywordResult;
    }

    // Simple fallback
    const messageLower = userMessage.toLowerCase();
    const hasProductTerms = ['jacket', 'pant', 'shoe', 'gear', 'recommend', 'best', 'show', 'need'].some(term => messageLower.includes(term));
    const hasFAQTerms = ['return', 'shipping', 'size', 'how', 'what', 'policy'].some(term => messageLower.includes(term));

    return {
      intent: hasProductTerms ? 'product' : (hasFAQTerms ? 'faq' : 'general'),
      confidence: 0.6,
      reasoning: 'Error fallback classification'
    };
  }
}

