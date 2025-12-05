import { OpenAI } from 'openai';
import { loadFAQData, FAQ } from '../utils/dataLoader';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface FAQAgentOptions {
  messages: Array<{ role: string; content: string }>;
  languageCode: string;
}

function findRelevantFAQs(query: string, limit: number = 3): FAQ[] {
  const faqData = loadFAQData();
  if (!faqData || !faqData.faqs) return [];
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Score FAQs based on keyword matches
  const scoredFAQs = faqData.faqs.map(faq => {
    const questionLower = faq.question.toLowerCase();
    const answerLower = faq.answer.toLowerCase();
    const combinedText = `${questionLower} ${answerLower}`;
    
    let score = 0;
    queryWords.forEach(word => {
      if (questionLower.includes(word)) score += 3; // Higher weight for question matches
      if (answerLower.includes(word)) score += 1; // Lower weight for answer matches
    });
    
    // Check for exact phrase matches
    if (questionLower.includes(queryLower)) score += 5;
    if (combinedText.includes(queryLower)) score += 2;
    
    return { ...faq, score };
  });
  
  // Sort by score and return top matches
  return scoredFAQs
    .filter(faq => faq.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function handleFAQRequest(options: FAQAgentOptions): Promise<ReadableStream> {
  const { messages, languageCode } = options;
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const lastUserMessageText = lastUserMessage?.content || '';
  
  // Find relevant FAQs
  const relevantFAQs = findRelevantFAQs(lastUserMessageText, 3);
  
  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond to the user in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  const faqContext = relevantFAQs.length > 0
    ? `\n\n📚 RELEVANT FAQ INFORMATION:\n${relevantFAQs.map((faq, idx) => `\n${idx + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n   Category: ${faq.category}`).join('\n')}\n\nUse this FAQ information to provide accurate answers to customer questions. If the FAQ information directly answers the user's question, prioritize using that information in your response.`
    : '';

  const systemMessage: { role: 'system'; content: string } = {
    role: 'system',
    content: `You are a helpful Arcteryx customer service representative specializing in answering frequently asked questions.${languageInstruction}${faqContext}

Your role is to:
- Answer questions about Arcteryx products, policies, shipping, returns, warranty, sizing, care instructions, and general information
- Use the FAQ information provided above when available
- Be accurate, helpful, and friendly
- If you don't know the answer, direct customers to Arcteryx customer service
- Provide clear, concise answers

COMMUNICATION STYLE:
- Be friendly, professional, and helpful
- Use the FAQ information provided when it directly answers the question
- If multiple FAQs are relevant, reference them appropriately
- Be concise but thorough
- If the FAQ doesn't fully answer the question, provide additional helpful context`
  };

  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 800,
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

