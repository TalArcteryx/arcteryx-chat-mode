import { OpenAI } from 'openai';
import { loadFAQData, FAQ } from '../utils/dataLoader';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface FAQAgentOptions {
  messages: Array<{ role: string; content: string }>;
  languageCode: string;
}

interface ScoredFAQ extends FAQ {
  score: number;
  matchReasons: string[];
}

function findRelevantFAQs(query: string, conversationHistory: Array<{ role: string; content: string }> = [], limit: number = 3): ScoredFAQ[] {
  const faqData = loadFAQData();
  if (!faqData || !faqData.faqs) return [];
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Analyze conversation context for better FAQ matching
  const allConversationText = conversationHistory
    .map(m => m.content || '')
    .join(' ')
    .toLowerCase();
  
  // Enhanced scoring with semantic understanding
  const scoredFAQs = faqData.faqs.map(faq => {
    const questionLower = faq.question.toLowerCase();
    const answerLower = faq.answer.toLowerCase();
    const categoryLower = faq.category?.toLowerCase() || '';
    const combinedText = `${questionLower} ${answerLower} ${categoryLower}`;
    
    let score = 0;
    const matchReasons: string[] = [];
    
    // 1. Exact phrase matching (highest priority)
    if (questionLower.includes(queryLower) && queryLower.length > 5) {
      score += 10;
      matchReasons.push('exact question match');
    }
    
    // 2. Semantic intent matching
    const intentMatches = getIntentMatches(queryLower, questionLower, answerLower);
    score += intentMatches.score;
    matchReasons.push(...intentMatches.reasons);
    
    // 3. Keyword scoring with context awareness
    queryWords.forEach(word => {
      if (word.length < 3) return;
      
      // Question matches (high weight)
      if (questionLower.includes(word)) {
        score += 4;
        matchReasons.push(`question keyword: ${word}`);
      }
      
      // Answer matches (medium weight)
      if (answerLower.includes(word)) {
        score += 2;
        matchReasons.push(`answer keyword: ${word}`);
      }
      
      // Category matches (medium weight)
      if (categoryLower.includes(word)) {
        score += 3;
        matchReasons.push(`category match: ${word}`);
      }
    });
    
    // 4. Conversation context boost
    if (allConversationText.length > 0) {
      const contextWords = allConversationText.split(/\s+/).filter(w => w.length > 3);
      const contextMatches = contextWords.filter(word => combinedText.includes(word)).length;
      if (contextMatches > 0) {
        score += Math.min(contextMatches * 0.5, 3);
        matchReasons.push(`context relevance (${contextMatches} matches)`);
      }
    }
    
    // 5. Category-specific boosts
    const categoryBoost = getCategoryBoost(queryLower, faq.category);
    score += categoryBoost.score;
    if (categoryBoost.reason) matchReasons.push(categoryBoost.reason);
    
    return { ...faq, score, matchReasons };
  });
  
  // Sort by score and return top matches
  return scoredFAQs
    .filter(faq => faq.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getIntentMatches(query: string, question: string, answer: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  // Return/refund intent
  if ((query.includes('return') || query.includes('refund') || query.includes('exchange')) &&
      (question.includes('return') || question.includes('refund') || answer.includes('return'))) {
    score += 6;
    reasons.push('return/refund intent');
  }
  
  // Shipping/delivery intent
  if ((query.includes('ship') || query.includes('deliver') || query.includes('tracking')) &&
      (question.includes('ship') || question.includes('deliver') || answer.includes('shipping'))) {
    score += 6;
    reasons.push('shipping/delivery intent');
  }
  
  // Sizing/fit intent
  if ((query.includes('size') || query.includes('fit') || query.includes('too big') || query.includes('too small')) &&
      (question.includes('size') || question.includes('fit') || answer.includes('sizing'))) {
    score += 6;
    reasons.push('sizing/fit intent');
  }
  
  // Care/maintenance intent
  if ((query.includes('wash') || query.includes('clean') || query.includes('care') || query.includes('maintain')) &&
      (question.includes('care') || question.includes('wash') || answer.includes('cleaning'))) {
    score += 6;
    reasons.push('care/maintenance intent');
  }
  
  // Warranty intent
  if ((query.includes('warranty') || query.includes('guarantee') || query.includes('defect')) &&
      (question.includes('warranty') || answer.includes('warranty'))) {
    score += 6;
    reasons.push('warranty intent');
  }
  
  // Technical/material questions
  if ((query.includes('gore-tex') || query.includes('waterproof') || query.includes('breathable') || query.includes('material')) &&
      (question.includes('gore') || question.includes('material') || answer.includes('technical'))) {
    score += 5;
    reasons.push('technical/material intent');
  }
  
  return { score, reasons };
}

function getCategoryBoost(query: string, category?: string): { score: number; reason?: string } {
  if (!category) return { score: 0 };
  
  const categoryLower = category.toLowerCase();
  
  // Direct category mentions
  if (query.includes(categoryLower)) {
    return { score: 4, reason: `direct category match: ${category}` };
  }
  
  // Category-specific keyword boosts
  const categoryMappings: Record<string, string[]> = {
    'returns': ['return', 'refund', 'exchange', 'send back'],
    'shipping': ['ship', 'deliver', 'tracking', 'order', 'arrival'],
    'sizing': ['size', 'fit', 'measurements', 'too big', 'too small'],
    'care': ['wash', 'clean', 'maintain', 'care', 'dry'],
    'warranty': ['warranty', 'guarantee', 'defect', 'broken', 'repair'],
    'technical': ['gore-tex', 'waterproof', 'breathable', 'material', 'fabric']
  };
  
  for (const [cat, keywords] of Object.entries(categoryMappings)) {
    if (categoryLower.includes(cat) && keywords.some(kw => query.includes(kw))) {
      return { score: 3, reason: `category-keyword match: ${cat}` };
    }
  }
  
  return { score: 0 };
}

function analyzeFAQMatches(faqs: ScoredFAQ[], query: string): string {
  if (faqs.length === 0) {
    return 'No relevant FAQs found. Provide general guidance and suggest contacting customer service.';
  }
  
  const topScore = faqs[0].score;
  const avgScore = faqs.reduce((sum, faq) => sum + faq.score, 0) / faqs.length;
  
  if (topScore >= 10) {
    return `Excellent match found (score: ${topScore.toFixed(1)}). Use the top FAQ as primary source with high confidence.`;
  } else if (topScore >= 6) {
    return `Good matches found (top score: ${topScore.toFixed(1)}, avg: ${avgScore.toFixed(1)}). Synthesize information from relevant FAQs.`;
  } else if (topScore >= 3) {
    return `Moderate matches found (top score: ${topScore.toFixed(1)}). Use FAQ info as guidance but add context and clarification.`;
  } else {
    return `Weak matches found (top score: ${topScore.toFixed(1)}). Use with caution and provide additional general guidance.`;
  }
}

export async function handleFAQRequest(options: FAQAgentOptions): Promise<ReadableStream> {
  const { messages, languageCode } = options;
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastUserMessageText = lastUserMessage?.content || '';
  
  // Find relevant FAQs with conversation context
  const relevantFAQs = findRelevantFAQs(lastUserMessageText, messages, 3);
  
  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond to the user in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  // Analyze the quality and relevance of FAQ matches
  const faqAnalysis = analyzeFAQMatches(relevantFAQs, lastUserMessageText);
  
  const faqContext = relevantFAQs.length > 0
    ? `\n\n📚 RELEVANT FAQ INFORMATION (${relevantFAQs.length} matches found):\n${relevantFAQs.map((faq, idx) => {
        const matchInfo = faq.matchReasons.length > 0 ? ` [Match: ${faq.matchReasons.slice(0, 2).join(', ')}]` : '';
        return `\n${idx + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n   Category: ${faq.category} | Score: ${faq.score.toFixed(1)}${matchInfo}`;
      }).join('\n')}\n\n🎯 FAQ ANALYSIS: ${faqAnalysis}`
    : '\n\n❌ No relevant FAQs found in database. You should provide general guidance and suggest contacting customer service for specific questions.';

  const systemMessage: { role: 'system'; content: string } = {
    role: 'system',
    content: `You are an expert Arc'teryx customer service representative with deep knowledge of policies, procedures, and product information. Your mission is to provide accurate, helpful answers while building customer confidence.${languageInstruction}${faqContext}

🧠 INTELLIGENT FAQ ASSISTANCE:

1. ANSWER STRATEGY:
   ${relevantFAQs.length > 0 ? `
   ✅ High-quality FAQ matches found - use them as your primary source
   - Lead with the most relevant FAQ information
   - Explain the answer in context of their specific question
   - Add helpful details or clarifications when appropriate
   - If multiple FAQs are relevant, synthesize them into a comprehensive answer` : `
   ⚠️ No specific FAQ matches - provide general guidance
   - Use your knowledge of Arc'teryx policies and procedures
   - Be honest about limitations of your knowledge
   - Direct to customer service for specific cases`}

2. COMMUNICATION EXCELLENCE:
   - Start by acknowledging their specific question
   - Provide clear, actionable information
   - Use a helpful, professional tone that builds trust
   - Break down complex policies into easy-to-understand steps
   - Anticipate follow-up questions and address them proactively

3. RESPONSE STRUCTURE:
   - Direct answer to their question first
   - Supporting details and context
   - Any important caveats or exceptions
   - Next steps or additional resources if helpful
   - Offer to help with related questions

4. QUALITY INDICATORS:
   - Reference specific policies when applicable
   - Provide timeframes, costs, or other concrete details
   - Mention any requirements or conditions
   - Suggest alternatives when the primary option isn't ideal

🎯 SPECIAL SITUATIONS:
- Returns/Exchanges: Mention warranty, condition requirements, timeframes
- Shipping: Include delivery estimates, tracking info, international considerations  
- Sizing: Reference size guides, fit recommendations, exchange options
- Care: Provide specific care instructions, warranty implications
- Technical: Explain features clearly, mention performance benefits

Remember: You're not just answering questions - you're helping customers have confidence in their Arc'teryx experience.`
  };

  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 300,
    temperature: 0.5,
    stream: true,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return stream;
}

