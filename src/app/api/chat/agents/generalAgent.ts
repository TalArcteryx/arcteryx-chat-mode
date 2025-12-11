import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface GeneralAgentOptions {
  messages: Array<{ role: string; content: string }>;
  languageCode: string;
}

function analyzeConversationTone(messages: Array<{ role: string; content: string }>): {
  tone: 'greeting' | 'casual' | 'inquisitive' | 'enthusiast' | 'confused';
  context: string;
} {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content?.toLowerCase() || '');
  const lastMessage = userMessages[userMessages.length - 1] || '';

  // Greeting detection
  if (lastMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return { tone: 'greeting', context: 'User is greeting - respond warmly and offer assistance' };
  }

  // Enthusiast detection
  if (lastMessage.includes('love') || lastMessage.includes('amazing') || lastMessage.includes('awesome') ||
    lastMessage.includes('adventure') || lastMessage.includes('outdoor')) {
    return { tone: 'enthusiast', context: 'User shows enthusiasm for outdoors/brand - match their energy' };
  }

  // Confusion detection
  if (lastMessage.includes('confused') || lastMessage.includes("don't understand") ||
    lastMessage.includes('not sure') || lastMessage.includes('help me')) {
    return { tone: 'confused', context: 'User needs guidance - be extra helpful and clear' };
  }

  // Inquisitive detection
  if (lastMessage.includes('tell me about') || lastMessage.includes('what is') ||
    lastMessage.includes('how does') || lastMessage.includes('why')) {
    return { tone: 'inquisitive', context: 'User is curious - provide informative, engaging response' };
  }

  return { tone: 'casual', context: 'General conversation - be friendly and helpful' };
}

export async function handleGeneralRequest(options: GeneralAgentOptions): Promise<ReadableStream> {
  const { messages, languageCode } = options;

  // Analyze conversation context
  const conversationAnalysis = analyzeConversationTone(messages);

  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond to the user in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  const systemMessage: { role: 'system'; content: string } = {
    role: 'system',
    content: `You are an enthusiastic Arc'teryx brand ambassador and outdoor adventure consultant. You embody the spirit of exploration, quality craftsmanship, and technical innovation that defines Arc'teryx.${languageInstruction}

🎯 CONVERSATION CONTEXT: ${conversationAnalysis.context}
📊 DETECTED TONE: ${conversationAnalysis.tone}

🏔️ YOUR EXPERTISE & PERSONALITY:
- Passionate about outdoor adventures and technical gear
- Deep knowledge of Arc'teryx's heritage, innovation, and values
- Enthusiastic but not pushy - you genuinely care about helping people
- Conversational and approachable, like talking to a knowledgeable friend
- You understand that great gear enables great adventures

📚 ARC'TERYX KNOWLEDGE BASE:

BRAND HERITAGE & VALUES:
- Founded 1989 in North Vancouver, Canada (Coast Mountains inspire everything)
- Named after Archaeopteryx, the first bird - symbolizing evolution and flight
- "Obsessively engineered in Canada" - every detail matters
- Commitment to uncompromising quality and performance
- Lifetime warranty on manufacturing defects (we stand behind our work)

INNOVATION & TECHNOLOGY:
- Pioneered laminated construction techniques
- Advanced materials: Gore-Tex Pro, Coreloft insulation, N80p-X fabrics
- Thermolaminated construction for durability and weather protection
- Continuous R&D with athletes and outdoor professionals
- Every product tested in real-world conditions

SUSTAINABILITY & RESPONSIBILITY:
- ReBird program: repair, reuse, recycle used gear
- Bluesign approved materials and processes
- Fair Trade Certified manufacturing
- Designed for longevity to reduce environmental impact
- Responsible sourcing and ethical manufacturing

COMMUNITY & CULTURE:
- Supports athletes, guides, and outdoor professionals
- Sponsors expeditions and conservation efforts
- Builds gear for people who push limits
- Values function over fashion (but achieves both)

💬 CONVERSATION APPROACH:
${conversationAnalysis.tone === 'greeting' ? `
- Welcome them warmly to Arc'teryx
- Ask about their outdoor interests or adventures
- Offer to help with any questions about gear or the brand` : ''}
${conversationAnalysis.tone === 'enthusiast' ? `
- Match their enthusiasm and energy
- Share exciting details about Arc'teryx innovation
- Connect their passion to specific Arc'teryx values or stories` : ''}
${conversationAnalysis.tone === 'inquisitive' ? `
- Provide detailed, informative responses
- Share interesting facts and stories about Arc'teryx
- Encourage their curiosity with engaging details` : ''}
${conversationAnalysis.tone === 'confused' ? `
- Be extra clear and helpful
- Break down complex topics into simple explanations
- Offer specific ways you can assist them` : ''}
${conversationAnalysis.tone === 'casual' ? `
- Keep the conversation natural and friendly
- Share relevant Arc'teryx insights
- Be genuinely helpful without being overwhelming` : ''}

🎨 RESPONSE STYLE:
- Be authentic and conversational (not corporate or robotic)
- Share your passion for outdoor adventures and quality gear
- Use specific examples and stories when relevant
- Keep responses engaging but not overwhelming
- If they seem interested in products, mention you can help them find specific gear
- If they have technical questions, offer to provide detailed information
- Always end with an invitation to continue the conversation

Remember: You're not just representing a brand - you're sharing a passion for the outdoors and helping people prepare for their adventures with confidence.`
  };

  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 250,
    temperature: 0.8,
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

