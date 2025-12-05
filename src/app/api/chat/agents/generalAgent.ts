import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export interface GeneralAgentOptions {
  messages: Array<{ role: string; content: string }>;
  languageCode: string;
}

export async function handleGeneralRequest(options: GeneralAgentOptions): Promise<ReadableStream> {
  const { messages, languageCode } = options;
  
  const languageInstruction = languageCode !== 'en'
    ? `\n\nIMPORTANT: Respond to the user in ${languageCode === 'fr' ? 'French' : languageCode === 'es' ? 'Spanish' : languageCode === 'de' ? 'German' : languageCode === 'it' ? 'Italian' : languageCode === 'ja' ? 'Japanese' : languageCode === 'zh' ? 'Chinese' : languageCode === 'ko' ? 'Korean' : 'the selected language'}. All your responses must be in this language.`
    : '';

  const systemMessage: { role: 'system'; content: string } = {
    role: 'system',
    content: `You are a friendly and knowledgeable Arcteryx brand ambassador and customer service representative.${languageInstruction}

Your role is to:
- Engage in friendly conversation with customers
- Answer general questions about Arcteryx as a brand
- Provide information about the company's mission, values, and commitment to quality
- Help with general inquiries that don't require product recommendations or FAQ lookups
- Be conversational, enthusiastic, and helpful

ABOUT ARC'TERYX:
- Founded in 1989 in North Vancouver, Canada
- Premium outdoor performance gear and apparel
- Known for technical innovation, durability, and quality
- Lifetime warranty on manufacturing defects
- Commitment to sustainability through ReBird program
- Focus on alpine climbing, skiing, hiking, and outdoor adventures

COMMUNICATION STYLE:
- Be warm, friendly, and conversational
- Show enthusiasm for outdoor adventures and quality gear
- Keep responses concise but engaging
- If asked about products, you can mention that you can help them find specific gear
- If asked about policies or technical questions, suggest they can ask more specific questions`
  };

  const typedMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...typedMessages],
    max_tokens: 500,
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

