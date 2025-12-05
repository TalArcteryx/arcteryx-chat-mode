import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export type Intent = 'product' | 'faq' | 'general';

export interface RouterResult {
  intent: Intent;
  confidence: number;
}

export async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<RouterResult> {
  // Simple keyword-based classification first (fast and cheap)
  const messageLower = userMessage.toLowerCase();
  
  // FAQ indicators
  const faqKeywords = [
    'how', 'what is', 'what are', 'why', 'when', 'where',
    'return', 'refund', 'warranty', 'shipping', 'delivery',
    'size', 'sizing', 'fit', 'care', 'wash', 'repair',
    'policy', 'policies', 'question', 'help', 'support'
  ];
  
  // Product indicators
  const productKeywords = [
    'show', 'find', 'recommend', 'best', 'looking for',
    'need', 'want', 'buy', 'purchase', 'jacket', 'pant',
    'shoe', 'boot', 'gear', 'product', 'item'
  ];
  
  const hasFAQKeywords = faqKeywords.some(keyword => messageLower.includes(keyword));
  const hasProductKeywords = productKeywords.some(keyword => messageLower.includes(keyword));
  
  // If clear FAQ intent
  if (hasFAQKeywords && !hasProductKeywords) {
    return { intent: 'faq', confidence: 0.9 };
  }
  
  // If clear product intent
  if (hasProductKeywords && !hasFAQKeywords) {
    return { intent: 'product', confidence: 0.9 };
  }
  
  // If both or unclear, use AI classification
  try {
    const typedHistory = conversationHistory.slice(-3).map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier for an Arcteryx e-commerce chat system. Classify the user's message into one of these categories:
- "product": User wants to browse, search, or get recommendations for products (jackets, pants, shoes, gear, etc.)
- "faq": User is asking a question about policies, shipping, returns, warranty, sizing, care instructions, or general information
- "general": General conversation, greetings, or other non-specific queries

Respond with ONLY the category name: "product", "faq", or "general"`
        },
        ...typedHistory,
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });
    
    const intent = completion.choices[0]?.message?.content?.toLowerCase().trim() as Intent;
    
    if (intent === 'product' || intent === 'faq' || intent === 'general') {
      return { intent, confidence: 0.85 };
    }
    
    // Default fallback
    return { intent: hasProductKeywords ? 'product' : 'general', confidence: 0.7 };
  } catch (error) {
    console.error('Error classifying intent:', error);
    // Fallback to keyword-based
    return { 
      intent: hasProductKeywords ? 'product' : (hasFAQKeywords ? 'faq' : 'general'), 
      confidence: 0.6 
    };
  }
}

